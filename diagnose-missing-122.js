import { dbPool } from './apps/api/src/config/db.js';
import { fetchSheetValues } from './apps/sync-worker/src/sheets-client.js';
import { parseColumnMapping } from './apps/sync-worker/src/parser.js';
import { loadConfig } from '@laos/config';
import dotenv from 'dotenv';
dotenv.config();

async function diagnose() {
    const tabName = 'פברואר 2026';
    const config = loadConfig();
    const mapping = parseColumnMapping(config.sheets).deals;

    console.log('--- Diagnosis: Finding Missing Deals (Expected 122) ---');
    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);

    const febDealsInSheet = [];
    for (let i = 0; i < allValues.length; i++) {
        const row = allValues[i];
        const dateRaw = row[mapping.dealDate];
        const repName = row[mapping.repName];

        if (!dateRaw || !repName) continue;

        let isFeb2026 = false;
        if (typeof dateRaw === 'string' && (dateRaw.includes('/2/26') || dateRaw.includes('/02/26') || dateRaw.includes('.2.26'))) {
            isFeb2026 = true;
        } else if (typeof dateRaw === 'number') {
            const date = new Date((dateRaw - 25569) * 86400 * 1000);
            if (date.getMonth() === 1 && date.getFullYear() === 2026) {
                isFeb2026 = true;
            }
        }

        if (isFeb2026) {
            febDealsInSheet.push({
                rowNumber: i + 1,
                repName: repName ? String(repName).trim() : '',
                customerName: row[mapping.customerName],
                dateRaw
            });
        }
    }

    console.log(`Total Feb 2026 deals found in sheet: ${febDealsInSheet.length}`);

    const [dbDeals] = await dbPool.query(
        "SELECT customer_name, sheet_row_number FROM deals WHERE sheet_month = '2026-02-01' AND MONTH(deal_date) = 2 AND YEAR(deal_date) = 2026"
    );
    const dbRows = new Set(dbDeals.map((d) => d.sheet_row_number));

    const missing = febDealsInSheet.filter(s => !dbRows.has(s.rowNumber));

    console.log('\n--- Missing Deals in Database ---');
    for (const m of missing) {
        const [userRow] = await dbPool.query(
            'SELECT id, is_active FROM users WHERE (LOWER(sheet_name) = LOWER(?) OR LOWER(full_name) = LOWER(?))',
            [m.repName, m.repName]
        );

        let userStatus = 'NOT FOUND';
        if (userRow.length > 0) {
            userStatus = userRow[0].is_active ? 'ACTIVE' : 'INACTIVE';
        }

        console.log(`Row ${m.rowNumber}: ${m.repName} | ${m.customerName} | Status: ${userStatus}`);
    }

    process.exit(0);
}

diagnose().catch(console.error);
