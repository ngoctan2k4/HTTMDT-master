"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function AdminReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadReports = async () => {
        try {
            const res = await fetch("/api/admin/reports");
            if (res.ok) {
                const data = await res.json();
                setReports(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/reports/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) loadReports();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteReport = async (id: string) => {
        if (!confirm("Xóa vĩnh viễn báo cáo này?")) return;
        try {
            const res = await fetch(`/api/admin/reports/${id}`, { method: "DELETE" });
            if (res.ok) loadReports();
        } catch (err) {
            console.error(err);
        }
    };

    const handleHideProperty = async (propertyId: string) => {
        if (!confirm("Xác nhận Ẩn bài đăng này khỏi hệ thống?")) return;
        try {
            const res = await fetch(`/api/admin/properties/${propertyId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isHidden: true })
            });
            if (res.ok) {
                alert("Đã ẩn bài đăng thành công!");
                loadReports();
            } else {
                alert("Lỗi khi ẩn bài.");
            }
        } catch (err) {
            console.error(err);
        }
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground w-8 h-8" /></div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Quản lý Khiếu nại (Reports)</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách cắm cờ từ cộng đồng</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3">Lý do & Khách chặn</th>
                                    <th className="px-4 py-3">Bất động sản</th>
                                    <th className="px-4 py-3">Nội dung chi tiết</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Không có báo cáo nào.
                                        </td>
                                    </tr>
                                )}
                                {reports.map((rp) => (
                                    <tr key={rp._id} className="border-b hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-red-600 flex items-center gap-1.5 mb-1">
                                                <AlertTriangle className="w-3.5 h-3.5" /> {rp.reason}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                By: {rp.reporterId?.name || "Unknown"}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                                {new Date(rp.createdAt).toLocaleString("vi-VN")}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 max-w-[250px]">
                                            {rp.propertyId ? (
                                                <>
                                                    <Link href={`/property/${rp.propertyId._id}`} target="_blank" className="font-medium text-primary hover:underline line-clamp-2 mb-1">
                                                        {rp.propertyId.title}
                                                    </Link>
                                                    <div className="flex items-center gap-2">
                                                        {rp.propertyId.isHidden ? (
                                                            <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px]">Đã Ẩn</Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px]">Đang Hiện</Badge>
                                                        )}
                                                        <span className="text-xs text-muted-foreground">Chủ: {rp.propertyId.author?.name}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground italic">Tin đã bị xóa</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs max-w-[200px]">
                                            {rp.description || <span className="text-muted-foreground italic">Không có mô tả thêm</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className={
                                                rp.status === "pending" ? "text-amber-600 border-amber-200 bg-amber-50" :
                                                rp.status === "resolved" ? "text-green-600 border-green-200 bg-green-50" :
                                                "text-gray-600 border-gray-200 bg-gray-50"
                                            }>
                                                {rp.status === "pending" ? "Chờ xử lý" : rp.status === "resolved" ? "Đã xử lý" : "Đã từ chối"}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {rp.status === "pending" && (
                                                    <button onClick={() => updateStatus(rp._id, "resolved")} title="Đánh dấu đã xử lý" className="p-1.5 text-green-600 hover:bg-green-100 rounded-md">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {rp.propertyId && !rp.propertyId.isHidden && (
                                                    <button onClick={() => handleHideProperty(rp.propertyId._id)} title="Cấm / Ẩn bài đăng này" className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-md">
                                                        <ShieldAlert className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button onClick={() => deleteReport(rp._id)} title="Xóa Report" className="p-1.5 text-red-600 hover:bg-red-100 rounded-md">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
