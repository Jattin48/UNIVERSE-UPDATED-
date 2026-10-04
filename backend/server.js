const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const dns = require('dns');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db.js');

// Force IPv4 first DNS lookup order to prevent ENETUNREACH IPv6 errors on cloud hosts like Render
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

dotenv.config();

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Rate Limiter for Auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: 'Too many auth requests from this IP, please try again after 15 minutes' },
});

app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/colleges', require('./routes/collegeRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'UNIVERSE API',
    timestamp: new Date(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`UNIVERSE Backend Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
