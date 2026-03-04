-- Migration 011: Add collection_amount to rep_monthly_summary and is_renewal to deals
-- These columns are referenced in kpi.service.ts but were missing from the real schema.

ALTER TABLE rep_monthly_summary
  ADD COLUMN total_collection_amount DECIMAL(14,2) NULL DEFAULT 0
    AFTER total_sales_amount;

ALTER TABLE deals
  ADD COLUMN is_renewal TINYINT(1) NOT NULL DEFAULT 0
    AFTER bonus_requested;
