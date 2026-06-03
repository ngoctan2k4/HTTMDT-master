import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import { buildVerifyEmailOtpEmail, sendMail } from "@/lib/email";
import { EmailOtp } from "@/models/EmailOtp";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ message: "Không tìm thấy tài khoản." }, { status: 404 });
    if (!user.email) return NextResponse.json({ message: "Tài khoản chưa có email để xác thực." }, { status: 400 });
    if (user.emailVerified) return NextResponse.json({ message: "Email đã được xác thực." }, { status: 400 });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await EmailOtp.deleteMany({ email: user.email, purpose: "verify-email" });
    await EmailOtp.create({
      email: user.email,
      purpose: "verify-email",
      otpHash,
      expiresAt,
    });

    await sendMail({
      to: user.email,
      ...buildVerifyEmailOtpEmail(otp),
    });

    return NextResponse.json({ message: "Mã OTP xác thực đã được gửi đến email của bạn." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không xác định";
    return NextResponse.json({ message: "Lỗi gửi OTP: " + message }, { status: 500 });
  }
}
