import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { 
    type: String,
    required: true,
    minlength: [6, "Password kam se kam 6 characters ka hona chahiye!"], 
    maxlength: [100, "Password 100 characters se bada nahi ho sakta!"],
  },
  phone: { 
    type: String, 
    required: [true, "Phone number zaroori hai!"],
    unique: true, 
    trim: true,
  },
  role: {
    type: String,
    enum: ["user", "admin", "seoadmin"],
    default: "user"
  },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null }
}, { timestamps: true });

// ✅ FIX: Pre-save hook using bcrypt
userSchema.pre('save', async function (next) {
  // Agar password modified nahi hai (jaise resetToken set karte waqt), skip karein
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;