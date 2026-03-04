import { fetchSheetValues } from './apps/sync-worker/src/sheets-client.js';

async function main() {
    const tabName = 'פברואר 2026';
    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);

    let totalSales = 0;
    let count = 0;
    let rollingCollection = 0;

    for (let i = 1; i < allValues.length; i++) {
        const row = allValues[i];
        if (!row[3] || row[3].includes('נציג') || row[3].includes('סה"כ')) continue;
        if (row[14] === 'נציג') break;

        const dateRaw = row[0] || '';
        const rawAmount = String(row[5] || '').trim();
        const bonusAmount = parseFloat(String(row[8] || '').replace(/[^\d.-]/g, '')) || 0;

        // Collection is rolling
        rollingCollection += bonusAmount;

        // Sales is date-filtered and skip cancelled
        if (rawAmount.startsWith('-') && rawAmount.endsWith('-')) continue;

        if (dateRaw.includes('/2/26') || dateRaw.includes('/02/26') || dateRaw.includes('.2.26')) {
            const amount = parseFloat(rawAmount.replace(/[^\d.-]/g, '')) || 0;
            totalSales += amount;
            count++;
        }
    }

    console.log(`\n--- Summation Results ---`);
    console.log(`Total Sales (F, filtered): ₪${totalSales.toLocaleString()}`);
    console.log(`Total Collection (I, rolling): ₪${rollingCollection.toLocaleString()}`);
    console.log(`Deals Count: ${count}`);
}

main().catch(console.error);
