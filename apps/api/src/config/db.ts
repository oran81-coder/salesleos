import mysql from 'mysql2/promise';
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
});

/**
 * Mocking wrapper for dbPool to allow local development without MySQL.
 */
export const dbPool = {
  async query(sql: string, params?: any[]): Promise<[any, any]> {
    const isMockMode = process.env.USE_MOCK_DATA === 'true';

    if (!isMockMode) {
      try {
        return await realPool.query(sql, params);
      } catch (err) {
        console.warn('Real DB connection failed, falling back to mock logic...', (err as Error).message);
      }
    }

    const sqlNormalized = sql.toLowerCase().trim();
    console.log('[MockDB] Query:', sqlNormalized.substring(0, 150));

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
      return [[{
        setting_key: 'sheets_mapping', setting_value: JSON.stringify({
          deals: { repName: 0, dealAmount: 1, bonus: 2, dealId: 3, dealDate: 4 },
          summary: { repName: 0, totalSalesAmount: 1, bonusBaseRaw: 2, offsetAmount: 3, targetAmount: 4 }
        })
      }], null];
    }

    if (sqlNormalized.startsWith('insert into system_settings')) {
      return [{ affectedRows: 1 } as mysql.ResultSetHeader, null];
    }

    // SPECIAL: MOCK HEADERS FOR SETTINGS UI
    if (sqlNormalized.includes('headers_mock')) {
      return [[
        ['Name', 'Amount', 'Bonus', 'Deal ID', 'Date', 'Status', 'Notes'], // Deals
        ['Rep Name', 'Total Sales', 'Raw Bonus', 'Offset', 'Target', 'Avg Deal', 'Deals Count'] // Summary
      ], null];
    }

    // LEADERBOARD / SUMMARY
    if (sqlNormalized.includes('rep_monthly_summary')) {
      const monthParam = params?.find(p => typeof p === 'string' && p.match(/^\d{4}-\d{2}-\d{2}$/));
      const numParams = params?.filter(p => typeof p === 'number') || [];

      const data = mockLeaderboardStore[monthParam || '2024-03-01'] || mockLeaderboardStore['2024-03-01'];

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
      if (sqlNormalized.includes('rep_id = ?') && !sqlNormalized.includes('department_id = ?')) {
        const repId = numParams[0];
        const row = data.find(r => r.repId === repId);
        const mappedRow = row ? {
          ...row,
          rep_id: row.repId,
          total_sales_amount: row.TotalSales,
          TotalSales: row.TotalSales,
          total_collection_amount: row.ActualCollection,
          ActualCollection: row.ActualCollection,
          number_of_deals: row.DealsCount,
          DealsCount: row.DealsCount,
          target_amount: row.Target,
          Target: row.Target,
          average_deal_size: row.AvgDealSize,
          AvgDealSize: row.AvgDealSize,
          bonus_base_raw: row.BonusBaseRaw,
          BonusBaseRaw: row.BonusBaseRaw,
          offset_amount: row.Offset,
          Offset: row.Offset,
          net_bonus: (row.BonusBaseRaw || 0) - (row.Offset || 0),
          FinalBonusPayout: (row.BonusBaseRaw || 0) - (row.Offset || 0),
          sheet_month: monthParam
        } : null;
        return [mappedRow ? [mappedRow] : [], null];
      }

      // 3. Handle Department query (department_id = ?) or full leaderboard
      const deptId = numParams.find((_, idx) => {
        // If the query has multiple numbers, the one for department_id is usually last in these queries
        // Actually, let's just check if the SQL has department_id
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
        TotalSales: r.TotalSales,
        total_collection_amount: r.ActualCollection,
        ActualCollection: r.ActualCollection,
        number_of_deals: r.DealsCount,
        DealsCount: r.DealsCount,
        target_amount: r.Target,
        Target: r.Target,
        average_deal_size: r.AvgDealSize,
        AvgDealSize: r.AvgDealSize,
        bonus_base_raw: r.BonusBaseRaw,
        BonusBaseRaw: r.BonusBaseRaw,
        offset_amount: r.Offset,
        Offset: r.Offset,
        net_bonus: (r.BonusBaseRaw || 0) - (r.Offset || 0),
        FinalBonusPayout: (r.BonusBaseRaw || 0) - (r.Offset || 0),
        sheet_month: monthParam
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
      return [mockUsers, null];
    }

    // USERS - INSERT
    if (sqlNormalized.startsWith('insert into users')) {
      const newUser = {
        id: mockUsers.length + 1,
        full_name: params?.[0],
        email: params?.[1],
        role: params?.[2],
        department_id: params?.[3],
        is_active: 1
      };
      mockUsers.push(newUser);
      console.log('[MockDB] Inserted user:', newUser.full_name);
      return [{ insertId: newUser.id } as mysql.ResultSetHeader, null];
    }

    // USERS - UPDATE
    if (sqlNormalized.startsWith('update users')) {
      const id = params?.[params.length - 1];
      const userIndex = mockUsers.findIndex(u => u.id === id);
      if (userIndex !== -1) {
        if (sqlNormalized.includes('set is_active = ?')) {
          mockUsers[userIndex].is_active = params?.[0];
        } else {
          mockUsers[userIndex].full_name = params?.[0];
          mockUsers[userIndex].email = params?.[1];
          mockUsers[userIndex].role = params?.[2];
          mockUsers[userIndex].department_id = params?.[3];
        }
      }
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
