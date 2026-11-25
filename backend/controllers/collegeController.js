const College = require('../models/College');
const StudentProfile = require('../models/StudentProfile');

// Controller handles all college-related requests such as search, profile management,
// verification uploads, and lead tracking for a logged-in college account.

// @desc    Search and filter approved colleges
// @route   GET /api/colleges/search
// @access  Public
const searchColleges = async (req, res) => {
  try {
    const {
      course,
      budgetMin,
      budgetMax,
      city,
      state,
      type,
      minRating,
      searchQuery,
      longitude,
      latitude,
      maxDistanceKm,
    } = req.query;

    // Only show colleges that have already been approved by admin.
    let query = { registrationStatus: 'approved' };

    // Apply course filter using a case-insensitive text match.
    if (course) {
      query['coursesOffered.name'] = { $regex: new RegExp(course, 'i') };
    }

    // Filter by annual fee range if one or both bounds are provided.
    if (budgetMin || budgetMax) {
      query['coursesOffered.annualFee'] = {};
      if (budgetMin) query['coursesOffered.annualFee'].$gte = Number(budgetMin);
      if (budgetMax) query['coursesOffered.annualFee'].$lte = Number(budgetMax);
    }

    // Narrow results by city or state using partial matches.
    if (city) {
      query['location.city'] = { $regex: new RegExp(city, 'i') };
    }
    if (state) {
      query['location.state'] = { $regex: new RegExp(state, 'i') };
    }

    // Match multiple college types like Govt, Private, or Deemed.
    if (type) {
      const types = Array.isArray(type) ? type : type.split(',');
      query.type = { $in: types.map((t) => new RegExp(`^${t.trim()}$`, 'i')) };
    }

    // Minimum rating filter for quality-based search.
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    // Free-text search checks name, address, and offered courses together.
    if (searchQuery) {
      query.$or = [
        { name: { $regex: new RegExp(searchQuery, 'i') } },
        { 'location.city': { $regex: new RegExp(searchQuery, 'i') } },
        { 'location.state': { $regex: new RegExp(searchQuery, 'i') } },
        { 'coursesOffered.name': { $regex: new RegExp(searchQuery, 'i') } },
      ];
    }

    // Get colleges near the user's coordinates when geolocation is provided.
    if (longitude && latitude) {
      const distanceMeters = (Number(maxDistanceKm) || 50) * 1000;
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(longitude), Number(latitude)],
          },
          $maxDistance: distanceMeters,
        },
      };
    }

    const colleges = await College.find(query).sort({ rating: -1, createdAt: -1 });
    res.json(colleges);
  } catch (error) {
    console.error('College search error:', error);
    res.status(500).json({ message: error.message || 'Server error searching colleges' });
  }
};

// @desc    Get college details by ID
// @route   GET /api/colleges/:id
// @access  Public
const getCollegeById = async (req, res) => {
  try {
    // Fetch a single college profile by MongoDB document ID.
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }
    res.json(college);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get logged in college profile
// @route   GET /api/colleges/me
// @access  Private (College)
const getMyCollegeProfile = async (req, res) => {
  try {
    // Find the profile connected to this authenticated college user.
    let college = await College.findOne({ userId: req.user._id });

    // Auto-create a default college record if the college hasn't created one yet.
    if (!college) {
      college = await College.create({
        userId: req.user._id,
        name: 'My College',
        location: { city: 'New Delhi', state: 'Delhi', country: 'India', coordinates: [77.209, 28.6139] },
      });
    }

    res.json(college);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update logged in college profile
// @route   PUT /api/colleges/me
// @access  Private (College)
const updateMyCollegeProfile = async (req, res) => {
  try {
    const {
      name,
      location,
      type,
      affiliation,
      coursesOffered,
      facilities,
      images,
      website,
      admissionProcess,
    } = req.body;

    // Only the logged-in college can update its own listing.
    let college = await College.findOne({ userId: req.user._id });
    if (!college) {
      return res.status(404).json({ message: 'College listing not found' });
    }

    // Update only defined fields so partial profile edits remain supported.
    if (name !== undefined) college.name = name;
    if (location !== undefined) college.location = { ...college.location, ...location };
    if (type !== undefined) college.type = type;
    if (affiliation !== undefined) college.affiliation = affiliation;
    if (coursesOffered !== undefined) college.coursesOffered = coursesOffered;
    if (facilities !== undefined) college.facilities = facilities;
    if (images !== undefined) college.images = images;
    if (website !== undefined) college.website = website;
    if (admissionProcess !== undefined) college.admissionProcess = admissionProcess;

    const updated = await college.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Upload / add verification documents
// @route   POST /api/colleges/me/documents
// @access  Private (College)
const uploadVerificationDocs = async (req, res) => {
  try {
    // The request contains a list of verification files or document references.
    const { documents } = req.body; // Array of document URLs or names
    let college = await College.findOne({ userId: req.user._id });
    if (!college) {
      return res.status(404).json({ message: 'College profile not found' });
    }

    // Append submitted documents to the existing verification list.
    if (Array.isArray(documents)) {
      college.documentsForVerification = [...college.documentsForVerification, ...documents];
      await college.save();
    }

    res.json({
      message: 'Verification documents submitted. Status remains pending until Admin review.',
      registrationStatus: college.registrationStatus,
      documents: college.documentsForVerification,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get student leads interested in this college
// @route   GET /api/colleges/me/leads
// @access  Private (College)
const getCollegeLeads = async (req, res) => {
  try {
    // Populate each interested student with key profile fields for quick lead review.
    const college = await College.findOne({ userId: req.user._id }).populate({
      path: 'interestedStudents.studentId',
      select: 'name phone class12 preferences',
    });

    if (!college) {
      return res.status(404).json({ message: 'College profile not found' });
    }

    res.json(college.interestedStudents || []);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  searchColleges,
  getCollegeById,
  getMyCollegeProfile,
  updateMyCollegeProfile,
  uploadVerificationDocs,
  getCollegeLeads,
};
