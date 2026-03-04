import { fetchSheetValues } from './apps/sync-worker/src/sheets-client.js';
import { parseHebrewMonthTab } from './apps/sync-worker/src/sync.service.js';

async function main() {
    const tabName = 'פברואר 2026';
    const sheetMonth = parseHebrewMonthTab(tabName);
    const targetMonthPrefix = sheetMonth.substring(0, 7); // "2026-02"

    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);

    let totalSales = 0;
    let totalCollection = 0; // Rolling
    let dealCount = 0;
    let offsetValue = 0;

    console.log(`Processing ${allValues.length} rows...`);

    // We process all rows. 
    // Deals are in A-M (0-12)
    // Summary is in O-Z (14-25)
    for (let i = 1; i < allValues.length; i++) {
        const row = allValues[i];
        if (!row) continue;

        // Deal Processing (Columns A-M)
        const repNameDeals = String(row[3] || '').trim();
        if (repNameDeals && !repNameDeals.includes('נציג') && !repNameDeals.includes('סה"כ')) {
            // Date Parsing (Column A)
            let dealDateStr = '';
            if (row[0]) {
                const rawDate = String(row[0]).trim();
                if (/^\d{5}/.test(rawDate)) {
                    const date = new Date((parseFloat(rawDate) - 25569) * 86400 * 1000);
                    dealDateStr = date.toISOString().split('T')[0];
                } else if (/^\d{1,2}[./]\d{1,2}/.test(rawDate)) {
                    const parts = rawDate.split(/[./]/);
                    const year = parts[2] ? (parts[2].length === 2 ? '20' + parts[2] : parts[2]) : '2026';
                    dealDateStr = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                } else if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
                    dealDateStr = rawDate.split(' ')[0];
                }
            }

            const amountF = parseFloat(String(row[5] || '').replace(/[^\d.-]/g, '')) || 0;
            const bonusI = parseFloat(String(row[8] || '').replace(/[^\d.-]/g, '')) || 0;

            // Sales: Filtered by Date
            if (dealDateStr.startsWith(targetMonthPrefix)) {
                totalSales += amountF;
                dealCount++;
            }

            // Collection: Rolling (All rows in tab)
            totalCollection += bonusI;
        }

        // Summary Table Processing (Columns O-Z)
        const summaryLabel = String(row[13] || row[14] || '').trim();
        if (summaryLabel === 'סה"כ') {
            const rowOffset = parseFloat(String(row[17] || '').replace(/[^\d.-]/g, '')) || 0;
            offsetValue += rowOffset; // Sum up if there are multiple "Total" rows
        }
    }

    console.log(`\n--- Independent Calculation Result (${tabName}) ---`);
    console.log(`Target Month: ${targetMonthPrefix}`);
    console.log(`Calculated Total Sales (Column F, filtered): ₪${totalSales.toLocaleString()}`);
    console.log(`Calculated Total Collection (Column I, rolling): ₪${totalCollection.toLocaleString()}`);
    console.log(`Calculated Deal Count (filtered): ${dealCount}`);
    console.log(`Offset detected from Summary table (index 17): ₪${offsetValue.toLocaleString()}`);
    console.log(`Bonus Base (Collection - Offset): ₪${(totalCollection - offsetValue).toLocaleString()}`);
}

main().catch(console.error);
