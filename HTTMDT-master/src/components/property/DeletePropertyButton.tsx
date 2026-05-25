"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function DeletePropertyButton({ propertyId }: { propertyId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Bạn có chắc chắn muốn xóa tin đăng này không? Hành động này không thể hoàn tác.")) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/properties/${propertyId}`, { method: "DELETE" });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                alert(data.error || "Không thể xóa tin đăng.");
                return;
            }

            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Không thể xóa tin đăng.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Xóa tin
        </button>
    );
}
