import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";

// Mật khẩu mặc định cho Admin — bạn đổi sau khi đăng nhập lần đầu!
const DEFAULT_ADMIN_PASSWORD = "Admin@123456";

export async function GET() {
    try {
        await dbConnect();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, salt);

        const existingAdmin = await User.findOne({ email: "admin@example.com" });

        if (existingAdmin) {
            // Nếu đã có nhưng chưa có password, cập nhật mật khẩu cho họ
            await User.findByIdAndUpdate(existingAdmin._id, { password: hashedPassword });
            return NextResponse.json({
                success: true,
                message: `Admin đã tồn tại → đã cập nhật mật khẩu thành: ${DEFAULT_ADMIN_PASSWORD}`,
                email: "admin@example.com",
                password: DEFAULT_ADMIN_PASSWORD,
            });
        }

        // Tạo admin mới với mật khẩu được mã hóa
        const newAdmin = await User.create({
            name: "Super Admin",
            email: "admin@example.com",
            password: hashedPassword,
            role: "admin",
            image: "https://ui-avatars.com/api/?name=Super+Admin&background=random",
        });

        return NextResponse.json({
            success: true,
            message: "Tạo thành công Admin user!",
            email: "admin@example.com",
            password: DEFAULT_ADMIN_PASSWORD,
            user: { id: newAdmin._id, name: newAdmin.name, role: newAdmin.role },
        });

    } catch (error: any) {
        console.error("Lỗi khi tạo user:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
