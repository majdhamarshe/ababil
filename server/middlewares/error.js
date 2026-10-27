export function notFound(req, res) {
  res
    .status(404)
    .json({ message: `المسار غير موجود: ${req.method} ${req.originalUrl}` });
}
export function errorHandler(error, req, res, next) {
  console.error(error);
  if ((error.statusCode || 500) >= 500 && process.env.NODE_ENV !== 'test')
    ErrorEvent.create({
      message: error.message || 'Unknown error',
      path: req.originalUrl,
      method: req.method,
      statusCode: error.statusCode || 500,
      stack: error.stack || '',
    }).catch(() => undefined);
  if (error.name === 'MulterError')
    return res
      .status(400)
      .json({ message: `خطأ في رفع الصور: ${error.message}` });
  if (error.name === 'ZodError')
    return res
      .status(400)
      .json({ message: 'بيانات غير صحيحة.', issues: error.issues });
  if (error.name === 'ValidationError')
    return res
      .status(400)
      .json({ message: 'بيانات غير صحيحة.', issues: error.errors });
  if (error.code === 11000)
    return res.status(409).json({ message: 'هذه القيمة مستخدمة مسبقًا.' });
  res
    .status(error.statusCode || 500)
    .json({ message: error.message || 'حدث خطأ غير متوقع.' });
}
import { ErrorEvent } from '../models/ErrorEvent.js';
