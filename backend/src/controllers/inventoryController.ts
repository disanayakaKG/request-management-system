import { Response } from 'express';
import { db } from '../db/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendInventoryEventNotification } from '../services/emailService';

/**
 * GET /api/materials
 * Fetch all materials
 */
export async function getMaterials(req: AuthenticatedRequest, res: Response) {
  try {
    const { search } = req.query;
    let materials = db.getMaterials();

    if (search) {
      const searchStr = (search as string).toLowerCase().trim();
      materials = materials.filter(m => 
        m.material_id.toLowerCase().includes(searchStr) ||
        m.material_name.toLowerCase().includes(searchStr) ||
        m.unit.toLowerCase().includes(searchStr)
      );
    }

    materials.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return res.status(200).json({ materials });
  } catch (error) {
    console.error('Get materials error:', error);
    return res.status(500).json({ message: 'Internal server error fetching materials' });
  }
}

/**
 * POST /api/materials
 * Create a new material (Inventory Officer & Admin)
 */
export async function createMaterial(req: AuthenticatedRequest, res: Response) {
  const { material_name, unit, current_stock, minimum_stock_level, location, supplier, description } = req.body;

  if (!material_name || !material_name.trim()) {
    return res.status(400).json({ message: 'Material name is required' });
  }

  if (!unit || !unit.trim()) {
    return res.status(400).json({ message: 'Unit is required' });
  }

  const stockNum = parseInt(current_stock ?? 0);
  if (isNaN(stockNum) || stockNum < 0) {
    return res.status(400).json({ message: 'Current stock must be a non-negative number' });
  }

  const minStockNum = parseInt(minimum_stock_level ?? 0);

  try {
    const newMat = await db.createMaterial({
      material_name: material_name.trim(),
      unit: unit.trim(),
      current_stock: stockNum,
      minimum_stock_level: isNaN(minStockNum) ? 0 : minStockNum,
      location: (location || '').trim(),
      supplier: (supplier || '').trim(),
      description: (description || '').trim()
    });

    await db.createInventoryTransaction({
      request_id: 'SYSTEM',
      item_type: 'Material',
      item_id: newMat.material_id,
      item_name: newMat.material_name,
      quantity: stockNum,
      action: 'Initial Stock Addition',
      performed_by: req.user?.name || 'System'
    });

    console.log(`[API] Created Material ${newMat.material_id} (${newMat.id}) - Name: "${newMat.material_name}", Stock: ${newMat.current_stock}, Location: "${newMat.location}"`);

    // Dispatch inventory event notification email to bwarehouseltl@gmail.com
    sendInventoryEventNotification({
      action: 'Added',
      itemType: 'Material',
      itemName: newMat.material_name,
      itemId: newMat.material_id,
      details: `Initial stock: ${stockNum} ${unit.trim()}, Location: ${location || 'N/A'}`,
      performerName: req.user?.name
    });

    if (newMat.current_stock <= (newMat.minimum_stock_level || 0)) {
      sendInventoryEventNotification({
        action: 'Low Stock Warning',
        itemType: 'Material',
        itemName: newMat.material_name,
        itemId: newMat.material_id,
        details: `Stock level (${newMat.current_stock}) is below or equal to threshold (${newMat.minimum_stock_level}).`,
        performerName: req.user?.name
      });
    }

    return res.status(201).json({
      message: 'Material created successfully',
      material: newMat
    });
  } catch (error: any) {
    console.error('Create material error:', error?.message || error);
    return res.status(500).json({ message: error?.message || 'Internal server error creating material' });
  }
}

/**
 * PUT /api/materials/:id
 * Update material details
 */
