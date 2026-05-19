import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const resolvedParams = await params;

        await dbConnect();

        const property = await Property.findOne({ _id: resolvedParams.id, ownerId: session.user.id });
        if (!property) return NextResponse.json({ error: "Not found or permission denied" }, { status: 404 });

        // Add 30 days from now
        const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        await Property.findByIdAndUpdate(resolvedParams.id, { expiryDate: newExpiry });

        return NextResponse.json({ success: true, expiryDate: newExpiry });
    } catch(err) {
        return NextResponse.json({ error: "Failed to renew" }, { status: 500 });
    }
}
