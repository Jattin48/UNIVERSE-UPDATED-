const express = require('express');
const router = express.Router();
const {
  getStudentProfile,
  updateStudentProfile,
  shortlistCollege,
  removeShortlistCollege,
  applyToCollege,
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('student'));

router.get('/me', getStudentProfile);
router.put('/me', updateStudentProfile);
router.post('/me/shortlist/:collegeId', shortlistCollege);
router.delete('/me/shortlist/:collegeId', removeShortlistCollege);
router.post('/me/apply/:collegeId', applyToCollege);

module.exports = router;
