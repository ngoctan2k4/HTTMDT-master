import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";
import { Message } from "@/models/Message";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Phải đăng nhập để thao tác" }, { status: 401 });
        }

        const body = await req.json();
        const { action } = body; // "request" | "confirm" | "reject"
        const { id: propertyId } = await params;

        await dbConnect();
        const property = await Property.findById(propertyId);
        
        if (!property) {
            return NextResponse.json({ error: "Bất động sản không tồn tại" }, { status: 404 });
        }

        const isOwner = property.ownerId === session.user.id;

        // Xử lý Khách hàng gửi báo cáo "Đã chuyển khoản cọc"
        if (action === "request") {
            if (isOwner) return NextResponse.json({ error: "Tham số không hợp lệ" }, { status: 400 });
            if (property.depositStatus !== "none") {
                return NextResponse.json({ error: "Bài đăng này đã có người đặt cọc" }, { status: 400 });
            }

            // Cập nhật trạng thái chờ xác nhận
            property.depositStatus = "pending_confirmation";
            property.depositBuyerId = session.user.id;
            await property.save();

            // Nhắn tin cho chủ nhà
            await Message.create({
                propertyId: property._id,
                senderId: session.user.id,
                receiverId: property.ownerId,
                content: "🔔 YÊU CẦU XÁC NHẬN CỌC: Khách báo đã chuyển tiền cọc cho bài đăng này. Xin vui lòng kiểm tra Thông báo/Tài khoản ngân hàng của bạn và Nhấn nút Xác nhận nếu đã nhận được tiền.",
                isRead: false
            });

            return NextResponse.json({ success: true, message: "Đã gửi thông báo cho chủ nhà" });
        }

        // Xử lý Chủ nhà Xác nhận hoặc Từ chối cọc
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
        return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
    }
}
