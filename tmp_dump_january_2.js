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
        range: `'${tabName}'!A151:Z350`,
    });

    const rows = res.data.values || [];
    rows.forEach((row, i) => {
        console.log(`Row ${i + 151}:`, row.join(' | '));
    });
}

main().catch(console.error);
