const express = require('express');
const router = express.Router();
const {
  searchColleges,
  getCollegeById,
  getMyCollegeProfile,
  updateMyCollegeProfile,
  uploadVerificationDocs,
  getCollegeLeads,
} = require('../controllers/collegeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public routes
router.get('/search', searchColleges);
router.get('/:id', getCollegeById);

// Protected College routes
router.get('/me/profile', protect, authorize('college'), getMyCollegeProfile);
router.put('/me/profile', protect, authorize('college'), updateMyCollegeProfile);
router.post('/me/documents', protect, authorize('college'), uploadVerificationDocs);
router.get('/me/leads', protect, authorize('college'), getCollegeLeads);

module.exports = router;
