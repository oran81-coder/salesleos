import { dbPool } from './apps/api/src/config/db.js';

async function main() {
    const sheetMonth = '2026-02-01';
    const [rows]: any = await dbPool.query(
        'SELECT u.full_name, s.total_sales_amount, s.total_collection_amount, s.number_of_deals FROM rep_monthly_summary s JOIN users u ON s.rep_id = u.id WHERE s.sheet_month = ?',
        [sheetMonth]
    );
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
}

main().catch(console.error);
