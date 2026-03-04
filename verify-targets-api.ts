import fetch from 'node-fetch';

async function verifyGlobalTarget() {
    const baseUrl = 'http://localhost:3000/api';
    const month = '2026-02';

    // 1. Get default target (should be 100,000)
    console.log('--- Verifying Default Target ---');
    let res = await fetch(`${baseUrl}/kpis/monthly-target?month=${month}`, {
        headers: { 'Authorization': 'Bearer <YOUR_TOKEN>' } // Note: Need a real token for full test, or use direct DB check
    });
    // Since I can't easily get a token here, I'll use a DB check script instead.
}
