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
  console.log('--- 1. Fetching active shifts ---');
  const shiftsRes = await get('/api/shifts?active=true');
  console.log('Active shifts:', shiftsRes.data ? shiftsRes.data.map(s => ({ id: s.id, code: s.shiftCode, name: s.shiftName, start: s.startTime, end: s.endTime })) : shiftsRes);

  if (shiftsRes.data && shiftsRes.data.length > 0) {
    for (const shift of shiftsRes.data) {
      console.log(`\n--- 2. Fetching Planning Context for Shift ID ${shift.id} (${shift.shiftName}) ---`);
      const ctx = await get(`/api/operator-allocation/planning-context?date=2026-09-19&shiftId=${shift.id}`);
      console.log('Response shift:', {
        shiftId: ctx.data?.shiftId,
        shiftName: ctx.data?.shiftName,
        shiftWorkingHours: ctx.data?.shiftWorkingHours,
        totalSelectedLines: ctx.data?.selectedLines?.length
      });
    }
  }
}

run().catch(console.error);
