"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Building2, EyeOff, Eye, Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface Property {
    _id: string;
    title: string;
    price: string;
    type: string;
    propertyType: string;
    address: string;
    city: string;
    status: "pending" | "approved" | "rejected";
    isHidden: boolean;
    postedDate: string;
    author: {
        name: string;
        email?: string;
    };
    description?: string;
    images?: string[];
    area?: number;
    beds?: number;
    baths?: number;
}

export default function AdminPropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProperties, setTotalProperties] = useState(0);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [previewProperty, setPreviewProperty] = useState<Property | null>(null);
    const [autoApprove, setAutoApprove] = useState(false);

    useEffect(() => {
        fetch("/api/admin/settings").then(r => r.json()).then(data => {
            if (data.autoApproveProperties) setAutoApprove(true);
        }).catch(console.error);
    }, []);

    const toggleAutoApprove = async () => {
        const newVal = !autoApprove;
        setAutoApprove(newVal);
        try {
            await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: "autoApproveProperties", value: newVal })
            });
        } catch(err) {
            console.error(err);
            setAutoApprove(!newVal); // revert on fail
        }
    };

    const fetchProperties = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/properties?page=${page}&limit=10&search=${encodeURIComponent(search)}&status=${statusFilter}`);
            const data = await res.json();
            setProperties(data.properties || []);
            setTotalPages(data.totalPages || 1);
            setTotalProperties(data.totalProperties || 0);
        } catch (err) {
            console.error("Lỗi khi tải danh sách BĐS:", err);
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => fetchProperties(), 400);
        return () => clearTimeout(timer);
    }, [fetchProperties]);

    const updateProperty = async (id: string, payload: { status?: string; isHidden?: boolean }) => {
        if (!confirm("Xác nhận thao tác này?")) return;
        
        setActionLoading(id + JSON.stringify(payload));
        try {
            await fetch(`/api/admin/properties/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            await fetchProperties();
            window.dispatchEvent(new Event("admin-notifications-refresh"));
        } finally {
            setActionLoading(null);
        }
    };

    const deleteProperty = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa VĨNH VIỄN tin đăng này không? Hành động này không thể hoàn tác!")) return;
        
        setActionLoading(id + "delete");
        try {
            await fetch(`/api/admin/properties/${id}`, { method: "DELETE" });
            await fetchProperties();
            window.dispatchEvent(new Event("admin-notifications-refresh"));
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Quản lý Bất động sản</h2>
                    <p className="text-muted-foreground mt-1">Tổng cộng {totalProperties} tin đăng</p>
                </div>
                
                <div className="flex items-center gap-3 bg-muted/50 px-4 py-3 rounded-xl border w-fit">
                    <div className="space-y-0.5">
                        <p className="text-sm font-semibold leading-none">Duyệt tự động</p>
                        <p className="text-[10px] text-muted-foreground leading-none">Tin mới lên ngay</p>
                    </div>
                    <button 
                        onClick={toggleAutoApprove}
                        className={`w-12 h-6 rounded-full transition-colors relative ml-2 shadow-inner focus:outline-none ${autoApprove ? "bg-green-500" : "bg-slate-300"}`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-md ${autoApprove ? "translate-x-6" : "translate-x-0.5"}`} />
                    </button>
                    <span className={`text-xs font-medium ml-1 w-14 ${autoApprove ? "text-green-600" : "text-slate-500"}`}>
                        {autoApprove ? "Tự động" : "Thủ công"}
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Tìm theo tiêu đề, địa chỉ..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9 pr-4 h-10 w-full rounded-md border bg-background text-sm"
                    />
                </div>
                
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="h-10 px-3 rounded-md border bg-background text-sm w-full sm:w-[180px]"
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="rejected">Bị từ chối</option>
                    <option value="hidden">Đang ẩn</option>
                </select>
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left px-4 py-3 font-semibold">Bất động sản</th>
                            <th className="text-left px-4 py-3 font-semibold">Loại / Giá</th>
                            <th className="text-left px-4 py-3 font-semibold">Người đăng</th>
                            <th className="text-left px-4 py-3 font-semibold">Trạng thái</th>
                            <th className="text-center px-4 py-3 font-semibold">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y whitespace-nowrap">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-16 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            </td></tr>
                        ) : properties.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-16 text-muted-foreground">Không có tin đăng nào phù hợp.</td></tr>
                        ) : properties.map((property) => (
                            <tr key={property._id} className={`hover:bg-muted/30 transition-colors ${property.isHidden ? "opacity-60" : ""}`}>
                                <td className="px-4 py-3 max-w-[300px]">
                                    <Link href={`/property/${property._id}`} className="block truncate font-medium hover:text-primary transition-colors">
                                        {property.title}
                                    </Link>
                                    <div className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        {property.address}, {property.city}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="font-medium text-primary">{property.price}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {property.propertyType} • {property.type}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="font-medium">{property.author?.name || "Ẩn danh"}</div>
                                    <div className="text-xs text-muted-foreground mt-1">{property.author?.email || ""}</div>
                                </td>
                                <td className="px-4 py-3">
                                    {property.isHidden ? (
                                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700">Đã ẩn</span>
                                    ) : (
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            property.status === "approved" ? "bg-green-100 text-green-700" :
                                            property.status === "rejected" ? "bg-red-100 text-red-700" :
                                            "bg-yellow-100 text-yellow-700"
                                        }`}>
                                            {property.status === "approved" ? "Đã duyệt" : property.status === "rejected" ? "Từ chối" : "Chờ duyệt"}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-1">
                                        {/* Status Toggle (Approve/Reject) */}
                                        {property.status !== "approved" && (
                                            <button
                                                onClick={() => updateProperty(property._id, { status: "approved" })}
                                                title="Duyệt bài đăng"
                                                disabled={!!actionLoading}
                                                className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                                            >
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            </button>
                                        )}
                                        {property.status !== "rejected" && (
                                            <button
                                                onClick={() => updateProperty(property._id, { status: "rejected" })}
                                                title="Từ chối bài đăng"
                                                disabled={!!actionLoading}
                                                className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                                            >
                                                <XCircle className="h-4 w-4 text-red-600" />
                                            </button>
                                        )}

                                        {/* Preview */}
                                        <button
                                            onClick={() => setPreviewProperty(property)}
                                            title="Xem nhanh chi tiết tin"
                                            className="p-1.5 rounded-md hover:bg-muted transition-colors ml-2"
                                        >
                                            <Search className="h-4 w-4 text-blue-600" />
                                        </button>

                                        {/* Hide/Show */}
                                        <button
                                            onClick={() => updateProperty(property._id, { isHidden: !property.isHidden })}
                                            title={property.isHidden ? "Hiển thị lại tin" : "Ẩn tin này"}
                                            disabled={!!actionLoading}
                                            className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50 ml-2"
                                        >
                                            {property.isHidden
                                                ? <Eye className="h-4 w-4 text-blue-500" />
                                                : <EyeOff className="h-4 w-4 text-gray-500" />}
                                        </button>
                                        
                                        {/* Delete */}
                                        <button
                                            onClick={() => deleteProperty(property._id)}
                                            title="Xóa vĩnh viễn"
                                            disabled={!!actionLoading}
                                            className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
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
                <div className="flex items-center justify-center gap-2 mt-4">
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

            {/* Preview Modal */}
            {previewProperty && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all">
                    <div className="bg-background rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-bold text-lg truncate pr-4">{previewProperty.title}</h3>
                            <button onClick={() => setPreviewProperty(null)} className="p-1 hover:bg-muted rounded-md transition-colors">
                                <XCircle className="h-6 w-6 text-muted-foreground" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Giá</p>
                                    <p className="font-bold text-primary text-lg">{previewProperty.price}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Loại BĐS</p>
                                    <p className="font-medium">{previewProperty.propertyType} - {previewProperty.type}</p>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <p className="text-sm font-medium text-muted-foreground">Địa chỉ</p>
                                    <p className="font-medium">{previewProperty.address}, {previewProperty.city}</p>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <p className="text-sm font-medium text-muted-foreground">Người đăng</p>
                                    <p className="font-medium">{previewProperty.author?.name} ({previewProperty.author?.email || "Không có email"})</p>
                                </div>
                                {previewProperty.area && (
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Diện tích</p>
                                        <p className="font-medium">{previewProperty.area} m²</p>
                                    </div>
                                )}
                                {(previewProperty.beds || previewProperty.baths) ? (
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Tiện ích</p>
                                        <p className="font-medium">{previewProperty.beds} Phòng ngủ - {previewProperty.baths} Phòng tắm</p>
                                    </div>
                                ) : null}
                            </div>
                            
                            {previewProperty.description && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Mô tả</p>
                                    <p className="text-sm bg-muted/30 p-3 rounded-md border whitespace-pre-wrap">{previewProperty.description}</p>
                                </div>
                            )}

                            {previewProperty.images && previewProperty.images.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-2">Hình ảnh</p>
                                    <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                                        {previewProperty.images.map((img, idx) => (
                                            <img key={idx} src={img} alt={`Hình ${idx + 1}`} className="h-32 w-48 object-cover rounded-md flex-shrink-0 snap-center border" />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t bg-muted/20 flex gap-2 justify-end">
                            <Link href={`/property/${previewProperty._id}`} target="_blank">
                                <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">
                                    Mở trang BĐS
                                </button>
                            </Link>
                            <button onClick={() => setPreviewProperty(null)} className="px-4 py-2 border bg-background text-sm font-medium rounded-md hover:bg-muted transition-colors">
                                Đóng Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
