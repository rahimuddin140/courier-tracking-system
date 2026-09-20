const assert = require('assert');
const http = require('http');
const app = require('../app');

async function runHttpTests() {
  const TEST_PORT = 4050;
  console.log(`🌐 Starting HTTP Integration Route Tests on port ${TEST_PORT}...\n`);

  const server = app.listen(TEST_PORT);

  // Allow server to listen
  await new Promise(r => setTimeout(r, 1000));

  let passed = 0;
  let failed = 0;

  function testHttp(name, path, expectedStatus, checkFn) {
    return new Promise((resolve) => {
      http.get(`http://localhost:${TEST_PORT}${path}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            assert.strictEqual(res.statusCode, expectedStatus, `Expected status ${expectedStatus} but got ${res.statusCode} for ${path}`);
            if (checkFn) checkFn(body, res);
            console.log(`  ✅ PASS: ${name}`);
            passed++;
          } catch (err) {
            console.error(`  ❌ FAIL: ${name}`);
            console.error(`     Error: ${err.message}`);
            failed++;
          }
          resolve();
        });
      }).on('error', (err) => {
        console.error(`  ❌ FAIL: ${name} (Network Error: ${err.message})`);
        failed++;
        resolve();
      });
    });
  }

  // 1. Landing Page
  await testHttp('Landing Page loads successfully (200)', '/', 200, (body) => {
    assert(body.includes('FastTrack Logistics'), 'Should contain brand title');
    assert(body.includes('Track Now'), 'Should contain tracking form');
  });

  // 2. Track Page (Public)
  await testHttp('Public Tracking Page loads (200)', '/track', 200, (body) => {
    assert(body.includes('Track Any Parcel'), 'Should contain search header');
  });

  // 3. Login Page
  await testHttp('Login Page renders (200)', '/login', 200, (body) => {
    assert(body.includes('Sign In'), 'Should contain Sign In form');
  });

  // 4. Register Page
  await testHttp('Register Page renders (200)', '/register', 200, (body) => {
    assert(body.includes('Create Customer Account'), 'Should contain registration form');
  });

  // 5. Protected Routes without Auth should redirect to /login (302)
  await testHttp('Protected Customer Dashboard redirects to /login (302)', '/customer/dashboard', 302, (_, res) => {
    assert(res.headers.location === '/login', 'Should redirect to /login');
  });

  await testHttp('Protected Agent Dashboard redirects to /login (302)', '/agent/dashboard', 302, (_, res) => {
    assert(res.headers.location === '/login', 'Should redirect to /login');
  });

  await testHttp('Protected Admin Dashboard redirects to /login (302)', '/admin/dashboard', 302, (_, res) => {
    assert(res.headers.location === '/login', 'Should redirect to /login');
  });

  // 6. 404 handler
  await testHttp('404 Page renders for invalid route (404)', '/non-existent-page-test', 404, (body) => {
    assert(body.includes('404'), 'Should display 404');
  });

  console.log('\n=============================================================');
  console.log(`🌐 HTTP ROUTE TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================\n');

  server.close(() => {
    process.exit(failed > 0 ? 1 : 0);
  });
}

runHttpTests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
