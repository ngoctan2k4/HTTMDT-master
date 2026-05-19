import Link from "next/link";
import { BadgeAlert } from "lucide-react";

interface BannerAdProps {
    type: "shopee" | "lazada" | "google";
    className?: string;
}

export function BannerAd({ type, className = "" }: BannerAdProps) {
    // Determine configuration based on the Ad type
    let config = {
        title: "",
        bgClass: "",
        imagePlaceholder: "",
        linkUrl: "#",
        isAdSense: false
    };

    switch (type) {
        case "shopee":
            config = {
                title: "Shopee Super Sale",
                bgClass: "bg-orange-50 hover:bg-orange-100 border-orange-200",
                imagePlaceholder: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200&h=200&fit=crop", // placeholder sale image
                linkUrl: "https://shopee.vn/", // TODO: User should replace with their Affiliate link
                isAdSense: false
            };
            break;
        case "lazada":
            config = {
                title: "Lazada Mega Offers",
                bgClass: "bg-blue-50 hover:bg-blue-100 border-blue-200",
                imagePlaceholder: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=200&fit=crop",
                linkUrl: "https://www.lazada.vn/", // TODO: User should replace with their Affiliate link
                isAdSense: false
            };
            break;
        case "google":
            config = {
                title: "Google AdSense",
                bgClass: "bg-gray-50",
                imagePlaceholder: "",
                linkUrl: "",
                isAdSense: true
            };
            break;
    }

    if (config.isAdSense) {
        return (
            <div className={`w-full flex justify-center py-4 ${className} overflow-hidden`}>
                <div className="w-full max-w-5xl h-[90px] md:h-[120px] bg-muted relative rounded-md border border-dashed flex items-center justify-center flex-col text-muted-foreground group">
                    <span className="text-xs uppercase absolute top-2 left-2 flex items-center gap-1 opacity-50 bg-background px-2 py-0.5 rounded">
                        <BadgeAlert className="w-3 h-3" /> Quảng cáo
                    </span>
                    <p className="text-sm">Chỗ trống dành cho Google AdSense</p>
                    <p className="text-xs opacity-60">Hãy dán script `&lt;ins class="adsbygoogle" ...&gt;` vào vị trí này</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full flex justify-center py-4 ${className}`}>
            <Link 
                href={config.linkUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`w-full max-w-5xl block border rounded-xl overflow-hidden transition-colors relative group ${config.bgClass}`}
            >
                <div className="h-[120px] md:h-[160px] relative">
                    <img 
                        src={config.imagePlaceholder} 
                        alt={`${config.title} Banner`} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center px-8">
                        <div>
                            <span className="text-xs uppercase flex w-fit items-center gap-1 opacity-80 bg-white/20 text-white backdrop-blur-sm px-2 py-0.5 rounded mb-2">
                                <BadgeAlert className="w-3 h-3" /> Quảng Cáo
                            </span>
                            <h3 className="text-white text-2xl font-bold">{config.title}</h3>
                            <p className="text-white/80 mt-1">Săn deal chớp nhoáng, hàng ngàn voucher giảm giá!</p>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
