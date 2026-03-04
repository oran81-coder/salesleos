import { google } from 'googleapis';
import { loadConfig } from '@laos/config';

const config = loadConfig();

const sheets = google.sheets('v4');

function getJwtClient() {
  const { clientEmail, privateKey } = config.sheets;
  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

export async function fetchSheetValues(range: string): Promise<string[][]> {
  const auth = getJwtClient();
  const res = await sheets.spreadsheets.values.get({
    auth,
    spreadsheetId: config.sheets.spreadsheetId,
    range,
  });
  return (res.data.values as string[][]) ?? [];
}
