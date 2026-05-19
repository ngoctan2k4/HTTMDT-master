import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
        }

        const body = await req.json();
        const { action } = body; // "complete" or "cancel"
        const { id } = await params;
        
        await dbConnect();
        const property = await Property.findById(id);
        
        if (!property) {
            return NextResponse.json({ message: "Không tìm thấy Bất động sản" }, { status: 404 });
        }

        if (action === "complete") {
            // Hoàn tất giao dịch: Đóng tin, đánh dấu đã hoàn tất (ẩn khỏi tìm kiếm)
            property.isHidden = true;
            // Optionally set sold status if supported, but isHidden is enough
        } else if (action === "cancel") {
            // Hủy giao dịch: Xóa trạng thái cọc, mở lại tin
            property.depositStatus = "none";
            property.depositBuyerId = null;
            // Ensure visibility
            property.isHidden = false;
        } else {
            return NextResponse.json({ message: "Hành động không hợp lệ" }, { status: 400 });
        }

        await property.save();

        return NextResponse.json({ success: true, message: action === "complete" ? "Đã đóng tin giao dịch" : "Đã hủy cọc, tin được mở lại" });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
