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

// ==========================================
// PROTECTED PAGES SERVING (Direct URL Protection)
// ==========================================

// 1. Saare Admin Pages ki list (Aapke images ke mutabik saare pages)
const adminPages = [
  '/admin.html',
  '/addnewproduct.html',
  '/adminleadshow.html',
  '/adminproduct.html',
  '/adminupdateproduct.html',
  '/adminUserquery.html'
];

// 2. Ek hi baar me saare pages par protection loop
adminPages.forEach((page) => {
  router.get(page, protectView, authorizeRoles('admin'), (req, res) => {
    // Ye line ensure karegi ki bina login ke koi inme se kisi page ko na dekh sake
    res.sendFile(path.join(__dirname, `../../frontend/${page}`)); 
  });
});

// SEO Admin ke liye alag se protection (Jaisa aapka pehle tha)
router.get('/seoadmin.html', protectView, authorizeRoles('seoadmin', 'admin'), (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/seoadmin.html'));
});

export default router;