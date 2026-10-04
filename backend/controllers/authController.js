const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const College = require('../models/College');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'universe_super_secret_jwt_key_2026_key', {
    expiresIn: '30d',
  });
};

const generate6DigitOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register new user & return instant token (optional email verification)
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { email, password, role, name, phone, collegeName, city, state, collegeType } = req.body;
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const assignedRole = ['student', 'college', 'admin'].includes(role) ? role : 'student';
    const otp = generate6DigitOtp();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      role: assignedRole,
      isVerified: false,
      otp,
      otpExpires,
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

    // Send Email asynchronously in background
    sendEmail({
      to: user.email,
      subject: 'UNIVERSE - Verify Your Email Address (OTP)',
      text: `Your OTP for UNIVERSE email verification is: ${otp}. It is valid for 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-bottom: 8px;">UNIVERSE College Discovery</h2>
          <p>Welcome to UNIVERSE! You can verify your email anytime using the 6-digit OTP code below:</p>
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #4f46e5;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #64748b;">This OTP code is valid for 15 minutes.</p>
        </div>
      `,
    }).catch((err) => console.error('Background sendEmail error:', err));

    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      isVerified: false,
      token,
      profile: linkedProfile,
      message: 'Signup successful! Welcome to UNIVERSE.',
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: error.message || 'Server error during signup' });
  }
};

// @desc    Authenticate user & get token (instant access regardless of verification status)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
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
      isVerified: user.isVerified,
      token,
      profile,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

// @desc    Verify 6-digit OTP anytime
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP code are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.json({
        isVerified: true,
        message: 'Your email is already verified.',
      });
    }

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ message: 'No active OTP found. Please click Resend OTP.' });
    }

    if (new Date() > new Date(user.otpExpires)) {
      return res.status(400).json({ message: 'OTP has expired. Please click Resend OTP.' });
    }

    if (user.otp.trim() !== otp.toString().trim()) {
      return res.status(400).json({ message: 'Invalid OTP code. Please check and try again.' });
    }

    // Mark as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({
      isVerified: true,
      message: 'Email verified successfully!',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: error.message || 'Server error during OTP verification' });
  }
};

// @desc    Resend OTP to user email
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified.' });
    }

    const otp = generate6DigitOtp();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'UNIVERSE - Verification OTP Code',
      text: `Your new OTP for UNIVERSE email verification is: ${otp}. It is valid for 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-bottom: 8px;">UNIVERSE College Discovery</h2>
          <p>Here is your requested 6-digit email verification code:</p>
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #4f46e5;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #64748b;">This OTP code is valid for 15 minutes.</p>
        </div>
      `,
    });

    res.json({ message: 'A 6-digit OTP has been sent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: error.message || 'Server error during resend OTP' });
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

module.exports = { signup, verifyOtp, resendOtp, login, getMe };
