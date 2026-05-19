import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        const user = (await User.findById(session.user.id).lean()) as any;
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        return NextResponse.json({
            userType: user.userType || "Khách hàng",
            isVerified: user.isVerified || false,
            bankInfo: user.bankInfo || { bankName: "", accountNumber: "", accountName: "" }
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { userType, bankName, accountNumber, accountName } = body;

        if (!["Khách hàng", "Chính chủ", "Môi giới"].includes(userType)) {
            return NextResponse.json({ error: "Loại tài khoản không hợp lệ" }, { status: 400 });
        }

        await dbConnect();
        
        const updateData: any = { userType };
        if (bankName !== undefined) {
            updateData.bankInfo = {
                bankName: bankName.trim(),
                accountNumber: accountNumber.trim(),
                accountName: accountName.trim()
            };
        }

        await User.findByIdAndUpdate(session.user.id, updateData);

        return NextResponse.json({ success: true, userType });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
