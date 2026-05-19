"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Filter, Loader2, ShieldAlert, Trash2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ReportStatus = "pending" | "resolved" | "ignored";
type ReportCategory = "fraud" | "spam" | "availability" | "other";
type StatusFilter = "all" | ReportStatus;
type CategoryFilter = "all" | ReportCategory;

type AdminReport = {
    _id: string;
    reason: string;
    category?: ReportCategory;
    details?: string;
    description?: string;
    status: ReportStatus;
    createdAt: string;
    reporterId?: {
        name?: string;
        email?: string;
    } | null;
    propertyId?: {
        _id: string;
        title?: string;
        status?: string;
        isHidden?: boolean;
        author?: {
            name?: string;
        };
    } | null;
};

const statusFilters: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "pending", label: "Chờ xử lý" },
    { value: "resolved", label: "Đã xử lý" },
    { value: "ignored", label: "Đã từ chối" },
];

const categoryFilters: { value: CategoryFilter; label: string }[] = [
    { value: "all", label: "Tất cả loại" },
    { value: "spam", label: "Spam" },
    { value: "fraud", label: "Vi phạm" },
    { value: "availability", label: "Đã bán/cho thuê" },
    { value: "other", label: "Khác" },
];

function getCategoryLabel(category?: ReportCategory) {
    if (category === "spam") return "Spam";
    if (category === "fraud") return "Vi phạm";
    if (category === "availability") return "Đã bán/cho thuê";
    return "Khác";
}

function getCategoryBadgeClass(category?: ReportCategory) {
    if (category === "spam") return "border-red-200 bg-red-50 text-red-700";
    if (category === "fraud") return "border-amber-200 bg-amber-50 text-amber-700";
    if (category === "availability") return "border-blue-200 bg-blue-50 text-blue-700";
    return "border-slate-200 bg-slate-50 text-slate-600";
}

function getReportDetail(report: AdminReport) {
    return report.details || report.description || "";
}

function getFilterButtonClass(active: boolean) {
    return `rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
            ? "border-primary bg-primary text-white"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
    }`;
}

