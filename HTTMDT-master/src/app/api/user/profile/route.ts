import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
const phoneRegex = /^(84|0[35789])([0-9]{8})$/;
const validUserTypes = ["Khách hàng", "Chính chủ", "Môi giới"];

type UserProfileDocument = {
  name?: string;
  phone?: string;
  email?: string;
  image?: string;
  role?: string;
  createdAt?: Date;
  emailVerified?: Date | null;
  userType?: string;
  isVerified?: boolean;
  bankInfo?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const user = (await User.findById(session.user.id).lean()) as UserProfileDocument | null;
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      name: user.name || "",
      phone: user.phone || "",
      email: user.email || "",
      image: user.image || "",
      role: user.role || "user",
      createdAt: user.createdAt || null,
      emailVerified: user.emailVerified || null,
      userType: user.userType || "Khách hàng",
      isVerified: user.isVerified || false,
      bankInfo: user.bankInfo || { bankName: "", accountNumber: "", accountName: "" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, phone, userType, bankName, accountNumber, accountName } = body;

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập họ và tên." }, { status: 400 });
    }

    if (name.trim().length < 2 || name.trim().length > 80 || !nameRegex.test(name.trim())) {
      return NextResponse.json({ error: "Họ và tên không hợp lệ." }, { status: 400 });
    }

    if (typeof phone !== "string" || !phoneRegex.test(phone.trim())) {
      return NextResponse.json({ error: "Số điện thoại Việt Nam không hợp lệ." }, { status: 400 });
    }

    if (!validUserTypes.includes(userType)) {
      return NextResponse.json({ error: "Loại tài khoản không hợp lệ." }, { status: 400 });
    }

    await dbConnect();

    const phoneOwner = await User.findOne({ phone: phone.trim(), _id: { $ne: session.user.id } });
    if (phoneOwner) {
      return NextResponse.json({ error: "Số điện thoại này đã được sử dụng cho tài khoản khác." }, { status: 400 });
    }

    const updateData: {
      name: string;
      phone: string;
      userType: string;
      bankInfo?: {
        bankName: string;
        accountNumber: string;
        accountName: string;
      };
    } = {
      name: name.trim(),
      phone: phone.trim(),
      userType,
    };

    if (bankName !== undefined || accountNumber !== undefined || accountName !== undefined) {
      updateData.bankInfo = {
        bankName: String(bankName || "").trim(),
        accountNumber: String(accountNumber || "").trim(),
        accountName: String(accountName || "").trim(),
      };
    }

    await User.findByIdAndUpdate(session.user.id, updateData);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
