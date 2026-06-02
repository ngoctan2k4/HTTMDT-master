import mongoose from "mongoose";

const paymentTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    packageName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    finalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    voucherCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      enum: ["vietqr", "bank", "manual", "demo"],
      default: "vietqr",
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "expired"],
      default: "pending",
      index: true,
    },
    qrImageUrl: {
      type: String,
      default: "",
    },
    bankId: {
      type: String,
      default: "",
      trim: true,
    },
    bankAccountNumber: {
      type: String,
      default: "",
      trim: true,
    },
    bankAccountName: {
      type: String,
      default: "",
      trim: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    expiredAt: {
      type: Date,
      default: null,
    },
    bankReference: {
      type: String,
      default: "",
      trim: true,
    },
    webhookPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    confirmedBy: {
      type: String,
      enum: ["webhook", "admin", ""],
      default: "",
    },
  },
  { timestamps: true }
);

export const PaymentTransaction =
  mongoose.models.PaymentTransaction ||
  mongoose.model("PaymentTransaction", paymentTransactionSchema);
