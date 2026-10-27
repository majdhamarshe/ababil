import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    originalUnitPrice: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    selectedSize: { type: String, default: '' },
    selectedColor: { type: String, default: '' },
  },
  { _id: false }
);
const orderSchema = new mongoose.Schema(
  {
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      region: { type: String, required: true, trim: true },
      notes: { type: String, default: '', trim: true, maxlength: 1000 },
    },
    items: {
      type: [orderItemSchema],
      validate: [(items) => items.length > 0, 'الطلب فارغ'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        'new',
        'confirmed',
        'preparing',
        'shipped',
        'completed',
        'cancelled',
      ],
      default: 'new',
    },
  },
  { timestamps: true }
);
export const Order = mongoose.model('Order', orderSchema);
