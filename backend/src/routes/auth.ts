import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import UserModel from '../models/User';
import { generateToken } from '../utils/jwt';
import { protect } from '../middleware/auth';
import { ApiResponse } from '../types';

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
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        const response: ApiResponse = {
          success: false,
          error: 'User with this email already exists',
        };
        return res.status(400).json(response);
      }

      // Create user
      const user = await UserModel.create({
        name,
        email,
        password,
      });

      // Generate token
      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          user: user.toJSON(),
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

      // Find user by email (include password for comparison)
      const user = await UserModel.findOne({ email }).select('+password');
      if (!user) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid email or password',
        };
        return res.status(401).json(response);
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid email or password',
        };
        return res.status(401).json(response);
      }

      // Generate token
      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          user: user.toJSON(),
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
    const user = await UserModel.findById(req.user?.userId);

    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: user.toJSON(),
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

export default router;
