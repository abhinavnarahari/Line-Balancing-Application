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
  console.log('--- 1. Checking Skill Matrix endpoint (/api/skill-matrix) ---');
  const mat = await get('/api/skill-matrix');
  const assessments = mat.data || mat;
  console.log(`Total current skill assessments: ${assessments?.length}`);

  // Group by operator
  const byOp = {};
  assessments?.forEach(a => {
    const opName = a.operatorName || (a.operator ? a.operator.name : `Op ${a.operatorId}`);
    if (!byOp[opName]) byOp[opName] = [];
    byOp[opName].push({
      opId: a.operationId,
      opName: a.operationName || (a.operation ? a.operation.name : ''),
      rating: a.rating,
      cycleSecs: a.cycleTimeSeconds
    });
  });

  console.log('\nSample Operators in Skill Matrix:');
  Object.keys(byOp).slice(0, 5).forEach(opName => {
    const ops = byOp[opName];
    const avg = (ops.reduce((sum, o) => sum + o.rating, 0) / ops.length).toFixed(1);
    console.log(`\nOperator: ${opName} (Total assessed ops: ${ops.length}, Exact Average Rating: ${avg})`);
    ops.slice(0, 6).forEach(o => console.log(`  - [${o.opName}]: Rating R${o.rating} (${o.cycleSecs}s)`));
  });

  console.log('\n--- 2. Checking Operator Pool (/api/operator-allocation/operator-pool) ---');
  const poolRes = await get('/api/operator-allocation/operator-pool');
  const pool = poolRes.data || poolRes;
  console.log(`Pool size: ${pool?.length}`);
  pool?.slice(0, 4).forEach(op => {
    console.log(`\nOperator: ${op.operatorName} | AverageSkillRating: ${op.averageSkillRating} | QualifiedOps: ${op.qualifiedOperations?.length}`);
    op.qualifiedOperations?.slice(0, 4).forEach(q => console.log(`  - ${q.operationName}: R${q.rating}`));
  });
}

run().catch(console.error);
