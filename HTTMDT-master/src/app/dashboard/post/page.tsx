"use client";

import type { DragEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, MapPin, Building, Activity, ShieldCheck, X, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

type Demand = "Mua bán" | "Cho thuê";
type PriceUnit = "Tỷ" | "Triệu" | "Triệu/tháng";

type UploadResponse = {
  imageUrls?: string[];
  videoUrl?: string | null;
  error?: string;
};

type CreatePropertyResponse = {
  id?: string;
  error?: string;
};

type PaymentRequest = {
  id: string;
  orderCode: string;
  finalPrice: number;
  status: "pending" | "success" | "failed" | "expired";
  qrImageUrl: string;
  bankId: string;
  bankAccountNumber: string;
  bankAccountName: string;
};

function getErrorMessage(e: unknown, fallback: string) {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return fallback;
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const PROVINCES = [
  "Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "An Giang", "Bà Rịa - Vũng Tàu", 
  "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", 
  "Bình Phước", "Bình Thuận", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Đắk Nông", "Điện Biên", 
  "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Tĩnh", "Hải Dương", 
  "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", 
  "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An", "Ninh Bình", 
  "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", 
  "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", 
  "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

export default function PostListingPage() {
  const router = useRouter();
  const { status } = useSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard/post");
    }
  }, [status, router]);

  const [propertyType, setPropertyType] = useState("Căn hộ chung cư");
  const [demand, setDemand] = useState<Demand>("Mua bán");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Hồ Chí Minh");

  const [area, setArea] = useState<string>("50");
  const [priceNumber, setPriceNumber] = useState<string>("10");
  const [priceUnit, setPriceUnit] = useState<PriceUnit>("Tỷ");
  const [beds, setBeds] = useState<string>("2");
  const [baths, setBaths] = useState<string>("1");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);

  const canSubmit = useMemo(() => {
    return (
      title.trim().length > 0 &&
      description.trim().length > 0 &&
      address.trim().length > 0 &&
      city.trim().length > 0 &&
      Number(area) > 0 &&
      Number(priceNumber) > 0 &&
      propertyType.trim().length > 0 &&
      demand.trim().length > 0
    );
  }, [title, description, address, city, area, priceNumber, propertyType, demand]);

  function addImages(next: File[]) {
    const onlyImages = next.filter((f) => f.type.startsWith("image/"));
    const merged = [...images, ...onlyImages].slice(0, 10);
    setImages(merged);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files || []);
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    const vids = files.filter((f) => f.type === "video/mp4");
    if (vids[0] && !video) setVideo(vids[0]);
    if (imgs.length) addImages(imgs);
  }

  async function handleAiGenerate() {
    setError(null);
    setSuccess(null);
    setAiLoading(true);
    try {
      const res = await fetch("/api/generate-desc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: demand === "Mua bán" ? "BĐS" : "BĐS cho thuê",
          area,
          beds,
          address: `${address}${city ? `, ${city}` : ""}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Không thể tạo mô tả");
      setDescription(String(data?.description || ""));
      setSuccess("Đã tạo mô tả bằng AI.");
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Lỗi AI"));
    } finally {
      setAiLoading(false);
    }
  }

  async function handleCreatePayment() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1 }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentRequest(data.payment);
      } else {
        alert(data.error || "Không thể tạo mã QR thanh toán.");
      }
    } catch(err) {
      alert("Lỗi kết nối.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (status !== "authenticated") {
      setError("Vui lòng đăng nhập để đăng tin.");
      return;
    }

    if (!canSubmit) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc (*).");
      return;
    }

    setSubmitting(true);
    try {
      // 1) Upload files
      const form = new FormData();
      images.forEach((img) => form.append("images", img));
      if (video) form.append("video", video);

      const upRes = await fetch("/api/upload", { method: "POST", body: form });
      const upData = (await upRes.json()) as UploadResponse;
      if (!upRes.ok) throw new Error(upData?.error || "Upload thất bại");

      // 2) Create property
      const createRes = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          address,
          city,
          demand,
          propertyType,
          area,
          beds,
          baths,
          priceNumber,
          priceUnit,
          imageUrls: Array.isArray(upData?.imageUrls) ? upData!.imageUrls : [],
          videoUrl: typeof upData?.videoUrl === "string" ? upData.videoUrl : null,
        }),
      });
      const createData = (await createRes.json()) as CreatePropertyResponse & { errorCode?: string };
      if (!createRes.ok) {
        if (createData?.errorCode === "OVER_QUOTA") {
          setPaymentRequest(null);
          setShowCheckout(true);
          return;
        }
        throw new Error(createData?.error || "Không thể đăng tin");
      }

      setSuccess("Đăng tin thành công. Đang chuyển hướng…");
      router.push(`/property/${createData?.id}`);
      router.refresh();
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Đăng tin thất bại"));
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!paymentRequest || paymentRequest.status !== "pending") return;

    const timer = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/${paymentRequest.id}`);
        const data = await res.json();
        if (!res.ok || !data.payment?.status) return;

        setPaymentRequest((prev) => prev ? { ...prev, status: data.payment.status } : prev);
        if (data.payment.status === "success") {
          window.clearInterval(timer);
          setShowCheckout(false);
          setSuccess("Thanh toán thành công! Đang gửi lại tin đăng...");
          setTimeout(() => handleSubmit(), 500);
        }
      } catch {
        // Continue polling while waiting for bank confirmation.
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [paymentRequest]);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {status === "loading" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang kiểm tra đăng nhập...
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Đăng tin mới</h1>
        <p className="text-muted-foreground">
          Vui lòng điền thông tin chi tiết về bất động sản để thu hút nhiều người mua nhất.
        </p>
      </div>

      {(error || success) && (
        <div
          className={[
            "mb-6 rounded-lg border p-4 text-sm font-medium",
            error ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-emerald-50 text-emerald-700 border-emerald-200",
          ].join(" ")}
        >
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Thông tin cơ bản */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 font-semibold text-lg pb-4 border-b">
              <Building className="h-5 w-5 text-primary" />
              Thông tin cơ bản
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Loại hình (*)</label>
                <select
                  className="w-full h-10 px-3 rounded-md border text-sm"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                >
                  <option>Căn hộ chung cư</option>
                  <option>Nhà phố/Biệt thự</option>
                  <option>Đất nền</option>
                  <option>Mặt bằng kinh doanh</option>
                  <option>Phòng trọ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nhu cầu (*)</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer border p-3 rounded flex-1 hover:bg-muted font-medium">
                    <input
                      type="radio"
                      name="demand"
                      checked={demand === "Mua bán"}
                      onChange={() => setDemand("Mua bán")}
                    />
                    Mua bán
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer border p-3 rounded flex-1 hover:bg-muted font-medium">
                    <input
                      type="radio"
                      name="demand"
                      checked={demand === "Cho thuê"}
                      onChange={() => setDemand("Cho thuê")}
                    />
                    Cho thuê
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tỉnh/Thành phố (*)</label>
                  <select className="w-full h-10 px-3 rounded-md border text-sm" value={city} onChange={(e) => setCity(e.target.value)}>
                    {PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Địa chỉ cụ thể (*)</label>
                  <div className="flex items-center relative">
                    <MapPin className="h-4 w-4 absolute left-3 text-muted-foreground" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Số nhà, đường, phường, quận/huyện..."
                      className="w-full h-10 px-3 pl-9 rounded-md border text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Thông tin chi tiết */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 font-semibold text-lg pb-4 border-b">
              <Activity className="h-5 w-5 text-primary" />
              Thông tin chi tiết
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Diện tích (m²) (*)</label>
                <input
                  type="number"
                  min={1}
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mức giá (*)</label>
                <div className="flex items-center border rounded-md">
                  <input
                    type="number"
                    min={1}
                    value={priceNumber}
                    onChange={(e) => setPriceNumber(e.target.value)}
                    className="w-full h-10 px-3 text-sm flex-1 outline-none rounded-l-md bg-transparent"
                  />
                  <select
                    className="bg-muted h-10 px-2 text-sm border-l outline-none rounded-r-md"
                    value={priceUnit}
                    onChange={(e) => setPriceUnit(e.target.value as PriceUnit)}
                  >
                    <option>Tỷ</option>
                    <option>Triệu</option>
                    <option>Triệu/tháng</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số phòng ngủ</label>
                <input type="number" min={0} value={beds} onChange={(e) => setBeds(e.target.value)} className="w-full h-10 px-3 rounded-md border text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số phòng tắm</label>
                <input type="number" min={0} value={baths} onChange={(e) => setBaths(e.target.value)} className="w-full h-10 px-3 rounded-md border text-sm" />
              </div>
            </div>
          </section>

          {/* Tiêu đề & Mô tả */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Tiêu đề tin đăng (*)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Bán CHCC Vinhomes 2PN full nội thất"
                className="w-full h-10 px-3 rounded-md border text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">Viết tiêu đề ngắn gọn, nổi bật điểm mạnh của BĐS.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mô tả chi tiết (*)</label>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chi tiết về vị trí, tiện ích, tình trạng pháp lý..."
                className="w-full p-3 rounded-md border text-sm resize-none"
              />
              <button
                type="button"
                disabled={aiLoading}
                onClick={handleAiGenerate}
                className="text-xs text-blue-600 mt-2 font-medium hover:underline flex items-center gap-2 disabled:opacity-60"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                ✨ Dùng AI viết mô tả chuyên nghiệp dựa trên các thông tin đã nhập
              </button>
            </div>
          </section>

          {/* Hình ảnh */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="font-semibold text-lg mb-4">Hình ảnh và Video</div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => addImages(Array.from(e.target.files || []))}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4"
              className="hidden"
              onChange={(e) => setVideo((e.target.files && e.target.files[0]) || null)}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={handleDrop}
              className={[
                "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                isDragging ? "bg-muted/70 border-primary" : "hover:bg-muted/50",
              ].join(" ")}
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-medium">Nhấp để chọn ảnh (hoặc kéo thả)</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tối đa 10 ảnh (JPG, PNG, WEBP) và 1 video (MP4).
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="text-sm px-3 py-2 rounded-md border hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Chọn ảnh
                </button>
                <button
                  type="button"
                  className="text-sm px-3 py-2 rounded-md border hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    videoInputRef.current?.click();
                  }}
                >
                  Chọn video
                </button>
              </div>
            </div>

            {(images.length > 0 || video) && (
              <div className="mt-4 space-y-3">
                {images.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Ảnh đã chọn ({images.length}/10)</div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {images.map((f, idx) => (
                        <div key={`${f.name}-${idx}`} className="relative rounded-lg overflow-hidden border bg-muted">
                          <img
                            src={URL.createObjectURL(f)}
                            alt={f.name}
                            className="w-full h-24 object-cover"
                            onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-background/90 border rounded-full p-1 hover:bg-background"
                            onClick={() => setImages(images.filter((_, i) => i !== idx))}
                            aria-label="Xóa ảnh"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {video && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{video.name}</div>
                      <div className="text-xs text-muted-foreground">{formatBytes(video.size)}</div>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-md border hover:bg-muted text-sm"
                      onClick={() => setVideo(null)}
                    >
                      Xóa video
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Nút gửi */}
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="w-full h-12 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:bg-primary/90 transition-colors shadow flex items-center justify-center disabled:opacity-70"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang đăng tin...
              </span>
            ) : (
              "Đăng Tin Ngay"
            )}
          </button>
        </div>

        <div className="md:col-span-1 border-l pl-0 md:pl-8 mt-8 md:mt-0 space-y-8">
          <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-800 font-semibold mb-3 pb-3 border-b border-amber-200/50">
              <ShieldCheck className="h-5 w-5" />
              Mẹo đăng tin hiệu quả
            </div>
            <ul className="text-sm text-amber-900 space-y-3 list-disc pl-4">
              <li>Thông tin chi tiết và chính xác giúp người mua dễ duyệt hơn.</li>
              <li>Gắn ít nhất 3 hình ảnh sáng sủa, rõ nét về các phòng và tiện ích.</li>
              <li>
                <strong>Để có nhiều lượt xem hơn:</strong> hãy mua gói đẩy tin hoặc ghim tin trên trang chủ (Phần thanh toán
                BĐS).
              </li>
            </ul>
          </div>

          <div className="bg-primary/5 rounded-xl p-5 border border-primary/20">
            <h3 className="font-semibold text-primary mb-2">🚀 Gói Đăng Tin VIP</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Mua gói hiển thị Nổi Bật / VIP để tiếp cận nhiều khách hàng hơn (Demo Payment Stripe).
            </p>
            <button
              disabled
              className="w-full bg-background border border-primary text-primary text-sm font-medium py-2 rounded-md hover:bg-primary/10 cursor-not-allowed opacity-70"
            >
              Nâng cấp VIP (Đã chọn đăng thường)
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center text-center space-y-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
              <h3 className="font-bold text-xl">Thanh toán Phí Đăng Tin</h3>
              <button disabled={checkoutLoading} onClick={() => setShowCheckout(false)} className="text-white hover:text-red-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="text-sm font-semibold uppercase text-red-500 mb-1">Cảnh báo Quota</div>
                <h4 className="text-xl font-bold">Bạn đã hết 3 lượt đăng tự do!</h4>
                <p className="text-sm text-slate-500 mt-2">Phí niêm yết: <strong className="text-primary text-lg">50,000đ</strong>/tin. Thanh toán theo cú pháp qua Quét mã bên dưới.</p>
              </div>

              {paymentRequest ? (
                <div className="p-4 border rounded-xl flex flex-col items-center justify-center bg-slate-50 gap-4">
                  <img src={paymentRequest.qrImageUrl} alt="VietQR" className="w-56 h-56 object-contain rounded-md bg-white border" />
                  <div className="w-full text-left space-y-2 bg-white p-4 rounded-lg border">
                    <div className="flex justify-between gap-3 border-b pb-2"><span className="text-sm text-slate-500">Ngân hàng</span> <span className="font-bold text-blue-800">{paymentRequest.bankId}</span></div>
                    <div className="flex justify-between gap-3 border-b pb-2"><span className="text-sm text-slate-500">Tài khoản</span> <span className="font-bold">{paymentRequest.bankAccountName}</span></div>
                    <div className="flex justify-between gap-3 border-b pb-2"><span className="text-sm text-slate-500">Số TK</span> <span className="font-bold font-mono">{paymentRequest.bankAccountNumber}</span></div>
                    <div className="flex justify-between gap-3 border-b pb-2"><span className="text-sm text-slate-500">Số tiền</span> <span className="font-bold text-emerald-700">{new Intl.NumberFormat('vi-VN').format(paymentRequest.finalPrice)}đ</span></div>
                    <div className="flex justify-between gap-3"><span className="text-sm text-slate-500">Nội dung</span> <span className="font-bold font-mono text-slate-900 bg-yellow-100 px-1 rounded">{paymentRequest.orderCode}</span></div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Sau khi ngân hàng báo tiền vào, tin đăng sẽ tự gửi lại.</p>
                </div>
              ) : (
                <div className="p-4 border rounded-xl bg-slate-50 text-sm text-slate-600">
                  Tạo mã VietQR riêng cho phí đăng tin. QR có sẵn tài khoản, số tiền và nội dung chuyển khoản.
                </div>
              )}

              <button 
                  disabled={checkoutLoading || !!paymentRequest}
                  onClick={handleCreatePayment}
                  className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-lg hover:bg-primary/90 flex justify-center items-center shadow-md shadow-primary/20 transition-all disabled:opacity-50"
              >
                  {checkoutLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (paymentRequest ? "Đang chờ ngân hàng xác nhận..." : "Tạo mã QR thanh toán")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
