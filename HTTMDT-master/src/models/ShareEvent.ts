import mongoose from "mongoose";

const shareEventSchema = new mongoose.Schema(
  {
    propertyId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: "Property" },
    ownerId: { type: String, index: true },
    method: { type: String }, // native | copy | unknown
  },
  { timestamps: true }
);

export const ShareEvent =
  mongoose.models.ShareEvent || mongoose.model("ShareEvent", shareEventSchema);

