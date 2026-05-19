import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";
import { User } from "@/models/User";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

type Demand = "Mua bán" | "Cho thuê";
type PriceUnit = "Tỷ" | "Triệu" | "Triệu/tháng";

type CreatePropertyBody = {
  title: string;
  description: string;
  address: string;
  city: string;
  demand: Demand;
  propertyType: string;
  area: number;
  beds?: number;
  baths?: number;
  priceNumber: number;
  priceUnit?: PriceUnit;
  imageUrls?: string[];
  videoUrl?: string | null;
  isFeatured?: boolean;
};

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return "Không thể đăng tin";
}

function isDemand(v: unknown): v is Demand {
  return v === "Mua bán" || v === "Cho thuê";
}

function isPriceUnit(v: unknown): v is PriceUnit {
  return v === "Tỷ" || v === "Triệu" || v === "Triệu/tháng";
}

function computePrice(priceNumber: number, unit: PriceUnit, demand: Demand) {
  const rounded = Number.isFinite(priceNumber) ? priceNumber : 0;

  if (demand === "Cho thuê") {
    const priceValue = rounded; // triệu/tháng
    return { price: `${rounded} Triệu/tháng`, priceValue };
  }

  if (unit === "Tỷ") {
    const priceValue = Math.round(rounded * 1000); // quy về "triệu" để sort giống seed
    return { price: `${rounded} Tỷ`, priceValue };
  }

  const priceValue = Math.round(rounded); // triệu
  return { price: `${rounded} Triệu`, priceValue };
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const ownerId = session?.user?.id;
    if (!ownerId) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để đăng tin." }, { status: 401 });
    }

    const body = (await req.json()) as Partial<CreatePropertyBody>;
    const {
      title,
      description,
      address,
      city,
      demand,
      propertyType,
      area,
      beds,
      baths,
      priceNumber,
      priceUnit,
      imageUrls,
      videoUrl,
      isFeatured,
    } = body ?? {};

    if (!title || !description || !address || !city || !demand || !propertyType || !area || !priceNumber) {
      return NextResponse.json({ error: "Thiếu dữ liệu bắt buộc." }, { status: 400 });
    }

    await dbConnect();
    
    // Fetch user profile info
    const dbUser = (await User.findById(ownerId).lean()) as any;
    const userRoleType = dbUser?.userType || "Khách hàng";
    const userVerified = dbUser?.isVerified || false;

    // Check Posting Quotas
    const FREE_QUOTA = 3;
    const usedFree = dbUser?.usedFreePosts || 0;
    const purchased = dbUser?.purchasedPosts || 0;

    if (dbUser?.role !== "admin") {
      if (usedFree < FREE_QUOTA) {
        await User.findByIdAndUpdate(ownerId, { $inc: { usedFreePosts: 1 } });
      } else if (purchased > 0) {
        await User.findByIdAndUpdate(ownerId, { $inc: { purchasedPosts: -1 } });
      } else {
        return NextResponse.json(
          { errorCode: "OVER_QUOTA", error: "Bạn đã hết lượt đăng tin miễn phí. Vui lòng thanh toán để mua thêm lượt đăng." }, 
          { status: 403 }
        );
      }
    }

    const normalizedDemand: Demand = isDemand(demand) ? demand : "Mua bán";
    const normalizedUnit: PriceUnit = isPriceUnit(priceUnit) ? priceUnit : "Tỷ";

    const { price, priceValue } = computePrice(
      Number(priceNumber),
      normalizedUnit,
      normalizedDemand
    );

    const Setting = (await import("@/models/Setting")).Setting;
    const autoApproveSetting = await Setting.findOne({ key: "autoApproveProperties" }).lean() as any;
    const finalStatus = autoApproveSetting?.value === true ? "approved" : "pending";

    const doc = await Property.create({
      ownerId,
      title: String(title).trim(),
      description: String(description).trim(),
      address: String(address).trim(),
      city: String(city).trim(),
      type: normalizedDemand,
      propertyType: String(propertyType),
      area: Number(area),
      beds: beds ? Number(beds) : 0,
      baths: baths ? Number(baths) : 0,
      price,
      priceValue,
      images: Array.isArray(imageUrls) ? imageUrls.filter((x) => typeof x === "string") : [],
      videoUrl: typeof videoUrl === "string" ? videoUrl : undefined,
      isFeatured: Boolean(isFeatured),
      author: {
        name: session.user?.name || "Owner",
        email: session.user?.email || undefined,
        avatar: session.user?.image || "",
        userType: userRoleType,
        isVerified: userVerified,
      },
      status: finalStatus,
      postedDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    return NextResponse.json({ id: doc._id.toString() }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(e) },
      { status: 500 }
    );
  }
}

