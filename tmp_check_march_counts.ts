import { dbPool } from './apps/api/src/config/db.js';

async function main() {
    const month = '2026-03-01';
    const [rows]: any = await dbPool.query("SELECT is_renewal, COUNT(*) as count FROM deals WHERE sheet_month = ? GROUP BY is_renewal", [month]);
    console.log(`Current DB Counts for "${month}":`, rows);

    const [sample]: any = await dbPool.query("SELECT deal_date, customer_name, is_renewal FROM deals WHERE sheet_month = ? LIMIT 5", [month]);
    console.log(`Sample deals for "${month}":`, sample);

    process.exit(0);
}

main().catch(console.error);
