import { dbPool } from './apps/api/src/config/db.js';

async function main() {
    const month = '2026-01-01';

    const [summaryRows]: any = await dbPool.query("SELECT SUM(total_collection_amount) as totalCollection, SUM(offset_amount) as totalOffset, SUM(total_sales_amount) as totalSales FROM rep_monthly_summary WHERE sheet_month = ?", [month]);
    console.log('--- DB Summary for January ---');
    console.log(summaryRows[0]);

    // Net Collection = Collection - Offset
    const net = Number(summaryRows[0].totalCollection) - Number(summaryRows[0].totalOffset);
    console.log(`Calculated Net Collection: ${net}`);

    const [dealSums]: any = await dbPool.query("SELECT SUM(collection_amount) as sumColI FROM deals WHERE sheet_month = ?", [month]);
    console.log(`Sum of collection_amount in deals: ${dealSums[0].sumColI}`);

    process.exit(0);
}

main().catch(console.error);
