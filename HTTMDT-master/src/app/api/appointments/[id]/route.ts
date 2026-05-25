import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Appointment } from "@/models/Appointment";
import { auth } from "@/app/api/auth/[...nextauth]/route";

type AppointmentAction = "confirm" | "cancel";

function isAppointmentAction(action: unknown): action is AppointmentAction {
    return action === "confirm" || action === "cancel";
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
        }

        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Lịch hẹn không hợp lệ." }, { status: 400 });
        }

        const body = await req.json();
        const action = body?.action;
        if (!isAppointmentAction(action)) {
            return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
        }

        await dbConnect();

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return NextResponse.json({ error: "Không tìm thấy lịch hẹn." }, { status: 404 });
        }

        const userId = session.user.id;
        const isBuyer = appointment.buyerId === userId;
        const isSeller = appointment.sellerId === userId;

        if (!isBuyer && !isSeller) {
            return NextResponse.json({ error: "Bạn không có quyền xử lý lịch hẹn này." }, { status: 403 });
        }

        if (action === "confirm") {
            if (!isSeller) {
                return NextResponse.json({ error: "Chỉ chủ tin mới được xác nhận lịch hẹn." }, { status: 403 });
            }
            if (appointment.status !== "pending") {
                return NextResponse.json({ error: "Chỉ lịch hẹn đang chờ mới có thể xác nhận." }, { status: 400 });
            }
            if (appointment.appointmentDate <= new Date()) {
                return NextResponse.json({ error: "Lịch hẹn đã qua, không thể xác nhận." }, { status: 400 });
            }

            appointment.status = "confirmed";
            await appointment.save();

            return NextResponse.json({ success: true, status: appointment.status });
        }

        if (!["pending", "confirmed"].includes(appointment.status)) {
            return NextResponse.json({ error: "Lịch hẹn này đã kết thúc, không thể hủy." }, { status: 400 });
        }

        appointment.status = "cancelled";
        await appointment.save();

        return NextResponse.json({ success: true, status: appointment.status });
    } catch (error) {
        console.error("Appointment action error:", error);
        return NextResponse.json({ error: "Không thể xử lý lịch hẹn." }, { status: 500 });
    }
}
