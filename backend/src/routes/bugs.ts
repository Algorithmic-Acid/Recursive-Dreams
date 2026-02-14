import { Router, Request, Response } from 'express';
import { db } from '../config/postgres';
import jwt from 'jsonwebtoken';

const router = Router();

// POST /api/bugs — submit a bug report (public, optionally authenticated)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, pageUrl, severity = 'medium' } = req.body;

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, error: 'Title and description are required' });
    }

    if (!['low', 'medium', 'high'].includes(severity)) {
      return res.status(400).json({ success: false, error: 'Invalid severity' });
    }

    // Optionally extract user info from JWT if present
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userName: string | null = null;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        userId = decoded.userId;
        const userResult = await db.query('SELECT email, name FROM users WHERE id = $1', [userId]);
        if (userResult.rows[0]) {
          userEmail = userResult.rows[0].email;
          userName = userResult.rows[0].name;
        }
      } catch {
        // Token invalid — treat as guest
      }
    }

    await db.query(
      `INSERT INTO bug_reports (user_id, user_email, user_name, title, description, page_url, severity)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, userEmail, userName, title.trim(), description.trim(), pageUrl?.trim() || null, severity]
    );

    res.json({ success: true, message: 'Bug report submitted. Thank you!' });
  } catch (err) {
    console.error('Bug report error:', err);
    res.status(500).json({ success: false, error: 'Failed to submit bug report' });
  }
});

export default router;
