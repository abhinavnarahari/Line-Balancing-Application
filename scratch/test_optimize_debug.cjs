const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 8085,
      path: path,
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

async function run() {
  const payload = {
    planningDate: '2026-09-19',
    shiftId: 1,
    lineIds: [1, 7, 8, 9, 10, 11],
    primaryScenario: 'MAX_OUTPUT',
    allowCrossLineTransfers: true,
    createdBy: 'Industrial Engineer Senior'
  };

  const res = await post('/api/operator-allocation/optimize', payload);
  console.log('Status code:', res.status);
  console.log('Response:', JSON.stringify(res.body, null, 2));
}

run().catch(console.error);
