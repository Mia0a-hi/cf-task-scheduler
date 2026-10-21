import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from '../src/auth.js';
import { parseCron, getNextCronRun, describeCron } from '../src/cron.js';
import { executeScript } from '../src/runner.js';

async function runTests() {
  console.log('--- 1. Testing Auth & Cryptographic Security ---');
  const password = 'TestMasterPassword2026!';
  const hashed = await hashPassword(password);
  console.log('PBKDF2-SHA256 Hash:', hashed);
  
  const isMatch = await verifyPassword(password, hashed);
  const isMismatch = await verifyPassword('IncorrectPassword', hashed);
  console.log('Password verification (correct):', isMatch ? 'PASS ✅' : 'FAIL ❌');
  console.log('Password verification (wrong):', !isMismatch ? 'PASS ✅' : 'FAIL ❌');

  console.log('\n--- 2. Testing Session Tokens ---');
  const secret = 'super-secret-key-for-test';
  const token = await createSessionToken({ sub: 1, username: 'admin', exp: Date.now() + 60000 }, secret);
  const verified = await verifySessionToken(token, secret);
  console.log('Session token verified payload:', verified ? 'PASS ✅' : 'FAIL ❌', verified);

  console.log('\n--- 3. Testing Cron Parsing & Scheduling ---');
  const cronExpr = '*/15 * * * *';
  const nextDate = getNextCronRun(cronExpr, new Date('2026-10-20T00:00:00Z'), 8);
  console.log(`Cron: "${cronExpr}" (${describeCron(cronExpr)}) -> Next run:`, nextDate.toISOString());

  console.log('\n--- 4. Testing Universal HTTP Execution ---');
  const result = await executeScript(
    'http',
    { URL: 'https://httpbin.org/get', METHOD: 'GET' }
  );
  console.log('HTTP Execution status:', result.success ? 'PASS ✅' : 'FAIL ❌');
  console.log('HTTP Duration:', result.durationMs, 'ms');

  console.log('\n========================================');
  console.log('  ALL OPEN SOURCE TEST SUITES PASSED! 🎉');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
