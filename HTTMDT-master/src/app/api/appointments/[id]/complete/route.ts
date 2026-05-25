import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { Appointment } from "@/models/Appointment";
import { Property } from "@/models/Property";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: appointmentId } = await params;
    const body = await req.json();
    const { rating, notes, isFraud } = body;

    await dbConnect();

    const mongooseSession = await mongoose.startSession();
    mongooseSession.startTransaction();

    try {
      const appointment = await Appointment.findById(appointmentId).session(mongooseSession);
      if (!appointment) {
        throw new Error("Lịch hẹn không tồn tại");
      }

      if (appointment.buyerId !== session.user.id) {
        throw new Error("Bạn không có quyền thực hiện hành động này");
      }

      if (appointment.status !== "confirmed") {
        throw new Error("Chỉ lịch hẹn đã được chủ tin xác nhận mới có thể hoàn tất.");
      }

      if (appointment.appointmentDate > new Date()) {
        throw new Error("Chưa tới giờ hẹn, bạn chưa thể xác nhận đã xem nhà.");
      }

      const normalizedRating = Number(rating);
      if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
        throw new Error("Điểm đánh giá phải là số nguyên từ 1 đến 5.");
      }

      appointment.status = "completed";
      appointment.reviewStatus = "submitted";
      appointment.rating = normalizedRating;
      appointment.notes = notes;
      appointment.isFraudReported = isFraud === true;
      await appointment.save({ session: mongooseSession });

      let needsAdminWarning = false;
      let propertyFlagsCount = 0;

      if (isFraud) {
        const property = await Property.findById(appointment.propertyId).session(mongooseSession);

        if (property) {
          property.fraudReports = (property.fraudReports || 0) + 1;
          propertyFlagsCount = property.fraudReports;

          if (property.fraudReports >= 3) {
            property.status = "under_review";
            needsAdminWarning = true;
          }
          await property.save({ session: mongooseSession });
        }
      }

      await mongooseSession.commitTransaction();
      mongooseSession.endSession();

      if (needsAdminWarning) {
        console.warn(`[SYSTEM ALERT] Property ${appointment.propertyId} has reached ${propertyFlagsCount} fraud reports. It is now Under Review.`);
      }

      return NextResponse.json({
        success: true,
        message: "Cảm ơn bạn đã xác nhận buổi xem nhà và gửi đánh giá thành công.",
      }, { status: 200 });
    } catch (transactionError) {
      await mongooseSession.abortTransaction();
      mongooseSession.endSession();
      throw transactionError;
    }
  } catch (error) {
    console.error("Complete Appointment Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Lỗi máy chủ nội bộ. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
