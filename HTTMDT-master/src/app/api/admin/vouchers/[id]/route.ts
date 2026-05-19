import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Voucher } from "@/models/Voucher";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        await dbConnect();

        const updated = await Voucher.findByIdAndUpdate(id, body, { new: true });
        if (!updated) {
            return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, voucher: updated });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Lỗi hệ thống" }, { status: 500 });
    }
}
