import express from "express";
import { register, login, logout } from '../controllers/auth.controllers.js';
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ==========================================
// MIDDLEWARES FOR WEB & API PROTECTION
// ==========================================

// Modified Protect Middleware to read from Cookies
const protectView = (req, res, next) => {
  const token = req.cookies.token;

  // Agar token nahi mila, toh JSON response dene ke bajay directly login page par redirect kar do!
  if (!token) {
    return res.redirect("/login.html");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains { id, role }
    next();
  } catch (error) {
    res.clearCookie("token");
    return res.redirect("/login.html");
  }
};

// Role Authentication Middleware for Views
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      // Agar role match nahi karta, toh homepage par phenk do
      return res.redirect("/index.html"); 
    }
    next();
  };
};

// ==========================================
// PUBLIC API ROUTES
// ==========================================
router.post('/api/auth/register', register);
router.post('/api/auth/login', login);
router.post('/api/auth/logout', logout);

// ==========================================
// PROTECTED PAGES SERVING (Direct URL Protection)
// ==========================================

// Jab koi direct browser me URL /admin.html type karega, toh yeh block karega
router.get('/admin.html', protectView, authorizeRoles('admin'), (req, res) => {
  // Apne system ke hisab se exact path pass karein
  res.sendFile(path.join(__dirname, '../../frontend/admin.html')); 
});

// Jab koi direct browser me URL /seoadmin.html type karega
router.get('/seoadmin.html', protectView, authorizeRoles('seoadmin', 'admin'), (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/seoadmin.html'));
});

export default router;