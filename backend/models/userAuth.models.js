import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { 
    type: String,
    required: true,
    minlength: [6, "Password kam se kam 6 characters ka hona chahiye!"], 
    maxlength: [100, "Password 100 characters se bada nahi ho sakta!"] ,
  },
  phone: { 
    type: String, 
    required: [true, "Phone number zaroori hai!"],
    unique: true, 
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} ek valid 10-digit phone number nahi hai!`
    }
  },
  // Naya field dynamically check karne ke liye ki user kaun hai
  role: {
    type: String,
    enum: ["user", "admin", "seoadmin"], // Sirf yahi 3 categories allow hongi
    default: "user" // Jo bhi normal signup karega, woh automatic "user" banega
  },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null }
}, { timestamps: true });


userSchema.pre('save', async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error; // Mongoose automatically handles thrown errors in async hooks
  }
});

// Password comparison method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password) {
    throw new Error("Illegal arguments: missing password string to compare");
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;