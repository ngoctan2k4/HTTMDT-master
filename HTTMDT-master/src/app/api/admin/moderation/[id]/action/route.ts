import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Report } from "@/models/Report";
import { Property } from "@/models/Property";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: propertyId } = await params;
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        const body = await req.json();
        const action = body.action; // "ignore" or "ban"

        await dbConnect();

        if (action === "ignore") {
            // Dismiss all pending reports for this property
            await Report.updateMany({ propertyId, status: "pending" }, { status: "ignored" });
            return NextResponse.json({ success: true, message: "Đã xóa toàn bộ báo cáo của Bất động sản này." });
        } 
        
        if (action === "ban") {
            // Ban property and mark reports as resolved
            await Property.findByIdAndUpdate(propertyId, { status: "rejected" });
            await Report.updateMany({ propertyId, status: "pending" }, { status: "resolved" });
            return NextResponse.json({ success: true, message: "Đã KHÓA BĐS này thành công." });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("Moderation Action Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
