"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { UserCircle } from "lucide-react";
import { signIn, getSession } from "next-auth/react";

type LoginField = "email" | "password";
type LoginErrors = Partial<Record<LoginField, string>>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateLoginField(field: LoginField, value: string) {
  const trimmedValue = value.trim();

  if (field === "email") {
    if (!trimmedValue) return "Vui lòng nhập email.";
    if (!emailRegex.test(trimmedValue)) return "Email không đúng định dạng.";
    if (trimmedValue.length > 120) return "Email quá dài.";
  }

  if (field === "password") {
    if (!value) return "Vui lòng nhập mật khẩu.";
    if (value.length < 8) return "Mật khẩu phải có tối thiểu 8 ký tự.";
  }

  return "";
}

function validateLoginForm(email: string, password: string): LoginErrors {
  return {
    email: validateLoginField("email", email),
    password: validateLoginField("password", password),
  };
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<Partial<Record<LoginField, boolean>>>({});
  const [errorMsg, setErrorMsg] = useState("");

  const errors = useMemo(() => validateLoginForm(email, password), [email, password]);
  const hasErrors = Object.values(errors).some(Boolean);

  const markTouched = (field: LoginField) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setErrorMsg("");

    if (hasErrors) return;

    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg("Email hoặc mật khẩu không chính xác.");
      } else {
        const session = await getSession();
        window.location.href = session?.user?.role === "admin" ? "/admin" : "/";
      }
    } catch (error) {
      setErrorMsg("Đã xảy ra lỗi khi đăng nhập.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    signIn("google", { callbackUrl: "/auth/redirect" });
  };

  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserCircle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold">Đăng nhập</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Đăng nhập để đăng tin, lưu bất động sản và tương tác với người bán.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {errorMsg ? <p className="mb-4 text-sm font-medium text-red-500">{errorMsg}</p> : null}

          <div>
            <label htmlFor="login-email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onBlur={() => markTouched("email")}
              onChange={(e) => {
                setEmail(e.target.value);
                if (!touched.email && e.target.value) markTouched("email");
              }}
              placeholder="name@example.com"
              aria-invalid={Boolean(touched.email && errors.email)}
              aria-describedby="login-email-error"
              className={`h-11 w-full rounded-md border px-4 text-sm outline-none transition-colors focus:border-primary ${
                touched.email && errors.email ? "border-red-400 bg-red-50" : ""
              }`}
            />
            {touched.email && errors.email ? (
              <p id="login-email-error" className="mt-1 text-xs font-medium text-red-600">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="login-password" className="block text-sm font-medium">
                Mật khẩu
              </label>
              <a href="#" className="text-xs font-medium text-primary hover:underline">
                Quên mật khẩu?
              </a>
            </div>
            <input
              id="login-password"
              type="password"
              value={password}
              onBlur={() => markTouched("password")}
              onChange={(e) => {
                setPassword(e.target.value);
                if (!touched.password && e.target.value) markTouched("password");
              }}
              placeholder="••••••••"
              aria-invalid={Boolean(touched.password && errors.password)}
              aria-describedby="login-password-error"
              className={`h-11 w-full rounded-md border px-4 text-sm outline-none transition-colors focus:border-primary ${
                touched.password && errors.password ? "border-red-400 bg-red-50" : ""
              }`}
            />
            {touched.password && errors.password ? (
              <p id="login-password-error" className="mt-1 text-xs font-medium text-red-600">
                {errors.password}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={loading || hasErrors}
            className="mt-2 h-11 w-full rounded-md bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Đang xử lý..." : "Đăng nhập ngay"}
          </button>
        </form>

        <div className="mt-6 flex w-full items-center gap-4 text-sm text-muted-foreground before:flex-1 before:border-t after:flex-1 after:border-t">
          Hoặc
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors hover:bg-muted"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Đăng nhập với Google
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
