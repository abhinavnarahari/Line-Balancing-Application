const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request('http://localhost:8085' + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function debug409() {
  const payload = {
    planningDate: "2026-09-19",
    shiftId: 1,
    lineIds: [1, 7, 8, 9, 10, 11],
    primaryScenario: "MAX_OUTPUT",
    allowCrossLineTransfers: true,
    allowTraineesOnSimpleOps: true,
    createdBy: "Industrial Engineer",
  };

  const res = await post('/api/operator-allocation/optimize', payload);
  console.log('Status code:', res.status);
  console.log('Error data:', JSON.stringify(res.data, null, 2));
}

debug409().catch(console.error);
