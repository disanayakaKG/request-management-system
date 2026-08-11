import mongoose, { Schema, Document } from 'mongoose';
import { RequestDepartment, RequestPriority, RequestStatus } from '../types';

export interface IRequestDocument extends Document {
  id: string;
  title: string;
  department: RequestDepartment;
  description: string;
  priority: RequestPriority;
  status: RequestStatus;
  attachment?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_by_user?: boolean;
  completed_at?: string;
  adminComments?: string;
}

const RequestSchema = new Schema<IRequestDocument>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  department: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, required: true, enum: ['Low', 'Medium', 'High', 'Urgent'] },
  status: { 
    type: String, 
    required: true, 
    enum: ['Pending Inventory Review', 'Pending Admin Approval', 'Approved', 'Rejected', 'Need More Information', 'Completed'] 
  },
  attachment: { type: String },
  created_by: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() },
  completed_by_user: { type: Boolean, default: false },
  completed_at: { type: String },
  adminComments: { type: String }
}, { timestamps: true });

export const RequestModel = mongoose.model<IRequestDocument>('Request', RequestSchema);
