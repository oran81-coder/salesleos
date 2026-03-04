import { fetchSheetValues } from './apps/sync-worker/src/sheets-client.js';

async function main() {
    const tabName = 'פברואר 2026';
    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);

    let sumG = 0;
    let sumI = 0;
    let count = 0;

    for (let i = 1; i < allValues.length; i++) {
        const row = allValues[i];
        // Skip summary areas
        if (row[14] === 'נציג') continue;
        if (row[14] === 'סה"כ' || row[0] === 'סה"כ') continue;

        // Only count rows that look like deals (have a date or business name)
        if (!row[0] && !row[4]) continue;

        const valG = parseFloat(String(row[6] || '').replace(/[^\d.-]/g, '')) || 0;
        const valI = parseFloat(String(row[8] || '').replace(/[^\d.-]/g, '')) || 0;

        sumG += valG;
        sumI += valI;
        count++;
    }

    console.log(`Sum of Column G (גביה): ₪${sumG.toLocaleString()}`);
    console.log(`Sum of Column I (בונוס): ₪${sumI.toLocaleString()}`);
    console.log(`Rows processed: ${count}`);
}

main().catch(console.error);
