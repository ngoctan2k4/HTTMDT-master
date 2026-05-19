import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Report } from "@/models/Report";
import { Property } from "@/models/Property";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await auth();
        const body = await req.json();

        if (!body.reason) {
            return NextResponse.json({ error: "Vui lòng chọn lý do báo cáo." }, { status: 400 });
        }

        await dbConnect();

        // Check if property exists
        const propertyExists = await Property.exists({ _id: id });
        if (!propertyExists) {
            return NextResponse.json({ error: "Bất động sản không tồn tại." }, { status: 404 });
        }

        // To prevent spam, check if this user already reported this property Recently (within 24h)
        if (session?.user?.id) {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentReport = await Report.findOne({
                propertyId: id,
                reporterId: session.user.id,
                createdAt: { $gte: twentyFourHoursAgo }
            });

            if (recentReport) {
                return NextResponse.json({ error: "Bạn đã báo cáo tin đăng này gần đây rồi." }, { status: 429 });
            }
        }

        const newReport = new Report({
            propertyId: id,
            reporterId: session?.user?.id || null,
            reason: body.reason,
            details: body.details || "",
            status: "pending"
        });

        await newReport.save();

        return NextResponse.json({ success: true, message: "Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xử lý sớm nhất!" }, { status: 201 });
    } catch (e: any) {
        console.error("Report Error:", e);
        return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
    }
}
