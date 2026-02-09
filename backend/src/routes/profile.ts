import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body, validationResult } from 'express-validator';
import UserRepository from '../repositories/UserRepository';
import { protect } from '../middleware/auth';

const router = express.Router();

// Avatar upload config
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/home/wes/voidvendor-uploads/avatars';

// Ensure upload directory exists
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (err) {
  console.log('Could not create uploads dir:', err);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, _file, cb) => {
    const ext = path.extname(_file.originalname).toLowerCase() || '.jpg';
    cb(null, `${req.user!.userId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 }, // 500KB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
    }
  },
});

// GET /api/profile/:userId - View any user's public profile
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const profile = await UserRepository.findPublicProfile(req.params.userId);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
});

// PUT /api/profile - Update own profile (protected)
router.put(
  '/',
  protect,
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }),
    body('bio').optional().trim().isLength({ max: 500 }),
    body('location').optional().trim().isLength({ max: 100 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: errors.array()[0].msg });
      }

      const { name, bio, location } = req.body;
      const updated = await UserRepository.update(req.user!.userId, {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
      });

      if (!updated) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      res.json({
        success: true,
        data: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          bio: updated.bio,
          location: updated.location,
          avatarUrl: updated.avatarUrl,
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
  }
);

// POST /api/profile/avatar - Upload avatar (protected)
router.post('/avatar', protect, (req: Request, res: Response) => {
  upload.single('avatar')(req, res, async (err: any) => {
    if (err) {
      const message = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Max 500KB.'
        : err.message;
      return res.status(400).json({ success: false, error: message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    try {
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // Delete old avatar if it had a different extension
      const user = await UserRepository.findById(req.user!.userId);
      if (user?.avatarUrl && user.avatarUrl !== avatarUrl) {
        const oldPath = path.join(UPLOADS_DIR, path.basename(user.avatarUrl));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      await UserRepository.update(req.user!.userId, { avatarUrl });

      res.json({ success: true, data: { avatarUrl } });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ success: false, error: 'Failed to save avatar' });
    }
  });
});

export default router;
