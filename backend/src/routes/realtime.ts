import { Router, Request, Response } from 'express';
import { realtimeService } from '../services/realtimeService.js';

const router = Router();

// GET /api/realtime/stream
// SSE endpoint for lightweight, low-battery live alerts
router.get('/stream', (req: Request, res: Response) => {
  realtimeService.registerSseClient(res);
});

export default router;
