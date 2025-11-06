import User from '../models/User.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const getUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      credits: user.credits,
      isPro: user.isProUser,
      plan: user.subscriptionPlan,
      subscriptionEnd: user.subscriptionEndDate
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Always immediately revert to free plan
    const now = new Date();
    user.isProUser = false;
    user.subscriptionPlan = 'Free';
    user.credits = 150;
    user.subscriptionEndDate = now;
    await user.save();

    res.json({
      message: 'Subscription cancelled successfully',
      isPro: false,
      plan: 'Free',
      credits: 150,
      subscriptionEnd: now
    });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling subscription' });
  }
};

export const handleSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['Free', 'Weekly', 'Super', 'Pro', 'Pro+'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set subscription end date
    const now = new Date();
    const endDate = new Date(now);
    const planLower = plan.toLowerCase();
    if (planLower === 'weekly') {
      endDate.setDate(endDate.getDate() + 7);
    } else if (planLower === 'super') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planLower === 'pro') {
      endDate.setMonth(endDate.getMonth() + 6);
    } else if (planLower === 'pro+') {
      endDate.setMonth(endDate.getMonth() + 12);
    } else if (planLower === 'free') {
      // No end date for free
    }

    // Update user subscription
    user.isProUser = planLower !== 'free';
    user.subscriptionPlan = plan;
    user.subscriptionStartDate = now;
    user.subscriptionEndDate = endDate;
    user.credits = planLower !== 'free' ? 999999 : 150;
    await user.save();

    res.json({
      message: 'Subscription activated successfully',
      plan: user.subscriptionPlan,
      subscriptionEnd: user.subscriptionEndDate
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Mock payment for testing
export const handleMockPayment = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.credits += 100;
    await user.save();

    res.json({
      message: 'Payment successful',
      credits: user.credits
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createRazorpayOrder = async (req, res) => {
  try {
    let { amount, currency = 'INR', plan } = req.body;
    // Set correct amount based on plan to prevent tampering
    if (plan === 'Free') {
      amount = 0;
    } else if (plan === 'Weekly') {
      amount = 9;
    } else if (plan === 'Super') {
      amount = 39;
    } else if (plan === 'Pro') {
      amount = 69;
    } else if (plan === 'Pro+') {
      amount = 99;
    }
    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency,
      receipt: `receipt_order_${new Date().getTime()}`,
      notes: {
        plan,
        userId: req.user.id
      }
    };

    const order = await razorpay.orders.create(options);
    if (!order) return res.status(500).json({ message: 'Error creating Razorpay order' });
    
    res.json(order);
  } catch (error) {
    // Log the detailed error on the backend
    console.error('RAZORPAY ORDER CREATION ERROR:', error); 
    // Send a JSON response to the frontend
    res.status(500).json({ message: 'Failed to create Razorpay order.', error: error.message });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
  const userId = req.user.id;
  
  // Restore secure signature verification
  const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest('hex');

  if (digest !== razorpay_signature) {
    return res.status(400).json({ msg: 'Transaction not legit!' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    const endDate = new Date(now);
    const planLower = plan.toLowerCase();
    if (planLower === 'weekly') {
      endDate.setDate(endDate.getDate() + 7);
    } else if (planLower === 'super') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planLower === 'pro') {
      endDate.setMonth(endDate.getMonth() + 6);
    } else if (planLower === 'pro+') {
      endDate.setMonth(endDate.getMonth() + 12);
    }

    user.isProUser = planLower !== 'free';
    user.subscriptionPlan = plan;
    user.subscriptionStartDate = now;
    user.subscriptionEndDate = endDate;
    user.credits = planLower !== 'free' ? 999999 : 3;
    await user.save();

    res.json({
      message: 'Payment successful, subscription activated',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating user' });
  }
};

// Promote user to Pro for demo purposes
export const promoteUserToPro = async (req, res) => {
  const { plan } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set correct subscription end date based on plan
    const now = new Date();
    const endDate = new Date(now);
    const planLower = (plan || 'pro').toLowerCase();
    if (planLower === 'weekly') {
      endDate.setDate(endDate.getDate() + 7);
    } else if (planLower === 'super') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planLower === 'pro') {
      endDate.setMonth(endDate.getMonth() + 6);
    } else if (planLower === 'pro+') {
      endDate.setMonth(endDate.getMonth() + 12);
    }

    user.isProUser = planLower !== 'free';
    user.credits = planLower !== 'free' ? 999999 : 150;
    user.subscriptionPlan = plan || 'Pro';
    user.subscriptionStartDate = now;
    user.subscriptionEndDate = endDate;
    await user.save();

    res.json({
      message: 'User promoted to Pro successfully',
      isPro: user.isProUser,
      credits: user.credits,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionEnd: user.subscriptionEndDate
    });
  } catch (error) {
    console.error('PROMOTE USER TO PRO ERROR:', error); // Log the error and stack trace
    res.status(500).json({ message: 'Server error during promotion', error: error.message, stack: error.stack });
  }
}; 