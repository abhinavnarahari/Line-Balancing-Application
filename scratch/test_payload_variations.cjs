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

async function testVariations() {
  console.log('=== Testing payload variations ===');

  // Case 1: shiftId is undefined / null
  const res1 = await post('/api/operator-allocation/optimize', {
    planningDate: "2026-09-19",
    lineIds: [1, 2, 3, 4, 5, 6],
    primaryScenario: "MAX_OUTPUT",
    allowCrossLineTransfers: true,
    allowTraineesOnSimpleOps: true,
    createdBy: "Industrial Engineer",
  });
  console.log('Case 1 (null shiftId): status =', res1.status, 'success =', res1.data?.success || res1.data?.status);

  // Case 2: lineIds is empty []
  const res2 = await post('/api/operator-allocation/optimize', {
    planningDate: "2026-09-19",
    shiftId: 1,
    lineIds: [],
    primaryScenario: "MAX_OUTPUT",
    allowCrossLineTransfers: true,
    allowTraineesOnSimpleOps: true,
    createdBy: "Industrial Engineer",
  });
  console.log('Case 2 (empty lineIds): status =', res2.status, 'success =', res2.data?.success || res2.data?.status);

  // Case 3: lineIds is null / undefined
  const res3 = await post('/api/operator-allocation/optimize', {
    planningDate: "2026-09-19",
    shiftId: 1,
    primaryScenario: "MAX_OUTPUT",
    allowCrossLineTransfers: true,
    allowTraineesOnSimpleOps: true,
    createdBy: "Industrial Engineer",
  });
  console.log('Case 3 (null lineIds): status =', res3.status, 'success =', res3.data?.success || res3.data?.status);

  // Case 4: Line IDs that exist in DB (1, 2, 3, 4, 5, 6)
  const res4 = await post('/api/operator-allocation/optimize', {
    planningDate: "2026-09-19",
    shiftId: 1,
    lineIds: [1, 2, 3, 4, 5, 6],
    primaryScenario: "MAX_OUTPUT",
    allowCrossLineTransfers: true,
    allowTraineesOnSimpleOps: true,
    createdBy: "Industrial Engineer",
    weights: { efficiencyWeight: 95, lineBalanceWeight: 65, skillMatchWeight: 90, machineCompatWeight: 45 }
  });
  console.log('Case 4 (all 6 lines with weights): status =', res4.status, 'success =', res4.data?.success);
}

testVariations().catch(console.error);
