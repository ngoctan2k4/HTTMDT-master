import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB

function safeExtFromType(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "video/mp4") return "mp4";
  return "";
}

async function saveFileToPublicUploads(file: File, kind: "image" | "video") {
  const ext = safeExtFromType(file.type);
  if (!ext) {
    throw new Error(`Unsupported ${kind} type: ${file.type || "unknown"}`);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (buf.byteLength > maxBytes) {
    throw new Error(`${kind} too large`);
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const filename = `${crypto.randomUUID?.() ?? crypto.randomBytes(16).toString("hex")}.${ext}`;
  const abs = path.join(uploadsDir, filename);
  await writeFile(abs, buf);

  return `/uploads/${filename}`;
}

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return "Upload thất bại";
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để tải file." }, { status: 401 });
    }

    const form = await req.formData();

    const images = form.getAll("images").filter((v): v is File => v instanceof File);
    const video = form.get("video");

    if (images.length > MAX_IMAGES) {
      return NextResponse.json({ error: `Tối đa ${MAX_IMAGES} ảnh.` }, { status: 400 });
    }

    const imageUrls: string[] = [];
    for (const img of images) {
      imageUrls.push(await saveFileToPublicUploads(img, "image"));
    }

    let videoUrl: string | null = null;
    if (video && video instanceof File && video.size > 0) {
      videoUrl = await saveFileToPublicUploads(video, "video");
    }

    return NextResponse.json({ imageUrls, videoUrl });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(e) },
      { status: 500 }
    );
  }
}

