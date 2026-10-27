import mongoose from 'mongoose';

const restockRequestSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    phone: { type: String, required: true, trim: true, match: /^05[69]\d{7}$/ },
    color: { type: String, default: '', maxlength: 50 },
    size: { type: String, default: '', maxlength: 50 },
    status: {
      type: String,
      enum: ['waiting', 'ready', 'closed'],
      default: 'waiting',
      index: true,
    },
  },
  { timestamps: true }
);
restockRequestSchema.index(
  { product: 1, phone: 1, color: 1, size: 1 },
  { unique: true }
);
export const RestockRequest = mongoose.model(
  'RestockRequest',
  restockRequestSchema
);
