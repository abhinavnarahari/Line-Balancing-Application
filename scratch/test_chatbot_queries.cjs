const http = require('http');

function askChatbot(message) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ message });
    const req = http.request('http://localhost:8085/api/chatbot/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  const queries = [
    "Pooja Deshmukh",
    "Pooja",
    "EMP-012",
    "What is the standard SMV for Sleeve Attach?",
    "Sleeve Attach",
    "List all floater operators on Line 1",
    "Show details for Operation Bulletin OB-POLO-800",
    "Calculate line balancing for 12 operators",
    "Line 4",
    "Juki",
    "What is SMV?",
    "What is Pitch Time?"
  ];

  for (const q of queries) {
    console.log(`\n========================================`);
    console.log(`QUERY: "${q}"`);
    console.log(`========================================`);
    try {
      const res = await askChatbot(q);
      if (res.data) {
        console.log(`[Intent]: ${res.data.intent} | [Data Source]: ${res.data.dataSource}`);
        console.log(`[Response]:\n${res.data.messageText}`);
        console.log(`[Suggestions]:`, res.data.suggestedQuestions);
      } else {
        console.log(`[Error/Raw Response]:`, res);
      }
    } catch (err) {
      console.error(`Request failed:`, err.message);
    }
  }
}

runTests();
