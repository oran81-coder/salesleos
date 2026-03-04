import mysql from 'mysql2/promise';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function diagnose() {
    // 1. Database Connection
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'laos',
        password: process.env.DB_PASSWORD || 'laos_password',
        database: process.env.DB_NAME || 'laos_sales'
    });

    // 2. Google Sheets Connection
    const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const tabName = 'פברואר 2026';

    console.log('--- Diagnosis: Finding Missing Deals (Expected 122) ---');

    // Fetch values from sheet
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${tabName}'!A:F`,
    });
    const allValues = response.data.values;

    // Hardcoded mapping based on screenshots/config
    const COL_DATE = 0; // A
    const COL_REP = 3;  // D
    const COL_CUST = 5; // F

    const febDealsInSheet = [];
    for (let i = 0; i < allValues.length; i++) {
        const row = allValues[i];
        const dateRaw = row[COL_DATE];
        const repName = row[COL_REP];

        if (!dateRaw || !repName) continue;

        let isFeb2026 = false;
        if (typeof dateRaw === 'string' && (dateRaw.includes('/2/26') || dateRaw.includes('/02/26'))) {
            isFeb2026 = true;
        }

        if (isFeb2026) {
            febDealsInSheet.push({
                rowNumber: i + 1,
                repName: repName.trim(),
                customerName: row[COL_CUST] || 'N/A',
                dateRaw
            });
        }
    }

    console.log(`Total Feb 2026 deals found in sheet: ${febDealsInSheet.length}`);

    // Check DB
    const [dbDeals] = await connection.query(
        "SELECT sheet_row_number FROM deals WHERE sheet_month = '2026-02-01' AND MONTH(deal_date) = 2 AND YEAR(deal_date) = 2026"
    );
    const dbRows = new Set((dbDeals).map(d => d.sheet_row_number));

    const missing = febDealsInSheet.filter(s => !dbRows.has(s.rowNumber));

    console.log('\n--- Missing Deals in Database ---');
    for (const m of missing) {
        const [userRow] = await connection.query(
            'SELECT id, is_active, full_name FROM users WHERE (LOWER(sheet_name) = LOWER(?) OR LOWER(full_name) = LOWER(?))',
            [m.repName, m.repName]
        );

        let userStatus = 'NOT FOUND';
        let matchedName = 'N/A';
        if (userRow.length > 0) {
            userStatus = userRow[0].is_active ? 'ACTIVE' : 'INACTIVE';
            matchedName = userRow[0].full_name;
        }

        console.log(`Row ${m.rowNumber}: [${m.repName}] | Cust: ${m.customerName} | Status: ${userStatus} | DB Name: ${matchedName}`);
    }

    await connection.end();
    process.exit(0);
}

diagnose().catch(err => {
    console.error('Diagnosis failed:', err.message);
    process.exit(1);
});
