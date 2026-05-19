import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

type AdminUser = {
    _id: unknown;
    name?: string;
    image?: string;
};

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const admin = await User.findOne({
            role: "admin",
            _id: { $ne: new mongoose.Types.ObjectId(session.user.id) },
        })
            .select("name image")
            .lean<AdminUser | null>();

        if (!admin) {
            return NextResponse.json({ error: "Chưa có tài khoản admin để nhắn tin." }, { status: 404 });
        }

        return NextResponse.json({
            id: String(admin._id),
            name: admin.name || "Admin An Cư Plus",
            avatar: admin.image || "",
        });
    } catch (error) {
        console.error("Get admin contact error:", error);
        return NextResponse.json({ error: "Không thể tải thông tin admin." }, { status: 500 });
    }
}
