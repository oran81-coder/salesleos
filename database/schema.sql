-- LAOS MEDIA – Sales Performance Panel
-- Global schema definition (authoritative structure; migrations should match this)

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS departments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_departments_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  sheet_name VARCHAR(255) NULL,
  role ENUM('manager', 'rep') NOT NULL,
  department_id BIGINT UNSIGNED NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_department_id (department_id),
  CONSTRAINT fk_users_department FOREIGN KEY (department_id)
    REFERENCES departments (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS commission_tier_versions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_commission_tier_versions_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS commission_tiers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  version_id BIGINT UNSIGNED NOT NULL,
  level INT NOT NULL,
  amount_from DECIMAL(12,2) NOT NULL,
  amount_to DECIMAL(12,2) NULL,
  percent DECIMAL(5,4) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_commission_tiers_version_id (version_id),
  CONSTRAINT fk_commission_tiers_version FOREIGN KEY (version_id)
    REFERENCES commission_tier_versions (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  is_renewal TINYINT(1) NOT NULL DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS rep_monthly_summary (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  rep_id BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED NOT NULL,
  sheet_month DATE NOT NULL,
  total_sales_amount DECIMAL(14,2) NOT NULL,
  total_collection_amount DECIMAL(14,2) NULL DEFAULT 0,
  number_of_deals INT NOT NULL,
  target_amount DECIMAL(14,2) NULL DEFAULT 0,
  average_deal_size DECIMAL(14,2) NULL,
  bonus_base_raw DECIMAL(14,2) NOT NULL,
  offset_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  sheet_tab_name VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rep_monthly_summary_rep_month (rep_id, sheet_month),
  KEY idx_rep_monthly_summary_department_month (department_id, sheet_month),
  CONSTRAINT fk_rep_monthly_summary_rep FOREIGN KEY (rep_id)
    REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_rep_monthly_summary_department FOREIGN KEY (department_id)
    REFERENCES departments (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bonus_calculation_snapshots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  rep_id BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED NOT NULL,
  sheet_month DATE NOT NULL,
  commission_tier_version_id BIGINT UNSIGNED NOT NULL,
  commission_tier_id BIGINT UNSIGNED NOT NULL,
  bonus_base_raw DECIMAL(14,2) NOT NULL,
  offset_amount DECIMAL(14,2) NOT NULL,
  bonus_base_net DECIMAL(14,2) NOT NULL,
  bonus_payout DECIMAL(14,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bonus_snapshots_rep_month (rep_id, sheet_month),
  KEY idx_bonus_snapshots_department_month (department_id, sheet_month),
  CONSTRAINT fk_bonus_snapshots_rep FOREIGN KEY (rep_id)
    REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_bonus_snapshots_department FOREIGN KEY (department_id)
    REFERENCES departments (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_bonus_snapshots_tier_version FOREIGN KEY (commission_tier_version_id)
    REFERENCES commission_tier_versions (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_bonus_snapshots_tier FOREIGN KEY (commission_tier_id)
    REFERENCES commission_tiers (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bonus_approvals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  deal_id VARCHAR(64) NULL,
  legacy_key VARCHAR(64) NULL,
  deal_db_id BIGINT UNSIGNED NULL,
  rep_id BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED NOT NULL,
  sheet_month DATE NOT NULL,
  approved_amount DECIMAL(14,2) NOT NULL,
  status ENUM('approved', 'declined') NOT NULL DEFAULT 'approved',
  approved_by_user_id BIGINT UNSIGNED NOT NULL,
  approved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bonus_approvals_deal_id (deal_id),
  KEY idx_bonus_approvals_legacy_key (legacy_key),
  KEY idx_bonus_approvals_rep_month (rep_id, sheet_month),
  CONSTRAINT fk_bonus_approvals_deal FOREIGN KEY (deal_db_id)
    REFERENCES deals (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_bonus_approvals_rep FOREIGN KEY (rep_id)
    REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_bonus_approvals_department FOREIGN KEY (department_id)
    REFERENCES departments (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_bonus_approvals_approved_by FOREIGN KEY (approved_by_user_id)
    REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS deferred_bonuses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  bonus_approval_id BIGINT UNSIGNED NOT NULL,
  original_sheet_month DATE NOT NULL,
  payout_month DATE NOT NULL,
  deferred_amount DECIMAL(14,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_deferred_bonuses_payout_month (payout_month),
  CONSTRAINT fk_deferred_bonuses_approval FOREIGN KEY (bonus_approval_id)
    REFERENCES bonus_approvals (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS data_errors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source ENUM('deal', 'rep_summary') NOT NULL,
  sheet_month DATE NULL,
  sheet_tab_name VARCHAR(255) NULL,
  sheet_row_number INT NULL,
  error_code VARCHAR(64) NOT NULL,
  error_message VARCHAR(1024) NOT NULL,
  raw_payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_data_errors_source_month (source, sheet_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sync_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP NULL,
  status ENUM('running', 'success', 'failed') NOT NULL DEFAULT 'running',
  total_rows INT NOT NULL DEFAULT 0,
  valid_rows INT NOT NULL DEFAULT 0,
  error_rows INT NOT NULL DEFAULT 0,
  message VARCHAR(1024) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  setting_key VARCHAR(128) NOT NULL,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_system_settings_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
