import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { ShareEvent } from "@/models/ShareEvent";

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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { propertyId?: string; method?: string };
    const oid = body?.propertyId ? toObjectId(body.propertyId) : null;
    if (!oid) {
      return NextResponse.json({ error: "propertyId không hợp lệ" }, { status: 400 });
    }

    const session = await auth();
    const ownerId = session?.user?.id;

    await dbConnect();
    await ShareEvent.create({
      propertyId: oid,
      ownerId: ownerId || undefined,
      method: typeof body?.method === "string" ? body.method : "unknown",
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(e, "Không thể ghi nhận chia sẻ") },
      { status: 500 }
    );
  }
}

