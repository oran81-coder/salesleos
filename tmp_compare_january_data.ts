import { dbPool } from './apps/api/src/config/db.js';

async function main() {
    const month = '2026-01-01';

    // 1. Get totals from rep_monthly_summary
    const [summaryTotals]: any = await dbPool.query("SELECT SUM(total_collection_amount) as totalCollection, SUM(offset_amount) as totalOffset FROM rep_monthly_summary WHERE sheet_month = ?", [month]);
    console.log('--- Summary Totals (Jan) ---');
    console.log(`Total Collection: ${summaryTotals[0].totalCollection}`);
    console.log(`Total Offset: ${summaryTotals[0].totalOffset}`);
    console.log(`Net (Col - Off): ${Number(summaryTotals[0].totalCollection) - Number(summaryTotals[0].totalOffset)}`);

    // 2. Sum bonus_requested from deals (this is where collection comes from)
    const [dealsSum]: any = await dbPool.query("SELECT SUM(bonus_requested) as sumBonus FROM deals WHERE sheet_month = ?", [month]);
    console.log(`\nSum of bonus_requested in deals: ${dealsSum[0].sumBonus}`);

    // 3. Find if any deal has exactly 4600?
    const [diffDeal]: any = await dbPool.query("SELECT * FROM deals WHERE sheet_month = ? AND bonus_requested = 4600", [month]);
    if (diffDeal.length > 0) {
        console.log(`\nFound deal(s) with exactly 4600:`, diffDeal.map((d: any) => d.customer_name));
    }

    process.exit(0);
}

main().catch(console.error);
