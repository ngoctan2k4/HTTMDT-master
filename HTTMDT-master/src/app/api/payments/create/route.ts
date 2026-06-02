import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { PaymentTransaction } from "@/models/PaymentTransaction";
import { Voucher } from "@/models/Voucher";
import {
  buildVietQrImageUrl,
  calculateDiscountedPrice,
  createOrderCode,
  resolvePostPackage,
} from "@/lib/payments";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const pkg = resolvePostPackage(Number(body.amount || 1));
    const voucherCode = typeof body.voucherCode === "string"
      ? body.voucherCode.trim().toUpperCase()
      : "";

    await dbConnect();

    let voucher = null;
    if (voucherCode) {
      voucher = await Voucher.findOne({ code: voucherCode, isActive: true });
      if (!voucher) {
        return NextResponse.json({ error: "Ma giam gia khong ton tai hoac da khoa" }, { status: 400 });
      }
      if (voucher.expiryDate < new Date()) {
        return NextResponse.json({ error: "Ma giam gia da het han" }, { status: 400 });
      }
      if (voucher.maxUsage > 0 && voucher.usedCount >= voucher.maxUsage) {
        return NextResponse.json({ error: "Ma giam gia da het luot su dung" }, { status: 400 });
      }
    }

    const finalPrice = calculateDiscountedPrice(pkg.price, voucher);
    const bankId = process.env.PAYMENT_BANK_ID || "VCB";
    const bankAccountNumber = process.env.PAYMENT_BANK_ACCOUNT || "190088886666";
    const bankAccountName = process.env.PAYMENT_BANK_ACCOUNT_NAME || "AN CU PLUS VN";
    const orderCode = createOrderCode();
    const qrImageUrl = buildVietQrImageUrl({
      bankId,
      accountNumber: bankAccountNumber,
      accountName: bankAccountName,
      amount: finalPrice,
      orderCode,
    });

    const payment = await PaymentTransaction.create({
      userId: session.user.id,
      orderCode,
      packageName: pkg.name,
      amount: pkg.amount,
      originalPrice: pkg.price,
      finalPrice,
      voucherCode,
      paymentMethod: "vietqr",
      status: "pending",
      qrImageUrl,
      bankId,
      bankAccountNumber,
      bankAccountName,
      expiredAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: payment._id.toString(),
        orderCode: payment.orderCode,
        packageName: payment.packageName,
        amount: payment.amount,
        originalPrice: payment.originalPrice,
        finalPrice: payment.finalPrice,
        status: payment.status,
        qrImageUrl: payment.qrImageUrl,
        bankId: payment.bankId,
        bankAccountNumber: payment.bankAccountNumber,
        bankAccountName: payment.bankAccountName,
        expiredAt: payment.expiredAt,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Khong the tao thanh toan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
