const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    dob: {
      type: Date,
    },
    class12: {
      board: { type: String, default: 'CBSE' },
      stream: { type: String, enum: ['Science', 'Commerce', 'Arts', 'Other'], default: 'Science' },
      percentage: { type: Number, min: 0, max: 100 },
      yearOfPassing: { type: Number },
      subjects: [{ type: String }],
    },
    preferences: {
      coursesInterested: [{ type: String }],
      preferredLocations: [{ type: String }],
      budgetMin: { type: Number, default: 0 },
      budgetMax: { type: Number, default: 1000000 },
      collegeType: [{ type: String }],
    },
    shortlistedColleges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'College',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
