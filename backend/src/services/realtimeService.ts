import { Response } from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import { LakeAssessment } from '../types/index.js';

class RealtimeService {
  private sseClients: Set<Response> = new Set();
  private wsClients: Set<WebSocket> = new Set();

  registerSseClient(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    this.sseClients.add(res);

    // Initial heartbeat
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

    res.on('close', () => {
      this.sseClients.delete(res);
    });
  }

  registerWsClient(ws: WebSocket): void {
    this.wsClients.add(ws);

    ws.send(JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() }));

    ws.on('close', () => {
      this.wsClients.delete(ws);
    });

    ws.on('error', () => {
      this.wsClients.delete(ws);
    });
  }

  broadcastAssessment(assessment: LakeAssessment): void {
    const message = JSON.stringify({
      type: 'ASSESSMENT_UPDATE',
      payload: assessment,
      timestamp: new Date().toISOString(),
    });

    // Broadcast to SSE clients
    for (const client of this.sseClients) {
      try {
        client.write(`data: ${message}\n\n`);
      } catch {
        this.sseClients.delete(client);
      }
    }

    // Broadcast to WebSocket clients
    for (const client of this.wsClients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch {
          this.wsClients.delete(client);
        }
      }
    }
  }

  broadcastSosAlert(sosDetails: object): void {
    const message = JSON.stringify({
      type: 'SOS_TRIGGERED',
      payload: sosDetails,
      timestamp: new Date().toISOString(),
    });

    for (const client of this.sseClients) {
      try {
        client.write(`data: ${message}\n\n`);
      } catch {
        this.sseClients.delete(client);
      }
    }

    for (const client of this.wsClients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch {
          this.wsClients.delete(client);
        }
      }
    }
  }
}

export const realtimeService = new RealtimeService();
