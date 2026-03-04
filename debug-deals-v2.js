import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function debug() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'laos',
        password: process.env.DB_PASSWORD || 'laos_password',
        database: process.env.DB_NAME || 'laos_sales'
    });

    const month = '2026-02-01';

    console.log('--- Debugging Deal Count for February ---');

    // 1. Total deals in the 'deals' table for this sheet_month
    const [allDeals] = await connection.query('SELECT COUNT(*) as count FROM deals WHERE sheet_month = ?', [month]);
    console.log(`Total deals in deals table with sheet_month='${month}':`, allDeals[0].count);

    // 2. Breakdown by deal_date month
    const [byDate] = await connection.query(`
        SELECT MONTH(deal_date) as m, YEAR(deal_date) as y, COUNT(*) as count 
        FROM deals 
        WHERE sheet_month = ? 
        GROUP BY y, m
    `, [month]);
    console.log('Deals grouped by their actual deal_date:', byDate);

    // 3. Check for inactive users
    const [inactive] = await connection.query(`
        SELECT u.full_name, COUNT(*) as count 
        FROM deals d
        JOIN users u ON d.rep_id = u.id
        WHERE d.sheet_month = ? AND u.is_active = 0
        GROUP BY u.full_name
    `, [month]);
    if (inactive.length > 0) {
        console.log('Deals belonging to inactive users (filtered out in UI):', inactive);
    } else {
        console.log('No deals found for inactive users.');
    }

    await connection.end();
}

debug().catch(err => {
    console.error('Debug failed:', err.message);
    process.exit(1);
});
