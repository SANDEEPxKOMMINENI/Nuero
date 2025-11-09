import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    subscription: {
      type: String,
      enum: ['free', 'pro', 'premium'],
      default: 'free',
    },
    tailoringsUsed: {
      type: Number,
      default: 0,
    },
    tailoringsLimit: {
      type: Number,
      default: 3, // Free tier: 3 per month
    },
    tailoringResetDate: {
      type: Date,
      default: () => new Date(),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    apiLimitExceeded: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (inputPassword) {
  return bcryptjs.compare(inputPassword, this.password);
};

export default mongoose.model('User', userSchema);
