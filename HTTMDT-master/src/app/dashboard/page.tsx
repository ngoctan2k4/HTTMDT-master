import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle } from "lucide-react";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { PropertyCard } from "@/components/property/PropertyCard";
import { RenewButton } from "@/components/property/RenewButton";
import { Badge } from "@/components/ui/badge";

export const revalidate = 0;

export default async function DashboardPage() {
  const session = await auth();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    redirect("/login?callbackUrl=/dashboard");
  }

  let properties: any[] = [];
  let dbError = false;

  try {
    await dbConnect();
    const rows = await Property.find({ ownerId }).sort({ postedDate: -1 }).lean();
    properties = rows.map((p: any) => ({
      ...p,
      id: p._id.toString(),
      _id: undefined,
    }));
  } catch (e) {
    dbError = true;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tin của tôi</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý các tin bạn đã đăng trên An Cư Plus.
          </p>
        </div>
        <Link
          href="/dashboard/post"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Đăng tin mới
        </Link>
      </div>

      {dbError ? (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6 font-medium text-center">
          Không thể kết nối đến cơ sở dữ liệu MongoDB. Vui lòng kiểm tra `MONGODB_URI` trong `.env.local`.
        </div>
      ) : null}

      {!dbError && properties.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <div className="text-lg font-semibold mb-2">Bạn chưa có tin nào</div>
          <div className="text-sm text-muted-foreground mb-6">
            Hãy đăng tin đầu tiên để bắt đầu tiếp cận khách hàng.
          </div>
          <Link
            href="/dashboard/post"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Đăng tin ngay
          </Link>
        </div>
      ) : null}

      {!dbError && properties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => {
            const isExpired = property.expiryDate && new Date(property.expiryDate) < new Date();
            
            return (
              <div key={property.id} className="relative flex flex-col h-full bg-card rounded-xl border group hover:border-primary/50 transition-colors">
                <div className={`flex-1 transition-all ${isExpired ? "opacity-60 grayscale-[0.6] pointer-events-none" : ""}`}>
                  <PropertyCard
                    id={property.id}
                    title={property.title}
                    price={property.price}
                    address={`${property.address}, ${property.city}`}
                    imageUrl={property.images?.[0] || ""}
                    beds={property.beds || 0}
                    baths={property.baths || 0}
                    area={property.area || 0}
                    type={property.type}
                    depositStatus={property.depositStatus}
                    author={property.author}
                  />
                  {/* Prevent click on card if expired but still allow button. Wait, if pointer-events-none is on the wrapper, we can't click anything inside. We will disable pointer events ONLY on the wrapper of the card */}
                </div>
                
                {isExpired && (
                  <div className="absolute top-4 left-4 z-20">
                    <Badge variant="destructive" className="bg-red-600 text-white font-bold px-2 py-0.5 text-xs shadow-md border-0">Tin Đã Hết Hạn</Badge>
                  </div>
                )}
                
                <div className="p-3 border-t bg-muted/20 mt-auto">
                    <div className="mb-2 text-xs text-muted-foreground flex justify-between px-1">
                        <span>Hết hạn:</span>
                        <span className="font-semibold text-foreground">
                            {property.expiryDate ? new Date(property.expiryDate).toLocaleDateString("vi-VN") : "Không xác định"}
                        </span>
                    </div>
                    <RenewButton propertyId={property.id} />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

