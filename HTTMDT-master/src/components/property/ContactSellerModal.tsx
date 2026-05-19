"use client";

import { useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function ContactSellerModal({ propertyId, authorId }: { propertyId: string, authorId: string }) {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleChatClick = async () => {
        if (!session) {
            router.push(`/login?callbackUrl=/property/${propertyId}`);
            return;
        }
        if (session.user.id === authorId) {
            alert("Bạn không thể tự nhắn tin cho chính mình.");
            return;
        }

        setLoading(true);
        try {
            // Initiate a dummy/intro message to establish the chat thread
            await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    propertyId, 
                    receiverId: authorId, 
                    content: "Chào bạn, tôi quan tâm đến bất động sản này." 
                })
            });
            // Navigate to messages inbox
            router.push(`/dashboard/messages?peer=${authorId}`);
        } catch(err) {
            console.error("Lỗi mạng", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            onClick={handleChatClick}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-[0.98] py-3 px-4 rounded-lg font-bold text-lg transition-all disabled:opacity-70"
        >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />}
            {loading ? "Đang kết nối..." : "Chat với người bán"}
        </button>
    );
}
