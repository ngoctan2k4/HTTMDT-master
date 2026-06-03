import { MapPin, Bed, Bath, Square, UserCircle, Phone, ShieldAlert, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";
import { notFound } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { Favorite } from "@/models/Favorite";
import { PropertyActions } from "@/components/property/PropertyActions";
import { AdBanner } from "@/components/global/AdBanner";
import ReportButton from "@/components/property/ReportButton";
import { ContactSellerModal } from "@/components/property/ContactSellerModal";
import { PropertyMap } from "@/components/property/PropertyMap";
import { BookAppointmentModal } from "@/components/property/BookAppointmentModal";

export const revalidate = 60;

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    let propertyRaw = null;
    let dbError = false;
    let isSaved = false;
    let sessionUserId = null;

    try {
        await dbConnect();
        const session = await auth();
        sessionUserId = session?.user?.id || null;
        const resolvedParams = await params;
        propertyRaw = await Property.findById(resolvedParams.id).lean();

        const isPubliclyVisible =
            propertyRaw &&
            (propertyRaw as any).status === "approved" &&
            (propertyRaw as any).isHidden !== true;
        const canViewHidden =
            propertyRaw &&
            (session?.user?.role === "admin" || sessionUserId === (propertyRaw as any).ownerId);
        if (propertyRaw && !isPubliclyVisible && !canViewHidden) {
            propertyRaw = null;
        }

        const ownerId = sessionUserId;
        const propertyId = (propertyRaw as any)?._id;
        if (ownerId && propertyId) {
            const exists = await Favorite.findOne({ ownerId, propertyId }).lean();
            isSaved = Boolean(exists);
        }
    } catch (error) {
        console.error("Database connection or query failed:", error);
        dbError = true;
    }

    if (dbError) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6 font-medium text-center">
                    Không thể kết nối đến cơ sở dữ liệu MongoDB. Vui lòng đảm bảo MongoDB đang hoạt động tại localhost:27017 hoặc cấu hình MONGODB_URI trong file .env.local.
                </div>
            </div>
        );
    }

    if (!propertyRaw) {
        return notFound();
    }    const property = {
        ...propertyRaw,
        id: (propertyRaw as any)._id.toString(),
        _id: undefined,
        postedDate: (propertyRaw as any).postedDate ? new Intl.DateTimeFormat('vi-VN').format(new Date((propertyRaw as any).postedDate)) : "Vài ngày trước",
        images: (propertyRaw as any).images && (propertyRaw as any).images.length > 0 ? (propertyRaw as any).images : [
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop"
        ]
    } as any;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <nav className="flex text-sm text-muted-foreground mb-6">
                <ol className="flex items-center space-x-2">
                    <li><Link href="/" className="hover:text-primary">Trang chủ</Link></li>
                    <li><span>/</span></li>
                    <li>
                        <Link href={`/search?type=${encodeURIComponent(property.type || "Mua bán")}`} className="hover:text-primary">
                            {property.type || "Mua bán"}
                        </Link>
                    </li>
                    {property.city && (
                        <>
                            <li><span>/</span></li>
                            <li>
                                <Link 
                                    href={`/search?type=${encodeURIComponent(property.type || "Mua bán")}&city=${encodeURIComponent(property.city)}`} 
                                    className="hover:text-primary"
                                >
                                    {property.city}
                                </Link>
                            </li>
                        </>
                    )}
                    <li><span>/</span></li>
                    <li className="text-foreground font-medium truncate max-w-xs">{property.title}</li>
                </ol>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Main Image */}
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
                        {property.images[0] ? (
                            <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">No Image</div>
                        )}
                        <Badge className="absolute top-4 left-4 z-10 bg-black/50 hover:bg-black/60 backdrop-blur">
                            {property.images.length} Ảnh
                        </Badge>
                    </div>

                    {/* Small Images */}
                    <div className="grid grid-cols-4 gap-4">
                        {property.images.map((img: string, idx: number) => (
                            <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                <img src={img} alt={`${property.title} - ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>

                    {/* Title & Info */}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold mb-4">{property.title}</h1>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
                            <div>
                                <div className="text-3xl font-bold text-red-500 mb-2">{property.price}</div>
                                <div className="flex items-center text-muted-foreground gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{property.address}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3 mt-4 sm:mt-0">
                                <PropertyActions propertyId={property.id} initialSaved={isSaved} />
                                <ReportButton propertyId={property.id} />
                            </div>
                        </div>
                    </div>

                    {/* Key Specs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-muted rounded-full"><Square className="h-5 w-5 text-primary" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground">Diện tích</p>
                                <p className="font-semibold">{property.area} m²</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-muted rounded-full"><Bed className="h-5 w-5 text-primary" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground">Phòng ngủ</p>
                                <p className="font-semibold">{property.beds} PN</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-muted rounded-full"><Bath className="h-5 w-5 text-primary" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground">Phòng tắm</p>
                                <p className="font-semibold">{property.baths} PT</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-muted rounded-full"><MapPin className="h-5 w-5 text-primary" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground">Khu vực</p>
                                <p className="font-semibold line-clamp-1">{property.address.split(',')[0]}</p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="pt-2">
                        <h2 className="text-xl font-semibold mb-4">Đặc điểm bất động sản</h2>
                        <div className="whitespace-pre-line text-muted-foreground leading-relaxed">
                            {property.description}
                        </div>
                    </div>

                    <AdBanner type="horizontal" variant="furniture" />

                    {/* Location Map */}
                    <div className="pt-6 border-t pb-4">
                        <h2 className="text-xl font-semibold mb-4">Vị trí trên bản đồ</h2>
                        <PropertyMap address={property.address} />
                    </div>
                </div>

                {/* Sidebar - Contact */}
                <div className="lg:col-span-1 flex flex-col gap-8">
                    <div className="rounded-xl border bg-card text-card-foreground shadow space-y-6 p-6">
                        <div className="flex items-center gap-4">
                            {property.author.avatar ? (
                                <img src={property.author.avatar} alt={property.author.name} className="w-16 h-16 rounded-full object-cover" />
                            ) : (
                                <UserCircle className="w-16 h-16 text-muted-foreground" />
                            )}
                            <div>
                                <h3 className="font-semibold text-lg flex items-center gap-1">
                                    {property.author.name || "Người dùng"}
                                    {property.author.isVerified && <BadgeCheck className="w-5 h-5 text-blue-500" />}
                                </h3>
                                {property.author.userType && property.author.userType !== "Khách hàng" && (
                                    <Badge variant="outline" className={`mt-1 mb-1 text-[10px] px-2 py-0 border-none ${property.author.userType === "Chính chủ" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                        {property.author.userType}
                                    </Badge>
                                )}
                                <p className="text-sm text-muted-foreground">Tham gia: {property.author.joinDate}</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t space-y-4">
                            <button className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-bold text-lg transition-colors shadow-sm">
                                <Phone className="h-5 w-5" />
                                {property.author.phone}
                            </button>
                            <ContactSellerModal
                                propertyId={property.id}
                                authorId={property.ownerId || property.author.id}
                                authorName={property.author.name}
                                propertyTitle={property.title}
                            />
                            
                            <BookAppointmentModal 
                                propertyId={property.id} 
                                authorId={property.ownerId || property.author.id} 
                            />
                        </div>
                        
                        <ReportButton propertyId={property.id} />

                        <div className="pt-4 text-xs text-muted-foreground text-center">
                            Tin đăng lúc: {property.postedDate}
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="p-4 bg-muted/40 text-muted-foreground rounded-xl border text-sm">
                        <p className="font-bold mb-2 flex items-center gap-1 text-foreground/80">
                            <ShieldAlert className="w-4 h-4 text-orange-500" /> Miễn trừ trách nhiệm
                        </p>
                        <p className="text-xs text-justify">
                            Tất cả tin đăng trên <strong>An Cư Plus</strong> là do người dùng tự đăng tải qua mô hình C2C. Chúng tôi KHÔNG tham gia vào quá trình giao dịch. Vui lòng cẩn trọng và tự tìm hiểu kỹ tính pháp lý trước khi chuyển tiền hoặc ký hợp đồng mua bán.
                        </p>
                    </div>

                    {/* AdBanner */}
                    <div>
                        <AdBanner type="vertical" variant="bank" />
                    </div>
                </div>
            </div>
        </div>
    );
}
