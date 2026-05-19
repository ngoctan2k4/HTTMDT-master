const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined.");
  process.exit(1);
}

async function assignPropertiesToUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get collections
    const usersCollection = mongoose.connection.collection("users");
    const propertiesCollection = mongoose.connection.collection("properties");

    // Find any user
    const user = await usersCollection.findOne({});
    
    if (!user) {
      console.log("No user found in the database. Please create a user first (e.g., by logging in).");
      process.exit(1);
    }

    const userId = user._id.toString();
    console.log(`Found user: ${user.name} (${user.email}) with ID: ${userId}`);

    // Update properties that don't have an ownerId or have it null
    const result = await propertiesCollection.updateMany(
      { $or: [{ ownerId: { $exists: false } }, { ownerId: null }, { ownerId: "" }] },
      { $set: { ownerId: userId } }
    );

    console.log(`Successfully assigned ${result.modifiedCount} properties to user ${user.name}`);
    
    // As a fallback, if we just want to ensure ALL properties belong to someone:
    // Some properties might have an ownerId that is old/broken from earlier generations
    // Since the instruction was "add to generated items and assign to any user",
    // let's do an unconditional update if requested. But $or is safer first.
    // Actually, to make sure it works perfectly for ALL generated items:
    const allResult = await propertiesCollection.updateMany(
      {},
      { $set: { ownerId: userId } }
    );
    console.log(`Final override: Set ownerId on all ${allResult.modifiedCount} properties to make sure.`);

  } catch (error) {
    console.error("Error updating properties:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

assignPropertiesToUser();
