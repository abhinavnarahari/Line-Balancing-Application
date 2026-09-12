const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

function post(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resData) });
        } catch (e) {
          resolve({ status: res.statusCode, body: resData });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testAll() {
  console.log("Testing Backend APIs on http://localhost:8085...\n");

  // 1. Get Bulletins
  const bRes = await get('http://localhost:8085/api/operation-bulletins');
  console.log(`[1] GET /api/operation-bulletins -> Status: ${bRes.status}, Total: ${bRes.body?.data?.length || 0}`);
  const firstBul = bRes.body?.data?.[0];
  if (firstBul) {
    console.log(`    First Bulletin: ${firstBul.bulletinCode} (v${firstBul.version}, rev ${firstBul.revisionNumber || 1}) - Total SMV: ${firstBul.totalSmv}m`);
  }

  // 2. Get Orders
  const oRes = await get('http://localhost:8085/api/orders');
  console.log(`[2] GET /api/orders -> Status: ${oRes.status}, Total: ${oRes.body?.data?.length || 0}`);
  const firstOrder = oRes.body?.data?.[0];

  // 3. Create Capacity Plan
  if (firstOrder) {
    const capPayload = {
      orderId: firstOrder.id,
      styleId: firstOrder.styleId,
      bulletinId: firstBul?.id,
      shiftId: firstOrder.shiftId || 1,
      orderQuantity: 5000,
      availableDays: 10,
      targetHourlyOutput: 70,
      plannedEfficiency: 80.0,
      allowancePfd: "5,4,1",
      totalSmvMinutes: firstBul?.totalSmv || 15.09
    };
    const capRes = await post('http://localhost:8085/api/capacity-plans', capPayload);
    console.log(`[3] POST /api/capacity-plans -> Status: ${capRes.status}`);
    console.log(`    Created Plan: ${capRes.body?.data?.planCode}`);
    console.log(`    Customer Takt: ${capRes.body?.data?.customerTaktSecs?.toFixed(1)}s`);
    console.log(`    Designed Pitch: ${capRes.body?.data?.designedPitchSecs?.toFixed(1)}s`);
    console.log(`    Planned Manpower: ${capRes.body?.data?.plannedManpower} ops`);

    const createdPlan = capRes.body?.data;

    // 4. Create Line Design
    if (createdPlan) {
      const designPayload = {
        designCode: `LD-${createdPlan.planCode}`,
        capacityPlanId: createdPlan.id,
        orderId: firstOrder.id,
        lineId: 1,
        shiftId: 1,
        totalWorkstations: createdPlan.plannedManpower || 22,
        totalOperators: createdPlan.plannedManpower || 22,
        totalHelpers: 2,
        totalQc: 1,
        totalMachines: 25,
        targetHourlyOutput: 70,
        plannedEfficiency: 80.0,
        designedPitchSecs: createdPlan.designedPitchSecs,
        status: "DRAFT",
        machines: [
          { machineType: "SNLS", requiredQty: 12, availableQty: 15, notes: "Available" },
          { machineType: "4-Thread Overlock", requiredQty: 4, availableQty: 5, notes: "Available" }
        ]
      };
      const desRes = await post('http://localhost:8085/api/line-designs', designPayload);
      console.log(`[4] POST /api/line-designs -> Status: ${desRes.status}`);
      console.log(`    Created Design: ${desRes.body?.data?.designCode}`);
      const createdDesign = desRes.body?.data;

      // 5. Query Line Balance for Design
      if (createdDesign) {
        const balRes = await get(`http://localhost:8085/api/line-balances/${createdDesign.id}`);
        console.log(`[5] GET /api/line-balances/${createdDesign.id} -> Status: ${balRes.status}`);
        console.log(`    Balance Stations: ${balRes.body?.data?.workstations?.length || 0}`);
        console.log(`    Balance Efficiency: ${balRes.body?.data?.lineBalanceEfficiency?.toFixed(1)}%`);

        // 6. Run Optimizer
        const optRes = await post(`http://localhost:8085/api/line-balances/${createdDesign.id}/optimize`, {});
        console.log(`[6] POST /api/line-balances/${createdDesign.id}/optimize -> Status: ${optRes.status}`);
        console.log(`    Optimized Efficiency: ${optRes.body?.data?.lineBalanceEfficiency?.toFixed(1)}%`);
        console.log(`    Recommendations Generated: ${optRes.body?.data?.recommendations?.length || 0}`);
        if (optRes.body?.data?.recommendations?.length > 0) {
          console.log(`    First Rec: ${optRes.body?.data?.recommendations[0]?.title} (${optRes.body?.data?.recommendations[0]?.strategyType})`);
        }
      }
    }
  }

  console.log("\nAll Enterprise API tests completed successfully!");
}

testAll().catch(err => {
  console.error("API test failed:", err);
  process.exit(1);
});
