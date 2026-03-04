import { KPIService } from './apps/api/src/services/kpi.service.js';

async function main() {
    const month = '2026-01-01';

    console.log('--- Verifying KPI Service Totals (Jan 2026) ---');
    const summary = await KPIService.getDepartmentSummary(null, month);
    console.log('Department Summary:', JSON.stringify(summary, null, 2));

    const leaderboard = await KPIService.getLeaderboard(null, month);
    const barak = leaderboard.find(r => r.repName === 'ברק קציר');
    console.log('Barak in Leaderboard:', barak ? 'Yes' : 'No');

    process.exit(0);
}

main().catch(console.error);
