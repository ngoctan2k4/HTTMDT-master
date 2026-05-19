import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Appointment } from "@/models/Appointment";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: appointmentId } = await params;
        const session = await auth();
        
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ error: "Thao tác không được phép. Yêu cầu quyền Admin." }, { status: 403 });
        }

        const body = await req.json();
        const action = body.action; 

        await dbConnect();

        if (action === "cancel") {
            // Force cancel the appointment in O2O flow
            await Appointment.findByIdAndUpdate(appointmentId, { 
                status: "cancelled" 
            });
            return NextResponse.json({ success: true, message: "Đã ép hủy thành công giao dịch ảo/sai phạm." });
        } 
        
        if (action === "resolve_dispute") {
            // Dismiss fraud flag
            await Appointment.findByIdAndUpdate(appointmentId, { 
                isFraudReported: false 
            });
            return NextResponse.json({ success: true, message: "Đã bác bỏ Khiếu nại Lừa đảo đối với lịch hẹn này." });
        }

        return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });

    } catch (error) {
        console.error("Appointment Admin Action Error:", error);
        return NextResponse.json({ error: "Lỗi nội bộ hệ thống." }, { status: 500 });
    }
}
