import { fetchSheetValues } from './apps/sync-worker/src/sheets-client.js';
import { parseHebrewMonthTab } from './apps/sync-worker/src/sync.service.js';

async function diagnoseMonth(tabName: string) {
    console.log(`\n--- Diagnosing ${tabName} ---`);
    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);
    const sheetMonth = parseHebrewMonthTab(tabName);
    console.log(`Target sheetMonth: ${sheetMonth}`);

    const DEALS_COL_DATE = 0;
    const DEALS_COL_COLLECTION = 6;

    console.log(`\n[Deals Samples]`);
    let count = 0;
    for (let i = 1; i < allValues.length; i++) {
        const row = allValues[i];
        if (row[0] === 'סה"כ' || row[13] === 'סה"כ' || row[14] === 'נציג') break;

        const rawDate = String(row[DEALS_COL_DATE]).trim();
        const rawColl = row[DEALS_COL_COLLECTION];

        let dealDateStr = '';
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

        if (count < 10 && rawDate) {
            console.log(`Row ${i + 1}: RawDate="${rawDate}" -> ParsedDate="${dealDateStr}" Matched=${dealDateStr.startsWith(sheetMonth.substring(0, 7))} Coll=${rawColl}`);
            count++;
        }
    }

    console.log(`\n[Summary Table]`);
    let summaryFound = false;
    for (let i = 0; i < allValues.length; i++) {
        const row = allValues[i];
        if (row[14] === 'נציג') {
            summaryFound = true;
            console.log(`Found summary header at row ${i + 1}`);
            console.log(`Header Row (14-20):`, row.slice(14, 21));
            continue;
        }
        if (summaryFound) {
            if (row[14] === 'סה"כ') {
                console.log(`Summary Totals Row ${i + 1}:`, row.slice(14, 21));
                break;
            }
            if (row[14] && row[14].trim()) {
                // console.log(`Summary Row ${i+1}:`, row.slice(14, 21));
            }
        }
    }
}

async function main() {
    try {
        await diagnoseMonth('פברואר 2026');
    } catch (err) {
        console.error(err);
    }
}

main();
