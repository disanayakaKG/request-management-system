import { Router } from 'express';
import { 
  getMaterials, 
  createMaterial, 
  updateMaterial, 
  deleteMaterial,
  getTools,
  createTool,
  updateTool,
  deleteTool,
  getInventoryTransactions 
} from '../controllers/inventoryController';
import { authenticateUser, authorizeInventoryOfficer } from '../middleware/auth';

const router = Router();

// Protect all routes with authentication and bwarehouseltl@gmail.com inventory authorization
router.use(authenticateUser as any);
router.use(authorizeInventoryOfficer as any);

// Materials routes
router.get('/materials', getMaterials as any);
router.post('/materials', createMaterial as any);
router.put('/materials/:id', updateMaterial as any);
router.delete('/materials/:id', deleteMaterial as any);

// Tools routes
router.get('/tools', getTools as any);
router.post('/tools', createTool as any);
router.put('/tools/:id', updateTool as any);
router.delete('/tools/:id', deleteTool as any);

// Inventory transactions history log
router.get('/transactions', getInventoryTransactions as any);

export default router;

