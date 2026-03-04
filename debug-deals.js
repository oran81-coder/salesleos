import { dbPool } from './apps/api/src/config/db.js';

async function debug() {
    const month = '2026-02-01';

    // 1. Total deals in the 'deals' table for this sheet_month
    const [allDeals] = await dbPool.query('SELECT COUNT(*) as count FROM deals WHERE sheet_month = ?', [month]);
    console.log('Total deals for February in DB:', allDeals[0].count);

    // 2. Deals grouped by month of deal_date
    const [byDate] = await dbPool.query(`
        SELECT MONTH(deal_date) as m, YEAR(deal_date) as y, COUNT(*) as count 
        FROM deals 
        WHERE sheet_month = ? 
        GROUP BY y, m
    `, [month]);
    console.log('Deals by date month:', byDate);

    // 3. Deals with inactive users
    const [inactive] = await dbPool.query(`
        SELECT COUNT(*) as count 
        FROM deals d
        JOIN users u ON d.rep_id = u.id
        WHERE d.sheet_month = ? AND u.is_active = 0
    `, [month]);
    console.log('Deals with inactive users:', inactive[0].count);

    process.exit(0);
}

debug().catch(console.error);
