import { dbPool } from './apps/api/src/config/db.js';

async function main() {
    const [rows]: any = await dbPool.query("DESCRIBE deals");
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
}

main().catch(console.error);
