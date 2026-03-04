import { fetchSheetValues } from './apps/sync-worker/src/sheets-client.js';

async function main() {
    const tabName = 'פברואר 2026';
    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);

    console.log(`\n[Summary Table - Column R (Index 17) - Offset]`);
    for (let i = 0; i < 50; i++) {
        const row = allValues[i];
        if (row && row[14]) {
            const rep = row[14];
            const offset = row[17] || '0';
            if (offset !== '0' && offset !== '') {
                console.log(`Row ${i + 1} (${rep}): Offset = ${offset}`);
            }
        }
    }
}

main().catch(console.error);
