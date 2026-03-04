import { dbPool } from './apps/api/src/config/db.js';

async function main() {
    const [rows]: any = await dbPool.query("SELECT is_renewal, COUNT(*) as count FROM deals WHERE sheet_month = '2026-02-01' GROUP BY is_renewal");
    console.log('Current DB Counts for Feb 2026:', rows);
    process.exit(0);
}

main().catch(console.error);
