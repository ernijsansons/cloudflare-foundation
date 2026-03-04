const http = require('http');

function fetchEndpoint(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', (err) => resolve({ status: 'error', data: err.message }));
  });
}

async function run() {
  console.log('Testing Local Cloudflare Workers Cluster...');
  
  const endpoints = [
    { name: 'Gateway Health', url: 'http://localhost:8788/api/health' },
    { name: 'Planning Machine Health', url: 'http://localhost:8788/api/planning/health' },
    // A fake request to see if routing works
    { name: 'Fake Planning Run', url: 'http://localhost:8788/api/planning/runs' },
  ];

  for (const ep of endpoints) {
    const res = await fetchEndpoint(ep.url);
    console.log(`\n--- ${ep.name} ---`);
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${res.data.substring(0, 200)}`);
  }
}

run();
