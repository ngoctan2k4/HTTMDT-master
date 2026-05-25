"use client";

import { MessageSquare } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function ContactSellerModal({
    propertyId,
    authorId,
    authorName,
    propertyTitle,
}: {
    propertyId: string;
    authorId: string;
    authorName?: string;
    propertyTitle?: string;
}) {
    const { data: session } = useSession();
    const router = useRouter();

    const handleChatClick = () => {
        if (!session) {
            router.push(`/login?callbackUrl=/property/${propertyId}`);
            return;
        }
        if (session.user.id === authorId) {
            alert("Bạn không thể tự nhắn tin cho chính mình.");
            return;
        }

        const params = new URLSearchParams({ peer: authorId, property: propertyId });
        if (authorName) params.set("name", authorName);
        if (propertyTitle) params.set("propertyTitle", propertyTitle);
        router.push(`/dashboard/messages?${params.toString()}`);
    };

    return (
        <button
            onClick={handleChatClick}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-[0.98] py-3 px-4 rounded-lg font-bold text-lg transition-all"
        >
            <MessageSquare className="h-5 w-5" />
            Chat với người bán
        </button>
    );
}
