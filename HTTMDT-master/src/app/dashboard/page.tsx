import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle } from "lucide-react";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { DashboardPropertyList } from "@/components/property/DashboardPropertyList";

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
      postedDate: p.postedDate ? new Date(p.postedDate).toISOString() : null,
      expiryDate: p.expiryDate ? new Date(p.expiryDate).toISOString() : null,
    }));
  } catch (e) {
    dbError = true;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tin của tôi</h1>
          <p className="mt-1 text-muted-foreground">
            Quản lý các tin bạn đã đăng trên An Cư Plus.
          </p>
        </div>
        <Link
          href="/dashboard/post"
          className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <PlusCircle className="h-4 w-4" />
          Đăng tin mới
        </Link>
      </div>

      {dbError ? (
        <div className="mb-6 rounded-md bg-destructive/15 p-4 text-center font-medium text-destructive">
          Không thể kết nối đến cơ sở dữ liệu MongoDB. Vui lòng kiểm tra MONGODB_URI trong .env.local.
        </div>
      ) : null}

      {!dbError && properties.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <div className="mb-2 text-lg font-semibold">Bạn chưa có tin nào</div>
          <div className="mb-6 text-sm text-muted-foreground">
            Hãy đăng tin đầu tiên để bắt đầu tiếp cận khách hàng.
          </div>
          <Link
            href="/dashboard/post"
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <PlusCircle className="h-4 w-4" />
            Đăng tin ngay
          </Link>
        </div>
      ) : null}

      {!dbError && properties.length > 0 ? (
        <DashboardPropertyList properties={properties} />
      ) : null}
    </div>
  );
}
