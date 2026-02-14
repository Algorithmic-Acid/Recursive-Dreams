import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { body, validationResult } from 'express-validator';
import https from 'https';
import ProductRepository from '../repositories/ProductRepository';
import { protect, admin } from '../middleware/auth';
import { ApiResponse } from '../types';
import { db } from '../config/postgres';
import dotenv from 'dotenv';

// Ensure env vars are loaded
dotenv.config();

// Helper: fetch JSON from URL
const fetchJSON = (url: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid JSON response')); }
      });
    }).on('error', reject);
  });
};

const router = express.Router();

// Initialize Stripe - log for debugging
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('WARNING: STRIPE_SECRET_KEY is not set!');
}
const stripe = new Stripe(stripeSecretKey || '');

// Create payment intent
router.post(
  '/create-intent',
  protect,
  [
    body('items').isArray({ min: 1 }).withMessage('Items are required'),
    body('items.*.productId').notEmpty().withMessage('Product ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: errors.array()[0].msg,
        };
        return res.status(400).json(response);
      }

      const { items, promoCode } = req.body;

      // Calculate total from actual product prices (prevent client-side manipulation)
      let total = 0;
      const lineItems: { name: string; quantity: number; price: number }[] = [];

      for (const item of items) {
        const product = await ProductRepository.findById(item.productId);

        if (!product) {
          const response: ApiResponse = {
            success: false,
            error: `Product not found: ${item.productId}`,
          };
          return res.status(404).json(response);
        }

        // Use variant price if provided, otherwise use product price
        const price = item.variantPrice || product.price;
        const itemTotal = price * item.quantity;
        total += itemTotal;

        lineItems.push({
          name: product.name + (item.variantName ? ` (${item.variantName})` : ''),
          quantity: item.quantity,
          price: price,
        });
      }

      // Apply promo code server-side if provided
      let discountAmount = 0;
      let validatedPromoCode: string | null = null;
      if (promoCode) {
        const promoResult = await db.query(
          `SELECT id, code, discount_type, discount_value, max_uses, max_uses_per_customer, used_count, expires_at, is_active
           FROM promo_codes WHERE UPPER(code) = UPPER($1)`,
          [promoCode]
        );
        if (promoResult.rows.length > 0) {
          const promo = promoResult.rows[0];
          let perCustomerOk = true;
          if (promo.max_uses_per_customer !== null) {
            const usageResult = await db.query(
              `SELECT COUNT(*) FROM promo_code_uses WHERE promo_code_id = $1 AND user_id = $2`,
              [promo.id, req.user!.userId]
            );
            const timesUsed = parseInt(usageResult.rows[0].count, 10);
            perCustomerOk = timesUsed < promo.max_uses_per_customer;
          }
          const isValid = promo.is_active &&
            (!promo.expires_at || new Date(promo.expires_at) >= new Date()) &&
            (promo.max_uses === null || promo.used_count < promo.max_uses) &&
            perCustomerOk;

          if (isValid) {
            if (promo.discount_type === 'percent') {
              discountAmount = Math.round(total * parseFloat(promo.discount_value)) / 100;
            } else {
              discountAmount = Math.min(parseFloat(promo.discount_value), total);
            }
            total = Math.max(0, total - discountAmount);
            validatedPromoCode = promo.code;
          }
        }
      }

      // Stripe expects amount in cents
      const amountInCents = Math.round(total * 100);

      // Create PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: req.user!.userId,
          items: JSON.stringify(lineItems),
          ...(validatedPromoCode ? { promoCode: validatedPromoCode } : {}),
        },
      });

      const response: ApiResponse = {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: total,
          discountAmount,
        },
      };

      res.json(response);
    } catch (error: any) {
      console.error('Create payment intent error:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Failed to create payment intent',
      };
      res.status(500).json(response);
    }
  }
);

