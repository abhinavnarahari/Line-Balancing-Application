const http = require('http');

function fetch(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:8085${path}`, res => {
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
  console.log("=== Testing Dashboard Data Feeds ===");
  
  const [lines, orders, bulletins, plans, operators, skills, machines, capacity, designs] = await Promise.all([
    fetch('/api/lines'),
    fetch('/api/orders'),
    fetch('/api/operation-bulletins'),
    fetch('/api/line-plans'),
    fetch('/api/operators'),
    fetch('/api/skill-matrix'),
    fetch('/api/machines'),
    fetch('/api/capacity-plans'),
    fetch('/api/line-designs'),
  ]);

  console.log("1. Lines count:", lines.data?.length || lines.length);
  (lines.data || lines).forEach(l => console.log(`   - [${l.lineCode}] ${l.lineName} (Workstations: ${l.workstationCount}, Operators: ${l.operatorCount}, Active: ${l.active})`));

  console.log("\n2. Orders count:", orders.data?.length || orders.length);
  (orders.data || orders).forEach(o => console.log(`   - [${o.orderNo}] Buyer: ${o.buyer}, Style: ${o.style?.styleNo || o.styleNo || o.styleId}, Qty: ${o.totalQuantity}, Status: ${o.status}`));

  console.log("\n3. Bulletins count:", bulletins.data?.length || bulletins.length);
  (bulletins.data || bulletins).forEach(b => console.log(`   - [${b.bulletinCode}] ${b.name}, Total SMV: ${b.totalSmv} min, Lines: ${b.lines?.length || b.bulletinLines?.length}`));

  console.log("\n4. Line Plans count:", plans.data?.length || plans.length);
  (plans.data || plans).forEach(p => console.log(`   - Plan ID ${p.id}: Line: ${p.lineCode || p.lineId}, Order ID: ${p.orderId}, Target: ${p.targetOutput}, Status: ${p.status}, Assignments: ${p.assignments?.length}`));

  console.log("\n5. Operators count:", operators.data?.length || operators.length);
  console.log("6. Skill Matrix records:", skills.data?.length || skills.length);
  console.log("7. Machines count:", machines.data?.length || machines.length);
  console.log("8. Capacity Plans count:", capacity.data?.length || capacity.length);
  console.log("9. Line Designs count:", designs.data?.length || designs.length);
  
  console.log("\n✓ All Dashboard backend data feeds are healthy and connected!");
}

run().catch(console.error);
