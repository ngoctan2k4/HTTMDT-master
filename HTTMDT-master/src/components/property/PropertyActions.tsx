"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart, Share2, Loader2 } from "lucide-react";

type FavoritesToggleResponse = { saved?: boolean; error?: string };

function getErrorMessage(e: unknown, fallback: string) {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return fallback;
}

export function PropertyActions({
  propertyId,
  initialSaved,
}: {
  propertyId: string;
  initialSaved: boolean;
}) {
  const router = useRouter();
  const { status } = useSession();
  const [saved, setSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setSaved(initialSaved), [initialSaved]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, []);

  async function toggleFavorite() {
    setError(null);
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/property/${propertyId}`)}`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      const data = (await res.json()) as FavoritesToggleResponse;
      if (!res.ok) throw new Error(data?.error || "Không thể lưu tin");
      setSaved(Boolean(data?.saved));
      router.refresh();
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Không thể lưu tin"));
    } finally {
      setSaving(false);
    }
  }

  async function share() {
    setError(null);
    setSharing(true);
    let method = "unknown";
    try {
      const title = document?.title || "An Cư Plus";
      if (navigator.share) {
        method = "native";
        await navigator.share({ title, url: shareUrl });
      } else {
        method = "copy";
        await navigator.clipboard.writeText(shareUrl);
        alert("Đã sao chép link tin đăng.");
      }
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Không thể chia sẻ"));
    } finally {
      // best-effort log
      fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, method }),
      }).catch(() => {});
      setSharing(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={share}
        disabled={sharing}
        className="flex items-center gap-2 px-4 py-2 rounded-full border hover:bg-muted transition-colors disabled:opacity-70"
      >
        {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
        <span className="text-sm font-medium">Chia sẻ</span>
      </button>

      <button
        type="button"
        onClick={toggleFavorite}
        disabled={saving}
        className={[
          "flex items-center gap-2 px-4 py-2 rounded-full border transition-colors disabled:opacity-70",
          saved ? "text-red-600 border-red-200 bg-red-50 hover:bg-red-100" : "text-red-500 hover:bg-red-50 border-red-200",
        ].join(" ")}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
        <span className="text-sm font-medium">{saved ? "Đã lưu" : "Lưu tin"}</span>
      </button>

      {error ? <span className="text-xs text-destructive ml-2">{error}</span> : null}
    </div>
  );
}

