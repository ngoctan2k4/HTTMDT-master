import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";
import { User } from "@/models/User";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await auth();
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
        }

        await dbConnect();

        // Thống kê Users
        const totalUsersCount = await User.countDocuments();
        
        // Thống kê Bất động sản
        const totalProperties = await Property.countDocuments();
        const activeProperties = await Property.countDocuments({ status: "approved", isHidden: { $ne: true } });
        const pendingProperties = await Property.countDocuments({ status: "pending" });
        
        // Tin đăng gần đây (5 tin mới nhất)
        const recentProperties = await Property.find()
            .sort({ postedDate: -1 })
            .select("title author status postedDate")
            .limit(5)
            .lean();

        // Format lại dữ liệu recent properties
        const formattedRecent = recentProperties.map((p: Record<string, any>) => ({
            id: String(p._id),
            title: p.title,
            authorName: p.author?.name || "Ẩn danh",
            status: p.status,
            postedDate: p.postedDate
        }));

        // Tạo biểu đồ cho 7 ngày qua
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 6);
        dateLimit.setHours(0, 0, 0, 0);

        const propertiesByDay = await Property.aggregate([
            { $match: { postedDate: { $gte: dateLimit } } },
            { 
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$postedDate" } },
                    count: { $sum: 1 }
                }
            }
        ]);

        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const displayDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            const yyyymmdd = d.toISOString().split('T')[0];
            
            const found = propertiesByDay.find(p => p._id === yyyymmdd);
            chartData.push({
                name: displayDate,
                "Tin đăng mới": found ? found.count : 0
            });
        }

        return NextResponse.json({
            users: {
                total: totalUsersCount,
                trend: "+5%" // Mock trend cho đơn giản
            },
            properties: {
                total: totalProperties,
                active: activeProperties,
                pending: pendingProperties
            },
            recentProperties: formattedRecent,
            chartData
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
