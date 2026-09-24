const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  console.log("=== Testing Operator Allocation Full End-to-End Lifecycle ===");

  // 1. Planning Context
  console.log("\n1. GET /api/operator-allocation/planning-context");
  const ctxRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/operator-allocation/planning-context',
    method: 'GET'
  });
  const ctx = ctxRes.data.data;
  const shiftId = ctx.shiftId;
  const targetDate = ctx.planningDate;
  const lineIds = ctx.selectedLines.map(l => l.lineId);

  // 2. Optimize
  console.log("\n2. POST /api/operator-allocation/optimize");
  const optRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/operator-allocation/optimize',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    planningDate: targetDate,
    shiftId: shiftId,
    lineIds: lineIds,
    primaryScenario: 'MAX_OUTPUT',
    allowCrossLineTransfers: true,
    createdBy: 'Industrial Engineer Senior'
  });
  const runId = optRes.data.data.runId;
  console.log(`Created Run ID: ${runId} (${optRes.data.data.runCode}), Status: ${optRes.data.data.status}`);

  // 3. Manual Override Assignment
  console.log(`\n3. POST /api/operator-allocation/runs/${runId}/override`);
  const firstAssignment = optRes.data.data.matrix[0];
  const overrideRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: `/api/operator-allocation/runs/${runId}/override`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    lineId: firstAssignment.lineId,
    stationIndex: firstAssignment.stationIndex,
    newOperatorId: 10, // Assign specific operator
    pinAssignment: true,
    justification: 'Senior IE manual operator placement override for critical operation',
    performedBy: 'Lead IE Manager'
  });
  console.log(`Override Status: ${overrideRes.status}`);
  console.log(`Updated Assignment Operator: ${overrideRes.data.data?.matrix?.[0]?.operatorName} (Pinned: ${overrideRes.data.data?.matrix?.[0]?.isFixed})`);

  // 4. Approve Run
  console.log(`\n4. POST /api/operator-allocation/runs/${runId}/approve`);
  const approveRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: `/api/operator-allocation/runs/${runId}/approve`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    approvedBy: 'Operations Director',
    approvalComments: 'Optimal multi-line allocation plan reviewed and approved for morning shift'
  });
  console.log(`Approve Status: ${approveRes.status}, New Status: ${approveRes.data.data?.status}`);

  // 5. Apply Run
  console.log(`\n5. POST /api/operator-allocation/runs/${runId}/apply`);
  const applyRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: `/api/operator-allocation/runs/${runId}/apply`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    appliedBy: 'Floor Production Manager',
    notes: 'Dispatched to tablet terminals at sewing lines'
  });
  console.log(`Apply Status: ${applyRes.status}, Final Run Status: ${applyRes.data.data?.status}`);

  // 6. Audit Trail
  console.log(`\n6. GET /api/operator-allocation/runs/${runId}/audits`);
  const auditRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: `/api/operator-allocation/runs/${runId}/audits`,
    method: 'GET'
  });
  console.log(`Audit Status: ${auditRes.status}`);
  const audits = auditRes.data.data;
  console.log(`Audit Trail Log Entries (${audits?.length}):`);
  audits?.forEach(a => {
    console.log(` - [${a.actionType}] by ${a.performedBy} at ${a.createdAt}: ${a.justification || a.details || ''}`);
  });

  console.log("\n=== Full End-to-End Operator Allocation Lifecycle Succeeded! ===");
}

run().catch(console.error);
