import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
        }

        const resolvedParams = await params;
        const { id } = resolvedParams;
        const body = await req.json();
        const { status, isHidden } = body;

        await dbConnect();

        const updateData: Record<string, any> = {};
        if (status !== undefined) updateData.status = status;
        if (isHidden !== undefined) updateData.isHidden = isHidden;

        const updatedProperty = await Property.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedProperty) {
            return NextResponse.json({ message: "Không tìm thấy bất động sản" }, { status: 404 });
        }

        return NextResponse.json({ message: "Cập nhật thành công", property: updatedProperty });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
        }

        const resolvedParams = await params;
        const { id } = resolvedParams;

        await dbConnect();

        const deletedProperty = await Property.findByIdAndDelete(id);

        if (!deletedProperty) {
            return NextResponse.json({ message: "Không tìm thấy bất động sản" }, { status: 404 });
        }

        return NextResponse.json({ message: "Xóa thành công" });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
