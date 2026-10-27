import { Router } from 'express';
import { z } from 'zod';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Order } from '../models/Order.js';
import { RestockRequest } from '../models/RestockRequest.js';
import { requireAdmin } from '../middlewares/auth.js';
import { imageUrls, uploadImages } from '../middlewares/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toSlug } from '../utils/slug.js';
import { audit } from '../utils/audit.js';

const router = Router();
const bool = z.union([
  z.boolean(),
  z.enum(['true', 'false']).transform((value) => value === 'true'),
]);
const productSchema = z.object({
  name: z.string().min(2).max(150),
  slug: z.string().max(180).optional(),
  description: z.string().min(5).max(4000),
  price: z.coerce.number().nonnegative(),
  discountPercent: z.coerce.number().min(0).max(100).optional().default(0),
  category: z.string().min(1),
  stock: z.coerce.number().int().nonnegative(),
  sizes: z.array(z.string().min(1).max(50)).default([]),
  colors: z.array(z.string().min(1).max(50)).default([]),
  colorImages: z
    .array(
      z.object({
        color: z.string().min(1).max(50),
        image: z.string().min(1).max(500),
      })
    )
    .default([]),
  variants: z
    .array(
      z.object({
        color: z.string().max(50).optional().default(''),
        size: z.string().max(50).optional().default(''),
        stock: z.coerce.number().int().nonnegative(),
      })
    )
    .default([]),
  images: z.array(z.string().min(1)).default([]),
  isPublished: bool.optional().default(false),
  featured: bool.optional().default(false),
});
const parseArray = (value) =>
  !value ? [] : Array.isArray(value) ? value : JSON.parse(value);
