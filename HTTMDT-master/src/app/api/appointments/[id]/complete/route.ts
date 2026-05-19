import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { Appointment } from "@/models/Appointment";
import { Property } from "@/models/Property";
import { auth } from "@/app/api/auth/[...nextauth]/route";

/**
 * Controller: Khách hàng xác nhận "Đã Xem Nhà" (O2O Completion & Review Module)
 * Theo yêu cầu: Sử dụng Mongoose Transactions để đảm bảo tính toàn vẹn.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    // 1. Kiểm tra xác thực User
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params object for Next.js 15+ dynamic route params
    const resolvedParams = await params;
    const appointmentId = resolvedParams.id;

    // 2. Tham số từ body (ví dụ từ Form Đánh Giá mà người mua gửi lên)
    const body = await req.json();
    const { rating, notes, isFraud } = body;

    await dbConnect();

    // 3. Khởi tạo Mongoose Session & Transaction
    const mongooseSession = await mongoose.startSession();
    mongooseSession.startTransaction();

    try {
      // 4a. Tìm Appointment và validate (Khóa lại cho transaction)
      const appointment = await Appointment.findById(appointmentId).session(mongooseSession);
      if (!appointment) {
        throw new Error("Lịch hẹn không tồn tại");
      }

      // Đảm bảo chỉ có Buyer của lịch hẹn này mới được bấm Confirm
      if (appointment.buyerId !== session.user.id) {
        throw new Error("Bạn không có quyền thực hiện hành động này");
      }

      // 4b. Cập nhật Appointment (Hoàn thành hẹn & Ghi nhận đánh giá)
      appointment.status = "completed";
      appointment.reviewStatus = "submitted";
      appointment.rating = rating;
      appointment.notes = notes;
      appointment.isFraudReported = isFraud === true;
      await appointment.save({ session: mongooseSession });

      // 5. Xử lý logic Fraud (Lừa đảo / Tin ảo)
      let needsAdminWarning = false;
      let propertyFlagsCount = 0;

      if (isFraud) {
        // Tìm Property liên quan và tăng số lượng Fraud Reports
        const property = await Property.findById(appointment.propertyId).session(mongooseSession);
        
        if (property) {
          property.fraudReports = (property.fraudReports || 0) + 1;
          propertyFlagsCount = property.fraudReports;

          // Ràng buộc: Nếu bị báo cáo >= 3 lần -> Flag Under Review
          if (property.fraudReports >= 3) {
            property.status = "under_review";
            needsAdminWarning = true;
          }
          await property.save({ session: mongooseSession });
        }
      }

      // 6. Commit Transaction thay vì auto-save đơn lẻ
      await mongooseSession.commitTransaction();
      mongooseSession.endSession();

      // 7. (Optional/Background) Gửi Email cho Admin nếu cần thiết
      if (needsAdminWarning) {
        // Pseudo-code System Alarm
        console.warn(`[SYSTEM ALERT] Property ${appointment.propertyId} has reached ${propertyFlagsCount} fraud reports. It is now Under Review.`);
        // await sendEmailToAdmin({ subject: "Canh bao tin tuc ao", id: appointment.propertyId });
      }

      return NextResponse.json({ 
        success: true, 
        message: "Cám ơn bạn đã xác nhận buổi xem nhà và gửi đánh giá thành công." 
      }, { status: 200 });

    } catch (transactionError) {
      // 8. Nếu quá trình update có lỗi (Database down, Validation fail, ...), Rollback tất cả
      await mongooseSession.abortTransaction();
      mongooseSession.endSession();
      throw transactionError; // Pass down to outter block
    }

  } catch (error) {
    console.error("Complete Appointment Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Lỗi máy chủ nội bộ. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
