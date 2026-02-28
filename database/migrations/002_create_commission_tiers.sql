-- Commission tier versions and tiers

SET NAMES utf8mb4;
SET time_zone = '+00:00';

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

