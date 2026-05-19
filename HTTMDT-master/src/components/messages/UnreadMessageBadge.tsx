"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type UnreadResponse = {
    unreadCount?: number;
};

type UnreadMessageBadgeProps = {
    className?: string;
    showZero?: boolean;
};

export function UnreadMessageBadge({ className = "", showZero = false }: UnreadMessageBadgeProps) {
    const { data: session } = useSession();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!session?.user?.id) {
            setUnreadCount(0);
            return;
        }

        let cancelled = false;

        const loadUnreadCount = async () => {
            try {
                const res = await fetch("/api/messages/unread", { cache: "no-store" });
                if (!res.ok) return;

                const data = (await res.json()) as UnreadResponse;
                if (!cancelled) setUnreadCount(Number(data.unreadCount || 0));
            } catch (error) {
                console.error("Unread message badge error:", error);
            }
        };

        loadUnreadCount();
        const intervalId = window.setInterval(loadUnreadCount, 10000);

        const handleFocus = () => loadUnreadCount();
        window.addEventListener("focus", handleFocus);
        window.addEventListener("message-unread-refresh", handleFocus);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("message-unread-refresh", handleFocus);
        };
    }, [session?.user?.id]);

    if (!showZero && unreadCount <= 0) return null;

    return (
        <span
            className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white ring-2 ring-background ${className}`}
            aria-label={`${unreadCount} tin nhắn chưa đọc`}
        >
            {unreadCount > 99 ? "99+" : unreadCount}
        </span>
    );
}
