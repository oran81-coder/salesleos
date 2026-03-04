/**
 * scripts/test-live-connection.ts
 *
 * Run this script AFTER filling in your .env credentials to verify:
 *   1. MySQL DB is reachable and schema is applied
 *   2. Google Sheets API auth works and the spreadsheet is accessible
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/test-live-connection.ts
 */

import mysql from 'mysql2/promise';
import { google } from 'googleapis';

// ── 1. Load env ──────────────────────────────────────────────────────────────
const required = (name: string) => {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
};

const dbConfig = {
    host: required('DB_HOST'),
    port: Number(process.env.DB_PORT || '3306'),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
};

const sheetsCfg = {
    spreadsheetId: required('SHEETS_SPREADSHEET_ID'),
    clientEmail: required('SHEETS_CLIENT_EMAIL'),
    privateKey: required('SHEETS_PRIVATE_KEY').replace(/\\n/g, '\n'),
};

// ── 2. Test MySQL ─────────────────────────────────────────────────────────────
async function testDatabase() {
    console.log('\n🗄️  Testing MySQL connection...');
    const conn = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await conn.query<mysql.RowDataPacket[]>('SELECT COUNT(*) as cnt FROM users');
        console.log(`  ✅ DB connected — users table has ${rows[0].cnt} rows`);

        // Check that all required tables exist
        const tables = [
            'users', 'departments', 'deals', 'rep_monthly_summary',
            'commission_tiers', 'commission_tier_versions',
            'bonus_approvals', 'deferred_bonuses',
            'sync_runs', 'data_errors', 'system_settings'
        ];
        for (const table of tables) {
            const [check] = await conn.query<mysql.RowDataPacket[]>(
                `SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
                [dbConfig.database, table]
            );
            const exists = Number(check[0].cnt) > 0;
            console.log(`  ${exists ? '✅' : '❌'} Table "${table}" ${exists ? 'exists' : 'MISSING — run migrations!'}`);
        }

        // Check new columns exist
        const columnChecks = [
            { table: 'deals', column: 'is_renewal' },
            { table: 'rep_monthly_summary', column: 'total_collection_amount' },
            { table: 'rep_monthly_summary', column: 'target_amount' },
        ];
        for (const { table, column } of columnChecks) {
            const [colCheck] = await conn.query<mysql.RowDataPacket[]>(
                `SELECT COUNT(*) as cnt FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?`,
                [dbConfig.database, table, column]
            );
            const exists = Number(colCheck[0].cnt) > 0;
            console.log(`  ${exists ? '✅' : '❌'} Column "${table}.${column}" ${exists ? 'exists' : 'MISSING — run migration 011!'}`);
        }
    } finally {
        await conn.end();
    }
}

// ── 3. Test Google Sheets ─────────────────────────────────────────────────────
async function testSheets() {
    console.log('\n📊 Testing Google Sheets connection...');
    const auth = new google.auth.JWT({
        email: sheetsCfg.clientEmail,
        key: sheetsCfg.privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.get({
        spreadsheetId: sheetsCfg.spreadsheetId,
        fields: 'properties.title,sheets.properties.title',
    });

    console.log(`  ✅ Spreadsheet "${res.data.properties?.title}" is accessible`);
    console.log(`  📑 Tabs found:`);
    for (const sheet of res.data.sheets || []) {
        console.log(`     - ${sheet.properties?.title}`);
    }
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
    let hasError = false;
    try {
        await testDatabase();
    } catch (err) {
        console.error('  ❌ DB test FAILED:', (err as Error).message);
        hasError = true;
    }
    try {
        await testSheets();
    } catch (err) {
        console.error('  ❌ Sheets test FAILED:', (err as Error).message);
        hasError = true;
    }

    if (hasError) {
        console.log('\n⚠️  Some checks failed. Fix the errors above before running the sync.\n');
        process.exit(1);
    } else {
        console.log('\n🎉 All checks passed! System is ready for Live Mode.\n');
        console.log('   Set USE_MOCK_DATA=false in .env and restart the API dev server.\n');
    }
})();
