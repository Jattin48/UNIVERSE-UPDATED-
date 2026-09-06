const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');
const College = require('./models/College');

dotenv.config();

const sampleColleges = [
  {
    email: 'admin@iitdelhi.ac.in',
    name: 'Indian Institute of Technology (IIT) Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    coordinates: [77.1928, 28.5449],
    type: 'Government',
    affiliation: 'Autonomous / MHRD',
    status: 'approved',
    rating: 4.9,
    facilities: ['Hostel', 'Library', 'Sports Complex', 'Research Labs', 'Wi-Fi', 'Auditorium'],
    courses: [
      { name: 'B.Tech Computer Science & Engineering', duration: '4 Years', annualFee: 220000, seats: 120, cutoff: 98 },
      { name: 'B.Tech Electrical Engineering', duration: '4 Years', annualFee: 220000, seats: 110, cutoff: 96 },
      { name: 'B.Tech Mechanical Engineering', duration: '4 Years', annualFee: 220000, seats: 100, cutoff: 94 },
    ],
  },
  {
    email: 'contact@bits-pilani.ac.in',
    name: 'BITS Pilani (Birla Institute of Technology & Science)',
    city: 'Pilani',
    state: 'Rajasthan',
    coordinates: [75.587, 28.3639],
    type: 'Private',
    affiliation: 'UGC / Deemed',
    status: 'approved',
    rating: 4.8,
    facilities: ['Hostel', 'Library', 'Innovation Lab', 'Sports', 'Swimming Pool', 'Wi-Fi'],
    courses: [
      { name: 'B.E. Computer Science', duration: '4 Years', annualFee: 520000, seats: 150, cutoff: 95 },
      { name: 'B.E. Electronics & Communication', duration: '4 Years', annualFee: 520000, seats: 120, cutoff: 92 },
      { name: 'BBA', duration: '3 Years', annualFee: 350000, seats: 80, cutoff: 85 },
    ],
  },
  {
    email: 'admissions@ststephens.edu',
    name: 'St. Stephen\'s College',
    city: 'New Delhi',
    state: 'Delhi',
    coordinates: [77.213, 28.687],
    type: 'Government',
    affiliation: 'University of Delhi (DU)',
    status: 'approved',
    rating: 4.7,
    facilities: ['Library', 'Hostel', 'Chapel', 'Sports Ground', 'Cafeteria'],
    courses: [
      { name: 'B.Sc Economics (Hons)', duration: '3 Years', annualFee: 65000, seats: 60, cutoff: 97 },
      { name: 'B.A. English (Hons)', duration: '3 Years', annualFee: 60000, seats: 50, cutoff: 96 },
      { name: 'B.Sc Mathematics (Hons)', duration: '3 Years', annualFee: 62000, seats: 55, cutoff: 95 },
    ],
  },
  {
    email: 'info@christuniversity.in',
    name: 'Christ University',
    city: 'Bengaluru',
    state: 'Karnataka',
    coordinates: [77.606, 12.934],
    type: 'Deemed',
    affiliation: 'UGC / Deemed University',
    status: 'approved',
    rating: 4.6,
    facilities: ['Hostel', 'Auditorium', 'Digital Library', 'Incubation Center', 'Gym'],
    courses: [
      { name: 'BBA Finance & Accountancy', duration: '3 Years', annualFee: 240000, seats: 180, cutoff: 88 },
      { name: 'BCA (Bachelor of Computer Applications)', duration: '3 Years', annualFee: 195000, seats: 120, cutoff: 86 },
      { name: 'B.Com Honours', duration: '3 Years', annualFee: 180000, seats: 200, cutoff: 87 },
    ],
  },
  {
    email: 'principal@srcc.edu',
    name: 'Shri Ram College of Commerce (SRCC)',
    city: 'New Delhi',
    state: 'Delhi',
    coordinates: [77.208, 28.691],
    type: 'Government',
    affiliation: 'University of Delhi (DU)',
    status: 'approved',
    rating: 4.9,
    facilities: ['Air Conditioned Classrooms', 'Library', 'Computer Center', 'Sports Complex'],
    courses: [
      { name: 'B.Com (Hons)', duration: '3 Years', annualFee: 45000, seats: 500, cutoff: 99 },
      { name: 'B.A. Economics (Hons)', duration: '3 Years', annualFee: 48000, seats: 160, cutoff: 98 },
    ],
  },
  {
    email: 'admin@apexengineering.edu',
    name: 'Apex Institute of Technology (Pending Verification)',
    city: 'Noida',
    state: 'Uttar Pradesh',
    coordinates: [77.391, 28.535],
    type: 'Private',
    affiliation: 'AKTU',
    status: 'pending',
    rating: 4.0,
    facilities: ['Hostel', 'Wi-Fi', 'Bus Service'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 Years', annualFee: 140000, seats: 60, cutoff: 75 },
    ],
  },
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universe');
    console.log('Connected to MongoDB for seeding...');

    await User.deleteMany({});
    await StudentProfile.deleteMany({});
    await College.deleteMany({});
    try {
      await College.collection.dropIndexes();
    } catch (e) {}

    console.log('Existing data cleared and indexes reset.');

    // 1. Create Admin User
    const adminUser = await User.create({
      email: 'admin@universe.com',
      password: 'adminpassword123',
      role: 'admin',
      isVerified: true,
    });
    console.log('Admin user created: admin@universe.com / adminpassword123');

    // 2. Create Sample Student User & Profile
    const studentUser = await User.create({
      email: 'student@example.com',
      password: 'studentpassword123',
      role: 'student',
      isVerified: true,
    });
    const studentProfile = await StudentProfile.create({
      userId: studentUser._id,
      name: 'Rahul Sharma',
      phone: '9876543210',
      class12: {
        board: 'CBSE',
        stream: 'Science',
        percentage: 92.5,
        yearOfPassing: 2025,
        subjects: ['Physics', 'Chemistry', 'Mathematics', 'English', 'Computer Science'],
      },
      preferences: {
        coursesInterested: ['B.Tech Computer Science & Engineering', 'B.E. Computer Science'],
        preferredLocations: ['Delhi', 'Bengaluru', 'Rajasthan'],
        budgetMin: 50000,
        budgetMax: 600000,
        collegeType: ['Government', 'Private'],
      },
      shortlistedColleges: [],
    });
    console.log('Student user created: student@example.com / studentpassword123');

    // 3. Create Colleges & Linked Users
    for (const c of sampleColleges) {
      const colUser = await User.create({
        email: c.email,
        password: 'collegepassword123',
        role: 'college',
        isVerified: true,
      });

      const col = await College.create({
        userId: colUser._id,
        name: c.name,
        location: {
          city: c.city,
          state: c.state,
          country: 'India',
          coordinates: c.coordinates,
        },
        type: c.type,
        affiliation: c.affiliation,
        registrationStatus: c.status,
        coursesOffered: c.courses,
        facilities: c.facilities,
        rating: c.rating,
        images: [
          'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1000&q=80',
        ],
        website: `https://${c.email.split('@')[1]}`,
        documentsForVerification: ['Affiliation_Certificate_2025.pdf', 'NAAC_Accreditation.pdf'],
        interestedStudents: c.status === 'approved' ? [{ studentId: studentProfile._id, appliedAt: new Date() }] : [],
      });

      if (c.status === 'approved' && studentProfile.shortlistedColleges.length < 2) {
        studentProfile.shortlistedColleges.push(col._id);
      }
    }

    await studentProfile.save();
    console.log('Colleges seeded successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
