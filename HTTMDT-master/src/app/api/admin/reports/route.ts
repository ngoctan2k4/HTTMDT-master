import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Report } from "@/models/Report";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { User } from "@/models/User";
import { Property } from "@/models/Property";

export const runtime = "nodejs";

export async function GET() {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        
        // Registration check to ensure populate works
        User.init();
        Property.init();

        const reports = await Report.find()
            .populate('reporterId', 'name email')
            .populate('propertyId', 'title status isHidden author')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(reports);
    } catch (err) {
        console.error("Admin Report API:", err);
        return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
    }
}
