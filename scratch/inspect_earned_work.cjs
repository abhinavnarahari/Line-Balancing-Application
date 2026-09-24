const http = require('http');

http.get('http://localhost:8085/api/piece-production/timesheet-24h', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const ts = JSON.parse(data);
      console.log("Timesheet count:", ts.length);
      let totalEarned = 0;
      let totalWork = 0;
      ts.forEach(t => {
        console.log(`${t.operatorName}: Good=${t.totalGood}, WorkMins=${t.totalWorkMinutes}, EarnedMins=${t.totalEarnedMinutes}, Eff=${t.efficiencyPercent}%`);
        totalEarned += t.totalEarnedMinutes || 0;
        totalWork += t.totalWorkMinutes || 0;
      });
      console.log(`TOTAL: Earned=${totalEarned}, Work=${totalWork}, OverallEff=${totalWork > 0 ? ((totalEarned/totalWork)*100).toFixed(1) : 0}%`);
    } catch (e) {
      console.log("Error:", data);
    }
  });
}).on('error', err => console.error(err));
