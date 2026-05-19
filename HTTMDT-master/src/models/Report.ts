import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, 
    },
    reason: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["fraud", "spam", "availability", "other"],
      default: "other",
      index: true,
    },
    details: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "ignored"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);
