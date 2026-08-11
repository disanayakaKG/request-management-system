import bcryptjs from 'bcryptjs';
import { UserModel } from '../models/user.model';
import { RequestModel } from '../models/request.model';
import { MaterialModel, ToolModel } from '../models/inventory.model';
import { ActivityLogModel } from '../models/log.model';

export async function seedMongoData() {
  try {
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding MongoDB Atlas with initial data...');
      const salt = bcryptjs.genSaltSync(10);
      const defaultPasswordHash = bcryptjs.hashSync('password123', salt);

      // Seed Users
      await UserModel.insertMany([
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
      ]);
      console.log('✅ Seeded default users in MongoDB Atlas');
    }

    const requestCount = await RequestModel.countDocuments();
    if (requestCount === 0) {
      await RequestModel.insertMany([
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
      ]);
      console.log('✅ Seeded initial requests in MongoDB Atlas');
    }

    const logCount = await ActivityLogModel.countDocuments();
    if (logCount === 0) {
      await ActivityLogModel.insertMany([
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
      ]);
    }

    const matCount = await MaterialModel.countDocuments();
    if (matCount === 0) {
      await MaterialModel.insertMany([
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
      ]);
    }

    const toolCount = await ToolModel.countDocuments();
    if (toolCount === 0) {
      await ToolModel.insertMany([
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
      ]);
    }
  } catch (err) {
    console.error('⚠️ Error seeding MongoDB Atlas data:', err);
  }
}
