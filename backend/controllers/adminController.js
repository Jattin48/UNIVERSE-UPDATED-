const College = require('../models/College');

// @desc    Get pending college listings for moderation
// @route   GET /api/admin/colleges/pending
// @access  Private (Admin)
const getPendingColleges = async (req, res) => {
  try {
    const colleges = await College.find({ registrationStatus: 'pending' }).sort({ createdAt: -1 });
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get all colleges for admin overview
// @route   GET /api/admin/colleges
// @access  Private (Admin)
const getAllColleges = async (req, res) => {
  try {
    const colleges = await College.find({}).sort({ createdAt: -1 });
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Approve or reject college registration
// @route   PUT /api/admin/colleges/:id/status
// @access  Private (Admin)
const updateCollegeStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be approved, rejected, or pending' });
    }

    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ message: 'College listing not found' });
    }

    college.registrationStatus = status;
    const updated = await college.save();

    res.json({
      message: `College registration status updated to '${status}'`,
      college: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  getPendingColleges,
  getAllColleges,
  updateCollegeStatus,
};
