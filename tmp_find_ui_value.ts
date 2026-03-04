import { fetchSheetValues } from './apps/sync-worker/src/sheets-client.js';

async function main() {
    const tabName = 'פברואר 2026';
    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);
    const searchVal = "1726169";
    const searchValFormatted = "1,726,169";

    console.log(`Searching for "${searchVal}" in "${tabName}"...`);

    for (let i = 0; i < allValues.length; i++) {
        const row = allValues[i];
        for (let j = 0; j < row.length; j++) {
            const cell = String(row[j]);
            if (cell.includes(searchVal) || cell.includes(searchValFormatted)) {
                console.log(`FOUND at Row ${i + 1}, Col ${String.fromCharCode(65 + j)} (index ${j}): "${cell}"`);
            }
        }
    }
}

main().catch(console.error);
