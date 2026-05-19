import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";

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

