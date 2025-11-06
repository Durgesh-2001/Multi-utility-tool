import User from "../models/User.js";
import jwt from "jsonwebtoken";
import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export const deductCredits = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if user is PRO - they don't need credit deduction
        if (user.isProUser) {
            return res.json({ success: true, credits: user.credits, message: 'Pro user - no credits deducted' });
        }

        // Check if user has enough credits
        if (user.credits < 50) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient credits. Please upgrade to a Pro plan to continue.',
                credits: user.credits
            });
        }

        // Deduct credits and save
        user.credits -= 50;
        await user.save();

        return res.json({
            success: true,
            credits: user.credits,
            message: 'Credits deducted successfully'
        });
    } catch (error) {
        console.error('Credit deduction error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deducting credits'
        });
    }
};

// Send OTP
export const sendOTP = async (req, res) => {
  try {
    const { mobile } = req.body;
    
    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
    }

    // Validate mobile number (basic validation)
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number'
      });
    }

    // Validate Indian mobile number format (starts with 6, 7, 8, 9)
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Indian mobile number (starts with 6, 7, 8, or 9)'
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Check if Twilio is configured
    if (!accountSid || !authToken || !process.env.TWILIO_PHONE_NUMBER) {
      // console.log(`🔐 [DEV MODE] OTP for ${cleanMobile}: ${otp}`);
      
      // Store OTP in database
      await User.findOneAndUpdate(
        { mobile: cleanMobile },
        { 
          otp,
          otpExpiry: new Date(Date.now() + 5 * 60000) // 5 minutes expiry
        },
        { upsert: true, new: true }
      );

      return res.json({
        success: true,
        message: 'OTP sent successfully (check console for development)'
      });
    }

    // Send SMS via Twilio
    try {
      await client.messages.create({
        body: `Your Multi-Tool.io verification code is: ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+91${cleanMobile}` // Add Indian country code
      });

      // Store OTP in database
      await User.findOneAndUpdate(
        { mobile: cleanMobile },
        { 
          otp,
          otpExpiry: new Date(Date.now() + 5 * 60000) // 5 minutes expiry
        },
        { upsert: true, new: true }
      );

      res.json({
        success: true,
        message: 'OTP sent successfully'
      });

    } catch (twilioError) {
      console.error('Twilio Error:', twilioError);
      
      if (twilioError.code === 20003) {
        return res.status(401).json({
          success: false,
          message: 'SMS service authentication failed'
        });
      }
      
      if (twilioError.code === 21211) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }
      
      throw twilioError;
    }

  } catch (error) {
    console.error('OTP Send Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    
    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and OTP are required'
      });
    }

    const cleanMobile = mobile.replace(/\D/g, '');

    // Find user and verify OTP
    const user = await User.findOne({ 
      mobile: cleanMobile,
      otp,
      otpExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP or OTP has expired'
      });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { 
        name: user.name, 
        email: user.email,
        mobile: user.mobile 
      },
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
};

// Login with OTP
export const loginWithOTP = async (req, res) => {
  try {
    const { mobile } = req.body;
    
    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
    }

    const cleanMobile = mobile.replace(/\D/g, '');

    // Validate Indian mobile number
    if (cleanMobile.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number'
      });
    }

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Indian mobile number (starts with 6, 7, 8, or 9)'
      });
    }

    // Find user
    let user = await User.findOne({ mobile: cleanMobile });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.'
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60000); // 5 minutes
    await user.save();

    // Check if Twilio is configured
    if (!accountSid || !authToken || !process.env.TWILIO_PHONE_NUMBER) {
      // console.log(`🔐 [DEV MODE] Login OTP for ${cleanMobile}: ${otp}`);
      return res.json({
        success: true,
        message: 'Login OTP sent successfully (check console for development)'
      });
    }

    // Send SMS
    await client.messages.create({
      body: `Your Multi-Tool.io login code is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${cleanMobile}` // Add Indian country code
    });

    res.json({
      success: true,
      message: 'Login OTP sent successfully'
    });

  } catch (error) {
    console.error('Login OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send login OTP'
    });
  }
}; 