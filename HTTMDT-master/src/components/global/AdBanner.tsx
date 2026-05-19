import { Megaphone } from "lucide-react";

interface AdBannerProps {
    className?: string;
    type?: "horizontal" | "square" | "vertical";
}

export function AdBanner({ className = "", type = "horizontal" }: AdBannerProps) {
    const isHorizontal = type === "horizontal";
    
    return (
        <div className={`relative overflow-hidden rounded-xl border bg-muted/30 p-1 group flex items-center justify-center ${isHorizontal ? "h-32 w-full" : "aspect-square w-full"} ${className}`}>
            <span className="absolute top-2 right-2 text-[10px] uppercase font-bold text-muted-foreground/60 bg-background/50 px-2 py-0.5 rounded-sm backdrop-blur-sm z-10 border">
                Quảng Cáo
            </span>
            
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-orange-500/5 group-hover:from-primary/10 group-hover:to-orange-500/10 transition-colors duration-500"></div>
            
            <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
                <Megaphone className="h-8 w-8 text-primary/40 mb-2" />
                <h4 className="font-semibold text-foreground/70">Không gian Quảng cáo</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Liên hệ An Cư Plus để đặt banner quảng cáo tại đây.</p>
            </div>
            
            {/* Playful placeholder shapes */}
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-primary/10 rounded-full blur-xl"></div>
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-orange-500/10 rounded-full blur-xl"></div>
        </div>
    );
}
