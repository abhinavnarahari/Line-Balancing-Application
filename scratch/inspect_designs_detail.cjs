const http = require('http');

http.get('http://localhost:8085/api/line-designs', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const designs = JSON.parse(data);
      console.log("=== Line Designs in DB ===");
      designs.forEach(d => {
        console.log(`ID: ${d.id}, Code: ${d.designCode}, OrderId: ${d.orderId}, LineId: ${d.lineId}, targetHourlyOutput: ${d.targetHourlyOutput}, dailyTarget: ${d.targetHourlyOutput ? d.targetHourlyOutput * 8 : 'N/A'}`);
      });
    } catch (e) {
      console.log("Error:", data);
    }
  });
}).on('error', err => console.error(err));
