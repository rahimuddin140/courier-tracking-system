const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// GET /register
router.get('/register', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect(`/${req.session.user.role}/dashboard`);
  }
  res.render('auth/register', { title: 'Register - Courier Tracking System' });
});

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    // Basic validation
    if (!name || !email || !phone || !password || !confirmPassword) {
      req.flash('error', 'All fields are required.');
      return res.redirect('/register');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/register');
    }

    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters long.');
      return res.redirect('/register');
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      req.flash('error', 'An account with this email already exists.');
      return res.redirect('/register');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: 'customer'
    });

    await newUser.save();
    req.flash('success', 'Registration successful! Please log in with your credentials.');
    return res.redirect('/login');
  } catch (err) {
    console.error('Registration error:', err);
    req.flash('error', 'An unexpected error occurred during registration. Please try again.');
    return res.redirect('/register');
  }
});

// GET /login
router.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect(`/${req.session.user.role}/dashboard`);
  }
  res.render('auth/login', { title: 'Login - Courier Tracking System' });
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error', 'Please enter both email and password.');
      return res.redirect('/login');
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).populate('zone');

    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    if (!user.isActive) {
      req.flash('error', 'This account has been deactivated. Please contact the administrator.');
      return res.redirect('/login');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    // Set session user
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      zone: user.zone
    };

    req.flash('success', `Welcome back, ${user.name}!`);

    // Redirect based on role
    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else if (user.role === 'agent') {
      return res.redirect('/agent/dashboard');
    } else {
      return res.redirect('/customer/dashboard');
    }
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'An error occurred while logging in. Please try again.');
    return res.redirect('/login');
  }
});

// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout session destruction error:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

module.exports = router;
