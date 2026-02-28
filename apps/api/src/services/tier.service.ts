import { dbPool } from '../config/db.js';
import mysql from 'mysql2/promise';

export class TierService {
    static async getActiveTiers() {
        const today = new Date().toISOString().split('T')[0];
        return this.getTiersForMonth(today);
    }

    static async getTiersForMonth(dateLabel: string) {
        // Handle YYYY-MM by adding -01
        const targetDate = dateLabel.length === 7 ? `${dateLabel}-01` : dateLabel;

        console.log(`[TierService] Fetching tiers for date: ${targetDate}`);
        const [rows] = await dbPool.query<mysql.RowDataPacket[]>(
            `SELECT t.*, v.id as version_id
             FROM commission_tiers t
             JOIN commission_tier_versions v ON t.version_id = v.id
             WHERE v.is_default = 1 OR (? BETWEEN v.effective_from AND COALESCE(v.effective_to, '9999-12-31'))
             ORDER BY v.is_default ASC, v.effective_from DESC, t.level ASC`,
            [targetDate]
        );

        console.log(`[TierService] Found ${rows.length} rows`);

        if (rows.length === 0) return [];

        // Return only tiers from the most relevant version (first one in sorted order)
        const versionId = rows[0].version_id;
        return rows.filter(r => r.version_id === versionId).map(r => {
            const rawFrom = r.amount_from !== undefined ? r.amount_from : r.from;
            const rawTo = r.amount_to !== undefined ? r.amount_to : r.to;

            return {
                id: r.id,
                level: r.level,
                from: rawFrom !== null && rawFrom !== undefined ? Number(rawFrom) : 0,
                to: rawTo !== null && rawTo !== undefined ? Number(rawTo) : null,
                percent: Number(r.percent)
            };
        });
    }

    static async createNewVersion(data: {
        effectiveFrom: string,
        tiers: { level: number, from: number, to: number | null, percent: number }[]
    }) {
        const conn = await dbPool.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Create version record
            const [vResult] = await conn.query<mysql.ResultSetHeader>(
                'INSERT INTO commission_tier_versions (effective_from, is_default) VALUES (?, 0)',
                [data.effectiveFrom]
            );
            const versionId = vResult.insertId;

            // 2. Insert tiers
            for (const t of data.tiers) {
                await conn.query(
                    'INSERT INTO commission_tiers (version_id, level, amount_from, amount_to, percent) VALUES (?, ?, ?, ?, ?)',
                    [versionId, t.level, t.from, t.to, t.percent]
                );
            }

            await conn.commit();
            return versionId;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }
}
