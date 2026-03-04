import { dbPool } from './apps/api/src/config/db.js';
import { KPIService } from './apps/api/src/services/kpi.service.js';

async function main() {
    const month = 'פברואר 2026';
    const globalTarget = await KPIService.getMonthlyTarget(month);
    console.log(`Global Target for "${month}":`, globalTarget);
    process.exit(0);
}

main().catch(console.error);
