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
  const res = await get('/api/operator-allocation/line-requirements?lineIds=1,2,3,4,5,6');
  const lines = res.data || res;
  console.log(`Total lines returned: ${lines?.length}`);
  lines?.forEach(l => {
    console.log(`Line ${l.lineId} (${l.lineCode} - ${l.lineName}): Stations count = ${l.stations?.length}`);
  });
}

run().catch(console.error);
