# LAOS MEDIA -- SALES PERFORMANCE PANEL

## Product Requirements Document (PRD) -- v1.1

**Generated on:** 2026-02-26

------------------------------------------------------------------------

# 1. Product Overview

The Laos Media Sales Performance Panel is an internal web-based
dashboard designed to provide complete transparency into sales
performance, collections, commission calculations, offsets, and
department benchmarks.

The system integrates with Google Sheets (read-only), synchronizes data
every 5 minutes, and calculates bonuses based on predefined commission
tiers.

------------------------------------------------------------------------

# 2. Product Goals

-   Provide real-time visibility into individual and departmental sales
    performance.
-   Automate bonus calculations based on monthly commission tiers.
-   Prevent duplicate bonus payments across months.
-   Support partial bonus approvals.
-   Support deferred bonus payouts.
-   Detect and surface data inconsistencies from Google Sheets.
-   Ensure historical bonus logic is preserved via versioning.

------------------------------------------------------------------------

# 3. Users & Roles

## 3.1 Manager

Capabilities: - View full department performance - Drill down into
individual representatives - Approve or decline partial bonus requests -
Defer bonus payouts to future months - Manage commission tiers (with
versioning) - Invite and manage users - Trigger manual synchronization -
View data validation errors

## 3.2 Sales Representative

Capabilities: - View only personal performance data - View KPIs (sales,
deals, bonus, offsets) - View target achievement percentage - View
percentile ranking within department - View eligible bonus deals

------------------------------------------------------------------------

# 4. Data Source & Integration

## 4.1 Google Sheets (Read-Only)

-   Each tab represents a month.
-   Each tab contains:
    -   Deal table
    -   Representative summary table (including offsets)

## 4.2 Critical Data Rules

-   The "Bonus" column is the authoritative source of bonus eligibility.
-   Only numeric values in the "Bonus" column are considered valid.
-   Offset values are read from the monthly summary table.
-   Deal ID (מספר הסכם) is globally unique.
-   Historical rows without Deal ID use a generated `legacy_key`.

------------------------------------------------------------------------

# 5. Business Logic -- Bonus Engine

## 5.1 Monthly Bonus Base Calculation

``` text
bonus_base_raw = SUM(all numeric values in "Bonus" column per rep per month)
```

## 5.2 Offset Application

``` text
bonus_base_net = bonus_base_raw - offset_amount
```

## 5.3 Commission Tier Determination

Commission percentage applies to the entire `bonus_base_net`.

``` text
bonus_payout = bonus_base_net × tier.percent
```

------------------------------------------------------------------------

# 6. Commission Tiers

  From       To        Percent
  ---------- --------- ---------
  0          30,000    0%
  30,000     40,000    2.5%
  40,000     50,000    3.5%
  50,000     60,000    4.5%
  60,000     70,000    5.5%
  70,000     80,000    6.5%
  80,000     90,000    7.5%
  90,000     100,000   8.5%
  100,000+   ∞         9%

------------------------------------------------------------------------

# 7. Partial Bonus Handling

When a manager approves a partial bonus:

``` text
previous_paid = SUM(all approved bonus for deal_id)
eligible_now = MAX(0, requested_bonus - previous_paid)
```

The system must prevent duplicate payouts by tracking cumulative
approved amounts per deal.

------------------------------------------------------------------------

# 8. Deferred Bonus Logic

Managers may defer bonus payouts to future months.

-   Deferred bonuses are recorded in the designated payroll month.
-   Full traceability must be maintained.
-   Deferred bonuses may span multiple months.

------------------------------------------------------------------------

# 9. Key Performance Indicators (KPIs)

Per Representative:

-   Total Sales Amount
-   Number of Deals
-   Average Deal Size
-   Bonus Base (Raw)
-   Offset Amount
-   Bonus Base (Net)
-   Final Bonus Payout
-   Target Achievement Percentage
-   Percentile Ranking (Sales / Deals / Bonus)

Department-Level:

-   Leaderboard rankings
-   Average monthly performance
-   Percentile distributions

Inactive representatives are excluded from department averages and
leaderboards.

------------------------------------------------------------------------

# 10. Synchronization Engine

-   Automatic sync every 5 minutes.
-   Manual sync trigger available to managers.
-   Validation performed during sync.
-   Invalid rows stored in `data_errors` table.
-   Sync process does NOT calculate bonuses.

------------------------------------------------------------------------

# 11. Database Responsibilities

The internal database is the source of truth for:

-   Bonus approvals
-   Partial approvals
-   Deferred payouts
-   Historical payout records
-   Commission tier versions
-   User management
-   Data validation logs

Google Sheets is strictly read-only.

------------------------------------------------------------------------

# 12. Security Requirements

-   JWT authentication
-   bcrypt password hashing
-   Role-based access control
-   HTTPS (SSL)
-   Dockerized MySQL with persistent volume
-   No secrets stored in source code

------------------------------------------------------------------------

# 13. Technical Stack

Backend: Node.js 22 (Express)\
Frontend: React (RTL)\
Database: MySQL (Dockerized)\
Deployment: Docker + Nginx on Ubuntu 24 VPS

------------------------------------------------------------------------

# 14. Deployment Phases

Phase 1 -- Infrastructure setup (Docker, DB schema, API skeleton)\
Phase 2 -- Google Sheets Sync Engine\
Phase 3 -- Bonus Engine implementation\
Phase 4 -- React UI development\
Phase 5 -- QA & Edge Case Validation\
Phase 6 -- Production deployment

------------------------------------------------------------------------

# 15. Definition of Done

A feature is considered complete only if:

-   It strictly matches PRD logic.
-   It passes all edge-case tests.
-   It does not alter commission rules.
-   It does not modify Google Sheets data.
-   It preserves historical bonus integrity.

------------------------------------------------------------------------

END OF DOCUMENT
