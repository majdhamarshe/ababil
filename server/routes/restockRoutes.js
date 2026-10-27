import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middlewares/auth.js';
import { Product } from '../models/Product.js';
import { RestockRequest } from '../models/RestockRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const schema = z.object({
  productId: z.string().min(1),
  phone: z.string().regex(/^05[69]\d{7}$/),
  color: z.string().max(50).optional(),
  size: z.string().max(50).optional(),
});
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = schema.parse(req.body);
    const product = await Product.findById(data.productId).select('_id');
    if (!product) return res.status(404).json({ message: 'المنتج غير موجود.' });
    await RestockRequest.findOneAndUpdate(
      {
        product: data.productId,
        phone: data.phone,
        color: data.color || '',
        size: data.size || '',
      },
      {
        $setOnInsert: {
          product: data.productId,
          phone: data.phone,
          color: data.color || '',
          size: data.size || '',
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
    res
      .status(201)
      .json({ message: 'تم تسجيل طلب تنبيه عودة المنتج للمخزون.' });
  })
);
router.get(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({
      data: await RestockRequest.find()
        .populate('product', 'name slug')
        .sort({ createdAt: -1 })
        .limit(100),
    });
  })
);
router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const request = await RestockRequest.findByIdAndDelete(req.params.id);
    if (!request)
      return res.status(404).json({ message: 'طلب التنبيه غير موجود.' });
    res.status(204).end();
  })
);
export default router;
