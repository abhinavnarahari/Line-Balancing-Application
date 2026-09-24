const http = require('http');

http.get('http://localhost:8085/api/line-designs', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("=== Line Designs in DB ===");
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log("Raw response:", data);
    }
  });
}).on('error', err => console.error(err));
