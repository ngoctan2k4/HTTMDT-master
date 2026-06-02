import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, Search } from "lucide-react";
import dbConnect from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { Favorite } from "@/models/Favorite";
import { Property } from "@/models/Property";
import { FavoritePropertyList } from "@/components/property/FavoritePropertyList";

export const revalidate = 0;

type SavedProperty = {
  id: string;
  title: string;
  price: string;
  address: string;
  city?: string;
  images?: string[];
  beds?: number;
  baths?: number;
  area?: number;
  isFeatured?: boolean;
  type?: string;
  propertyType?: string;
  depositStatus?: string;
  author?: {
    name?: string;
    userType?: string;
    isVerified?: boolean;
  };
};

type FavoriteDocument = {
  propertyId?: { toString(): string } | string | null;
};

type PropertyDocument = Omit<SavedProperty, "id"> & {
  _id: { toString(): string };
};

export default async function FavoritePropertiesPage() {
  const session = await auth();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    redirect("/login?callbackUrl=/dashboard/favorites");
  }

  let properties: SavedProperty[] = [];
  let dbError = false;

  try {
    await dbConnect();
    const favorites = (await Favorite.find({ ownerId }).sort({ createdAt: -1 }).lean()) as unknown as FavoriteDocument[];
    const propertyIds = favorites.map((favorite) => favorite.propertyId).filter(Boolean);
    const rows = (await Property.find({
      _id: { $in: propertyIds },
      status: "approved",
      isHidden: { $ne: true },
      expiryDate: { $not: { $lte: new Date() } },
    }).lean()) as unknown as PropertyDocument[];
    const byId = new Map<string, PropertyDocument>(
      rows.map((property) => [property._id.toString(), property])
    );

    properties = favorites
      .map((favorite) => {
        const propertyId = favorite.propertyId?.toString();
        return propertyId ? byId.get(propertyId) : undefined;
      })
      .filter((property): property is PropertyDocument => Boolean(property))
      .map(({ _id, ...property }) => ({
        ...property,
        id: _id.toString(),
      }));
  } catch (e) {
    console.error("Favorite properties query failed:", e);
    dbError = true;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tin đã lưu</h1>
          <p className="mt-1 text-muted-foreground">
            Các bất động sản bạn đã đánh dấu để xem lại sau.
          </p>
        </div>
        <Link
          href="/search"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          <Search className="h-4 w-4" />
          Tìm thêm tin
        </Link>
      </div>

      {dbError ? (
        <div className="mb-6 rounded-md bg-destructive/15 p-4 text-center font-medium text-destructive">
          Không thể lấy danh sách tin đã lưu. Vui lòng kiểm tra kết nối MongoDB.
        </div>
      ) : null}

      {!dbError && properties.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-30" />
          <div className="mb-2 text-lg font-semibold">Bạn chưa lưu tin nào</div>
          <div className="mb-6 text-sm text-muted-foreground">
            Khi gặp tin phù hợp, hãy bấm lưu tin để quay lại nhanh ở đây.
          </div>
          <Link
            href="/search"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <Search className="h-4 w-4" />
            Khám phá tin đăng
          </Link>
        </div>
      ) : null}

      {!dbError && properties.length > 0 ? (
        <FavoritePropertyList properties={properties} />
      ) : null}
    </div>
  );
}
