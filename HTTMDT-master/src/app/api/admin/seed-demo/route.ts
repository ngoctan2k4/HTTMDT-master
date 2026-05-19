import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";
import { Appointment } from "@/models/Appointment";
import { User } from "@/models/User";
import { Report } from "@/models/Report";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function POST() {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await dbConnect();

        // 1. Get or create some dummy users
        let users = await User.find({ role: { $ne: "admin" } }).limit(5);
        if (users.length < 1) {
            return NextResponse.json({ error: "Bạn cần đăng ký ít nhất 1 user thường để tạo dữ liệu." }, { status: 400 });
        }

        const fallbackUser = users[0];

        // Generate 15 pending properties for moderation
        const types = ["Chung cư", "Nhà đất", "Biệt thự"];
        const cities = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Bình Dương", "Cần Thơ", "Hải Phòng"];
        
        for (let i = 0; i < 15; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)] || fallbackUser;
            const randomCity = cities[Math.floor(Math.random() * cities.length)];
            
            // Random date in the last 30 days
            const randomPastDate = new Date();
            randomPastDate.setDate(randomPastDate.getDate() - Math.floor(Math.random() * 30));
            
            await Property.create({
                ownerId: randomUser._id,
                title: `[Demo] Bất động sản Kiểm Duyệt #${i}`,
                description: "Tin nhắn tự động test chức năng",
                price: `${(Math.random() * 10 + 2).toFixed(1)} Tỷ`,
                priceValue: Math.floor(Math.random() * 10) * 1e9 + 2e9,
                address: `Đường mẫu ${i}, ${randomCity}`,
                city: randomCity,
                type: "Mua bán",
                propertyType: types[i % 3],
                images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop"],
                area: 50 + i * 15,
                status: i < 5 ? "approved" : "approved",
                postedDate: randomPastDate
            });
        }

        // Get some properties
        const properties = await Property.find().limit(30);
        if (properties.length === 0) {
            return NextResponse.json({ error: "Thiếu dữ liệu BĐS" }, { status: 400 });
        }

        // --- MOCK REPORTS GENERATOR ---
        const reportReasons = ["Lừa đảo / Sai sự thật", "Giá ảo / Không đúng thực tế", "Bất động sản đã bán / Cho thuê", "Sai vị trí / Hình ảnh mượn"];
        await Report.deleteMany({}); // Delete old reports to keep clean
        
        for (let i = 0; i < 12; i++) {
            // Randomly attach 2-3 reports to 1 property to simulate mob flags
            const randomProp = properties[Math.floor(Math.random() * properties.length)];
            const randomReporter = users[Math.floor(Math.random() * users.length)] || fallbackUser;
            
            await Report.create({
                propertyId: randomProp._id,
                reporterId: randomReporter._id,
                reason: reportReasons[Math.floor(Math.random() * reportReasons.length)],
                details: "Đây là khiếu nại ảo được sinh ra tự động để Admin xem cách hiển thị.",
                status: "pending"
            });
        }

        // --- MOCK APPOINTMENTS GENERATOR ---
        const statuses = ["completed", "completed", "completed", "completed", "pending", "confirmed", "cancelled"];

        for(let i=0; i<60; i++) {
            const randomProp = properties[Math.floor(Math.random() * properties.length)];
            const randomBuyer = users[Math.floor(Math.random() * users.length)] || fallbackUser;
            let randomSeller = users[Math.floor(Math.random() * users.length)] || fallbackUser;

            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 30));
            pastDate.setHours(pastDate.getHours() - Math.floor(Math.random() * 10));

            // Occasionally create a fraud report
            const isFraud = Math.random() < 0.15;

            await Appointment.create({
                buyerId: randomBuyer._id,
                sellerId: randomSeller._id,
                propertyId: randomProp._id,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                appointmentDate: pastDate,
                isFraudReported: isFraud,
                updatedAt: pastDate
            });
        }

        return NextResponse.json({ success: true, message: "Dữ liệu mẫu đã được tạo thành công." });
    } catch (e) {
        console.error("Seed error", e);
        return NextResponse.json({ error: "Lỗi hệ thống", details: e }, { status: 500 });
    }
}
