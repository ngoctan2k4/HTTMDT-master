import Link from "next/link";

const locations = [
    { name: "Hồ Chí Minh", count: "480", img: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80" },
    { name: "Hà Nội", count: "320", img: "https://ik.imagekit.io/tvlk/blog/2017/06/kham-pha-cac-dia-diem-du-lich-o-ha-noi-ma-ban-khong-the-bo-qua-3.jpg?tr=dpr-2,w-675" },
    { name: "Đà Nẵng", count: "150", img: "https://images.unsplash.com/photo-1559564484-e48b3e040ff4?w=800&q=80" },
    { name: "Bình Dương", count: "90", img: "https://images.unsplash.com/photo-1510006851064-e6056cd0e3a8?w=800&q=80" },
];

export function PopularLocations() {
    return (
        <section className="py-16 bg-muted/20 border-t">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Tiêu điểm khu vực</h2>
                    <p className="text-muted-foreground">
                        Khám phá bất động sản theo thành phố được quan tâm nhiều nhất.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {locations.map((loc, index) => (
                        <Link href={`/search?q=${loc.name}`} key={index}>
                            <div className="relative group overflow-hidden rounded-xl aspect-[4/3] cursor-pointer">
                                {/* Image */}
                                <img
                                    src={loc.img}
                                    alt={loc.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                {/* Overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                {/* Content */}
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-white text-xl font-bold">{loc.name}</h3>
                                    <p className="text-white/80 text-sm mt-1">{loc.count} bất động sản</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
