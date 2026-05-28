"use client";

import { useEffect, useState } from "react";

type AdminNotificationKey = "properties" | "reports" | "appointments";

type AdminNotificationsResponse = {
    notifications?: Partial<Record<AdminNotificationKey, number>>;
};

type AdminTaskBadgeProps = {
    scope: AdminNotificationKey;
    className?: string;
    showZero?: boolean;
};

export function AdminTaskBadge({ scope, className = "", showZero = false }: AdminTaskBadgeProps) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const loadNotifications = async () => {
            try {
                const res = await fetch("/api/admin/notifications", { cache: "no-store" });
                if (!res.ok) return;

                const data = (await res.json()) as AdminNotificationsResponse;
                const nextCount = Number(data.notifications?.[scope] || 0);
                if (!cancelled) setCount(nextCount);
            } catch (error) {
                console.error("Admin task badge error:", error);
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
    }, [scope]);

    if (!showZero && count <= 0) return null;

    return (
        <span
            className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white ring-2 ring-[#0f172a] ${className}`}
            aria-label={`${count} viec can xu ly`}
        >
            {count > 99 ? "99+" : count}
        </span>
    );
}
