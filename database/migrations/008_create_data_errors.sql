-- Data errors captured during sync from Google Sheets

SET NAMES utf8mb4;
SET time_zone = '+00:00';

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

