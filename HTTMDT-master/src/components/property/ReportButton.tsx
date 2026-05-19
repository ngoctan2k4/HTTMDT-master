"use client";

import { useState } from "react";
import { AlertCircle, Flag, Loader2, X } from "lucide-react";

export default function ReportButton({ propertyId }: { propertyId: string }) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("Lừa đảo / Sai sự thật");
    const [details, setDetails] = useState("");
    const [loading, setLoading] = useState(false);

    const reasons = [
        "Lừa đảo / Sai sự thật",
        "Giá ảo / Không đúng thực tế",
        "Bất động sản đã bán / Cho thuê",
        "Sai vị trí / Hình ảnh mượn",
        "Khác"
    ];

    const handleReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/properties/${propertyId}/report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason, details }),
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                setOpen(false);
            } else {
                alert(data.error || "Có lỗi xảy ra, vui lòng thử lại.");
            }
        } catch (error) {
            alert("Lỗi kết nối máy chủ.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button 
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors ml-auto"
                title="Báo cáo tin đăng nếu phát hiện lừa đảo hoặc vi phạm"
            >
                <Flag className="w-4 h-4" /> Báo cáo vi phạm
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-background rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b flex justify-between items-center text-red-600 bg-red-50">
                            <h3 className="font-bold flex items-center gap-2"><AlertCircle className="w-5 h-5"/> Báo cáo Tin giả / Vi phạm</h3>
                            <button disabled={loading} onClick={() => setOpen(false)} className="text-red-600 hover:text-red-800">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Lý do báo cáo (*)</label>
                                <select 
                                    value={reason} 
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full border rounded-lg p-2.5 text-sm outline-none focus:border-red-500"
                                >
                                    {reasons.map((r, i) => <option key={i} value={r}>{r}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Mô tả thêm (Tùy chọn)</label>
                                <textarea 
                                    value={details} 
                                    onChange={(e) => setDetails(e.target.value)}
                                    rows={3}
                                    placeholder="Cung cấp thêm chi tiết để quá trình kiểm duyệt diễn ra nhanh hơn..."
                                    className="w-full border rounded-lg p-2.5 text-sm min-h-[80px] resize-none outline-none focus:border-red-500"
                                />
                            </div>

                            <p className="text-xs text-muted-foreground border-t pt-4">
                                Hệ thống sẽ bảo mật danh tính người báo cáo. Nếu phát hiện lạm dụng báo cáo khống, tài khoản của bạn có thể bị hạn chế.
                            </p>

                            <button 
                                disabled={loading}
                                onClick={handleReport}
                                className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 flex justify-center items-center shadow-md transition-all disabled:opacity-50 mt-4"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Gửi Báo Cáo"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
