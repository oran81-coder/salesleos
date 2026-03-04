import { fetchSheetValues } from './apps/sync-worker/src/sheets-client.js';

async function main() {
    const tabName = 'פברואר 2026';
    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);

    console.log(`Headers (Row 1):`, JSON.stringify(allValues[0]));

    console.log(`\n[Column I (Index 8) Values]`);
    for (let i = 0; i < 30; i++) {
        const row = allValues[i];
        if (row) {
            console.log(`Row ${i + 1}: "${row[8] || ''}"`);
        }
    }
}

main().catch(console.error);
