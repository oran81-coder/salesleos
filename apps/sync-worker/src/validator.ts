import type { DataErrorSource } from '@laos/shared-types';
import type {
  ParsedDealRow,
  ParsedRepSummaryRow,
} from './parser.js';

export interface DataErrorInput {
  source: DataErrorSource;
  sheetMonth: string | null;
  sheetTabName: string;
  sheetRowNumber: number | null;
  errorCode: string;
  errorMessage: string;
  rawPayload: unknown;
}

export type ValidatedDealsResult = {
  valid: {
    row: ParsedDealRow;
    dealAmount: number;
    bonusRequested: number | null;
  }[];
  errors: DataErrorInput[];
};

export type ValidatedRepSummaryResult = {
  valid: {
    row: ParsedRepSummaryRow;
    totalSalesAmount: number;
    bonusBaseRaw: number;
    offsetAmount: number;
    numberOfDeals: number | null;
    averageDealSize: number | null;
    targetAmount: number | null;
  }[];
  errors: DataErrorInput[];
};

function toNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function validateDeals(
  sheetMonth: string | null,
  rows: ParsedDealRow[],
): ValidatedDealsResult {
  const valid: ValidatedDealsResult['valid'] = [];
  const errors: DataErrorInput[] = [];

  for (const row of rows) {
    const dealAmount = toNumber(row.dealAmount);
    const bonusRequested = toNumber(row.bonusRequested);

    if (dealAmount == null) {
      errors.push({
        source: 'deal',
        sheetMonth,
        sheetTabName: row.tabName,
        sheetRowNumber: row.rowNumber,
        errorCode: 'INVALID_DEAL_AMOUNT',
        errorMessage: 'Deal amount is not a valid number',
        rawPayload: row,
      });
      continue;
    }

    // PRD: Deal ID (מספר הסכם) is globally unique. Legacy rows use legacy_key.
    if (!row.dealId && !row.legacyKey) {
      errors.push({
        source: 'deal',
        sheetMonth,
        sheetTabName: row.tabName,
        sheetRowNumber: row.rowNumber,
        errorCode: 'MISSING_DEAL_ID',
        errorMessage: 'Row is missing both Deal ID and Legacy Key',
        rawPayload: row,
      });
      continue;
    }

    if (row.bonusRequested !== null && row.bonusRequested !== undefined && row.bonusRequested !== '' && bonusRequested === null) {
      errors.push({
        source: 'deal',
        sheetMonth,
        sheetTabName: row.tabName,
        sheetRowNumber: row.rowNumber,
        errorCode: 'INVALID_BONUS_VALUE',
        errorMessage: `Bonus value "${row.bonusRequested}" is not a valid number`,
        rawPayload: row,
      });
      // We might continue anyway with 0 bonus or skip. PRD says ONLY numeric are valid.
      // Let's skip to be safe and surface the error.
      continue;
    }

    if (typeof row.repName !== 'string' || !row.repName.trim()) {
      errors.push({
        source: 'deal',
        sheetMonth,
        sheetTabName: row.tabName,
        sheetRowNumber: row.rowNumber,
        errorCode: 'MISSING_REP_NAME',
        errorMessage: 'Representative name is required',
        rawPayload: row,
      });
      continue;
    }

    valid.push({
      row,
      dealAmount,
      bonusRequested,
    });
  }

  return { valid, errors };
}

export function validateRepSummaries(
  sheetMonth: string | null,
  rows: ParsedRepSummaryRow[],
): ValidatedRepSummaryResult {
  const valid: ValidatedRepSummaryResult['valid'] = [];
  const errors: DataErrorInput[] = [];

  for (const row of rows) {
    const totalSalesAmount = toNumber(row.totalSalesAmount);
    const bonusBaseRaw = toNumber(row.bonusBaseRaw);
    const offsetAmount = toNumber(row.offsetAmount);
    const numberOfDeals = toNumber(row.numberOfDeals);
    const averageDealSize = toNumber(row.averageDealSize);
    const targetAmount = toNumber(row.targetAmount);

    if (typeof row.repName !== 'string' || !row.repName.trim()) {
      errors.push({
        source: 'rep_summary',
        sheetMonth,
        sheetTabName: row.tabName,
        sheetRowNumber: null,
        errorCode: 'MISSING_REP_NAME',
        errorMessage: 'Representative name is required in summary row',
        rawPayload: row,
      });
      continue;
    }

    if (bonusBaseRaw === null && row.bonusBaseRaw !== '') {
      errors.push({
        source: 'rep_summary',
        sheetMonth,
        sheetTabName: row.tabName,
        sheetRowNumber: null,
        errorCode: 'INVALID_BONUS_BASE_RAW',
        errorMessage: `Bonus base raw value "${row.bonusBaseRaw}" is not a valid number`,
        rawPayload: row,
      });
      continue;
    }

    valid.push({
      row,
      totalSalesAmount: totalSalesAmount ?? 0,
      bonusBaseRaw,
      offsetAmount: offsetAmount ?? 0,
      numberOfDeals: numberOfDeals ?? null,
      averageDealSize: averageDealSize ?? null,
      targetAmount: targetAmount ?? 0,
    });
  }

  return { valid, errors };
}

