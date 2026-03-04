import http from 'http';

const data = JSON.stringify({
    month: '2026-02-01'
});

const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/sync/trigger',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('Sending POST request to /api/sync/trigger...');

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);

    let responseData = '';
    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('Response body:', responseData);
        try {
            JSON.parse(responseData);
            console.log('Response is valid JSON.');
        } catch (e) {
            console.log('Response is NOT valid JSON!');
        }
    });
});

req.on('error', (error) => {
    console.error('Request Error:', error);
});

req.write(data);
req.end();