// Confirm payment was successful (called after Stripe confirms on frontend)
router.post(
  '/confirm',
  protect,
  [
    body('paymentIntentId').notEmpty().withMessage('Payment Intent ID is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: errors.array()[0].msg,
        };
        return res.status(400).json(response);
      }

      const { paymentIntentId } = req.body;

      // Verify payment status with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        const response: ApiResponse = {
          success: false,
          error: `Payment not successful. Status: ${paymentIntent.status}`,
        };
        return res.status(400).json(response);
      }

      // Mark promo code as used (if one was applied)
      const usedPromoCode = paymentIntent.metadata?.promoCode;
      if (usedPromoCode) {
        await db.query(
          `UPDATE promo_codes SET used_count = used_count + 1 WHERE UPPER(code) = UPPER($1)`,
          [usedPromoCode]
        ).catch(err => console.error('Failed to increment promo used_count:', err));

        // Record per-customer usage
        const promoRow = await db.query(
          `SELECT id FROM promo_codes WHERE UPPER(code) = UPPER($1)`,
          [usedPromoCode]
        ).catch(() => null);
        if (promoRow && promoRow.rows.length > 0) {
          await db.query(
            `INSERT INTO promo_code_uses (promo_code_id, user_id) VALUES ($1, $2)`,
            [promoRow.rows[0].id, req.user!.userId]
          ).catch(err => console.error('Failed to record promo use:', err));
        }
      }

      const response: ApiResponse = {
        success: true,
        data: {
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
        },
        message: 'Payment confirmed',
      };

      res.json(response);
    } catch (error: any) {
      console.error('Confirm payment error:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Failed to confirm payment',
      };
      res.status(500).json(response);
    }
  }
);

// Get Stripe publishable key (public endpoint)
router.get('/config', (_req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    },
  };
  res.json(response);
});

// Create donation payment intent (no authentication required)
router.post(
  '/donate',
  [
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least $1'),
    body('donorName').optional().isString().withMessage('Donor name must be a string'),
    body('donorEmail').optional().isEmail().withMessage('Invalid email'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: errors.array()[0].msg,
        };
        return res.status(400).json(response);
      }

      const { amount, donorName, donorEmail } = req.body;

      // Stripe expects amount in cents
      const amountInCents = Math.round(amount * 100);

      // Create PaymentIntent for donation
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          type: 'donation',
          donorName: donorName || 'Anonymous',
          donorEmail: donorEmail || '',
        },
        description: `Void Vendor Donation - ${donorName || 'Anonymous'}`,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: amount,
        },
      };

      res.json(response);
    } catch (error: any) {
      console.error('Create donation intent error:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Failed to create donation payment',
      };
      res.status(500).json(response);
    }
  }
);

// Log successful donation (called after payment succeeds)
router.post(
  '/donate/confirm',
  [
    body('paymentIntentId').notEmpty().withMessage('Payment Intent ID is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: errors.array()[0].msg,
        };
        return res.status(400).json(response);
      }

      const { paymentIntentId } = req.body;

      // Verify payment status with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        const response: ApiResponse = {
          success: false,
          error: `Payment not successful. Status: ${paymentIntent.status}`,
        };
        return res.status(400).json(response);
      }

      // Log donation to database (optional - can track donations)
      const donorName = paymentIntent.metadata.donorName || 'Anonymous';
      const amount = paymentIntent.amount / 100;

      console.log(`💝 Donation received: $${amount} from ${donorName}`);

      // Optional: Store in donations table if you create one
      // await db.query('INSERT INTO donations (amount, donor_name, donor_email, payment_intent_id) VALUES ($1, $2, $3, $4)',
      //   [amount, donorName, paymentIntent.metadata.donorEmail, paymentIntentId]);

      const response: ApiResponse = {
        success: true,
        data: {
          status: paymentIntent.status,
          amount: amount,
        },
        message: 'Thank you for your donation!',
      };

      res.json(response);
    } catch (error: any) {
      console.error('Confirm donation error:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Failed to confirm donation',
      };
      res.status(500).json(response);
    }
  }
);

// ============================================
// CRYPTO PAYMENT VERIFICATION
// ============================================

const BTC_ADDRESS = 'bc1qce33yheyq24l7x90zer5q866nx6tyx2j5atp2y';
const XMR_ADDRESS = '84SyqhuxFyg7n4VEvuRq6P1CjUVXYgSca6s9oB6RAmnL4qwNRk3YVQJNKF5WZtcQDjBHFEfv6t6NBYqHzcYuVsNEBkqUiVE';

