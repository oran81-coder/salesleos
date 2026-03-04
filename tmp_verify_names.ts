import { dbPool } from './apps/api/src/config/db.js';

async function main() {
    const [rows]: any = await dbPool.query("SELECT customer_name, deal_amount, deal_date FROM deals WHERE sheet_month = '2026-02-01' AND customer_name IS NOT NULL LIMIT 10");
    console.log('Sample Deals with Business Names:');
    console.log(JSON.stringify(rows, null, 2));

    const [countRow]: any = await dbPool.query("SELECT COUNT(*) as count FROM deals WHERE sheet_month = '2026-02-01' AND (customer_name IS NULL OR customer_name = '')");
    console.log(`Deals with MISSING business names: ${countRow[0].count}`);

    process.exit(0);
}

main().catch(console.error);
