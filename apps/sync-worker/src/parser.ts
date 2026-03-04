import type { SheetsConfig } from '@laos/config';

export type DealsColumns = {
  dealId?: number;
  legacyKey?: number;
  customerName: number; // New: typically Column B (index 1)
  repName: number;
  dealAmount: number;
  bonus: number;
  collectionAmount?: number; // New: maps to "בונוס" in the big table per user screenshot
  dealDate?: number;
  isRenewal?: number; // optional: 1 = renewal, 0 = new deal
};

export type SummaryColumns = {
  repName: number;
  totalSalesAmount: number;
  bonusBaseRaw: number;
  offsetAmount: number;
  numberOfDeals?: number;
  averageDealSize?: number;
  targetAmount?: number;
  totalCollectionAmount?: number; // optional: actual collected revenue
};

export type ColumnMapping = {
  deals: DealsColumns;
  summary: SummaryColumns;
};

export function parseColumnMapping(config: SheetsConfig): ColumnMapping {
  if (!config.columnMappingJson) {
    throw new Error('SHEETS_COLUMN_MAPPING_JSON is required for sync worker');
  }
  const parsed = JSON.parse(config.columnMappingJson) as ColumnMapping;
  return parsed;
}

export type ParsedDealRow = {
  tabName: string;
  rowNumber: number;
  repName: string;
  customerName: string;
  dealAmount: unknown;
  collectionAmount: unknown; // New
  bonusRequested: unknown;
  dealDate?: string | null;
  dealId?: string | null;
  legacyKey?: string | null;
  isRenewal?: boolean;
};

export type ParsedRepSummaryRow = {
  tabName: string;
  repName: string;
  totalSalesAmount: unknown;
  bonusBaseRaw: unknown;
  offsetAmount: unknown;
  numberOfDeals?: unknown;
  averageDealSize?: unknown;
  targetAmount?: unknown;
  totalCollectionAmount?: unknown;
};

export function parseDealsRows(
  tabName: string,
  values: string[][],
  columns: DealsColumns,
): ParsedDealRow[] {
  // Assume first row is header
  const [, ...dataRows] = values;
  const results: ParsedDealRow[] = [];

  for (const [idx, row] of dataRows.entries()) {
    const rawName = row[columns.repName] ?? '';
    const rawAmount = row[columns.dealAmount] ?? '';

    // Skip if name is empty, numeric headers, or just garbage
    if (!rawName.trim() || rawName.includes('שם נציג') || rawName.includes('סה"כ')) continue;

    // Skip if amount is empty or #N/A (not a real deal yet)
    if (!String(rawAmount).trim() || String(rawAmount).includes('#N/A')) continue;

    // Skip cancelled deals: marked with dashes, e.g., "-5000-"
    if (String(rawAmount).trim().startsWith('-') && String(rawAmount).trim().endsWith('-')) {
      console.log(`[Parser] Skipping cancelled deal at row ${idx + 2}: "${rawAmount}"`);
      continue;
    }

    results.push({
      tabName,
      rowNumber: idx + 2,
      repName: rawName.trim(),
      customerName: (row[columns.customerName] || '').trim(),
      dealAmount: rawAmount,
      collectionAmount: columns.collectionAmount != null ? row[columns.collectionAmount] : null,
      bonusRequested: row[columns.bonus],
      dealDate: columns.dealDate != null ? row[columns.dealDate] ?? null : null,
      dealId: columns.dealId != null ? row[columns.dealId] ?? null : null,
      legacyKey: columns.legacyKey != null ? row[columns.legacyKey] ?? null : null,
      isRenewal: columns.isRenewal != null
        ? (() => {
          const val = String(row[columns.isRenewal] ?? '').trim().toLowerCase();
          if (!val) return false;
          // If it's a "New" deal (contains 'חדש'), is_renewal should be false.
          // Otherwise, any non-empty value (Renewal, Expansion, etc.) is considered a renewal.
          const isNew = val.includes('חדש');
          const result = !isNew;

          if (val) {
            console.log(`[Parser] Row ${idx + 2} - Type: "${row[columns.isRenewal]}", isRenewal: ${result}`);
          }
          return result;
        })()
        : false,
    });
  }
  return results;
}

export function parseRepSummaryRows(
  tabName: string,
  values: string[][],
  columns: SummaryColumns,
): ParsedRepSummaryRow[] {
  const [, ...dataRows] = values;
  const results: ParsedRepSummaryRow[] = [];

  for (const row of dataRows) {
    const rawName = (row[columns.repName] ?? '').trim();

    // Improved skipping logic: ignore common non-rep headers and totals
    const skipNames = ['סה"כ', 'TOTAL', 'נציג', 'פנוי', 'קיזוזים', 'מכירות נכנסות', 'בונוסים', 'שם נציג'];
    const shouldSkip = !rawName || skipNames.some(s => rawName.includes(s));

    if (shouldSkip) continue;

    const rawSales = row[columns.totalSalesAmount];

    // Skip rows with #N/A or empty sales - likely invalid data
    if (String(rawSales).includes('#N/A') || rawSales === '' || rawSales == null) {
      continue;
    }

    results.push({
      tabName,
      repName: rawName,
      totalSalesAmount: rawSales,
      bonusBaseRaw: row[columns.bonusBaseRaw],
      offsetAmount: row[columns.offsetAmount],
      numberOfDeals: columns.numberOfDeals != null ? row[columns.numberOfDeals] : undefined,
      averageDealSize:
        columns.averageDealSize != null ? row[columns.averageDealSize] : undefined,
      targetAmount:
        columns.targetAmount != null ? row[columns.targetAmount] : undefined,
      totalCollectionAmount:
        columns.totalCollectionAmount != null ? row[columns.totalCollectionAmount] : undefined,
    });
  }
  return results;
}
