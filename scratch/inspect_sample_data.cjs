const http = require('http');

function apiCall(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8085,
      path: path,
      method: 'GET'
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve(body); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function inspect() {
  console.log('=== Active Database Sample Data Inspection ===\n');

  const endpoints = [
    { name: 'Operators', path: '/api/operators' },
    { name: 'Shifts', path: '/api/shifts' },
    { name: 'Operations', path: '/api/operations' },
    { name: 'Styles', path: '/api/styles' },
    { name: 'Orders', path: '/api/orders' },
    { name: 'Operation Bulletins', path: '/api/operation-bulletins' },
    { name: 'Sewing Lines', path: '/api/sewing-lines' },
    { name: 'Machines', path: '/api/machines' },
    { name: 'Skill Matrix History / Records', path: '/api/skill-assessments' },
    { name: 'Line Plans', path: '/api/line-plans' },
    { name: 'Line Designs', path: '/api/line-designs' },
    { name: 'Notifications', path: '/api/notifications' },
  ];

  for (const ep of endpoints) {
    try {
      const res = await apiCall(ep.path);
      const data = res.data || res;
      const count = Array.isArray(data) ? data.length : (data ? 1 : 0);
      console.log(`✓ ${ep.name.padEnd(32)}: ${count} records present`);
    } catch (err) {
      console.log(`✗ ${ep.name.padEnd(32)}: Failed (${err.message})`);
    }
  }

  console.log('\n=== Inspection Complete ===');
}

inspect().catch(console.error);
