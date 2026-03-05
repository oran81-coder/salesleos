import { dbPool } from '../config/db.js';
import mysql from 'mysql2/promise';
import { calculateMonthlyBonus } from '@laos/bonus-engine';
import { TierService } from './tier.service.js';
import { parseHebrewMonthTab } from '../../../sync-worker/src/sync.service.js';

export class KPIService {
    /**
     * Gets department leaderboard for a specific month
     */
    static async getLeaderboard(departmentId: number | null, monthLabel: string) {
        let sheetMonth = monthLabel;
        if (!sheetMonth.includes('-')) {
            const parsed = parseHebrewMonthTab(monthLabel);
            if (parsed) sheetMonth = parsed;
        } else if (sheetMonth.length === 7) {
            sheetMonth = `${sheetMonth}-01`;
        }

        // Fetch tiers for the specific month
        const tiers = await TierService.getTiersForMonth(monthLabel);

        let sql = `
      SELECT 
        u.id as repId,
        u.full_name as repName,
        d.name as departmentName,
        s.total_sales_amount as TotalSales,
        s.total_collection_amount as ActualCollection,
        s.number_of_deals as DealsCount,
        s.target_amount as Target,
        s.average_deal_size as AvgDealSize,
        s.bonus_base_raw as BonusBaseRaw,
        s.offset_amount as Offset
      FROM rep_monthly_summary s
      JOIN users u ON s.rep_id = u.id
      JOIN departments d ON u.department_id = d.id
      WHERE s.sheet_month = ?
    `;
        const params: any[] = [sheetMonth];

        if (departmentId) {
            sql += ' AND u.department_id = ?';
            params.push(departmentId);
        }

        sql += ' ORDER BY s.total_sales_amount DESC';

        const [rows] = await dbPool.query<mysql.RowDataPacket[]>(sql, params);

        // Fetch deal stats
        const [dealStats] = await dbPool.query<mysql.RowDataPacket[]>(`
            SELECT 
                rep_id,
                COUNT(*) as actualDealsCount
            FROM deals
            WHERE sheet_month = ? 
              AND MONTH(deal_date) = MONTH(?) 
              AND YEAR(deal_date) = YEAR(?)
            GROUP BY rep_id
        `, [sheetMonth, sheetMonth, sheetMonth]);

        const dealStatsMap = new Map(dealStats.map(s => [Number(s.rep_id), s.actualDealsCount]));

        // Fetch global monthly target
        const globalTarget = await this.getMonthlyTarget(monthLabel);

        // Calculate bonuses using the engine
        return rows.map((row, index) => {
            const raw = Number(row.BonusBaseRaw || 0);
            const offset = Number(row.Offset || 0);

            const result = calculateMonthlyBonus({
                bonusBaseRaw: raw,
                offsetAmount: offset,
                tiers
            });

            if (isNaN(result.payout)) {
                console.error('Bonus calculation resulted in NaN', { raw, offset, tiersCount: tiers.length });
            }

            const target = Number(row.Target) || globalTarget || 0;
            const deals = Number(row.DealsCount || 0);
            const sales = Number(row.TotalSales || 0);
            const avgDeal = deals > 0 ? sales / deals : 0;

            return {
                ...row,
                DealsCount: deals,
                Target: target,
                AvgDealSize: avgDeal,
                BonusBaseNet: result.bonusBaseNet,
                FinalBonusPayout: result.payout,
                TargetAchievement: target ? (sales / target) * 100 : 0,
                rank: index + 1
            };
        });
    }

    /**
     * Gets the global monthly target for a specific month.
     * Defaults to 100,000 if not set.
     */
    static async getMonthlyTarget(monthLabel: string): Promise<number> {
        let sheetMonth = monthLabel;
        if (!sheetMonth.includes('-')) {
            const parsed = parseHebrewMonthTab(monthLabel);
            if (parsed) sheetMonth = parsed;
        } else if (sheetMonth.length === 7) {
            sheetMonth = `${sheetMonth}-01`;
        }
        const key = `target_${sheetMonth}`;

        const [rows] = await dbPool.query<mysql.RowDataPacket[]>(
            'SELECT setting_value FROM system_settings WHERE setting_key = ?',
            [key]
        );

        if (rows.length === 0) return 100000;
        return Number(rows[0].setting_value);
    }

