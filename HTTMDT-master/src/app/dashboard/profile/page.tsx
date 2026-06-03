"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Briefcase,
  CalendarDays,
  CreditCard,
  Loader2,
  Mail,
  Phone,
  Save,
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
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

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
          setBankName(data.bankInfo?.bankName || "");
          setAccountNumber(data.bankInfo?.accountNumber || "");
          setAccountName(data.bankInfo?.accountName || "");
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
        body: JSON.stringify({ name, phone, userType, bankName, accountNumber, accountName }),
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

  if (loading) {
    return (
      <div className="flex p-8 justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const joinedDate = createdAt ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(createdAt)) : "Chưa có";
  const verifiedDate = emailVerified
    ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(emailVerified))
    : "";

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

          <section className="space-y-4 border-t pt-6">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <CreditCard className="h-5 w-5 text-primary" /> Thông tin thanh toán / nhận cọc
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên ngân hàng</label>
                <input
                  type="text"
                  placeholder="VD: Vietcombank, Techcombank..."
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Số tài khoản</label>
                <input
                  type="text"
                  placeholder="Nhập số tài khoản"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Tên chủ tài khoản</label>
                <input
                  type="text"
                  placeholder="NGUYEN VAN A"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
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
