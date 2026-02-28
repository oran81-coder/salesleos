import { dbPool } from '../config/db.js';
import mysql from 'mysql2/promise';
import { calculateMonthlyBonus } from '@laos/bonus-engine';
import { TierService } from './tier.service.js';

export class KPIService {
    /**
     * Gets department leaderboard for a specific month
     */
    static async getLeaderboard(departmentId: number | null, monthLabel: string) {
        const sheetMonth = monthLabel.length === 7 ? `${monthLabel}-01` : monthLabel;

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
      WHERE s.sheet_month = ? AND u.is_active = 1
    `;
        const params: any[] = [sheetMonth];

        if (departmentId) {
            sql += ' AND u.department_id = ?';
            params.push(departmentId);
        }

        sql += ' ORDER BY s.total_sales_amount DESC';

        const [rows] = await dbPool.query<mysql.RowDataPacket[]>(sql, params);

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

            return {
                ...row,
                BonusBaseNet: result.bonusBaseNet,
                FinalBonusPayout: result.payout,
                TargetAchievement: row.Target ? (Number(row.TotalSales) / Number(row.Target)) * 100 : 0,
                rank: index + 1
            };
        });
    }

    /**
     * Gets percentile rankings and department averages for a specific representative
     */
    static async getRepRankings(repId: number, monthLabel: string) {
        const sheetMonth = monthLabel.length === 7 ? `${monthLabel}-01` : monthLabel;

        // 1. Get the target rep's department
        const [repRows] = await dbPool.query<mysql.RowDataPacket[]>(
            'SELECT department_id FROM users WHERE id = ?',
            [repId]
        );
        const departmentId = repRows[0]?.department_id;

        // 2. Fetch all active reps in the same department for this month
        const [allReps] = await dbPool.query<mysql.RowDataPacket[]>(
            `SELECT s.rep_id, s.total_sales_amount, s.total_collection_amount, s.number_of_deals, (s.bonus_base_raw - s.offset_amount) as net_bonus
             FROM rep_monthly_summary s
             JOIN users u ON s.rep_id = u.id
             WHERE s.sheet_month = ? AND u.department_id = ? AND u.is_active = 1`,
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

        // 3. Fetch "New vs Renewals" for the rep
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
        const sheetMonth = monthLabel.includes('-') && monthLabel.length === 7 ? `${monthLabel}-01` : monthLabel;

        console.log(`[KPIService] getDepartmentSummary - month: ${sheetMonth}, rawDeptId: ${departmentId}, type: ${typeof departmentId}`);

        // 1. Aggregate totals from rep_monthly_summary
        let summarySql = `
            SELECT 
                SUM(total_sales_amount) as totalSales,
                SUM(total_collection_amount) as totalCollection,
                SUM(number_of_deals) as totalDeals
            FROM rep_monthly_summary s
            JOIN users u ON s.rep_id = u.id
            WHERE s.sheet_month = ? AND u.is_active = 1
        `;
        const summaryParams: any[] = [sheetMonth];

        // Robust check for null/undefined/empty/string "null"
        const effectiveDeptId = (departmentId === null || departmentId === undefined || departmentId === '' || departmentId === 'null' || departmentId === 'undefined')
            ? null
            : Number(departmentId);

        if (effectiveDeptId !== null && !isNaN(effectiveDeptId)) {
            console.log(`[KPIService] Applying department filter: ${effectiveDeptId}`);
            summarySql += ' AND u.department_id = ?';
            summaryParams.push(effectiveDeptId);
        } else {
            console.log(`[KPIService] No department filter applied`);
        }

        console.log(`[KPIService] Summary query params:`, summaryParams);
        const [summaryRows] = await dbPool.query<mysql.RowDataPacket[]>(summarySql, summaryParams);
        console.log(`[KPIService] Summary results:`, summaryRows);
        const totals = summaryRows[0] || { totalSales: 0, totalCollection: 0, totalDeals: 0 };

        // 2. Aggregate New vs Renewals from deals table
        let dealsSql = `
            SELECT is_renewal, COUNT(*) as count
            FROM deals d
            JOIN users u ON d.rep_id = u.id
            WHERE d.sheet_month = ? AND u.is_active = 1
        `;
        const dealsParams: any[] = [sheetMonth];
        if (effectiveDeptId !== null && !isNaN(effectiveDeptId)) {
            dealsSql += ' AND u.department_id = ?';
            dealsParams.push(effectiveDeptId);
        }
        dealsSql += ' GROUP BY is_renewal';

        console.log(`[KPIService] Deals split query params:`, dealsParams);
        const [dealRows] = await dbPool.query<mysql.RowDataPacket[]>(dealsSql, dealsParams);
        console.log(`[KPIService] Deals split results:`, dealRows);

        let newDeals = 0;
        let renewals = 0;
        dealRows.forEach(row => {
            if (row.is_renewal) renewals += Number(row.count);
            else newDeals += Number(row.count);
        });

        return {
            totalSales: Number(totals.totalSales || 0),
            totalCollection: Number(totals.totalCollection || 0),
            totalDeals: Number(totals.totalDeals || 0),
            newDeals,
            renewals
        };
    }
}
