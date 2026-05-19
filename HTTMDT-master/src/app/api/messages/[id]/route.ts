import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { Message } from "@/models/Message";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const mode = body?.mode === "everyone" ? "everyone" : "me";
        const userObjectId = new mongoose.Types.ObjectId(session.user.id);
        const messageObjectId = new mongoose.Types.ObjectId(id);

        await dbConnect();

        const message = await Message.findOne({
            _id: messageObjectId,
            $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
        });

        if (!message) {
            return NextResponse.json({ error: "Không tìm thấy tin nhắn." }, { status: 404 });
        }

        if (mode === "everyone") {
            if (String(message.senderId) !== session.user.id) {
                return NextResponse.json({ error: "Chỉ người gửi mới có thể gỡ tin nhắn cho cả hai bên." }, { status: 403 });
            }

            await Message.collection.updateOne(
                { _id: messageObjectId },
                { $set: { deletedForEveryone: true, deletedAt: new Date() } }
            );

            return NextResponse.json({ success: true, mode: "everyone" });
        }

        await Message.collection.updateOne({
            _id: messageObjectId,
        }, {
            $addToSet: { deletedFor: userObjectId },
            $set: { deletedAt: new Date() },
        });

        return NextResponse.json({ success: true, mode: "me" });
    } catch (error) {
        console.error("Delete message error:", error);
        return NextResponse.json({ error: "Không thể xóa tin nhắn." }, { status: 500 });
    }
}
