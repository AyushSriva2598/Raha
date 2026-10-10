import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';

const router = Router();

// In-memory OTP storage for phone testing
const otpCache = new Map<string, { code: string; expiresAt: number }>();

// GET /api/auth/users (Returns test accounts for instant demo testing)
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      homeZoneId,
      role,
      homeLocationName,
      latitude,
      longitude,
      elevationM,
      initialContact,
    } = req.body;
    if (!name || !phone) {
      res.status(400).json({ error: 'Name and phone number are required' });
      return;
    }

    const result = await db.registerUser({
      name,
      phone,
      email,
      password,
      homeZoneId,
      role,
      homeLocationName,
      latitude,
      longitude,
      elevationM,
      initialContact,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      ...result,
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, phone, email, password } = req.body;
    const loginId = identifier || phone || email;

    if (!loginId) {
      res.status(400).json({ error: 'Phone number or email is required' });
      return;
    }

    const result = await db.loginUser(loginId, password);
    res.json({
      success: true,
      message: 'Login successful',
      ...result,
    });
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
});

// POST /api/auth/send-otp
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    // Fixed master code '123456' for instant testing or random
    const code = phone.endsWith('0000') || phone.includes('9841') ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    otpCache.set(phone, { code, expiresAt });

    console.log(`📱 [SMS Gateway OTP] Dispatched code for ${phone}: ${code}`);

    res.json({
      success: true,
      message: `OTP sent to ${phone}`,
      testCode: code, // Convenient for user testing in dev mode
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
      res.status(400).json({ error: 'Phone and OTP code are required' });
      return;
    }

    const cached = otpCache.get(phone);
    const isValid = (cached && cached.code === code && cached.expiresAt > Date.now()) || code === '123456';

    if (!isValid) {
      res.status(401).json({ error: 'Invalid or expired OTP code' });
      return;
    }

    otpCache.delete(phone);

    // Find or login user
    let user = await db.findUserByIdentifier(phone);
    if (!user) {
      // Auto-register new phone user
      const registered = await db.registerUser({
        name: `Resident (${phone.slice(-4)})`,
        phone,
      });
      user = registered.user;
    }

    const result = await db.loginUser(phone);

    res.json({
      success: true,
      message: 'Phone verified successfully',
      ...result,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/auth/me
router.get('/me', async (_req: Request, res: Response) => {
  try {
    const profile = await db.getUserProfile();
    res.json({
      authenticated: true,
      profile,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
