const http = require('http');

async function askSql(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      message: `SQL: ${query}`,
      userIdentifier: 'test'
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
          resolve(JSON.parse(body));
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

// Let's inspect column names in PostgreSQL using safe queries
async function inspectTables() {
  const tables = ['shifts', 'operations', 'styles', 'machines', 'attendance_records', 'sewing_lines'];
  for (const table of tables) {
    const res = await askSql(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}' ORDER BY ordinal_position`);
    console.log(`\n=== TABLE: ${table} ===`);
    console.log(JSON.stringify(res, null, 2));
  }
}

inspectTables();
