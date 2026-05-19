import { PropertyCard } from "@/components/property/PropertyCard";
import Link from "next/link";

interface LatestRentalsProps {
    properties: any[];
}

export function LatestRentals({ properties }: LatestRentalsProps) {
    if (!properties || properties.length === 0) return null;

    return (
        <section className="py-16 bg-background">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight mb-2">Tin Cho Thuê Mới Nhất</h2>
                        <p className="text-muted-foreground">
                            Cập nhật danh sách phòng trọ, căn hộ, mặt bằng kinh doanh cho thuê.
                        </p>
                    </div>
                    <Link href="/search?type=cho-thue" className="text-sm font-medium text-primary hover:underline">
                        Xem tất cả »
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {properties.map((property) => (
                        <PropertyCard
                            key={property.id}
                            id={property.id}
                            title={property.title}
                            price={property.price}
                            address={`${property.address}, ${property.city}`}
                            imageUrl={property.images?.[0] || ""}
                            beds={property.beds || 0}
                            baths={property.baths || 0}
                            area={property.area || 0}
                            type={property.type}
                            author={property.author}
                            depositStatus={property.depositStatus}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
