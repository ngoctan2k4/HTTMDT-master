"use client";

import { useState } from "react";
import { Download, Filter, Search, PhoneCall, Mail, ShieldAlert, Loader2, CheckCircle, Ban } from "lucide-react";

export default function AppointmentsTable({ initialData }: { initialData: any[] }) {
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [data, setData] = useState(initialData);
    const [processing, setProcessing] = useState<string | null>(null);

    // Xử lý Lọc
    const filteredData = data.filter(app => {
        if (statusFilter !== "all" && app.status !== statusFilter) return false;
        if (search) {
            const term = search.toLowerCase();
            return (
                app.buyerName.toLowerCase().includes(term) ||
                app.sellerName.toLowerCase().includes(term) ||
                (app.propertyId?.title || "").toLowerCase().includes(term)
            );
        }
        return true;
    });

    // Xuất CSV
    const handleExportCSV = () => {
        const headers = ["ID Giao dịch", "Bất động sản", "Khách Mua", "SĐT Khách", "Môi giới/Chủ", "SĐT Chủ", "Ngày Hẹn", "Trạng Thái", "Có Tranh Chấp Lừa Đảo", "Doanh Số"];
        const rows = filteredData.map(app => [
            app._id,
            `"${app.propertyId?.title || 'Đã xóa'}"`,
            `"${app.buyerName}"`,
            app.buyerPhone || "",
            `"${app.sellerName}"`,
            app.sellerPhone || "",
            new Date(app.appointmentDate).toLocaleString('vi-VN'),
            app.status,
            app.isFraudReported ? "CÓ" : "KHÔNG",
            app.propertyId?.price || ""
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `GiaoDich_O2O_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Hành động Tranh chấp Admin
    const handleAction = async (id: string, action: "resolve_dispute" | "cancel") => {
        if (action === "cancel" && !confirm("Ép hủy giao dịch này hoàn toàn?")) return;
        
        setProcessing(id);
        try {
            const res = await fetch(`/api/admin/appointments/${id}/action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            });

            if (res.ok) {
                // Update local state smoothly
                setData(prev => prev.map(app => {
                    if (app._id === id) {
                        return {
                            ...app,
                            status: action === "cancel" ? "cancelled" : app.status,
                            isFraudReported: action === "resolve_dispute" ? false : app.isFraudReported
                        }
                    }
                    return app;
                }));
            } else {
                const data = await res.json();
                alert(data.error || "Lỗi xử lý");
            }
        } catch (e) {
            alert("Lỗi kết nối");
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50">
                <div className="flex z items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm SĐT, Tên khách, Nhà..." 
                            className="w-full border rounded-md h-9 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select 
                        className="border rounded-md px-3 py-1.5 text-sm bg-white text-slate-700 outline-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="pending">Chờ xác nhận (Pending)</option>
                        <option value="confirmed">Đã xác nhận (Confirmed)</option>
                        <option value="completed">Đã thành công (Completed)</option>
                        <option value="cancelled">Hủy bỏ (Cancelled)</option>
                    </select>

                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                    >
                        <Download className="w-4 h-4" /> Xuất Excel
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground font-medium border-b">
                        <tr>
                            <th className="px-5 py-4 w-1/4">Bất động sản</th>
                            <th className="px-5 py-4 whitespace-nowrap">Người mua</th>
                            <th className="px-5 py-4 whitespace-nowrap">Chủ nhà / Môi giới</th>
                            <th className="px-5 py-4 whitespace-nowrap">Trạng thái & Lịch trình</th>
                            <th className="px-5 py-4 text-center">Hỗ Trợ Hành Chính</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">Không tìm thấy giao dịch nào.</td>
                            </tr>
                        ) : filteredData.map((app) => (
                            <tr key={app._id} className={`border-b last:border-0 hover:bg-slate-50 transition-colors ${app.isFraudReported ? "bg-red-50/40" : ""}`}>
                                {/* BĐS */}
                                <td className="px-5 py-4 max-w-[200px]">
                                    <div className="font-semibold text-slate-800 line-clamp-1 truncate" title={app.propertyId?.title}>{app.propertyId?.title || "BĐS không rõ"}</div>
                                    <div className="text-red-500 font-bold mt-1 text-xs">{app.propertyId?.price || "-"}</div>
                                </td>
                                
                                {/* Người Mua */}
                                <td className="px-5 py-4">
                                    <div className="font-medium text-slate-900">{app.buyerName}</div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                                        <PhoneCall className="w-3 h-3"/> {app.buyerPhone || "Chưa CN"}
                                    </div>
                                    {app.buyerEmail && <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                        <Mail className="w-3 h-3"/> {app.buyerEmail}
                                    </div>}
                                </td>

                                {/* Người Bán */}
                                <td className="px-5 py-4">
                                    <div className="font-medium text-slate-900">{app.sellerName}</div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                                        <PhoneCall className="w-3 h-3"/> {app.sellerPhone || "Chưa CN"}
                                    </div>
                                    {app.sellerEmail && <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                        <Mail className="w-3 h-3"/> {app.sellerEmail}
                                    </div>}
                                </td>

                                {/* Status & Date */}
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                            app.status === "completed" ? "bg-green-100 text-green-700" :
                                            app.status === "cancelled" ? "bg-red-100 text-red-700" :
                                            app.status === "confirmed" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                                        }`}>
                                            {app.status.toUpperCase()}
                                        </span>
                                        {app.isFraudReported && (
                                            <span title="Bị báo cáo Offline Lừa đảo" className="bg-red-600 text-white p-1 rounded-full animate-bounce">
                                                <ShieldAlert className="w-3 h-3" />
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs font-semibold text-slate-600">
                                        Hẹn: {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(app.appointmentDate))}
                                    </div>
                                </td>

                                {/* CSKH Actions */}
                                <td className="px-5 py-4 text-right align-middle">
                                    <div className="flex flex-col gap-2 justify-center items-center">
                                        {app.isFraudReported && (
                                            <button 
                                                disabled={processing === app._id}
                                                onClick={() => handleAction(app._id, "resolve_dispute")}
                                                className="w-full text-xs bg-slate-100 hover:bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded flex items-center justify-center gap-1.5 font-medium transition-colors"
                                            >
                                                {processing === app._id ? <Loader2 className="w-3 h-3 animate-spin"/> : <><CheckCircle className="w-3 h-3" /> Bác bỏ Report</>}
                                            </button>
                                        )}
                                        {app.status !== "cancelled" && app.status !== "completed" && (
                                            <button 
                                                disabled={processing === app._id}
                                                onClick={() => handleAction(app._id, "cancel")}
                                                className="w-full text-xs bg-white hover:bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded flex items-center justify-center gap-1.5 font-medium transition-colors"
                                            >
                                                {processing === app._id ? <Loader2 className="w-3 h-3 animate-spin"/> : <><Ban className="w-3 h-3" /> Ép Hủy</>}
                                            </button>
                                        )}
                                        {!app.isFraudReported && (app.status === "cancelled" || app.status === "completed") && (
                                            <span className="text-xs text-slate-400 italic">Đã kết thúc</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
