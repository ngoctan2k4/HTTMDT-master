const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function testConnection() {
  console.log("Testing MongoDB connection to:", MONGODB_URI.split("@")[1]);
  try {
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      tls: true,
    });
    console.log("SUCCESS: Connected to MongoDB Atlas!");
    process.exit(0);
  } catch (error) {
    console.error("FAILED to connect to MongoDB Atlas:");
    console.error(error.message);
    process.exit(1);
  }
}

testConnection();
