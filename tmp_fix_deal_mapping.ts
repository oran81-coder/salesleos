import { dbPool } from './apps/api/src/config/db.js';

async function main() {
    const [rows]: any = await dbPool.query("SELECT setting_value FROM system_settings WHERE setting_key = 'sheets_mapping'");
    if (rows && rows.length > 0) {
        const mapping = JSON.parse(rows[0].setting_value);
        mapping.deals.dealId = 2; // Column C index
        await dbPool.query("UPDATE system_settings SET setting_value = ? WHERE setting_key = 'sheets_mapping'", [JSON.stringify(mapping)]);
        console.log('Database mapping updated with dealId: 2');
    }
    process.exit(0);
}

main().catch(console.error);
