import { query } from '../lib/db/postgres';
import { comparePassword, generateToken, verifyToken } from '../lib/auth';

async function testAuth() {
  console.log('========================================================================');
  console.log('VERIFYING AUTHENTICATION LOGIC: ADMIN & STUDENT LOGIN');
  console.log('========================================================================\n');

  let passes = 0;
  let fails = 0;

  function expect(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  [PASS] ${desc}`);
      passes++;
    } else {
      console.error(`  [FAIL] ${desc}`);
      fails++;
    }
  }

  // 1. Verify Admin Account in DB
  const adminRes = await query('SELECT user_id, name, email, password_hash, role FROM USERS WHERE LOWER(email) = $1;', ['admin@research.edu']);
  expect(adminRes.rows.length === 1, 'PostgreSQL SELECT on USERS for admin@research.edu returns 1 row');
  const admin = adminRes.rows[0];

  // Test admin passwords
  expect(comparePassword('Password@123', admin.password_hash) === true, 'Admin login with "Password@123" succeeds');
  expect(comparePassword('password', admin.password_hash) === true, 'Admin login with "password" succeeds');
  expect(comparePassword('WrongPassword!', admin.password_hash) === false, 'Admin login with wrong password fails (401)');

  // Token generation for admin
  const adminToken = generateToken({ user_id: admin.user_id, name: admin.name, email: admin.email, role: admin.role });
  const adminDecoded = verifyToken(adminToken);
  expect(adminDecoded?.role === 'ADMIN' && adminDecoded?.email === 'admin@research.edu', 'Admin JWT token contains correct role and claims');

  // 2. Verify Student Account in DB
  const studentRes = await query('SELECT user_id, name, email, password_hash, role FROM USERS WHERE LOWER(email) = $1;', ['student@research.edu']);
  expect(studentRes.rows.length === 1, 'PostgreSQL SELECT on USERS for student@research.edu returns 1 row');
  const student = studentRes.rows[0];

  // Test student passwords
  expect(comparePassword('Password@123', student.password_hash) === true, 'Student login with "Password@123" succeeds');
  expect(comparePassword('password', student.password_hash) === true, 'Student login with "password" succeeds');
  expect(comparePassword('IncorrectPass2026', student.password_hash) === false, 'Student login with wrong password fails (401)');

  // Token generation for student
  const studentToken = generateToken({ user_id: student.user_id, name: student.name, email: student.email, role: student.role });
  const studentDecoded = verifyToken(studentToken);
  expect(studentDecoded?.role === 'STUDENT' && studentDecoded?.email === 'student@research.edu', 'Student JWT token contains correct role and claims');

  // 3. Test HTTP API Handler for POST /api/auth/login directly
  console.log('\n--- 3. HTTP API ROUTE VERIFICATION (POST /api/auth/login) ---');
  const { POST } = await import('../app/api/auth/login/route');
  const { NextRequest } = await import('next/server');

  // Test 3a: Admin Login via API
  const adminReq = new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@research.edu', password: 'Password@123' }),
  });
  const adminApiRes = await POST(adminReq);
  const adminApiData = await adminApiRes.json();
  expect(adminApiRes.status === 200, 'POST /api/auth/login with admin "Password@123" returns HTTP 200');
  expect(adminApiData.user?.role === 'ADMIN', 'API response user role is ADMIN');
  expect(typeof adminApiData.token === 'string', 'API response contains valid JWT token');

  // Test 3b: Student Login via API
  const studentReq = new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@research.edu', password: 'Password@123' }),
  });
  const studentApiRes = await POST(studentReq);
  const studentApiData = await studentApiRes.json();
  expect(studentApiRes.status === 200, 'POST /api/auth/login with student "Password@123" returns HTTP 200');
  expect(studentApiData.user?.role === 'STUDENT', 'API response user role is STUDENT');

  // Test 3c: Wrong Password via API
  const wrongReq = new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@research.edu', password: 'WrongPassword' }),
  });
  const wrongApiRes = await POST(wrongReq);
  expect(wrongApiRes.status === 401, 'POST /api/auth/login with incorrect password returns HTTP 401');

  // Test 3d: Non-existent User via API
  const missingReq = new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nobody@research.edu', password: 'Password@123' }),
  });
  const missingApiRes = await POST(missingReq);
  expect(missingApiRes.status === 401, 'POST /api/auth/login with non-existent user returns HTTP 401');

  console.log('\n========================================================================');
  console.log(`TEST RESULTS: ${passes} PASSED, ${fails} FAILED`);
  console.log('========================================================================');

  if (fails > 0) {
    process.exit(1);
  }
  process.exit(0);
}

testAuth().catch((err) => {
  console.error('Fatal auth test error:', err);
  process.exit(1);
});
