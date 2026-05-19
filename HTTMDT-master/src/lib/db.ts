import mongoose from "mongoose";

// Use MONGODB_URI from environment variables.
const MONGODB_URI = process.env.MONGODB_URI;

type MongooseGlobal = typeof globalThis & {
    mongoose?: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    };
};

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (globalThis as MongooseGlobal).mongoose;

if (!cached) {
    cached = (globalThis as MongooseGlobal).mongoose = { conn: null, promise: null };
}

const mongooseCache = cached;

async function dbConnect() {
    if (!MONGODB_URI) {
        throw new Error(
            "Please define the MONGODB_URI environment variable inside .env.local. If you are using MongoDB Atlas, it should look like: mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority"
        );
    }

    if (mongooseCache.conn) {
        return mongooseCache.conn;
    }

    if (!mongooseCache.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 10000, // Wait 10 seconds before failing
            tls: true, // Force TLS for MongoDB Atlas
        };

        mongooseCache.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        mongooseCache.conn = await mongooseCache.promise;
    } catch (e) {
        mongooseCache.promise = null;
        throw e;
    }

    return mongooseCache.conn;
}

export default dbConnect;
