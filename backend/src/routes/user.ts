import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';

const router = Router();

// GET /api/user/profile
router.get('/profile', async (_req: Request, res: Response) => {
  try {
    const profile = await db.getUserProfile();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PATCH /api/user/profile
router.patch('/profile', async (req: Request, res: Response) => {
  try {
    const updated = await db.updateUserProfile(req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/user/contacts
router.post('/contacts', async (req: Request, res: Response) => {
  try {
    const { name, relation, phone, isActive = true, notifyOnRisk = true } = req.body;
    if (!name || !phone || !relation) {
      res.status(400).json({ error: 'Name, phone, and relation are required' });
      return;
    }
    const newContact = await db.addContact({ name, relation, phone, isActive, notifyOnRisk });
    res.status(201).json(newContact);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PATCH /api/user/contacts/:contactId
router.patch('/contacts/:contactId', async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      res.status(400).json({ error: 'isActive boolean flag is required' });
      return;
    }
    const updated = await db.toggleContact(contactId, isActive);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// DELETE /api/user/contacts/:contactId
router.delete('/contacts/:contactId', async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;
    const success = await db.deleteContact(contactId);
    if (!success) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }
    res.json({ success: true, contactId });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
