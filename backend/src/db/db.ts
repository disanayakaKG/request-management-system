import fs from 'fs';
import path from 'path';
import bcryptjs from 'bcryptjs';
import { 
  User, 
  Request, 
  ActivityLog, 
  UserRole, 
  Notification, 
  Material, 
  Tool, 
  RequestMaterial, 
  RequestTool, 
  InventoryTransaction,
  EmailLog
} from '../types';
import mongoose from 'mongoose';
import { UserModel } from '../models/user.model';
import { RequestModel } from '../models/request.model';
import { MaterialModel, ToolModel, RequestMaterialModel, RequestToolModel, InventoryTransactionModel } from '../models/inventory.model';
import { ActivityLogModel, NotificationModel } from '../models/log.model';

function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

const DB_PATH = path.join(process.cwd(), 'database.json');

interface DatabaseSchema {
  users: User[];
  requests: Request[];
  activity_logs: ActivityLog[];
  notifications?: Notification[];
  materials: Material[];
  tools: Tool[];
  request_materials: RequestMaterial[];
  request_tools: RequestTool[];
  inventory_transactions: InventoryTransaction[];
  email_logs?: EmailLog[];
}

class Database {
  private data: DatabaseSchema = {
    users: [],
    requests: [],
    activity_logs: [],
    materials: [],
    tools: [],
    request_materials: [],
    request_tools: [],
    inventory_transactions: [],
    email_logs: []
  };

  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.notifications) {
          this.data.notifications = [];
        }
        if (!this.data.materials) {
          this.data.materials = [];
        }
        if (!this.data.tools) {
          this.data.tools = [];
        }
        if (!this.data.request_materials) {
          this.data.request_materials = [];
        }
        if (!this.data.request_tools) {
          this.data.request_tools = [];
        }
        if (!this.data.inventory_transactions) {
          this.data.inventory_transactions = [];
        }
        if (!this.data.email_logs) {
          this.data.email_logs = [];
        }
        this.ensureDefaultUsers();
      } else {
        this.seed();
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize database, resetting...', error);
      this.seed();
      this.initialized = true;
    }
  }

  public async syncWithMongo() {
    if (!isMongoConnected()) return;
    try {
      const users = await UserModel.find({}).lean();
      const requests = await RequestModel.find({}).lean();
      const materials = await MaterialModel.find({}).lean();
      const tools = await ToolModel.find({}).lean();
      const logs = await ActivityLogModel.find({}).lean();
      const notifs = await NotificationModel.find({}).lean();
      const reqMats = await RequestMaterialModel.find({}).lean();
      const reqTools = await RequestToolModel.find({}).lean();
      const txs = await InventoryTransactionModel.find({}).lean();

      if (users.length > 0) this.data.users = users as any;
      if (requests.length > 0) this.data.requests = requests as any;
      if (materials.length > 0) this.data.materials = materials as any;
      if (tools.length > 0) this.data.tools = tools as any;
      if (logs.length > 0) this.data.activity_logs = logs as any;
      if (notifs.length > 0) this.data.notifications = notifs as any;
      if (reqMats.length > 0) this.data.request_materials = reqMats as any;
      if (reqTools.length > 0) this.data.request_tools = reqTools as any;
      if (txs.length > 0) this.data.inventory_transactions = txs as any;

      this.initialized = true;
      console.log('🔄 Database synced successfully with MongoDB Atlas.');
    } catch (err) {
      console.error('Error syncing database with MongoDB Atlas:', err);
    }
  }


  private ensureDefaultUsers() {
    const salt = bcryptjs.genSaltSync(10);
    const defaultPasswordHash = bcryptjs.hashSync('password123', salt);

    const defaultUsers: User[] = [
      {
        id: 'u_1',
        name: 'John Doe',
        email: 'user@example.com',
        password: defaultPasswordHash,
        role: 'User',
        created_at: new Date('2026-07-20T08:00:00Z').toISOString()
      },
      {
        id: 'u_officer',
        name: 'Warehouse Officer',
        email: 'bwarehouseltl@gmail.com',
        password: defaultPasswordHash,
        role: 'Inventory Officer',
        created_at: new Date('2026-07-20T07:30:00Z').toISOString()
      },
      {
        id: 'u_admin',
        name: 'Admin Manager',
        email: 'admin@example.com',
        password: defaultPasswordHash,
        role: 'Admin',
        created_at: new Date('2026-07-20T07:00:00Z').toISOString()
      }
    ];

    let changed = false;
    for (const defUser of defaultUsers) {
      const existing = this.data.users.find(u => u.email.toLowerCase() === defUser.email.toLowerCase());
      if (!existing) {
        this.data.users.push(defUser);
        changed = true;
      }
    }

    if (changed) {
      this.save();
    }
  }

  private seed() {
    const salt = bcryptjs.genSaltSync(10);
    const defaultPasswordHash = bcryptjs.hashSync('password123', salt);

    this.data = {
      users: [
        {
          id: 'u_1',
          name: 'John Doe',
          email: 'user@example.com',
          password: defaultPasswordHash,
          role: 'User',
          created_at: new Date('2026-07-20T08:00:00Z').toISOString()
        },
        {
          id: 'u_officer',
          name: 'Alex Inventory',
          email: 'officer@example.com',
          password: defaultPasswordHash,
          role: 'Inventory Officer',
          created_at: new Date('2026-07-20T07:30:00Z').toISOString()
        },
        {
          id: 'u_admin',
          name: 'Admin Manager',
          email: 'admin@example.com',
          password: defaultPasswordHash,
          role: 'Admin',
          created_at: new Date('2026-07-20T07:00:00Z').toISOString()
        }
      ],
      requests: [
        {
          id: 'req_1001',
          title: 'HVAC Fan Noise in Workshop',
          department: 'Maintenance',
          description: 'The primary exhaust fan in Workshop B is making a loud metallic grinding sound when running. Needs inspection before it fails completely.',
          priority: 'High',
          status: 'Pending Inventory Review',
          created_by: 'u_1',
          created_at: new Date('2026-07-20T09:30:00Z').toISOString(),
          updated_at: new Date('2026-07-20T10:00:00Z').toISOString()
        },
        {
          id: 'req_1002',
          title: 'Conveyor Belt Calibration',
          department: 'Production',
          description: 'The packing line 3 conveyor belt is slipping intermittently, causing delays in boxed item scanning.',
          priority: 'Medium',
          status: 'Pending Inventory Review',
          created_by: 'u_1',
          created_at: new Date('2026-07-20T11:15:00Z').toISOString(),
          updated_at: new Date('2026-07-20T11:15:00Z').toISOString()
        }
      ],
      activity_logs: [
        {
          id: 'log_1',
          request_id: 'req_1001',
          action: 'Submitted Request',
          description: 'Request for HVAC inspection was successfully submitted by John Doe.',
          performed_by: 'John Doe',
          role: 'User',
          created_at: new Date('2026-07-20T09:30:00Z').toISOString()
        },
        {
          id: 'log_2',
          request_id: 'req_1002',
          action: 'Submitted Request',
          description: 'Request for Conveyor Belt Calibration was successfully submitted by John Doe.',
          performed_by: 'John Doe',
          role: 'User',
          created_at: new Date('2026-07-20T11:15:00Z').toISOString()
        }
      ],
      notifications: [],
      materials: [
        {
          id: 'mat_1',
          material_id: 'MAT-1001',
          material_name: 'PVC Cable',
          unit: 'm',
          current_stock: 100,
          created_at: new Date('2026-07-20T08:00:00Z').toISOString(),
          updated_at: new Date('2026-07-20T08:00:00Z').toISOString()
        },
        {
          id: 'mat_2',
          material_id: 'MAT-1002',
          material_name: 'Grease',
          unit: 'Tubes',
          current_stock: 50,
          created_at: new Date('2026-07-20T08:10:00Z').toISOString(),
          updated_at: new Date('2026-07-20T08:10:00Z').toISOString()
        },
        {
          id: 'mat_3',
          material_id: 'MAT-1003',
          material_name: 'Bearing',
          unit: 'pcs',
          current_stock: 30,
          created_at: new Date('2026-07-20T08:15:00Z').toISOString(),
          updated_at: new Date('2026-07-20T08:15:00Z').toISOString()
        }
      ],
      tools: [
        {
          id: 'tool_1',
          tool_id: 'TOOL-1001',
          tool_name: 'Multimeter',
          available_quantity: 5,
          created_at: new Date('2026-07-20T08:00:00Z').toISOString(),
          updated_at: new Date('2026-07-20T08:00:00Z').toISOString()
        },
        {
          id: 'tool_2',
          tool_id: 'TOOL-1002',
          tool_name: 'Clamp Meter',
          available_quantity: 3,
          created_at: new Date('2026-07-20T08:05:00Z').toISOString(),
          updated_at: new Date('2026-07-20T08:05:00Z').toISOString()
        },
        {
          id: 'tool_3',
          tool_id: 'TOOL-1003',
          tool_name: 'Bearing Puller',
          available_quantity: 2,
          created_at: new Date('2026-07-20T08:10:00Z').toISOString(),
          updated_at: new Date('2026-07-20T08:10:00Z').toISOString()
        },
        {
          id: 'tool_4',
          tool_id: 'TOOL-1004',
          tool_name: 'Torque Wrench',
          available_quantity: 4,
          created_at: new Date('2026-07-20T08:15:00Z').toISOString(),
          updated_at: new Date('2026-07-20T08:15:00Z').toISOString()
        }
      ],
      request_materials: [],
      request_tools: [],
      inventory_transactions: []
    };
    this.save();
  }

  private save() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to write database file', error);
    }
  }

  // --- User Operations ---
  public getUsers(): User[] {
    this.init();
    return this.data.users;
  }

  public findUserByEmail(email: string): User | undefined {
    this.init();
    const sanitizedEmail = email.toLowerCase().trim();
    return this.data.users.find(u => u.email.toLowerCase() === sanitizedEmail);
  }

  public findUserById(id: string): User | undefined {
    this.init();
    return this.data.users.find(u => u.id === id);
  }

  public createUser(user: Omit<User, 'id' | 'created_at'>): User {
    this.init();
    const newUser: User = {
      ...user,
      id: 'u_' + Math.random().toString(36).substr(2, 9),
      email: user.email.toLowerCase().trim(),
      created_at: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    if (isMongoConnected()) {
      UserModel.create(newUser).catch(err => console.error('MongoDB sync error (createUser):', err));
    }
    return newUser;
  }

  public setResetToken(email: string, token: string, expiresAt: string): boolean {
    this.init();
    const user = this.findUserByEmail(email);
    if (!user) return false;
    user.reset_token = token;
    user.reset_token_expires = expiresAt;
    this.save();
    if (isMongoConnected()) {
      UserModel.updateOne({ id: user.id }, { reset_token: token, reset_token_expires: expiresAt }).catch(() => {});
    }
    return true;
  }

  public findUserByResetToken(token: string): User | undefined {
    this.init();
    return this.data.users.find(u => u.reset_token === token);
  }

  public resetUserPassword(userId: string, newPasswordHash: string): boolean {
    this.init();
    const user = this.findUserById(userId);
    if (!user) return false;
    user.password = newPasswordHash;
    user.reset_token = undefined;
    user.reset_token_expires = undefined;
    this.save();
    if (isMongoConnected()) {
      UserModel.updateOne({ id: userId }, { password: newPasswordHash, $unset: { reset_token: 1, reset_token_expires: 1 } }).catch(() => {});
    }
    return true;
  }

  // --- Request Operations ---
  public getRequests(): Request[] {
    this.init();
    return this.data.requests;
  }

  public findRequestById(id: string): Request | undefined {
    this.init();
    return this.data.requests.find(r => r.id === id);
  }

  public createRequest(req: Omit<Request, 'id' | 'created_at' | 'updated_at'>): Request {
    this.init();
    const idNum = this.data.requests.length > 0 
      ? Math.max(...this.data.requests.map(r => {
          const parsed = parseInt(r.id.replace('req_', ''));
          return isNaN(parsed) ? 1000 : parsed;
        })) + 1
      : 1001;

    const newReq: Request = {
      ...req,
      id: `req_${idNum}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.requests.push(newReq);
    this.save();
    if (isMongoConnected()) {
      RequestModel.create(newReq).catch(err => console.error('MongoDB sync error (createRequest):', err));
    }
    return newReq;
  }

  public updateRequest(id: string, updates: Partial<Omit<Request, 'id' | 'created_at' | 'created_by'>>): Request | undefined {
    this.init();
    const index = this.data.requests.findIndex(r => r.id === id);
    if (index === -1) return undefined;

    const updated: Request = {
      ...this.data.requests[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.data.requests[index] = updated;
    this.save();
    if (isMongoConnected()) {
      RequestModel.updateOne({ id }, updated).catch(err => console.error('MongoDB sync error (updateRequest):', err));
    }
    return updated;
  }

  public deleteRequest(id: string): boolean {
    this.init();
    const index = this.data.requests.findIndex(r => r.id === id);
    if (index === -1) return false;

    this.data.requests.splice(index, 1);
    this.data.activity_logs = this.data.activity_logs.filter(log => log.request_id !== id);
    this.data.request_materials = this.data.request_materials.filter(rm => rm.request_id !== id);
    this.data.request_tools = this.data.request_tools.filter(rt => rt.request_id !== id);
    this.save();
    if (isMongoConnected()) {
      RequestModel.deleteOne({ id }).catch(() => {});
      ActivityLogModel.deleteMany({ request_id: id }).catch(() => {});
      RequestMaterialModel.deleteMany({ request_id: id }).catch(() => {});
      RequestToolModel.deleteMany({ request_id: id }).catch(() => {});
    }
    return true;
  }

  // --- Activity Log Operations ---
  public getActivityLogs(requestId?: string): ActivityLog[] {
    this.init();
    if (requestId) {
      return this.data.activity_logs.filter(log => log.request_id === requestId);
    }
    return this.data.activity_logs;
  }

  public clearActivityLogs(): boolean {
    this.init();
    this.data.activity_logs = [];
    this.save();
    if (isMongoConnected()) {
      ActivityLogModel.deleteMany({}).catch(() => {});
    }
    return true;
  }

  public createActivityLog(log: Omit<ActivityLog, 'id' | 'created_at'>): ActivityLog {
    this.init();
    const newLog: ActivityLog = {
      ...log,
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    this.data.activity_logs.push(newLog);
    this.save();
    if (isMongoConnected()) {
      ActivityLogModel.create(newLog).catch(err => console.error('MongoDB sync error (createActivityLog):', err));
    }
    return newLog;
  }


  // --- Notification Operations ---
  public getNotifications(): Notification[] {
    this.init();
    if (!this.data.notifications) {
      this.data.notifications = [];
    }
    return this.data.notifications;
  }

  public createNotification(notif: Omit<Notification, 'id' | 'created_at' | 'read'>): Notification {
    this.init();
    if (!this.data.notifications) {
      this.data.notifications = [];
    }
    const newNotif: Notification = {
      ...notif,
      id: 'notif_' + Math.random().toString(36).substr(2, 9),
      read: false,
      created_at: new Date().toISOString()
    };
    this.data.notifications.push(newNotif);
    this.save();
    if (isMongoConnected()) {
      NotificationModel.create(newNotif).catch(() => {});
    }
    return newNotif;
  }

  public markNotificationAsRead(id: string): boolean {
    this.init();
    if (!this.data.notifications) return false;
    const notif = this.data.notifications.find(n => n.id === id);
    if (!notif) return false;
    notif.read = true;
    this.save();
    if (isMongoConnected()) {
      NotificationModel.updateOne({ id }, { read: true }).catch(() => {});
    }
    return true;
  }

  // --- Material Operations ---
  public getMaterials(): Material[] {
    this.init();
    if (!this.data.materials) this.data.materials = [];
    return this.data.materials;
  }

  public findMaterialById(id: string): Material | undefined {
    this.init();
    if (!this.data.materials) this.data.materials = [];
    return this.data.materials.find(m => m.id === id || m.material_id === id);
  }

  public createMaterial(mat: Omit<Material, 'id' | 'material_id' | 'created_at' | 'updated_at'>): Material {
    this.init();
    if (!this.data.materials) this.data.materials = [];

    const nextNum = this.data.materials.length > 0
      ? Math.max(...this.data.materials.map(m => {
          const parsed = parseInt((m.material_id || '').replace('MAT-', ''));
          return isNaN(parsed) ? 1000 : parsed;
        })) + 1
      : 1001;

    const newMat: Material = {
      ...mat,
      id: 'mat_' + Math.random().toString(36).substr(2, 9),
      material_id: `MAT-${nextNum}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.materials.push(newMat);
    this.save();
    if (isMongoConnected()) {
      MaterialModel.create(newMat).catch(err => console.error('MongoDB sync error (createMaterial):', err));
    }
    return newMat;
  }

  public updateMaterial(id: string, updates: Partial<Omit<Material, 'id' | 'material_id' | 'created_at'>>): Material | undefined {
    this.init();
    if (!this.data.materials) this.data.materials = [];
    const index = this.data.materials.findIndex(m => m.id === id || m.material_id === id);
    if (index === -1) return undefined;

    const updated: Material = {
      ...this.data.materials[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.data.materials[index] = updated;
    this.save();
    if (isMongoConnected()) {
      MaterialModel.updateOne({ $or: [{ id }, { material_id: id }] }, updated).catch(err => console.error('MongoDB sync error (updateMaterial):', err));
    }
    return updated;
  }

  public deleteMaterial(id: string): boolean {
    this.init();
    if (!this.data.materials) this.data.materials = [];
    const index = this.data.materials.findIndex(m => m.id === id || m.material_id === id);
    if (index === -1) return false;

    const targetId = this.data.materials[index].id;
    const targetMatId = this.data.materials[index].material_id;
    this.data.materials.splice(index, 1);
    this.save();
    if (isMongoConnected()) {
      MaterialModel.deleteOne({ $or: [{ id: targetId }, { material_id: targetMatId }, { id }] }).catch(err => console.error('MongoDB sync error (deleteMaterial):', err));
    }
    return true;
  }

  // --- Tool Operations ---
  public getTools(): Tool[] {
    this.init();
    if (!this.data.tools) this.data.tools = [];
    return this.data.tools;
  }

  public findToolById(id: string): Tool | undefined {
    this.init();
    if (!this.data.tools) this.data.tools = [];
    return this.data.tools.find(t => t.id === id || t.tool_id === id);
  }

  public createTool(tool: Omit<Tool, 'id' | 'tool_id' | 'created_at' | 'updated_at'>): Tool {
    this.init();
    if (!this.data.tools) this.data.tools = [];

    const nextNum = this.data.tools.length > 0
      ? Math.max(...this.data.tools.map(t => {
          const parsed = parseInt((t.tool_id || '').replace('TOOL-', ''));
          return isNaN(parsed) ? 1000 : parsed;
        })) + 1
      : 1001;

    const newTool: Tool = {
      ...tool,
      id: 'tool_' + Math.random().toString(36).substr(2, 9),
      tool_id: `TOOL-${nextNum}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.tools.push(newTool);
    this.save();
    if (isMongoConnected()) {
      ToolModel.create(newTool).catch(err => console.error('MongoDB sync error (createTool):', err));
    }
    return newTool;
  }

  public updateTool(id: string, updates: Partial<Omit<Tool, 'id' | 'tool_id' | 'created_at'>>): Tool | undefined {
    this.init();
    if (!this.data.tools) this.data.tools = [];
    const index = this.data.tools.findIndex(t => t.id === id || t.tool_id === id);
    if (index === -1) return undefined;

    const updated: Tool = {
      ...this.data.tools[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.data.tools[index] = updated;
    this.save();
    if (isMongoConnected()) {
      ToolModel.updateOne({ $or: [{ id }, { tool_id: id }] }, updated).catch(err => console.error('MongoDB sync error (updateTool):', err));
    }
    return updated;
  }

  public deleteTool(id: string): boolean {
    this.init();
    if (!this.data.tools) this.data.tools = [];
    const index = this.data.tools.findIndex(t => t.id === id || t.tool_id === id);
    if (index === -1) return false;

    const targetId = this.data.tools[index].id;
    const targetToolId = this.data.tools[index].tool_id;
    this.data.tools.splice(index, 1);
    this.save();
    if (isMongoConnected()) {
      ToolModel.deleteOne({ $or: [{ id: targetId }, { tool_id: targetToolId }, { id }] }).catch(err => console.error('MongoDB sync error (deleteTool):', err));
    }
    return true;
  }

  // --- Request Materials & Tools Operations ---
  public getRequestMaterialsByRequestId(requestId: string): RequestMaterial[] {
    this.init();
    if (!this.data.request_materials) this.data.request_materials = [];
    if (!this.data.materials) this.data.materials = [];

    const reqMats = this.data.request_materials.filter(rm => rm.request_id === requestId);
    return reqMats.map(rm => {
      const mat = this.data.materials.find(m => m.id === rm.material_id || m.material_id === rm.material_id);
      return {
        ...rm,
        material_name: mat ? mat.material_name : 'Unknown Material',
        unit: mat ? mat.unit : '',
        current_stock: mat ? mat.current_stock : 0
      };
    });
  }

  public getRequestToolsByRequestId(requestId: string): RequestTool[] {
    this.init();
    if (!this.data.request_tools) this.data.request_tools = [];
    if (!this.data.tools) this.data.tools = [];

    const reqTools = this.data.request_tools.filter(rt => rt.request_id === requestId);
    return reqTools.map(rt => {
      const tool = this.data.tools.find(t => t.id === rt.tool_id || t.tool_id === rt.tool_id);
      return {
        ...rt,
        tool_name: tool ? tool.tool_name : 'Unknown Tool',
        available_quantity: tool ? tool.available_quantity : 0
      };
    });
  }

  public assignMaterialsAndTools(
    requestId: string, 
    materials: { material_id: string; quantity: number }[], 
    tools: { tool_id: string; quantity: number }[],
    assignedBy: string
  ) {
    this.init();
    if (!this.data.request_materials) this.data.request_materials = [];
    if (!this.data.request_tools) this.data.request_tools = [];

    // Clear previous assignments for this request
    this.data.request_materials = this.data.request_materials.filter(rm => rm.request_id !== requestId);
    this.data.request_tools = this.data.request_tools.filter(rt => rt.request_id !== requestId);

    if (isMongoConnected()) {
      RequestMaterialModel.deleteMany({ request_id: requestId }).catch(() => {});
      RequestToolModel.deleteMany({ request_id: requestId }).catch(() => {});
    }

    materials.forEach(m => {
      const newRm = {
        id: 'rm_' + Math.random().toString(36).substr(2, 9),
        request_id: requestId,
        material_id: m.material_id,
        quantity: m.quantity,
        assigned_by: assignedBy,
        created_at: new Date().toISOString()
      };
      this.data.request_materials.push(newRm);
      if (isMongoConnected()) {
        RequestMaterialModel.create(newRm).catch(() => {});
      }
    });

    tools.forEach(t => {
      const newRt = {
        id: 'rt_' + Math.random().toString(36).substr(2, 9),
        request_id: requestId,
        tool_id: t.tool_id,
        quantity: t.quantity,
        assigned_by: assignedBy,
        created_at: new Date().toISOString()
      };
      this.data.request_tools.push(newRt);
      if (isMongoConnected()) {
        RequestToolModel.create(newRt).catch(() => {});
      }
    });

    this.save();
  }

  // --- Inventory Transactions ---
  public getInventoryTransactions(): InventoryTransaction[] {
    this.init();
    if (!this.data.inventory_transactions) this.data.inventory_transactions = [];
    return this.data.inventory_transactions;
  }

  public createInventoryTransaction(transaction: Omit<InventoryTransaction, 'id' | 'created_at'>): InventoryTransaction {
    this.init();
    if (!this.data.inventory_transactions) this.data.inventory_transactions = [];

    const newTx: InventoryTransaction = {
      ...transaction,
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    this.data.inventory_transactions.push(newTx);
    this.save();
    if (isMongoConnected()) {
      InventoryTransactionModel.create(newTx).catch(() => {});
    }
    return newTx;
  }


  // --- Email Log Operations ---
  public getEmailLogs(): EmailLog[] {
    this.init();
    if (!this.data.email_logs) this.data.email_logs = [];
    return this.data.email_logs;
  }

  public createEmailLog(log: Omit<EmailLog, 'id' | 'created_at'>): EmailLog {
    this.init();
    if (!this.data.email_logs) this.data.email_logs = [];

    const newLog: EmailLog = {
      ...log,
      id: 'mail_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    this.data.email_logs.push(newLog);
    this.save();
    return newLog;
  }

  public clearEmailLogs(): boolean {
    this.init();
    this.data.email_logs = [];
    this.save();
    return true;
  }
}

export const db = new Database();

