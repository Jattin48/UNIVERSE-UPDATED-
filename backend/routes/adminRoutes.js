const express = require('express');
const router = express.Router();
const {
  getPendingColleges,
  getAllColleges,
  updateCollegeStatus,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/colleges/pending', getPendingColleges);
router.get('/colleges', getAllColleges);
router.put('/colleges/:id/status', updateCollegeStatus);

module.exports = router;