// Create a pending crypto payment (order stays unpaid until verified)
router.post(
  '/crypto/create',
  protect,
  [
    body('items').isArray({ min: 1 }).withMessage('Items are required'),
    body('items.*.productId').notEmpty().withMessage('Product ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('cryptoType').isIn(['xmr', 'btc']).withMessage('Invalid crypto type'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: errors.array()[0].msg });
      }

      const { items, cryptoType, shippingAddress } = req.body;
      const userId = req.user!.userId;

      // Calculate total from actual product prices
      let total = 0;
      for (const item of items) {
        const product = await ProductRepository.findById(item.productId);
        if (!product) {
          return res.status(404).json({ success: false, error: `Product not found: ${item.productId}` });
        }
        total += product.price * item.quantity;
      }

      // Create the order with pending payment status
      const orderResult = await db.query(`
        INSERT INTO orders (user_id, total, payment_method, payment_status, status, shipping_address)
        VALUES ($1, $2, $3, 'pending', 'pending', $4)
        RETURNING id
      `, [userId, total, cryptoType, JSON.stringify(shippingAddress || {})]);

      const orderId = orderResult.rows[0].id;

      // Create order items
      for (const item of items) {
        const product = await ProductRepository.findById(item.productId);
        if (product) {
          await db.query(`
            INSERT INTO order_items (order_id, product_id, quantity, price)
            VALUES ($1, $2, $3, $4)
          `, [orderId, item.productId, item.quantity, product.price]);
        }
      }

      // Create crypto payment record (expires in 2 hours)
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const walletAddress = cryptoType === 'btc' ? BTC_ADDRESS : XMR_ADDRESS;

      const cryptoResult = await db.query(`
        INSERT INTO crypto_payments (order_id, user_id, crypto_type, amount_usd, wallet_address, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, crypto_type, amount_usd, wallet_address, status, expires_at
      `, [orderId, userId, cryptoType, total, walletAddress, expiresAt]);

      const cryptoPayment = cryptoResult.rows[0];

      res.status(201).json({
        success: true,
        data: {
          orderId,
          paymentId: cryptoPayment.id,
          cryptoType: cryptoPayment.crypto_type,
          amountUSD: parseFloat(cryptoPayment.amount_usd),
          walletAddress: cryptoPayment.wallet_address,
          status: cryptoPayment.status,
          expiresAt: cryptoPayment.expires_at,
        },
        message: `Send ${cryptoType.toUpperCase()} to the wallet address. Submit your TX hash after sending.`,
      });
    } catch (error: any) {
      console.error('Create crypto payment error:', error);
      res.status(500).json({ success: false, error: 'Failed to create crypto payment' });
    }
  }
);

// Submit TX hash for a crypto payment
router.post(
  '/crypto/submit-tx',
  protect,
  [
    body('paymentId').notEmpty().withMessage('Payment ID is required'),
    body('txHash').notEmpty().withMessage('Transaction hash is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: errors.array()[0].msg });
      }

      const { paymentId, txHash } = req.body;
      const userId = req.user!.userId;

      // Get the payment record
      const result = await db.query(`
        SELECT * FROM crypto_payments
        WHERE id = $1 AND user_id = $2 AND status = 'pending'
      `, [paymentId, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Payment not found or already processed' });
      }

      const payment = result.rows[0];

      // Check if expired
      if (new Date(payment.expires_at) < new Date()) {
        await db.query(`UPDATE crypto_payments SET status = 'expired' WHERE id = $1`, [paymentId]);
        return res.status(400).json({ success: false, error: 'Payment has expired. Please create a new order.' });
      }

      // Update payment with TX hash and set to confirming
      await db.query(`
        UPDATE crypto_payments
        SET tx_hash = $1, status = 'confirming', updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [txHash.trim(), paymentId]);

      // For BTC, try to verify via blockstream API
      if (payment.crypto_type === 'btc') {
        try {
          const txData = await fetchJSON(`https://blockstream.info/api/tx/${txHash.trim()}`);
          if (txData && txData.status) {
            const confirmed = txData.status.confirmed;
            const confirmations = confirmed ? (txData.status.block_height ? 1 : 0) : 0;

            // Check if any output goes to our address
            const sentToUs = txData.vout?.some((out: any) =>
              out.scriptpubkey_address === BTC_ADDRESS
            );

            if (sentToUs && confirmed) {
              // Payment verified on-chain
              await db.query(`
                UPDATE crypto_payments
                SET status = 'confirmed', confirmations = $1, confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
              `, [confirmations, paymentId]);

              // Mark order as paid
              await db.query(`
                UPDATE orders SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
              `, [payment.order_id]);

              return res.json({
                success: true,
                data: { status: 'confirmed', confirmations },
                message: 'Payment confirmed! Your downloads are now available.',
              });
            }
          }
        } catch (err) {
          console.error('BTC verification API error:', err);
          // Fall through to confirming status
        }
      }

      // For XMR or if BTC check hasn't confirmed yet
      res.json({
        success: true,
        data: { status: 'confirming', txHash: txHash.trim() },
        message: 'TX hash submitted. Your payment is being verified. This may take a few minutes for confirmations.',
      });
    } catch (error: any) {
      console.error('Submit TX error:', error);
      res.status(500).json({ success: false, error: 'Failed to submit transaction' });
    }
  }
);

