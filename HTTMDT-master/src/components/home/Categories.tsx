import { Home, Building, Map, ShoppingBag, TrendingUp, Warehouse } from "lucide-react";
import Link from "next/link";

const categories = [
    { name: "Căn hộ chung cư", icon: Building, href: "/search?q=Căn hộ chung cư" },
    { name: "Nhà phố", icon: Home, href: "/search?q=Nhà phố" },
    { name: "Đất nền", icon: Map, href: "/search?q=Đất nền" },
    { name: "Mặt bằng kinh doanh", icon: ShoppingBag, href: "/search?q=Mặt bằng kinh doanh" },
    { name: "Biệt thự", icon: TrendingUp, href: "/search?q=Biệt thự" },
    { name: "Phòng trọ", icon: Warehouse, href: "/search?q=Phòng trọ" },
];

export function Categories() {
    return (
        <section className="py-12 bg-background border-b">
            <div className="container mx-auto px-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">Khám phá danh mục</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {categories.map((cat, index) => {
                        const Icon = cat.icon;
                        return (
                            <Link key={index} href={cat.href}>
                                <div className="flex flex-col items-center justify-center p-6 border rounded-xl hover:border-primary hover:text-primary transition-all hover:shadow-sm cursor-pointer bg-card">
                                    <Icon className="h-10 w-10 mb-3 text-muted-foreground group-hover:text-primary" />
                                    <span className="text-sm font-medium text-center">{cat.name}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
