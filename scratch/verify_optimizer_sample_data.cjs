const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function verify() {
  console.log("================================================================================");
  console.log("       ENTERPRISE MULTI-LINE OPERATOR OPTIMIZER SAMPLE DATA VERIFICATION        ");
  console.log("================================================================================");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${message}`);
    }
  }

  // 1. Planning Context API
  console.log("\n[1] Verifying Planning Context & Lines Context (/api/operator-allocation/planning-context)...");
  const ctxRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/operator-allocation/planning-context',
    method: 'GET'
  });
  assert(ctxRes.status === 200, `Planning Context status 200 (Got ${ctxRes.status})`);
  const ctx = ctxRes.data?.data;
  assert(ctx && ctx.selectedLines && ctx.selectedLines.length >= 3, `Selected Lines count >= 3 (Found: ${ctx?.selectedLines?.length})`);
  assert(ctx && ctx.activeOrders && ctx.activeOrders.length >= 4, `Active Orders count >= 4 (Found: ${ctx?.activeOrders?.length})`);
  assert(ctx && ctx.totalAvailableOperators === 50, `Available Operator Pool = 50 (Found: ${ctx?.totalAvailableOperators})`);
  assert(ctx && ctx.totalAvailableMachines >= 50, `Available Machine inventory >= 50 (Found: ${ctx?.totalAvailableMachines})`);

  console.log(`    - Plant Location: ${ctx?.plantLocation}`);
  console.log(`    - Shift Name: ${ctx?.shiftName} (${ctx?.shiftWorkingHours} hrs)`);
  console.log(`    - Total Target Output: ${ctx?.totalTargetHourlyOutput} pcs/hr`);
  console.log(`    - Total Designed Manpower: ${ctx?.totalDesignedManpower} operators`);
  ctx?.selectedLines?.forEach(l => {
    console.log(`      * Line ${l.lineCode} (${l.lineName}): Style=${l.currentStyle}, OB=${l.bulletinCode}, Target=${l.targetHourlyOutput} pcs/hr, Eff=${l.plannedEfficiency}%`);
  });

  // 2. Line Requirements API
  console.log("\n[2] Verifying Line Requirements & Stations (/api/operator-allocation/line-requirements)...");
  const reqRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/operator-allocation/line-requirements',
    method: 'GET'
  });
  assert(reqRes.status === 200, `Line Requirements status 200`);
  const reqLines = reqRes.data?.data;
  assert(Array.isArray(reqLines) && reqLines.length >= 3, `Line Requirements count >= 3 (Found: ${reqLines?.length})`);
  reqLines?.forEach(l => {
    const validStations = l.stations && l.stations.length > 0;
    const validSmv = l.totalSmvMinutes > 0;
    assert(validStations, `Line ${l.lineCode} has ${l.stations?.length} workstations configured`);
    assert(validSmv, `Line ${l.lineCode} total SMV is positive (${l.totalSmvMinutes?.toFixed(2)} mins, Takt: ${l.customerTaktSecs?.toFixed(1)}s, Pitch: ${l.designedPitchSecs?.toFixed(1)}s)`);
  });

  // 3. Operator Pool API
  console.log("\n[3] Verifying Operator Pool & Skill Qualifications (/api/operator-allocation/operator-pool)...");
  const poolRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: `/api/operator-allocation/operator-pool?planningDate=${ctx.planningDate}&shiftId=${ctx.shiftId}`,
    method: 'GET'
  });
  assert(poolRes.status === 200, `Operator Pool status 200`);
  const pool = poolRes.data?.data;
  assert(Array.isArray(pool) && pool.length === 50, `Operator Pool contains exactly 50 operators (Found: ${pool?.length})`);
  const presentCount = pool?.filter(o => o.attendanceStatus === 'PRESENT').length;
  const absentCount = pool?.filter(o => o.attendanceStatus === 'ABSENT').length;
  assert(presentCount === 46, `Present Operators count = 46 (Found: ${presentCount})`);
  assert(absentCount === 4, `Absent Operators count = 4 (Found: ${absentCount})`);
  const fullyCertified = pool?.filter(o => o.qualifiedMachines && o.qualifiedMachines.length > 0).length;
  assert(fullyCertified === 50, `All 50 operators have multi-machine qualifications (Found: ${fullyCertified})`);

  // 4. Pre-Flight Validation API
  console.log("\n[4] Verifying Pre-Flight Validation (/api/operator-allocation/validate)...");
  const lineIds = ctx.selectedLines.map(l => l.lineId);
  const valRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/operator-allocation/validate',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    planningDate: ctx.planningDate,
    shiftId: ctx.shiftId,
    lineIds: lineIds
  });
  assert(valRes.status === 200, `Pre-flight validation status 200`);
  const valData = valRes.data?.data;
  const isValid = valData && (valData.valid === true || valData.isValid === true);
  assert(isValid, `Pre-flight validation result valid = true`);
  assert(valData && (!valData.issues || valData.issues.filter(i => i.severity === 'ERROR').length === 0), `Pre-flight validation has 0 blocking errors`);
  console.log(`    - Validation Summary: Valid=${isValid}, Total Issues=${valData?.issues?.length || 0}`);

  // 5. Multi-Scenario Optimizer Execution
  console.log("\n[5] Verifying Multi-Line Optimizer Solver Execution (/api/operator-allocation/optimize)...");
  const scenarios = ['MAX_OUTPUT', 'BALANCED_EFFICIENCY', 'MIN_DEFECTS', 'STABLE_CREW'];
  for (const scen of scenarios) {
    const optRes = await request({
      hostname: 'localhost',
      port: 8085,
      path: '/api/operator-allocation/optimize',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      planningDate: ctx.planningDate,
      shiftId: ctx.shiftId,
      lineIds: lineIds,
      primaryScenario: scen,
      allowCrossLineTransfers: true,
      createdBy: `Automated Test Runner (${scen})`
    });

    assert(optRes.status === 200, `Scenario ${scen} optimization status 200`);
    const opt = optRes.data?.data;
    assert(opt && opt.runId && opt.status === 'OPTIMIZED', `Scenario ${scen} Run Created (${opt?.runCode}, Status: ${opt?.status})`);
    assert(opt && opt.matrix && opt.matrix.length > 0, `Scenario ${scen} generated matrix assignments (Count: ${opt?.matrix?.length})`);
    assert(opt && opt.lineResults && opt.lineResults.length > 0, `Scenario ${scen} generated line results (Count: ${opt?.lineResults?.length})`);
    
    console.log(`    -> Scenario ${scen} Summary:`);
    console.log(`       * Total Achievable Output: ${opt?.summary?.totalAchievableOutput} pcs/hr`);
    console.log(`       * Overall Achievable Efficiency: ${opt?.summary?.overallAchievableEfficiency?.toFixed(1)}%`);
    console.log(`       * Assigned Operators: ${opt?.summary?.totalAssignedOperators}/${opt?.summary?.totalAvailableOperators}`);
    opt?.lineResults?.forEach(ls => {
      console.log(`       * Line ${ls.lineCode} (${ls.styleNo}): Target=${ls.targetHourlyOutput}, Achievable=${ls.achievableCapacity} pcs/hr, Eff=${ls.achievableEfficiency?.toFixed(1)}%, Status=${ls.lineStatus}`);
    });
  }

  // 6. Cross-Module Application Data Verification
  console.log("\n[6] Verifying Cross-Module Application Data Consistency...");
  
  // Operations
  const opsRes = await request({ hostname: 'localhost', port: 8085, path: '/api/operations', method: 'GET' });
  assert(opsRes.status === 200 && opsRes.data?.data?.length >= 18, `Operations API returns >= 18 operations (Found: ${opsRes.data?.data?.length})`);

  // Styles
  const stylesRes = await request({ hostname: 'localhost', port: 8085, path: '/api/styles', method: 'GET' });
  assert(stylesRes.status === 200 && stylesRes.data?.data?.length >= 4, `Styles API returns >= 4 styles (Found: ${stylesRes.data?.data?.length})`);

  // Orders
  const ordersRes = await request({ hostname: 'localhost', port: 8085, path: '/api/orders', method: 'GET' });
  assert(ordersRes.status === 200 && ordersRes.data?.data?.length >= 4, `Orders API returns >= 4 orders (Found: ${ordersRes.data?.data?.length})`);

  // Operation Bulletins
  const bulletinsRes = await request({ hostname: 'localhost', port: 8085, path: '/api/operation-bulletins', method: 'GET' });
  assert(bulletinsRes.status === 200 && bulletinsRes.data?.data?.length >= 4, `Operation Bulletins API returns >= 4 bulletins (Found: ${bulletinsRes.data?.data?.length})`);

  // Sewing Lines
  const linesRes = await request({ hostname: 'localhost', port: 8085, path: '/api/lines', method: 'GET' });
  assert(linesRes.status === 200 && linesRes.data?.data?.length >= 4, `Sewing Lines API returns >= 4 lines (Found: ${linesRes.data?.data?.length})`);

  // Operators
  const operatorsRes = await request({ hostname: 'localhost', port: 8085, path: '/api/operators', method: 'GET' });
  assert(operatorsRes.status === 200 && operatorsRes.data?.data?.length >= 50, `Operators API returns >= 50 operators (Found: ${operatorsRes.data?.data?.length})`);

  // Attendance
  const attRes = await request({ hostname: 'localhost', port: 8085, path: `/api/attendance?date=${ctx.planningDate}`, method: 'GET' });
  assert(attRes.status === 200 && attRes.data?.data?.length >= 40, `Attendance API returns >= 40 records for today (Found: ${attRes.data?.data?.length})`);

  // Enterprise Chatbot
  const chatRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/chatbot/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    message: "What is Line 01 target efficiency and current running style?",
    context: {
      page: "OPERATOR_ALLOCATION",
      lineCode: "LINE-01"
    }
  });
  assert(chatRes.status === 200, `Enterprise Chatbot chat status 200`);
  assert(chatRes.data?.data?.messageText && chatRes.data?.data?.messageText.length > 0, `Enterprise Chatbot responded with intelligent manufacturing context`);
  console.log(`    - Chatbot Response Snippet: "${chatRes.data?.data?.messageText?.slice(0, 100)}..."`);

  console.log("\n================================================================================");
  console.log(`                     VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED                     `);
  console.log("================================================================================");
  if (passedTests === totalTests) {
    console.log(">> ALL SAMPLE DATA AND OPTIMIZER FUNCTIONALITIES VERIFIED PERFECTLY! <<\n");
  } else {
    console.error(">> SOME TESTS FAILED! <<\n");
  }
}

verify().catch(console.error);
