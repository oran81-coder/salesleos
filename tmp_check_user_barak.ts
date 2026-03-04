import { dbPool } from './apps/api/src/config/db.js';

async function main() {
    const [rows]: any = await dbPool.query("SELECT * FROM users WHERE full_name LIKE '%ברק קציר%'");
    console.log('User search result:', rows);

    const [allUsers]: any = await dbPool.query("SELECT full_name, is_active FROM users");
    console.log('All Users:', allUsers);

    process.exit(0);
}

main().catch(console.error);
