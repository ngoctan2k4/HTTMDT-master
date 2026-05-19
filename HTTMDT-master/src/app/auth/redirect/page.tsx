import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";

/**
 * Trang trung gian: sau khi đăng nhập (đặc biệt qua Google),
 * kiểm tra role của user và điều hướng đến đúng trang.
 */
export default async function AuthRedirectPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    if (session.user.role === "admin") {
        redirect("/admin");
    }

    redirect("/");
}
