import { fetchSheetValues } from './apps/sync-worker/src/sheets-client.js';

async function main() {
    const tabName = 'פברואר 2026';
    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);

    let totalSales = 0;
    let rollingCollection = 0;
    let count = 0;

    for (let i = 1; i < allValues.length; i++) {
        const row = allValues[i];
        if (!row || !row[3]) continue;
        if (row[3].includes('נציג') || row[3].includes('סה"כ')) continue;

        const dateRaw = row[0] || '';
        const rawAmountF = String(row[5] || '').trim();
        const rawAmountI = String(row[8] || '').trim();

        const amountI = parseFloat(rawAmountI.replace(/[^\d.-]/g, '')) || 0;
        rollingCollection += amountI;

        if (rawAmountF.startsWith('-') && rawAmountF.endsWith('-')) continue;

        if (dateRaw.includes('/2/26') || dateRaw.includes('/02/26') || dateRaw.includes('.2.26')) {
            const amountF = parseFloat(rawAmountF.replace(/[^\d.-]/g, '')) || 0;
            totalSales += amountF;
            count++;
        }
    }

    console.log(`\n--- Summation Results (No Breaks) ---`);
    console.log(`Total Sales (F, filtered): ₪${totalSales.toLocaleString()}`);
    console.log(`Total Collection (I, rolling): ₪${rollingCollection.toLocaleString()}`);
    console.log(`Deals Count: ${count}`);
}

main().catch(console.error);
