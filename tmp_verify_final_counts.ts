import { dbPool } from './apps/api/src/config/db.js';
import mysql from 'mysql2/promise';

async function main() {
    const sheetMonth = '2026-02-01';

    // Exact SQL from KPIService.getDepartmentSummary
    const dealsSql = `
        SELECT is_renewal, COUNT(*) as count
        FROM deals d
        JOIN users u ON d.rep_id = u.id
        WHERE d.sheet_month = ? 
          AND MONTH(d.deal_date) = MONTH(?) 
          AND YEAR(d.deal_date) = YEAR(?)
          AND u.is_active = 1
        GROUP BY is_renewal
    `;
    const [dealRows] = await dbPool.query<mysql.RowDataPacket[]>(dealsSql, [sheetMonth, sheetMonth, sheetMonth]);

    console.log('--- Final Dashboard-Correct Counts ---');
    let total = 0;
    dealRows.forEach(row => {
        console.log(`${row.is_renewal ? 'Renewals' : 'NewDeals'}: ${row.count}`);
        total += Number(row.count);
    });
    console.log('Total:', total);

    process.exit(0);
}

main().catch(console.error);
