import { dbPool } from './apps/api/src/config/db.js';

async function main() {
    const [rows]: any = await dbPool.query("SELECT setting_value FROM system_settings WHERE setting_key = 'sheets_mapping'");
    console.log('Mapping from DB:', JSON.stringify(JSON.parse(rows[0]?.setting_value || '{}'), null, 2));

    const [deals]: any = await dbPool.query("SELECT id, deal_id, legacy_key, customer_name, sheet_row_number FROM deals WHERE sheet_month = '2026-02-01' LIMIT 10");
    console.log('Sample Deals from DB:', JSON.stringify(deals, null, 2));

    process.exit(0);
}

main().catch(console.error);
