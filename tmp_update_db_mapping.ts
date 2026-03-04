import { dbPool } from './apps/api/src/config/db.js';

async function main() {
    const [rows]: any = await dbPool.query("SELECT setting_value FROM system_settings WHERE setting_key = 'sheets_mapping'");
    if (rows && rows.length > 0) {
        const mapping = JSON.parse(rows[0].setting_value);
        mapping.deals.customerName = 4;
        await dbPool.query("UPDATE system_settings SET setting_value = ? WHERE setting_key = 'sheets_mapping'", [JSON.stringify(mapping)]);
        console.log('Database mapping updated with customerName: 4');
    } else {
        console.log('No sheets_mapping found in database. Using .env fallback.');
    }
    process.exit(0);
}

main().catch(console.error);
