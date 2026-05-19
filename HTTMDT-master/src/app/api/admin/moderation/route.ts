import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Report } from "@/models/Report";
import { Property } from "@/models/Property";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        await dbConnect();
        
        // Fetch all pending reports and populate the property details
        const pendingReports = await Report.find({ status: "pending" })
            .populate({
                path: "propertyId",
                select: "title images status author",
                populate: { path: "author", select: "name" }
            })
            .populate("reporterId", "name email")
            .sort({ createdAt: -1 })
            .lean();

        // Group reports by Property to show Admin a consolidated view
        const groupedReports: Record<string, any> = {};

        pendingReports.forEach((report: any) => {
            if (!report.propertyId) return; // Property might have been deleted
            
            const propId = report.propertyId._id.toString();
            if (!groupedReports[propId]) {
                groupedReports[propId] = {
                    propertyId: propId,
                    propertyTitle: report.propertyId.title,
                    propertyImage: report.propertyId.images?.[0] || "",
                    authorName: report.propertyId.author?.name || "Unknown",
                    propertyStatus: report.propertyId.status,
                    reports: []
                };
            }
            
            groupedReports[propId].reports.push({
                reportId: report._id,
                reason: report.reason,
                details: report.details,
                reporterName: report.reporterId?.name || "Khách Vô Danh",
                createdAt: report.createdAt
            });
        });

        const listings = Object.values(groupedReports);

        return NextResponse.json({ success: true, listings }, { status: 200 });
    } catch (error) {
        console.error("Moderation Fetch Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
