import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { AlertLevel } from '../types/index.js';

const router = Router();

// GET /api/events?level=...
router.get('/', async (req: Request, res: Response) => {
  try {
    const level = req.query.level as AlertLevel | undefined;
    const events = await db.getEventLogs(level);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
