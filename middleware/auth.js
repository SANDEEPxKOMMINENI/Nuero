import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const checkTailoringLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Reset monthly limit if needed
    const now = new Date();
    const lastReset = new Date(user.tailoringResetDate);
    const monthPassed =
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear();

    if (monthPassed) {
      user.tailoringsUsed = 0;
      user.tailoringResetDate = now;
      await user.save();
    }

    // Check if limit exceeded
    if (
      user.role !== 'admin' &&
      user.tailoringsUsed >= user.tailoringsLimit
    ) {
      user.apiLimitExceeded = true;
      await user.save();
      return res.status(429).json({
        error: 'Tailoring limit exceeded. Upgrade your subscription.',
        tailoringsUsed: user.tailoringsUsed,
        tailoringsLimit: user.tailoringsLimit,
      });
    }

    req.user.tailoringsUsed = user.tailoringsUsed;
    req.user.tailoringsLimit = user.tailoringsLimit;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
