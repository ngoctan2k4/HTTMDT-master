import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Message } from "@/models/Message";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const resolvedParams = await params;

        await dbConnect();

        // Mark as read only if the current user is the receiver
        await Message.findOneAndUpdate(
            { _id: resolvedParams.id, receiverId: session.user.id },
            { isRead: true }
        );

        return NextResponse.json({ success: true });
    } catch(err) {
        return NextResponse.json({ error: "Fail" }, { status: 500 });
    }
}
