import { dbPool } from './apps/api/src/config/db.js';
import { KPIService } from './apps/api/src/services/kpi.service.js';

async function main() {
    const month = '2026-02-01';
    const [rows]: any = await dbPool.query("SELECT target_amount FROM rep_monthly_summary s JOIN users u ON s.rep_id = u.id WHERE s.sheet_month = ? AND u.is_active = 1 LIMIT 1", [month]);

    if (rows.length > 0) {
        const val = rows[0].target_amount;
        console.log(`Value from DB: "${val}" Type: ${typeof val}`);
        console.log(`Boolean check ("${val}" || 100000):`, val || 100000);
    } else {
        console.log('No rows found');
    }

    process.exit(0);
}

main().catch(console.error);
