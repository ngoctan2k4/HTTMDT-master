import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { Voucher } from "@/models/Voucher";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let amount = 1;
        let voucherCode = "";

        try {
            const body = await req.json();
            if (body && typeof body.amount === 'number' && body.amount > 0) {
                amount = body.amount;
            }
            if (body && typeof body.voucherCode === 'string') {
                voucherCode = body.voucherCode.trim().toUpperCase();
            }
        } catch(e) {
            // body is not required if just default 1
        }

        await dbConnect();
        
        // Handle Voucher
        const validationMessage = [];
        if (voucherCode) {
            const voucher = await Voucher.findOne({ code: voucherCode, isActive: true });
            if (!voucher) {
                return NextResponse.json({ error: "Mã giảm giá không tồn tại hoặc đã bị khóa" }, { status: 400 });
            }
            if (voucher.expiryDate < new Date()) {
                return NextResponse.json({ error: "Mã giảm giá đã hết hạn" }, { status: 400 });
            }
            if (voucher.maxUsage > 0 && voucher.usedCount >= voucher.maxUsage) {
                return NextResponse.json({ error: "Mã giảm giá đã hết lượt sử dụng" }, { status: 400 });
            }
            
            // Increment usage
            await Voucher.findByIdAndUpdate(voucher._id, { $inc: { usedCount: 1 } });
            validationMessage.push(`Áp dụng thành công mã giảm giá ${voucherCode}`);
        }

        // Cấp thêm số lượt mua (giả lập thanh toán thành công)
        await User.findByIdAndUpdate(session.user.id, { $inc: { purchasedPosts: amount } });

        return NextResponse.json({ 
            success: true, 
            message: `Thanh toán thành công ${amount} lượt. ${validationMessage.join(" ")}`.trim() 
        }, { status: 200 });
    } catch (e) {
        return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
    }
}
