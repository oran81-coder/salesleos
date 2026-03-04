import { dbPool } from './apps/api/src/config/db.js';

async function main() {
    const [cols]: any = await dbPool.query("DESCRIBE deals");
    console.log('Deals columns:', cols.map((c: any) => c.Field));

    const [summaryCols]: any = await dbPool.query("DESCRIBE rep_monthly_summary");
    console.log('Summary columns:', summaryCols.map((c: any) => c.Field));

    process.exit(0);
}

main().catch(console.error);
