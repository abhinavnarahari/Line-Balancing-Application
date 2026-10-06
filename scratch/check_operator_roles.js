const http = require('http');

http.get('http://localhost:8085/api/operators', res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const raw = JSON.parse(d);
    const ops = raw.data || raw;
    const roles = {};
    ops.forEach(o => {
      const r = o.role || 'UNKNOWN';
      roles[r] = (roles[r] || 0) + 1;
    });
    console.log('Total operators:', ops.length);
    console.log('Roles breakdown:', roles);
    console.log('\nSample operators with roles:');
    ops.slice(0, 10).forEach(o => {
      console.log(`- ${o.name} (${o.employeeId}): role=${o.role}, dept=${o.department}`);
    });
  });
});
