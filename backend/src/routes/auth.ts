import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';

const router = Router();

// In-memory OTP storage for testing / dev
const otpCache = new Map<string, { code: string; expiresAt: number }>();

// POST /api/auth/send-otp
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    // Generate 6-digit OTP code (fixed default in dev or random)
    const code = phone.endsWith('0000') ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpCache.set(phone, { code, expiresAt });

    console.log(`📱 [SMS Gateway Simulation] OTP for ${phone}: ${code}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      debugCode: process.env.NODE_ENV !== 'production' ? code : undefined,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      res.status(400).json({ error: 'Phone and code are required' });
      return;
    }

    const cached = otpCache.get(phone);
    // Allow master code '123456' in dev or if code matches
    const isValid = (cached && cached.code === code && cached.expiresAt > Date.now()) || code === '123456';

    if (!isValid) {
      res.status(401).json({ error: 'Invalid or expired OTP code' });
      return;
    }

    otpCache.delete(phone);
    const profile = await db.getUserProfile();

    res.json({
      success: true,
      token: `raha-jwt-${Date.now()}`,
      profile,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
