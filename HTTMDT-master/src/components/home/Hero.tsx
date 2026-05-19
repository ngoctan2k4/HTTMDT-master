"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { autoCorrect } from "@/lib/autoCorrect";

const slides = [
    {
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=2000&q=80",
        title: "Tìm kiếm nhà đất, bất động sản dễ dàng",
        subtitle: "Chúng tôi có hàng ngàn lựa chọn phù hợp với nhu cầu và ngân sách của bạn."
    },
    {
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=2000&q=80",
        title: "Không gian sống lý tưởng",
        subtitle: "Uy tín - Minh bạch - Thủ tục nhanh gọn."
    },
    {
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=2000&q=80",
        title: "Đầu tư sinh lời vượt trội",
        subtitle: "Nắm bắt cơ hội đầu tư bất động sản tốt nhất 2026."
    }
];

export function Hero() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [type, setType] = useState("mua-ban");
    const [city, setCity] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const PROVINCES = [
        "Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "An Giang", "Bà Rịa - Vũng Tàu", 
        "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", 
        "Bình Phước", "Bình Thuận", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Đắk Nông", "Điện Biên", 
        "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Tĩnh", "Hải Dương", 
        "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", 
        "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An", "Ninh Bình", 
        "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", 
        "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", 
        "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
    ];

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        if (value.trim().length > 1) {
            const { suggestions: newSuggestions } = autoCorrect(value);
            setSuggestions(newSuggestions);
        } else {
            setSuggestions([]);
        }
    };

    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-scroll logic
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000); // Change slide every 5s

        return () => clearInterval(timer);
    }, []);

    const handleSearch = (e: React.FormEvent, overrideQ?: string) => {
        e.preventDefault();
        setSuggestions([]);
        const searchParams = new URLSearchParams();
        if (type) searchParams.set("type", type);
        
        const finalQ = overrideQ !== undefined ? overrideQ : query;
        if (finalQ) searchParams.set("q", finalQ);
        
        if (city) searchParams.set("city", city);
        
        router.push(`/search?${searchParams.toString()}`);
    };

    return (
        <section className="relative w-full h-[550px] flex items-center justify-center border-b overflow-hidden bg-gray-900">
            {/* Background Images Crossfade */}
            {slides.map((slide, index) => (
                <div 
                    key={index}
                    className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 z-0 ${index === currentSlide ? "opacity-100" : "opacity-0"}`}
                    style={{ backgroundImage: `url('${slide.image}')` }}
                ></div>
            ))}

            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/50 z-0"></div>

            <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center text-center mt-10">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-md min-h-[120px] md:min-h-0 transition-all duration-500">
                    {slides[currentSlide].title}
                </h1>
                <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl drop-shadow-sm min-h-[56px] md:min-h-0 transition-all duration-500">
                    {slides[currentSlide].subtitle}
                </p>

                <div className="w-full bg-background rounded-lg shadow-xl p-2 md:p-4">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2">
                        <select 
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="flex h-12 w-full md:max-w-[150px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="mua-ban">Mua bán</option>
                            <option value="cho-thue">Cho thuê</option>
                            <option value="">Tất cả</option>
                        </select>
                        <select 
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="flex h-12 w-full md:max-w-[180px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="">Toàn quốc</option>
                            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                            <input
                                type="text"
                                value={query}
                                onChange={handleQueryChange}
                                placeholder="Nhập địa điểm, dự án hoặc từ khóa..."
                                autoComplete="off"
                                className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-10"
                            />
                            {suggestions.length > 0 && (
                                <ul className="absolute top-14 left-0 w-full bg-background border rounded-md shadow-lg py-1 z-50 text-left">
                                    <li className="px-4 py-2 text-xs text-muted-foreground bg-muted/30 font-semibold border-b">Gợi ý sửa lỗi:</li>
                                    {suggestions.map((s, i) => (
                                        <li 
                                            key={i} 
                                            className="px-4 py-2 hover:bg-muted cursor-pointer text-sm flex items-center gap-2 transition-colors text-foreground"
                                            onClick={() => {
                                                setQuery(s);
                                                handleSearch({ preventDefault: () => {} } as React.FormEvent, s);
                                            }}
                                        >
                                            <Search className="h-4 w-4 text-muted-foreground" />
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button type="submit" className="h-12 px-8 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap">
                            Tìm kiếm
                        </button>
                    </form>
                </div>

                {/* Slider Indicators */}
                <div className="absolute bottom-6 flex gap-2">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"}`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
