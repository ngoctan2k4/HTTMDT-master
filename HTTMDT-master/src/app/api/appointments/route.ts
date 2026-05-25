import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Appointment } from "@/models/Appointment";
import { Property } from "@/models/Property";
import { auth } from "@/app/api/auth/[...nextauth]/route";

const APPOINTMENT_DURATION_MINUTES = 60;
const APPOINTMENT_DURATION_MS = APPOINTMENT_DURATION_MINUTES * 60 * 1000;

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { propertyId, appointmentDate } = body;

        if (!propertyId || !appointmentDate) {
            return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
        }

        await dbConnect();

        const property = await Property.findById(propertyId).lean();
        if (!property) {
            return NextResponse.json({ error: "Tin đăng không tồn tại." }, { status: 404 });
        }

        const sellerId = String((property as any).ownerId || "");
        if (!sellerId) {
            return NextResponse.json({ error: "Tin đăng này thiếu thông tin chủ tin." }, { status: 400 });
        }

        if (sellerId === session.user.id) {
            return NextResponse.json({ error: "Bạn không thể tự đặt lịch với tin của chính mình." }, { status: 400 });
        }

        const scheduledAt = new Date(appointmentDate);
        if (Number.isNaN(scheduledAt.getTime())) {
            return NextResponse.json({ error: "Thời gian hẹn không hợp lệ." }, { status: 400 });
        }

        if (scheduledAt <= new Date()) {
            return NextResponse.json({ error: "Thời gian hẹn phải ở tương lai." }, { status: 400 });
        }

        const existingAppointment = await Appointment.findOne({
            buyerId: session.user.id,
            propertyId,
            status: { $in: ["pending", "confirmed"] },
        });

        if (existingAppointment) {
            return NextResponse.json(
                { error: "Bạn đã có 1 cuộc hẹn đang chờ với nhà này rồi." },
                { status: 400 }
            );
        }

        const conflictWindowStart = new Date(scheduledAt.getTime() - APPOINTMENT_DURATION_MS);
        const conflictWindowEnd = new Date(scheduledAt.getTime() + APPOINTMENT_DURATION_MS);
        const conflictingAppointment = await Appointment.findOne({
            status: { $in: ["pending", "confirmed"] },
            appointmentDate: {
                $gt: conflictWindowStart,
                $lt: conflictWindowEnd,
            },
            $or: [
                { buyerId: session.user.id },
                { sellerId: session.user.id },
                { sellerId },
            ],
        }).lean();

        if (conflictingAppointment) {
            const conflict = conflictingAppointment as any;
            const currentUserBusy = conflict.buyerId === session.user.id || conflict.sellerId === session.user.id;
            const message = currentUserBusy
                ? "Bạn đã có lịch hẹn khác gần khung giờ này. Vui lòng chọn giờ cách ít nhất 60 phút."
                : "Chủ tin đã có lịch hẹn khác gần khung giờ này. Vui lòng chọn giờ cách ít nhất 60 phút.";

            return NextResponse.json({ error: message }, { status: 409 });
        }

        const appointment = new Appointment({
            buyerId: session.user.id,
            sellerId,
            propertyId,
            appointmentDate: scheduledAt,
            status: "pending",
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
