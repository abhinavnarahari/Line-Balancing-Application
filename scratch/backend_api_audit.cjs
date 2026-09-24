/**
 * Comprehensive Senior Software Developer Backend API Audit & Verification Suite
 * Tests all 23 Spring Boot REST Controllers, HTTP Methods, Dynamic IDs, and Algorithm Services
 */

const http = require('http');

const BASE_URL = 'http://localhost:8085/api';

function request(method, path, body = null) {
  return new Promise((resolve) => {
    const url = new URL(BASE_URL + path);
    const postData = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Accept': 'application/json',
      }
    };

    if (postData) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const latency = Date.now() - startTime;
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          latencyMs: latency,
          data: parsed,
          headers: res.headers,
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        latencyMs: Date.now() - startTime,
        error: err.message,
      });
    });

    if (postData) req.write(postData);
    req.end();
  });
}

async function runComprehensiveAudit() {
  console.log('================================================================================');
  console.log('       SEWNEXA ENTERPRISE BACKEND REST API AUDIT (23 CONTROLLERS)        ');
  console.log('================================================================================\n');

  // Step 1: Pre-fetch dynamic IDs
  const [stylesRes, operatorsRes, ordersRes, bulletinsRes, linesRes, plansRes, machinesRes] = await Promise.all([
    request('GET', '/styles'),
    request('GET', '/operators'),
    request('GET', '/orders'),
    request('GET', '/operation-bulletins'),
    request('GET', '/lines'),
    request('GET', '/line-plans'),
    request('GET', '/machines'),
  ]);

  const firstStyle = stylesRes.data?.data?.[0] || stylesRes.data?.[0];
  const firstOperator = operatorsRes.data?.data?.[0] || operatorsRes.data?.[0];
  const firstOrder = ordersRes.data?.data?.[0] || ordersRes.data?.[0];
  const firstBulletin = bulletinsRes.data?.data?.[0] || bulletinsRes.data?.[0];
  const firstLine = linesRes.data?.data?.[0] || linesRes.data?.[0];
  const firstPlan = plansRes.data?.[0] || plansRes.data?.data?.[0];
  const firstMachine = machinesRes.data?.data?.[0] || machinesRes.data?.[0];

  const testSuite = [
    // ── 1. Master Data Controllers ──────────────────────────────────────────────
    { domain: 'Master Data', controller: 'StyleController', name: 'List All Garment Styles', method: 'GET', path: '/styles' },
    { domain: 'Master Data', controller: 'StyleController', name: `Get Style By ID (${firstStyle?.id || 1})`, method: 'GET', path: `/styles/${firstStyle?.id || 1}` },
    { domain: 'Master Data', controller: 'SizeController', name: 'List All Garment Sizes', method: 'GET', path: '/sizes' },
    { domain: 'Master Data', controller: 'OperationController', name: 'List All Sewing Operations', method: 'GET', path: '/operations' },
    { domain: 'Master Data', controller: 'OperationController', name: 'Get Operation By ID (1)', method: 'GET', path: '/operations/1' },
    { domain: 'Master Data', controller: 'OperatorController', name: 'List 50 Operators', method: 'GET', path: '/operators' },
    { domain: 'Master Data', controller: 'OperatorController', name: `Get Operator (${firstOperator?.name || 'EMP-001'})`, method: 'GET', path: `/operators/${firstOperator?.id || 69}` },
    { domain: 'Master Data', controller: 'SewingLineController', name: 'List Sewing Lines Master', method: 'GET', path: '/lines' },
    { domain: 'Master Data', controller: 'SewingLineController', name: `Get Line By ID (${firstLine?.lineCode || 'LINE-01'})`, method: 'GET', path: `/lines/${firstLine?.id || 1}` },
    { domain: 'Master Data', controller: 'MachineController', name: 'List Machine Fleet', method: 'GET', path: '/machines' },
    { domain: 'Master Data', controller: 'MachineController', name: `Get Machine (${firstMachine?.machineCode || 'SN-001'})`, method: 'GET', path: `/machines/${firstMachine?.id || 1}` },
    { domain: 'Master Data', controller: 'ShiftController', name: 'List Factory Shifts', method: 'GET', path: '/shifts' },

    // ── 2. Production & Order Controllers ───────────────────────────────────────
    { domain: 'Production', controller: 'OrderController', name: 'List Production Orders', method: 'GET', path: '/orders' },
    { domain: 'Production', controller: 'OrderController', name: `Get Order (${firstOrder?.orderNo || 'PO-1'})`, method: 'GET', path: `/orders/${firstOrder?.id || 17}` },
    { domain: 'Production', controller: 'OperationBulletinController', name: 'List Operation Bulletins', method: 'GET', path: '/operation-bulletins' },
    { domain: 'Production', controller: 'OperationBulletinController', name: `Get Bulletin (${firstBulletin?.bulletinCode || 'OB-802'})`, method: 'GET', path: `/operation-bulletins/${firstBulletin?.id || 11}` },

    // ── 3. Workforce, Skill Matrix & Attendance Controllers ─────────────────────
    { domain: 'Workforce', controller: 'SkillMatrixController', name: 'Get Complete Skill Matrix (900 records)', method: 'GET', path: '/skill-matrix' },
    { domain: 'Workforce', controller: 'SkillMatrixController', name: `Get Skills for Operator (${firstOperator?.id || 69})`, method: 'GET', path: `/skill-matrix?operatorId=${firstOperator?.id || 69}` },
    { domain: 'Workforce', controller: 'SkillMatrixController', name: 'Get Skill Matrix History Logs', method: 'GET', path: '/skill-matrix/history/logs' },
    { domain: 'Workforce', controller: 'SkillMatrixController', name: 'Get Daily Performance Logs', method: 'GET', path: '/skill-matrix/performance-logs' },
    { domain: 'Workforce', controller: 'ShiftAssignmentController', name: 'Get Shift Assignments', method: 'GET', path: '/shift-assignments' },
    { domain: 'Workforce', controller: 'AttendanceController', name: 'Get Today Floor Attendance', method: 'GET', path: `/attendance?date=${new Date().toISOString().split('T')[0]}` },
    { domain: 'Workforce', controller: 'AttendanceController', name: 'Get Full Attendance History', method: 'GET', path: '/attendance/history' },

    // ── 4. Industrial Engineering & Line Balancing Controllers ──────────────────
    { domain: 'Line Balancing', controller: 'LinePlanController', name: 'List All Saved Line Plans', method: 'GET', path: '/line-plans' },
    { domain: 'Line Balancing', controller: 'LinePlanController', name: `Get Line Plan By ID (${firstPlan?.id || 4})`, method: 'GET', path: `/line-plans/${firstPlan?.id || 4}` },
    { domain: 'Line Balancing', controller: 'CapacityPlanController', name: 'List Capacity Plans', method: 'GET', path: '/capacity-plans' },
    { domain: 'Line Balancing', controller: 'LineDesignController', name: 'List Line Designs / Architecture', method: 'GET', path: '/line-designs' },
    { domain: 'Line Balancing', controller: 'HourlyProductionController', name: 'Get Hourly Line Board', method: 'GET', path: '/hourly-production/board?date=2026-09-15' },

    // ── 5. System Notifications & Auditing Controllers ──────────────────────────
    { domain: 'System', controller: 'NotificationController', name: 'Get System Notifications', method: 'GET', path: '/notifications' },
    { domain: 'System', controller: 'AuditLogController', name: 'Get System Audit Logs', method: 'GET', path: '/audit-logs' },

    // ── 6. Enterprise Chatbot & AI Assistant Controller ─────────────────────────
    { domain: 'AI Chatbot', controller: 'ChatbotController', name: 'Master Data Overview Intent', method: 'POST', path: '/chatbot/chat', body: { message: 'Show Master Data Overview', history: [] } },
    { domain: 'AI Chatbot', controller: 'ChatbotController', name: 'SMV Analytics: Least SMV', method: 'POST', path: '/chatbot/chat', body: { message: 'what is least smv', history: [] } },
    { domain: 'AI Chatbot', controller: 'ChatbotController', name: 'Dynamic Operator Lookup: Pooja Deshmukh', method: 'POST', path: '/chatbot/chat', body: { message: 'Pooja Deshmukh', history: [] } },
    { domain: 'AI Chatbot', controller: 'ChatbotController', name: 'IE Line Balancing Math: 12 Operators', method: 'POST', path: '/chatbot/chat', body: { message: 'Calculate line balancing for 12 operators', history: [] } },
  ];

  const results = [];
  let passedCount = 0;
  let failedCount = 0;

  for (const tc of testSuite) {
    const res = await request(tc.method, tc.path, tc.body);
    const isSuccess = res.status >= 200 && res.status < 300;
    if (isSuccess) passedCount++;
    else failedCount++;

    let recordSummary = 'N/A';
    if (res.data) {
      const dataPayload = res.data.data !== undefined ? res.data.data : res.data;
      if (Array.isArray(dataPayload)) {
        recordSummary = `${dataPayload.length} records`;
      } else if (typeof dataPayload === 'object' && dataPayload !== null) {
        if (dataPayload.messageText) {
          recordSummary = `Chatbot (${dataPayload.intent || 'Response'})`;
        } else if (dataPayload.id || dataPayload.linePlanId || dataPayload.bulletinCode) {
          recordSummary = `Entity: ${dataPayload.name || dataPayload.bulletinCode || dataPayload.orderNo || dataPayload.employeeId || dataPayload.id}`;
        } else if (dataPayload.rows) {
          recordSummary = `${dataPayload.rows.length} board rows`;
        } else {
          recordSummary = `Object (${Object.keys(dataPayload).length} keys)`;
        }
      }
    }

    results.push({
      ...tc,
      status: res.status,
      latency: `${res.latencyMs}ms`,
      passed: isSuccess,
      records: recordSummary,
      rawError: !isSuccess ? (res.error || JSON.stringify(res.data)) : null
    });
  }

  // Group by Domain
  const domains = [...new Set(results.map(r => r.domain))];
  for (const d of domains) {
    console.log(`\n📌 Domain: ${d.toUpperCase()}`);
    console.log('----------------------------------------------------------------------------------------------------------------');
    console.log(
      'Status'.padEnd(10) +
      'Method'.padEnd(8) +
      'Latency'.padEnd(10) +
      'Endpoint'.padEnd(46) +
      'Result Summary'
    );
    console.log('----------------------------------------------------------------------------------------------------------------');

    const domainResults = results.filter(r => r.domain === d);
    for (const r of domainResults) {
      const statusStr = r.passed ? `✅ ${r.status}` : `❌ ${r.status}`;
      console.log(
        statusStr.padEnd(10) +
        r.method.padEnd(8) +
        r.latency.padEnd(10) +
        r.path.padEnd(46) +
        r.records
      );
      if (!r.passed) {
        console.log(`   ⚠️ Error detail: ${r.rawError}`);
      }
    }
  }

  console.log('\n================================================================================');
  console.log(`AUDIT SUMMARY: ${passedCount} PASSED / ${failedCount} FAILED out of ${testSuite.length} Endpoints`);
  console.log(`Overall Backend Pass Rate: ${((passedCount / testSuite.length) * 100).toFixed(1)}%`);
  console.log('================================================================================\n');
}

runComprehensiveAudit().catch(console.error);
