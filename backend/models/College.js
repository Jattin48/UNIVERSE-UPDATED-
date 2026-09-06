const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  duration: { type: String, default: '4 Years' },
  eligibility: { type: String, default: '50% in Class 12th' },
  annualFee: { type: Number, required: true },
  seats: { type: Number, default: 60 },
  cutoff: { type: Number, default: 60 },
});

const collegeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
    },
    location: {
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, default: 'India' },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere',
        default: [77.209, 28.6139], // Default Delhi coordinates
      },
    },
    type: {
      type: String,
      enum: ['Government', 'Private', 'Deemed'],
      default: 'Private',
    },
    affiliation: {
      type: String,
      default: 'UGC / AICTE',
    },
    registrationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    coursesOffered: [courseSchema],
    facilities: [{ type: String }],
    images: [{ type: String }],
    website: { type: String, default: '' },
    admissionProcess: { type: String, default: 'Merit-based & Entrance Test score' },
    documentsForVerification: [{ type: String }],
    rating: { type: Number, default: 4.0, min: 1, max: 5 },
    interestedStudents: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile' },
        appliedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

collegeSchema.index({ name: 'text', 'location.city': 'text', 'location.state': 'text' });

module.exports = mongoose.model('College', collegeSchema);
