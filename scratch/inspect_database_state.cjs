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

async function inspectData() {
  console.log("=== INSPECTING CURRENT DATABASE STATE ===");

  const orders = await get('/orders');
  console.log("\n--- ORDERS ---");
  console.log(JSON.stringify(orders.body?.data || orders.body, null, 2));

  const styles = await get('/styles');
  console.log("\n--- STYLES ---");
  console.log(JSON.stringify(styles.body?.data || styles.body, null, 2));

  const bulletins = await get('/operation-bulletins');
  console.log("\n--- OPERATION BULLETINS ---");
  console.log(JSON.stringify(bulletins.body?.data || bulletins.body, null, 2));

  const shifts = await get('/shifts');
  console.log("\n--- SHIFTS ---");
  console.log(JSON.stringify(shifts.body?.data || shifts.body, null, 2));

  const lines = await get('/lines');
  console.log("\n--- SEWING LINES ---");
  console.log(JSON.stringify(lines.body?.data || lines.body, null, 2));

  const machines = await get('/machines');
  console.log("\n--- MACHINES ---");
  console.log(JSON.stringify(machines.body?.data || machines.body, null, 2));
}

inspectData().catch(console.error);
