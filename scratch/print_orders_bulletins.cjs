const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:8085/api${path}`, (res) => {
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

async function inspectOrdersAndBulletins() {
  const orders = await get('/orders');
  console.log("=== ORDERS LIST ===");
  (orders.body?.data || []).forEach(o => {
    console.log(`ID: ${o.id}, OrderNo: ${o.orderNo}, StyleId: ${o.styleId}, StyleNo: ${o.styleNo}, Buyer: ${o.buyer}, Qty: ${o.quantity}, LineId: ${o.lineId}, ShiftId: ${o.shiftId}`);
  });

  const bulletins = await get('/operation-bulletins');
  console.log("\n=== BULLETINS LIST ===");
  (bulletins.body?.data || []).forEach(b => {
    console.log(`ID: ${b.id}, Code: ${b.bulletinCode}, Name: ${b.name}, TotalSMV: ${b.totalSmv}, Styles: ${JSON.stringify(b.styles?.map(s => s.styleNo))}, LineCount: ${b.lines?.length}`);
    b.lines?.forEach(l => {
      console.log(`   - Seq ${l.sequence}: ${l.operationName} (${l.operationCode}) | SMV: ${l.smv}m (${(l.smv * 60).toFixed(1)}s) | Machine: ${l.machineType}`);
    });
  });
}

inspectOrdersAndBulletins().catch(console.error);
