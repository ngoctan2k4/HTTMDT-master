import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true, index: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: "Property" },
  },
  { timestamps: true }
);

favoriteSchema.index({ ownerId: 1, propertyId: 1 }, { unique: true });

export const Favorite =
  mongoose.models.Favorite || mongoose.model("Favorite", favoriteSchema);

