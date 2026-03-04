import { fetchSheetValues } from './apps/sync-worker/src/sheets-client.js';

async function main() {
    const tabName = 'פברואר 2026';
    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);

    console.log(`Searching for 2026-02 deals...`);
    for (let i = 1; i < allValues.length; i++) {
        const row = allValues[i];
        const dateRaw = row[0] || '';
        const rep = row[3] || '';

        if (dateRaw.includes('/2/26') || dateRaw.includes('/02/26') || dateRaw.includes('.2.26')) {
            console.log(`Row ${i + 1}: Date="${dateRaw}", Rep="${rep}", Amount="${row[5]}"`);
        }
    }
}

main().catch(console.error);
