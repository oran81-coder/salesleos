import { SyncService } from './apps/api/src/services/sync.service.js';

async function main() {
    const month = 'פברואר 2026';
    console.log(`[Diagnostic] Starting sync for ${month}...`);
    try {
        const result = await SyncService.triggerSync(month);
        console.log('[Diagnostic] Sync result:', JSON.stringify(result, null, 2));
    } catch (err: any) {
        console.error('[Diagnostic] Sync FAILED!');
        console.error('Error Name:', err?.name);
        console.error('Error Message:', err?.message);
        console.error('Stack Trace:', err?.stack);
        if (err?.response?.data) {
            console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
        }
    }
}

main().catch(err => {
    console.error('[Diagnostic] Fatal Error in main:', err);
    process.exit(1);
});
