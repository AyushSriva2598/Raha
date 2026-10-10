import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { realtimeService } from '../services/realtimeService.js';
import { SosBroadcastPayload } from '../types/index.js';

const router = Router();

// POST /api/alerts/sos-broadcast (Triggers real SOS dispatch to kin contacts)
router.post('/sos-broadcast', async (req: Request, res: Response) => {
  try {
    const payload: SosBroadcastPayload = req.body;
    if (!payload.recipientContactIds || !Array.isArray(payload.recipientContactIds)) {
      res.status(400).json({ error: 'recipientContactIds array is required' });
      return;
    }

    const response = await db.recordSosBroadcast(payload);

    // Notify connected web dashboards and emergency operators in real time
    realtimeService.broadcastSosAlert({
      ...payload,
      ...response,
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/alerts/sos-history (Returns audit logs of live SMS dispatches)
router.get('/sos-history', async (_req: Request, res: Response) => {
  try {
    const history = db.getSosHistory();
    res.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
