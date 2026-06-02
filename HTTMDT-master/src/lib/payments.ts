import mongoose from "mongoose";
import { PaymentTransaction } from "@/models/PaymentTransaction";
import { User } from "@/models/User";
import { Voucher } from "@/models/Voucher";

export const PAYMENT_PACKAGES = [
  { amount: 1, price: 50000, name: "Goi le 1 tin" },
  { amount: 5, price: 220000, name: "Combo 5 tin" },
  { amount: 10, price: 400000, name: "Goi khoi nghiep" },
] as const;

export function resolvePostPackage(amount: number) {
  const normalizedAmount = Math.floor(Number(amount));
  if (!Number.isFinite(normalizedAmount) || normalizedAmount < 1 || normalizedAmount > 100) {
    throw new Error("So luong tin dang khong hop le");
  }

  const known = PAYMENT_PACKAGES.find((pkg) => pkg.amount === normalizedAmount);
  if (known) return known;

  return {
    amount: normalizedAmount,
    price: normalizedAmount * 50000,
    name: `Goi tuy chinh ${normalizedAmount} tin`,
  };
}

export function calculateDiscountedPrice(
  originalPrice: number,
  voucher?: { discountType: string; discountValue: number } | null
) {
  if (!voucher) return originalPrice;

  if (voucher.discountType === "percentage") {
    return Math.max(0, Math.round(originalPrice - (originalPrice * voucher.discountValue) / 100));
  }

  return Math.max(0, Math.round(originalPrice - voucher.discountValue));
}

export function createOrderCode() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `VCOIN_${yyyy}${mm}${dd}_${random}`;
}

export function buildVietQrImageUrl(params: {
  bankId: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  orderCode: string;
}) {
  const bankId = encodeURIComponent(params.bankId);
  const accountNumber = encodeURIComponent(params.accountNumber);
  const amount = encodeURIComponent(String(params.amount));
  const addInfo = encodeURIComponent(params.orderCode);
  const accountName = encodeURIComponent(params.accountName);

  return `https://img.vietqr.io/image/${bankId}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
}

export async function completePayment(params: {
  paymentId?: string;
  orderCode?: string;
  confirmedBy: "webhook" | "admin";
  bankReference?: string;
  webhookPayload?: unknown;
}) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const query = params.paymentId
      ? { _id: params.paymentId }
      : { orderCode: params.orderCode?.trim().toUpperCase() };

    const payment = await PaymentTransaction.findOne(query).session(session);
    if (!payment) {
      throw new Error("Khong tim thay giao dich thanh toan");
    }

    if (payment.status === "success") {
      await session.commitTransaction();
      return payment;
    }

    if (payment.status !== "pending") {
      throw new Error("Giao dich khong con o trang thai cho thanh toan");
    }

    payment.status = "success";
    payment.paidAt = new Date();
    payment.confirmedBy = params.confirmedBy;
    payment.bankReference = params.bankReference || payment.bankReference || "";
    payment.webhookPayload = params.webhookPayload ?? payment.webhookPayload ?? null;
    await payment.save({ session });

    await User.findByIdAndUpdate(
      payment.userId,
      { $inc: { purchasedPosts: payment.amount } },
      { session }
    );

    if (payment.voucherCode) {
      await Voucher.findOneAndUpdate(
        { code: payment.voucherCode },
        { $inc: { usedCount: 1 } },
        { session }
      );
    }

    await session.commitTransaction();
    return payment;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
