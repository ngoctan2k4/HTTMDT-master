import Link from "next/link";
import { BadgeAlert, Sparkles } from "lucide-react";

interface BannerAdProps {
    type: "shopee" | "lazada" | "google";
    className?: string;
}

const bannerConfigs = {
    shopee: {
        title: "Shopee Super Sale",
        subtitle: "Săn nội thất, đồ bếp và decor nhà mới với voucher giảm sâu.",
        cta: "Săn deal ngay",
        image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1600&h=520&fit=crop&auto=format&q=90",
        linkUrl: "https://shopee.vn/",
        gradient: "from-orange-950/90 via-orange-900/55 to-transparent",
    },
    lazada: {
        title: "Lazada Mega Offers",
        subtitle: "Thiết bị gia dụng, điện máy và smart home cho căn hộ mới.",
        cta: "Xem ưu đãi",
        image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&h=520&fit=crop&auto=format&q=90",
        linkUrl: "https://www.lazada.vn/",
        gradient: "from-blue-950/90 via-indigo-900/50 to-transparent",
    },
} as const;

export function BannerAd({ type, className = "" }: BannerAdProps) {
    if (type === "google") {
        return (
            <div className={`w-full px-4 py-4 ${className}`}>
                <div className="mx-auto flex h-[110px] w-full max-w-5xl items-center justify-center rounded-xl border border-dashed bg-muted text-center text-muted-foreground">
                    <div>
                        <span className="mb-2 inline-flex items-center gap-1 rounded bg-background px-2 py-0.5 text-xs uppercase">
                            <BadgeAlert className="h-3 w-3" />
                            Quảng cáo
                        </span>
                        <p className="text-sm font-medium">Vị trí Google AdSense</p>
                    </div>
                </div>
            </div>
        );
    }

    const config = bannerConfigs[type];

    return (
        <div className={`w-full px-4 py-4 ${className}`}>
            <Link
                href={config.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative mx-auto block min-h-[150px] w-full max-w-5xl overflow-hidden rounded-xl border bg-slate-950 shadow-sm transition-transform duration-300 hover:-translate-y-0.5 md:min-h-[190px]"
            >
                <img
                    src={config.image}
                    alt={`${config.title} banner`}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient}`} />
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10 flex min-h-[150px] max-w-2xl flex-col justify-center px-6 py-5 text-white md:min-h-[190px] md:px-8">
                    <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-md bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide backdrop-blur">
                        <BadgeAlert className="h-3 w-3" />
                        Quảng cáo
                    </span>
                    <h3 className="text-2xl font-black leading-tight drop-shadow-sm md:text-4xl">
                        {config.title}
                    </h3>
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/90 md:text-base">
                        {config.subtitle}
                    </p>
                    <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-bold text-slate-950 transition-colors group-hover:bg-orange-50">
                        <Sparkles className="h-4 w-4 text-orange-600" />
                        {config.cta}
                    </span>
                </div>
            </Link>
        </div>
    );
}
