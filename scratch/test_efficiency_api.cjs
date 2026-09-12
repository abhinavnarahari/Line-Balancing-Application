const http = require('http');

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function test() {
  console.log('--- 1. Testing GET /api/line-plans ---');
  try {
    const res = await request('http://localhost:8085/api/line-plans');
    console.log('Status:', res.status);
    if (Array.isArray(res.body)) {
      console.log('Found line plans:', res.body.length);
      if (res.body.length > 0) {
        console.log('Sample line plan plannedEfficiency:', res.body[0].plannedEfficiency);
        console.log('Sample line plan details:', {
          id: res.body[0].id,
          styleId: res.body[0].styleId,
          targetOutput: res.body[0].targetOutput,
          plannedEfficiency: res.body[0].plannedEfficiency,
          status: res.body[0].status
        });
      }
    } else {
      console.log('Body:', res.body);
    }
  } catch (err) {
    console.error('API Error:', err.message);
  }
}

test();
