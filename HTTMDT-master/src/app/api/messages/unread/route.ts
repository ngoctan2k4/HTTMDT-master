import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { Message } from "@/models/Message";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

type LatestUnreadMessage = {
    _id: unknown;
    senderId?: { name?: string };
    content?: string;
    createdAt?: Date;
};

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ unreadCount: 0 }, { status: 200 });
        }

        await dbConnect();
        const userObjectId = new mongoose.Types.ObjectId(session.user.id);

        const unreadCount = await Message.countDocuments({
            receiverId: userObjectId,
            isRead: false,
            deletedFor: { $ne: userObjectId },
            deletedForEveryone: { $ne: true },
        });

        const latestUnread = await Message.findOne({
            receiverId: userObjectId,
            isRead: false,
            deletedFor: { $ne: userObjectId },
            deletedForEveryone: { $ne: true },
        })
            .populate("senderId", "name")
            .sort({ createdAt: -1 })
            .lean<LatestUnreadMessage | null>();

        return NextResponse.json({
            unreadCount,
            latest: latestUnread
                ? {
                    id: String(latestUnread._id),
                    senderName: latestUnread.senderId?.name || "Người dùng",
                    content: latestUnread.content || "",
                    createdAt: latestUnread.createdAt,
                }
                : null,
        });
    } catch (error) {
        console.error("Unread messages error:", error);
        return NextResponse.json({ unreadCount: 0 }, { status: 500 });
    }
}
