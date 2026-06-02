import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";
import { User } from "@/models/User";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

const FREE_QUOTA = 3;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function getStatus(error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status?: unknown }).status;
        if (typeof status === "number") return status;
    }
    return 500;
}

function getMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    return "Không thể gia hạn tin.";
}

function withStatus(message: string, status: number) {
    const error = new Error(message) as Error & { status: number };
    error.status = status;
    return error;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Vui lòng đăng nhập để gia hạn tin." }, { status: 401 });
        }
        const resolvedParams = await params;

        await dbConnect();

        const mongoSession = await mongoose.startSession();
        mongoSession.startTransaction();

        try {
            const property = await Property.findById(resolvedParams.id).session(mongoSession);
            if (!property) {
                throw withStatus("Tin đăng không tồn tại.", 404);
            }

            const isAdmin = session.user.role === "admin";
            if (!isAdmin && String(property.ownerId) !== session.user.id) {
                throw withStatus("Bạn không có quyền gia hạn tin này.", 403);
            }

            let creditSource: "free" | "purchased" | "admin" = "admin";

            if (!isAdmin) {
                const dbUser = await User.findById(session.user.id).session(mongoSession);
                if (!dbUser) {
                    throw withStatus("Không tìm thấy người dùng.", 404);
                }

                const usedFreePosts = dbUser.usedFreePosts || 0;
                const purchasedPosts = dbUser.purchasedPosts || 0;

                if (usedFreePosts < FREE_QUOTA) {
                    dbUser.usedFreePosts = usedFreePosts + 1;
                    creditSource = "free";
                } else if (purchasedPosts > 0) {
                    dbUser.purchasedPosts = purchasedPosts - 1;
                    creditSource = "purchased";
                } else {
                    await mongoSession.abortTransaction();
                    return NextResponse.json(
                        {
                            errorCode: "OVER_QUOTA",
                            error: "Bạn đã hết lượt đăng tin. Vui lòng thanh toán để mua thêm lượt trước khi gia hạn.",
                        },
                        { status: 403 }
                    );
                }

                await dbUser.save({ session: mongoSession });
            }

            const now = new Date();
            const currentExpiry = property.expiryDate instanceof Date ? property.expiryDate : null;
            const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
            const newExpiry = new Date(baseDate.getTime() + THIRTY_DAYS_MS);

            property.expiryDate = newExpiry;
            await property.save({ session: mongoSession });

            await mongoSession.commitTransaction();

            return NextResponse.json({
                success: true,
                expiryDate: newExpiry,
                creditSource,
            });
        } catch (error) {
            if (mongoSession.inTransaction()) {
                await mongoSession.abortTransaction();
            }

            return NextResponse.json(
                { error: getMessage(error) },
                { status: getStatus(error) }
            );
        } finally {
            mongoSession.endSession();
        }
    } catch(err) {
        return NextResponse.json({ error: "Không thể gia hạn tin." }, { status: 500 });
    }
}
