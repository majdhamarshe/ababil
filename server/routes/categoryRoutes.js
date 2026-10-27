import { Router } from 'express';
import { z } from 'zod';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { requireAdmin } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toSlug } from '../utils/slug.js';
import { imageUrls, uploadCategoryImage } from '../middlewares/upload.js';
import { audit } from '../utils/audit.js';

const router = Router();
const categoryBool = z.union([
  z.boolean(),
  z.enum(['true', 'false']).transform((value) => value === 'true'),
]);
const categorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().max(100).optional(),
  icon: z.string().max(20).optional(),
  image: z.string().max(500).optional(),
  description: z.string().max(200).optional(),
  isActive: categoryBool.optional(),
});
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = { isActive: true };
    res.json({ data: await Category.find(query).sort({ createdAt: -1 }) });
  })
);
router.get(
  '/admin/all',
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({ data: await Category.find({}).sort({ createdAt: -1 }) });
  })
);
router.post(
  '/',
  requireAdmin,
  uploadCategoryImage,
  asyncHandler(async (req, res) => {
    const data = categorySchema.parse({
      ...req.body,
      image: imageUrls(req.file ? [req.file] : [])[0] || req.body.image || '',
    });
    const category = await Category.create({
      ...data,
      slug: toSlug(data.slug || data.name),
    });
    await audit(req, 'create', 'category', category.id, {
      name: category.name,
    });
    res.status(201).json({ data: category });
  })
);
router.patch(
  '/:id',
  requireAdmin,
  uploadCategoryImage,
  asyncHandler(async (req, res) => {
    const data = categorySchema.partial().parse({
      ...req.body,
      ...(req.file ? { image: imageUrls([req.file])[0] } : {}),
    });
    if (data.slug || data.name) data.slug = toSlug(data.slug || data.name);
    const category = await Category.findByIdAndUpdate(req.params.id, data, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!category)
      return res.status(404).json({ message: 'الفئة غير موجودة.' });
    await audit(req, 'update', 'category', category.id, {
      name: category.name,
    });
    res.json({ data: category });
  })
);
router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (await Product.exists({ category: req.params.id }))
      return res.status(409).json({ message: 'لا يمكن حذف فئة تحتوي منتجات.' });
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category)
      return res.status(404).json({ message: 'الفئة غير موجودة.' });
    await audit(req, 'delete', 'category', category.id, {
      name: category.name,
    });
    res.status(204).end();
  })
);
export default router;
