const http = require('http');

function fetchJson(path) {
  return new Promise((resolve) => {
    http.get('http://localhost:8085/api' + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: e.message, raw: data.substring(0, 100) });
        }
      });
    }).on('error', err => resolve({ error: err.message }));
  });
}

async function inspectAll() {
  const endpoints = [
    '/lines',
    '/orders',
    '/operation-bulletins',
    '/line-plans',
    '/operators',
    '/operations',
    '/machines',
    '/shifts',
    '/attendance/today',
    '/production-logs/timesheets/24h',
    '/capacity/plans',
    '/line-designs',
    '/operator-allocations/runs',
  ];

  console.log('=== CURRENT ACTIVE BACKEND DATA STATE ===');
  for (const ep of endpoints) {
    const data = await fetchJson(ep);
    const list = Array.isArray(data) ? data : (data?.data || data?.runs || data?.plans || data?.records || data?.entries || []);
    console.log(`${ep}: count = ${Array.isArray(list) ? list.length : typeof data}`);
  }
}

inspectAll();
