import { dbPool } from '../../api/src/config/db.js';
import { fetchSheetValues } from './sheets-client.js';
import { parseColumnMapping, parseDealsRows, parseRepSummaryRows, ColumnMapping, ParsedRepSummaryRow } from './parser.js';
import { validateDeals, validateRepSummaries } from './validator.js';
import { loadConfig } from '@laos/config';

export function parseHebrewMonthTab(tabName: string): string | null {
  const monthMap: Record<string, string> = {
    'ינואר': '01', 'פברואר': '02', 'פבואר': '02', 'מרץ': '03', 'אפריל': '04',
    'מאי': '05', 'יוני': '06', 'יולי': '07', 'אוגוסט': '08',
    'ספטמבר': '09', 'אוקטובר': '10', 'נובמבר': '11', 'דצמבר': '12',
    'אוק': '10'
  };

  let monthNum = null;
  let year = '2026';

  for (const [key, val] of Object.entries(monthMap)) {
    if (tabName.includes(key)) {
      monthNum = val;
      // Extract digits for year, if any
      const yearPart = tabName.replace(key, '').trim().replace(/\D/g, '');
      if (yearPart) {
        year = yearPart.length === 2 ? `20${yearPart}` : yearPart;
      }
      break;
    }
  }

  if (!monthNum) return null;
  return `${year}-${monthNum}-01`;
}

export class SyncService {
  /**
   * Triggers a full sync for a specific sheet tab (e.g. "פברואר 2026").
   */
  async triggerSync(tabName: string, mappingOverride?: ColumnMapping) {
    console.log(`[SyncService] triggerSync called for tab: "${tabName}"`);

    // 1. Get Column Mapping (priority: passed override > DB settings > env)
    let mapping = mappingOverride;
    if (!mapping) {
      const [rows]: any = await dbPool.query("SELECT setting_value FROM system_settings WHERE setting_key = 'sheets_mapping'");
      if (rows && rows.length > 0) {
        mapping = JSON.parse(rows[0].setting_value);
        console.log('[SyncService] Mapping loaded from DB');
      } else {
        const config = loadConfig();
        mapping = parseColumnMapping(config.sheets);
        console.log('[SyncService] Mapping loaded from Env');
      }
    }

    if (!mapping) {
      throw new Error('No column mapping available for sync');
    }

    // 2. Clear old data for this tab
    await dbPool.query('DELETE FROM rep_monthly_summary WHERE sheet_tab_name = ?', [tabName]);
    await dbPool.query('DELETE FROM deals WHERE sheet_tab_name = ?', [tabName]);
    await dbPool.query('DELETE FROM data_errors WHERE sheet_tab_name = ?', [tabName]);

    // 3. Fetch data from Google Sheets (Full range A:Z to support absolute mapping)
    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);

    // 4. Parse & Validate
    const parsedDeals = parseDealsRows(tabName, allValues, mapping.deals);
    const parsedSummaries = parseRepSummaryRows(tabName, allValues, mapping.summary);

    console.log(`[SyncService] Parsed ${parsedDeals.length} deals and ${parsedSummaries.length} summaries`);

    const sheetMonth = parseHebrewMonthTab(tabName);

    const validatedDeals = validateDeals(sheetMonth, parsedDeals);
    const validatedSummaries = validateRepSummaries(sheetMonth, parsedSummaries);

    console.log(`[SyncService] Validated ${validatedDeals.valid.length} deals, ${validatedSummaries.valid.length} summaries`);
    if (validatedSummaries.errors.length > 0) {
      console.log(`[SyncService] Validation errors:`, JSON.stringify(validatedSummaries.errors, null, 2));
    }

