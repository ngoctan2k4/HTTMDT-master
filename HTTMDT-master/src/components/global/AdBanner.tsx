import Link from "next/link";
import { BadgePercent, ExternalLink } from "lucide-react";

interface AdBannerProps {
    className?: string;
    type?: "horizontal" | "square" | "vertical";
    variant?: "furniture" | "bank" | "electronics";
}

const adVariants = {
    furniture: {
        label: "Nội thất",
        title: "Decor nhà mới, giảm đến 45%",
        description: "Sofa, đèn, kệ tủ và đồ bếp giao nhanh cho căn hộ vừa chốt.",
        cta: "Xem ưu đãi",
        href: "https://shopee.vn/",
        image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1100&h=900&fit=crop&auto=format&q=85",
        accent: "from-amber-950/85 via-amber-900/45 to-transparent",
    },
    bank: {
        label: "Tài chính",
        title: "Vay mua nhà lãi suất ưu đãi",
        description: "So sánh gói vay, dự toán dòng tiền và nhận tư vấn miễn phí.",
        cta: "Tính khoản vay",
        href: "https://www.google.com/search?q=vay+mua+nha",
        image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1100&h=900&fit=crop&auto=format&q=85",
        accent: "from-slate-950/85 via-blue-950/50 to-transparent",
    },
    electronics: {
        label: "Gia dụng",
        title: "Sắm thiết bị cho tổ ấm",
        description: "Máy lạnh, tủ lạnh, camera an ninh và đồ điện thông minh.",
        cta: "Mua ngay",
        href: "https://www.lazada.vn/",
        image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=1100&h=900&fit=crop&auto=format&q=85",
        accent: "from-zinc-950/85 via-orange-950/45 to-transparent",
    },
} as const;

export function AdBanner({ className = "", type = "horizontal", variant }: AdBannerProps) {
    const isHorizontal = type === "horizontal";
    const selectedVariant = variant || (type === "vertical" ? "bank" : type === "square" ? "electronics" : "furniture");
    const ad = adVariants[selectedVariant];
    const sizeClass = isHorizontal ? "min-h-36 w-full" : type === "vertical" ? "min-h-[460px] w-full" : "aspect-square w-full";

    return (
        <Link
            href={ad.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`group relative block overflow-hidden rounded-xl border bg-slate-950 shadow-sm transition-transform duration-300 hover:-translate-y-0.5 ${sizeClass} ${className}`}
        >
            <img
                src={ad.image}
                alt={`${ad.title} quảng cáo`}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${ad.accent}`} />
            <div className="absolute inset-0 bg-black/10" />
            <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm">
                <BadgePercent className="h-3 w-3 text-orange-600" />
                Quảng cáo
            </span>

            <div className={`relative z-10 flex h-full flex-col justify-end p-5 text-white ${isHorizontal ? "max-w-xl" : ""}`}>
                <p className="mb-2 w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                    {ad.label}
                </p>
                <h4 className={`${isHorizontal ? "text-2xl" : "text-xl"} font-bold leading-tight drop-shadow-sm`}>
                    {ad.title}
                </h4>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/85">
                    {ad.description}
                </p>
                <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-bold text-slate-950 transition-colors group-hover:bg-orange-50">
                    {ad.cta}
                    <ExternalLink className="h-4 w-4" />
                </span>
            </div>
        </Link>
    );
}
