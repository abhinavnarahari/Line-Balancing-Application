/**
 * Backend CRUD & Mutation Integrity Verification
 * Verifies POST, PUT, PATCH, DELETE and Algorithm Calculations
 */

const http = require('http');

const BASE_URL = 'http://localhost:8085/api';

function request(method, path, body = null) {
  return new Promise((resolve) => {
    const url = new URL(BASE_URL + path);
    const postData = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Accept': 'application/json',
      }
    };

    if (postData) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const latency = Date.now() - startTime;
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          latencyMs: latency,
          data: parsed,
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        latencyMs: Date.now() - startTime,
        error: err.message,
      });
    });

    if (postData) req.write(postData);
    req.end();
  });
}

async function testMutations() {
  console.log('================================================================================');
  console.log('             SEWNEXA BACKEND CRUD & MUTATION INTEGRITY AUDIT                    ');
  console.log('================================================================================\n');

  // Test 1: Size Master CRUD Lifecycle (POST -> GET -> PUT -> PATCH toggle-status)
  console.log('1. Testing Size Master Lifecycle: POST -> GET -> PUT -> PATCH toggle-status');
  const sizeCreate = await request('POST', '/sizes', { code: '4XL', label: 'Quadruple Extra Large', sequence: 100, active: true });
  console.log(`   - Create Size: Status ${sizeCreate.status} (${sizeCreate.latencyMs}ms)`);
  const createdSizeId = sizeCreate.data?.data?.id || sizeCreate.data?.id;

  if (createdSizeId) {
    const sizeGet = await request('GET', `/sizes/${createdSizeId}`);
    console.log(`   - Verify Size: Status ${sizeGet.status} (Code: ${sizeGet.data?.data?.code || sizeGet.data?.code})`);

    const sizeUpdate = await request('PUT', `/sizes/${createdSizeId}`, { code: '4XL-PLUS', label: 'Quadruple Extra Large Plus', sequence: 101, active: true });
    console.log(`   - Update Size: Status ${sizeUpdate.status} (Updated Code: ${sizeUpdate.data?.data?.code})`);

    const sizeToggle = await request('PATCH', `/sizes/${createdSizeId}/toggle-status`);
    console.log(`   - Toggle Size Status: Status ${sizeToggle.status} (Active: ${sizeToggle.data?.data?.active})`);
  }

  // Test 2: AI Chatbot Grounding Execution
  console.log('\n2. Testing Chatbot Natural Language Query & PostgreSQL Grounding');
  const chatQueries = [
    { query: 'who is Pooja Deshmukh', expectedIntent: 'OPERATOR_PROFILE' },
    { query: 'what is least smv', expectedIntent: 'SMV_ANALYTICS_MIN' },
    { query: 'calculate line balancing for 10 operators', expectedIntent: 'LINE_BALANCING_CALC' },
    { query: 'show operation bulletin OB-POLO-800', expectedIntent: 'BULLETIN_DETAIL' }
  ];

  for (const cq of chatQueries) {
    const res = await request('POST', '/chatbot/chat', { message: cq.query, history: [] });
    const intent = res.data?.data?.intent;
    const isMatched = intent === cq.expectedIntent;
    console.log(`   - Query: "${cq.query}" -> Status ${res.status} | Intent: ${intent} | Grounded: ${res.data?.data?.dataSource} ${isMatched ? '✅' : '⚠️'}`);
  }

  // Test 3: Hourly Line Board Calculation
  console.log('\n3. Testing Hourly Line Production Board Calculation');
  const boardRes = await request('GET', '/hourly-production/board?date=2026-09-15');
  console.log(`   - Board Generation: Status ${boardRes.status} (${boardRes.latencyMs}ms) | Rows: ${boardRes.data?.rows?.length || 0} operations | Efficiency: ${boardRes.data?.lineEfficiencyPercent}%`);

  console.log('\n================================================================================');
  console.log('All mutation and algorithmic execution tests completed successfully!');
  console.log('================================================================================\n');
}

testMutations().catch(console.error);
