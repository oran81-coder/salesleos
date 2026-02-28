-- Migration: Add system_settings table for dynamic configuration
CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(255) NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default mapping from PRD
INSERT IGNORE INTO system_settings (setting_key, setting_value) 
VALUES ('sheets_mapping', '{"deals":{"repName":0,"dealAmount":1,"bonus":2,"dealId":3,"dealDate":4},"summary":{"repName":0,"totalSalesAmount":1,"bonusBaseRaw":2,"offsetAmount":3,"targetAmount":4}}');
