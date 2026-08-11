import mongoose, { Schema, Document } from 'mongoose';

// Material Model
export interface IMaterialDocument extends Document {
  id: string;
  material_id: string;
  material_name: string;
  unit: string;
  current_stock: number;
  created_at: string;
  updated_at: string;
}

const MaterialSchema = new Schema<IMaterialDocument>({
  id: { type: String, required: true, unique: true },
  material_id: { type: String, required: true, unique: true },
  material_name: { type: String, required: true },
  unit: { type: String, required: true },
  current_stock: { type: Number, required: true, default: 0 },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

export const MaterialModel = mongoose.model<IMaterialDocument>('Material', MaterialSchema);

// Tool Model
export interface IToolDocument extends Document {
  id: string;
  tool_id: string;
  tool_name: string;
  available_quantity: number;
  created_at: string;
  updated_at: string;
}

const ToolSchema = new Schema<IToolDocument>({
  id: { type: String, required: true, unique: true },
  tool_id: { type: String, required: true, unique: true },
  tool_name: { type: String, required: true },
  available_quantity: { type: Number, required: true, default: 0 },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

export const ToolModel = mongoose.model<IToolDocument>('Tool', ToolSchema);

// RequestMaterial Model
export interface IRequestMaterialDocument extends Document {
  id: string;
  request_id: string;
  material_id: string;
  quantity: number;
  assigned_by: string;
  created_at: string;
}

const RequestMaterialSchema = new Schema<IRequestMaterialDocument>({
  id: { type: String, required: true, unique: true },
  request_id: { type: String, required: true },
  material_id: { type: String, required: true },
  quantity: { type: Number, required: true },
  assigned_by: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

export const RequestMaterialModel = mongoose.model<IRequestMaterialDocument>('RequestMaterial', RequestMaterialSchema);

// RequestTool Model
export interface IRequestToolDocument extends Document {
  id: string;
  request_id: string;
  tool_id: string;
  quantity: number;
  assigned_by: string;
  created_at: string;
}

const RequestToolSchema = new Schema<IRequestToolDocument>({
  id: { type: String, required: true, unique: true },
  request_id: { type: String, required: true },
  tool_id: { type: String, required: true },
  quantity: { type: Number, required: true },
  assigned_by: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

export const RequestToolModel = mongoose.model<IRequestToolDocument>('RequestTool', RequestToolSchema);

// InventoryTransaction Model
export interface IInventoryTransactionDocument extends Document {
  id: string;
  request_id: string;
  item_type: 'Material' | 'Tool';
  item_id: string;
  item_name: string;
  quantity: number;
  action: string;
  performed_by: string;
  created_at: string;
}

const InventoryTransactionSchema = new Schema<IInventoryTransactionDocument>({
  id: { type: String, required: true, unique: true },
  request_id: { type: String, required: true },
  item_type: { type: String, required: true, enum: ['Material', 'Tool'] },
  item_id: { type: String, required: true },
  item_name: { type: String, required: true },
  quantity: { type: Number, required: true },
  action: { type: String, required: true },
  performed_by: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

export const InventoryTransactionModel = mongoose.model<IInventoryTransactionDocument>('InventoryTransaction', InventoryTransactionSchema);
