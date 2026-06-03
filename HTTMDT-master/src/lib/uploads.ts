import mongoose from "mongoose";
import dbConnect from "@/lib/db";

const UPLOADS_BUCKET_NAME = "uploads";

export async function getUploadsBucket() {
  const connection = await dbConnect();
  const db = connection.connection.db;

  if (!db) {
    throw new Error("MongoDB connection is not ready");
  }

  return new mongoose.mongo.GridFSBucket(db, { bucketName: UPLOADS_BUCKET_NAME });
}
