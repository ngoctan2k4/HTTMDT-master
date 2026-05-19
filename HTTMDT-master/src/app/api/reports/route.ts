import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Report } from "@/models/Report";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

function getReportCategory(reason: string) {
    const normalized = reason
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();

    if (/(spam|tin rac|quang cao|lap lai|dang trung|noi dung rac)/.test(normalized)) {
        return "spam";
    }

    if (/(da ban|da cho thue|het hang|khong con|khong kha dung)/.test(normalized)) {
        return "availability";
    }

    if (/(lua dao|sai su that|gia ao|sai vi tri|hinh anh muon|vi pham)/.test(normalized)) {
        return "fraud";
    }

    return "other";
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
        }

        const body = await req.json();
        const { propertyId, reason, description, details } = body;

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
            category: getReportCategory(reason),
            details: details || description || "",
            description: description || details || ""
        });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error("Report Error:", error);
        return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
    }
}
