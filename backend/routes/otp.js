import express from 'express';
import { sendOTP, verifyOTP, loginWithOTP } from '../controllers/userController.js';

const router = express.Router();

// Send OTP for registration/verification
router.post('/send', sendOTP);

// Verify OTP for registration/verification
router.post('/verify', verifyOTP);

// Login with OTP
router.post('/login', loginWithOTP);

export default router; 