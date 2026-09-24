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

async function verify() {
  const matrixRes = await get('/api/skill-matrix');
  const poolRes = await get('/api/operator-allocation/operator-pool');

  const matrix = matrixRes.data || matrixRes;
  const pool = poolRes.data || poolRes;

  const ajayMatrix = matrix.filter(m => (m.operatorName || '').includes('Ajay Malik') || (m.operator?.name || '').includes('Ajay Malik') || String(m.employeeId) === 'EMP-029');
  const ajayPool = pool.find(o => o.operatorName.includes('Ajay Malik') || o.employeeCode === 'EMP-029');

  console.log('=== AJAY MALIK VERIFICATION ===');
  console.log(`Operator Pool Average Skill Rating: ${ajayPool.averageSkillRating}`);
  console.log(`Total Operations in Skill Matrix: ${ajayMatrix.length}`);
  console.log(`Total Operations in Operator Pool: ${ajayPool.qualifiedOperations.length}`);

  console.log('\n--- Side-by-Side Comparison ---');
  console.log('Operation Name'.padEnd(25) + ' | ' + 'Skill Matrix Rating'.padEnd(20) + ' | ' + 'Operator Pool Rating'.padEnd(20) + ' | Match?');
  console.log('-'.repeat(80));

  let allMatch = true;
  ajayPool.qualifiedOperations.forEach(q => {
    const mMatch = ajayMatrix.find(m => String(m.operationId) === String(q.operationId) || m.operationName === q.operationName || m.operationCode === q.operationCode);
    const mRating = mMatch ? mMatch.rating : 'N/A';
    const match = mRating === q.rating;
    if (!match) allMatch = false;
    console.log(q.operationName.padEnd(25) + ' | ' + String(mRating).padEnd(20) + ' | ' + String(q.rating).padEnd(20) + ' | ' + (match ? 'YES (100% MATCH)' : 'MISMATCH'));
  });

  console.log('\nOverall Result: ' + (allMatch ? 'SUCCESS: ALL RATINGS MATCH PERFECTLY!' : 'FAILED: SOME RATINGS DIFFER!'));
}

verify().catch(console.error);
