const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:8085' + path, (res) => {
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
  const linesRes = await get('/api/lines');
  const lines = linesRes.data || linesRes;
  console.log('All sewing lines in DB:');
  console.log(lines);

  const contextRes = await get('/api/operator-allocation/planning-context');
  const context = contextRes.data || contextRes;
  console.log('\nPlanning context selectedLines:');
  console.log(context.selectedLines);
}

run().catch(console.error);
