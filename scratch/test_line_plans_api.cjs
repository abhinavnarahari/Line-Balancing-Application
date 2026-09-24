const http = require('http');

http.get('http://localhost:8085/api/line-plans?orderId=1', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("=== GET /api/line-plans?orderId=1 ===");
    console.log(data);
  });
}).on('error', err => console.error(err));
