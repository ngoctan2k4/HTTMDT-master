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
    depositStatus,
    author,
}: PropertyCardProps) {
    return (
        <Link href={`/property/${id}`}>
            <div className="group relative overflow-hidden rounded-xl border bg-background transition-all hover:shadow-lg h-full flex flex-col">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    {isFeatured && (
                        <Badge className="absolute left-3 top-3 z-10 bg-primary hover:bg-primary">
                            Tin Nổi Bật
                        </Badge>
                    )}
                    {depositStatus === "pending" && (
                        <Badge className="absolute left-3 bottom-3 z-10 border-none bg-amber-500 text-white hover:bg-amber-500">
                            Đang giữ chỗ
                        </Badge>
                    )}
                    <Badge variant="secondary" className="absolute right-3 top-3 z-10 bg-black/50 text-white hover:bg-black/50 border-none backdrop-blur-md">
                        {type || "Mua Bán"}
                    </Badge>
                    <div className="bg-gray-200 w-full h-full flex items-center justify-center text-muted-foreground group-hover:scale-105 transition-transform duration-300">
                        {/* Using a placeholder for now since we don't have actual images */}
                        {imageUrl ? (
                            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                        ) : (
                            <span>Image Placeholder</span>
                        )}
                    </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                    <div className="mb-2 text-xl font-bold text-red-500">{price}</div>
                    <h3 className="mb-2 line-clamp-2 text-sm font-medium leading-snug text-foreground flex-1">
                        {title}
                    </h3>
                    {author && (
                        <div className="mb-2 flex items-center gap-2 text-xs">
                            <span className="font-semibold text-foreground/80 flex items-center gap-1">
                                {author.name} {author.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                            </span>
                            {author.userType && author.userType !== "Khách hàng" && (
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border-none ${author.userType === "Chính chủ" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                    {author.userType}
                                </Badge>
                            )}
                        </div>
                    )}
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
