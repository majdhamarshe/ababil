import { Router } from 'express';
import { requireAdmin } from '../middlewares/auth.js';
import { AuditLog } from '../models/AuditLog.js';
import { ErrorEvent } from '../models/ErrorEvent.js';
import { Category } from '../models/Category.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { RestockRequest } from '../models/RestockRequest.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAdmin);
router.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const data = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ data });
  })
);
router.get(
  '/errors',
  asyncHandler(async (req, res) => {
    const data = await ErrorEvent.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .select('-stack');
    res.json({ data });
  })
);
router.get(
  '/backup',
  asyncHandler(async (req, res) => {
    const [products, categories, orders, restockRequests, users] =
      await Promise.all([
        Product.find().lean(),
        Category.find().lean(),
        Order.find().lean(),
        RestockRequest.find().lean(),
        User.find().select('-passwordHash').lean(),
      ]);
    const backup = {
      generatedAt: new Date().toISOString(),
      version: 1,
      products,
      categories,
      orders,
      restockRequests,
      users,
    };
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ababil-backup-${new Date().toISOString().slice(0, 10)}.json"`
    );
    res.json(backup);
  })
);
export default router;
