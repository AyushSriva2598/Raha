import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { config } from '../config/index.js';
import { realtimeService } from '../services/realtimeService.js';
import { AssessmentSyncPayload } from '../types/index.js';

const router = Router();

// POST /api/internal/assessment-sync
// Authenticated webhook endpoint called by AWS Step Functions / SageMaker Lambda
router.post('/assessment-sync', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['x-api-secret'] || req.headers['authorization'];
    if (!authHeader || (authHeader !== config.awsWebhookSecret && authHeader !== `Bearer ${config.awsWebhookSecret}`)) {
      res.status(401).json({ error: 'Unauthorized: Invalid x-api-secret' });
      return;
    }

    const payload: AssessmentSyncPayload = req.body;
    if (!payload.lakeId || !payload.level || !payload.headline) {
      res.status(400).json({ error: 'lakeId, level, and headline are required in sync payload' });
      return;
    }

    // Persist assessment into database / memory
    const updated = await db.syncAssessmentFromAws({
      lakeId: payload.lakeId,
      level: payload.level,
      headline: payload.headline,
      instruction: payload.instruction,
      arrivalWindow: payload.arrivalWindow,
      outflowRateM3s: payload.outflowRateM3s ?? 0,
      lakeAreaChangePct: payload.lakeAreaChangePct ?? 0,
      sarBackscatterChangeDb: payload.sarBackscatterChangeDb ?? 0,
      tempAnomalyCelsius: payload.tempAnomalyCelsius ?? 0,
      contributingFactors: payload.contributingFactors ?? [],
      modelVersion: payload.modelVersion ?? 'sagemaker-chronos-live',
      authorityBroadcastCode: payload.authorityBroadcastCode,
    });

    // Instantly notify connected mobile clients via WebSockets and SSE
    realtimeService.broadcastAssessment(updated);

    console.log(`📡 [AWS Bridge Sync] Lake ${payload.lakeId} alert updated to ${payload.level}`);

    res.json({
      success: true,
      syncedAt: new Date().toISOString(),
      assessment: updated,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
