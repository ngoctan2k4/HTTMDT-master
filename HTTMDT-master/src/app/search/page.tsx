import { PropertyCard } from "@/components/property/PropertyCard";
import { Filter, Search } from "lucide-react";
import { AdBanner } from "@/components/global/AdBanner";
import React from "react";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";
import Link from "next/link";
import { redirect } from "next/navigation";
import { autoCorrect } from "@/lib/autoCorrect";

export const revalidate = 60;

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

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    let results: any[] = [];
    let total = 0;
    let dbError = false;

    // Await searchParams Promise (Next 15 requirement)
    const resolvedSearchParams = await searchParams;

    // Build query from resolvedSearchParams
    const query: any = {
        expiryDate: { $not: { $lte: new Date() } },
        isHidden: { $ne: true },
        status: "approved",
    };

    const qParam = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : '';
    const { corrected: q, hasCorrection, original: qOriginal } = autoCorrect(qParam);

    if (q) {
        query.$or = [
            { title: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { address: { $regex: q, $options: 'i' } },
            { city: { $regex: q, $options: 'i' } },
            { propertyType: { $regex: q, $options: 'i' } },
            { type: { $regex: q, $options: 'i' } }
        ];
    }

    const type = typeof resolvedSearchParams.type === 'string' ? resolvedSearchParams.type : '';
    if (type === 'mua-ban') {
        query.type = 'Mua bán';
    } else if (type === 'cho-thue') {
        query.type = 'Cho thuê';
    }

    const city = typeof resolvedSearchParams.city === 'string' ? resolvedSearchParams.city : '';
    if (city) {
        query.city = city;
    }

    const minPriceStr = typeof resolvedSearchParams.minPrice === 'string' ? resolvedSearchParams.minPrice : '';
    const maxPriceStr = typeof resolvedSearchParams.maxPrice === 'string' ? resolvedSearchParams.maxPrice : '';
    if (minPriceStr || maxPriceStr) {
        query.priceValue = {};
        if (minPriceStr) query.priceValue.$gte = Number(minPriceStr);
        if (maxPriceStr) query.priceValue.$lte = Number(maxPriceStr);
    }

    const minAreaStr = typeof resolvedSearchParams.minArea === 'string' ? resolvedSearchParams.minArea : '';
    const maxAreaStr = typeof resolvedSearchParams.maxArea === 'string' ? resolvedSearchParams.maxArea : '';
    if (minAreaStr || maxAreaStr) {
        query.area = {};
        if (minAreaStr) query.area.$gte = Number(minAreaStr);
        if (maxAreaStr) query.area.$lte = Number(maxAreaStr);
    }

    try {
        await dbConnect();
        // Fetch from DB
        const rawResults = await Property.find(query).sort({ postedDate: -1, createdAt: -1 }).lean();
        total = await Property.countDocuments(query);

        results = rawResults.map((p: any) => ({
            ...p,
            id: p._id.toString(),
            _id: undefined
        }));
    } catch (error) {
        console.error("Database connection failed:", error);
        dbError = true;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Search Header */}
            <form action="/search" method="GET" className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                    <input
                        type="text"
                        name="q"
                        defaultValue={qOriginal}
                        placeholder="Nhập địa điểm, dự án hoặc từ khóa..."
                        className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors pl-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    {type && <input type="hidden" name="type" value={type} />}
                </div>
                <button type="submit" className="h-12 px-6 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 flex items-center justify-center gap-2">
                    <Search className="h-4 w-4" />
                    Tìm kiếm
                </button>
            </form>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Filters Sidebar */}
                <div className="w-full lg:w-72 space-y-6">
                    <form action="/search" method="GET" className="bg-card border rounded-xl p-5 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 pb-4 border-b font-semibold text-lg">
                            <Filter className="h-5 w-5 text-primary" />
                            Bộ lọc nâng cao
                        </div>

                        {/* Maintain search context */}
                        {qOriginal && <input type="hidden" name="q" value={qOriginal} />}

                        <div className="space-y-3">
                            <h3 className="font-medium text-sm text-muted-foreground">Loại hình</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <label className={`flex items-center justify-center py-2 px-3 border rounded-md cursor-pointer transition-colors ${type === '' ? 'bg-primary/10 border-primary text-primary font-medium' : 'hover:bg-muted'}`}>
                                    <input type="radio" name="type" value="" className="hidden" defaultChecked={type === ''} />
                                    Tất cả
                                </label>
                                <label className={`flex items-center justify-center py-2 px-3 border rounded-md cursor-pointer transition-colors ${type === 'mua-ban' ? 'bg-primary/10 border-primary text-primary font-medium' : 'hover:bg-muted'}`}>
                                    <input type="radio" name="type" value="mua-ban" className="hidden" defaultChecked={type === 'mua-ban'} />
                                    Mua Bán
                                </label>
                                <label className={`flex items-center justify-center py-2 px-3 border rounded-md cursor-pointer transition-colors ${type === 'cho-thue' ? 'bg-primary/10 border-primary text-primary font-medium' : 'hover:bg-muted'}`}>
                                    <input type="radio" name="type" value="cho-thue" className="hidden" defaultChecked={type === 'cho-thue'} />
                                    Cho Thuê
                                </label>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-medium text-sm text-muted-foreground">Tỉnh/Thành phố</h3>
                            <select name="city" defaultValue={city} className="w-full h-10 px-3 rounded-md border text-sm focus:ring-1 focus:ring-primary outline-none">
                                <option value="">Toàn quốc</option>
                                {PROVINCES.map((prov) => (
                                    <option key={prov} value={prov}>{prov}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-medium text-sm text-muted-foreground">Khoảng Giá</h3>
                            <div className="flex items-center gap-2">
                                <input type="number" name="minPrice" defaultValue={minPriceStr} placeholder="Từ (Triệu)" className="w-full h-10 px-3 rounded-md border text-sm focus:ring-1 focus:ring-primary outline-none" />
                                <span>-</span>
                                <input type="number" name="maxPrice" defaultValue={maxPriceStr} placeholder="Đến (Triệu)" className="w-full h-10 px-3 rounded-md border text-sm focus:ring-1 focus:ring-primary outline-none" />
                            </div>
                            <p className="text-xs text-muted-foreground">*Quy đổi: 1 Tỷ = 1000 Triệu</p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-medium text-sm text-muted-foreground">Diện Tích (m²)</h3>
                            <div className="flex items-center gap-2">
                                <input type="number" name="minArea" defaultValue={minAreaStr} placeholder="Từ" className="w-full h-10 px-3 rounded-md border text-sm focus:ring-1 focus:ring-primary outline-none" />
                                <span>-</span>
                                <input type="number" name="maxArea" defaultValue={maxAreaStr} placeholder="Đến" className="w-full h-10 px-3 rounded-md border text-sm focus:ring-1 focus:ring-primary outline-none" />
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <button type="submit" className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-md hover:bg-primary/90 transition-colors">
                                Áp Dụng Lọc
                            </button>
                        </div>
                    </form>
                </div>

                {/* Results Info & Grid */}
                <div className="flex-1">
                    <div className="mb-6 pb-4 border-b flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                            <h1 className="text-xl font-semibold">
                                {q ? `Kết quả tìm kiếm cho "${q}"` : type ? `Bất động sản ${type === 'mua-ban' ? 'Mua bán' : 'Cho thuê'}` : 'Tất cả bất động sản'}
                            </h1>
                            {hasCorrection && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Tìm kiếm thay thế cho: <span className="line-through italic">{qOriginal}</span>
                                </p>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full whitespace-nowrap self-start sm:self-center">{total} tin đăng</p>
                    </div>

                    {dbError && (
                        <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6 font-medium">
                            Không thể kết nối đến cơ sở dữ liệu MongoDB. Vui lòng kiểm tra lại cấu hình.
                        </div>
                    )}

                    {results.length === 0 && !dbError ? (
                        <div className="text-center py-20 border rounded-xl bg-muted/20">
                            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <h3 className="text-lg font-medium">Không tìm thấy bất động sản nào</h3>
                            <p className="text-muted-foreground mt-2">Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {results.map((property: any, index: number) => (
                                <React.Fragment key={property.id}>
                                    <PropertyCard
                                        id={property.id}
                                        title={property.title}
                                        price={property.price}
                                        address={`${property.address}, ${property.city}`}
                                        imageUrl={property.images?.[0] || ""}
                                        beds={property.beds || 0}
                                        baths={property.baths || 0}
                                        area={property.area || 0}
                                        isFeatured={property.isFeatured}
                                        type={property.type}
                                        author={property.author}
                                        depositStatus={property.depositStatus}
                                    />
                                    {/* Insert an Ad Banner after the 5th item */}
                                    {index === 4 && (
                                        <div className="col-span-1 sm:col-span-2 xl:col-span-3 my-4">
                                            <AdBanner type="horizontal" />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
