const { google } = require('googleapis');

async function main() {
    const auth = new google.auth.JWT({
        email: process.env.SHEETS_CLIENT_EMAIL,
        key: process.env.SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SHEETS_SPREADSHEET_ID;

    const tabName = 'ינואר 26';
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${tabName}'!A:Z`,
    });

    const rows = res.data.values || [];

    // 1. Check Summary Table (Small Table) - typically starting after the large table or at a specific range
    // In Feb/Mar we saw it around index 17 (Column R) for offset.
    console.log('--- Summary Table Inspection (Rows near the end or specific headers) ---');
    let offsetSum = 0;
    rows.forEach((row, i) => {
        if (row.includes('סכימה') || row.includes('סה"כ')) {
            console.log(`Row ${i + 1}:`, row);
        }
        // Looking for Column R (index 17) - Offset
        const val = row[17];
        if (val && !isNaN(parseFloat(val.replace(/[^\d.-]/g, '')))) {
            // Just logging for now to see where it is
        }
    });

    // 2. Sum Column I (Collection)
    let collectionTotal = 0;
    rows.slice(1).forEach((row, i) => {
        const val = row[8]; // Column I (index 8)
        const num = parseFloat((val || '').toString().replace(/[^\d.-]/g, ''));
        if (!isNaN(num)) {
            collectionTotal += num;
        }
    });
    console.log(`\nSum of Column I (Deals Table): ${collectionTotal}`);

    // 3. Find specific Summary cells
    // Looking for "סכום גבייה לאחר קיזוז" in the rows
    rows.forEach((row, i) => {
        row.forEach((cell, j) => {
            if (typeof cell === 'string' && (cell.includes('גבייה') || cell.includes('קיזוז'))) {
                console.log(`Row ${i + 1}, Col ${String.fromCharCode(65 + j)}: "${cell}" (Value next col: "${row[j + 1]}")`);
            }
        });
    });
}

main().catch(console.error);
