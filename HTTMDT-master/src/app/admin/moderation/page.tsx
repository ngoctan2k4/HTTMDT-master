"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, MapPin, Eye, AlertTriangle, Flag, Trash2, Ban } from "lucide-react";
import Link from "next/link";

interface Report {
    reportId: string;
    reason: string;
    details: string;
    reporterName: string;
    createdAt: string;
}

interface ListingReport {
    propertyId: string;
    propertyTitle: string;
    propertyImage: string;
    authorName: string;
    propertyStatus: string;
    reports: Report[];
}

export default function ModerationPage() {
    const [listings, setListings] = useState<ListingReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingTarget, setProcessingTarget] = useState<string | null>(null);

    const fetchReports = () => {
        setLoading(true);
        fetch("/api/admin/moderation")
            .then(res => res.json())
            .then(json => {
                if (json.success) setListings(json.listings);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleAction = async (propertyId: string, action: "ignore" | "ban") => {
        if (action === "ban" && !confirm("Bạn có chắc chắn muốn KHÓA vĩnh viễn Bất động sản này?")) return;
        
        setProcessingTarget(propertyId);
        try {
            const res = await fetch(`/api/admin/moderation/${propertyId}/action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            });
            const json = await res.json();
            if (json.success) {
                alert(json.message);
                // Loại bỏ item khỏi danh sách sau khi đã xử lý
                setListings(prev => prev.filter(item => item.propertyId !== propertyId));
            } else {
                alert(json.error || "Có lỗi xảy ra.");
            }
        } catch (e) {
            alert((e as Error).message || "Có lỗi xảy ra.");
        } finally {
            setProcessingTarget(null);
        }
    };

    if (loading) {
        return <div className="w-full h-96 flex flex-col items-center justify-center gap-3"><Loader2 className="w-8 h-8 animate-spin text-primary" /> Đang tải dữ liệu khiếu nại...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-800">Trung Tâm Quản Lý Báo Cáo</h2>
                <p className="text-muted-foreground mt-1 text-sm">Danh sách các Bất động sản bị cộng đồng cắm cờ do nghi ngờ lừa đảo/sai giá/sai sự thật.</p>
            </div>

            {listings.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center shadow-sm">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Hệ Thống Sạch!</h3>
                    <p className="text-slate-500">Mọi tin đăng vi phạm đã được xử lý xong. Không có báo cáo mới.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {listings.map(prop => (
                        <div key={prop.propertyId} className="bg-white rounded-xl border shadow-sm border-red-200 overflow-hidden">
                            
                            {/* Header Section */}
                            <div className="p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-red-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden border">
                                        {prop.propertyImage ? (
                                            <img src={prop.propertyImage} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Trống</div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{prop.propertyTitle}</h3>
                                        <p className="text-sm text-slate-600 mt-1">Người đăng: <span className="font-semibold">{prop.authorName}</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-bold flex items-center gap-1.5 whitespace-nowrap">
                                        <AlertTriangle className="w-4 h-4" /> {prop.reports.length} Báo cáo
                                    </span>
                                </div>
                            </div>

                            {/* Reports List */}
                            <div className="p-5 bg-slate-50 border-b">
                                <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <Flag className="w-4 h-4 text-red-500"/> Chi tiết các khiếu nại:
                                </h4>
                                <div className="space-y-3">
                                    {prop.reports.map(report => (
                                        <div key={report.reportId} className="bg-white p-3 rounded-lg border shadow-sm text-sm">
                                            <div className="flex justify-between items-start mb-1.5">
                                                <span className="font-semibold text-slate-900 border-b pb-1">Báo cáo bởi: {report.reporterName}</span>
                                                <span className="text-xs text-slate-400">{new Date(report.createdAt).toLocaleString("vi-VN")}</span>
                                            </div>
                                            <p className="text-red-700 font-medium mb-1">- Lý do: {report.reason}</p>
                                            {report.details && (
                                                <p className="text-slate-600 italic bg-amber-50 p-2 rounded text-xs mt-2 border border-amber-100">
                                                    " {report.details} "
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className="p-4 bg-white flex flex-col sm:flex-row items-center gap-3">
                                <Link 
                                    href={`/property/${prop.propertyId}`} 
                                    target="_blank"
                                    className="flex-1 w-full py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors flex justify-center items-center gap-2"
                                >
                                    <Eye className="w-4 h-4" /> Xem Bài Viết Thực Tế
                                </Link>

                                <button 
                                    onClick={() => handleAction(prop.propertyId, "ignore")}
                                    disabled={processingTarget === prop.propertyId}
                                    className="flex-1 w-full py-2.5 px-4 rounded-lg border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-sm font-bold transition-colors flex justify-center items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> Bỏ Qua Báo Cáo
                                </button>
                                
                                <button 
                                    onClick={() => handleAction(prop.propertyId, "ban")}
                                    disabled={processingTarget === prop.propertyId}
                                    className="flex-1 w-full py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors flex justify-center items-center gap-2 shadow-lg shadow-red-500/30 disabled:opacity-50"
                                >
                                    {processingTarget === prop.propertyId ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Ban className="w-4 h-4" /> Khóa Vĩnh Viễn BĐS</>}
                                </button>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
