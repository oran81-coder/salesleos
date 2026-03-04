import { dbPool } from './apps/api/src/config/db.js';

async function main() {
    const month = '2026-01-01';
    const [rows]: any = await dbPool.query("SELECT is_renewal, COUNT(*) as count FROM deals WHERE sheet_month = ? GROUP BY is_renewal", [month]);
    console.log('January Counts:', rows);
    process.exit(0);
}

main().catch(console.error);
