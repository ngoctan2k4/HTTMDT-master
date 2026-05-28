"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Banknote, Building2, TriangleAlert } from "lucide-react";

type AdminNotificationsResponse = {
    total?: number;
    detail?: {
        pendingProperties?: number;
        reviewProperties?: number;
        pendingReports?: number;
        pendingSpamReports?: number;
        pendingFraudReports?: number;
        pendingAppointments?: number;
    };
};

export function AdminTaskSummary() {
    const [data, setData] = useState<AdminNotificationsResponse | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loadNotifications = async () => {
            try {
                const res = await fetch("/api/admin/notifications", { cache: "no-store" });
                if (!res.ok) return;

                const json = (await res.json()) as AdminNotificationsResponse;
                if (!cancelled) setData(json);
            } catch (error) {
                console.error("Admin task summary error:", error);
            }
        };

        loadNotifications();
        const intervalId = window.setInterval(loadNotifications, 15000);
        window.addEventListener("focus", loadNotifications);
        window.addEventListener("admin-notifications-refresh", loadNotifications);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
            window.removeEventListener("focus", loadNotifications);
            window.removeEventListener("admin-notifications-refresh", loadNotifications);
        };
    }, []);

    const tasks = useMemo(() => {
        const detail = data?.detail || {};

        return [
            {
                href: "/admin/properties?status=pending",
                label: "Tin BDS cho duyet",
                count: Number(detail.pendingProperties || 0),
                icon: Building2,
                color: "text-orange-600 bg-orange-50 border-orange-200",
            },
            {
                href: "/admin/reports",
                label: "Bao cao cong dong",
                count: Number(detail.pendingReports || 0),
                icon: TriangleAlert,
                color: "text-red-600 bg-red-50 border-red-200",
            },
            {
                href: "/admin/appointments",
                label: "Lich hen cho xu ly",
                count: Number(detail.pendingAppointments || 0),
                icon: Banknote,
                color: "text-blue-600 bg-blue-50 border-blue-200",
            },
        ];
    }, [data]);

    const activeTasks = tasks.filter((task) => task.count > 0);

    if (!data || activeTasks.length === 0) return null;

    return (
        <div className="rounded-xl border border-red-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 border-b border-red-100 bg-red-50 px-5 py-4">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                    <h3 className="font-semibold text-red-900">Viec can xu ly</h3>
                    <p className="text-xs text-red-700/80">He thong dang co {data.total || 0} dau viec can admin xem.</p>
                </div>
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
                {activeTasks.map(({ href, label, count, icon: Icon, color }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-slate-50 ${color}`}
                    >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="min-w-0 flex-1 text-sm font-semibold">{label}</span>
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                            {count > 99 ? "99+" : count}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
