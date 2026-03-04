import { fetchSheetValues } from './apps/sync-worker/src/sheets-client.js';

async function main() {
    const tabName = 'פברואר 2026';
    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);

    console.log(`Row Sample (G vs I):`);
    for (let i = 1; i < 50; i++) {
        const row = allValues[i];
        if (!row) continue;
        const valG = row[6] || '';
        const valI = row[8] || '';
        if (valG !== '0' || valI !== '0') {
            console.log(`Row ${i + 1}: G="${valG}", I="${valI}"`);
        }
    }
}

main().catch(console.error);
