import { dbPool } from '../config/db.js';
import { calculateMonthlyBonus, calculateEligibleBonusAmount } from '@laos/bonus-engine';
import { TierService } from './tier.service.js';
import type {
    BonusCalculationSnapshot,
    BonusApproval,
    DeferredBonus,
    MonthlyBonusResult
} from '@laos/shared-types';
import mysql from 'mysql2/promise';

export class BonusService {
    /**
     * Calculates current monthly bonus for a rep based on synced summary and latest tier rules.
     */
    static async getMonthlyBonus(repId: number, monthLabel: string) {
        const sheetMonth = monthLabel.length === 7 ? `${monthLabel}-01` : monthLabel;
        console.log(`[BonusService] Fetching monthly bonus for rep ${repId} month ${sheetMonth}`);

        const [summaryRows] = await dbPool.query<mysql.RowDataPacket[]>(
            'SELECT * FROM rep_monthly_summary WHERE rep_id = ? AND sheet_month = ?',
            [repId, sheetMonth]
        );

        console.log(`[BonusService] Found ${summaryRows.length} summary rows`);

        if (summaryRows.length === 0) return null;
        const summary = summaryRows[0];

        // Fetch active commission tiers for this month using TierService
        const tiers = await TierService.getTiersForMonth(sheetMonth);

        if (tiers.length === 0) throw new Error('No commission tiers found for the given month');

        const result = calculateMonthlyBonus({
            bonusBaseRaw: Number(summary.bonus_base_raw),
            offsetAmount: Number(summary.offset_amount),
            tiers
        });

        return {
            ...result,
            summary,
            tierVersionId: tiers[0].version_id // Assuming getTiersForMonth adds version_id to tier objects or we handle it
        };
    }

    /**
     * Records a manual bonus approval (partial or full)
     */
    static async approveBonus(data: {
        repId: number,
        departmentId: number,
        sheetMonth: string,
        dealId?: string,
        legacyKey?: string,
        amount: number,
        approvedByUserId: number,
        payoutMonth?: string // If provided, creates a deferral
    }) {
        const conn = await dbPool.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Calculate eligible amount to prevent overpayment (duplicate prevention)
            // First, get requested bonus for this deal from synced records
            let requestedBonus = 0;
            let dealDbId: number | null = null;

            if (data.dealId || data.legacyKey) {
                const [dealRows] = await conn.query<mysql.RowDataPacket[]>(
                    'SELECT id, bonus_requested FROM deals WHERE (deal_id = ? OR legacy_key = ?) AND rep_id = ?',
                    [data.dealId || null, data.legacyKey || null, data.repId]
                );
                if (dealRows.length > 0) {
                    requestedBonus = Number(dealRows[0].bonus_requested);
                    dealDbId = dealRows[0].id;
                }
            }

            // Get previous paid amount
            const [approvalRows] = await conn.query<mysql.RowDataPacket[]>(
                'SELECT SUM(approved_amount) as total_paid FROM bonus_approvals WHERE (deal_id = ? OR legacy_key = ?) AND status = "approved"',
                [data.dealId || null, data.legacyKey || null]
            );
            const previousPaid = Number(approvalRows[0].total_paid || 0);

            const eligibleNow = calculateEligibleBonusAmount(requestedBonus, previousPaid);

            if (data.amount > eligibleNow) {
                throw new Error(`Approval amount (${data.amount}) exceeds eligible remaining amount (${eligibleNow})`);
            }

            // 2. Insert approval
            const [approvalResult] = await conn.query<mysql.ResultSetHeader>(
                `INSERT INTO bonus_approvals (deal_id, legacy_key, deal_db_id, rep_id, department_id, sheet_month, approved_amount, approved_by_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [data.dealId || null, data.legacyKey || null, dealDbId, data.repId, data.departmentId, data.sheetMonth, data.amount, data.approvedByUserId]
            );
            const approvalId = approvalResult.insertId;

            // 3. Handle deferral if payoutMonth is different from sheetMonth
            if (data.payoutMonth && data.payoutMonth !== data.sheetMonth) {
                await conn.query(
                    `INSERT INTO deferred_bonuses (bonus_approval_id, original_sheet_month, payout_month, deferred_amount)
           VALUES (?, ?, ?, ?)`,
                    [approvalId, data.sheetMonth, data.payoutMonth, data.amount]
                );
            }

            await conn.commit();
            return approvalId;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    static async getRepKPIs(repId: number, monthLabel: string) {
        const sheetMonth = monthLabel.length === 7 ? `${monthLabel}-01` : monthLabel;
        // This will be expanded in KPIService, but basic ones here
        const [rows] = await dbPool.query<mysql.RowDataPacket[]>(
            'SELECT * FROM rep_monthly_summary WHERE rep_id = ? AND sheet_month = ?',
            [repId, sheetMonth]
        );
        return rows[0] || null;
    }

    /**
     * Fetches all deals for a representative in a given month, 
     * including cumulative collection status (paid/total) based on lifetime history.
     */
    static async getRepDeals(repId: number, monthLabel: string) {
        const sheetMonth = monthLabel.length === 7 ? `${monthLabel}-01` : monthLabel;

        // 1. Fetch current month's deals
        const [deals] = await dbPool.query<mysql.RowDataPacket[]>(
            'SELECT * FROM deals WHERE rep_id = ? AND sheet_month = ? ORDER BY deal_date ASC',
            [repId, sheetMonth]
        );

        if (deals.length === 0) return [];

        // 2. For each deal, calculate lifetime "paid" (sum of bonus_requested up to this month)
        // Match by customer_name and rep_id. 
        // Note: sheet_month is used to limit history to current month's context.
        const enrichedDeals = await Promise.all(deals.map(async (d) => {
            const [history] = await dbPool.query<mysql.RowDataPacket[]>(
                `SELECT SUM(bonus_requested) as lifetime_paid 
                 FROM deals 
                 WHERE rep_id = ? AND customer_name = ? AND sheet_month <= ?`,
                [repId, d.customer_name, sheetMonth]
            );

            const totalPaid = Number(history[0].lifetime_paid || 0);
            const totalDealValue = Number(d.deal_amount || 0);

            return {
                ...d,
                total_paid: totalPaid,
                is_completed: totalPaid >= totalDealValue,
                status_label: `${totalPaid.toLocaleString()}/${totalDealValue.toLocaleString()}`
            };
        }));

        return enrichedDeals;
    }

    /**
     * Fetches bonuses deferred to future months for a representative
     */
    static async getDeferredBonuses(repId: number) {
        const [rows] = await dbPool.query<mysql.RowDataPacket[]>(
            `SELECT d.*, a.deal_id, a.sheet_month as original_month
             FROM deferred_bonuses d
             JOIN bonus_approvals a ON d.bonus_approval_id = a.id
             WHERE a.rep_id = ?`,
            [repId]
        );
        return rows;
    }
}
