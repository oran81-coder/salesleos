import { fetchSheetValues } from './apps/sync-worker/src/sheets-client.js';

async function main() {
    const tabName = 'פברואר 2026';
    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);
    const searchVal = "2180969";
    const searchValFormatted = "2,180,969";

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

    console.log("\n--- 'סה\"כ' Rows ---");
    for (let i = 0; i < allValues.length; i++) {
        const row = allValues[i];
        if (row.some(c => String(c).includes('סה"כ'))) {
            console.log(`Row ${i + 1}:`, JSON.stringify(row));
        }
    }
}

main().catch(console.error);
