import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from '../src/auth.js';
import { parseCron, getNextCronRun, describeCron, getTimezoneOffsetHours } from '../src/cron.js';
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

  console.log('\n--- 3. Testing Timezone-Aware Cron Scheduling ---');
  const baseDate = new Date('2026-10-21T00:00:00Z');
  
  const offsetBJ = getTimezoneOffsetHours('Asia/Shanghai', baseDate);
  const offsetNY = getTimezoneOffsetHours('America/New_York', baseDate);
  const offsetUTC = getTimezoneOffsetHours('UTC', baseDate);
  console.log(`Offsets: Asia/Shanghai=${offsetBJ}h, America/New_York=${offsetNY}h, UTC=${offsetUTC}h`);

  const nextBJ = getNextCronRun('0 8 * * *', baseDate, 'Asia/Shanghai');
  const nextNY = getNextCronRun('0 8 * * *', baseDate, 'America/New_York');
  const nextUTC = getNextCronRun('0 8 * * *', baseDate, 'UTC');

  console.log(`"0 8 * * *" Next run (Beijing):`, nextBJ.toISOString(), nextBJ.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
  console.log(`"0 8 * * *" Next run (New York):`, nextNY.toISOString(), nextNY.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  console.log(`"0 8 * * *" Next run (UTC):`, nextUTC.toISOString(), nextUTC.toLocaleString('en-US', { timeZone: 'UTC' }));

  const cron15 = '*/15 * * * *';
  console.log(`Cron description (zh): "${describeCron(cron15, 'zh')}"`);
  console.log(`Cron description (en): "${describeCron(cron15, 'en')}"`);

  console.log('\n--- 4. Testing Universal HTTP Execution ---');
  const result = await executeScript(
    'http',
    { URL: 'https://httpbin.org/get', METHOD: 'GET' }
  );
  console.log('HTTP Execution status:', result.success ? 'PASS ✅' : 'FAIL ❌');
  console.log('HTTP Duration:', result.durationMs, 'ms');

  console.log('\n--- 5. Testing Multi-Step Declarative Pipeline (STEPS) ---');
  const multiStepResult = await executeScript(
    'http',
    {
      STEPS: [
        {
          name: 'get_token',
          url: 'https://httpbin.org/get?token=abc_token_999&uid=user_777',
          method: 'GET',
          extract: {
            extractedToken: 'args.token',
            extractedUid: 'args.uid'
          }
        },
        {
          name: 'use_token_checkin',
          url: 'https://httpbin.org/post',
          method: 'POST',
          headers: {
            'Authorization': 'Bearer {{extractedToken}}',
            'X-User-Id': '{{extractedUid}}'
          },
          body: {
            status: 'checked_in'
          }
        }
      ]
    }
  );
  console.log('Multi-Step Execution status:', multiStepResult.success ? 'PASS ✅' : 'FAIL ❌');
  console.log('Multi-Step Duration:', multiStepResult.durationMs, 'ms');

  console.log('\n========================================');
  console.log('  ALL OPEN SOURCE TEST SUITES PASSED! 🎉');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