    // 5. Save Errors
    const allErrors = [...validatedDeals.errors, ...validatedSummaries.errors];
    if (allErrors.length > 0) {
      const errorValues = allErrors.map(e => [
        e.source,
        e.sheetMonth,
        e.sheetTabName,
        e.sheetRowNumber,
        e.errorCode,
        e.errorMessage,
        JSON.stringify(e.rawPayload)
      ]);
      await dbPool.query(
        'INSERT INTO data_errors (source, sheet_month, sheet_tab_name, sheet_row_number, error_code, error_message, raw_payload) VALUES ?',
        [errorValues]
      );
    }

    // 6. Aggregate Deal KPIs by Rep (Large Table)
    const repSalesTotals = new Map<string, number>();
    const repCollectionTotals = new Map<string, number>();
    const repDealsCount = new Map<string, number>();

    const targetMonthPrefix = sheetMonth.substring(0, 7); // e.g., "2026-02"

    for (const d of validatedDeals.valid) {
      const name = d.row.repName.trim().toLowerCase();

      // Date Parsing for filtering Sales and Count
      let dealDateStr = '';
      if (d.row.dealDate) {
        const rawDate = String(d.row.dealDate).trim();
        if (/^\d{5}(\.\d+)?$/.test(rawDate)) {
          const serial = parseFloat(rawDate);
          const date = new Date((serial - 25569) * 86400 * 1000);
          dealDateStr = date.toISOString().split('T')[0];
        } else if (/^\d{1,2}[./]\d{1,2}/.test(rawDate)) {
          const parts = rawDate.split(/[./]/);
          let day = parts[0].padStart(2, '0');
          let month = parts[1].padStart(2, '0');
          let year = parts[2] ? (parts[2].length === 2 ? '20' + parts[2] : parts[2]) : '2026';
          dealDateStr = `${year}-${month}-${day}`;
        } else if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
          dealDateStr = rawDate.split(' ')[0];
        }
      }

      // 6a. Sales & Count: Filtered by Current Month
      if (dealDateStr && dealDateStr.startsWith(targetMonthPrefix)) {
        const salesAmount = Number(d.dealAmount) || 0;
        repSalesTotals.set(name, (repSalesTotals.get(name) || 0) + salesAmount);
        repDealsCount.set(name, (repDealsCount.get(name) || 0) + 1);
      }

