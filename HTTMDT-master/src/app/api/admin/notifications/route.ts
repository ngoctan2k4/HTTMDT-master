import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { Property } from "@/models/Property";
import { Report } from "@/models/Report";
import { Appointment } from "@/models/Appointment";

export const runtime = "nodejs";

export async function GET() {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const [
            pendingProperties,
            reviewProperties,
            pendingReports,
            pendingSpamReports,
            pendingFraudReports,
            pendingAppointments,
        ] = await Promise.all([
            Property.countDocuments({
                status: { $in: ["pending", "pending_verification"] },
                isHidden: { $ne: true },
            }),
            Property.countDocuments({
                $or: [{ status: "under_review" }, { isHidden: true }],
            }),
            Report.countDocuments({ status: "pending" }),
            Report.countDocuments({ status: "pending", category: "spam" }),
            Report.countDocuments({ status: "pending", category: "fraud" }),
            Appointment.countDocuments({ status: "pending" }),
        ]);

        const notifications = {
            properties: pendingProperties,
            moderation: reviewProperties + pendingFraudReports,
            reports: pendingReports,
            reportSpam: pendingSpamReports,
            appointments: pendingAppointments,
        };

        const total =
            notifications.properties +
            notifications.moderation +
            notifications.reports +
            notifications.appointments;

        return NextResponse.json({
            notifications,
            detail: {
                pendingProperties,
                reviewProperties,
                pendingReports,
                pendingSpamReports,
                pendingFraudReports,
                pendingAppointments,
            },
            total,
        });
    } catch (error) {
        console.error("Admin notifications error:", error);
        return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
    }
}