// Check crypto payment status (user polls this)
router.get('/crypto/status/:paymentId', protect, async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user!.userId;

    const result = await db.query(`
      SELECT cp.*, o.payment_status as order_payment_status
      FROM crypto_payments cp
      JOIN orders o ON o.id = cp.order_id
      WHERE cp.id = $1 AND cp.user_id = $2
    `, [paymentId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    const payment = result.rows[0];

    // If payment is confirming and BTC, try to verify again
    if (payment.status === 'confirming' && payment.crypto_type === 'btc' && payment.tx_hash) {
      try {
        const txData = await fetchJSON(`https://blockstream.info/api/tx/${payment.tx_hash}`);
        if (txData && txData.status?.confirmed) {
          const sentToUs = txData.vout?.some((out: any) =>
            out.scriptpubkey_address === BTC_ADDRESS
          );

          if (sentToUs) {
            await db.query(`
              UPDATE crypto_payments
              SET status = 'confirmed', confirmations = 1, confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
              WHERE id = $1
            `, [paymentId]);

            await db.query(`
              UPDATE orders SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP
              WHERE id = $1
            `, [payment.order_id]);

            return res.json({
              success: true,
              data: {
                status: 'confirmed',
                cryptoType: payment.crypto_type,
                amountUSD: parseFloat(payment.amount_usd),
                txHash: payment.tx_hash,
                orderId: payment.order_id,
              },
            });
          }
        }
      } catch (err) {
        // API error, return current status
      }
    }

    res.json({
      success: true,
      data: {
        status: payment.status,
        cryptoType: payment.crypto_type,
        amountUSD: parseFloat(payment.amount_usd),
        txHash: payment.tx_hash,
        orderId: payment.order_id,
        expiresAt: payment.expires_at,
        orderPaid: payment.order_payment_status === 'paid',
      },
    });
  } catch (error: any) {
    console.error('Check crypto status error:', error);
    res.status(500).json({ success: false, error: 'Failed to check payment status' });
  }
});

// Admin: manually confirm a crypto payment
router.post('/crypto/admin-confirm/:paymentId', protect, admin, async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    const result = await db.query(`
      SELECT * FROM crypto_payments WHERE id = $1
    `, [paymentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    const payment = result.rows[0];

    // Mark as confirmed
    await db.query(`
      UPDATE crypto_payments
      SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [paymentId]);

    // Mark order as paid
    await db.query(`
      UPDATE orders SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [payment.order_id]);

    res.json({
      success: true,
      message: 'Payment manually confirmed. User can now download their products.',
    });
  } catch (error: any) {
    console.error('Admin confirm error:', error);
    res.status(500).json({ success: false, error: 'Failed to confirm payment' });
  }
});

// Admin: get all pending crypto payments
router.get('/crypto/pending', protect, admin, async (_req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT
        cp.*,
        u.name as user_name,
        u.email as user_email,
        o.total as order_total
      FROM crypto_payments cp
      JOIN users u ON u.id = cp.user_id
      JOIN orders o ON o.id = cp.order_id
      WHERE cp.status IN ('pending', 'confirming')
      ORDER BY cp.created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        orderId: row.order_id,
        userName: row.user_name,
        userEmail: row.user_email,
        cryptoType: row.crypto_type,
        amountUSD: parseFloat(row.amount_usd),
        txHash: row.tx_hash,
        status: row.status,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Get pending crypto payments error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending payments' });
  }
});

export default router;
