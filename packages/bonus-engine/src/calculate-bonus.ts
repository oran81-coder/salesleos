export type Tier = { level: number; from: number; to: number | null; percent: number };

export type BonusInputs = {
  bonusBaseRaw: number;
  offsetAmount: number;
  tiers: Tier[];
};

export type MonthlyBonusResult = {
  bonusBaseNet: number;
  tier: Tier;
  payout: number;
};

export function determineTier(amount: number, tiers: Tier[]): Tier {
  const sorted = [...tiers].sort((a, b) => a.from - b.from);
  for (const t of sorted) {
    const upperOk = t.to === null ? true : amount < t.to;
    if (amount >= t.from && upperOk) return t;
  }
  // Fallback to first tier (lowest) if below all ranges
  return sorted[0];
}

export function calculateMonthlyBonus(inputs: BonusInputs): MonthlyBonusResult {
  const bonusBaseNet = inputs.bonusBaseRaw - inputs.offsetAmount;
  const tier = determineTier(bonusBaseNet, inputs.tiers);
  const payout = Math.max(0, bonusBaseNet * tier.percent);
  return { bonusBaseNet, tier, payout };
}

/**
 * Partial bonus handling helper, implementing PRD formula:
 * previous_paid = SUM(all approved bonus for deal_id)
 * eligible_now = MAX(0, requested_bonus - previous_paid)
 */
export function calculateEligibleBonusAmount(requestedBonus: number, previousPaid: number): number {
  const eligibleNow = requestedBonus - previousPaid;
  return eligibleNow > 0 ? eligibleNow : 0;
}

