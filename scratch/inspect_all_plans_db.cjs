const http = require('http');

http.get('http://localhost:8085/api/line-plans', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("=== All Line Plans ===");
    try {
      const plans = JSON.parse(data);
      plans.forEach(p => {
        console.log(`Plan ID: ${p.id}, Order: ${p.orderId}, Line: ${p.lineId}, Assignments count: ${p.assignments?.length}`);
        (p.assignments || []).forEach((a, i) => {
          console.log(`  [${i}] Stn: ${a.stationNum}, opId: ${a.operationId}, bulletinLineId: ${a.bulletinLineId}, opId: ${a.operatorId}`);
        });
      });
    } catch (e) {
      console.log("Error:", data);
    }
  });
}).on('error', err => console.error(err));