export async function updateMaterial(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { material_name, unit, current_stock, minimum_stock_level, location, supplier, description } = req.body;

  try {
    const existing = db.findMaterialById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Material not found' });
    }

    const updates: any = {};
    if (material_name !== undefined) updates.material_name = material_name.trim();
    if (unit !== undefined) updates.unit = unit.trim();
    if (location !== undefined) updates.location = location.trim();
    if (supplier !== undefined) updates.supplier = supplier.trim();
    if (description !== undefined) updates.description = description.trim();
    if (minimum_stock_level !== undefined) {
      const minNum = parseInt(minimum_stock_level);
      updates.minimum_stock_level = isNaN(minNum) ? 0 : minNum;
    }
    if (current_stock !== undefined) {
      const stockNum = parseInt(current_stock);
      if (isNaN(stockNum) || stockNum < 0) {
        return res.status(400).json({ message: 'Current stock must be a non-negative number' });
      }
      
      const diff = stockNum - existing.current_stock;
      if (diff !== 0) {
        await db.createInventoryTransaction({
          request_id: 'SYSTEM',
          item_type: 'Material',
          item_id: existing.material_id,
          item_name: existing.material_name,
          quantity: Math.abs(diff),
          action: diff > 0 ? 'Stock Increase' : 'Stock Decrease',
          performed_by: req.user?.name || 'System'
        });
      }
      updates.current_stock = stockNum;
    }

    const updated = await db.updateMaterial(id, updates);

    if (updated) {
      console.log(`[API] Updated Material ${id} (${updated.material_id}) - Stock: ${updated.current_stock}, Location: "${updated.location}"`);

      // Dispatch inventory event notification email to bwarehouseltl@gmail.com
      sendInventoryEventNotification({
        action: 'Edited',
        itemType: 'Material',
        itemName: updated.material_name,
        itemId: updated.material_id,
        details: `Updated stock: ${updated.current_stock} ${updated.unit}, Location: ${updated.location || 'N/A'}`,
        performerName: req.user?.name
      });

      if (updated.current_stock <= (updated.minimum_stock_level || 0)) {
        sendInventoryEventNotification({
          action: 'Low Stock Warning',
          itemType: 'Material',
          itemName: updated.material_name,
          itemId: updated.material_id,
          details: `Current stock level (${updated.current_stock}) is below or equal to threshold (${updated.minimum_stock_level}).`,
          performerName: req.user?.name
        });
      }
    }

    return res.status(200).json({
      message: 'Material updated successfully',
      material: updated
    });
  } catch (error: any) {
    console.error('Update material error:', error?.message || error);
    return res.status(500).json({ message: error?.message || 'Internal server error updating material' });
  }
}

/**
 * DELETE /api/materials/:id
 * Delete a material
 */
export async function deleteMaterial(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const mat = db.findMaterialById(id);
    if (!mat) {
      return res.status(404).json({ message: 'Material not found' });
    }

    await db.deleteMaterial(id);
    console.log(`[API] Deleted Material ${id} (${mat.material_id})`);

    sendInventoryEventNotification({
      action: 'Deleted',
      itemType: 'Material',
      itemName: mat.material_name,
      itemId: mat.material_id,
      details: `Material ${mat.material_name} (${mat.material_id}) was deleted from inventory database.`,
      performerName: req.user?.name
    });

    return res.status(200).json({ message: 'Material deleted successfully' });
  } catch (error: any) {
    console.error('Delete material error:', error?.message || error);
    return res.status(500).json({ message: error?.message || 'Internal server error deleting material' });
  }
}

/**
 * GET /api/tools
 * Fetch all tools
 */
export async function getTools(req: AuthenticatedRequest, res: Response) {
  try {
    const { search } = req.query;
    let tools = db.getTools();

    if (search) {
      const searchStr = (search as string).toLowerCase().trim();
      tools = tools.filter(t => 
        t.tool_id.toLowerCase().includes(searchStr) ||
        t.tool_name.toLowerCase().includes(searchStr) ||
        (t.location && t.location.toLowerCase().includes(searchStr)) ||
        (t.serial_number && t.serial_number.toLowerCase().includes(searchStr))
      );
    }

    tools.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return res.status(200).json({ tools });
  } catch (error) {
    console.error('Get tools error:', error);
    return res.status(500).json({ message: 'Internal server error fetching tools' });
  }
}

/**
 * POST /api/tools
 * Create a new tool
 */
export async function createTool(req: AuthenticatedRequest, res: Response) {
  const { tool_name, available_quantity, quantity, serial_number, serialNumber, location, status, description } = req.body;

  if (!tool_name || !tool_name.trim()) {
    return res.status(400).json({ message: 'Tool name is required' });
  }

  const rawQty = available_quantity !== undefined ? available_quantity : quantity;
  const qtyNum = parseInt(rawQty ?? 0);
  if (isNaN(qtyNum) || qtyNum < 0) {
    return res.status(400).json({ message: 'Tool quantity must be a non-negative number' });
  }

  try {
    const newTool = await db.createTool({
      tool_name: tool_name.trim(),
      available_quantity: qtyNum,
      quantity: qtyNum,
      serial_number: (serial_number || serialNumber || '').trim(),
      location: (location || '').trim(),
      status: status || 'Available',
      description: (description || '').trim()
    });

    await db.createInventoryTransaction({
      request_id: 'SYSTEM',
      item_type: 'Tool',
      item_id: newTool.tool_id,
      item_name: newTool.tool_name,
      quantity: qtyNum,
      action: 'Initial Tool Registration',
      performed_by: req.user?.name || 'System'
    });

    console.log(`[API] Created Tool ${newTool.tool_id} (${newTool.id}) - Name: "${newTool.tool_name}", Qty: ${newTool.available_quantity}, Location: "${newTool.location}"`);

    sendInventoryEventNotification({
      action: 'Added',
      itemType: 'Tool',
      itemName: newTool.tool_name,
      itemId: newTool.tool_id,
      details: `Available Quantity: ${qtyNum}, Location: ${location || 'N/A'}, Status: ${status || 'Available'}`,
      performerName: req.user?.name
    });

    if (newTool.available_quantity <= 2) {
      sendInventoryEventNotification({
        action: 'Low Stock Warning',
        itemType: 'Tool',
        itemName: newTool.tool_name,
        itemId: newTool.tool_id,
        details: `Available tool quantity (${newTool.available_quantity}) is low.`,
        performerName: req.user?.name
      });
    }

    return res.status(201).json({
      message: 'Tool created successfully',
      tool: newTool
    });
  } catch (error: any) {
    console.error('Create tool error:', error?.message || error);
    return res.status(500).json({ message: error?.message || 'Internal server error creating tool' });
  }
}

