import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Report } from "@/models/Report";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { User } from "@/models/User";
import { Property } from "@/models/Property";

export const runtime = "nodejs";

function getReportCategory(reason?: string) {
    const normalized = (reason || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();

    if (/(spam|tin rac|quang cao|lap lai|dang trung|noi dung rac)/.test(normalized)) {
        return "spam";
    }

    if (/(da ban|da cho thue|het hang|khong con|khong kha dung)/.test(normalized)) {
        return "availability";
    }

    if (/(lua dao|sai su that|gia ao|sai vi tri|hinh anh muon|vi pham)/.test(normalized)) {
        return "fraud";
    }

    return "other";
}

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

        return NextResponse.json(
            reports.map((report) => {
                const inferredCategory = getReportCategory(report.reason);

                return {
                    ...report,
                    category:
                        !report.category || (report.category === "other" && inferredCategory !== "other")
                            ? inferredCategory
                            : report.category,
                };
            })
        );
    } catch (err) {
        console.error("Admin Report API:", err);
        return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
    }
}
