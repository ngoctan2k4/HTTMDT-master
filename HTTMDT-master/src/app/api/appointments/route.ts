import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Appointment } from "@/models/Appointment";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { propertyId, sellerId, appointmentDate } = body;

        if (!propertyId || !sellerId || !appointmentDate) {
            return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
        }

        await dbConnect();

        // Kiểm tra xem đã có cuộc hẹn chờ xác nhận hoặc đã xác nhận cho property này bởi user này chưa.
        // Chỉ cho phép đặt 1 cuộc hẹn chưa xong.
        const existingAppointment = await Appointment.findOne({
            buyerId: session.user.id,
            propertyId: propertyId,
            status: { $in: ["pending", "confirmed"] }
        });

        if (existingAppointment) {
            return NextResponse.json({ error: "Bạn đã có 1 cuộc hẹn đang chờ với nhà này rồi." }, { status: 400 });
        }

        const appointment = new Appointment({
            buyerId: session.user.id,
            sellerId,
            propertyId,
            appointmentDate: new Date(appointmentDate),
            status: "pending"
        });

        await appointment.save();

        return NextResponse.json({ success: true, appointment }, { status: 201 });
    } catch (error) {
        console.error("Create Appointment Error:", error);
        return NextResponse.json(
            { error: "Lỗi máy chủ khi tạo cuộc hẹn." },
            { status: 500 }
        );
    }
}
