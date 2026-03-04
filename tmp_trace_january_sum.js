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
        range: `'${tabName}'!A1:L168`,
    });

    const rows = res.data.values || [];
    let runningSum = 0;

    console.log('--- Row-by-row sum of Column I ---');
    rows.slice(1).forEach((row, i) => {
        const val = row[8]; // Column I
        const num = parseFloat((val || '').toString().replace(/[^\d.-]/g, ''));
        if (!isNaN(num)) {
            runningSum += num;
        }
    });
    console.log(`Final Running Sum: ${runningSum}`);

    // Let's also look for that 8500 or something similar
    rows.slice(1).forEach((row, i) => {
        const val = row[8];
        const num = parseFloat((val || '').toString().replace(/[^\d.-]/g, ''));
        if (num === 8500 || num === 4600) {
            console.log(`Found ${num} at Row ${i + 2}:`, row);
        }
    });

    // Check for "4600" in Column F?
    rows.slice(1).forEach((row, i) => {
        const val = row[5];
        const num = parseFloat((val || '').toString().replace(/[^\d.-]/g, ''));
        if (num === 4600) {
            console.log(`Found F:4600 at Row ${i + 2}:`, row);
        }
    });
}

main().catch(console.error);
