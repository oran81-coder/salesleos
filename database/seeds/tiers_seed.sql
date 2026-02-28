-- Seed default commission tiers according to PRD v1.1

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO commission_tier_versions (name, effective_from, effective_to, is_default)
VALUES ('PRD_v1_1_default', '2026-01-01', NULL, 1);

SET @version_id := LAST_INSERT_ID();

-- Note: percent is stored as a factor (e.g., 0.025 = 2.5%)

INSERT INTO commission_tiers (version_id, level, amount_from, amount_to, percent)
VALUES
  (@version_id, 1,    0.00, 30000.00, 0.0000),
  (@version_id, 2, 30000.00, 40000.00, 0.0250),
  (@version_id, 3, 40000.00, 50000.00, 0.0350),
  (@version_id, 4, 50000.00, 60000.00, 0.0450),
  (@version_id, 5, 60000.00, 70000.00, 0.0550),
  (@version_id, 6, 70000.00, 80000.00, 0.0650),
  (@version_id, 7, 80000.00, 90000.00, 0.0750),
  (@version_id, 8, 90000.00,100000.00, 0.0850),
  (@version_id, 9,100000.00,      NULL, 0.0900);

