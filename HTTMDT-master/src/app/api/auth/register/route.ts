import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import { EmailOtp } from "@/models/EmailOtp";
import { User } from "@/models/User";

export const runtime = "nodejs";

const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
const phoneRegex = /^(84|0[35789])([0-9]{8})$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

function normalizeEmail(email: string) {
  let normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail.endsWith("@gmail.com")) {
    normalizedEmail = normalizedEmail.replace(/\+.*@/, "@");
  }
  return normalizedEmail;
}

export async function POST(req: Request) {
  try {
    const { name, phone, email, password, otp } = await req.json();

    if (!name || !email || !password || !phone || !otp) {
      return NextResponse.json({ message: "Vui lòng nhập đầy đủ thông tin và mã OTP xác thực email." }, { status: 400 });
    }

    if (!nameRegex.test(name.trim())) {
      return NextResponse.json({ message: "Họ và tên không được chứa số hoặc ký tự đặc biệt." }, { status: 400 });
    }

    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json({ message: "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam chuẩn." }, { status: 400 });
    }

    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ message: "Email không đúng định dạng." }, { status: 400 });
    }

    if (!passwordRegex.test(password)) {
      return NextResponse.json({ message: "Mật khẩu quá yếu! Yêu cầu tối thiểu 8 ký tự, bao gồm cả chữ cái và số." }, { status: 400 });
    }

    await dbConnect();

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (ip !== "unknown") {
      const ipCount = await User.countDocuments({ registrationIp: ip });
      if (ipCount >= 2) {
        return NextResponse.json(
          { message: "Thiết bị/IP của bạn đã vượt quá giới hạn tạo tài khoản mới. Vui lòng sử dụng tài khoản hiện có." },
          { status: 429 }
        );
      }
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ message: "Email này đã được sử dụng." }, { status: 400 });
    }

    const existingPhone = await User.findOne({ phone: phone.trim() });
    if (existingPhone) {
      return NextResponse.json({ message: "Số điện thoại này đã được sử dụng cho một tài khoản khác." }, { status: 400 });
    }

    const otpRecord = await EmailOtp.findOne({
      email: normalizedEmail,
      purpose: "register",
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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: name.trim(),
      phone: phone.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
      registrationIp: ip,
      emailVerified: new Date(),
    });

    await newUser.save();
    await EmailOtp.deleteMany({ email: normalizedEmail, purpose: "register" });

    const response = NextResponse.json(
      { message: "Đăng ký thành công", user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } },
      { status: 201 }
    );

    response.cookies.set({
      name: "device_registered",
      value: "true",
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không xác định";
    return NextResponse.json({ message: "Lỗi máy chủ: " + message }, { status: 500 });
  }
}
