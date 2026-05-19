import { auth } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { redirect } from "next/navigation";
import BillingClient from "./BillingClient";

export const revalidate = 0;

export default async function BillingPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login?callbackUrl=/dashboard/billing");
    }

    await dbConnect();
    const user = await User.findById(session.user.id).lean() as any;

    const usedFreePosts = user?.usedFreePosts || 0;
    const purchasedPosts = user?.purchasedPosts || 0;
    const freeQuotaLimit = 3;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-slate-800">Cổng Thanh Toán</h1>
                <p className="text-muted-foreground">Nạp V-Coin để đẩy tin và mở rộng giới hạn đăng bài không giới hạn.</p>
            </div>
            
            <BillingClient 
                usedFreePosts={usedFreePosts}
                purchasedPosts={purchasedPosts}
                freeQuotaLimit={freeQuotaLimit}
            />
        </div>
    );
}
