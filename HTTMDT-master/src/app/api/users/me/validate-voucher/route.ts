import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Voucher } from "@/models/Voucher";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const code = body.code?.trim().toUpperCase();

        if (!code) {
            return NextResponse.json({ error: "Mã giảm giá không hợp lệ" }, { status: 400 });
        }

        await dbConnect();

        const voucher = await Voucher.findOne({ code: code, isActive: true });
        if (!voucher) {
            return NextResponse.json({ error: "Mã giảm giá không tồn tại hoặc đã khóa" }, { status: 400 });
        }
        if (voucher.expiryDate < new Date()) {
            return NextResponse.json({ error: "Mã giảm giá đã hết hạn" }, { status: 400 });
        }
        if (voucher.maxUsage > 0 && voucher.usedCount >= voucher.maxUsage) {
            return NextResponse.json({ error: "Mã giảm giá đã hết lượt sử dụng" }, { status: 400 });
        }

        return NextResponse.json({ 
            success: true, 
            discountType: voucher.discountType,
            discountValue: voucher.discountValue
        }, { status: 200 });

    } catch (e) {
        return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
    }
}
