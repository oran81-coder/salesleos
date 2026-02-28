import { describe, it, expect } from 'vitest';
import { calculateMonthlyBonus, determineTier, calculateEligibleBonusAmount } from '../src/calculate-bonus';

const tiers = [
    { level: 1, from: 0, to: 30000, percent: 0 },
    { level: 2, from: 30000, to: 40000, percent: 0.025 },
    { level: 3, from: 40000, to: 50000, percent: 0.035 },
    { level: 4, from: 50000, to: 60000, percent: 0.045 },
    { level: 5, from: 60000, to: 70000, percent: 0.055 },
    { level: 6, from: 70000, to: 80000, percent: 0.065 },
    { level: 7, from: 80000, to: 90000, percent: 0.075 },
    { level: 8, from: 90000, to: 100000, percent: 0.085 },
    { level: 9, from: 100000, to: null, percent: 0.09 },
];

describe('Bonus Engine Logic (PRD Alignment)', () => {
    it('should determine correct tier for net base including exact boundaries', () => {
        expect(determineTier(29999, tiers).percent).toBe(0);
        expect(determineTier(30000, tiers).percent).toBe(0.025);
        expect(determineTier(39999, tiers).percent).toBe(0.025);
        expect(determineTier(40000, tiers).percent).toBe(0.035);
        expect(determineTier(100000, tiers).percent).toBe(0.09);
    });

    it('should calculate monthly bonus correctly with offset', () => {
        // Case: 55,000 raw, 5,000 offset -> 50,000 net. Tier 50k+ is 4.5%
        const inputs = {
            bonusBaseRaw: 55000,
            offsetAmount: 5000,
            tiers
        };
        const result = calculateMonthlyBonus(inputs);
        expect(result.bonusBaseNet).toBe(50000);
        expect(result.tier.percent).toBe(0.045);
        expect(result.payout).toBe(50000 * 0.045);
    });

    it('should handle offset reducing net to zero or negative', () => {
        const inputs = {
            bonusBaseRaw: 5000,
            offsetAmount: 6000,
            tiers
        };
        const result = calculateMonthlyBonus(inputs);
        expect(result.bonusBaseNet).toBe(-1000);
        expect(result.tier.percent).toBe(0);
        expect(result.payout).toBe(0); // Payout should be max(0, net * percent) or net must be non-negative for payout?
        // Actually PRD says bonus_payout = bonus_base_net * tier.percent. 
        // If net is negative, payout would be 0 because tier 0 is 0%.
    });

    it('should handle partial bonus eligibility (Duplicate Prevention)', () => {
        // Requested: 1000, Paid so far: 400 -> Eligible: 600
        expect(calculateEligibleBonusAmount(1000, 400)).toBe(600);
        // Requested: 1000, Paid so far: 1000 -> Eligible: 0
        expect(calculateEligibleBonusAmount(1000, 1000)).toBe(0);
        // Requested: 1000, Paid so far: 1100 -> Eligible: 0
        expect(calculateEligibleBonusAmount(1000, 1100)).toBe(0);
        // Requested: 0, Paid so far: 0 -> Eligible: 0
        expect(calculateEligibleBonusAmount(0, 0)).toBe(0);
    });
});
