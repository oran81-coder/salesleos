import mysql from 'mysql2/promise';
import { loadConfig } from '@laos/config';
import { fetchSheetValues } from './sheets-client.js';
import {
  parseColumnMapping,
  parseDealsRows,
  parseRepSummaryRows,
} from './parser.js';
import {
  validateDeals,
  validateRepSummaries,
  type DataErrorInput,
} from './validator.js';

const config = loadConfig();

const dbPool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function insertDataErrors(conn: mysql.PoolConnection, errors: DataErrorInput[]) {
  if (!errors.length) return;
  const sql =
    'INSERT INTO data_errors (source, sheet_month, sheet_tab_name, sheet_row_number, error_code, error_message, raw_payload) VALUES ?';
  const values = errors.map((e) => [
    e.source,
    e.sheetMonth,
    e.sheetTabName,
    e.sheetRowNumber,
    e.errorCode,
    e.errorMessage,
    JSON.stringify(e.rawPayload),
  ]);
  await conn.query(sql, [values]);
}

async function fetchUserMapping(conn: mysql.PoolConnection) {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    'SELECT id, full_name, sheet_name, department_id FROM users WHERE is_active = 1',
  );

  const mapping = new Map<string, { id: number; departmentId: number }>();

  for (const row of rows) {
    // 1. Map by full_name (case-insensitive key)
    const normalizedFullName = row.full_name.trim().toLowerCase();
    const userInfo = { id: row.id, departmentId: row.department_id };
    mapping.set(normalizedFullName, userInfo);

    // 2. Map by sheet_name if provided (higher priority if duplicate, but usually unique)
    if (row.sheet_name) {
      mapping.set(row.sheet_name.trim().toLowerCase(), userInfo);
    }
  }
  return mapping;
}

/**
 * Finds a user in the mapping with normalized key lookup
 */
function findUserBySheetName(userMap: Map<string, any>, rawName: string) {
  if (!rawName) return null;
  return userMap.get(rawName.trim().toLowerCase()) || null;
}

export async function runSyncOnce(sheetMonthLabel: string): Promise<void> {
  const sheetsCfg = config.sheets;
  const mapping = parseColumnMapping(sheetsCfg);

  // Convert "YYYY-MM" to "YYYY-MM-01" for DB
  const sheetMonth = `${sheetMonthLabel}-01`;

  const dealsRange = sheetsCfg.dealsRange ?? `${sheetMonthLabel}!A:Z`;
  const summaryRange = sheetsCfg.summaryRange ?? `${sheetMonthLabel}!O:U`;

  const [dealsValues, summaryValues] = await Promise.all([
    fetchSheetValues(dealsRange),
    fetchSheetValues(summaryRange),
  ]);

  const parsedDeals = parseDealsRows(sheetMonthLabel, dealsValues, mapping.deals);
  const parsedSummaries = parseRepSummaryRows(sheetMonthLabel, summaryValues, mapping.summary);

  const validatedDeals = validateDeals(sheetMonth, parsedDeals);
  const validatedSummaries = validateRepSummaries(sheetMonth, parsedSummaries);

  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();

    const userMap = await fetchUserMapping(conn);

    const [syncRunResult] = await conn.query<mysql.ResultSetHeader>(
      'INSERT INTO sync_runs (status, total_rows, valid_rows, error_rows, message) VALUES (?, ?, ?, ?, ?)',
      [
        'running',
        parsedDeals.length + parsedSummaries.length,
        validatedDeals.valid.length + validatedSummaries.valid.length,
        validatedDeals.errors.length + validatedSummaries.errors.length,
        `Sync for tab ${sheetMonthLabel}`,
      ],
    );
    const syncRunId = syncRunResult.insertId;

    // Insert data errors from validation
    const allErrors = [...validatedDeals.errors, ...validatedSummaries.errors];

    // Process Valid Deals
    const dealValuesToInsert: any[][] = [];
    for (const v of validatedDeals.valid) {
      const user = findUserBySheetName(userMap, v.row.repName);
      if (!user) {
        allErrors.push({
          source: 'deal',
          sheetMonth,
          sheetTabName: v.row.tabName,
          sheetRowNumber: v.row.rowNumber,
          errorCode: 'MISSING_USER',
          errorMessage: `User "${v.row.repName}" not found or inactive`,
          rawPayload: v.row,
        });
        continue;
      }

      // Try to parse date if provided
      let finalDealDate: string | null = null;
      if (v.row.dealDate) {
        // Simple check/conversion if it looks like a date or ISO string
        // In a real scenario, might need more robust parsing depending on Sheets format
        finalDealDate = v.row.dealDate;
      }

      dealValuesToInsert.push([
        v.row.dealId || null,
        v.row.legacyKey || null,
        user.id,
        user.departmentId,
        sheetMonth,
        finalDealDate,
        v.dealAmount,
        v.bonusRequested,
        v.row.tabName,
        v.row.rowNumber,
      ]);
    }

    if (dealValuesToInsert.length > 0) {
      await conn.query(
        `INSERT INTO deals (deal_id, legacy_key, rep_id, department_id, sheet_month, deal_date, deal_amount, bonus_requested, sheet_tab_name, sheet_row_number)
         VALUES ?
         ON DUPLICATE KEY UPDATE
           rep_id = VALUES(rep_id),
           department_id = VALUES(department_id),
           deal_amount = VALUES(deal_amount),
           bonus_requested = VALUES(bonus_requested),
           deal_date = VALUES(deal_date),
           sheet_tab_name = VALUES(sheet_tab_name),
           sheet_row_number = VALUES(sheet_row_number)`,
        [dealValuesToInsert],
      );
    }

    // Process Valid Summaries
    const summaryValuesToInsert: any[][] = [];
    for (const v of validatedSummaries.valid) {
      const user = findUserBySheetName(userMap, v.row.repName);
      if (!user) {
        allErrors.push({
          source: 'rep_summary',
          sheetMonth,
          sheetTabName: v.row.tabName,
          sheetRowNumber: null,
          errorCode: 'MISSING_USER',
          errorMessage: `User "${v.row.repName}" not found or inactive`,
          rawPayload: v.row,
        });
        continue;
      }
      summaryValuesToInsert.push([
        user.id,
        user.departmentId,
        sheetMonth,
        v.totalSalesAmount,
        v.numberOfDeals || 0,
        v.targetAmount || 0,
        v.averageDealSize,
        v.bonusBaseRaw,
        v.offsetAmount,
        v.row.tabName,
      ]);
    }

    if (summaryValuesToInsert.length > 0) {
      await conn.query(
        `INSERT INTO rep_monthly_summary (rep_id, department_id, sheet_month, total_sales_amount, number_of_deals, target_amount, average_deal_size, bonus_base_raw, offset_amount, sheet_tab_name)
         VALUES ?
         ON DUPLICATE KEY UPDATE
           total_sales_amount = VALUES(total_sales_amount),
           number_of_deals = VALUES(number_of_deals),
           target_amount = VALUES(target_amount),
           average_deal_size = VALUES(average_deal_size),
           bonus_base_raw = VALUES(bonus_base_raw),
           offset_amount = VALUES(offset_amount),
           sheet_tab_name = VALUES(sheet_tab_name)`,
        [summaryValuesToInsert],
      );
    }

    // Insert all errors
    await insertDataErrors(conn, allErrors);

    await conn.query(
      'UPDATE sync_runs SET status = ?, finished_at = CURRENT_TIMESTAMP, error_rows = ? WHERE id = ?',
      ['success', allErrors.length, syncRunId],
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

