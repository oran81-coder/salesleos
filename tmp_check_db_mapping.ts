import { dbPool } from './apps/api/src/config/db.js';

async function main() {
    const [rows]: any = await dbPool.query("SELECT setting_value FROM system_settings WHERE setting_key = 'sheets_mapping'");
    console.log('Current DB Mapping:');
    console.log(JSON.stringify(JSON.parse(rows[0].setting_value), null, 2));
    process.exit(0);
}

main().catch(console.error);
