const StudentProfile = require('../models/StudentProfile');
const College = require('../models/College');

// @desc    Get logged in student profile
// @route   GET /api/students/me
// @access  Private (Student)
const getStudentProfile = async (req, res) => {
  try {
    let profile = await StudentProfile.findOne({ userId: req.user._id }).populate('shortlistedColleges');
    if (!profile) {
      profile = await StudentProfile.create({
        userId: req.user._id,
        name: req.user.email.split('@')[0],
      });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update logged in student profile
// @route   PUT /api/students/me
// @access  Private (Student)
const updateStudentProfile = async (req, res) => {
  try {
    const { name, phone, dob, class12, preferences } = req.body;

    let profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = new StudentProfile({ userId: req.user._id });
    }

    if (name !== undefined) profile.name = name;
    if (phone !== undefined) profile.phone = phone;
    if (dob !== undefined) profile.dob = dob;
    if (class12 !== undefined) profile.class12 = { ...profile.class12, ...class12 };
    if (preferences !== undefined) profile.preferences = { ...profile.preferences, ...preferences };

    const updatedProfile = await profile.save();
    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Shortlist a college
// @route   POST /api/students/me/shortlist/:collegeId
// @access  Private (Student)
const shortlistCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    let profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = await StudentProfile.create({ userId: req.user._id, name: req.user.email });
    }

    if (!profile.shortlistedColleges.includes(collegeId)) {
      profile.shortlistedColleges.push(collegeId);
      await profile.save();
    }

    const populated = await StudentProfile.findById(profile._id).populate('shortlistedColleges');
    res.json(populated.shortlistedColleges);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Remove college from shortlist
// @route   DELETE /api/students/me/shortlist/:collegeId
// @access  Private (Student)
const removeShortlistCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;
    let profile = await StudentProfile.findOne({ userId: req.user._id });

    if (profile) {
      profile.shortlistedColleges = profile.shortlistedColleges.filter(
        (id) => id.toString() !== collegeId.toString()
      );
      await profile.save();
    }

    const populated = await StudentProfile.findById(profile._id).populate('shortlistedColleges');
    res.json(populated ? populated.shortlistedColleges : []);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Apply / submit interest to a college
// @route   POST /api/students/me/apply/:collegeId
// @access  Private (Student)
const applyToCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const studentProfile = await StudentProfile.findOne({ userId: req.user._id });
    if (!studentProfile) {
      return res.status(400).json({ message: 'Please complete your student profile before applying' });
    }

    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    const alreadyApplied = college.interestedStudents.some(
      (item) => item.studentId && item.studentId.toString() === studentProfile._id.toString()
    );

    if (!alreadyApplied) {
      college.interestedStudents.push({ studentId: studentProfile._id, appliedAt: new Date() });
      await college.save();
    }

    res.json({ message: 'Application/Interest submitted successfully', collegeName: college.name });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  shortlistCollege,
  removeShortlistCollege,
  applyToCollege,
};
