import mysql from 'mysql2/promise';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getAppConfig } from './env.js';
import { mockLeaderboardStore, mockTiers, mockUsers, mockDepartments, mockDeals, mockApprovals, mockDeferredBonuses } from './mock-data.js';

const config = getAppConfig();

const realPool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

/**
 * Mocking wrapper for dbPool to allow local development without MySQL.
 */
// File-backed settings store — persists mapping across server restarts (dev only)
const SETTINGS_FILE = join(process.cwd(), '.dev-mock-settings.json');

const DEFAULT_SETTINGS: Record<string, string> = {
  sheets_mapping: JSON.stringify({
    deals: { dealDate: 0, isRenewal: 10, dealId: 2, repName: 3, customerName: 4, dealAmount: 5, bonus: 8, collectionAmount: 8 },
    summary: {
      repName: 13,
      totalSalesAmount: 14,
      totalCollectionAmount: 14, // Using sales as collection for now if not separate
      offsetAmount: 17,
      numberOfDeals: 14, // Mock/Approx
      averageDealSize: 14, // Mock/Approx
      bonusBaseRaw: 16,
      targetAmount: 14
    }
  })
};

function loadMockSettings(): Record<string, string> {
  try {
    if (existsSync(SETTINGS_FILE)) {
      const parsed = JSON.parse(readFileSync(SETTINGS_FILE, 'utf-8'));
      console.log('[MockDB] Loaded settings from', SETTINGS_FILE);
      return parsed;
    }
  } catch (e) {
    console.warn('[MockDB] Failed to load settings file, using defaults:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

function saveMockSettings(store: Record<string, string>) {
  try {
    writeFileSync(SETTINGS_FILE, JSON.stringify(store, null, 2), 'utf-8');
    console.log('[MockDB] Settings persisted to', SETTINGS_FILE);
  } catch (e) {
    console.warn('[MockDB] Failed to persist settings to file:', e);
  }
}

const mockSettingsStore: Record<string, string> = loadMockSettings();

// File-backed users store — persists added/updated users across server restarts (dev only)
const USERS_FILE = join(process.cwd(), '.dev-mock-users.json');

function loadPersistedUsers(): void {
  try {
    if (existsSync(USERS_FILE)) {
      const saved = JSON.parse(readFileSync(USERS_FILE, 'utf-8'));
      if (Array.isArray(saved) && saved.length > 0) {
        // Splice in place so the imported array reference stays valid
        mockUsers.splice(0, mockUsers.length, ...saved);
        console.log(`[MockDB] Loaded ${saved.length} users from`, USERS_FILE);
      }
    }
  } catch (e) {
    console.warn('[MockDB] Failed to load users file, using defaults:', e);
  }
}

function savePersistedUsers(): void {
  try {
    writeFileSync(USERS_FILE, JSON.stringify(mockUsers, null, 2), 'utf-8');
    console.log(`[MockDB] Persisted ${mockUsers.length} users to`, USERS_FILE);
  } catch (e) {
    console.warn('[MockDB] Failed to persist users to file:', e);
  }
}

// Load on startup
loadPersistedUsers();

export const dbPool = {
  async query(sql: string, params?: any[]): Promise<[any, any]> {
    const isMockMode = process.env.USE_MOCK_DATA === 'true';

    // Original behaviour: try real DB, but in local dev fall back to mock store
    // so the panel can work even בלי MySQL. לא נוגעים בלוגיקת הבונוסים.
    if (!isMockMode) {
      try {
        return await realPool.query(sql, params);
      } catch (err) {
        // Distinguish between connection errors and SQL syntax/value errors
        const isConnectionError = (err as any).code?.startsWith('ER_CON_') || (err as any).code === 'PROTOCOL_CONNECTION_LOST' || (err as any).code === 'ECONNREFUSED';

        if (isConnectionError) {
          console.warn(
            'Real DB connection failed, falling back to mock logic...',
            (err as Error).message,
          );
        } else {
          console.error('[DB] SQL Query Failed:', (err as Error).message);
          // Re-throw if it's a real logic error so we don't hide it with mock fallback blindly
          throw err;
        }
      }
    }

    const sqlNormalized = sql.toLowerCase().trim();

    // DEALS
    if (sqlNormalized.includes('from deals')) {
      const month = params?.[0];
      const deptId = params?.find(p => typeof p === 'number'); // Robust check

      const filtered = mockDeals.filter(d =>
        (!month || d.sheet_month === month) &&
        (!deptId || d.department_id === deptId)
      );

      // Support COUNT(*) queries for dept summary
      if (sqlNormalized.includes('count(*)')) {
        if (sqlNormalized.includes('group by is_renewal')) {
          const renewals = filtered.filter(d => d.is_renewal).length;
          const newDeals = filtered.filter(d => !d.is_renewal).length;
          return [[
            { is_renewal: 1, count: renewals },
            { is_renewal: 0, count: newDeals }
          ], null];
        }
        return [[{ count: filtered.length }], null];
      }

      return [filtered, null];
    }

    // APPROVALS
    if (sqlNormalized.includes('from bonus_approvals')) {
      return [mockApprovals, null];
    }

    // DEFERRED
    if (sqlNormalized.includes('from deferred_bonuses')) {
      return [mockDeferredBonuses, null];
    }

    // SYSTEM SETTINGS (MUST BE BEFORE USERS)
    if (sqlNormalized.includes('from system_settings')) {
      const key = 'sheets_mapping';
      const stored = mockSettingsStore[key];
      return stored ? [[{ setting_key: key, setting_value: stored }], null] : [[], null];
    }

    if (sqlNormalized.startsWith('insert into system_settings')) {
      // ON DUPLICATE KEY UPDATE – persist the new value on disk too
      const newValue = params?.[0];
      if (newValue !== undefined) {
        mockSettingsStore['sheets_mapping'] = newValue;
        saveMockSettings(mockSettingsStore);
        console.log('[MockDB] Saved sheets_mapping:', newValue.substring(0, 120));
      }
      return [{ affectedRows: 1 } as mysql.ResultSetHeader, null];
    }

    // SPECIAL: MOCK HEADERS FOR SETTINGS UI
    if (sqlNormalized.includes('headers_mock')) {
      return [[
        ['Name', 'Amount', 'Bonus', 'Deal ID', 'Date', 'Status', 'Notes'], // Deals
        ['Rep Name', 'Total Sales', 'Raw Bonus', 'Offset', 'Target', 'Avg Deal', 'Deals Count'] // Summary
      ], null];
    }

    // REP MONTHLY SUMMARY - INSERT (from sync)
    // Intercept sync writes and store them in mockLeaderboardStore so the leaderboard picks them up.
    // INSERT INTO rep_monthly_summary (rep_id, dept_id, sheet_month, total_sales, total_collection, num_deals, target, avg_deal, bonus_raw, offset, tab_name) VALUES ?
    if (sqlNormalized.startsWith('insert into rep_monthly_summary') || sqlNormalized.includes('insert into rep_monthly_summary')) {
      const rowsToInsert: any[][] = params?.[0] || [];
      for (const row of rowsToInsert) {
        // IMPORTANT: Must match the order of columns pushed in sync.service.ts (11 items)
        // [rep_id, department_id, sheet_month, total_sales_amount, total_collection_amount, number_of_deals, target_amount, average_deal_size, bonus_base_raw, offset_amount, sheet_tab_name]
        const [repId, deptId, sheetMonth, totalSales, totalCollection, numDeals, target, avgDeal, bonusRaw, offset, tabName] = row;
        if (!sheetMonth) continue;
        const user = mockUsers.find(u => u.id === repId);
        const dept = mockDepartments.find(d => d.id === deptId);
        if (!mockLeaderboardStore[sheetMonth]) mockLeaderboardStore[sheetMonth] = [];
        const existing = mockLeaderboardStore[sheetMonth].findIndex(r => r.repId === repId);
        const entry = {
          repId,
          repName: user?.full_name || `Rep #${repId}`,
          departmentName: dept?.name || 'מכירות',
          TotalSales: Number(totalSales) || 0,
          ActualCollection: Number(totalCollection) || 0,
          DealsCount: Number(numDeals) || 0,
          Target: Number(target) || 0,
          TargetAchievement: target ? (Number(totalSales) / Number(target)) * 100 : 0,
          AvgDealSize: Number(avgDeal) || 0,
          BonusBaseRaw: Number(bonusRaw) || 0,
          Offset: Number(offset) || 0,
          BonusBaseNet: (Number(bonusRaw) || 0) - (Number(offset) || 0),
          rank: 0
        };
        if (existing >= 0) {
          mockLeaderboardStore[sheetMonth][existing] = entry;
        } else {
          mockLeaderboardStore[sheetMonth].push(entry);
        }
      }
      // Re-sort and re-rank all affected months
      Object.keys(mockLeaderboardStore).forEach(m => {
        mockLeaderboardStore[m].sort((a, b) => b.TotalSales - a.TotalSales);
        mockLeaderboardStore[m].forEach((r, i) => { r.rank = i + 1; });
      });
      return [{ affectedRows: rowsToInsert.length } as mysql.ResultSetHeader, null];
    }

    // LEADERBOARD / SUMMARY - SELECT
    if (sqlNormalized.includes('rep_monthly_summary')) {
      const monthParam = params?.find(p => typeof p === 'string' && p.match(/^\d{4}-\d{2}-\d{2}$/));
      const numParams = params?.filter(p => typeof p === 'number') || [];

      // Return empty array for months with no data (no 2024-03 fallback)
      const data = mockLeaderboardStore[monthParam || ''] || [];

      // 1. Handle Aggregation (SUM) for Department Summary
      if (sqlNormalized.includes('sum(')) {
        const deptId = numParams[0];
        const filtered = deptId
          ? data.filter(r => mockUsers.find(u => u.id === r.repId)?.department_id === deptId)
          : data;

        return [[{
          totalSales: filtered.reduce((acc, r) => acc + (r.TotalSales || 0), 0),
          totalCollection: filtered.reduce((acc, r) => acc + (r.ActualCollection || 0), 0),
          totalDeals: filtered.reduce((acc, r) => acc + (r.DealsCount || 0), 0)
        }], null];
      }

      // 2. Handle Single Representative query (rep_id = ?)
      if (sqlNormalized.includes('rep_id = ?')) {
        const repId = numParams[0];
        const row = data.find(r => r.repId === repId);
        const mappedRow = row ? {
          ...row,
          rep_id: row.repId,
          total_sales_amount: row.TotalSales,
          total_collection_amount: row.ActualCollection,
          number_of_deals: row.DealsCount,
          target_amount: row.Target,
          average_deal_size: row.AvgDealSize,
          bonus_base_raw: row.BonusBaseRaw,
          offset_amount: row.Offset,
          net_bonus: (row.BonusBaseRaw || 0) - (row.Offset || 0)
        } : null;
        return [mappedRow ? [mappedRow] : [], null];
      }

      // 3. Handle Department query (department_id = ?) or full leaderboard
      const deptId = numParams.find((_, idx) => {
        return sqlNormalized.includes('department_id = ?');
      }) ? numParams[numParams.length - 1] : null;

      let filteredData = data;
      if (deptId) {
        filteredData = data.filter(r => mockUsers.find(u => u.id === r.repId)?.department_id === deptId);
      }

      const mappedData = filteredData.map(r => ({
        ...r,
        rep_id: r.repId,
        total_sales_amount: r.TotalSales,
        total_collection_amount: r.ActualCollection,
        number_of_deals: r.DealsCount,
        target_amount: r.Target,
        average_deal_size: r.AvgDealSize,
        bonus_base_raw: r.BonusBaseRaw,
        offset_amount: r.Offset,
        net_bonus: (r.BonusBaseRaw || 0) - (r.Offset || 0),
        FinalBonusPayout: (r.BonusBaseRaw || 0) - (r.Offset || 0)
      }));
      return [mappedData, null];
    }

    // DEPARTMENTS
    if (sqlNormalized.includes('from departments')) {
      return [mockDepartments, null];
    }

    // COMMISSION TIERS
    if (sqlNormalized.includes('commission_tiers') || sqlNormalized.includes('tiers')) {
      // Map mockTiers to match the DB schema (amount_from, amount_to, etc.)
      const dbTiers = mockTiers.map(t => ({
        ...t,
        version_id: 1, // Default mock version
        amount_from: t.from,
        amount_to: t.to
      }));
      console.log(`[MockDB] Returning ${dbTiers.length} tiers. Sample amount_from: ${dbTiers[0].amount_from}`);
      return [dbTiers, null];
    }

    // USERS - SELECT
    if (sqlNormalized.startsWith('select') && sqlNormalized.includes('from users')) {
      if (sqlNormalized.includes('where')) {
        const search = (params?.[0] || '').toString().toLowerCase();
        const filtered = mockUsers.filter(u =>
          u.full_name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          (u.sheet_name && u.sheet_name.toLowerCase().includes(search))
        );
        return [filtered, null];
      }
      return [mockUsers, null];
    }

    // USERS - INSERT
    // SQL: INSERT INTO users (full_name, sheet_name, email, role, department_id, password_hash)
    // params:                [0]         [1]          [2]   [3]   [4]             [5]
    if (sqlNormalized.startsWith('insert into users')) {
      const newUser = {
        id: mockUsers.length + 1,
        full_name: params?.[0],
        sheet_name: params?.[1] || null,
        email: params?.[2],
        role: params?.[3],
        department_id: params?.[4],
        is_active: 1
      };
      mockUsers.push(newUser);
      savePersistedUsers();
      console.log('[MockDB] Inserted user:', newUser.full_name, '/', newUser.email);
      return [{ insertId: newUser.id } as mysql.ResultSetHeader, null];
    }

    // USERS - UPDATE
    // SQL: UPDATE users SET full_name=?, sheet_name=?, email=?, role=?, department_id=? [, is_active=?] WHERE id=?
    if (sqlNormalized.startsWith('update users')) {
      const id = params?.[params.length - 1];
      const userIndex = mockUsers.findIndex(u => u.id === id);
      if (userIndex !== -1) {
        if (sqlNormalized.includes('set is_active = ?')) {
          mockUsers[userIndex].is_active = params?.[0];
        } else {
          mockUsers[userIndex].full_name = params?.[0];
          mockUsers[userIndex].sheet_name = params?.[1] || null;
          mockUsers[userIndex].email = params?.[2];
          mockUsers[userIndex].role = params?.[3];
          mockUsers[userIndex].department_id = params?.[4];
        }
      }
      savePersistedUsers();
      return [{ affectedRows: 1 } as mysql.ResultSetHeader, null];
    }

    console.warn('[MockDB] Unhandled query:', sql);
    return [[], null];
  },

  async execute(sql: string, params?: any[]): Promise<[any, any]> {
    return this.query(sql, params);
  },

  async getConnection() {
    return {
      query: this.query.bind(this),
      execute: this.execute.bind(this),
      release: () => { },
      beginTransaction: async () => { },
      commit: async () => { },
      rollback: async () => { },
    };
  }
} as any;
