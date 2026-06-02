import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { PaymentTransaction } from "@/models/PaymentTransaction";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const payment = await PaymentTransaction.findById(id).lean() as any;
    if (!payment) {
      return NextResponse.json({ error: "Khong tim thay giao dich" }, { status: 404 });
    }

    if (payment.userId.toString() !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment._id.toString(),
        orderCode: payment.orderCode,
        amount: payment.amount,
        finalPrice: payment.finalPrice,
        status: payment.status,
        paidAt: payment.paidAt,
        confirmedBy: payment.confirmedBy,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Khong the kiem tra giao dich";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
