const http = require('http');

const baseUrl = 'http://localhost:4000/api/sync';
const month = encodeURIComponent('פברואר 2026');

async function fetchJson(path) {
    return new Promise((resolve, reject) => {
        http.get(`${baseUrl}${path}`, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error(`Failed to parse: ${data.slice(0, 100)}`)); }
            });
        }).on('error', reject);
    });
}

async function run() {
    try {
        console.log(`Checking data for month: פברואר 2026`);

        const lbRes = await fetchJson(`/debug-sheet?month=${month}`);
        console.log('--- Leaderboard ---');
        console.log(lbRes.leaderboard && lbRes.leaderboard.length > 0
            ? JSON.stringify(lbRes.leaderboard, null, 2)
            : 'Leaderboard is empty');

        const errRes = await fetchJson('/errors');
        console.log('\n--- Sync Errors ---');
        console.log(errRes.data && errRes.data.length > 0
            ? JSON.stringify(errRes.data, null, 2)
            : 'No sync errors found');

    } catch (err) {
        console.error('Error:', err.message);
    }
}

run();
