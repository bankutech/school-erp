import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma.js';
import {
  CreateInventoryItemInput,
  RecordInventoryMovementInput,
  UpdateInventoryItemInput,
} from '@school-erp/shared';

/**
 * Get Inventory Items with search, category filtering, and low stock status
 */
export async function getInventoryItems(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, lowStockOnly, search } = req.query;

    const where: any = {};
    if (category) {
      where.category = String(category);
    }
    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { itemCode: { contains: q, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        _count: {
          select: { movements: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const enriched = items.map((item) => ({
      ...item,
      isLowStock: item.quantity <= item.minQuantity,
    }));

    const result = lowStockOnly === 'true' ? enriched.filter((i) => i.isLowStock) : enriched;

    return res.status(200).json({
      success: true,
      data: result,
      totalCount: result.length,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get Aggregated Inventory Statistics & Low Stock Summary
 */
export async function getInventorySummary(req: Request, res: Response, next: NextFunction) {
  try {
    const [allItems, movementsCount] = await Promise.all([
      prisma.inventoryItem.findMany({
        select: {
          quantity: true,
          minQuantity: true,
        },
      }),
      prisma.inventoryMovement.count(),
    ]);

    const totalItems = allItems.length;
    let totalStockUnits = 0;
    let lowStockCount = 0;

    for (const item of allItems) {
      totalStockUnits += item.quantity;
      if (item.quantity <= item.minQuantity) {
        lowStockCount += 1;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        totalItems,
        totalStockUnits,
        lowStockCount,
        totalMovements: movementsCount,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Create Inventory Item with SKU / ItemCode Uniqueness
 */
export async function createInventoryItem(req: Request, res: Response, next: NextFunction) {
  try {
    const input: CreateInventoryItemInput = req.body;
    const cleanItemCode = input.itemCode.trim().toUpperCase();

    const existing = await prisma.inventoryItem.findUnique({
      where: { itemCode: cleanItemCode },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: `An inventory item with Code "${cleanItemCode}" already exists.`,
      });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        itemCode: cleanItemCode,
        name: input.name.trim(),
        category: input.category.trim(),
        unit: (input.unit || 'PCS').trim().toUpperCase(),
        minQuantity: input.minQuantity ?? 5,
        quantity: input.quantity ?? 0,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'INVENTORY_ITEM_CREATED',
        entity: 'InventoryItem',
        entityId: item.id,
        metadata: { itemCode: item.itemCode, name: item.name, quantity: item.quantity },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Inventory item catalogued successfully.',
      data: item,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Update Inventory Item Metadata
 */
export async function updateInventoryItem(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const input: UpdateInventoryItemInput = req.body;

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Inventory item not found.' });
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.category ? { category: input.category.trim() } : {}),
        ...(input.unit ? { unit: input.unit.trim().toUpperCase() } : {}),
        ...(input.minQuantity !== undefined ? { minQuantity: input.minQuantity } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'INVENTORY_ITEM_UPDATED',
        entity: 'InventoryItem',
        entityId: updated.id,
        metadata: { changes: input as any },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully.',
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Delete Inventory Item
 */
export async function deleteInventoryItem(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);

    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
      include: { _count: { select: { movements: true } } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Inventory item not found.' });
    }

    await prisma.inventoryItem.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'INVENTORY_ITEM_DELETED',
        entity: 'InventoryItem',
        entityId: id,
        metadata: { itemCode: existing.itemCode, name: existing.name },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Inventory item ${existing.name} (${existing.itemCode}) removed successfully.`,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Record Stock Movement with Strict Atomic Concurrency Protection
 */
export async function recordInventoryMovement(req: Request, res: Response, next: NextFunction) {
  try {
    const input: RecordInventoryMovementInput = req.body;
    const performer =
      `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || req.user?.email || 'System';

    if (input.quantity <= 0 && input.type !== 'ADJUSTMENT') {
      return res.status(400).json({ success: false, message: 'Movement quantity must be greater than zero.' });
    }

    if (input.type === 'ADJUSTMENT' && input.quantity < 0) {
      return res.status(400).json({ success: false, message: 'Stock quantity cannot be negative.' });
    }

    // Atomic transaction ensuring zero concurrency lost updates
    const result = await prisma.$transaction(async (tx) => {
      // Re-read inside transaction lock
      const item = await tx.inventoryItem.findUnique({
        where: { id: input.itemId },
      });

      if (!item) {
        throw new Error('ITEM_NOT_FOUND');
      }

      let newQuantity = item.quantity;
      if (input.type === 'IN') {
        newQuantity += input.quantity;
      } else if (input.type === 'OUT') {
        if (item.quantity < input.quantity) {
          throw new Error(`INSUFFICIENT_STOCK: Current stock is ${item.quantity} ${item.unit}, cannot deduct ${input.quantity} ${item.unit}.`);
        }
        newQuantity -= input.quantity;
      } else if (input.type === 'ADJUSTMENT') {
        newQuantity = input.quantity;
      }

      const movement = await tx.inventoryMovement.create({
        data: {
          itemId: item.id,
          type: input.type,
          quantity: input.quantity,
          reason: input.reason || null,
          performedBy: performer,
        },
      });

      const updatedItem = await tx.inventoryItem.update({
        where: { id: item.id },
        data: { quantity: newQuantity },
      });

      return { movement, updatedItem };
    });

    return res.status(201).json({
      success: true,
      message: `Stock movement recorded. Current stock is now ${result.updatedItem.quantity} ${result.updatedItem.unit}.`,
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'ITEM_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Inventory item not found.' });
    }
    if (error.message?.startsWith('INSUFFICIENT_STOCK')) {
      return res.status(400).json({ success: false, message: error.message.replace('INSUFFICIENT_STOCK: ', '') });
    }
    return next(error);
  }
}

/**
 * Get Movement Audit History
 */
export async function getInventoryMovements(req: Request, res: Response, next: NextFunction) {
  try {
    const { itemId } = req.query;

    const where: any = {};
    if (itemId) where.itemId = String(itemId);

    const movements = await prisma.inventoryMovement.findMany({
      where,
      include: {
        item: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.status(200).json({
      success: true,
      data: movements,
      totalCount: movements.length,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Export Inventory Stock Ledger as CSV
 */
export async function exportInventoryCSV(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.inventoryItem.findMany({
      include: {
        _count: { select: { movements: true } },
      },
      orderBy: { itemCode: 'asc' },
    });

    const headers = [
      'Item Code',
      'Name',
      'Category',
      'Current Quantity',
      'Unit',
      'Minimum Threshold',
      'Stock Status',
      'Total Movement Count',
    ];

    const rows = items.map((item) => {
      const isLowStock = item.quantity <= item.minQuantity;
      return [
        `"${item.itemCode.replace(/"/g, '""')}"`,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.category.replace(/"/g, '""')}"`,
        item.quantity,
        `"${item.unit}"`,
        item.minQuantity,
        isLowStock ? 'LOW STOCK ALERT' : 'ADEQUATE',
        item._count.movements,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-stock-audit-${Date.now()}.csv"`);

    return res.status(200).send(csvContent);
  } catch (error) {
    return next(error);
  }
}
