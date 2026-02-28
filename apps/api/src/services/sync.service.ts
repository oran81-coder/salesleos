import { runSyncOnce } from '../../../sync-worker/src/sync.service.js';
import { dbPool } from '../config/db.js';
import { getAppConfig } from '../config/env.js';
import { fetchSheetValues } from '../../../sync-worker/src/sheets-client.js';
import mysql from 'mysql2/promise';

const DEFAULT_MAPPING = {
    deals: { repName: 0, dealAmount: 1, bonus: 2, dealId: 3, dealDate: 4 },
    summary: { repName: 0, totalSalesAmount: 1, bonusBaseRaw: 2, offsetAmount: 3, targetAmount: 4 }
};

export class SyncService {
    static async triggerSync(sheetMonthLabel: string) {
        await runSyncOnce(sheetMonthLabel);
        return { success: true };
    }

    static async getSyncRuns() {
        const [rows] = await dbPool.query<mysql.RowDataPacket[]>(
            'SELECT * FROM sync_runs ORDER BY started_at DESC LIMIT 50'
        );
        return rows;
    }

    static async getDataErrors() {
        const [rows] = await dbPool.query<mysql.RowDataPacket[]>(
            'SELECT * FROM data_errors ORDER BY created_at DESC LIMIT 100'
        );
        return rows;
    }

    static async getSettings() {
        try {
            const [rows] = await dbPool.query<mysql.RowDataPacket[]>(
                'SELECT * FROM system_settings WHERE setting_key = "sheets_mapping"'
            );

            if (rows && rows.length > 0) {
                return { mapping: JSON.parse(rows[0].setting_value) };
            }
        } catch (err) {
            console.error('[SyncService] Failed to fetch settings from DB', err);
        }

        return { mapping: DEFAULT_MAPPING };
    }

    static async updateSettings(data: any) {
        const { mapping } = data;
        await dbPool.query(
            `INSERT INTO system_settings (setting_key, setting_value) 
             VALUES ("sheets_mapping", ?) 
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
            [JSON.stringify(mapping)]
        );
    }

    static async getSheetHeaders(sheetMonthLabel: string) {
        const isMockMode = process.env.USE_MOCK_DATA === 'true';
        if (isMockMode) {
            const [rows] = await dbPool.query('SELECT * FROM headers_mock');
            return {
                deals: rows[0] || [],
                summary: rows[1] || []
            };
        }

        const config = getAppConfig();
        const dealsRange = config.sheets.dealsRange || `${sheetMonthLabel}!A1:Z1`;
        const summaryRange = config.sheets.summaryRange || `${sheetMonthLabel}!O1:U1`;

        try {
            const [dealsRows, summaryRows] = await Promise.all([
                fetchSheetValues(dealsRange),
                fetchSheetValues(summaryRange)
            ]);

            return {
                deals: dealsRows[0] || [],
                summary: summaryRows[0] || []
            };
        } catch (err) {
            console.error('[SyncService] Failed to fetch headers from Sheets', err);
            return { deals: [], summary: [] };
        }
    }
}
