"use client";

import { useState } from "react";
import { Calendar, Clock, Loader2, CalendarPlus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function BookAppointmentModal({ propertyId, authorId }: { propertyId: string, authorId: string }) {
    const { data: session } = useSession();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });

    const handleOpen = () => {
        if (!session) {
            router.push(`/login?callbackUrl=/property/${propertyId}`);
            return;
        }
        if (session.user.id === authorId) {
            alert("Bạn không thể tự đặt lịch với chính mình.");
            return;
        }
        setIsOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !time) return;

        setLoading(true);
        setMessage({ text: "", type: "" });
        try {
            const appointmentDate = new Date(`${date}T${time}`);
            if (appointmentDate < new Date()) {
                setMessage({ text: "Thời gian hẹn phải ở tương lai", type: "error" });
                setLoading(false);
                return;
            }

            const res = await fetch("/api/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    propertyId, 
                    sellerId: authorId, 
                    appointmentDate: appointmentDate.toISOString() 
                })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ text: "Gửi yêu cầu đặt lịch hẹn thành công!", type: "success" });
                setTimeout(() => {
                    setIsOpen(false);
                    router.push("/dashboard/appointments");
                }, 1500);
            } else {
                setMessage({ text: data.error || "Có lỗi xảy ra", type: "error" });
            }
        } catch(err) {
            setMessage({ text: "Lỗi kết nối mạng", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4">
            <button 
                onClick={handleOpen}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-lg font-bold text-lg transition-all shadow-md active:scale-[0.98]"
            >
                <CalendarPlus className="h-5 w-5" />
                Đặt lịch xem nhà
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-background rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b text-center space-y-2">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 text-primary">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-2xl">Đặt lịch xem nhà</h3>
                            <p className="text-sm text-muted-foreground">Chọn ngày và giờ phù hợp để gửi yêu cầu đến chủ nhà.</p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {message.text && (
                                <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {message.text}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" /> Ngày gặp
                                    </label>
                                    <input 
                                        type="date" 
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground" /> Giờ gặp (Dự kiến)
                                    </label>
                                    <input 
                                        type="time" 
                                        required
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    type="button"
                                    disabled={loading}
                                    onClick={() => setIsOpen(false)} 
                                    className="flex-1 py-2.5 rounded-lg border font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                                >
                                    Huỷ bỏ
                                </button>
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-primary text-primary-foreground font-bold py-2.5 rounded-lg hover:bg-primary/90 flex justify-center items-center disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Gửi yêu cầu hẹn"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
