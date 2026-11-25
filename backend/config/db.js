const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('MongoDB Connection Error: MONGODB_URI is not configured.');
    return null;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.message?.includes('ENOTFOUND')) {
      console.error(
        'MongoDB Connection Error: The MONGODB_URI host could not be resolved. ' +
        'Verify the Atlas cluster hostname and set a valid mongodb+srv:// URI in Render environment variables.'
      );
    } else {
      console.error(`MongoDB Connection Error: ${error.message}`);
    }
    // Note: We won't hard-exit process so server can still respond with clear error if DB is down
    return null;
  }
};

module.exports = connectDB;