    /**
     * Sets the global monthly target for a specific month.
     */
    static async setMonthlyTarget(monthLabel: string, target: number) {
        let sheetMonth = monthLabel;
        if (!sheetMonth.includes('-')) {
            const parsed = parseHebrewMonthTab(monthLabel);
            if (parsed) sheetMonth = parsed;
        } else if (sheetMonth.length === 7) {
            sheetMonth = `${sheetMonth}-01`;
        }
        const key = `target_${sheetMonth}`;

        await dbPool.query(
            'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
            [key, String(target)]
        );
    }

    /**
     * Gets percentile rankings and department averages for a specific representative
     */
    static async getRepRankings(repId: number, monthLabel: string) {
        let sheetMonth = monthLabel;
        if (!sheetMonth.includes('-')) {
            const parsed = parseHebrewMonthTab(monthLabel);
            if (parsed) sheetMonth = parsed;
        } else if (sheetMonth.length === 7) {
            sheetMonth = `${sheetMonth}-01`;
        }

        const [repRows] = await dbPool.query<mysql.RowDataPacket[]>(
            'SELECT department_id FROM users WHERE id = ?',
            [repId]
        );
        const departmentId = repRows[0]?.department_id;

        const [allReps] = await dbPool.query<mysql.RowDataPacket[]>(
            `SELECT s.rep_id, s.total_sales_amount, s.total_collection_amount, s.number_of_deals, (s.bonus_base_raw - s.offset_amount) as net_bonus
             FROM rep_monthly_summary s
             JOIN users u ON s.rep_id = u.id
             WHERE s.sheet_month = ? AND u.department_id = ?`,
            [sheetMonth, departmentId]
        );

        if (allReps.length === 0) return null;

        const target = allReps.find(r => Number(r.rep_id) === Number(repId));
        if (!target) return null;

        const calculatePercentile = (field: string, value: number) => {
            const lower = allReps.filter(r => Number(r[field]) < value).length;
            return Math.round((lower / allReps.length) * 100);
        };

        const calculateAverage = (field: string) => {
            const sum = allReps.reduce((acc, r) => acc + Number(r[field]), 0);
            return sum / allReps.length;
        };

        const [repDeals] = await dbPool.query<mysql.RowDataPacket[]>(
            'SELECT is_renewal FROM deals WHERE sheet_month = ? AND rep_id = ?',
            [sheetMonth, repId]
        );
        const newDeals = repDeals.filter(d => !d.is_renewal).length;
        const renewals = repDeals.filter(d => d.is_renewal).length;

        return {
            salesPercentile: calculatePercentile('total_sales_amount', Number(target.total_sales_amount)),
            dealsPercentile: calculatePercentile('number_of_deals', Number(target.number_of_deals)),
            bonusPercentile: calculatePercentile('net_bonus', Number(target.net_bonus)),
            averages: {
                sales: calculateAverage('total_sales_amount'),
                collection: calculateAverage('total_collection_amount'),
                deals: calculateAverage('number_of_deals'),
                bonus: calculateAverage('net_bonus')
            },
            personal: {
                sales: Number(target.total_sales_amount),
                collection: Number(target.total_collection_amount || 0),
                deals: Number(target.number_of_deals),
                bonus: Number(target.net_bonus),
                newDeals,
                renewals
            }
        };
    }

