import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';

const router = Router();

// GET /api/lakes
router.get('/', async (_req: Request, res: Response) => {
  try {
    const lakes = await db.getLakes();
    res.json(lakes);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/lakes/:lakeId
router.get('/:lakeId', async (req: Request, res: Response) => {
  try {
    const lake = await db.getLakeById(req.params.lakeId);
    if (!lake) {
      res.status(404).json({ error: 'Lake not found' });
      return;
    }
    res.json(lake);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
