import dbConnect from "@/lib/db";
import { Appointment } from "@/models/Appointment";
import { Property } from "@/models/Property";
import { User } from "@/models/User";
import AppointmentsTable from "./AppointmentsTable";

export const revalidate = 0;

export default async function AdminAppointmentsPage() {
    let appointments: any[] = [];

    try {
        await dbConnect();
        // Load relationships (we mock populate for buyer and property)
        appointments = await Appointment.find().sort({ appointmentDate: -1 }).populate({
            path: 'propertyId',
            model: Property,
            select: 'title price priceValue address'
        }).lean();

        // Also fetch user info for buyer and seller manually to ensure lean object serializes well
        const buyerIds = [...new Set(appointments.map(a => a.buyerId))];
        const sellerIds = [...new Set(appointments.map(a => a.sellerId))];
        const users = await User.find({ _id: { $in: [...buyerIds, ...sellerIds] } }).lean();
        
        const userMap = users.reduce((acc: any, cur: any) => {
            acc[cur._id.toString()] = { name: cur.name, email: cur.email, phone: cur.phone };
            return acc;
        }, {});

        appointments = appointments.map((a: any) => ({
            ...a,
            _id: a._id.toString(),
            propertyId: a.propertyId ? { ...a.propertyId, _id: a.propertyId._id.toString() } : null,
            buyerName: userMap[a.buyerId]?.name || "Khách Vô Danh",
            buyerPhone: userMap[a.buyerId]?.phone || "",
            buyerEmail: userMap[a.buyerId]?.email || "",
            sellerName: userMap[a.sellerId]?.name || "Chủ Nhà/Môi Giới",
            sellerPhone: userMap[a.sellerId]?.phone || "",
            sellerEmail: userMap[a.sellerId]?.email || "",
        }));

    } catch (error) {
        console.error("Lỗi lấy danh sách Lịch hẹn admin:", error);
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Trung tâm Giao dịch O2O</h2>
            <p className="text-sm text-muted-foreground mb-6">Quản trị các lịch hẹn xem nhà thực tế, giải quyết tranh chấp lừa đảo và liên hệ hỗ trợ người dùng.</p>
            
            {/* Vứt toàn bộ logic tương tác vào Client Component */}
            <AppointmentsTable initialData={appointments} />
        </div>
    );
}
