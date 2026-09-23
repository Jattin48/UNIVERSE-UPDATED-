const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const College = require('../models/College');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'universe_super_secret_jwt_key_2026_key', {
    expiresIn: '30d',
  });
};

// @desc    Register new user (student / college)
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { email, password, role, name, phone, collegeName, city, state, collegeType } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const assignedRole = ['student', 'college', 'admin'].includes(role) ? role : 'student';

    const user = await User.create({
      email,
      password,
      role: assignedRole,
      isVerified: true,
    });

    let linkedProfile = null;

    if (assignedRole === 'student') {
      linkedProfile = await StudentProfile.create({
        userId: user._id,
        name: name || email.split('@')[0],
        phone: phone || '',
      });
    } else if (assignedRole === 'college') {
      linkedProfile = await College.create({
        userId: user._id,
        name: collegeName || name || 'New College',
        location: {
          city: city || 'New Delhi',
          state: state || 'Delhi',
          country: 'India',
          coordinates: [77.209, 28.6139],
        },
        type: collegeType || 'Private',
        registrationStatus: 'pending',
        coursesOffered: [],
        facilities: ['Hostel', 'Library', 'Sports', 'Wi-Fi'],
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      token,
      profile: linkedProfile,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: error.message || 'Server error during signup' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ userId: user._id });
    } else if (user.role === 'college') {
      profile = await College.findOne({ userId: user._id });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      token,
      profile,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

// @desc    Get current user session
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let profile = null;

    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ userId: user._id }).populate('shortlistedColleges');
    } else if (user.role === 'college') {
      profile = await College.findOne({ userId: user._id });
    }

    res.json({
      user,
      profile,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = { signup, login, getMe };
