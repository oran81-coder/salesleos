-- Bonus approvals (including partial approvals)

SET NAMES utf8mb4;
SET time_zone = '+00:00';

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

