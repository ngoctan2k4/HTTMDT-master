import { PropertyCard } from "@/components/property/PropertyCard";

interface FeaturedListingsProps {
    properties: any[];
}

export function FeaturedListings({ properties }: FeaturedListingsProps) {
    if (!properties || properties.length === 0) {
        return (
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Tin Bất Động Sản Nổi Bật</h2>
                    <p className="text-muted-foreground">Chưa có dữ liệu bất động sản nổi bật.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight mb-2">Tin Bất Động Sản Nổi Bật</h2>
                        <p className="text-muted-foreground">
                            Khám phá những bất động sản đang được quan tâm nhất hiện nay.
                        </p>
                    </div>
                    <button className="text-sm font-medium text-primary hover:underline">
                        Xem tất cả »
                    </button>
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
                            isFeatured={property.isFeatured}
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
