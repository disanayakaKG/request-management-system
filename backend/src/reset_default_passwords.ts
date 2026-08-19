import bcryptjs from 'bcryptjs';
import dns from 'dns';
import mongoose from 'mongoose';
import { db } from './db/db';
import { config } from './config/config';
import { UserModel } from './models/user.model';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

async function resetAllDefaultPasswords() {
  console.log('🔄 Resetting default user credentials in MongoDB Atlas & local database.json...');

  const invEmail = (config.inventoryEmail || 'bwarehouseltl@gmail.com').toLowerCase().trim();
  const invPassword = config.inventoryInitialPassword || 'New123456';
  const invPasswordHash = bcryptjs.hashSync(invPassword, 10);
  const defaultPasswordHash = bcryptjs.hashSync('password123', 10);

  // 1. Update local database.json
  const invUser = db.findUserByEmail(invEmail);
  if (invUser) {
    db.resetUserPassword(invUser.id, invPasswordHash);
    console.log(`✅ Reset local db password for ${invEmail} to: ${invPassword}`);
  }

  const adminUser = db.findUserByEmail('admin@example.com');
  if (adminUser) {
    db.resetUserPassword(adminUser.id, defaultPasswordHash);
    console.log(`✅ Reset local db password for admin@example.com to: password123`);
  }

  const stdUser = db.findUserByEmail('user@example.com');
  if (stdUser) {
    db.resetUserPassword(stdUser.id, defaultPasswordHash);
    console.log(`✅ Reset local db password for user@example.com to: password123`);
  }

  // 2. Connect to MongoDB Atlas & update UserModel
  if (config.mongoUri) {
    try {
      console.log('⏳ Connecting to MongoDB Atlas...');
      await mongoose.connect(config.mongoUri);
      
      await UserModel.updateOne(
        { email: invEmail },
        { password: invPasswordHash, $unset: { reset_token: 1, reset_token_hash: 1, reset_token_expires: 1 } }
      );

      await UserModel.updateOne(
        { email: 'admin@example.com' },
        { password: defaultPasswordHash, $unset: { reset_token: 1, reset_token_hash: 1, reset_token_expires: 1 } }
      );

      await UserModel.updateOne(
        { email: 'user@example.com' },
        { password: defaultPasswordHash, $unset: { reset_token: 1, reset_token_hash: 1, reset_token_expires: 1 } }
      );

      console.log('✅ Updated credentials in MongoDB Atlas!');
      await mongoose.disconnect();
    } catch (mongoErr) {
      console.error('⚠️ MongoDB Atlas update error:', mongoErr);
    }
  }

  console.log('🎉 Default credentials successfully restored!');
}

resetAllDefaultPasswords().catch(console.error);
