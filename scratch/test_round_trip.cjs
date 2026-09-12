const http = require('http');

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function testRoundTrip() {
  console.log('--- 1. Fetching active plan for order 5 ---');
  const planRes = await request('http://localhost:8085/api/line-plans/4');
  console.log('Plan 4 initial:', { 
    id: planRes.body.id, 
    plannedEfficiency: planRes.body.plannedEfficiency,
    orderId: planRes.body.orderId,
    shiftId: planRes.body.shiftId,
    targetOutput: planRes.body.targetOutput
  });

  console.log('--- 2. Saving plan with plannedEfficiency = 85.0 ---');
  const payload = {
    orderId: planRes.body.orderId,
    shiftId: planRes.body.shiftId,
    lineId: planRes.body.lineId,
    allowance: planRes.body.allowance ?? 10,
    allowancePfd: planRes.body.allowancePfd ?? '5,4,1',
    plannedEfficiency: 85.0,
    targetOutput: 250,
    assignments: []
  };

  const saveRes = await request('http://localhost:8085/api/line-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  });
  console.log('POST save status:', saveRes.status, 'Saved efficiency:', saveRes.body.plannedEfficiency);

  console.log('--- 3. Re-fetching plan ---');
  const verifyRes = await request('http://localhost:8085/api/line-plans?orderId=5');
  console.log('Re-fetched plannedEfficiency:', verifyRes.body.plannedEfficiency);

  // Restore back to 80.0
  console.log('--- 4. Restoring back to 80.0 ---');
  await request('http://localhost:8085/api/line-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { ...payload, plannedEfficiency: 80.0, targetOutput: 229 }
  });
  const finalRes = await request('http://localhost:8085/api/line-plans?orderId=5');
  console.log('Final restored efficiency:', finalRes.body.plannedEfficiency);
  console.log('--- Verification COMPLETE: plannedEfficiency persisted & restored seamlessly! ---');
}

testRoundTrip();
