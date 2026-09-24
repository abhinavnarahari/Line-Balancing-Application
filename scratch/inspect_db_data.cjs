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
  console.log("=== Checking current application entities ===");

  // 1. Get lines
  const linesRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/lines',
    method: 'GET'
  });
  console.log(`Lines (${linesRes.data?.data?.length || linesRes.data?.length}):`);
  const lines = linesRes.data?.data || linesRes.data;
  lines?.forEach(l => console.log(` - ID: ${l.id}, Code: ${l.lineCode}, Name: ${l.lineName}, ActiveStyle: ${l.currentStyle}, ActiveOB: ${l.currentBulletin}`));

  // 2. Get styles
  const stylesRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/styles',
    method: 'GET'
  });
  const styles = stylesRes.data?.data || stylesRes.data;
  console.log(`\nStyles (${styles?.length}):`);
  styles?.forEach(s => console.log(` - ID: ${s.id}, Code: ${s.styleCode || s.code}, Name: ${s.styleName || s.name}`));

  // 3. Get Operation Bulletins
  const obsRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/operation-bulletins',
    method: 'GET'
  });
  const obs = obsRes.data?.data || obsRes.data;
  console.log(`\nOperation Bulletins (${obs?.length}):`);
  obs?.forEach(b => console.log(` - ID: ${b.id}, Code: ${b.bulletinCode || b.code}, Style: ${b.styleCode || b.style?.styleCode || b.style?.name}, Status: ${b.status}, LinesCount: ${b.bulletinLines?.length || b.lines?.length}`));

  // 4. Get Machines
  const macRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/machines',
    method: 'GET'
  });
  const machines = macRes.data?.data || macRes.data;
  console.log(`\nMachines (${machines?.length}):`);
  machines?.slice(0, 8).forEach(m => console.log(` - Code: ${m.machineCode}, Type: ${m.machineType}, Status: ${m.status}`));

  // 5. Get Operations
  const opRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/operations',
    method: 'GET'
  });
  const ops = opRes.data?.data || opRes.data;
  console.log(`\nOperations (${ops?.length}):`);
  ops?.slice(0, 10).forEach(o => console.log(` - ID: ${o.id}, Code: ${o.operationCode || o.code}, Name: ${o.name || o.operationName}, MachineType: ${o.machineType}, SMV: ${o.standardSmv || o.smv}`));
}

run().catch(console.error);
