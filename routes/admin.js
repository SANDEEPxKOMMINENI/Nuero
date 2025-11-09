import express from 'express';
import User from '../models/User.js';
import Resume from '../models/Resume.js';
import AuditLog from '../models/AuditLog.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * Get all users (admin only)
 */
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user details (admin only)
 */
router.get('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resumes = await Resume.find({ userId: req.params.userId })
      .select('jobTitle template createdAt status');

    res.json({
      user,
      resumes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update user subscription (admin only)
 */
router.put('/users/:userId/subscription', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { subscription, tailoringsLimit } = req.body;

    if (!subscription || !['free', 'pro', 'premium'].includes(subscription)) {
      return res.status(400).json({
        error: 'Valid subscription type required',
      });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.subscription = subscription;

    // Set default limits based on subscription
    if (subscription === 'free') {
      user.tailoringsLimit = tailoringsLimit || 3;
    } else if (subscription === 'pro') {
      user.tailoringsLimit = tailoringsLimit || 50;
    } else if (subscription === 'premium') {
      user.tailoringsLimit = tailoringsLimit || 500;
    }

    await user.save();

    res.json({
      message: 'User subscription updated',
      user: {
        id: user._id,
        email: user.email,
        subscription: user.subscription,
        tailoringsLimit: user.tailoringsLimit,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Deactivate/Activate user account (admin only)
 */
router.put('/users/:userId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: 'isActive boolean value required',
      });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'}`,
      user: {
        id: user._id,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Reset tailorings count (admin only)
 */
router.put('/users/:userId/reset-tailorings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.tailoringsUsed = 0;
    user.tailoringResetDate = new Date();
    user.apiLimitExceeded = false;
    await user.save();

    res.json({
      message: 'Tailorings count reset',
      user: {
        id: user._id,
        email: user.email,
        tailoringsUsed: user.tailoringsUsed,
        tailoringsLimit: user.tailoringsLimit,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get system statistics (admin only)
 */
router.get('/stats/system', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalResumes = await Resume.countDocuments();
    const completedResumes = await Resume.countDocuments({ status: 'completed' });

    const usersBySubscription = await User.aggregate([
      {
        $group: {
          _id: '$subscription',
          count: { $sum: 1 },
        },
      },
    ]);

    const tailoringsThisMonth = await Resume.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    });

    const llmUsage = await Resume.aggregate([
      {
        $group: {
          _id: '$selectedLLM',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      resumes: {
        total: totalResumes,
        completed: completedResumes,
      },
      usersBySubscription,
      tailoringsThisMonth,
      llmUsage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get audit logs (admin only)
 */
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find()
      .populate('userId', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments();

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
