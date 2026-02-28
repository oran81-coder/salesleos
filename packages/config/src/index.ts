// Centralized configuration loader for Laos Media – Sales Performance Panel

type NodeEnv = 'development' | 'test' | 'production';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string; // e.g. "1h"
}

export interface SheetsConfig {
  spreadsheetId: string;
  clientEmail: string;
  privateKey: string;
  // Optional ranges and column mapping are used by the sync worker to map
  // Google Sheets structure to domain rows without hard-coding business logic.
  dealsRange?: string;
  summaryRange?: string;
  // JSON string describing column indexes; parsed by the sync worker.
  columnMappingJson?: string;
}

export interface SyncConfig {
  intervalMs: number;
}

export interface AppConfig {
  nodeEnv: NodeEnv;
  apiPort: number;
  db: DatabaseConfig;
  jwt: JwtConfig;
  sheets: SheetsConfig;
  sync: SyncConfig;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseIntEnv(name: string, defaultValue?: number): number {
  const raw = process.env[name];
  if (raw == null || raw === '') {
    if (defaultValue == null) {
      throw new Error(`Missing required numeric environment variable: ${name}`);
    }
    return defaultValue;
  }
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid numeric environment variable ${name}: ${raw}`);
  }
  return num;
}

export function loadConfig(): AppConfig {
  const nodeEnv = (process.env.NODE_ENV as NodeEnv) || 'development';

  return {
    nodeEnv,
    apiPort: parseIntEnv('API_PORT', 3000),
    db: {
      host: required('DB_HOST'),
      port: parseIntEnv('DB_PORT', 3306),
      user: required('DB_USER'),
      password: required('DB_PASSWORD'),
      database: required('DB_NAME'),
    },
    jwt: {
      secret: required('JWT_SECRET'),
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    },
    sheets: {
      spreadsheetId: required('SHEETS_SPREADSHEET_ID'),
      clientEmail: required('SHEETS_CLIENT_EMAIL'),
      privateKey: required('SHEETS_PRIVATE_KEY'),
      dealsRange: process.env.SHEETS_DEALS_RANGE,
      summaryRange: process.env.SHEETS_SUMMARY_RANGE,
      columnMappingJson: process.env.SHEETS_COLUMN_MAPPING_JSON,
    },
    sync: {
      intervalMs: parseIntEnv('SYNC_INTERVAL_MS', 5 * 60 * 1000),
    },
  };
}

