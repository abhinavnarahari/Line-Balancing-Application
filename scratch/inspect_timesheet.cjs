const http = require('http');

http.get('http://localhost:8085/api/piece-production/timesheet/24h?date=2026-09-24', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("=== Timesheet 24h Response ===");
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2).slice(0, 1500));
    } catch (e) {
      console.log("Raw response:", data.slice(0, 1500));
    }
  });
}).on('error', err => console.error(err));
