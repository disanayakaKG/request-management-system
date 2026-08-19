import dns from 'dns';
import mongoose from 'mongoose';
import { config } from './config/config';
import { MaterialModel, ToolModel } from './models/inventory.model';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('🚀 Starting Production Database Persistence Automated Test Suite...\n');

  // 1. Connect Mongoose directly to MongoDB Atlas for verification
  if (config.mongoUri) {
    console.log('⏳ Connecting Mongoose test client to MongoDB Atlas...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB Atlas!\n');
  }

  // 2. Health Endpoint Check
  console.log('--- TEST 1: System & MongoDB Health Check ---');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  console.log('Health API Response:', healthData);
  if (!healthData.mongodb.connected || healthData.mongodb.readyState !== 1) {
    throw new Error('❌ Health API reports MongoDB is NOT connected!');
  }
  console.log('✅ Health API test PASSED!\n');

  // 3. Login as Inventory Officer (bwarehouseltl@gmail.com)
  console.log('--- TEST 2: Inventory Officer Login ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bwarehouseltl@gmail.com', password: 'New123456' })
  });
  if (loginRes.status !== 200) {
    throw new Error(`❌ Login failed with status ${loginRes.status}`);
  }
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('✅ Login successful! Received token.\n');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 4. Test Material CRUD & Persistence in MongoDB Atlas
  console.log('--- TEST 3: Material Creation & MongoDB Atlas Verification ---');
  const createMatRes = await fetch(`${BASE_URL}/inventory/materials`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      material_name: 'Test Persistence Cable',
      unit: 'Meters',
      current_stock: 50,
      minimum_stock_level: 5,
      location: 'Test Store Room A',
      supplier: 'Test Supplier Ltd',
      description: 'Material created for persistence verification'
    })
  });
  console.log('Create Material HTTP Status:', createMatRes.status);
  const matData = await createMatRes.json();
  const createdMat = matData.material;
  console.log('Created Material:', createdMat);

  // Direct MongoDB Atlas Verification
  const mongoMatCreated = await MaterialModel.findOne({ id: createdMat.id });
  if (!mongoMatCreated) {
    throw new Error(`❌ Failed to find created Material ${createdMat.id} directly in MongoDB Atlas!`);
  }
  console.log(`✅ VERIFIED IN MONGODB ATLAS: Document ${mongoMatCreated.material_id} exists with stock ${mongoMatCreated.current_stock} and location "${mongoMatCreated.location}".`);

  console.log('\n--- TEST 4: Material Update & MongoDB Atlas Verification ---');
  const updateMatRes = await fetch(`${BASE_URL}/inventory/materials/${createdMat.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      current_stock: 120,
      location: 'Production Store Room B'
    })
  });
  console.log('Update Material HTTP Status:', updateMatRes.status);
  const updatedMatData = await updateMatRes.json();
  console.log('Updated Material Response:', updatedMatData.material);

  // Direct MongoDB Atlas Verification
  const mongoMatUpdated = await MaterialModel.findOne({ id: createdMat.id });
  if (!mongoMatUpdated || mongoMatUpdated.current_stock !== 120 || mongoMatUpdated.location !== 'Production Store Room B') {
    throw new Error(`❌ Failed to verify Material update in MongoDB Atlas! Found: stock=${mongoMatUpdated?.current_stock}, location="${mongoMatUpdated?.location}"`);
  }
  console.log(`✅ VERIFIED IN MONGODB ATLAS: Document updated to stock=120, location="Production Store Room B".`);

  console.log('\n--- TEST 5: Material Deletion & MongoDB Atlas Verification ---');
  const deleteMatRes = await fetch(`${BASE_URL}/inventory/materials/${createdMat.id}`, {
    method: 'DELETE',
    headers
  });
  console.log('Delete Material HTTP Status:', deleteMatRes.status);

  // Direct MongoDB Atlas Verification
  const mongoMatDeleted = await MaterialModel.findOne({ id: createdMat.id });
  if (mongoMatDeleted) {
    throw new Error(`❌ Material document ${createdMat.id} STILL EXISTS in MongoDB Atlas after deletion!`);
  }
  console.log(`✅ VERIFIED IN MONGODB ATLAS: Material document ${createdMat.id} successfully removed from MongoDB Atlas.`);

  // 5. Test Tool CRUD & Persistence in MongoDB Atlas
  console.log('\n--- TEST 6: Tool Creation & MongoDB Atlas Verification ---');
  const createToolRes = await fetch(`${BASE_URL}/inventory/tools`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      tool_name: 'Test Persistence Multimeter',
      available_quantity: 8,
      serial_number: 'TEST-MM-999',
      location: 'Tool Room A',
      status: 'Available',
      description: 'Tool created for persistence verification'
    })
  });
  console.log('Create Tool HTTP Status:', createToolRes.status);
  const toolData = await createToolRes.json();
  const createdTool = toolData.tool;
  console.log('Created Tool:', createdTool);

  // Direct MongoDB Atlas Verification
  const mongoToolCreated = await ToolModel.findOne({ id: createdTool.id });
  if (!mongoToolCreated) {
    throw new Error(`❌ Failed to find created Tool ${createdTool.id} directly in MongoDB Atlas!`);
  }
  console.log(`✅ VERIFIED IN MONGODB ATLAS: Document ${mongoToolCreated.tool_id} exists with available_quantity ${mongoToolCreated.available_quantity} and location "${mongoToolCreated.location}".`);

  console.log('\n--- TEST 7: Tool Update & MongoDB Atlas Verification ---');
  const updateToolRes = await fetch(`${BASE_URL}/inventory/tools/${createdTool.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      available_quantity: 25,
      location: 'Tool Room B'
    })
  });
  console.log('Update Tool HTTP Status:', updateToolRes.status);

  // Direct MongoDB Atlas Verification
  const mongoToolUpdated = await ToolModel.findOne({ id: createdTool.id });
  if (!mongoToolUpdated || mongoToolUpdated.available_quantity !== 25 || mongoToolUpdated.location !== 'Tool Room B') {
    throw new Error(`❌ Failed to verify Tool update in MongoDB Atlas! Found: qty=${mongoToolUpdated?.available_quantity}, location="${mongoToolUpdated?.location}"`);
  }
  console.log(`✅ VERIFIED IN MONGODB ATLAS: Tool updated to quantity=25, location="Tool Room B".`);

  console.log('\n--- TEST 8: Tool Deletion & MongoDB Atlas Verification ---');
  const deleteToolRes = await fetch(`${BASE_URL}/inventory/tools/${createdTool.id}`, {
    method: 'DELETE',
    headers
  });
  console.log('Delete Tool HTTP Status:', deleteToolRes.status);

  // Direct MongoDB Atlas Verification
  const mongoToolDeleted = await ToolModel.findOne({ id: createdTool.id });
  if (mongoToolDeleted) {
    throw new Error(`❌ Tool document ${createdTool.id} STILL EXISTS in MongoDB Atlas after deletion!`);
  }
  console.log(`✅ VERIFIED IN MONGODB ATLAS: Tool document ${createdTool.id} successfully removed from MongoDB Atlas.`);

  await mongoose.disconnect();

  console.log('\n========================================================================');
  console.log('🎉 ALL PRODUCTION DATABASE PERSISTENCE TESTS PASSED PERFECTLY!');
  console.log('========================================================================\n');
}

runTest().catch(err => {
  console.error('\n💥 PRODUCTION DB TEST FAILED:', err);
  process.exit(1);
});
