import { Router } from 'express';
import { z } from 'zod';
import { deliveryForRegion } from '../config/delivery.js';
import { requireAdmin } from '../middlewares/auth.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../utils/audit.js';

const router = Router();
const variantKey = (color = '', size = '') => `${color}::${size}`;
const discountedPrice = (price, discountPercent = 0) =>
  Math.round(price * (1 - discountPercent / 100) * 100) / 100;
const orderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    phone: z
      .string()
      .trim()
      .regex(
        /^05[69]\d{7}$/,
        'رقم الهاتف يجب أن يبدأ بـ 059 أو 056 ويتكون من 10 أرقام.'
      ),
    region: z.string().trim().min(2).max(100),
    notes: z
      .string()
      .trim()
      .min(2, 'يرجى كتابة موقع التسليم أو ملاحظات الطلب.')
      .max(1000),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(99),
        selectedSize: z.string().max(50).optional(),
        selectedColor: z.string().max(50).optional(),
      })
    )
    .min(1)
    .max(30),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { customer, items } = orderSchema.parse(req.body);
    const delivery = deliveryForRegion(customer.region);
    if (!delivery)
      return res.status(400).json({ message: 'منطقة التوصيل غير صالحة.' });
    const itemKeys = items.map(
      (item) =>
        `${item.productId}::${variantKey(item.selectedColor, item.selectedSize)}`
    );
    if (new Set(itemKeys).size !== itemKeys.length)
      return res
        .status(400)
        .json({ message: 'لا يمكن تكرار المنتج في الطلب.' });
    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await Product.find({
      _id: { $in: productIds },
      isPublished: true,
    });
    if (products.length !== productIds.length)
      return res.status(400).json({ message: 'أحد المنتجات غير متاح حاليًا.' });
    const byId = new Map(products.map((product) => [product.id, product]));
    const orderItems = [];
    for (const item of items) {
      const product = byId.get(item.productId);
      if (!product)
        return res
          .status(400)
          .json({ message: 'أحد المنتجات غير متاح حاليًا.' });
      const selection = {
        color: item.selectedColor || '',
        size: item.selectedSize || '',
      };
      const variant = product.variants?.length
        ? product.variants.find(
            (entry) =>
              variantKey(entry.color, entry.size) ===
              variantKey(selection.color, selection.size)
          )
        : null;
      const availableStock = variant ? variant.stock : product.stock;
      if (availableStock < item.quantity)
        return res.status(409).json({
          message: `الكمية المطلوبة غير متوفرة للمنتج: ${product?.name || ''}`,
        });
      if (item.selectedSize && !product.sizes.includes(item.selectedSize))
        return res
          .status(400)
          .json({ message: `المقاس المختار غير متاح للمنتج: ${product.name}` });
      if (item.selectedColor && !product.colors.includes(item.selectedColor))
        return res
          .status(400)
          .json({ message: `اللون المختار غير متاح للمنتج: ${product.name}` });
      if (product.variants?.length && !variant)
        return res.status(400).json({
          message: `هذه التركيبة من اللون والمقاس غير متاحة للمنتج: ${product.name}`,
        });
      const unitPrice = discountedPrice(product.price, product.discountPercent);
      orderItems.push({
        product: product.id,
        name: product.name,
        image: product.images[0] || '',
        quantity: item.quantity,
        unitPrice,
        originalUnitPrice: product.price,
        discountPercent: product.discountPercent || 0,
        lineTotal: unitPrice * item.quantity,
        selectedSize: item.selectedSize || '',
        selectedColor: item.selectedColor || '',
        hasVariant: Boolean(variant),
      });
    }
    const decremented = [];
    try {
      for (const item of orderItems) {
        const updated = item.hasVariant
          ? await Product.findOneAndUpdate(
              {
                _id: item.product,
                variants: {
                  $elemMatch: {
                    color: item.selectedColor,
                    size: item.selectedSize,
                    stock: { $gte: item.quantity },
                  },
                },
              },
              {
                $inc: {
                  stock: -item.quantity,
                  'variants.$.stock': -item.quantity,
                },
              },
              { returnDocument: 'after' }
            )
          : await Product.findOneAndUpdate(
              { _id: item.product, stock: { $gte: item.quantity } },
              { $inc: { stock: -item.quantity } },
              { returnDocument: 'after' }
            );
        if (!updated) {
          const error = new Error(`المخزون تغيّر للتو للمنتج: ${item.name}`);
          error.statusCode = 409;
          throw error;
        }
        decremented.push(item);
      }
      const subtotal = orderItems.reduce(
        (sum, item) => sum + item.lineTotal,
        0
      );
      const order = await Order.create({
        customer,
        items: orderItems,
        subtotal,
        deliveryFee: delivery.fee,
        total: subtotal + delivery.fee,
      });
      return res.status(201).json({ data: order });
    } catch (error) {
      await Promise.all(
        decremented.map((item) =>
          item.hasVariant
            ? Product.findByIdAndUpdate(
                item.product,
                {
                  $inc: {
                    stock: item.quantity,
                    'variants.$[variant].stock': item.quantity,
                  },
                },
                {
                  arrayFilters: [
                    {
                      'variant.color': item.selectedColor,
                      'variant.size': item.selectedSize,
                    },
                  ],
                }
              )
            : Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity },
              })
        )
      );
      throw error;
    }
  })
);
router.get(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const filter = req.query.status ? { status: req.query.status } : {};
    if (req.query.q) {
      const query = String(req.query.q).trim();
      filter.$or = [
        { 'customer.name': { $regex: query, $options: 'i' } },
        { 'customer.phone': { $regex: query, $options: 'i' } },
      ];
    }
    if (req.query.from || req.query.to) {
      filter.createdAt = {
        ...(req.query.from ? { $gte: new Date(req.query.from) } : {}),
        ...(req.query.to
          ? { $lte: new Date(`${req.query.to}T23:59:59.999Z`) }
          : {}),
      };
    }
    const [data, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ]);
    res.json({
      data,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  })
);
router.patch(
  '/:id/status',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status } = z
      .object({
        status: z.enum([
          'new',
          'confirmed',
          'preparing',
          'shipped',
          'completed',
          'cancelled',
        ]),
      })
      .parse(req.body);
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after' }
    );
    if (!order) return res.status(404).json({ message: 'الطلب غير موجود.' });
    await audit(req, 'update-status', 'order', order.id, { status });
    res.json({ data: order });
  })
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'الطلب غير موجود.' });

    // الحذف هنا يعني إلغاء الطلب؛ لذلك نعيد القطع المحجوزة إلى المخزون.
    await Promise.all(
      order.items.map(async (item) => {
        const hasSelection = item.selectedColor || item.selectedSize;
        if (!hasSelection)
          return Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
          });
        const restoredVariant = await Product.findOneAndUpdate(
          {
            _id: item.product,
            variants: {
              $elemMatch: {
                color: item.selectedColor || '',
                size: item.selectedSize || '',
              },
            },
          },
          { $inc: { stock: item.quantity, 'variants.$.stock': item.quantity } }
        );
        return (
          restoredVariant ||
          Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
          })
        );
      })
    );
    await order.deleteOne();
    await audit(req, 'delete', 'order', order.id, { total: order.total });
    res.json({ message: 'تم حذف الطلب وإعادة كمياته إلى المخزون.' });
  })
);
export default router;
