import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { Favorite } from "@/models/Favorite";
import { Property } from "@/models/Property";

export const runtime = "nodejs";

function getErrorMessage(e: unknown, fallback: string) {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return fallback;
}

function toObjectId(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
}

export async function GET() {
  try {
    const session = await auth();
    const ownerId = session?.user?.id;
    if (!ownerId) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    await dbConnect();

    const favorites = await Favorite.find({ ownerId }).sort({ createdAt: -1 }).lean();
    const propertyIds = favorites
      .map((f: any) => f.propertyId)
      .filter(Boolean);

    const propertiesRaw = await Property.find({ _id: { $in: propertyIds } }).lean();
    const map = new Map<string, any>(
      propertiesRaw.map((p: any) => [p._id.toString(), p])
    );

    const properties = favorites
      .map((f: any) => map.get(f.propertyId.toString()))
      .filter(Boolean)
      .map((p: any) => ({
        ...p,
        id: p._id.toString(),
        _id: undefined,
      }));

    return NextResponse.json({ properties });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(e, "Không thể lấy danh sách tin đã lưu") },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const ownerId = session?.user?.id;
    if (!ownerId) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const body = (await req.json()) as { propertyId?: string };
    const oid = body?.propertyId ? toObjectId(body.propertyId) : null;
    if (!oid) {
      return NextResponse.json({ error: "propertyId không hợp lệ" }, { status: 400 });
    }

    await dbConnect();

    // Toggle favorite
    const existing = await Favorite.findOne({ ownerId, propertyId: oid }).lean();
    if (existing) {
      await Favorite.deleteOne({ ownerId, propertyId: oid });
      return NextResponse.json({ saved: false });
    }

    await Favorite.create({ ownerId, propertyId: oid });
    return NextResponse.json({ saved: true }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(e, "Không thể lưu tin") },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const ownerId = session?.user?.id;
    if (!ownerId) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || "";
    const oid = toObjectId(propertyId);
    if (!oid) {
      return NextResponse.json({ error: "propertyId không hợp lệ" }, { status: 400 });
    }

    await dbConnect();
    await Favorite.deleteOne({ ownerId, propertyId: oid });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(e, "Không thể xoá tin đã lưu") },
      { status: 500 }
    );
  }
}

