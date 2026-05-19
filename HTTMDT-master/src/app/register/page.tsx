"use client"

import Link from "next/link";
import { useState } from "react";
import { UserPlus } from "lucide-react";

export default function RegisterPage() {
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        // Client-side Validations
        const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
        if (!nameRegex.test(name.trim())) {
            setErrorMsg("Họ và tên không được chứa số hoặc ký tự đặc biệt.");
            setLoading(false);
            return;
        }

        if (!phone || phone.trim() === "") {
            setErrorMsg("Vui lòng nhập số điện thoại.");
            setLoading(false);
            return;
        }

        const phoneRegex = /^(84|0[3|5|7|8|9])+([0-9]{8})\b$/;
        if (!phoneRegex.test(phone.trim())) {
            setErrorMsg("Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.");
            setLoading(false);
            return;
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            setErrorMsg("Mật khẩu yếu: Cần tối thiểu 8 ký tự, gồm ít nhất 1 chữ cái và 1 số.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, phone, email, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.message || "Đã xảy ra lỗi");
            } else {
                window.location.href = "/login";
            }
        } catch (error) {
            setErrorMsg("Không thể kết nối tới server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[70vh]">
            <div className="w-full max-w-md bg-card border rounded-xl shadow-lg p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                        <UserPlus className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-bold">Tạo tài khoản</h1>
                    <p className="text-muted-foreground mt-2 text-sm text-center">Đăng ký thành viên để trải nghiệm đầy đủ các tính năng của NhaTot Clone.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}
                    <div>
                        <label className="block text-sm font-medium mb-1">Họ và tên <span className="text-red-500">*</span></label>
                        <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Nguyễn Văn A" className="w-full h-11 px-4 rounded-md border text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                        <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901234567" className="w-full h-11 px-4 rounded-md border text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className="w-full h-11 px-4 rounded-md border text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Mật khẩu <span className="text-red-500">*</span></label>
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full h-11 px-4 rounded-md border text-sm" />
                    </div>

                    <div className="flex items-start gap-2 py-2">
                        <input type="checkbox" required className="mt-1" id="terms" />
                        <label htmlFor="terms" className="text-sm text-muted-foreground inline-block">
                            Tôi đồng ý với các <a href="#" className="font-medium text-primary hover:underline">Điều khoản dịch vụ</a> và <a href="#" className="font-medium text-primary hover:underline">Chính sách bảo mật</a>.
                        </label>
                    </div>

                    <button type="submit" disabled={loading} className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-70 mt-2">
                        {loading ? "Đang xử lý..." : "Đăng ký ngay"}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                    Đã có tài khoản? <Link href="/login" className="text-primary font-semibold hover:underline">Đăng nhập</Link>
                </p>
            </div>
        </div>
    );
}
