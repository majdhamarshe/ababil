import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../utils/audit.js';

const router = Router();
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+passwordHash'
    );
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res
        .status(401)
        .json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    await audit(req, 'login', 'admin', user.id, { email: user.email });
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  })
);
export default router;
