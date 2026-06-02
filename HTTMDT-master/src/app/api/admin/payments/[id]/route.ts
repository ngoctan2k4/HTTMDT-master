import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { PaymentTransaction } from "@/models/PaymentTransaction";
import { completePayment } from "@/lib/payments";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    await dbConnect();

    if (body.action === "confirm") {
      const payment = await completePayment({
        paymentId: id,
        confirmedBy: "admin",
        bankReference: typeof body.bankReference === "string" ? body.bankReference : "",
      });
      return NextResponse.json({ success: true, payment });
    }

    if (body.action === "fail") {
      const payment = await PaymentTransaction.findOneAndUpdate(
        { _id: id, status: "pending" },
        { status: "failed" },
        { new: true }
      );
      if (!payment) {
        return NextResponse.json({ error: "Khong tim thay giao dich dang cho" }, { status: 404 });
      }
      return NextResponse.json({ success: true, payment });
    }

    return NextResponse.json({ error: "Hanh dong khong hop le" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Khong the cap nhat giao dich";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
