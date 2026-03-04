import { dbPool } from './apps/api/src/config/db.js';

async function main() {
    const [rows]: any = await dbPool.query("SELECT * FROM data_errors WHERE sheet_month = '2026-01-01'");
    console.log('Data errors for January:', rows);
    process.exit(0);
}

main().catch(console.error);
