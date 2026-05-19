import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { Message } from "@/models/Message";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function DELETE(_: Request, { params }: { params: Promise<{ peerId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { peerId } = await params;
        const userObjectId = new mongoose.Types.ObjectId(session.user.id);
        const peerObjectId = new mongoose.Types.ObjectId(peerId);

        await dbConnect();

        await Message.collection.updateMany(
            {
                deletedForEveryone: { $ne: true },
                $or: [
                    { senderId: userObjectId, receiverId: peerObjectId },
                    { senderId: peerObjectId, receiverId: userObjectId },
                ],
            },
            {
                $addToSet: { deletedFor: userObjectId },
                $set: { deletedAt: new Date() },
            }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete conversation error:", error);
        return NextResponse.json({ error: "Không thể xóa cuộc trò chuyện." }, { status: 500 });
    }
}
