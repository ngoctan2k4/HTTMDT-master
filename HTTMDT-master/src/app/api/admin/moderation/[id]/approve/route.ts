import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";
import { User } from "@/models/User";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        const resolvedParams = await params;
        const propertyId = resolvedParams.id;

        await dbConnect();
        
        // Mongoose Session/Transaction support for atomicity
        const mongooseSession = await mongoose.startSession();
        mongooseSession.startTransaction();

        try {
            const property = await Property.findById(propertyId).session(mongooseSession);
            if (!property) {
                throw new Error("Không tìm thấy tin đăng này.");
            }

            // Theo logic: Admin bấm duyệt -> cấp nhãn isVerified: true, status -> approved
            property.isVerified = true;
            property.status = "approved";
            // Kèm reset fraud if under_review was cleared
            property.fraudReports = 0; 
            await property.save({ session: mongooseSession });

            // Cộng điểm uy tín cho User (Chủ nhà/Môi giới đăng tin)
            const ownerId = property.ownerId; // Giả sử ID gốc lưu ở mảng này
            if (ownerId) {
                // Tăng 10 điểm uy tín sau khi bài được verify thành công
                await User.findByIdAndUpdate(
                    ownerId,
                    { $inc: { reputationScore: 10 } },
                    { session: mongooseSession }
                );
            }

            await mongooseSession.commitTransaction();
            mongooseSession.endSession();

            // NOTE: Thông báo Realtime cho User
            // Trong kiến trúc Serverless (Next.js), việc duy trì kết nối Socket.io thuần túy 
            // có thể không ổn định. Có thể tích hợp qua hệ thống Pub/Sub như Pusher:
            // await pusherServer.trigger(`user-${ownerId}`, "notification:verified", {
            //     message: `Tin đăng ${property.title} của bạn đã được kiểm duyệt hợp lệ! +10 Uy tín.`
            // });

            return NextResponse.json({ 
                success: true, 
                message: "Đã phê duyệt tin đăng. Cộng điểm uy tín và đánh dấu Xác Thực thành công." 
            }, { status: 200 });

        } catch (transactionError: any) {
            await mongooseSession.abortTransaction();
            mongooseSession.endSession();
            throw transactionError;
        }

    } catch (error: any) {
        console.error("Moderation Approval Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
