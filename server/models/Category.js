import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },
    icon: { type: String, default: '✦', maxlength: 20 },
    image: { type: String, default: '' },
    description: { type: String, default: '', maxlength: 200 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

categorySchema.virtual('countLabel').get(function countLabel() {
  return this.description || 'اكتشف المجموعة';
});
export const Category = mongoose.model('Category', categorySchema);
