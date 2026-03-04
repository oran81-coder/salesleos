import mysql from 'mysql2/promise';

async function explainAchievement() {
    const pool = await mysql.createPool({
        host: 'localhost',
        port: 3306,
        user: 'laos',
        password: 'laos_password',
        database: 'laos_sales',
        charset: 'utf8mb4'
    });

    try {
        const [rows]: any = await pool.query(`
            SELECT u.full_name, s.total_sales_amount, s.target_amount, 
                   (s.total_sales_amount / NULLIF(s.target_amount, 0) * 100) as achievement
            FROM rep_monthly_summary s
            JOIN users u ON s.rep_id = u.id
            WHERE (u.full_name LIKE "%נורה%" OR u.full_name LIKE "%אורון%")
              AND s.sheet_tab_name = "פברואר 2026"
        `);

        console.log('--- Achievement Data ---');
        rows.forEach((r: any) => {
            console.log(`Rep: ${r.full_name}`);
            console.log(`  Total Sales: ${r.total_sales_amount}`);
            console.log(`  Target Amount: ${r.target_amount}`);
            console.log(`  Achievement: ${r.achievement}%`);
            console.log('-------------------------');
        });
    } finally {
        await pool.end();
    }
}

explainAchievement();
