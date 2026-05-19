"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Plus, CheckCircle, Ban, Loader2, Ticket } from "lucide-react";

interface Voucher {
    _id: string;
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    maxUsage: number;
    usedCount: number;
    expiryDate: string;
    isActive: boolean;
    createdAt: string;
}

export default function AdminVouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalVouchers, setTotalVouchers] = useState(0);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData] = useState({
        code: "",
        discountType: "fixed",
        discountValue: "",
        maxUsage: "0",
        expiryDate: ""
    });

    const fetchVouchers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/vouchers?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
            const data = await res.json();
            setVouchers(data.vouchers || []);
            setTotalPages(data.totalPages || 1);
            setTotalVouchers(data.totalVouchers || 0);
        } catch (err) {
            console.error("Lỗi khi tải danh sách voucher:", err);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        const timer = setTimeout(() => fetchVouchers(), 400);
        return () => clearTimeout(timer);
    }, [fetchVouchers]);

    const updateVoucher = async (id: string, payload: { isActive: boolean }) => {
        setActionLoading(id);
        try {
            await fetch(`/api/admin/vouchers/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            await fetchVouchers();
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const res = await fetch(`/api/admin/vouchers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (res.ok) {
                setShowForm(false);
                setFormData({
                    code: "",
                    discountType: "fixed",
                    discountValue: "",
                    maxUsage: "0",
                    expiryDate: ""
                });
                fetchVouchers();
            } else {
                alert(data.error || "Có lỗi xảy ra");
            }
        } catch(err) {
            alert("Lỗi kết nối tới máy chủ");
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Quản lý Mã Giảm Giá</h2>
                    <p className="text-muted-foreground mt-1">Tổng cộng {totalVouchers} mã trong hệ thống</p>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Tạo mã mới
                </button>
            </div>

            {/* Create Form Modal/Dropdown area */}
            {showForm && (
                <div className="bg-white p-6 rounded-xl border shadow-sm mb-6 animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Ticket className="w-5 h-5"/> Thêm Mã Mới</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Mã Code (Tên mã)</label>
                            <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full border rounded-md px-3 py-2 uppercase" placeholder="VD: TET2026" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Loại giảm giá</label>
                            <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})} className="w-full border rounded-md px-3 py-2">
                                <option value="fixed">Tiền mặt (VNĐ)</option>
                                <option value="percentage">Phần trăm (%)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Mức giảm</label>
                            <input required type="number" min="1" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: e.target.value})} className="w-full border rounded-md px-3 py-2" placeholder="VD: 50000 hoặc 10" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Giới hạn số lần dùng (0 = Không giới hạn)</label>
                            <input required type="number" min="0" value={formData.maxUsage} onChange={e => setFormData({...formData, maxUsage: e.target.value})} className="w-full border rounded-md px-3 py-2" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Hạn sử dụng</label>
                            <input required type="datetime-local" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full border rounded-md px-3 py-2" />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md text-slate-600 hover:bg-slate-50">Hủy</button>
                            <button type="submit" disabled={formLoading} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-2">
                                {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Lưu mã
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Tìm theo mã voucher..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-9 pr-4 h-10 w-full rounded-md border bg-background text-sm"
                />
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left px-4 py-3 font-semibold">Mã Code</th>
                            <th className="text-left px-4 py-3 font-semibold">Mức giảm</th>
                            <th className="text-left px-4 py-3 font-semibold">Lượt dùng</th>
                            <th className="text-left px-4 py-3 font-semibold">Hạn sử dụng</th>
                            <th className="text-left px-4 py-3 font-semibold">Trạng thái</th>
                            <th className="text-center px-4 py-3 font-semibold">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-16 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            </td></tr>
                        ) : vouchers.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-16 text-muted-foreground">Không có mã nào.</td></tr>
                        ) : vouchers.map((v) => (
                            <tr key={v._id} className={`hover:bg-muted/30 transition-colors ${!v.isActive ? "opacity-60" : ""}`}>
                                <td className="px-4 py-3 font-bold text-slate-800">{v.code}</td>
                                <td className="px-4 py-3 font-medium text-emerald-600">
                                    {v.discountType === 'percentage' ? `${v.discountValue}%` : `${new Intl.NumberFormat('vi-VN').format(v.discountValue)}đ`}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {v.usedCount} / {v.maxUsage === 0 ? "∞" : v.maxUsage}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {new Date(v.expiryDate).toLocaleString("vi-VN")}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                        v.isActive 
                                        ? new Date(v.expiryDate) < new Date() ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                    }`}>
                                        {!v.isActive ? "Đã Khóa" : (new Date(v.expiryDate) < new Date() ? "Hết hạn" : "Đang chạy")}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-1">
                                        <button
                                            onClick={() => updateVoucher(v._id, { isActive: !v.isActive })}
                                            title={!v.isActive ? "Mở khóa mã này" : "Ngưng hoạt động mã"}
                                            disabled={actionLoading === v._id}
                                            className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                                        >
                                            {!v.isActive
                                                ? <CheckCircle className="h-4 w-4 text-green-500" />
                                                : <Ban className="h-4 w-4 text-red-500" />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1 rounded-md border text-sm disabled:opacity-50 hover:bg-muted transition-colors"
                    >
                        Trước
                    </button>
                    <span className="text-sm text-muted-foreground">Trang {page} / {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 rounded-md border text-sm disabled:opacity-50 hover:bg-muted transition-colors"
                    >
                        Tiếp
                    </button>
                </div>
            )}
        </div>
    );
}
