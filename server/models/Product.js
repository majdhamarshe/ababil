import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 180,
    },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    price: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },
    images: { type: [String], default: [] },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    colorImages: {
      type: [
        {
          color: { type: String, required: true, maxlength: 50 },
          image: { type: String, required: true },
        },
      ],
      default: [],
    },
    variants: {
      type: [
        {
          color: { type: String, default: '', maxlength: 50 },
          size: { type: String, default: '', maxlength: 50 },
          stock: { type: Number, required: true, min: 0 },
        },
      ],
      default: [],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    stock: { type: Number, required: true, min: 0, default: 0 },
    isPublished: { type: Boolean, default: false, index: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isPublished: 1, createdAt: -1 });
export const Product = mongoose.model('Product', productSchema);
