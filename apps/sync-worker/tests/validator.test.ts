import { describe, it, expect } from 'vitest';
import { validateDeals, validateRepSummaries } from '../src/validator';

describe('Sync Worker Validator', () => {
    it('should mark invalid numeric fields as data_errors', () => {
        const rows = [
            { tabName: 'Jan', rowNumber: 2, repName: 'John', dealAmount: 'not-a-number', bonusRequested: '100' } as any
        ];
        const result = validateDeals('2024-01-01', rows);
        expect(result.valid.length).toBe(0);
        expect(result.errors.length).toBe(1);
        expect(result.errors[0].errorCode).toBe('INVALID_DEAL_AMOUNT');
    });

    it('should require representative name', () => {
        const rows = [
            { tabName: 'Jan', rowNumber: 2, repName: '', dealAmount: '1000', bonusRequested: '100' } as any
        ];
        const result = validateDeals('2024-01-01', rows);
        expect(result.errors[0].errorCode).toBe('MISSING_REP_NAME');
    });

    it('should validate rep summaries correctly', () => {
        const summaries = [
            { repName: 'John', totalSalesAmount: '50000', offsetAmount: '5000' } as any
        ];
        const result = validateRepSummaries('2024-01-01', summaries);
        expect(result.valid.length).toBe(1);
        expect(result.valid[0].offsetAmount).toBe(5000);
    });

    it('should error on invalid offset in rep summary', () => {
        const summaries = [
            { repName: 'John', totalSalesAmount: '50000', offsetAmount: 'invalid' } as any
        ];
        const result = validateRepSummaries('2024-01-01', summaries);
        expect(result.errors.length).toBe(1);
        expect(result.errors[0].errorCode).toBe('INVALID_OFFSET_AMOUNT');
    });
});
