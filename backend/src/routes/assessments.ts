import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { AlertLevel } from '../types/index.js';

const router = Router();

// GET /api/assessments/active?zoneId=...
router.get('/active', async (req: Request, res: Response) => {
  try {
    const zoneId = req.query.zoneId as string | undefined;
    const assessment = await db.getActiveAssessment(zoneId);
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
