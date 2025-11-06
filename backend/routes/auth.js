import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendPasswordResetEmail, generateResetToken } from '../utils/emailService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Validate required environment variables
if (!process.env.GOOGLE_CLIENT_ID) {
  console.error('GOOGLE_CLIENT_ID environment variable is not set');
}
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is not set');
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;

// Get user profile - Protected route
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // User is already verified and attached by authMiddleware
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        mobile: req.user.mobile,
        isProUser: req.user.isProUser,
        credits: req.user.credits,
        subscriptionPlan: req.user.subscriptionPlan || (req.user.isProUser ? 'PRO' : 'FREE'),
        subscriptionEnd: req.user.subscriptionEndDate,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ success: false, message: 'Error fetching user profile' });
  }
});

// Simple mobile validation function
const validateMobile = (mobile) => {
  const cleanMobile = mobile.replace(/\D/g, '');
  if (cleanMobile.length < 10 || cleanMobile.length > 15) {
    return false;
  }
  return cleanMobile;
};

// Google OAuth login/register
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  
  // Validate request
  if (!credential) {
    return res.status(400).json({ 
      success: false, 
      error: 'invalid_request',
      message: 'Google credential is required' 
    });
  }

  // Validate environment setup
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
    return res.status(500).json({ 
      success: false, 
      error: 'server_error',
      message: 'OAuth is not properly configured' 
    });
  }

  try {
    const ticket = await client.verifyIdToken({ 
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ googleId, email, name });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.name = name;
      await user.save();
    }
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, user: { email: user.email, name: user.name }, token });
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid Google token' });
  }
});

// Manual registration
router.post('/register', async (req, res) => {
  const { email, name, password, mobile } = req.body;
  try {
    if (!email || !password || !name) return res.status(400).json({ error: 'Name, email and password required' });
    let user = await User.findOne({ email });
    if (user) return res.status(409).json({ error: 'User already exists' });
    
    const hashed = await bcrypt.hash(password, 10);
    const userData = { email, name, password: hashed };
    
    // Add mobile if provided
    if (mobile) {
      const validatedMobile = validateMobile(mobile);
      if (validatedMobile) {
        userData.mobile = validatedMobile;
      }
    }
    
    user = await User.create(userData);
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, user: { email: user.email, name: user.name }, token });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Manual login
router.post('/login', async (req, res) => {
  const { email, password, mobile } = req.body;
  try {
    let user;
    
    // Find user by email or mobile
    if (email) {
      user = await User.findOne({ email });
    } else if (mobile) {
      const validatedMobile = validateMobile(mobile);
      if (!validatedMobile) {
        return res.status(400).json({ error: 'Invalid mobile number format' });
      }
      user = await User.findOne({ mobile: validatedMobile });
    } else {
      return res.status(400).json({ error: 'Email or mobile number required' });
    }
    
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      success: true, 
      user: { 
        email: user.email, 
        name: user.name,
        mobile: user.mobile 
      }, 
      token 
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Forgot password (email only)
router.post('/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      // Security practice: Don't reveal if an email is registered or not.
      // Still send a success-like response.
      return res.json({ message: 'If your account exists, you will receive a password reset link.' });
    }
    
    const resetToken = generateResetToken();
    const FRONTEND_URL = process.env.VITE_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${FRONTEND_URL}/reset?token=${resetToken}`;
    
    // Store reset token with expiry (1 hour)
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();
    
    // --- MODIFICATION START ---
    // Send email and capture the returned info
    const emailInfo = await sendPasswordResetEmail(email, resetToken, resetUrl);

// ADD THIS LOG
console.log('--- Email Info from Ethereal ---', emailInfo);

const responsePayload = {
  message: 'Password reset link sent to your email.',
  previewUrl: process.env.NODE_ENV === 'development' ? emailInfo.previewUrl : null
};

// ADD THIS LOG
console.log('--- Sending this JSON response to frontend ---', responsePayload);

// Return the preview URL in development for easy testing
return res.json(responsePayload);

  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});


// Reset password (email only)
router.post('/reset', async (req, res) => {
  const { token, password } = req.body;
  
  try {
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }
    
    const user = await User.findOne({ 
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Update password and clear reset token
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();
    
    res.json({ success: true, message: 'Password reset successfully' });
    
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Verify reset token (for frontend validation)
router.get('/verify-reset/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ 
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    res.json({ success: true, message: 'Token is valid' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

// Endpoint to get Google Client ID for frontend
router.get('/google-client-id', (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || '' });
});

export default router;