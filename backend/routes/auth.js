const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Debug: Check if User model is properly imported
console.log('User model imported:', typeof User);
console.log('User.findOne type:', typeof User.findOne);
console.log('User.create type:', typeof User.create);

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// =======================
// Test Route
// =======================
router.get('/test', (req, res) => {
  console.log('✅ Test endpoint hit');
  res.json({ 
    message: 'Backend is working!', 
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
});

// =======================
// Register Route
// =======================
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  console.log('📥 Register attempt:', { username, email });

  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    console.log('🔍 User exists check result:', userExists);

    if (userExists) {
      console.log('⚠️ User already exists');
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ username, email, password });
    console.log('✅ User created with ID:', user._id);

    if (user) {
      return res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// =======================
// Login Route
// =======================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('📥 Login attempt:', { email });

  try {
    const user = await User.findOne({ email });
    console.log('🔍 Login user lookup:', user ? user._id : 'Not found');

    if (user && (await user.correctPassword(password, user.password))) {
      console.log('✅ Login success for user:', user._id);

      return res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      console.log('⚠️ Invalid email or password');
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// =======================
// Get Current User
// =======================
router.get('/me', protect, async (req, res) => {
  console.log('📥 /me request for user:', req.user ? req.user._id : 'No user');
  res.json(req.user);
});

module.exports = router;