const fs = require('fs');

// Simple test to verify the logic of the optimizer
console.log("Starting Auto-Assign simulation test...");

// We can compile/import the TS file or execute equivalent logic
const { execSync } = require('child_process');
const output = execSync('npx ts-node frontend/src/features/line-balance/test_optimizer.ts', { encoding: 'utf-8' });
console.log(output);
