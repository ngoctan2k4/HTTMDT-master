import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false, // Required for credentials, but non-essential for OAuth
      select: false, // Don't return password by default on queries
    },
    image: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false, // Default unverified
    },
    userType: {
      type: String,
      enum: ["Khách hàng", "Chính chủ", "Môi giới"],
      default: "Khách hàng",
    },
    bankInfo: {
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      accountName: { type: String, default: "" },
    },
    reputationScore: {
      type: Number,
      default: 0,
    },
    // Tracing Posting Activity/Quotas
    usedFreePosts: {
      type: Number,
      default: 0,
    },
    purchasedPosts: {
      type: Number,
      default: 0,
    },
    registrationIp: {
      type: String,
      default: "",
    },
    // Required NextAuth fields when using Database Sessions
    emailVerified: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
