"use client";

import { useState } from "react";
import { RefreshCw, Loader2, Check } from "lucide-react";
import { useRouter } from "next/navigation";

type RenewResponse = {
    success?: boolean;
    error?: string;
    errorCode?: string;
};

export function RenewButton({ propertyId }: { propertyId: string }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleRenew = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/properties/${propertyId}/renew`, { method: "PATCH" });
            const data = (await res.json().catch(() => ({}))) as RenewResponse;

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.refresh();
                }, 1000);
                return;
            }

            if (data.errorCode === "OVER_QUOTA") {
                setError(data.error || "Bạn đã hết lượt đăng tin. Vui lòng mua thêm lượt để gia hạn.");
                setTimeout(() => {
                    router.push("/dashboard/billing");
                }, 1200);
                return;
            }

            setError(data.error || "Không thể gia hạn tin. Vui lòng thử lại.");
        } catch (err) {
            console.error(err);
            setError("Không thể gia hạn tin. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <button disabled className="w-full flex justify-center items-center gap-2 py-2 text-sm font-semibold rounded-md border-transparent bg-green-50 text-green-600 transition-colors">
                <Check className="w-4 h-4" /> Đã gia hạn thành công
            </button>
        );
    }

    return (
        <div className="space-y-2">
            <button
                onClick={handleRenew}
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2 text-sm font-semibold border rounded-md text-primary bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-70"
            >
                {loading ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Gia hạn 30 ngày - dùng 1 lượt đăng
            </button>
            {error && (
                <p className="text-xs font-medium text-red-600 text-center leading-relaxed">
                    {error}
                </p>
            )}
        </div>
    );
}
