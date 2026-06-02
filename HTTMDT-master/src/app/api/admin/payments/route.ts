import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { PaymentTransaction } from "@/models/PaymentTransaction";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 10)));
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    await dbConnect();

    const query: any = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { orderCode: { $regex: search, $options: "i" } },
        { bankReference: { $regex: search, $options: "i" } },
      ];
    }

    const [payments, totalPayments] = await Promise.all([
      PaymentTransaction.find(query)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      PaymentTransaction.countDocuments(query),
    ]);

    return NextResponse.json({
      payments,
      totalPages: Math.ceil(totalPayments / limit),
      totalPayments,
      currentPage: page,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Khong the tai giao dich";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
