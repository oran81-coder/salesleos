import { fetchSheetValues } from './apps/sync-worker/src/sheets-client.js';

async function main() {
    const tabName = 'פברואר 2026';
    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);

    console.log(`Total Rows: ${allValues.length}`);
    for (let i = 0; i < 10; i++) {
        console.log(`Row ${i}:`, JSON.stringify(allValues[i]));
    }
}

main().catch(console.error);
