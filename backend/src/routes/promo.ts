import express, { Request, Response } from 'express';
import { protect } from '../middleware/auth';
import { db } from '../config/postgres';

const router = express.Router();

// Validate a promo code (auth required)
// Body: { code: string, cartTotal: number }
// Returns: { valid, discountType, discountValue, discountAmount, finalTotal }
router.post('/validate', protect, async (req: Request, res: Response) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code || cartTotal === undefined) {
      return res.status(400).json({ success: false, error: 'code and cartTotal are required' });
    }

    const total = parseFloat(cartTotal);
    if (isNaN(total) || total <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid cartTotal' });
    }

    const result = await db.query(
      `SELECT id, code, discount_type, discount_value, max_uses, max_uses_per_customer, used_count, expires_at, is_active
       FROM promo_codes
       WHERE UPPER(code) = UPPER($1)`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, data: { valid: false, error: 'Invalid promo code' } });
    }

    const promo = result.rows[0];

    if (!promo.is_active) {
      return res.json({ success: true, data: { valid: false, error: 'This promo code is no longer active' } });
    }

    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return res.json({ success: true, data: { valid: false, error: 'This promo code has expired' } });
    }

    if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
      return res.json({ success: true, data: { valid: false, error: 'This promo code has reached its usage limit' } });
    }

    // Check per-customer usage limit
    if (promo.max_uses_per_customer !== null) {
      const userId = (req as any).user?.userId;
      if (userId) {
        const usageResult = await db.query(
          `SELECT COUNT(*) FROM promo_code_uses WHERE promo_code_id = $1 AND user_id = $2`,
          [promo.id, userId]
        );
        const timesUsed = parseInt(usageResult.rows[0].count, 10);
        if (timesUsed >= promo.max_uses_per_customer) {
          return res.json({ success: true, data: { valid: false, error: `You have already used this code ${promo.max_uses_per_customer} time(s)` } });
        }
      }
    }

    // Calculate discount
    let discountAmount: number;
    if (promo.discount_type === 'percent') {
      discountAmount = Math.round(total * parseFloat(promo.discount_value)) / 100;
    } else {
      discountAmount = Math.min(parseFloat(promo.discount_value), total);
    }
    const finalTotal = Math.max(0, total - discountAmount);

    return res.json({
      success: true,
      data: {
        valid: true,
        code: promo.code,
        discountType: promo.discount_type,
        discountValue: parseFloat(promo.discount_value),
        discountAmount: Math.round(discountAmount * 100) / 100,
        finalTotal: Math.round(finalTotal * 100) / 100,
      },
    });
  } catch (error: any) {
    console.error('Promo validate error:', error);
    res.status(500).json({ success: false, error: 'Failed to validate promo code' });
  }
});

export default router;
