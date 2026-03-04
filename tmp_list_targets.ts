import { dbPool } from './apps/api/src/config/db.js';

async function main() {
    const [rows]: any = await dbPool.query("SELECT * FROM system_settings WHERE setting_key LIKE 'target_%'");
    console.log('Target Settings:', rows);
    process.exit(0);
}

main().catch(console.error);
