import { SyncService } from './apps/api/src/services/sync.service.js';

async function main() {
    const month = '2026-01-01';
    console.log(`Triggering sync for "${month}"...`);
    const result = await SyncService.triggerSync(month);
    console.log('Sync result:', JSON.stringify(result, null, 2));
    process.exit(0);
}

main().catch(console.error);
