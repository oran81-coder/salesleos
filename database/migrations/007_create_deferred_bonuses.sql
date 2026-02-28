-- Deferred bonuses (recording payouts in future months)

SET NAMES utf8mb4;
SET time_zone = '+00:00';

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