/**
 * PUT /api/tools/:id
 * Update tool details
 */
export async function updateTool(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { tool_name, available_quantity, quantity, serial_number, serialNumber, location, status, description } = req.body;

  try {
    const existing = db.findToolById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Tool not found' });
    }

    const updates: any = {};
    if (tool_name !== undefined) updates.tool_name = tool_name.trim();
    if (serial_number !== undefined) updates.serial_number = serial_number.trim();
    if (serialNumber !== undefined) updates.serial_number = serialNumber.trim();
    if (location !== undefined) updates.location = location.trim();
    if (status !== undefined) updates.status = status;
    if (description !== undefined) updates.description = description.trim();

    const rawQty = available_quantity !== undefined ? available_quantity : quantity;
    if (rawQty !== undefined) {
      const qtyNum = parseInt(rawQty);
      if (isNaN(qtyNum) || qtyNum < 0) {
        return res.status(400).json({ message: 'Tool quantity must be a non-negative number' });
      }

      const diff = qtyNum - existing.available_quantity;
      if (diff !== 0) {
        await db.createInventoryTransaction({
          request_id: 'SYSTEM',
          item_type: 'Tool',
          item_id: existing.tool_id,
          item_name: existing.tool_name,
          quantity: Math.abs(diff),
          action: diff > 0 ? 'Tool Quantity Increase' : 'Tool Quantity Decrease',
          performed_by: req.user?.name || 'System'
        });
      }
      updates.available_quantity = qtyNum;
      updates.quantity = qtyNum;
    }

    const updated = await db.updateTool(id, updates);

    if (updated) {
      console.log(`[API] Updated Tool ${id} (${updated.tool_id}) - Qty: ${updated.available_quantity}, Location: "${updated.location}"`);

      sendInventoryEventNotification({
        action: 'Edited',
        itemType: 'Tool',
        itemName: updated.tool_name,
        itemId: updated.tool_id,
        details: `Available quantity: ${updated.available_quantity}, Location: ${updated.location || 'N/A'}, Status: ${updated.status || 'Available'}`,
        performerName: req.user?.name
      });

      if (updated.available_quantity <= 2) {
        sendInventoryEventNotification({
          action: 'Low Stock Warning',
          itemType: 'Tool',
          itemName: updated.tool_name,
          itemId: updated.tool_id,
          details: `Available tool quantity (${updated.available_quantity}) is low.`,
          performerName: req.user?.name
        });
      }
    }

    return res.status(200).json({
      message: 'Tool updated successfully',
      tool: updated
    });
  } catch (error: any) {
    console.error('Update tool error:', error?.message || error);
    return res.status(500).json({ message: error?.message || 'Internal server error updating tool' });
  }
}

/**
 * DELETE /api/tools/:id
 * Delete a tool
 */
export async function deleteTool(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const tool = db.findToolById(id);
    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }

    await db.deleteTool(id);
    console.log(`[API] Deleted Tool ${id} (${tool.tool_id})`);

    sendInventoryEventNotification({
      action: 'Deleted',
      itemType: 'Tool',
      itemName: tool.tool_name,
      itemId: tool.tool_id,
      details: `Tool ${tool.tool_name} (${tool.tool_id}) was deleted from inventory database.`,
      performerName: req.user?.name
    });

    return res.status(200).json({ message: 'Tool deleted successfully' });
  } catch (error: any) {
    console.error('Delete tool error:', error?.message || error);
    return res.status(500).json({ message: error?.message || 'Internal server error deleting tool' });
  }
}

/**
 * GET /api/inventory/transactions
 * Fetch transaction history
 */
export async function getInventoryTransactions(req: AuthenticatedRequest, res: Response) {
  try {
    const transactions = db.getInventoryTransactions();
    transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return res.status(200).json({ transactions });
  } catch (error) {
    console.error('Get inventory transactions error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

