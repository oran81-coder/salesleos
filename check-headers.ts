import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const spreadsheetId = process.env.SHEETS_SPREADSHEET_ID;
const clientEmail = process.env.SHEETS_CLIENT_EMAIL;
const privateKey = process.env.SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

async function checkHeaders() {
    if (!spreadsheetId || !clientEmail || !privateKey) {
        console.error('Missing credentials in .env');
        return;
    }

    const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const tabName = 'פברואר 2026';

    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${tabName}'!A1:Z5`,
        });
        const rows = res.data.values || [];
        console.log('Headers (Row 1):', JSON.stringify(rows[0], null, 2));
        console.log('Sample Data (Row 2):', JSON.stringify(rows[1], null, 2));
        console.log('Sample Data (Row 3):', JSON.stringify(rows[2], null, 2));
    } catch (err) {
        console.error('Error fetching values:', err);
    }
}

checkHeaders();
