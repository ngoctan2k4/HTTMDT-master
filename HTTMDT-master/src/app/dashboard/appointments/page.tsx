import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import { Appointment } from "@/models/Appointment";
import { Property } from "@/models/Property";
import { User } from "@/models/User";
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Home, FileText, UserCircle, Phone } from "lucide-react";
import Link from "next/link";
import React from "react";
import { AppointmentActionButtons } from "@/components/appointments/AppointmentActionButtons";

export const metadata = {
    title: "Quản lý Lịch hẹn",
};

export const revalidate = 0;

export default async function AppointmentsPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    await dbConnect();
    Property.init();

    const appointmentsRaw = await Appointment.find({
        $or: [
            { buyerId: session.user.id },
            { sellerId: session.user.id },
        ],
    }).populate("propertyId").sort({ appointmentDate: -1 }).lean();

    const participantIds = [
        ...new Set(
            appointmentsRaw
                .flatMap((app: any) => [app.buyerId, app.sellerId])
                .filter(Boolean)
                .map(String)
        ),
    ];

    const users = await User.find({ _id: { $in: participantIds } }).select("name email phone image").lean();
    const userMap = users.reduce((acc: Record<string, any>, user: any) => {
        acc[user._id.toString()] = {
            name: user.name,
            email: user.email,
            phone: user.phone,
            image: user.image,
        };
        return acc;
    }, {});

    const appointments = appointmentsRaw.map((app: any) => ({
        _id: app._id.toString(),
        buyerId: String(app.buyerId),
        sellerId: String(app.sellerId),
        buyer: userMap[String(app.buyerId)] || null,
        seller: userMap[String(app.sellerId)] || null,
        status: app.status,
        appointmentDate: app.appointmentDate?.toISOString(),
        property: app.propertyId ? {
            _id: app.propertyId._id.toString(),
            title: app.propertyId.title,
            address: app.propertyId.address,
            images: app.propertyId.images || [],
            price: app.propertyId.price,
        } : null,
    }));

    return (
        <div className="container max-w-5xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-primary" />
                        Quản lý Lịch Hẹn
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Theo dõi lịch xem nhà giữa khách hẹn xem và chủ tin. Hai bên sẽ cùng thấy một ngày giờ hẹn.
                    </p>
                </div>
            </div>

            {appointments.length === 0 ? (
                <div className="bg-white border rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                        <Calendar className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có lịch hẹn nào</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                        Bạn chưa lên lịch xem bất động sản nào, hoặc chưa có khách hẹn xem tin đăng của bạn.
                    </p>
                    <Link
                        href="/search"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-full font-medium transition-colors"
                    >
                        Khám phá Bất động sản
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {appointments.map((apt) => {
                        const isBuyer = apt.buyerId === session.user.id;
                        const isSeller = apt.sellerId === session.user.id;
                        const dateObj = new Date(apt.appointmentDate);

                        let statusColor = "bg-slate-100 text-slate-700 border-slate-200";
                        let statusIcon = <Clock className="w-4 h-4" />;
                        let statusText = "Chờ xác nhận";
                        let statusHint = isBuyer ? "Đang chờ chủ tin xác nhận lịch hẹn." : "Khách đang chờ bạn xác nhận lịch hẹn.";

                        if (apt.status === "confirmed") {
                            statusColor = "bg-blue-50 text-blue-700 border-blue-200";
                            statusIcon = <Calendar className="w-4 h-4" />;
                            statusText = "Đã xác nhận";
                            statusHint = "Hai bên đã thống nhất ngày giờ xem nhà.";
                        } else if (apt.status === "completed") {
                            statusColor = "bg-green-50 text-green-700 border-green-200";
                            statusIcon = <CheckCircle className="w-4 h-4" />;
                            statusText = "Đã xem nhà";
                            statusHint = "Khách đã xác nhận hoàn tất buổi xem nhà.";
                        } else if (apt.status === "cancelled") {
                            statusColor = "bg-red-50 text-red-700 border-red-200";
                            statusIcon = <XCircle className="w-4 h-4" />;
                            statusText = "Đã hủy";
                            statusHint = "Lịch hẹn này đã bị hủy.";
                        }

                        return (
                            <div key={apt._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row">
                                    <div className="w-full md:w-64 h-48 md:h-auto shrink-0 bg-slate-100 relative group">
                                        {apt.property?.images?.[0] ? (
                                            <img
                                                src={apt.property.images[0]}
                                                alt={apt.property.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                <Home className="w-10 h-10" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm flex items-center gap-1.5 ${statusColor}`}>
                                                {statusIcon}
                                                {statusText}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-6 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-xl font-bold text-slate-900 line-clamp-1">
                                                    {apt.property ? apt.property.title : "Bất động sản không khả dụng"}
                                                </h3>
                                            </div>

                                            {apt.property && (
                                                <>
                                                    <p className="font-bold text-orange-600 mb-2">
                                                        {apt.property.price || "Chưa có giá"}
                                                    </p>
                                                    <div className="flex items-start gap-1.5 text-sm text-slate-600 mb-4 line-clamp-2">
                                                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                                        <span>{apt.property.address}</span>
                                                    </div>
                                                </>
                                            )}

                                            <div className="grid gap-3 md:grid-cols-3 mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                <div>
                                                    <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Ngày giờ hẹn</div>
                                                    <div className="font-medium text-slate-900">
                                                        {dateObj.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" })} - {dateObj.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" })}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Bên mua / khách xem</div>
                                                    <div className="font-semibold text-indigo-600 flex items-center gap-1.5">
                                                        <UserCircle className="w-4 h-4" />
                                                        {apt.buyer?.name || "Khách xem nhà"}
                                                    </div>
                                                    {apt.buyer?.phone && (
                                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                            <Phone className="w-3 h-3" /> {apt.buyer.phone}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Bên bán / chủ tin</div>
                                                    <div className="font-semibold text-emerald-600 flex items-center gap-1.5">
                                                        <UserCircle className="w-4 h-4" />
                                                        {apt.seller?.name || "Chủ tin"}
                                                    </div>
                                                    {apt.seller?.phone && (
                                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                            <Phone className="w-3 h-3" /> {apt.seller.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-3 text-sm text-slate-500">
                                                Vai trò của bạn: <span className={`font-semibold ${isBuyer ? "text-indigo-600" : "text-emerald-600"}`}>{isBuyer ? "Khách đi xem nhà" : "Chủ nhà / môi giới"}</span>. {statusHint}
                                            </div>
                                        </div>

                                        <div className="mt-6 flex flex-wrap items-center gap-3">
                                            {apt.property && (
                                                <Link
                                                    href={`/property/${apt.property._id}`}
                                                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    Xem tin đăng
                                                </Link>
                                            )}
                                            <AppointmentActionButtons
                                                appointmentId={apt._id}
                                                status={apt.status}
                                                isBuyer={isBuyer}
                                                isSeller={isSeller}
                                                appointmentDate={apt.appointmentDate}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
