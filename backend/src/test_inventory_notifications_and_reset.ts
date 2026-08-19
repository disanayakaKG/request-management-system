import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';
import dns from 'dns';
import { db } from './db/db';
import { UserModel } from './models/user.model';
import { config } from './config/config';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

async function testNotificationsAndReset() {
  const baseUrl = 'http://localhost:5000/api';
  console.log('🚀 Starting Verification of Inventory Email Notifications & Password Reset Flow...\n');

  // Step 1: Login as bwarehouseltl@gmail.com
  console.log('Step 1: Logging in as bwarehouseltl@gmail.com...');
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bwarehouseltl@gmail.com', password: 'New123456' })
  });
  const loginData = await loginRes.json();
  if (loginRes.status !== 200 || !loginData.token) {
    console.error('❌ Login failed for bwarehouseltl@gmail.com:', loginData);
    process.exit(1);
  }
  const token = loginData.token;
  console.log('✅ Logged in successfully!');

  // Step 2: Trigger Material Addition & Low Stock Warning
  console.log('\nStep 2: Creating new material to trigger Inventory Email Notification & Low Stock Alert...');
  const createMatRes = await fetch(`${baseUrl}/inventory/materials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      material_name: 'Test Copper Wire',
      unit: 'Rolls',
      current_stock: 2,
      minimum_stock_level: 5,
      location: 'Store Room C',
      supplier: 'Test Supplier',
      description: 'Notification test material'
    })
  });
  const createMatData = await createMatRes.json();
  if (createMatRes.status !== 201) {
    console.error('❌ Failed to create material:', createMatData);
    process.exit(1);
  }
  const matId = createMatData.material.id;
  console.log('✅ Material created successfully. ID:', matId);

  // Wait 5.0s for async email queue processing and SMTP retries
  await new Promise(r => setTimeout(r, 5000));

  // Step 3: Verify Inventory Email Logs via Admin API
  console.log('\nStep 3: Verifying email logs via /api/admin/logs/email for bwarehouseltl@gmail.com...');
  const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token;

  const emailLogsRes = await fetch(`${baseUrl}/admin/logs/email`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const emailLogsData = await emailLogsRes.json();
  const logs = emailLogsData.logs || [];
  const invLogs = logs.filter((l: any) => l.to.toLowerCase() === 'bwarehouseltl@gmail.com');
  console.log(`Total email logs sent to bwarehouseltl@gmail.com: ${invLogs.length}`);
  const latestLog = invLogs[0]; // Sorted newest first
  console.log('Latest Email Subject:', latestLog?.subject);
  if (!latestLog || !latestLog.subject.includes('[RMS]')) {
    console.error('❌ Email log subject missing expected [RMS] prefix!');
    process.exit(1);
  }
  console.log('✅ Inventory Email Notification logged in DB successfully with [RMS] prefix!');

  // Step 4: Cleanup material
  await fetch(`${baseUrl}/inventory/materials/${matId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // Step 5: Password Reset Flow
  console.log('\nStep 5: Testing Forgot Password request for bwarehouseltl@gmail.com...');
  const forgotRes = await fetch(`${baseUrl}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bwarehouseltl@gmail.com' })
  });
  const forgotData = await forgotRes.json();
  console.log('Forgot Password API Response:', forgotData);
  if (forgotRes.status !== 200) {
    console.error('❌ Forgot password API failed:', forgotData);
    process.exit(1);
  }

  // Wait 4.0s for async password reset email dispatch
  await new Promise(r => setTimeout(r, 4000));

  // Retrieve reset token from received email log
  const freshLogsRes = await fetch(`${baseUrl}/admin/logs/email`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const freshLogsData = await freshLogsRes.json();
  const freshInvLogs = (freshLogsData.logs || []).filter((l: any) => l.to.toLowerCase() === 'bwarehouseltl@gmail.com');
  const resetEmailLog = freshInvLogs.find((l: any) => l.subject.includes('Password Reset'));
  
  let resetCode = '';
  if (resetEmailLog && resetEmailLog.text) {
    const match = resetEmailLog.text.match(/\b\d{6}\b/);
    if (match) resetCode = match[0];
  }

  if (!resetCode) {
    console.error('❌ Reset token/code was not found in sent email log!');
    process.exit(1);
  }
  console.log('✅ Retrieved 30-min valid Password Reset Code from dispatched email:', resetCode);

  // Step 6: Submit Reset Password
  console.log('\nStep 6: Submitting Reset Password with code and new password "ResetPass123!"...');
  const resetRes = await fetch(`${baseUrl}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'bwarehouseltl@gmail.com',
      token: resetCode,
      newPassword: 'ResetPass123!'
    })
  });
  const resetData = await resetRes.json();
  console.log('Reset Password API Response:', resetData);
  if (resetRes.status !== 200) {
    console.error('❌ Reset password failed:', resetData);
    process.exit(1);
  }

  // Step 7: Verify Old Password Fails and New Password Succeeds
  console.log('\nStep 7: Verifying Old Password fails and New Password succeeds...');
  const oldLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bwarehouseltl@gmail.com', password: 'New123456' })
  });
  console.log('Old Password Login Status Code (Expected 401):', oldLoginRes.status);
  if (oldLoginRes.status !== 401) {
    console.error('❌ Old password should no longer work after reset!');
    process.exit(1);
  }

  const newLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bwarehouseltl@gmail.com', password: 'ResetPass123!' })
  });
  console.log('New Password Login Status Code (Expected 200):', newLoginRes.status);
  if (newLoginRes.status !== 200) {
    console.error('❌ New password login failed!');
    process.exit(1);
  }
  console.log('✅ New password login SUCCEEDED!');

  // Restore initial password "New123456" for convenience
  console.log('\nRestoring initial password "New123456"...');
  const freshHash = bcryptjs.hashSync('New123456', 10);
  db.resetUserPassword(userObj.id, freshHash);

  console.log('\n===============================================================');
  console.log('🎉 ALL INVENTORY NOTIFICATIONS & PASSWORD RECOVERY TESTS PASSED!');
  console.log('===============================================================');
}

testNotificationsAndReset().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
