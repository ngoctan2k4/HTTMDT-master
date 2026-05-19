"use client";

import { useState } from "react";
import { RefreshCw, Loader2, Check } from "lucide-react";
import { useRouter } from "next/navigation";

export function RenewButton({ propertyId }: { propertyId: string }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleRenew = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/properties/${propertyId}/renew`, { method: "PATCH" });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.refresh(); // Tells Next.js to re-fetch Server Components UI
                }, 1000);
            }
        } catch(err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <button disabled className="w-full flex justify-center items-center gap-2 py-2 text-sm font-semibold rounded-md border-transparent bg-green-50 text-green-600 transition-colors">
                <Check className="w-4 h-4" /> Đã gia hạn thành công
            </button>
        )
    }

    return (
        <button 
            onClick={handleRenew} 
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-2 text-sm font-semibold border rounded-md text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
        >
            {loading ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Gia hạn hiển thị 30 ngày
        </button>
    )
}
