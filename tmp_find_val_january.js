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

    console.log('--- Searching for 1,924,150 and identifying its neighbors ---');
    rows.forEach((row, i) => {
        row.forEach((cell, j) => {
            const val = (cell || '').toString().replace(/[^\d]/g, '');
            if (val === '1924150') {
                console.log(`FOUND 1,924,150 at Row ${i + 1}, Col ${String.fromCharCode(65 + j)}`);
                console.log(`Row content:`, row);
            }
        });
    });

    // Also look for 4600 specifically
    rows.forEach((row, i) => {
        row.forEach((cell, j) => {
            const val = (cell || '').toString().replace(/[^\d]/g, '');
            if (val === '4600') {
                console.log(`FOUND 4,600 at Row ${i + 1}, Col ${String.fromCharCode(65 + j)}`);
                console.log(`Row content:`, row);
            }
        });
    });
}

main().catch(console.error);
