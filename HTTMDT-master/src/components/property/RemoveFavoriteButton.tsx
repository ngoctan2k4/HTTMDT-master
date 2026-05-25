"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartOff, Loader2 } from "lucide-react";

type FavoriteDeleteResponse = { error?: string };

function getErrorMessage(e: unknown, fallback: string) {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return fallback;
}

export function RemoveFavoriteButton({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function removeFavorite() {
    setError(null);
    setRemoving(true);

    try {
      const res = await fetch(`/api/favorites?propertyId=${encodeURIComponent(propertyId)}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as FavoriteDeleteResponse;
      if (!res.ok) throw new Error(data?.error || "Không thể bỏ lưu tin");

      router.refresh();
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Không thể bỏ lưu tin"));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={removeFavorite}
        disabled={removing}
        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-red-200 px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-70"
      >
        {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <HeartOff className="h-4 w-4" />}
        Bỏ lưu
      </button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
