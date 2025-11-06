import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { 
  getUserStatus, 
  handleSubscription, 
  handleMockPayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  promoteUserToPro,
  cancelSubscription
} from '../controllers/paymentController.js';

const router = express.Router();

// Get user payment/subscription status
router.get('/status', authMiddleware, getUserStatus);

// Handle subscription
router.post('/subscribe', authMiddleware, handleSubscription);

// Handle mock payment (for testing)
router.post('/verify', authMiddleware, handleMockPayment);

// Razorpay routes
router.post('/razorpay/order', authMiddleware, createRazorpayOrder);
router.post('/razorpay/verify', authMiddleware, verifyRazorpayPayment);

// New route to handle demo promotion
router.post('/promote', authMiddleware, promoteUserToPro);

// Route to cancel subscription
router.post('/cancel', authMiddleware, cancelSubscription);

export default router;