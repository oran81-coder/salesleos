import { dbPool } from './apps/api/src/config/db.js';

async function check() {
    try {
        const sheetMonth = '2026-02-01';
        const [rows]: any = await dbPool.query(
            'SELECT SUM(total_collection_amount) as totalCollection, SUM(total_sales_amount) as totalSales FROM rep_monthly_summary WHERE sheet_month = ?',
            [sheetMonth]
        );
        console.log(`\n--- DB Summary for ${sheetMonth} ---`);
        console.log(JSON.stringify(rows[0], null, 2));

        const [reps]: any = await dbPool.query(
            'SELECT u.full_name, s.total_collection_amount FROM rep_monthly_summary s JOIN users u ON s.rep_id = u.id WHERE s.sheet_month = ? ORDER BY s.total_collection_amount DESC',
            [sheetMonth]
        );
        console.log(`\n--- Top 5 Reps by Collection ---`);
        console.log(JSON.stringify(reps.slice(0, 5), null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

check();
