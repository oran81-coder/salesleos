
LAOS MEDIA – SALES PERFORMANCE PANEL
MASTER DEVELOPMENT PROMPT
Generated: 2026-02-26

STRICT IMPLEMENTATION DIRECTIVE

You are building the Laos Media Sales Performance Panel.

You MUST strictly follow the approved Product Requirements Document (PRD v1.1).

You are NOT allowed to:
- Invent new logic
- Modify business rules
- Simplify bonus calculations
- Assume missing data
- Change commission logic
- Change synchronization logic
- Alter database schema structure
- Merge responsibilities between Google Sheets and internal DB

If anything is unclear, you must ask before implementing.

ARCHITECTURAL CONSTRAINTS (MANDATORY)

1. Google Sheets is READ-ONLY.
2. The database (MySQL) is the source of truth for:
   - Bonus approvals
   - Partial bonus tracking
   - Deferred bonuses
   - Bonus payouts
3. The "Bonus" column in Google Sheets represents requested/eligible bonus base amount.
4. Commission percentage applies to the entire net base (after offset).
5. Offset affects tier calculation.
6. Duplicate bonus payments must be prevented by tracking cumulative approved amounts per deal_id.
7. Legacy deals without deal_id must use legacy_key.

DEVELOPMENT RULES

1. No Business Logic Outside the Bonus Engine.
2. Sync layer must only fetch, validate, normalize and store data.
3. Bonus calculation flow:

bonus_base_raw = sum(all numeric values in "Bonus" column)
bonus_base_net = bonus_base_raw - offset_amount
tier = determineTier(bonus_base_net)
bonus_payout = bonus_base_net * tier.percent

4. Partial Bonus Handling:

previous_paid = sum(all approved bonus for deal_id)
eligible_now = max(0, requested_bonus - previous_paid)

5. Deferred bonuses must be recorded in payout month only.

DATABASE INTEGRITY RULES

- No destructive updates
- All approvals stored historically
- Never trust sheet calculations over system calculations

VALIDATION RULES

- If numeric fields contain text → mark as data_error
- Exclude invalid rows from calculations
- Show in manager dashboard

KPI RULES

Sales → deal_amount
Bonus Base → bonus_requested
Offset → summary table
Final Bonus → bonus engine only

PROHIBITED ACTIONS

- No business logic in React
- No bonus from Collection column
- No duplicate payouts
- No sheet modifications
- No tier logic changes

TESTING REQUIREMENTS

- Partial bonus test
- Offset impact test
- Deferred bonus test
- Duplicate prevention test

DEPLOYMENT RULES

- Must run in Docker
- MySQL with persistent volume
- Environment variables externalized
- No secrets in code

If unclear → STOP and ask.

Definition of Done:
Feature matches PRD exactly, passes edge-case testing, and does not modify commission rules.
