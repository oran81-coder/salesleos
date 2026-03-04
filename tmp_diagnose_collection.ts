import { fetchSheetValues } from './apps/sync-worker/src/sheets-client.js';
import { parseHebrewMonthTab } from './apps/sync-worker/src/sync.service.js';

async function diagnoseMonth(tabName: string) {
    console.log(`\n--- Diagnosing ${tabName} ---`);
    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);
    const sheetMonth = parseHebrewMonthTab(tabName);

    // Mapping from SyncService
    const DEALS_COL_COLLECTION = 6;
    const SUMMARY_COL_COLLECTION = 16;
    const SUMMARY_START_ROW = 0; // Simplified for now, looking at all rows

    let dealsSum = 0;
    let febDealsSum = 0;
    let otherMonthDealsSum = 0;

    // Identify Deals (starting from row 2 usually)
    for (let i = 1; i < allValues.length; i++) {
        const row = allValues[i];
        if (row[0] === 'סה"כ' || row[13] === 'סה"כ' || row[14] === 'נציג') break; // End of deals

        const rawVal = row[DEALS_COL_COLLECTION];
        if (!rawVal) continue;

        const amount = parseFloat(String(rawVal).replace(/[^\d.-]/g, '')) || 0;
        dealsSum += amount;

        // Date check logic from sync.service.ts
        let dealDateStr = '';
        const rawDate = String(row[0]).trim();
        if (/^\d{5}(\.\d+)?$/.test(rawDate)) {
            const serial = parseFloat(rawDate);
            const date = new Date((serial - 25569) * 86400 * 1000);
            dealDateStr = date.toISOString().split('T')[0];
        } else if (/^\d{1,2}[./]\d{1,2}/.test(rawDate)) {
            const parts = rawDate.split(/[./]/);
            let day = parts[0].padStart(2, '0');
            let month = parts[1].padStart(2, '0');
            let year = parts[2] ? (parts[2].length === 2 ? '20' + parts[2] : parts[2]) : '2026';
            dealDateStr = `${year}-${month}-${day}`;
        }

        if (dealDateStr.startsWith(sheetMonth.substring(0, 7))) {
            febDealsSum += amount;
        } else {
            otherMonthDealsSum += amount;
            if (amount > 0) {
                // console.log(`[Deal in other month] Row ${i+1}: Date=${rawDate} (${dealDateStr}), Amount=${amount}`);
            }
        }
    }

    let summarySheetSum = 0;
    let summaryFound = false;
    for (const row of allValues) {
        if (row[14] === 'נציג') {
            summaryFound = true;
            continue;
        }
        if (summaryFound) {
            if (row[14] === 'סה"כ') {
                const sheetTotal = parseFloat(String(row[SUMMARY_COL_COLLECTION]).replace(/[^\d.-]/g, '')) || 0;
                console.log(`Sheet SUMMARY Totals Row (Col 16): ${sheetTotal}`);
                break;
            }
            const amount = parseFloat(String(row[SUMMARY_COL_COLLECTION]).replace(/[^\d.-]/g, '')) || 0;
            summarySheetSum += amount;
        }
    }

    console.log(`Total Deals Collection (All): ₪${dealsSum.toLocaleString()}`);
    console.log(`Total Deals Collection (${sheetMonth.substring(0, 7)} only): ₪${febDealsSum.toLocaleString()}`);
    console.log(`Total Deals Collection (Other months): ₪${otherMonthDealsSum.toLocaleString()}`);
    console.log(`Sum of Individual Summary Rows (Col 16): ₪${summarySheetSum.toLocaleString()}`);
}

async function main() {
    try {
        await diagnoseMonth('פברואר 2026');
        await diagnoseMonth('מרץ 2026');
    } catch (err) {
        console.error(err);
    }
}

main();