export default function AdminReportsPage() {
    const [reports, setReports] = useState<AdminReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

    const loadReports = async () => {
        try {
            const res = await fetch("/api/admin/reports");
            if (res.ok) {
                const data = (await res.json()) as AdminReport[];
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

    const stats = useMemo(() => {
        return {
            total: reports.length,
            pending: reports.filter((report) => report.status === "pending").length,
            spam: reports.filter((report) => report.category === "spam").length,
            availability: reports.filter((report) => report.category === "availability").length,
        };
    }, [reports]);

    const filteredReports = useMemo(() => {
        return reports.filter((report) => {
            const statusMatches = statusFilter === "all" || report.status === statusFilter;
            const categoryMatches = categoryFilter === "all" || report.category === categoryFilter;
            return statusMatches && categoryMatches;
        });
    }, [categoryFilter, reports, statusFilter]);

    const updateStatus = async (id: string, newStatus: ReportStatus) => {
        try {
            const res = await fetch(`/api/admin/reports/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                await loadReports();
                window.dispatchEvent(new Event("admin-notifications-refresh"));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteReport = async (id: string) => {
        if (!confirm("Xóa vĩnh viễn báo cáo này?")) return;
        try {
            const res = await fetch(`/api/admin/reports/${id}`, { method: "DELETE" });
            if (res.ok) {
                await loadReports();
                window.dispatchEvent(new Event("admin-notifications-refresh"));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleHideProperty = async (propertyId: string) => {
        if (!confirm("Xác nhận ẩn bài đăng này khỏi hệ thống?")) return;
        try {
            const res = await fetch(`/api/admin/properties/${propertyId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isHidden: true, status: "under_review" }),
            });
            if (res.ok) {
                alert("Đã ẩn bài đăng và chuyển sang trạng thái cần xem xét.");
                await loadReports();
                window.dispatchEvent(new Event("admin-notifications-refresh"));
            } else {
                alert("Lỗi khi ẩn bài.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Quản lý báo cáo cộng đồng</h2>
                <p className="mt-1 text-sm text-muted-foreground">Theo dõi spam, tin sai sự thật, tin đã bán/cho thuê và các báo cáo vi phạm từ người dùng.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="gap-2 py-5">
                    <CardHeader className="px-5">
                        <CardTitle className="text-sm text-muted-foreground">Tổng báo cáo</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 text-2xl font-bold">{stats.total}</CardContent>
                </Card>
                <Card className="gap-2 py-5">
                    <CardHeader className="px-5">
                        <CardTitle className="text-sm text-muted-foreground">Chờ xử lý</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 text-2xl font-bold text-amber-600">{stats.pending}</CardContent>
                </Card>
                <Card className="gap-2 py-5">
                    <CardHeader className="px-5">
                        <CardTitle className="text-sm text-muted-foreground">Spam</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 text-2xl font-bold text-red-600">{stats.spam}</CardContent>
                </Card>
                <Card className="gap-2 py-5">
                    <CardHeader className="px-5">
                        <CardTitle className="text-sm text-muted-foreground">Đã bán/cho thuê</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 text-2xl font-bold text-blue-600">{stats.availability}</CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <CardTitle>Danh sách báo cáo</CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Filter className="h-4 w-4" />
                            {filteredReports.length}/{reports.length} báo cáo
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="w-20 text-xs font-semibold uppercase text-muted-foreground">Trạng thái</span>
                            {statusFilters.map((filter) => (
                                <button
                                    key={filter.value}
                                    onClick={() => setStatusFilter(filter.value)}
                                    className={getFilterButtonClass(statusFilter === filter.value)}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="w-20 text-xs font-semibold uppercase text-muted-foreground">Loại</span>
                            {categoryFilters.map((filter) => (
                                <button
                                    key={filter.value}
                                    onClick={() => setCategoryFilter(filter.value)}
                                    className={getFilterButtonClass(categoryFilter === filter.value)}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted text-xs uppercase text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Loại & người báo cáo</th>
                                    <th className="px-4 py-3">Bất động sản</th>
                                    <th className="px-4 py-3">Nội dung chi tiết</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                                            Không có báo cáo phù hợp bộ lọc.
                                        </td>
                                    </tr>
                                )}
                                {filteredReports.map((report) => {
                                    const detail = getReportDetail(report);
                                    const property = report.propertyId;

                                    return (
                                        <tr key={report._id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="px-4 py-3">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <Badge variant="outline" className={getCategoryBadgeClass(report.category)}>
                                                        {getCategoryLabel(report.category)}
                                                    </Badge>
                                                    <span className="font-semibold text-slate-800">{report.reason}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Người báo cáo: {report.reporterId?.name || report.reporterId?.email || "Ẩn danh"}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground">
                                                    {new Date(report.createdAt).toLocaleString("vi-VN")}
                                                </div>
                                            </td>
                                            <td className="max-w-[260px] px-4 py-3">
                                                {property ? (
                                                    <>
                                                        <Link href={`/property/${property._id}`} target="_blank" className="mb-1 line-clamp-2 font-medium text-primary hover:underline">
                                                            {property.title || "Tin bất động sản"}
                                                        </Link>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {property.isHidden ? (
                                                                <Badge variant="secondary" className="bg-red-100 text-[10px] text-red-700 hover:bg-red-100">Đã ẩn</Badge>
                                                            ) : (
                                                                <Badge variant="secondary" className="bg-green-100 text-[10px] text-green-700 hover:bg-green-100">Đang hiện</Badge>
                                                            )}
                                                            <span className="text-xs text-muted-foreground">Chủ: {property.author?.name || "Chưa rõ"}</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="italic text-muted-foreground">Tin đã bị xóa</span>
                                                )}
                                            </td>
                                            <td className="max-w-[260px] px-4 py-3 text-xs">
                                                {detail || <span className="italic text-muted-foreground">Không có mô tả thêm</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        report.status === "pending"
                                                            ? "border-amber-200 bg-amber-50 text-amber-600"
                                                            : report.status === "resolved"
                                                              ? "border-green-200 bg-green-50 text-green-600"
                                                              : "border-gray-200 bg-gray-50 text-gray-600"
                                                    }
                                                >
                                                    {report.status === "pending" ? "Chờ xử lý" : report.status === "resolved" ? "Đã xử lý" : "Đã từ chối"}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {report.status !== "resolved" && (
                                                        <button onClick={() => updateStatus(report._id, "resolved")} title="Đánh dấu đã xử lý" className="rounded-md p-1.5 text-green-600 hover:bg-green-100">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {report.status !== "ignored" && (
                                                        <button onClick={() => updateStatus(report._id, "ignored")} title="Từ chối báo cáo" className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100">
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {property && !property.isHidden && (
                                                        <button onClick={() => handleHideProperty(property._id)} title="Ẩn tin và chuyển xem xét" className="rounded-md p-1.5 text-amber-600 hover:bg-amber-100">
                                                            <ShieldAlert className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button onClick={() => deleteReport(report._id)} title="Xóa báo cáo" className="rounded-md p-1.5 text-red-600 hover:bg-red-100">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
