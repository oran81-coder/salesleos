const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Basic .env parser
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    const env = {};
    for (const line of lines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            env[match[1]] = value.replace(/\\n/g, '\n');
        }
    }
    return env;
}

async function main() {
    const env = loadEnv();
    const spreadsheetId = env.SHEETS_SPREADSHEET_ID;
    const clientEmail = env.SHEETS_CLIENT_EMAIL;
    const privateKey = env.SHEETS_PRIVATE_KEY;

    if (!spreadsheetId || !clientEmail || !privateKey) {
        console.error('Missing credentials');
        process.exit(1);
    }

    const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const tabName = 'פברואר 2026';

    try {
        console.log(`Fetching ${tabName}...`);
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${tabName}'!A1:Z100`,
        });
        const rows = res.data.values || [];

        console.log('--- Headers ---');
        console.log(JSON.stringify(rows[0]));

        console.log('--- Sample Deals (Columns 0-15) ---');
        for (let i = 1; i < 5; i++) {
            if (rows[i]) console.log(`Row ${i + 1}: ${JSON.stringify(rows[i].slice(0, 15))}`);
        }

        console.log('--- Summary Section (Searching for Keren at index 14) ---');
        const kerenRow = rows.find(r => r[14] && (r[14].includes('קרן') || r[14].includes('Keren')));
        if (kerenRow) {
            console.log('Keren Summary Row:', JSON.stringify(kerenRow));
            console.log('Offset (Index 17):', kerenRow[17]);
        } else {
            console.log('Keren not found in first 100 rows');
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

main();
