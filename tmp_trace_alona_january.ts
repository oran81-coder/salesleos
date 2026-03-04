import { dbPool } from './apps/api/src/config/db.js';

async function main() {
    const month = '2026-01-01';

    // 1. Get Alona's summary
    const [alonaSummary]: any = await dbPool.query(`
        SELECT s.*, u.full_name 
        FROM rep_monthly_summary s
        JOIN users u ON s.rep_id = u.id
        WHERE s.sheet_month = ? AND u.full_name LIKE '%אלונה לוין%'
    `, [month]);
    console.log('--- Alona summary in DB (Jan) ---');
    console.log(alonaSummary);

    // 2. Get Alona's deals
    const [alonaDeals]: any = await dbPool.query(`
        SELECT d.*, u.full_name
        FROM deals d
        JOIN users u ON d.rep_id = u.id
        WHERE d.sheet_month = ? AND u.full_name LIKE '%אלונה לוין%'
    `, [month]);
    console.log(`\nAlona has ${alonaDeals.length} deals in DB.`);

    process.exit(0);
}

main().catch(console.error);
