import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// PATCH /api/admin/users/[id] - Update role or ban status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
        }

        const resolvedParams = await params;
        const { id } = resolvedParams;
        const body = await req.json();
        const { role, isBanned } = body;

        await dbConnect();

        const updateData: Record<string, any> = {};
        if (role !== undefined) updateData.role = role;
        if (isBanned !== undefined) updateData.isBanned = isBanned;

        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true }).select("-password");

        if (!updatedUser) {
            return NextResponse.json({ message: "Không tìm thấy người dùng" }, { status: 404 });
        }

        return NextResponse.json({ message: "Cập nhật thành công", user: updatedUser });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
