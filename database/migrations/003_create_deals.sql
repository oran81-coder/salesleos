-- Deals table (per-row data from Google Sheets deal table)

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS deals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  deal_id VARCHAR(64) NULL,
  legacy_key VARCHAR(64) NULL,
  rep_id BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED NOT NULL,
  sheet_month DATE NOT NULL,
  deal_date DATE NULL,
  deal_amount DECIMAL(14,2) NOT NULL,
  bonus_requested DECIMAL(14,2) NULL,
  sheet_tab_name VARCHAR(255) NULL,
  sheet_row_number INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_deals_deal_id (deal_id),
  UNIQUE KEY uq_deals_legacy_key (legacy_key),
  KEY idx_deals_rep_month (rep_id, sheet_month),
  KEY idx_deals_department_month (department_id, sheet_month),
  CONSTRAINT fk_deals_rep FOREIGN KEY (rep_id)
    REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_deals_department FOREIGN KEY (department_id)
    REFERENCES departments (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

