import User from "../models/userAuth.models.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// ==========================================
// REGISTER USER
// ==========================================
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body; 
    if (!phone) return res.status(400).json({ message: 'Phone number zaroori hai!' });

    let userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email already registered.' });

    let phoneExists = await User.findOne({ phone });
    if (phoneExists) return res.status(400).json({ message: 'Phone number already registered.' });

    const user = await User.create({ 
      name: name.toUpperCase(), 
      email, 
      password, 
      phone,
      role: "user" 
    });

    res.status(201).json({ message: 'Registration successful!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ==========================================
// LOGIN USER (Cookie + Token JSON Response)
// ==========================================
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    let userData = null;
    let userRole = "user";
    let userId = "";

    // 1. Env Admin Check
    if (process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      userId = "env-admin-id";
      userRole = "admin";
      userData = { name: "SYSTEM ADMIN", email: process.env.ADMIN_EMAIL, phone: "N/A", role: "admin" };
    }
    // 2. Env SEO Admin Check
    else if (process.env.SEO_EMAIL && email === process.env.SEO_EMAIL && password === process.env.SEO_PASSWORD) {
      userId = "env-seoadmin-id";
      userRole = "seoadmin";
      userData = { name: "SEO ADMIN", email: process.env.SEO_EMAIL, phone: "N/A", role: "seoadmin" };
    }
    // 3. Database Check
    else {
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }
      userId = user._id;
      userRole = user.role;
      userData = { name: user.name, email: user.email, phone: user.phone, role: user.role };
    }

    // Token Generation
    const token = generateToken(userId, userRole);

    // Set Token in HttpOnly Cookie (for Direct Express Route Protection)
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Production me process.env.NODE_ENV === 'production' rakhein
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000 
    });
    
    // 🌟 FIX HERE: Token JSON me bhi return karein
    res.status(200).json({ 
      message: 'Login successful!', 
      token: token,      // <-- Frontend localStorage ke liye zaruri hai
      user: userData 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Logout Controller to clear cookie
export const logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
};