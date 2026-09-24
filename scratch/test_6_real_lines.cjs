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

function get(path) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:8085' + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('--- 1. Testing line-requirements for all 6 real lines [1, 7, 8, 9, 10, 11] ---');
  const reqRes = await get('/api/operator-allocation/line-requirements?lineIds=1,7,8,9,10,11');
  const lines = reqRes.data || reqRes;
  console.log(`Lines returned: ${lines?.length}`);
  lines?.forEach(l => {
    console.log(`Line ${l.lineId} (${l.lineCode} - ${l.lineName}): Stations count = ${l.stations?.length}`);
  });

  console.log('\n--- 2. Testing optimize for all 6 real lines [1, 7, 8, 9, 10, 11] ---');
  const payload = {
    planningDate: "2026-09-19",
    shiftId: 1,
    lineIds: [1, 7, 8, 9, 10, 11],
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

  const optRes = await post('/api/operator-allocation/optimize', payload);
  console.log('Optimize status:', optRes.status);
  console.log('Total matrix assignments:', optRes.data?.data?.matrix?.length);
  console.log('Total line results:', optRes.data?.data?.lineResults?.length);
  console.log('Run code:', optRes.data?.data?.runCode);
}

run().catch(console.error);
