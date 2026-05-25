import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";
import { Favorite } from "@/models/Favorite";
import { Report } from "@/models/Report";
import { ShareEvent } from "@/models/ShareEvent";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

function toObjectId(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
}

function computeDepositVnd(property: any) {
  const type = String(property?.type || "");
  const priceValue = Number(property?.priceValue || 0);
  if (type === "Cho thuê") return Math.max(1_000_000, Math.round(priceValue * 1_000_000));
  const v = Math.round(priceValue * 1_000_000 * 0.01);
  return Math.max(50_000_000, v || 50_000_000);
}

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const oid = toObjectId(id);
  if (!oid) {
    return NextResponse.json({ error: "id không hợp lệ" }, { status: 400 });
  }

  await dbConnect();
  const row = await Property.findById(oid).lean();
  if (!row) {
    return NextResponse.json({ error: "Không tìm thấy tin" }, { status: 404 });
  }

  const depositVnd = computeDepositVnd(row);
  return NextResponse.json({
    property: {
      ...row,
      id: (row as any)._id.toString(),
      _id: undefined,
      depositVnd,
    },
  });
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để xóa tin." }, { status: 401 });
    }

    const { id } = await ctx.params;
    const oid = toObjectId(id);
    if (!oid) {
      return NextResponse.json({ error: "id không hợp lệ" }, { status: 400 });
    }

    await dbConnect();

    const property = await Property.findById(oid);
    if (!property) {
      return NextResponse.json({ error: "Không tìm thấy tin" }, { status: 404 });
    }

    const isOwner = String(property.ownerId || "") === session.user.id;
    const isAdmin = session.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Bạn không có quyền xóa tin này." }, { status: 403 });
    }

    const depositStatus = String(property.depositStatus || "none");
    if (!isAdmin && ["pending_confirmation", "deposited"].includes(depositStatus)) {
      return NextResponse.json(
        { error: "Tin này đang có giao dịch đặt cọc, không thể xóa lúc này." },
        { status: 400 }
      );
    }

    await Promise.all([
      Property.deleteOne({ _id: oid }),
      Favorite.deleteMany({ propertyId: oid }),
      Report.deleteMany({ propertyId: oid }),
      ShareEvent.deleteMany({ propertyId: oid }),
    ]);

    return NextResponse.json({ success: true, message: "Đã xóa tin đăng." });
  } catch (error) {
    console.error("Delete property error:", error);
    return NextResponse.json({ error: "Không thể xóa tin đăng." }, { status: 500 });
  }
}
