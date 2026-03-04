import { fetchSheetValues } from './apps/sync-worker/src/sheets-client.js';

async function main() {
    const tabName = 'פברואר 2026';
    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);

    console.log(`Checking Rows 50-100...`);
    for (let i = 50; i < 100; i++) {
        if (allValues[i]) {
            console.log(`Row ${i}:`, JSON.stringify(allValues[i]));
        }
    }
}

main().catch(console.error);
