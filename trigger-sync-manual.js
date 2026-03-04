const http = require('http');

const month = encodeURIComponent('פברואר 2026');
const url = `http://localhost:4000/api/sync/debug-run-sync?month=${month}`;

console.log('Triggering sync for:', month);
http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Sync Response:', data);
        try {
            const json = JSON.parse(data);
            if (json.success) {
                console.log('Sync triggered successfully!');
            } else {
                console.error('Sync failed:', json.message);
            }
        } catch (e) {
            console.error('Error parsing response:', e.message);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
