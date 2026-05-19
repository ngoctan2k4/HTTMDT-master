import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Voucher } from "@/models/Voucher";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";

        await dbConnect();

        const query: any = {};
        if (search) {
            query.code = { $regex: search, $options: "i" };
        }

        const vouchers = await Voucher.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const totalVouchers = await Voucher.countDocuments(query);

        return NextResponse.json({
            vouchers,
            totalPages: Math.ceil(totalVouchers / limit),
            totalVouchers,
        });
    } catch (e) {
        return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { code, discountType, discountValue, maxUsage, expiryDate } = body;

        await dbConnect();

        const existingVoucher = await Voucher.findOne({ code: code.toUpperCase() });
        if (existingVoucher) {
            return NextResponse.json({ error: "Mã giảm giá đã tồn tại" }, { status: 400 });
        }

        const voucher = await Voucher.create({
            code: code.toUpperCase(),
            discountType,
            discountValue: Number(discountValue),
            maxUsage: Number(maxUsage) || 0,
            expiryDate: new Date(expiryDate),
            isActive: true,
        });

        return NextResponse.json({ voucher }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Lỗi hệ thống" }, { status: 500 });
    }
}
