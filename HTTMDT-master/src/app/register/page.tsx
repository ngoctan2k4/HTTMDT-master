"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MailCheck, UserPlus } from "lucide-react";

type RegisterField = "name" | "phone" | "email" | "password" | "terms" | "otp";
type RegisterErrors = Partial<Record<RegisterField, string>>;

const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
const phoneRegex = /^(84|0[35789])([0-9]{8})$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

function validateRegisterField(field: RegisterField, value: string | boolean) {
  if (field === "name") {
    const name = String(value).trim();
    if (!name) return "Vui lòng nhập họ và tên.";
    if (name.length < 2) return "Họ và tên phải có tối thiểu 2 ký tự.";
    if (name.length > 80) return "Họ và tên quá dài.";
    if (!nameRegex.test(name)) return "Họ và tên không được chứa số hoặc ký tự đặc biệt.";
  }

  if (field === "phone") {
    const phone = String(value).trim();
    if (!phone) return "Vui lòng nhập số điện thoại.";
    if (!phoneRegex.test(phone)) return "Số điện thoại Việt Nam không hợp lệ.";
  }

  if (field === "email") {
    const email = String(value).trim();
    if (!email) return "Vui lòng nhập email.";
    if (email.length > 120) return "Email quá dài.";
    if (!emailRegex.test(email)) return "Email không đúng định dạng.";
  }

  if (field === "password") {
    const password = String(value);
    if (!password) return "Vui lòng nhập mật khẩu.";
    if (password.length < 8) return "Mật khẩu cần tối thiểu 8 ký tự.";
    if (!/[A-Za-z]/.test(password)) return "Mật khẩu cần ít nhất 1 chữ cái.";
    if (!/\d/.test(password)) return "Mật khẩu cần ít nhất 1 số.";
    if (!/^[A-Za-z\d@$!%*#?&]+$/.test(password)) return "Mật khẩu chỉ được dùng chữ, số và @$!%*#?&.";
    if (!passwordRegex.test(password)) return "Mật khẩu chưa đủ mạnh.";
  }

  if (field === "terms" && value !== true) {
    return "Bạn cần đồng ý điều khoản trước khi đăng ký.";
  }

  if (field === "otp") {
    const otp = String(value).trim();
    if (!otp) return "Vui lòng nhập mã OTP.";
    if (!/^\d{6}$/.test(otp)) return "Mã OTP gồm 6 chữ số.";
  }

  return "";
}

function validateRegisterForm(name: string, phone: string, email: string, password: string, terms: boolean): RegisterErrors {
  return {
    name: validateRegisterField("name", name),
    phone: validateRegisterField("phone", phone),
    email: validateRegisterField("email", email),
    password: validateRegisterField("password", password),
    terms: validateRegisterField("terms", terms),
  };
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [terms, setTerms] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<RegisterField, boolean>>>({});
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const errors = useMemo(() => validateRegisterForm(name, phone, email, password, terms), [name, phone, email, password, terms]);
  const otpError = validateRegisterField("otp", otp);
  const hasErrors = Object.values(errors).some(Boolean);

  const markTouched = (field: RegisterField) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const touchAll = () => {
    setTouched({ name: true, phone: true, email: true, password: true, terms: true });
  };

  const registerPayload = {
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    password,
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    touchAll();
    setErrorMsg("");
    setSuccessMsg("");

    if (hasErrors) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-register-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerPayload),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Không thể gửi mã OTP.");
      } else {
        setOtpSent(true);
        setSuccessMsg(data.message || "Mã OTP đã được gửi đến email của bạn.");
      }
    } catch {
      setErrorMsg("Không thể kết nối tới server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched((current) => ({ ...current, otp: true }));
    setErrorMsg("");
    setSuccessMsg("");

    if (!otpSent) {
      await handleSendOtp(e);
      return;
    }

    if (hasErrors || otpError) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...registerPayload, otp: otp.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Đã xảy ra lỗi.");
      } else {
        window.location.href = "/login";
      }
    } catch {
      setErrorMsg("Không thể kết nối tới server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            {otpSent ? <MailCheck className="h-10 w-10" /> : <UserPlus className="h-10 w-10" />}
          </div>
          <h1 className="text-2xl font-bold">Tạo tài khoản</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Đăng ký thành viên An Cư Plus. Bạn cần xác thực OTP qua email trước khi tài khoản được tạo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {errorMsg ? <p className="mb-4 text-sm font-medium text-red-500">{errorMsg}</p> : null}
          {successMsg ? <p className="mb-4 rounded-md bg-green-50 p-3 text-sm font-medium text-green-700">{successMsg}</p> : null}

          <div>
            <label htmlFor="register-name" className="mb-1 block text-sm font-medium">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              id="register-name"
              type="text"
              value={name}
              disabled={otpSent}
              onBlur={() => markTouched("name")}
              onChange={(e) => {
                setName(e.target.value);
                if (!touched.name && e.target.value) markTouched("name");
              }}
              placeholder="Nguyễn Văn A"
              aria-invalid={Boolean(touched.name && errors.name)}
              className={`h-11 w-full rounded-md border px-4 text-sm outline-none transition-colors focus:border-primary disabled:bg-muted ${
                touched.name && errors.name ? "border-red-400 bg-red-50" : ""
              }`}
            />
            {touched.name && errors.name ? <p className="mt-1 text-xs font-medium text-red-600">{errors.name}</p> : null}
          </div>

          <div>
            <label htmlFor="register-phone" className="mb-1 block text-sm font-medium">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              id="register-phone"
              type="tel"
              value={phone}
              disabled={otpSent}
              onBlur={() => markTouched("phone")}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\s/g, ""));
                if (!touched.phone && e.target.value) markTouched("phone");
              }}
              placeholder="0901234567"
              aria-invalid={Boolean(touched.phone && errors.phone)}
              className={`h-11 w-full rounded-md border px-4 text-sm outline-none transition-colors focus:border-primary disabled:bg-muted ${
                touched.phone && errors.phone ? "border-red-400 bg-red-50" : ""
              }`}
            />
            {touched.phone && errors.phone ? <p className="mt-1 text-xs font-medium text-red-600">{errors.phone}</p> : null}
          </div>

          <div>
            <label htmlFor="register-email" className="mb-1 block text-sm font-medium">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="register-email"
              type="email"
              value={email}
              disabled={otpSent}
              onBlur={() => markTouched("email")}
              onChange={(e) => {
                setEmail(e.target.value);
                if (!touched.email && e.target.value) markTouched("email");
              }}
              placeholder="name@example.com"
              aria-invalid={Boolean(touched.email && errors.email)}
              className={`h-11 w-full rounded-md border px-4 text-sm outline-none transition-colors focus:border-primary disabled:bg-muted ${
                touched.email && errors.email ? "border-red-400 bg-red-50" : ""
              }`}
            />
            {touched.email && errors.email ? <p className="mt-1 text-xs font-medium text-red-600">{errors.email}</p> : null}
          </div>

          <div>
            <label htmlFor="register-password" className="mb-1 block text-sm font-medium">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <input
              id="register-password"
              type="password"
              value={password}
              disabled={otpSent}
              onBlur={() => markTouched("password")}
              onChange={(e) => {
                setPassword(e.target.value);
                if (!touched.password && e.target.value) markTouched("password");
              }}
              placeholder="••••••••"
              aria-invalid={Boolean(touched.password && errors.password)}
              className={`h-11 w-full rounded-md border px-4 text-sm outline-none transition-colors focus:border-primary disabled:bg-muted ${
                touched.password && errors.password ? "border-red-400 bg-red-50" : ""
              }`}
            />
            {touched.password && errors.password ? (
              <p className="mt-1 text-xs font-medium text-red-600">{errors.password}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Tối thiểu 8 ký tự, gồm ít nhất 1 chữ cái và 1 số.</p>
            )}
          </div>

          {otpSent ? (
            <div>
              <label htmlFor="register-otp" className="mb-1 block text-sm font-medium">
                Mã OTP email <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="register-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onBlur={() => markTouched("otp")}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ""));
                    if (!touched.otp && e.target.value) markTouched("otp");
                  }}
                  placeholder="123456"
                  aria-invalid={Boolean(touched.otp && otpError)}
                  className={`h-11 min-w-0 flex-1 rounded-md border px-4 text-center text-sm font-semibold tracking-[0.4em] outline-none transition-colors focus:border-primary ${
                    touched.otp && otpError ? "border-red-400 bg-red-50" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={loading}
                  className="h-11 rounded-md border px-3 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Gửi lại
                </button>
              </div>
              {touched.otp && otpError ? <p className="mt-1 text-xs font-medium text-red-600">{otpError}</p> : null}
            </div>
          ) : (
            <div className="space-y-1 py-2">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  id="terms"
                  checked={terms}
                  onBlur={() => markTouched("terms")}
                  onChange={(e) => {
                    setTerms(e.target.checked);
                    markTouched("terms");
                  }}
                />
                <label htmlFor="terms" className="inline-block text-sm text-muted-foreground">
                  Tôi đồng ý với các{" "}
                  <a href="#" className="font-medium text-primary hover:underline">
                    Điều khoản dịch vụ
                  </a>{" "}
                  và{" "}
                  <a href="#" className="font-medium text-primary hover:underline">
                    Chính sách bảo mật
                  </a>
                  .
                </label>
              </div>
              {touched.terms && errors.terms ? <p className="text-xs font-medium text-red-600">{errors.terms}</p> : null}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || hasErrors || (otpSent && Boolean(otpError))}
            className="mt-2 h-11 w-full rounded-md bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Đang xử lý..." : otpSent ? "Xác thực và đăng ký" : "Gửi OTP qua email"}
          </button>

          {otpSent ? (
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setSuccessMsg("");
                setErrorMsg("");
              }}
              className="w-full text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Sửa thông tin đăng ký
            </button>
          ) : null}
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
