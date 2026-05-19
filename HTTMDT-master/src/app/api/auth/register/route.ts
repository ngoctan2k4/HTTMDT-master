import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";

export async function POST(req: Request) {
    try {
        const { name, phone, email, password } = await req.json();

        if (!name || !email || !password || !phone) {
            return NextResponse.json({ message: "Vui lòng nhập đầy đủ thông tin bắt buộc (Họ tên, Email, Mật khẩu, Số điện thoại)" }, { status: 400 });
        }

        // Strict Validations
        const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
        if (!nameRegex.test(name.trim())) {
            return NextResponse.json({ message: "Họ và tên không được chứa số hoặc ký tự đặc biệt." }, { status: 400 });
        }

        const phoneRegex = /^(84|0[3|5|7|8|9])+([0-9]{8})\b$/;
        if (!phoneRegex.test(phone.trim())) {
            return NextResponse.json({ message: "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam chuẩn." }, { status: 400 });
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return NextResponse.json({ message: "Mật khẩu quá yếu! Yêu cầu tối thiểu 8 ký tự, bao gồm cả chữ cái và số." }, { status: 400 });
        }

        await dbConnect();

        // 1. IP Rate Limiting
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
        if (ip !== "unknown") {
            const ipCount = await User.countDocuments({ registrationIp: ip });
            if (ipCount >= 2) {
                return NextResponse.json({ message: "Thiết bị/IP của bạn đã vượt quá giới hạn tạo tài khoản mới. Vui lòng sử dụng tài khoản hiện có." }, { status: 429 });
            }
        }

        // 2. Email Normalization (Chống spam email kiểu nguyenvana+1@gmail.com)
        let normalizedEmail = email.trim().toLowerCase();
        if (normalizedEmail.endsWith("@gmail.com")) {
            // Bỏ qua phần từ dấu + trở đi đối với gmail
            normalizedEmail = normalizedEmail.replace(/\+.*@/, "@");
            // Tùy chọn: Xóa dấu chấm (gmail xem test.email và testemail là 1)
            // const [username, domain] = normalizedEmail.split("@");
            // normalizedEmail = username.replace(/\./g, "") + "@" + domain;
        }

        // Kiểm tra xem email đã tồn tại chưa
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return NextResponse.json({ message: "Email này đã được sử dụng" }, { status: 400 });
        }

        // 3. Kiểm tra số điện thoại duy nhất
        const existingPhone = await User.findOne({ phone: phone.trim() });
        if (existingPhone) {
            return NextResponse.json({ message: "Số điện thoại này đã được sử dụng cho một tài khoản khác" }, { status: 400 });
        }

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo user mới với role mặc định là "user"
        const newUser = new User({
            name: name.trim(),
            phone: phone.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "user",
            registrationIp: ip,
        });

        await newUser.save();

        const response = NextResponse.json(
            { message: "Đăng ký thành công", user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } },
            { status: 201 }
        );

        // Đánh dấu thiết bị đã đăng ký bằng Cookie
        response.cookies.set({
            name: 'device_registered',
            value: 'true',
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 365, // 1 year
        });

        return response;
    } catch (error: any) {
        return NextResponse.json({ message: "Lỗi máy chủ: " + error.message }, { status: 500 });
    }
}
