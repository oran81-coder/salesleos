import { fetchSheetValues } from './apps/sync-worker/src/sheets-client.js';
import { parseHebrewMonthTab } from './apps/sync-worker/src/sync.service.js';

async function main() {
    const tabName = 'פברואר 2026';
    const sheetMonth = parseHebrewMonthTab(tabName);
    const targetMonthPrefix = sheetMonth.substring(0, 7); // "2026-02"

    const allValues = await fetchSheetValues(`'${tabName}'!A:Z`);

    let totalSales = 0;
    let count = 0;

    for (let i = 1; i < allValues.length; i++) {
        const row = allValues[i];
        if (!row[3] || row[3].includes('נציג') || row[3].includes('סה"כ')) continue;
        if (row[14] === 'נציג') break;

        const rawAmount = String(row[5] || '').trim();
        if (rawAmount.startsWith('-') && rawAmount.endsWith('-')) continue;

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

        if (dealDateStr.startsWith(targetMonthPrefix)) {
            const amount = parseFloat(rawAmount.replace(/[^\d.-]/g, '')) || 0;
            totalSales += amount;
            count++;
            console.log(`Row ${i + 1}: Date=${dealDateStr}, Amount=${amount}, Rep=${row[3]}`);
        }
    }

    console.log(`\nTotal Calculated Sales: ₪${totalSales.toLocaleString()}`);
    console.log(`Total Count: ${count}`);
}

main().catch(console.error);
