import { Router } from 'express';
import { requireAdmin } from '../middlewares/auth.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.get(
  '/summary',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const [products, lowStock, orders, sales, recentOrders, lowStockProducts] =
      await Promise.all([
        Product.countDocuments(),
        Product.countDocuments({ stock: { $lte: 5 } }),
        Order.countDocuments(),
        Order.aggregate([
          { $match: { status: { $in: ['completed', 'shipped'] } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        Order.find({}).sort({ createdAt: -1 }).limit(6),
        Product.find({ stock: { $lte: 5 } })
          .select('name stock images isPublished')
          .sort({ stock: 1 })
          .limit(6),
      ]);
    res.json({
      data: {
        products,
        lowStock,
        orders,
        sales: sales[0]?.total || 0,
        recentOrders,
        lowStockProducts,
      },
    });
  })
);
export default router;
