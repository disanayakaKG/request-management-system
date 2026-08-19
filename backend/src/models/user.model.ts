import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types';

export interface IUserDocument extends Document {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  reset_token?: string;
  reset_token_hash?: string;
  reset_token_expires?: string;
  created_at: string;
}

const UserSchema = new Schema<IUserDocument>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['User', 'Inventory Officer', 'Admin'] },
  reset_token: { type: String },
  reset_token_hash: { type: String },
  reset_token_expires: { type: String },
  created_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
