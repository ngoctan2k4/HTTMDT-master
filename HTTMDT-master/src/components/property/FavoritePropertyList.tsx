"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Filter, HeartOff, Loader2, Search, Square } from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { RemoveFavoriteButton } from "@/components/property/RemoveFavoriteButton";

type FavoriteProperty = {
  id: string;
  title?: string;
  price?: string;
  address?: string;
  city?: string;
  images?: string[];
  beds?: number;
  baths?: number;
  area?: number;
  isFeatured?: boolean;
  type?: string;
  propertyType?: string;
  depositStatus?: string;
  author?: {
    name?: string;
    userType?: string;
    isVerified?: boolean;
  };
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function FavoritePropertyList({ properties }: { properties: FavoriteProperty[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkRemoving, setBulkRemoving] = useState(false);

  const typeOptions = useMemo(() => {
    return Array.from(new Set(properties.map((property) => property.type).filter(Boolean) as string[]));
  }, [properties]);

  const propertyTypeOptions = useMemo(() => {
    return Array.from(new Set(properties.map((property) => property.propertyType).filter(Boolean) as string[]));
  }, [properties]);

  const filteredProperties = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());

    return properties.filter((property) => {
      if (typeFilter !== "all" && property.type !== typeFilter) return false;
      if (propertyTypeFilter !== "all" && property.propertyType !== propertyTypeFilter) return false;

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
  }, [properties, query, typeFilter, propertyTypeFilter]);

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

  async function removeSelected() {
    const ids = selectedVisibleIds;
    if (ids.length === 0) return;

    if (!confirm(`Bỏ lưu ${ids.length} tin đang chọn?`)) return;

    setBulkRemoving(true);
    let failed = 0;

    for (const id of ids) {
      try {
        const res = await fetch(`/api/favorites?propertyId=${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!res.ok) failed += 1;
      } catch {
        failed += 1;
      }
    }

    setBulkRemoving(false);
    setSelected(new Set());

    if (failed > 0) {
      alert(`Đã bỏ lưu một phần. Có ${failed} tin chưa xử lý được.`);
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
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
            >
              <option value="all">Tất cả giao dịch</option>
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <select
            value={propertyTypeFilter}
            onChange={(event) => setPropertyTypeFilter(event.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
          >
            <option value="all">Tất cả loại nhà</option>
            {propertyTypeOptions.map((propertyType) => (
              <option key={propertyType} value={propertyType}>
                {propertyType}
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
            onClick={removeSelected}
            disabled={bulkRemoving || selectedVisibleIds.length === 0}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-red-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {bulkRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <HeartOff className="h-4 w-4" />}
            Bỏ lưu tin đã chọn
          </button>
        </div>
      </div>

      {filteredProperties.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Không có tin đã lưu nào khớp bộ lọc hiện tại.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => {
            const checked = selected.has(property.id);

            return (
              <div
                key={property.id}
                className={`relative flex h-full flex-col gap-2 rounded-xl transition-colors ${
                  checked ? "ring-2 ring-primary/30" : ""
                }`}
              >
                <label className="absolute left-3 top-3 z-30 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-background/95 shadow">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOne(property.id)}
                    className="h-4 w-4 accent-primary"
                    aria-label={`Chọn ${property.title || "tin đã lưu"}`}
                  />
                </label>

                <PropertyCard
                  id={property.id}
                  title={property.title || "Tin bất động sản"}
                  price={property.price || "Chưa rõ"}
                  address={`${property.address || ""}${property.city ? `, ${property.city}` : ""}`}
                  imageUrl={property.images?.[0] || ""}
                  beds={property.beds || 0}
                  baths={property.baths || 0}
                  area={property.area || 0}
                  isFeatured={property.isFeatured}
                  type={property.type}
                  depositStatus={property.depositStatus}
                  author={property.author}
                />
                <RemoveFavoriteButton propertyId={property.id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
