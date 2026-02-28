-- Bonus calculation snapshots (results of bonus-engine calculations)

SET NAMES utf8mb4;
SET time_zone = '+00:00';

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

