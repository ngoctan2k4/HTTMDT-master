"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Filter, Loader2, Search, Square, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PropertyCard } from "@/components/property/PropertyCard";
import { RenewButton } from "@/components/property/RenewButton";
import { DeletePropertyButton } from "@/components/property/DeletePropertyButton";

type ManagedProperty = {
  id: string;
  title?: string;
  price?: string;
  address?: string;
  city?: string;
  images?: string[];
  beds?: number;
  baths?: number;
  area?: number;
  type?: string;
  propertyType?: string;
  depositStatus?: string;
  expiryDate?: string | null;
  author?: {
    name?: string;
    userType?: string;
    isVerified?: boolean;
  };
};

type StatusFilter = "all" | "active" | "expired" | "unknown";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function getExpiryStatus(property: ManagedProperty): Exclude<StatusFilter, "all"> {
  if (!property.expiryDate) return "unknown";
  return new Date(property.expiryDate) < new Date() ? "expired" : "active";
}

export function DashboardPropertyList({ properties }: { properties: ManagedProperty[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const typeOptions = useMemo(() => {
    return Array.from(new Set(properties.map((property) => property.type).filter(Boolean) as string[]));
  }, [properties]);

  const filteredProperties = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());

    return properties.filter((property) => {
      if (statusFilter !== "all" && getExpiryStatus(property) !== statusFilter) return false;
      if (typeFilter !== "all" && property.type !== typeFilter) return false;

      if (!normalizedQuery) return true;
      const haystack = normalizeText(
        [
          property.title,
          property.price,
          property.address,
          property.city,
          property.type,
          property.propertyType,
        ]
          .filter(Boolean)
          .join(" ")
      );
      return haystack.includes(normalizedQuery);
    });
  }, [properties, query, statusFilter, typeFilter]);

  const visibleIds = filteredProperties.map((property) => property.id);
  const selectedVisibleIds = visibleIds.filter((id) => selected.has(id));
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleIds.length === visibleIds.length;

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleVisible() {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  async function deleteSelected() {
    const ids = selectedVisibleIds;
    if (ids.length === 0) return;

    if (!confirm(`Xóa ${ids.length} tin đang chọn? Hành động này không thể hoàn tác.`)) return;

    setBulkDeleting(true);
    let failed = 0;

    for (const id of ids) {
      try {
        const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
        if (!res.ok) failed += 1;
      } catch {
        failed += 1;
      }
    }

    setBulkDeleting(false);
    setSelected(new Set());

    if (failed > 0) {
      alert(`Đã xóa một phần. Có ${failed} tin không xóa được, có thể do đang có giao dịch đặt cọc hoặc lỗi quyền.`);
    }

    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto] md:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Lọc theo tiêu đề, khu vực, giá..."
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="relative block">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Còn hạn</option>
              <option value="expired">Hết hạn</option>
              <option value="unknown">Không xác định</option>
            </select>
          </label>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
          >
            <option value="all">Tất cả loại tin</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={toggleVisible}
            disabled={visibleIds.length === 0}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {allVisibleSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            {allVisibleSelected ? "Bỏ chọn" : "Chọn tất cả"}
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Đang hiển thị {filteredProperties.length}/{properties.length} tin. Đã chọn {selectedVisibleIds.length} tin.
          </p>
          <button
            type="button"
            onClick={deleteSelected}
            disabled={bulkDeleting || selectedVisibleIds.length === 0}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-red-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Xóa tin đã chọn
          </button>
        </div>
      </div>

      {filteredProperties.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Không có tin nào khớp bộ lọc hiện tại.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => {
            const expiryStatus = getExpiryStatus(property);
            const isExpired = expiryStatus === "expired";
            const checked = selected.has(property.id);

            return (
              <div
                key={property.id}
                className={`relative flex h-full flex-col rounded-xl border bg-card transition-colors ${
                  checked ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
                }`}
              >
                <label className="absolute left-3 top-3 z-30 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-background/95 shadow">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOne(property.id)}
                    className="h-4 w-4 accent-primary"
                    aria-label={`Chọn ${property.title || "tin đăng"}`}
                  />
                </label>

                <div className={`flex-1 transition-all ${isExpired ? "opacity-60 grayscale-[0.6]" : ""}`}>
                  <PropertyCard
                    id={property.id}
                    title={property.title || "Tin bất động sản"}
                    price={property.price || "Chưa rõ"}
                    address={`${property.address || ""}${property.city ? `, ${property.city}` : ""}`}
                    imageUrl={property.images?.[0] || ""}
                    beds={property.beds || 0}
                    baths={property.baths || 0}
                    area={property.area || 0}
                    type={property.type}
                    depositStatus={property.depositStatus}
                    author={property.author}
                  />
                </div>

                {isExpired && (
                  <div className="absolute right-4 top-4 z-20">
                    <Badge variant="destructive" className="border-0 bg-red-600 px-2 py-0.5 text-xs font-bold text-white shadow-md">
                      Tin đã hết hạn
                    </Badge>
                  </div>
                )}

                <div className="mt-auto space-y-2 border-t bg-muted/20 p-3">
                  <div className="mb-2 flex justify-between px-1 text-xs text-muted-foreground">
                    <span>Hết hạn:</span>
                    <span className="font-semibold text-foreground">
                      {property.expiryDate ? new Date(property.expiryDate).toLocaleDateString("vi-VN") : "Không xác định"}
                    </span>
                  </div>
                  <RenewButton propertyId={property.id} />
                  <DeletePropertyButton propertyId={property.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
