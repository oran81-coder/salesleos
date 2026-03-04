import { dbPool } from './apps/api/src/config/db.js';
import { KPIService } from './apps/api/src/services/kpi.service.js';

async function main() {
    const month = '2026-02-01';
    const data: any = await KPIService.getLeaderboard(null, month);

    console.log('--- Leaderboard Data Diagnostic ---');
    data.forEach((r: any) => {
        console.log(`Rep: ${r.repName}`);
        console.log(`  TotalSales: ${r.TotalSales}`);
        console.log(`  Target: ${r.Target}`);
        console.log(`  TargetAchievement: ${r.TargetAchievement}`);
        console.log(`  Calculation: (${r.TotalSales} / ${r.Target}) * 100 = ${(r.TotalSales / r.Target) * 100}`);
    });

    process.exit(0);
}

main().catch(console.error);
