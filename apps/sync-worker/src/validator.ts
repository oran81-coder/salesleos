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
    collectionAmount: number | null; // New
    isRenewal: boolean;
  }[];
  errors: DataErrorInput[];
};

export type ValidatedRepSummaryResult = {
  valid: {
    row: ParsedRepSummaryRow;
    totalSalesAmount: number;
    totalCollectionAmount: number | null;
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
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    // 1. Remove currency, commas, and handle leading/trailing dashes
    let cleanStr = value.replace(/[₪,\s]/g, '').replace(/^-+/, '').replace(/-+$/, '');
    if (cleanStr === '' || cleanStr.includes('#N/A')) return null;

    // 2. Extract leading number (handles "25000 בוצעה..." or "15,000")
    const match = cleanStr.match(/^-?\d+(\.\d+)?/);
    if (!match) {
      if (/[0-9]/.test(value) && !value.includes('/') && value.length < 25) {
        console.log(`[Validator] toNumber FAILED to find number in: "${value}"`);
      }
      return null;
    }

    const n = Number(match[0]);
    return Number.isFinite(n) ? n : null;
  }
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

    /* Relaxing requirement for deal IDs as the spreadsheet lacks unique row keys
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
    */

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
      bonusRequested: bonusRequested || 0,
      collectionAmount: toNumber(row.collectionAmount) || 0,
      isRenewal: !!row.isRenewal,
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
    const totalCollectionAmount = toNumber(row.totalCollectionAmount);
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
      totalCollectionAmount: totalCollectionAmount ?? 0,
      bonusBaseRaw: bonusBaseRaw || 0,
      offsetAmount: offsetAmount ?? 0,
      numberOfDeals: numberOfDeals ?? null,
      averageDealSize: averageDealSize ?? null,
      targetAmount: targetAmount ?? 0,
    });
  }

  return { valid, errors };
}
