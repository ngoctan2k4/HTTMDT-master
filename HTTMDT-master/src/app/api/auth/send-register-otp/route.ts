import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import { buildRegisterOtpEmail, sendMail } from "@/lib/email";
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

async function validateRegisterData(name: string, phone: string, email: string, password: string) {
  if (!name || !email || !password || !phone) {
    return "Vui lòng nhập đầy đủ thông tin bắt buộc (Họ tên, Email, Mật khẩu, Số điện thoại).";
  }

  if (!nameRegex.test(name.trim())) {
    return "Họ và tên không được chứa số hoặc ký tự đặc biệt.";
  }

  if (!phoneRegex.test(phone.trim())) {
    return "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam chuẩn.";
  }

  if (!emailRegex.test(email.trim())) {
    return "Email không đúng định dạng.";
  }

  if (!passwordRegex.test(password)) {
    return "Mật khẩu quá yếu! Yêu cầu tối thiểu 8 ký tự, bao gồm cả chữ cái và số.";
  }

  const normalizedEmail = normalizeEmail(email);
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return "Email này đã được sử dụng.";
  }

  const existingPhone = await User.findOne({ phone: phone.trim() });
  if (existingPhone) {
    return "Số điện thoại này đã được sử dụng cho một tài khoản khác.";
  }

  return "";
}

export async function POST(req: Request) {
  try {
    const { name, phone, email, password } = await req.json();

    await dbConnect();

    const validationMessage = await validateRegisterData(name, phone, email, password);
    if (validationMessage) {
      return NextResponse.json({ message: validationMessage }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await EmailOtp.deleteMany({ email: normalizedEmail, purpose: "register" });
    await EmailOtp.create({
      email: normalizedEmail,
      purpose: "register",
      otpHash,
      expiresAt,
    });

    const emailContent = buildRegisterOtpEmail(otp);
    await sendMail({
      to: normalizedEmail,
      ...emailContent,
    });

    return NextResponse.json({
      message: "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.",
      email: normalizedEmail,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không xác định";
    return NextResponse.json({ message: "Lỗi gửi OTP: " + message }, { status: 500 });
  }
}