const variantKey = (color = '', size = '') => `${color}::${size}`;
function validateAndCalculateVariants(data) {
  if (!data.variants.length) return data;

  const seen = new Set();
  for (const variant of data.variants) {
    const key = variantKey(variant.color, variant.size);
    if (seen.has(key)) {
      const error = new Error('لا يمكن تكرار نفس تركيبة اللون والمقاس.');
      error.statusCode = 400;
      throw error;
    }
    seen.add(key);
    if (data.colors.length && !data.colors.includes(variant.color)) {
      const error = new Error('يوجد لون غير موجود ضمن ألوان المنتج.');
      error.statusCode = 400;
      throw error;
    }
    if (data.sizes.length && !data.sizes.includes(variant.size)) {
      const error = new Error('يوجد مقاس غير موجود ضمن مقاسات المنتج.');
      error.statusCode = 400;
      throw error;
    }
  }

  data.stock = data.variants.reduce(
    (total, variant) => total + variant.stock,
    0
  );
  return data;
}
const sortMap = {
  newest: { createdAt: -1 },
  'price-low': { price: 1 },
  'price-high': { price: -1 },
  oldest: { createdAt: 1 },
  featured: { featured: -1, createdAt: -1 },
};
const populate = { path: 'category', select: 'name slug icon description' };
async function parseProductBody(body, files, base = {}) {
  const mainFiles = Array.isArray(files) ? files : files?.images || [];
  const uploadedColorImages = Array.isArray(files)
    ? []
    : files?.colorImages || [];
  const colorImageColors =
    body.colorImageColors === undefined
      ? []
      : parseArray(body.colorImageColors);
  const [uploadedMainImages, uploadedColorUrls] = await Promise.all([
    imageUrls(mainFiles),
    imageUrls(uploadedColorImages),
  ]);
  const data = {
    ...base,
    ...body,
    sizes: body.sizes === undefined ? base.sizes : parseArray(body.sizes),
    colors: body.colors === undefined ? base.colors : parseArray(body.colors),
    colorImages: [
      ...(body.colorImages === undefined
        ? base.colorImages || []
        : parseArray(body.colorImages)),
      ...uploadedColorImages
        .map((file, index) => ({
          color: colorImageColors[index] || '',
          image: uploadedColorUrls[index],
        }))
        .filter((item) => item.color),
    ],
    variants:
      body.variants === undefined ? base.variants : parseArray(body.variants),
    images: [
      ...(body.images === undefined
        ? base.images || []
        : parseArray(body.images)),
      ...uploadedMainImages,
    ],
  };
  return validateAndCalculateVariants(productSchema.parse(data));
}
const adminQuery = (query) => {
  const filter = {};
  if (query.q) filter.$text = { $search: String(query.q).trim() };
  if (query.category) filter.category = query.category;
  if (query.published === 'true') filter.isPublished = true;
  if (query.published === 'false') filter.isPublished = false;
  if (query.lowStock === 'true')
    filter.$or = [{ stock: { $lte: 5 } }, { 'variants.stock': { $lte: 5 } }];
  return filter;
};
router.get(
  '/admin/all',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const filter = adminQuery(req.query);
    const [data, total] = await Promise.all([
      Product.find(filter)
        .populate(populate)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);
    res.json({
      data,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  })
);
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
    const filter = { isPublished: true };
    if (req.query.category) {
      const category = await Category.findOne({
        slug: req.query.category,
        isActive: true,
      }).select('_id');
      if (!category)
        return res.json({
          data: [],
          meta: { page, limit, total: 0, pages: 0 },
        });
      filter.category = category.id;
    }
    if (req.query.featured === 'true') filter.featured = true;
    if (req.query.inStock === 'true') filter.stock = { $gt: 0 };
    if (req.query.discounted === 'true') filter.discountPercent = { $gt: 0 };
    if (req.query.color) filter.colors = String(req.query.color);
    if (req.query.size) filter.sizes = String(req.query.size);
    if (req.query.minPrice || req.query.maxPrice)
      filter.price = {
        ...(req.query.minPrice ? { $gte: Number(req.query.minPrice) } : {}),
        ...(req.query.maxPrice ? { $lte: Number(req.query.maxPrice) } : {}),
      };
    if (req.query.q) filter.$text = { $search: String(req.query.q).trim() };
    const [data, total] = await Promise.all([
      Product.find(filter)
        .populate(populate)
        .sort(sortMap[req.query.sort] || sortMap.newest)
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);
    res.json({
      data,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  })
);
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({
      slug: req.params.slug,
      isPublished: true,
    }).populate(populate);
    if (!product) return res.status(404).json({ message: 'المنتج غير موجود.' });
    res.json({ data: product });
  })
);
router.post(
  '/',
  requireAdmin,
  uploadImages,
  asyncHandler(async (req, res) => {
    const data = await parseProductBody(req.body, req.files);
    const product = await Product.create({
      ...data,
      slug: toSlug(data.slug || data.name),
    });
    await audit(req, 'create', 'product', product.id, { name: product.name });
    await product.populate(populate);
    res.status(201).json({ data: product });
  })
);
router.patch(
  '/:id',
  requireAdmin,
  uploadImages,
  asyncHandler(async (req, res) => {
    const current = await Product.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'المنتج غير موجود.' });
    const currentData = {
      ...current.toObject(),
      category: String(current.category),
    };
    const data = await parseProductBody(req.body, req.files, currentData);
    if (req.body.slug || req.body.name)
      data.slug = toSlug(req.body.slug || req.body.name);
    const product = await Product.findByIdAndUpdate(req.params.id, data, {
      returnDocument: 'after',
      runValidators: true,
    }).populate(populate);
    if (product.stock > 0)
      await RestockRequest.updateMany(
        { product: product.id, status: 'waiting' },
        { status: 'ready' }
      );
    await audit(req, 'update', 'product', product.id, { name: product.name });
    res.json({ data: product });
  })
);
router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (await Order.exists({ 'items.product': req.params.id }))
      return res
        .status(409)
        .json({ message: 'لا يمكن حذف منتج مرتبط بطلبات محفوظة.' });
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'المنتج غير موجود.' });
    await audit(req, 'delete', 'product', product.id, { name: product.name });
    res.status(204).end();
  })
);
export default router;
