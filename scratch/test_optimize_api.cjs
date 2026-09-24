const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request('http://localhost:8085' + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('--- Testing /api/operator-allocation/optimize ---');
  // First let's get line IDs
  const payload = {
    planningDate: "2026-09-19",
    shiftId: 1,
    lineIds: [1, 2, 3, 4, 5, 6],
    primaryScenario: "MAX_OUTPUT",
    allowCrossLineTransfers: true,
    allowTraineesOnSimpleOps: true,
    createdBy: "Industrial Engineer",
    weights: {
      efficiencyWeight: 95,
      lineBalanceWeight: 65,
      skillMatchWeight: 90,
      machineCompatWeight: 45
    }
  };

  const res = await post('/api/operator-allocation/optimize', payload);
  console.log('Status code:', res.status);
  console.log('Response:', JSON.stringify(res.data, null, 2));
}

run().catch(console.error);
