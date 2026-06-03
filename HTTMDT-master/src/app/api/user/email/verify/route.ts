import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import { EmailOtp } from "@/models/EmailOtp";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { otp } = await req.json();
    if (!/^\d{6}$/.test(String(otp || "").trim())) {
      return NextResponse.json({ message: "Mã OTP gồm 6 chữ số." }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ message: "Không tìm thấy tài khoản." }, { status: 404 });
    if (user.emailVerified) return NextResponse.json({ message: "Email đã được xác thực." }, { status: 400 });

    const otpRecord = await EmailOtp.findOne({
      email: user.email,
      purpose: "verify-email",
      expiresAt: { $gt: new Date() },
    }).select("+otpHash");

    if (!otpRecord) {
      return NextResponse.json({ message: "Mã OTP đã hết hạn hoặc chưa được gửi. Vui lòng lấy mã mới." }, { status: 400 });
    }

    if (otpRecord.attempts >= 5) {
      await EmailOtp.deleteOne({ _id: otpRecord._id });
      return NextResponse.json({ message: "Bạn đã nhập sai OTP quá nhiều lần. Vui lòng lấy mã mới." }, { status: 429 });
    }

    const isOtpValid = await bcrypt.compare(String(otp).trim(), otpRecord.otpHash);
    if (!isOtpValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return NextResponse.json({ message: "Mã OTP không chính xác." }, { status: 400 });
    }

    user.emailVerified = new Date();
    await user.save();
    await EmailOtp.deleteMany({ email: user.email, purpose: "verify-email" });

    return NextResponse.json({ message: "Xác thực email thành công.", emailVerified: user.emailVerified });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không xác định";
    return NextResponse.json({ message: "Lỗi xác thực email: " + message }, { status: 500 });
  }
}
