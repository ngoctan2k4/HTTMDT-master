import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";
import { Appointment } from "@/models/Appointment";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        // Middleware bảo mật: Chỉ Admin mới có quyền truy cập
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        await dbConnect();
        
        const url = new URL(req.url);
        let startDate: Date | undefined;
        let endDate: Date | undefined;
        
        if (url.searchParams.get("startDate") && url.searchParams.get("endDate")) {
            startDate = new Date(url.searchParams.get("startDate") as string);
            endDate = new Date(url.searchParams.get("endDate") as string);
        } else {
            // Default to past 30 days
            endDate = new Date();
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
        
        endDate.setHours(23, 59, 59, 999);
        startDate.setHours(0, 0, 0, 0);

        const dateFilter = { $gte: startDate, $lte: endDate };

        // 1. Tỉ lệ chuyển đổi O2O (Toàn thời gian)
        const totalProperties = await Property.countDocuments();
        const totalAppointments = await Appointment.countDocuments();
        const conversionRate = totalProperties > 0 ? ((totalAppointments / totalProperties) * 100).toFixed(2) : 0;

        // 2. Báo cáo thực địa: Tin ảo 24h
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const fraudReportsRaw = await Appointment.aggregate([
            { $match: { isFraudReported: true, updatedAt: { $gte: twentyFourHoursAgo } } },
            { $group: { _id: "$propertyId", reportsCount: { $sum: 1 } } }
        ]);
        const fraudulentListingsLast24h = fraudReportsRaw.length;

        // 3. Trọng số xác thực
        const propertyVerificationStats = await Property.aggregate([{ $group: { _id: "$isVerified", count: { $sum: 1 } } }]);
        let verifiedCount = 0; let unverifiedCount = 0;
        propertyVerificationStats.forEach(stat => {
            if (stat._id === true) verifiedCount = stat.count;
            else unverifiedCount += stat.count;
        });

        // 4. Heatmap locations
        const heatmapLocations = await Appointment.aggregate([
            { $lookup: { from: "properties", localField: "propertyId", foreignField: "_id", as: "propertyDetails" } },
            { $unwind: "$propertyDetails" },
            { $group: { _id: "$propertyDetails.city", appointmentCount: { $sum: 1 } } },
            { $sort: { appointmentCount: -1 } },
            { $limit: 10 }
        ]);

        // 5. Time-series data (Bar/Line Chart) for Posts and Revenue (GMV) by day
        // Property Posts By Day
        const propertiesByDayRaw = await Property.aggregate([
            { $match: { postedDate: dateFilter } },
            { $group: { 
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$postedDate" } },
                count: { $sum: 1 }
            } }
        ]);
        
        // Revenue (GMV) By Day from completed appointments
        const appointmentsByDayRaw = await Appointment.aggregate([
            { $match: { status: "completed", appointmentDate: dateFilter } },
            { $lookup: { from: "properties", localField: "propertyId", foreignField: "_id", as: "p" } },
            { $unwind: "$p" },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" } },
                gmv: { $sum: "$p.priceValue" } // assuming priceValue exists.
            } }
        ]);

        // Merge arrays into a single time-series dictionary keyed by date
        const timeSeriesMap: Record<string, { date: string, posts: number, gmv: number }> = {};
        
        // Initialize 0s for all dates in range
        for(let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            timeSeriesMap[dateStr] = { date: dateStr, posts: 0, gmv: 0 };
        }

        propertiesByDayRaw.forEach(p => { if (timeSeriesMap[p._id]) timeSeriesMap[p._id].posts = p.count; });
        appointmentsByDayRaw.forEach(a => { if (timeSeriesMap[a._id]) timeSeriesMap[a._id].gmv = a.gmv || 0; });
        
        const timeSeries = Object.values(timeSeriesMap).sort((a,b) => a.date.localeCompare(b.date));

        return NextResponse.json({
            success: true,
            data: {
                o2oConversion: { listings: totalProperties, appointments: totalAppointments, ratePercentage: conversionRate },
                moderationAlerts: { fraudulentListingsLast24h },
                verificationStatus: {
                    verified: verifiedCount, unverified: unverifiedCount,
                    verifiedRatioPercentage: totalProperties > 0 ? ((verifiedCount / totalProperties) * 100).toFixed(2) : 0
                },
                heatmapLocations,
                timeSeries
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Dashboard Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
