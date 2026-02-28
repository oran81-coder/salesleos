-- Migration: Add sheet_name to users table for robust Google Sheets mapping
ALTER TABLE users ADD COLUMN sheet_name VARCHAR(255) NULL AFTER full_name;
CREATE INDEX idx_users_sheet_name ON users(sheet_name);
