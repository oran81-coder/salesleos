import { SyncService } from './apps/api/src/services/sync.service.js';
import dotenv from 'dotenv';
dotenv.config();

// Mock req.user for SyncService if needed, but it's static
async function main() {
    const month = 'פברואר 2026';
    console.log(`Starting sync for ${month}...`);
    try {
        const result = await SyncService.triggerSync(month);
        console.log('Sync result:', result);
    } catch (err) {
        console.error('Sync failed:', err);
    }
}

main();
