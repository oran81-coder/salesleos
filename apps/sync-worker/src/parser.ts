import type { SheetsConfig } from '@laos/config';

export type DealsColumns = {
  dealId?: number;
  legacyKey?: number;
  repName: number;
  dealAmount: number;
  bonus: number;
  dealDate?: number;
};

export type SummaryColumns = {
  repName: number;
  totalSalesAmount: number;
  bonusBaseRaw: number;
  offsetAmount: number;
  numberOfDeals?: number;
  averageDealSize?: number;
  targetAmount?: number;
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
  dealAmount: unknown;
  bonusRequested: unknown;
  dealDate?: string | null;
  dealId?: string | null;
  legacyKey?: string | null;
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
};

export function parseDealsRows(
  tabName: string,
  values: string[][],
  columns: DealsColumns,
): ParsedDealRow[] {
  // Assume first row is header
  const [, ...dataRows] = values;
  return dataRows.map((row, idx) => ({
    tabName,
    rowNumber: idx + 2, // +2 accounts for header row and 1-based indexing in Sheets
    repName: row[columns.repName] ?? '',
    dealAmount: row[columns.dealAmount],
    bonusRequested: row[columns.bonus],
    dealDate: columns.dealDate != null ? row[columns.dealDate] ?? null : null,
    dealId: columns.dealId != null ? row[columns.dealId] ?? null : null,
    legacyKey: columns.legacyKey != null ? row[columns.legacyKey] ?? null : null,
  }));
}

export function parseRepSummaryRows(
  tabName: string,
  values: string[][],
  columns: SummaryColumns,
): ParsedRepSummaryRow[] {
  const [, ...dataRows] = values;
  return dataRows.map((row) => ({
    tabName,
    repName: row[columns.repName] ?? '',
    totalSalesAmount: row[columns.totalSalesAmount],
    bonusBaseRaw: row[columns.bonusBaseRaw],
    offsetAmount: row[columns.offsetAmount],
    numberOfDeals: columns.numberOfDeals != null ? row[columns.numberOfDeals] : undefined,
    averageDealSize:
      columns.averageDealSize != null ? row[columns.averageDealSize] : undefined,
    targetAmount:
      columns.targetAmount != null ? row[columns.targetAmount] : undefined,
  }));
}

