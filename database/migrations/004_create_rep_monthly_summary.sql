-- Representative monthly summary table (from Sheets summary tab)

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS rep_monthly_summary (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  rep_id BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED NOT NULL,
  sheet_month DATE NOT NULL,
  total_sales_amount DECIMAL(14,2) NOT NULL,
  number_of_deals INT NOT NULL,
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

