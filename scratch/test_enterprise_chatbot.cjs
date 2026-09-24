const http = require('http');

async function askChatbot(message, context = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      message,
      context,
      userIdentifier: 'test_ie_engineer'
    });

    const options = {
      hostname: 'localhost',
      port: 8085,
      path: '/api/chatbot/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          resolve({ raw: body, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING ENTERPRISE CHATBOT VERIFICATION TESTS ---\n');

  const testQuestions = [
    { title: 'Master Data Overview', q: 'Show Master Data Overview' },
    { title: 'Styles Master', q: 'List all 8 garment styles and their buyers' },
    { title: 'Workforce / Float Operators', q: 'Who are the floater operators on Line 1?' },
    { title: 'Operator Profile & Skills', q: 'Show profile and skill matrix for EMP-001' },
    { title: 'Operations Master & SMVs', q: 'List all 18 sewing operations and standard SMVs' },
    { title: 'Operation Bulletin Detail', q: 'Show details of Operation Bulletin OB-POLO-800' },
    { title: 'IE Line Balancing Calculation', q: 'Calculate line balancing for 10 operators on Polo' },
    { title: 'Machines Master', q: 'How many sewing machines are available?' },
    { title: 'Shifts Master', q: 'What are the working shift timings and break hours?' }
  ];

  for (const t of testQuestions) {
    console.log(`[TEST] Asking: "${t.q}" (${t.title})`);
    try {
      const res = await askChatbot(t.q);
      if (res && res.success && res.data) {
        console.log(`✓ SUCCESS (Intent: ${res.data.intent}, Source: ${res.data.dataSource})`);
        console.log(`--- Snippet of Grounded Answer ---`);
        console.log(res.data.messageText.substring(0, 220) + '...\n');
      } else {
        console.log(`❌ FAILED:`, JSON.stringify(res, null, 2));
      }
    } catch (e) {
      console.log(`⚠️ Connection error (Is backend running on 8085?):`, e.message);
      break;
    }
  }
}

runTests();
