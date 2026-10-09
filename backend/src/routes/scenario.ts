import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { realtimeService } from '../services/realtimeService.js';
import { AlertLevel } from '../types/index.js';

const router = Router();

const VALID_LEVELS: AlertLevel[] = ['CLEAR', 'WATCH', 'WARNING', 'EVACUATE'];

// POST /api/scenario/set-level
router.post('/set-level', async (req: Request, res: Response) => {
  try {
    const { level } = req.body as { level: AlertLevel };
    if (!level || !VALID_LEVELS.includes(level)) {
      res.status(400).json({ error: `Invalid level. Must be one of: ${VALID_LEVELS.join(', ')}` });
      return;
    }

    const updatedAssessment = await db.setAssessmentLevel(level);

    // Live broadcast to all connected mobile clients
    realtimeService.broadcastAssessment(updatedAssessment);

    res.json(updatedAssessment);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
