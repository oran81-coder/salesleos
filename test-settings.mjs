import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SETTINGS_FILE = join(process.cwd(), 'apps', 'api', '.dev-mock-settings.json');

if (existsSync(SETTINGS_FILE)) {
    const data = readFileSync(SETTINGS_FILE, 'utf-8');
    console.log("=== ACTUAL DEV MOCK SETTINGS FILE ===");
    console.log(data);
    const parsed = JSON.parse(data);
    const mappingStr = parsed['sheets_mapping'];
    console.log("\n=== PARSED MAPPING OBJECT ===");
    console.log(JSON.stringify(JSON.parse(mappingStr), null, 2));
} else {
    console.log("File not found:", SETTINGS_FILE);
}
