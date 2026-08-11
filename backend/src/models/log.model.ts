import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types';

// ActivityLog Model
export interface IActivityLogDocument extends Document {
  id: string;
  request_id: string;
  action: string;
  description: string;
  performed_by: string;
  role: UserRole;
  created_at: string;
}

const ActivityLogSchema = new Schema<IActivityLogDocument>({
  id: { type: String, required: true, unique: true },
  request_id: { type: String, required: true },
  action: { type: String, required: true },
  description: { type: String, required: true },
  performed_by: { type: String, required: true },
  role: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

export const ActivityLogModel = mongoose.model<IActivityLogDocument>('ActivityLog', ActivityLogSchema);

// Notification Model
export interface INotificationDocument extends Document {
  id: string;
  title: string;
  message: string;
  request_id: string;
  created_at: string;
  read: boolean;
}

const NotificationSchema = new Schema<INotificationDocument>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  request_id: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() },
  read: { type: Boolean, default: false }
}, { timestamps: true });

export const NotificationModel = mongoose.model<INotificationDocument>('Notification', NotificationSchema);
