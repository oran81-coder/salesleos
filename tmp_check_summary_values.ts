import { fetchSheetValues } from './apps/sync-worker/src/sheets-client.js';

async function main() {
    const tabName = 'פברואר 2026';
    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);

    console.log(`\n--- Row 25 (Target Value Row) ---`);
    console.log(JSON.stringify(allValues[24]));

    console.log(`\n--- Row 52 (Secondary Total Row) ---`);
    console.log(JSON.stringify(allValues[51]));

    // Sum individuals from Table 1 (Row 2 to 24)
    let sum1 = 0;
    for (let i = 1; i < 24; i++) {
        const val = parseFloat(String(allValues[i][16]).replace(/[^\d.-]/g, '')) || 0;
        sum1 += val;
    }
    console.log(`Sum of Col 16 in Table 1 (Rows 2-24): ${sum1}`);

    // Sum individuals from Table 2 (Row 29 to 51)
    let sum2 = 0;
    for (let i = 28; i < 51; i++) {
        const val = parseFloat(String(allValues[i][16]).replace(/[^\d.-]/g, '')) || 0;
        sum2 += val;
    }
    console.log(`Sum of Col 16 in Table 2 (Rows 29-51): ${sum2}`);

    console.log(`Total Sum: ${sum1 + sum2}`);
}

main().catch(console.error);
