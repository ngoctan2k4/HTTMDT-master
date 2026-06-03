import { MapPin, Bed, Bath, Square, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export interface PropertyCardProps {
  id: string;
  title: string;
  price: string;
  address: string;
  imageUrl: string;
  beds: number;
  baths: number;
  area: number;
  isFeatured?: boolean;
  type?: string;
  depositStatus?: string;
  author?: {
    name?: string;
    userType?: string;
    isVerified?: boolean;
  };
}

export function PropertyCard({
  id,
  title,
  price,
  address,
  imageUrl,
  beds,
  baths,
  area,
  isFeatured = false,
  type,
  author,
}: PropertyCardProps) {
  return (
    <Link href={`/property/${id}`}>
      <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-background transition-all hover:shadow-lg">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {isFeatured ? (
            <Badge className="absolute left-3 top-3 z-10 bg-primary hover:bg-primary">
              Tin nổi bật
            </Badge>
          ) : null}
          <Badge variant="secondary" className="absolute right-3 top-3 z-10 border-none bg-black/50 text-white backdrop-blur-md hover:bg-black/50">
            {type || "Mua bán"}
          </Badge>
          <div className="flex h-full w-full items-center justify-center bg-gray-200 text-muted-foreground transition-transform duration-300 group-hover:scale-105">
            {imageUrl ? <img src={imageUrl} alt={title} className="h-full w-full object-cover" /> : <span>Image Placeholder</span>}
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 text-xl font-bold text-red-500">{price}</div>
          <h3 className="mb-2 line-clamp-2 flex-1 text-sm font-medium leading-snug text-foreground">{title}</h3>
          {author ? (
            <div className="mb-2 flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 font-semibold text-foreground/80">
                {author.name} {author.isVerified ? <BadgeCheck className="h-4 w-4 text-blue-500" /> : null}
              </span>
              {author.userType && author.userType !== "Khách hàng" ? (
                <Badge variant="outline" className={`h-4 border-none px-1.5 py-0 text-[10px] ${author.userType === "Chính chủ" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                  {author.userType}
                </Badge>
              ) : null}
            </div>
          ) : null}
          <div className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{address}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Square className="h-4 w-4" />
              <span>{area} m²</span>
            </div>
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{beds}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{baths}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
