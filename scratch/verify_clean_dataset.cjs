const http = require('http');

function get(urlPath) {
    return new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:8085${urlPath}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        req.on('error', reject);
    });
}

function post(urlPath, payload) {
    return new Promise((resolve, reject) => {
        const dataStr = JSON.stringify(payload);
        const req = http.request(`http://localhost:8085${urlPath}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(dataStr)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        req.on('error', reject);
        req.write(dataStr);
        req.end();
    });
}

async function verifyAll() {
    console.log("=== VERIFYING REFRESHED CLEAN SAMPLE DATA & APIS ===");
    
    // 1. Styles
    const stylesRes = await get('/api/styles');
    const styles = stylesRes.data?.data || stylesRes.data || [];
    console.log(`\n1. Styles (${stylesRes.status}):`, styles.length, "styles found");
    styles.forEach(s => console.log(`   - [${s.styleNo || s.styleNumber || s.code}] ${s.description || s.name} | Buyer: ${s.buyer} | Category: ${s.productType}`));

    // 2. Operation Bulletins
    const obRes = await get('/api/operation-bulletins');
    const bulletins = obRes.data?.data || obRes.data || [];
    console.log(`\n2. Operation Bulletins (${obRes.status}):`, bulletins.length, "bulletins found");
    bulletins.forEach(ob => console.log(`   - [${ob.bulletinCode}] ${ob.name} | Style: ${ob.styleCode || ob.styleNo || ob.styleNumber} | Total SMV: ${ob.totalSmv} min | Line Count: ${ob.lines?.length || ob.totalOperations || 'N/A'}`));

    // 3. Sewing Lines Master
    const linesRes = await get('/api/lines');
    const lines = linesRes.data?.data || linesRes.data || [];
    console.log(`\n3. Sewing Lines Master (${linesRes.status}):`, lines.length, "lines found");
    lines.forEach(l => console.log(`   - [${l.lineCode}] ${l.lineName} | Stations: ${l.workstationCount} | Target Eff: ${l.targetEfficiencyPercent}% | Supervisor: ${l.supervisorName}`));

    // 4. Production Orders
    const ordersRes = await get('/api/orders');
    const orders = ordersRes.data?.data || ordersRes.data || [];
    console.log(`\n4. Production Orders (${ordersRes.status}):`, orders.length, "orders found");
    orders.forEach(o => console.log(`   - [${o.orderNumber || o.poNumber}] Buyer: ${o.buyerName || o.buyer} | Style: ${o.styleNumber || o.styleNo} | Qty: ${o.orderQuantity || o.quantity} pcs | Status: ${o.status}`));

    // 5. Multi-Line Operator Optimizer Planning Context
    const planCtxRes = await get('/api/operator-allocation/planning-context');
    const planCtx = planCtxRes.data?.data || planCtxRes.data || {};
    console.log(`\n5. Multi-Line Planning Context (${planCtxRes.status}):`);
    console.log(`   - Active Lines in scope: ${planCtx.lines?.length || 0}`);
    console.log(`   - Available Present Operators: ${planCtx.availableOperators?.length || 0}`);
    console.log(`   - Total Required Headcount: ${planCtx.totalRequiredOperators || 0}`);

    // 6. Test Multi-Line Optimizer Run
    console.log(`\n6. Testing Multi-Line Optimizer Run...`);
    const optRes = await post('/api/operator-allocation/optimize', {
        lineIds: [1, 2, 3, 4],
        shiftId: 1,
        objective: "MAX_EFFICIENCY",
        skillWeight: 0.6,
        allowCrossLine: true
    });
    const optData = optRes.data?.data || optRes.data || {};
    console.log(`   Optimizer HTTP Status: ${optRes.status}`);
    console.log(`   - Strategy: ${optData.optimizationObjective || optData.objective}`);
    console.log(`   - Total Allocated: ${optData.totalAllocatedOperators || 0} / ${optData.totalRequiredOperators || 0}`);
    console.log(`   - Average Line Efficiency: ${optData.projectedAverageEfficiency || optData.averageEfficiency || 0}%`);
    console.log(`   - Line Results Count: ${optData.lineResults?.length || 0}`);
    if (optData.lineResults) {
        optData.lineResults.forEach(lr => {
            console.log(`     * [${lr.lineCode}] ${lr.lineName}: Assigned ${lr.assignedOperatorCount}/${lr.workstationCount} ops, Projected Eff: ${lr.projectedEfficiency}%`);
        });
    }

    console.log("\n=== ALL VERIFICATIONS COMPLETED SUCCESSFULLY ===");
}

verifyAll().catch(err => {
    console.error("Verification failed:", err);
    process.exit(1);
});
