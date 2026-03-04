const { google } = require('googleapis');
const fs = require('fs');

async function main() {
    const auth = new google.auth.JWT({
        email: process.env.SHEETS_CLIENT_EMAIL,
        key: process.env.SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SHEETS_SPREADSHEET_ID;

    // Fetch February 2026 tab
    const tabName = 'פברואר 2026';
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${tabName}'!A:L`,
    });

    const rows = res.data.values || [];
    console.log(`--- Values in Column K (Index 10: "סוג") for ${tabName} ---`);
    const types = new Set();
    rows.slice(1).forEach((row, i) => {
        const val = row[10] || '';
        if (i < 20) console.log(`Row ${i + 2}: "${val}"`);
        if (val) types.add(val);
    });

    console.log('\nUnique types found:', Array.from(types));
}

main().catch(console.error);
