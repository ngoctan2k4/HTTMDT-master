import { Readable } from "node:stream";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getUploadsBucket } from "@/lib/uploads";

export const runtime = "nodejs";

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!mongoose.mongo.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  }

  const objectId = new mongoose.mongo.ObjectId(id);
  const bucket = await getUploadsBucket();
  const file = await bucket.find({ _id: objectId }).next();

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const downloadStream = bucket.openDownloadStream(objectId);
  const contentType = file.contentType || "application/octet-stream";
  const filename = safeFilename(file.filename || "upload");

  return new Response(Readable.toWeb(downloadStream) as ReadableStream, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": String(file.length),
      "Content-Type": contentType,
    },
  });
}
