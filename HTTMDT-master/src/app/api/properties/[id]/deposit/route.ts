import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Phải đăng nhập để thao tác" }, { status: 401 });
        }

        const body = await req.json();
        const { action } = body;
        const { id: propertyId } = await params;

        await dbConnect();
        const property = await Property.findById(propertyId);

        if (!property) {
            return NextResponse.json({ error: "Bất động sản không tồn tại" }, { status: 404 });
        }

        const isOwner = property.ownerId === session.user.id;

        if (action === "request") {
            if (isOwner) return NextResponse.json({ error: "Tham số không hợp lệ" }, { status: 400 });
            if (property.depositStatus !== "none") {
                return NextResponse.json({ error: "Bài đăng này đã có người đặt cọc" }, { status: 400 });
            }

            property.depositStatus = "pending_confirmation";
            property.depositBuyerId = session.user.id;
            await property.save();

            return NextResponse.json({ success: true, message: "Đã ghi nhận yêu cầu cọc." });
        }

        if (action === "confirm" || action === "reject") {
            if (!isOwner) return NextResponse.json({ error: "Chỉ chủ nhà mới có quyền này" }, { status: 403 });
            if (property.depositStatus !== "pending_confirmation") {
                return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
            }

            property.depositStatus = action === "confirm" ? "deposited" : "none";
            if (action === "reject") {
                property.depositBuyerId = null;
            }
            await property.save();

            return NextResponse.json({ success: true, newStatus: property.depositStatus });
        }

        return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
    } catch (err) {
        console.error("Deposit action error:", err);
        return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
    }
}
