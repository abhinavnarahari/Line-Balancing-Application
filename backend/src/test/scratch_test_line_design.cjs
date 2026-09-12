const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null });
        } catch(e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log('Testing Line Design API...');
  
  // 1. Get orders
  const ordersRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/orders',
    method: 'GET'
  });
  const orders = ordersRes.body?.data || ordersRes.body || [];
  const order = orders[0];
  if (!order) {
    console.error('No orders found in:', ordersRes.body);
    return;
  }

  // 2. Post a Line Design with strategy allocations
  const allocs = { "1": 1, "2": 2, "3": 1, "4": 1, "5": 1, "6": 1, "7": 1, "8": 1 };
  const payload = {
    designCode: 'LD-TEST-' + Date.now(),
    orderId: order.id,
    lineId: 1,
    totalWorkstations: 9,
    totalOperators: 9,
    totalHelpers: 2,
    totalQc: 1,
    totalMachines: 9,
    targetHourlyOutput: 81,
    plannedEfficiency: 85.0,
    designedPitchSecs: 37.8,
    lineBalanceEfficiency: 64.8,
    strategyName: 'recommended',
    stationAllocations: JSON.stringify(allocs),
    status: 'DRAFT',
    machines: [
      { machineType: 'Single Needle Lockstitch (SNLS)', requiredQty: 6, availableQty: 10 }
    ]
  };

  const createRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/line-designs',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, payload);

  const created = createRes.body?.data || createRes.body;
  console.log('Create Line Design status:', createRes.status);
  console.log('Created Line Design:', {
    id: created?.id,
    designCode: created?.designCode,
    strategyName: created?.strategyName,
    stationAllocations: created?.stationAllocations,
    targetHourlyOutput: created?.targetHourlyOutput,
    plannedEfficiency: created?.plannedEfficiency
  });

  // 3. Get design by ID
  if (created?.id) {
    const getRes = await request({
      hostname: 'localhost',
      port: 8085,
      path: `/api/line-designs/${created.id}`,
      method: 'GET'
    });
    const fetched = getRes.body?.data || getRes.body;
    console.log('Get Line Design status:', getRes.status);
    console.log('Fetched strategyName:', fetched?.strategyName);
    console.log('Fetched stationAllocations:', fetched?.stationAllocations);
  }
}

run().catch(console.error);
