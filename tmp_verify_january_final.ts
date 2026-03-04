import { dbPool } from './apps/api/src/config/db.js';

async function main() {
    const month = '2026-01-01';

    const [summaryRows]: any = await dbPool.query(`
        SELECT SUM(total_collection_amount) as totalCollection, 
               SUM(offset_amount) as totalOffset,
               SUM(total_sales_amount) as totalSales 
        FROM rep_monthly_summary 
        WHERE sheet_month = ?
    `, [month]);

    console.log('--- Final DB Totals for January ---');
    const totalCol = parseFloat(summaryRows[0].totalCollection || '0');
    const totalOff = parseFloat(summaryRows[0].totalOffset || '0');
    const net = totalCol - totalOff;

    console.log(`Gross Collection: ₪${totalCol.toLocaleString()}`);
    console.log(`Total Offset: ₪${totalOff.toLocaleString()}`);
    console.log(`Net Collection: ₪${net.toLocaleString()}`);

    // Check Alona specifically
    const [alona]: any = await dbPool.query(`
        SELECT offset_amount FROM rep_monthly_summary s
        JOIN users u ON s.rep_id = u.id
        WHERE s.sheet_month = ? AND u.full_name LIKE '%אלונה לוין%'
    `, [month]);
    console.log(`Alona Offset in DB: ₪${alona[0]?.offset_amount || 0}`);

    // Check Barak specifically
    const [barak]: any = await dbPool.query(`
        SELECT total_collection_amount FROM rep_monthly_summary s
        JOIN users u ON s.rep_id = u.id
        WHERE s.sheet_month = ? AND u.full_name LIKE '%ברק קציר%'
    `, [month]);
    console.log(`Barak Collection in DB: ₪${barak[0]?.total_collection_amount || 0}`);

    process.exit(0);
}

main().catch(console.error);
