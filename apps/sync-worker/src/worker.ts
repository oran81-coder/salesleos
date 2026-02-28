import { loadConfig } from '@laos/config';
import { runSyncOnce } from './sync.service.js';

const config = loadConfig();

async function main() {
  // In this first version we assume a single tab label provided via env.
  // Later the API/cron can trigger multiple months as needed.
  const monthLabel = process.env.SHEETS_TAB_LABEL;
  if (!monthLabel) {
    throw new Error('SHEETS_TAB_LABEL environment variable is required for sync worker');
  }

  // Initial immediate run
  await runSyncOnce(monthLabel);

  // Interval-based sync according to config.sync.intervalMs
  setInterval(() => {
    runSyncOnce(monthLabel).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Sync worker error:', err);
    });
  }, config.sync.intervalMs);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start sync worker:', err);
  process.exit(1);
});

