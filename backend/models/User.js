import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: { type: String, default: null },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, default: null }, // For SMS support
  name: { type: String, required: true },
  password: { type: String, required: true },
  credits: { type: Number, default: 150 },
  isProUser: { type: Boolean, default: false },
  subscriptionPlan: { type: String, enum: ['Free', 'Weekly', 'Super', 'Pro', 'Pro+'], default: 'Free' },
  subscriptionStartDate: { type: Date },
  subscriptionEndDate: { type: Date },
  freeGenerationsUsed: { type: Number, default: 0 },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  otp: { type: String, default: null }, // For OTP verification
  otpExpiry: { type: Date, default: null }, // OTP expiration
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
export default User; 