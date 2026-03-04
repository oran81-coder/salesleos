-- Seed initial department and users for LAOS Sales Panel
-- Passwords are bcrypt hashes of 'admin123' (for dev only)
SET NAMES utf8mb4;

-- Department
INSERT INTO departments (id, name) VALUES (1, 'מכירות')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Users
-- Password hash for 'admin123': $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh...
INSERT INTO users (id, email, password_hash, full_name, sheet_name, role, department_id, is_active)
VALUES
  (1, 'repA@laos.co.il',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhFu', 'נציג א׳',       'נציג א׳',       'rep',     1, 1),
  (2, 'repB@laos.co.il',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhFu', 'נציג ב׳',       'נציג ב׳',       'rep',     1, 1),
  (3, 'repC@laos.co.il',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhFu', 'נציג ג׳',       'נציג ג׳',       'rep',     1, 1),
  (4, 'manager@laos.co.il', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhFu', 'מנהל המערכת',  'מנהל',          'manager', 1, 1),
  (5, 'keren@leos.co.il',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhFu', 'קרן בן שימול', 'קרן בן שימול', 'rep',     1, 1)
ON DUPLICATE KEY UPDATE
  full_name   = VALUES(full_name),
  sheet_name  = VALUES(sheet_name),
  role        = VALUES(role),
  department_id = VALUES(department_id),
  is_active   = VALUES(is_active);
