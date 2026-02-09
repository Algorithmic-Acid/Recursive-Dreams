
import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import UserRepository from '../repositories/UserRepository';
import { generateToken } from '../utils/jwt';
import { protect } from '../middleware/auth';
import { ApiResponse } from '../types';
import { db } from '../config/postgres';
import { sendPasswordResetEmail } from '../utils/email';

const router = express.Router();

// Register new user
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: errors.array()[0].msg,
        };
        return res.status(400).json(response);
      }

      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await UserRepository.findByEmail(email);
      if (existingUser) {
        const response: ApiResponse = {
          success: false,
          error: 'User with this email already exists',
        };
        return res.status(400).json(response);
      }

      // Create user
      const user = await UserRepository.create({
        name,
        email,
        password,
      });

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.isAdmin ? 'admin' : 'user',
      });

      const response: ApiResponse = {
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            avatarUrl: user.avatarUrl || '',
          },
          token,
        },
        message: 'User registered successfully',
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Register error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Registration failed',
      };
      res.status(500).json(response);
    }
  }
);

// Login user
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: errors.array()[0].msg,
        };
        return res.status(400).json(response);
      }

      const { email, password } = req.body;

      // Verify user credentials
      const user = await UserRepository.verifyPassword(email, password);
      if (!user) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid email or password',
        };
        return res.status(401).json(response);
      }

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.isAdmin ? 'admin' : 'user',
      });

      const response: ApiResponse = {
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            avatarUrl: user.avatarUrl || '',
          },
          token,
        },
        message: 'Login successful',
      };

      res.json(response);
    } catch (error: any) {
      console.error('Login error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Login failed',
      };
      res.status(500).json(response);
    }
  }
);

// Get current user (protected route)
router.get('/me', protect, async (req: Request, res: Response) => {
  try {
    const user = await UserRepository.findById(req.user?.userId);

    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio || '',
        location: user.location || '',
        avatarUrl: user.avatarUrl || '',
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get user error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get user',
    };
    res.status(500).json(response);
  }
});

// Request password reset
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: errors.array()[0].msg,
        });
      }

      const { email } = req.body;

      // Find user by email
      const user = await UserRepository.findByEmail(email);

      // Always return success (don't reveal if email exists)
      if (!user) {
        return res.json({
          success: true,
          message: 'If an account exists with that email, a password reset link has been sent.',
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token in database
      await db.query(`
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES ($1, $2, $3)
      `, [user.id, hashedToken, expiresAt]);

      // Send email
      const emailSent = await sendPasswordResetEmail(user.email, resetToken, user.name);

      if (!emailSent) {
        console.error('Failed to send password reset email to:', user.email);
      }

      res.json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process password reset request',
      });
    }
  }
);

// Reset password with token
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: errors.array()[0].msg,
        });
      }

      const { token, password } = req.body;

      // Hash the token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find valid reset token
      const result = await db.query(`
        SELECT prt.id, prt.user_id, u.email, u.name
        FROM password_reset_tokens prt
        JOIN users u ON u.id = prt.user_id
        WHERE prt.token = $1
          AND prt.expires_at > NOW()
          AND prt.used = FALSE
      `, [hashedToken]);

      if (result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token',
        });
      }

      const resetRecord = result.rows[0];

      // Update user password
      await UserRepository.updatePassword(resetRecord.user_id, password);

      // Mark token as used
      await db.query(`
        UPDATE password_reset_tokens
        SET used = TRUE
        WHERE id = $1
      `, [resetRecord.id]);

      res.json({
        success: true,
        message: 'Password reset successfully. You can now log in with your new password.',
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset password',
      });
    }
  }
);

export default router;