    /**
     * Gets aggregated summary for a department
     */
    static async getDepartmentSummary(departmentId: any, monthLabel: string) {
        let sheetMonth = monthLabel;
        if (!sheetMonth.includes('-')) {
            const parsed = parseHebrewMonthTab(monthLabel);
            if (parsed) sheetMonth = parsed;
        } else if (sheetMonth.length === 7) {
            sheetMonth = `${sheetMonth}-01`;
        }

        let summarySql = `
            SELECT 
                SUM(total_sales_amount) as totalSales,
                SUM(total_collection_amount - offset_amount) as totalCollection,
                SUM(offset_amount) as totalOffset,
                SUM(number_of_deals) as totalDeals
            FROM rep_monthly_summary s
            JOIN users u ON s.rep_id = u.id
            WHERE s.sheet_month = ?
        `;
        const summaryParams: any[] = [sheetMonth];

        const effectiveDeptId = (departmentId === null || departmentId === undefined || departmentId === '' || departmentId === 'null' || departmentId === 'undefined')
            ? null
            : Number(departmentId);

        if (effectiveDeptId !== null && !isNaN(effectiveDeptId)) {
            summarySql += ' AND u.department_id = ?';
            summaryParams.push(effectiveDeptId);
        }

        const [summaryRows] = await dbPool.query<mysql.RowDataPacket[]>(summarySql, summaryParams);
        const totals = summaryRows[0] || { totalSales: 0, totalCollection: 0, totalDeals: 0 };

        let dealsSql = `
            SELECT is_renewal, COUNT(*) as count
            FROM deals d
            JOIN users u ON d.rep_id = u.id
            WHERE d.sheet_month = ? 
              AND MONTH(d.deal_date) = MONTH(?) 
              AND YEAR(d.deal_date) = YEAR(?)
        `;
        const dealsParams: any[] = [sheetMonth, sheetMonth, sheetMonth];
        if (effectiveDeptId !== null && !isNaN(effectiveDeptId)) {
            dealsSql += ' AND u.department_id = ?';
            dealsParams.push(effectiveDeptId);
        }
        dealsSql += ' GROUP BY is_renewal';

        const [dealRows] = await dbPool.query<mysql.RowDataPacket[]>(dealsSql, dealsParams);

        let newDeals = 0;
        let renewals = 0;
        let totalFilteredDeals = 0;
        dealRows.forEach(row => {
            const count = Number(row.count);
            if (row.is_renewal) renewals += count;
            else newDeals += count;
            totalFilteredDeals += count;
        });

        return {
            totalSales: Number(totals.totalSales || 0),
            totalCollection: Number(totals.totalCollection || 0),
            totalOffset: Number(totals.totalOffset || 0),
            totalDeals: totalFilteredDeals,
            newDeals,
            renewals
        };
    }

    /**
     * Gets all data required for the accounting PDF report
     */
    static async getAccountingReportData(departmentId: number | null, monthLabel: string) {
        let sheetMonth = monthLabel;
        if (!sheetMonth.includes('-')) {
            const parsed = parseHebrewMonthTab(monthLabel);
            if (parsed) sheetMonth = parsed;
        } else if (sheetMonth.length === 7) {
            sheetMonth = `${sheetMonth}-01`;
        }

        const [summary, leaderboard, allDeals] = await Promise.all([
            this.getDepartmentSummary(departmentId, monthLabel),
            this.getLeaderboard(departmentId, monthLabel),
            dbPool.query<mysql.RowDataPacket[]>(`
                SELECT 
                    d.deal_date,
                    d.customer_name,
                    d.deal_amount,
                    d.bonus_requested,
                    d.is_renewal,
                    d.deal_id,
                    u.full_name as repName,
                    (
                        SELECT SUM(d2.bonus_requested)
                        FROM deals d2
                        WHERE d2.deal_id = d.deal_id 
                          AND d.deal_id IS NOT NULL 
                          AND d.deal_id != ''
                          AND d2.sheet_month <= d.sheet_month
                    ) as cumulativeCollection
                FROM deals d
                JOIN users u ON d.rep_id = u.id
                WHERE d.sheet_month = ?
                ${departmentId ? 'AND u.department_id = ?' : ''}
                ORDER BY d.deal_date ASC
            `, departmentId ? [sheetMonth, departmentId] : [sheetMonth])
        ]);

        return {
            summary,
            leaderboard,
            deals: allDeals[0],
            monthLabel
        };
    }
}
