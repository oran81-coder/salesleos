import { dbPool } from './apps/api/src/config/db.js';

async function main() {
    const sheetMonth = '2026-02-01';
    const [rows]: any = await dbPool.query(
        'SELECT customer_name, deal_amount, deal_date FROM deals WHERE sheet_month = ?',
        [sheetMonth]
    );
    let total = 0;
    for (const r of rows) {
        total += Number(r.deal_amount);
    }
    console.log(`Total Sales in DB: ₪${total.toLocaleString()}`);
    console.log(`Row Counts: ${rows.length}`);
    process.exit(0);
}

main().catch(console.error);
