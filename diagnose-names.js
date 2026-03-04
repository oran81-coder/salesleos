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

    console.log('Fetching values for tab:', tabName);
    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);

    // Skill headings
    const rows = allValues.slice(1);
    const namesInSheet = new Set();
    const dealCounts = new Map();

    for (const row of rows) {
        const name = row[mapping.repName];
        if (name && typeof name === 'string' && name.trim()) {
            const cleanName = name.trim();
            namesInSheet.add(cleanName);
            dealCounts.set(cleanName, (dealCounts.get(cleanName) || 0) + 1);
        }
    }

    console.log('Unique names in sheet:', Array.from(namesInSheet));

    const unmatched = [];
    let totalUnmatchedDeals = 0;

    for (const name of namesInSheet) {
        const [userRow] = await dbPool.query(
            'SELECT id FROM users WHERE (LOWER(sheet_name) = LOWER(?) OR LOWER(full_name) = LOWER(?)) AND is_active = 1',
            [name, name]
        );
        if (!userRow || userRow.length === 0) {
            unmatched.push(name);
            totalUnmatchedDeals += dealCounts.get(name);
        }
    }

    console.log('Unmatched names (no active user):', unmatched);
    console.log('Total deals for unmatched names:', totalUnmatchedDeals);

    // Also check deals count for matched users
    let totalMatchedDeals = 0;
    for (const name of namesInSheet) {
        if (!unmatched.includes(name)) {
            totalMatchedDeals += dealCounts.get(name);
        }
    }
    console.log('Total deals for matched active users in the tab:', totalMatchedDeals);

    process.exit(0);
}

diagnose().catch(console.error);