      // 6b. Collection & Bonus Base: Rolling (All rows in tab)
      // Source is Column I (mapped as bonusRequested)
      const collectionAmount = Number(d.bonusRequested) || 0;
      repCollectionTotals.set(name, (repCollectionTotals.get(name) || 0) + collectionAmount);
    }

    // 7. Deduplicate & Save Valid Rep Summaries
    const uniqueSummaries = new Map<string, any>();

    for (const v of validatedSummaries.valid) {
      const repKey = v.row.repName.trim().toLowerCase();

      const [userRow]: any = await dbPool.query(
        'SELECT id, department_id FROM users WHERE (LOWER(sheet_name) = LOWER(?) OR LOWER(full_name) = LOWER(?)) LIMIT 1',
        [v.row.repName, v.row.repName]
      );
      if (!userRow || userRow.length === 0) continue;

      const user = userRow[0];

      // Values aggregated from Deals table
      const finalSales = repSalesTotals.get(repKey) || 0;
      const finalCollection = repCollectionTotals.get(repKey) || 0;
      const finalDealsCount = repDealsCount.get(repKey) || 0;

      // Offset comes ONLY from summary table. 
      // Keep existing offset if it's larger (prevents overwriting with 0 from redundant rows)
      const currentEntry = uniqueSummaries.get(repKey);
      const existingOffset = currentEntry ? currentEntry[9] : 0;
      const finalOffset = Math.max(existingOffset, Number(v.offsetAmount) || 0);

      uniqueSummaries.set(repKey, [
        user.id,
        user.department_id,
        sheetMonth,
        finalSales,
        finalCollection,
        finalDealsCount,
        v.targetAmount ?? 0,
        v.averageDealSize ?? 0,
        finalCollection,    // Bonus Base Raw (Collection before offset)
        finalOffset,
        tabName
      ]);
    }

    const summaryValuesToInsert = Array.from(uniqueSummaries.values());
    if (summaryValuesToInsert.length > 0) {
      await dbPool.query(
        'INSERT INTO rep_monthly_summary (rep_id, department_id, sheet_month, total_sales_amount, total_collection_amount, number_of_deals, target_amount, average_deal_size, bonus_base_raw, offset_amount, sheet_tab_name) VALUES ? ON DUPLICATE KEY UPDATE total_sales_amount=VALUES(total_sales_amount), total_collection_amount=VALUES(total_collection_amount), number_of_deals=VALUES(number_of_deals), target_amount=VALUES(target_amount), average_deal_size=VALUES(average_deal_size), bonus_base_raw=VALUES(bonus_base_raw), offset_amount=VALUES(offset_amount)',
        [summaryValuesToInsert]
      );
    }

    // 8. Save Valid Deals
    const dealValuesToInsert: any[][] = [];
    for (const v of validatedDeals.valid) {
      const [userRow]: any = await dbPool.query(
        'SELECT id, department_id FROM users WHERE (LOWER(sheet_name) = LOWER(?) OR LOWER(full_name) = LOWER(?)) LIMIT 1',
        [v.row.repName, v.row.repName]
      );

      if (!userRow || userRow.length === 0) continue;

      const user = userRow[0];

      let finalDealDate: string | null = null;
      if (v.row.dealDate) {
        const rawDate = String(v.row.dealDate).trim();
        // Handle Excel serial number
        if (/^\d{5}(\.\d+)?$/.test(rawDate)) {
          const serial = parseFloat(rawDate);
          const date = new Date((serial - 25569) * 86400 * 1000);
          finalDealDate = date.toISOString().split('T')[0];
        }
        // Handle DD/MM/YY or DD/MM/YYYY or DD.MM.YY
        else if (/^\d{1,2}[./]\d{1,2}/.test(rawDate)) {
          const parts = rawDate.split(/[./]/);
          let day = parts[0].padStart(2, '0');
          let month = parts[1].padStart(2, '0');
          // Important: Default to 2026 for YY formats in this context
          let year = parts[2] ? (parts[2].length === 2 ? '20' + parts[2] : parts[2]) : '2026';
          finalDealDate = `${year}-${month}-${day}`;
        }
        else if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
          finalDealDate = rawDate.split(' ')[0];
        } else {
          finalDealDate = sheetMonth;
        }
      } else {
        finalDealDate = sheetMonth;
      }

      if (v.row.rowNumber < 10 && v.row.customerName) {
        // console.log(`[SyncService] Row ${v.row.rowNumber}: isRenewal=${v.isRenewal}`);
      }

      dealValuesToInsert.push([
        v.row.dealId || null,
        v.row.legacyKey || null,
        v.row.customerName || null,
        user.id,
        user.department_id,
        sheetMonth,
        finalDealDate,
        v.dealAmount,
        v.bonusRequested,
        v.isRenewal ? 1 : 0,
        tabName,
        v.row.rowNumber
      ]);
    }

    if (dealValuesToInsert.length > 0) {
      await dbPool.query(
        'INSERT INTO deals (deal_id, legacy_key, customer_name, rep_id, department_id, sheet_month, deal_date, deal_amount, bonus_requested, is_renewal, sheet_tab_name, sheet_row_number) VALUES ? ON DUPLICATE KEY UPDATE rep_id=VALUES(rep_id), customer_name=VALUES(customer_name), deal_amount=VALUES(deal_amount), deal_date=VALUES(deal_date), is_renewal=VALUES(is_renewal)',
        [dealValuesToInsert]
      );
    }

    console.log('[SyncService] triggerSync completed successfully');
  }
}

export const syncService = new SyncService();

export async function runSyncOnce(tabName: string, mappingOverride?: ColumnMapping) {
  return syncService.triggerSync(tabName, mappingOverride);
}
