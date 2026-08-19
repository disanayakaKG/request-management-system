import bcryptjs from 'bcryptjs';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const baseUrl = 'http://localhost:5000/api';

async function runCentralPasswordResetTests() {
  console.log('🚀 Starting Central Password Reset Management Automated Tests...\n');

  // Login Admin to fetch logs later
  const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
  });
  const adminToken = (await adminLoginRes.json()).token;

  // -------------------------------------------------------------
  // TEST 1: Admin Account Password Recovery via bwarehouseltl@gmail.com
  // -------------------------------------------------------------
  console.log('--- TEST 1: Admin Account Password Recovery ---');
  const adminForgotRes = await fetch(`${baseUrl}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com' })
  });
  console.log('Admin Forgot Password Response Code:', adminForgotRes.status);
  if (adminForgotRes.status !== 200) throw new Error('Admin forgot password failed');

  // Wait 4.0s for email queue
  await new Promise(r => setTimeout(r, 4000));

  const emailLogs1 = await (await fetch(`${baseUrl}/admin/logs/email`, { headers: { 'Authorization': `Bearer ${adminToken}` } })).json();
  const adminResetEmail = (emailLogs1.logs || []).find((l: any) => l.to.toLowerCase() === 'bwarehouseltl@gmail.com' && l.subject.includes('Admin'));
  
  if (!adminResetEmail) throw new Error('❌ Admin reset email was not sent to bwarehouseltl@gmail.com!');
  console.log('✅ Admin reset email successfully dispatched to bwarehouseltl@gmail.com!');
  console.log('Email Subject:', adminResetEmail.subject);

  const adminTokenMatch = adminResetEmail.text.match(/\b\d{6}\b/);
  const adminCode = adminTokenMatch ? adminTokenMatch[0] : '';
  if (!adminCode) throw new Error('❌ Reset code not found in Admin email');

  // Reset Admin Password
  const adminResetRes = await fetch(`${baseUrl}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@example.com',
      token: adminCode,
      newPassword: 'NewAdminPass123!',
      confirmPassword: 'NewAdminPass123!'
    })
  });
  const adminResetData = await adminResetRes.json();
  console.log('Admin Reset Password Response:', adminResetData);
  if (adminResetRes.status !== 200) throw new Error('Admin reset password failed');

  // Verify Admin Old Pass fails, New Pass succeeds
  const adminOldLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
  });
  console.log('Admin Old Password Status (Expected 401):', adminOldLogin.status);
  if (adminOldLogin.status !== 401) throw new Error('Admin old password should fail');

  const adminNewLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'NewAdminPass123!' })
  });
  console.log('Admin New Password Status (Expected 200):', adminNewLogin.status);
  if (adminNewLogin.status !== 200) throw new Error('Admin new password failed to login');
  const freshAdminToken = (await adminNewLogin.json()).token;
  console.log('✅ Admin Password Reset Test PASSED!\n');

  // Restore Admin Password to password123 via Admin API
  await fetch(`${baseUrl}/auth/admin/reset-user-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${freshAdminToken}`
    },
    body: JSON.stringify({ targetEmail: 'admin@example.com', newPassword: 'password123' })
  });

  // Re-login Admin with restored password
  const restoredAdminLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
  });
  const activeAdminToken = (await restoredAdminLogin.json()).token;

  // -------------------------------------------------------------
  // TEST 2: User / Requester Password Recovery
  // -------------------------------------------------------------
  console.log('--- TEST 2: User / Requester Account Password Recovery ---');
  await fetch(`${baseUrl}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com' })
  });

  await new Promise(r => setTimeout(r, 4000));

  const emailLogs2 = await (await fetch(`${baseUrl}/admin/logs/email`, { headers: { 'Authorization': `Bearer ${activeAdminToken}` } })).json();
  const userResetEmail = (emailLogs2.logs || []).find((l: any) => l.to.toLowerCase() === 'bwarehouseltl@gmail.com' && l.subject.includes('User'));
  if (!userResetEmail) throw new Error('❌ User reset email not sent to bwarehouseltl@gmail.com');
  console.log('✅ User reset email successfully dispatched to bwarehouseltl@gmail.com!');
  console.log('Email Subject:', userResetEmail.subject);

  const userCode = userResetEmail.text.match(/\b\d{6}\b/)[0];
  const userResetRes = await fetch(`${baseUrl}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      token: userCode,
      newPassword: 'NewUserPass123!',
      confirmPassword: 'NewUserPass123!'
    })
  });
  if (userResetRes.status !== 200) throw new Error('User reset password failed');
  console.log('✅ User Password Reset Test PASSED!\n');

  // Restore User Password to password123
  await fetch(`${baseUrl}/auth/admin/reset-user-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${activeAdminToken}`
    },
    body: JSON.stringify({ targetEmail: 'user@example.com', newPassword: 'password123' })
  });

  // -------------------------------------------------------------
  // TEST 3: Inventory Officer Password Recovery
  // -------------------------------------------------------------
  console.log('--- TEST 3: Inventory Officer Account Password Recovery ---');
  await fetch(`${baseUrl}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bwarehouseltl@gmail.com' })
  });

  await new Promise(r => setTimeout(r, 4000));

  const emailLogs3 = await (await fetch(`${baseUrl}/admin/logs/email`, { headers: { 'Authorization': `Bearer ${activeAdminToken}` } })).json();
  const invResetEmail = (emailLogs3.logs || []).find((l: any) => l.to.toLowerCase() === 'bwarehouseltl@gmail.com' && l.subject.includes('Inventory Officer'));
  if (!invResetEmail) throw new Error('❌ Inventory reset email not sent to bwarehouseltl@gmail.com');
  console.log('✅ Inventory Officer reset email successfully dispatched to bwarehouseltl@gmail.com!');
  console.log('Email Subject:', invResetEmail.subject);

  const invCode = invResetEmail.text.match(/\b\d{6}\b/)[0];
  const invResetRes = await fetch(`${baseUrl}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'bwarehouseltl@gmail.com',
      token: invCode,
      newPassword: 'NewInvPass123!',
      confirmPassword: 'NewInvPass123!'
    })
  });
  if (invResetRes.status !== 200) throw new Error('Inventory reset password failed');
  console.log('✅ Inventory Officer Password Reset Test PASSED!\n');

  // Restore Inventory Password to New123456
  await fetch(`${baseUrl}/auth/admin/reset-user-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${activeAdminToken}`
    },
    body: JSON.stringify({ targetEmail: 'bwarehouseltl@gmail.com', newPassword: 'New123456' })
  });

  // -------------------------------------------------------------
  // TEST 4: Security Edge Cases (Invalid token, Reused token, Mismatched passwords)
  // -------------------------------------------------------------
  console.log('--- TEST 4: Security Edge Cases ---');
  
  // Reused token
  const reusedRes = await fetch(`${baseUrl}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com', token: userCode, newPassword: 'AnotherPass123!' })
  });
  console.log('Reused Token Status (Expected 400):', reusedRes.status);
  if (reusedRes.status !== 400) throw new Error('Reused token should be rejected');

  // Mismatched passwords
  const mismatchRes = await fetch(`${baseUrl}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com', token: '999999', newPassword: 'PassA', confirmPassword: 'PassB' })
  });
  console.log('Mismatched Passwords Status (Expected 400):', mismatchRes.status);
  if (mismatchRes.status !== 400) throw new Error('Mismatched passwords should be rejected');
  console.log('✅ Security Edge Cases Test PASSED!\n');

  // -------------------------------------------------------------
  // TEST 5: Authenticated Self Password Change (POST /api/auth/change-password)
  // -------------------------------------------------------------
  console.log('--- TEST 5: Self Password Change ---');
  const userLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com', password: 'password123' })
  });
  const userToken = (await userLogin.json()).token;

  // Wrong current password
  const wrongCurrentRes = await fetch(`${baseUrl}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      currentPassword: 'WrongPassword!',
      newPassword: 'BrandNewPassword123!',
      confirmPassword: 'BrandNewPassword123!'
    })
  });
  console.log('Wrong Current Password Status (Expected 400):', wrongCurrentRes.status);
  if (wrongCurrentRes.status !== 400) throw new Error('Wrong current password should fail');

  // Correct current password
  const correctSelfChangeRes = await fetch(`${baseUrl}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      currentPassword: 'password123',
      newPassword: 'BrandNewPassword123!',
      confirmPassword: 'BrandNewPassword123!'
    })
  });
  console.log('Correct Self Password Change Status (Expected 200):', correctSelfChangeRes.status);
  if (correctSelfChangeRes.status !== 200) throw new Error('Self password change failed');

  // Restore User Password back to password123
  await fetch(`${baseUrl}/auth/admin/reset-user-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${activeAdminToken}`
    },
    body: JSON.stringify({ targetEmail: 'user@example.com', newPassword: 'password123' })
  });
  console.log('✅ Self Password Change Test PASSED!\n');

  // -------------------------------------------------------------
  // TEST 6: Audit Log Verification
  // -------------------------------------------------------------
  console.log('--- TEST 6: Audit Logs Verification ---');
  const activityLogsRes = await fetch(`${baseUrl}/admin/logs/activity`, {
    headers: { 'Authorization': `Bearer ${activeAdminToken}` }
  });
  const activityLogsData = await activityLogsRes.json();
  const logs = activityLogsData.logs || [];

  const actionsFound = logs.map((l: any) => l.action);
  console.log('Recent Audit Log Actions:', actionsFound.slice(0, 10));

  const hasRequested = actionsFound.includes('PASSWORD_RESET_REQUESTED');
  const hasCompleted = actionsFound.includes('PASSWORD_RESET_COMPLETED');
  const hasChanged = actionsFound.includes('PASSWORD_CHANGED');
  const hasAdminReset = actionsFound.includes('ADMIN_PASSWORD_RESET');

  if (!hasRequested || !hasCompleted || !hasChanged || !hasAdminReset) {
    console.error('Missing expected audit log events:', { hasRequested, hasCompleted, hasChanged, hasAdminReset });
    throw new Error('Audit log entries missing');
  }
  console.log('✅ All Audit Log Events (PASSWORD_RESET_REQUESTED, PASSWORD_RESET_COMPLETED, PASSWORD_CHANGED, ADMIN_PASSWORD_RESET) Verified!\n');

  console.log('========================================================================');
  console.log('🎉 ALL CENTRAL PASSWORD RESET MANAGEMENT TESTS PASSED PERFECTLY!');
  console.log('========================================================================');
}

runCentralPasswordResetTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
