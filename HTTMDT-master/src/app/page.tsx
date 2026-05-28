import { Hero } from "@/components/home/Hero";
import { FeaturedListings } from "@/components/home/FeaturedListings";
import { Categories } from "@/components/home/Categories";
import { LatestRentals } from "@/components/home/LatestRentals";
import { PopularLocations } from "@/components/home/PopularLocations";
import { BannerAd } from "@/components/common/BannerAd";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  let featuredProperties = [];
  let latestRentals = [];
  let dbError = false;

  try {
    await dbConnect();
    const activeCondition = {
      expiryDate: { $not: { $lte: new Date() } },
      isHidden: { $ne: true },
      status: "approved",
    };

    // Fetch featured properties
    const featuredPropertiesRaw = await Property.find({ isFeatured: true, ...activeCondition }).limit(8).lean();

    // Fetch latest rentals
    const latestRentalsRaw = await Property.find({ type: "Cho thuê", ...activeCondition }).sort({ postedDate: -1 }).limit(4).lean();

    // Convert _id to string for Next.js Client Components compatibility
    featuredProperties = featuredPropertiesRaw.map((p: any) => ({
      ...p,
      id: p._id.toString(),
      _id: undefined
    }));
    
    latestRentals = latestRentalsRaw.map((p: any) => ({
      ...p,
      id: p._id.toString(),
      _id: undefined
    }));
  } catch (error) {
    console.error("Database connection failed:", error);
    dbError = true;
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {dbError && (
        <div className="bg-destructive/15 text-destructive p-4 text-center text-sm font-medium">
          ⚠️ Không thể kết nối đến MongoDB Atlas. Vui lòng kiểm tra <strong>Network Access</strong> trên{" "}
          <a href="https://cloud.mongodb.com" target="_blank" className="underline font-bold">
            cloud.mongodb.com
          </a>{" "}
          và thêm IP hiện tại của bạn, hoặc kiểm tra lại MONGODB_URI trong file .env.local.
        </div>
      )}
      <Hero />
      <BannerAd type="shopee" className="px-4 mt-6" />
      <Categories />
      <FeaturedListings properties={featuredProperties} />
      <BannerAd type="lazada" className="px-4" />
      <LatestRentals properties={latestRentals} />
      <PopularLocations />
    </div>
  );
}
