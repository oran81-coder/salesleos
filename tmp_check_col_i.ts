import { fetchSheetValues } from './apps/sync-worker/src/sheets-client.js';

async function main() {
    const tabName = 'פברואר 2026';
    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);

    let sumI = 0;
    let count = 0;
    for (let i = 1; i < allValues.length; i++) {
        const row = allValues[i];
        if (row[0] === 'סה"כ' || row[13] === 'סה"כ' || row[14] === 'נציג') break;

        const rawVal = row[8]; // Column I
        if (!rawVal) continue;

        const amount = parseFloat(String(rawVal).replace(/[^\d.-]/g, '')) || 0;
        sumI += amount;
        count++;
    }

    console.log(`Sum of Column I (Deals Table): ₪${sumI.toLocaleString()}`);
    console.log(`Count of rows processed: ${count}`);
}

main().catch(console.error);
