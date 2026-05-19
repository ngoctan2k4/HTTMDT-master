import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Setting } from "@/models/Setting";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

// Lấy danh sách settings
export async function GET() {
    try {
        const session = await auth();
        // Allow reading settings (like autoApprove) for posting properties as well
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        
        // Return settings as a key-value object
        const settings = await Setting.find({});
        const result = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, any>);

        return NextResponse.json(result);
    } catch(err) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

// Cập nhật settings
export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json(); // { key: 'autoApproveProperties', value: true }
        const { key, value } = body;

        if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

        await dbConnect();

        const updated = await Setting.findOneAndUpdate(
            { key },
            { value },
            { new: true, upsert: true }
        );

        return NextResponse.json({ success: true, setting: updated });
    } catch(err) {
        return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
    }
}
