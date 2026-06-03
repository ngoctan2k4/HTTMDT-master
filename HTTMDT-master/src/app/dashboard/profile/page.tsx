"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Loader2,
  Mail,
  Phone,
  Save,
  Send,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

const userTypes = ["Khách hàng", "Chính chủ", "Môi giới"];

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [createdAt, setCreatedAt] = useState("");
  const [emailVerified, setEmailVerified] = useState("");
  const [userType, setUserType] = useState("Khách hàng");
  const [isVerified, setIsVerified] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [emailMessage, setEmailMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setPhone(data.phone || "");
          setEmail(data.email || "");
          setRole(data.role || "user");
          setCreatedAt(data.createdAt || "");
          setEmailVerified(data.emailVerified || "");
          setUserType(data.userType || "Khách hàng");
          setIsVerified(Boolean(data.isVerified));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, userType }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Cập nhật thông tin tài khoản thành công!", type: "success" });
        router.refresh();
      } else {
        setMessage({ text: data.error || "Cập nhật thất bại.", type: "error" });
      }
    } catch {
      setMessage({ text: "Đã xảy ra lỗi hệ thống.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmailOtp = async () => {
    setSendingOtp(true);
    setEmailMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/user/email/send-otp", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
        setEmailMessage({ text: data.message || "Mã OTP đã được gửi đến email của bạn.", type: "success" });
      } else {
        setEmailMessage({ text: data.message || "Không thể gửi mã OTP.", type: "error" });
      }
    } catch {
      setEmailMessage({ text: "Không thể kết nối tới server.", type: "error" });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyEmail = async () => {
    setVerifyingEmail(true);
    setEmailMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/user/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: emailOtp }),
      });
      const data = await res.json();

      if (res.ok) {
        setEmailVerified(data.emailVerified || new Date().toISOString());
        setOtpSent(false);
        setEmailOtp("");
        setEmailMessage({ text: data.message || "Xác thực email thành công.", type: "success" });
      } else {
        setEmailMessage({ text: data.message || "Xác thực email thất bại.", type: "error" });
      }
    } catch {
      setEmailMessage({ text: "Không thể kết nối tới server.", type: "error" });
    } finally {
      setVerifyingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const joinedDate = createdAt ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(createdAt)) : "Chưa có";
  const verifiedDate = emailVerified ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(emailVerified)) : "";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Thông tin tài khoản</h1>
      <p className="mb-8 text-muted-foreground">Xem thông tin đã đăng ký và cập nhật hồ sơ sử dụng An Cư Plus.</p>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-5 border-b bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/20 bg-background">
              <UserCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                {name || "Người dùng"}
                {emailVerified ? <BadgeCheck className="h-5 w-5 text-blue-500" /> : null}
              </h2>
              <p className="text-sm text-muted-foreground">Vai trò: {role === "admin" ? "Quản trị viên" : "Người dùng"}</p>
            </div>
          </div>
          <div className="rounded-md border bg-background px-3 py-2 text-sm">
            Email:{" "}
            {emailVerified ? (
              <span className="font-medium text-green-600">Đã xác thực{verifiedDate ? ` (${verifiedDate})` : ""}</span>
            ) : (
              <span className="font-medium text-amber-600">Chưa xác thực</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8 p-6">
          {message.text ? (
            <div className={`rounded-lg p-4 text-sm font-medium ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {message.text}
            </div>
          ) : null}

          <section className="space-y-4">
            <h3 className="text-base font-semibold">Thông tin đã đăng ký</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="profile-name" className="text-sm font-medium">
                  Họ và tên
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="profile-phone" className="text-sm font-medium">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    id="profile-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\s/g, ""))}
                    className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="profile-email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input id="profile-email" type="email" value={email} disabled className="h-10 w-full rounded-md border bg-muted pl-9 pr-3 text-sm text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ngày đăng ký</label>
                <div className="flex h-10 items-center gap-2 rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  {joinedDate}
                </div>
              </div>
            </div>
          </section>

          {!emailVerified ? (
            <section className="space-y-4 border-t pt-6">
              <h3 className="text-base font-semibold">Xác thực email</h3>
              {emailMessage.text ? (
                <div className={`rounded-lg p-3 text-sm font-medium ${emailMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {emailMessage.text}
                </div>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row">
                {otpSent ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Nhập mã OTP"
                    className="h-11 min-w-0 flex-1 rounded-md border px-4 text-center text-sm font-semibold tracking-[0.35em] outline-none transition-colors focus:border-primary"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={otpSent ? handleVerifyEmail : handleSendEmailOtp}
                  disabled={sendingOtp || verifyingEmail || (otpSent && emailOtp.length !== 6)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {sendingOtp || verifyingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {otpSent ? "Xác thực email" : "Gửi OTP xác thực"}
                </button>
                {otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={sendingOtp || verifyingEmail}
                    className="h-11 rounded-md border px-4 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Gửi lại
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="space-y-4 border-t pt-6">
            <h3 className="text-base font-semibold">Bạn đang tham gia An Cư Plus với tư cách gì?</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {userTypes.map((type) => {
                const selected = userType === type;
                const Icon = type === "Chính chủ" ? ShieldCheck : type === "Môi giới" ? Briefcase : UserCircle;
                return (
                  <label
                    key={type}
                    className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                      selected ? "border-primary bg-primary/5 shadow-sm" : "hover:bg-muted"
                    }`}
                  >
                    <input type="radio" checked={selected} onChange={() => setUserType(type)} className="hidden" />
                    <Icon className={`h-8 w-8 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="text-center">
                      <div className="text-sm font-medium">{type}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {type === "Khách hàng" ? "Tìm kiếm và liên hệ tin đăng." : type === "Chính chủ" ? "Tự đăng bán hoặc cho thuê." : "Đăng tin và tư vấn cho khách hàng."}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground">
              Trạng thái KYC/CCCD:{" "}
              {isVerified ? <span className="font-medium text-green-600">Đã xác thực</span> : <span className="font-medium text-amber-600">Chưa xác thực</span>}
            </p>
          </section>

          <div className="flex justify-end border-t pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Lưu thông tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
