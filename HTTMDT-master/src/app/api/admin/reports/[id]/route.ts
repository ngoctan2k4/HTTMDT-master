import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Report } from "@/models/Report";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const resolvedParams = await params;

        const body = await req.json();
        const { status } = body;

        await dbConnect();
        await Report.findByIdAndUpdate(resolvedParams.id, { status });
        return NextResponse.json({ success: true });
    } catch(err) {
        return NextResponse.json({ error: "Fail" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const resolvedParams = await params;

        await dbConnect();
        await Report.findByIdAndDelete(resolvedParams.id);
        return NextResponse.json({ success: true });
    } catch(err) {
        return NextResponse.json({ error: "Fail" }, { status: 500 });
    }
}
