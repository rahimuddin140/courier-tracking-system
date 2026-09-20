const mongoose = require('mongoose');

let mongoMemoryServer = null;
let cachedPromise = null;

const connectDB = async () => {
  // If connection is already open, reuse it immediately (essential for serverless)
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  // If a connection attempt is currently in flight, await it
  if (cachedPromise) {
    return cachedPromise;
  }

  try {
    let uri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : '';

    if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
      console.log('⚠️  No valid MONGO_URI found in .env.');
      console.log('🔄 Starting in-memory MongoDB server for local preview & testing...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        uri = mongoMemoryServer.getUri();
        console.log('👉 Tip: To connect to MongoDB Atlas, add your connection string to MONGO_URI in .env');
      } catch (memErr) {
        console.error('❌ Failed to launch in-memory MongoDB:', memErr.message);
        throw new Error('Please provide a valid MONGO_URI in .env to connect to MongoDB Atlas.');
      }
    }

    cachedPromise = mongoose.connect(uri, {
      bufferCommands: false // Disable buffering so errors surface immediately if connection fails
    });

    const conn = await cachedPromise;
    if (mongoMemoryServer) {
      console.log(`✅ Connected to local MongoDB (Dev/Test mode): ${conn.connection.host}`);
    } else {
      console.log(`✅ Connected to MongoDB Atlas: ${conn.connection.host}`);
    }
    return conn;
  } catch (err) {
    cachedPromise = null;
    console.error('❌ MongoDB connection failed:', err.message);
    throw err;
  }
};

module.exports = connectDB;
