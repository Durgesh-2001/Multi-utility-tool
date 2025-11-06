import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET;
const MAX_FREE_GENERATIONS = 3;
const COST_PER_GENERATION = 50;

export const authMiddleware = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user to request with all necessary fields
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

export const checkCredits = async (req, res, next) => {
    const user = req.user;
  
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
  
    if (user.isProUser) {
      return next();
    }
  
    if (user.freeGenerationsUsed < MAX_FREE_GENERATIONS) {
      user.freeGenerationsUsed += 1;
      await user.save();
      return next();
    }
  
    if (user.credits >= COST_PER_GENERATION) {
      user.credits -= COST_PER_GENERATION;
      await user.save();
      return next();
    }
  
    return res.status(402).json({ error: 'Insufficient credits. Please make a payment.' });
}; 