import jwt from 'jsonwebtoken';
export function requireAdmin(req, res, next) {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'يلزم تسجيل الدخول.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'owner')
      return res.status(403).json({ message: 'لا تملك هذه الصلاحية.' });
    req.user = payload;
    return next();
  } catch {
    return res
      .status(401)
      .json({ message: 'جلسة الدخول غير صالحة أو منتهية.' });
  }
}
