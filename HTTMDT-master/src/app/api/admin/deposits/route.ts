import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";

        const query: any = { depositStatus: "deposited" };
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { address: { $regex: search, $options: "i" } }
            ];
        }

        const totalProperties = await Property.countDocuments(query);
        const properties = await Property.find(query)
            .sort({ postedDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // If possible, aggregate buyer info
        // We have depositBuyerId. It might be better to populate it, but Property schema doesn't have ref for it.

        return NextResponse.json({
            properties,
            totalProperties,
            totalPages: Math.ceil(totalProperties / limit),
            currentPage: page,
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
