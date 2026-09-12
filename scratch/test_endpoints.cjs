const http = require('http');

const endpoints = [
  '/api/orders',
  '/api/styles',
  '/api/operation-bulletins',
  '/api/capacity-plans',
  '/api/line-designs',
  '/api/operators',
  '/api/lines',
  '/api/shifts',
  '/api/skill-matrix'
];

async function checkEndpoint(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:8085${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ path, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, length: data.length });
      });
    }).on('error', (err) => {
      resolve({ path, status: 'ERROR', ok: false, error: err.message });
    });
  });
}

async function run() {
  console.log('=== VERIFYING BACKEND APIS ===');
  let allPass = true;
  for (const ep of endpoints) {
    const res = await checkEndpoint(ep);
    if (res.ok) {
      console.log(`✓ [${res.status}] ${ep} (${res.length} bytes)`);
    } else {
      console.log(`✗ [${res.status}] ${ep} - ${res.error || 'Failed'}`);
      allPass = false;
    }
  }
  console.log(allPass ? '\nALL APIS 100% HEALTHY' : '\nSOME APIS FAILED');
}

run();
