import mongoose from 'mongoose';

const errorEventSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, maxlength: 1000 },
    path: { type: String, default: '', maxlength: 500 },
    method: { type: String, default: '', maxlength: 10 },
    statusCode: { type: Number, default: 500 },
    stack: { type: String, default: '', maxlength: 6000 },
  },
  { timestamps: true }
);
errorEventSchema.index({ createdAt: -1 });
export const ErrorEvent = mongoose.model('ErrorEvent', errorEventSchema);
