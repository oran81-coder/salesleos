import { runSyncOnce, parseHebrewMonthTab } from '../../../sync-worker/src/sync.service.js';
import type { ColumnMapping } from '../../../sync-worker/src/parser.js';
import { dbPool } from '../config/db.js';
import { getAppConfig } from '../config/env.js';
import { fetchSheetValues } from '../../../sync-worker/src/sheets-client.js';
import { google } from 'googleapis';
import mysql from 'mysql2/promise';
import fs from 'fs';

const DEFAULT_MAPPING = {
    deals: { repName: 3, customerName: 4, dealAmount: 5, collectionAmount: 6, bonus: 8, dealId: 2, dealDate: 0, isRenewal: 10 },
    summary: {
        repName: 14,
        totalSalesAmount: 15,
        totalCollectionAmount: 16,
        offsetAmount: 17,
        numberOfDeals: 24,
        averageDealSize: 19,
        bonusBaseRaw: 16,
        targetAmount: 22
    }
};

export class SyncService {
    static async getSheetTabs(): Promise<string[]> {
        const isMockMode = process.env.USE_MOCK_DATA === 'true';
        if (isMockMode) {
            return ['מרץ 2026', 'פברואר 2026', 'ינואר 2026', 'מרץ 2024', 'פברואר 2024'];
        }

        const config = getAppConfig();
        const { clientEmail, privateKey, spreadsheetId } = config.sheets;
        const auth = new google.auth.JWT({
            email: clientEmail,
            key: privateKey.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        const sheets = google.sheets({ version: 'v4', auth });
        const res = await sheets.spreadsheets.get({
            spreadsheetId,
            fields: 'sheets.properties.title',
        });
        return (res.data.sheets || [])
            .map(s => s.properties?.title || '')
            .filter(Boolean)
            .reverse(); // Most recent tabs first
    }

    static async triggerSync(sheetMonthLabel: string) {
        console.log(`[SyncService] triggerSync START for: "${sheetMonthLabel}" at ${new Date().toLocaleTimeString()}`);

        // If the frontend sends YYYY-MM or YYYY-MM-DD format, map it to the actual Hebrew tab name
        if (/^\d{4}-\d{2}(-\d{2})?$/.test(sheetMonthLabel)) {
            console.log(`[SyncService] Resolving date-string "${sheetMonthLabel}" to tab name...`);
            const tabs = await SyncService.getSheetTabs();
            const targetDateStr = sheetMonthLabel.length === 7 ? `${sheetMonthLabel}-01` : `${sheetMonthLabel.substring(0, 7)}-01`;
            const matchedTab = tabs.find(tab => parseHebrewMonthTab(tab) === targetDateStr);

            if (matchedTab) {
                console.log(`[SyncService] Resolved ${sheetMonthLabel} to real tab name: "${matchedTab}"`);
                sheetMonthLabel = matchedTab;
            } else {
                console.warn(`[SyncService] Failed to resolve ${sheetMonthLabel} to any tab.`);
                throw new Error(`לא נמצאה לשונית בגיליון עבור חודש ${sheetMonthLabel}. (למשל "פברואר 2026")`);
            }
        }

        const config = getAppConfig();

        // Load mapping from DB if available, otherwise use default
        let finalMapping: any = DEFAULT_MAPPING;
        try {
            const [rows] = await dbPool.query<mysql.RowDataPacket[]>(
                'SELECT setting_value FROM system_settings WHERE setting_key = "sheets_mapping"'
            );
            if (rows && rows.length > 0) {
                finalMapping = JSON.parse(rows[0].setting_value);
                console.log('[SyncService] Using mapping from database');
            } else {
                console.log('[SyncService] Using default hardcoded mapping');
            }
        } catch (err) {
            console.error('[SyncService] Failed to load mapping from DB, using defaults', err);
        }

        try {
            console.log(`[SyncService] Calling runSyncOnce for "${sheetMonthLabel}"...`);
            const startTime = Date.now();
            await runSyncOnce(sheetMonthLabel, finalMapping, dbPool);
            const duration = (Date.now() - startTime) / 1000;
            console.log(`[SyncService] runSyncOnce FINISHED in ${duration}s`);
        } catch (err: any) {
            console.error('[SyncService] runSyncOnce FAILED:', err?.message ?? err);
            throw err;
        }
        console.log(`[SyncService] triggerSync END successfully`);
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
        // Resolve date string to Hebrew tab name if needed
        if (/^\d{4}-\d{2}(-\d{2})?$/.test(sheetMonthLabel)) {
            const tabs = await SyncService.getSheetTabs();
            const targetDateStr = sheetMonthLabel.length === 7 ? `${sheetMonthLabel}-01` : `${sheetMonthLabel.substring(0, 7)}-01`;
            const matchedTab = tabs.find(tab => parseHebrewMonthTab(tab) === targetDateStr);
            if (matchedTab) sheetMonthLabel = matchedTab;
        }

        const isMockMode = process.env.USE_MOCK_DATA === 'true';
        if (isMockMode) {
            const [rows] = await dbPool.query('SELECT * FROM headers_mock');
            return {
                deals: rows[0] || [],
                summary: rows[1] || []
            };
        }

        const config = getAppConfig();
        const dealsRange = config.sheets.dealsRange || `'${sheetMonthLabel}'!A1:Z1`;
        const summaryRange = config.sheets.summaryRange || `'${sheetMonthLabel}'!A1:Z1`;

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
