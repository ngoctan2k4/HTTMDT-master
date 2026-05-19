import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Report } from "@/models/Report";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
        }

        const body = await req.json();
        const { propertyId, reason, description } = body;

        if (!propertyId || !reason) {
            return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
        }

        await dbConnect();
        
        // Check if user already reported this property recently
        const existing = await Report.findOne({ propertyId, reporterId: session.user.id });
        if (existing) {
            return NextResponse.json({ error: "Bạn đã báo cáo tin này rồi." }, { status: 400 });
        }

        await Report.create({
            propertyId,
            reporterId: session.user.id,
            reason,
            description
        });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error("Report Error:", error);
        return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
    }
}
