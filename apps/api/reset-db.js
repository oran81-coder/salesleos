import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'laos',
    password: 'laos_password',
    database: 'laos_sales'
};

const mapping = {
    deals: { repName: 3, dealAmount: 5, bonus: 8, dealId: 2, dealDate: 0, isRenewal: 10 },
    summary: {
        repName: 14,
        totalSalesAmount: 15,
        totalCollectionAmount: 16,
        offsetAmount: 17,
        numberOfDeals: 18,
        averageDealSize: 19,
        bonusBaseRaw: 20,
        targetAmount: 21
    }
};

async function reset() {
    let connection;
    try {
        console.log('Connecting to DB...');
        connection = await mysql.createConnection(dbConfig);

        // 1. Reset settings
        console.log('Setting sheets_mapping...');
        await connection.execute(
            'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
            ['sheets_mapping', JSON.stringify(mapping)]
        );
        console.log('Mapping reset in DB.');

        // 2. Clear stale Feb data
        console.log('Clearing Feb data...');
        await connection.execute('DELETE FROM rep_monthly_summary WHERE sheet_month = "2026-02-01"');
        console.log('Cleared Feb 2026 data.');

    } catch (err) {
        console.error('DATABASE RESET ERROR:', err);
    } finally {
        if (connection) await connection.end();
    }
}

reset();
