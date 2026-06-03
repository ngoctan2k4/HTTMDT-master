import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Tính năng đặt cọc đã được tắt. Người mua và người bán tự thương lượng giao dịch với nhau." },
    { status: 410 }
  );
}
