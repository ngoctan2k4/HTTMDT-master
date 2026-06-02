"use client";

import { useEffect, useState } from "react";
import { Loader2, X, Wallet, ArrowRight, Zap, Coins, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface BillingClientProps {
    usedFreePosts: number;
    purchasedPosts: number;
    freeQuotaLimit: number;
}

type PaymentRequest = {
    id: string;
    orderCode: string;
    amount: number;
    finalPrice: number;
    status: "pending" | "success" | "failed" | "expired";
    qrImageUrl: string;
    bankId: string;
    bankAccountNumber: string;
    bankAccountName: string;
    expiredAt: string;
};

export default function BillingClient({ usedFreePosts, purchasedPosts, freeQuotaLimit }: BillingClientProps) {
    const freeRemaining = Math.max(0, freeQuotaLimit - usedFreePosts);
    const router = useRouter();

    const [showCheckout, setShowCheckout] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<{ amount: number, price: number, name: string } | null>(null);
    const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);

    const [customAmount, setCustomAmount] = useState<number | "">("");
    const unitPrice = 50000;

    const [voucherCode, setVoucherCode] = useState("");
    const [voucherLoading, setVoucherLoading] = useState(false);
    const [appliedVoucher, setAppliedVoucher] = useState<{ code: string, discountType: 'percentage' | 'fixed', discountValue: number } | null>(null);
    const [voucherError, setVoucherError] = useState("");
    const packages = [
        { amount: 1, price: 50000, name: "Gói Lẻ 1 Tin", discount: null },
        { amount: 5, price: 220000, name: "Combo 5 Tin", discount: "Tiết kiệm 12%" },
        { amount: 10, price: 400000, name: "Gói Khởi Nghiệp", discount: "Best Seller - Tiết kiệm 20%", isPopular: true },
    ];

    const openCheckout = (pkg: { amount: number, price: number, name: string, discount: string | null, isPopular?: boolean }) => {
        setSelectedPackage(pkg);
        setVoucherCode(""); // Reset voucher code
        setAppliedVoucher(null);
        setVoucherError("");
        setPaymentRequest(null);
        setShowCheckout(true);
    };

    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) return;
        setVoucherLoading(true);
        setVoucherError("");
        try {
            const res = await fetch("/api/users/me/validate-voucher", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: voucherCode })
            });
            const data = await res.json();
            if (res.ok) {
                setAppliedVoucher({
                    code: voucherCode.toUpperCase(),
                    discountType: data.discountType,
                    discountValue: data.discountValue
                });
            } else {
                setVoucherError(data.error || "Mã giảm giá không hợp lệ");
                setAppliedVoucher(null);
            }
        } catch (err) {
            setVoucherError("Lỗi kết nối máy chủ");
        } finally {
            setVoucherLoading(false);
        }
    };

    const handleCreatePayment = async () => {
        if (!selectedPackage) return;
        setCheckoutLoading(true);
        try {
            const res = await fetch("/api/payments/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: selectedPackage.amount, voucherCode: voucherCode || undefined })
            });

            const data = await res.json();

            if (res.ok) {
                setPaymentRequest(data.payment);
            } else {
                alert(data.error || "Không thể tạo mã QR thanh toán.");
            }
        } catch(err) {
            alert("Lỗi kết nối tới máy chủ.");
        } finally {
            setCheckoutLoading(false);
        }
    };

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
                    alert("Thanh toán thành công! Lượt đăng đã được cộng vào ví.");
                    setShowCheckout(false);
                    router.refresh();
                }
            } catch {
                // Continue polling while the checkout modal is open.
            }
        }, 5000);

        return () => window.clearInterval(timer);
    }, [paymentRequest, router]);

    // Compute final price
    const originalPrice = selectedPackage?.price || 0;
    let finalPrice = originalPrice;
    if (appliedVoucher) {
        if (appliedVoucher.discountType === 'percentage') {
            finalPrice = finalPrice - (finalPrice * appliedVoucher.discountValue / 100);
        } else {
            finalPrice = finalPrice - appliedVoucher.discountValue;
        }
        finalPrice = Math.max(0, finalPrice);
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet className="w-32 h-32" /></div>
                    <h3 className="text-slate-300 font-medium mb-1">Ví của bạn</h3>
                    <div className="text-3xl font-bold mb-6 flex items-end gap-2">
                        {purchasedPosts} <span className="text-lg font-normal text-slate-400">VN-Coin (Lượt đăng)</span>
                    </div>

                    <div className="flex justify-between items-center bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                        <div>
                            <div className="text-sm text-slate-300">Lượt đăng miễn phí còn lại</div>
                            <div className="font-semibold text-lg">{freeRemaining} / {freeQuotaLimit}</div>
                        </div>
                        {freeRemaining === 0 && <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">Đã hết</span>}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border flex flex-col justify-center">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Zap className="w-5 h-5 text-orange-500"/> Đặc quyền V-Coin</h3>
                    <ul className="space-y-3 mt-4">
                        <li className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /> Không giới hạn thời gian sử dụng luật.</li>
                        <li className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /> Được đẩy Bài Hàng Đầu khi kết hợp dịch vụ ở Tương lai.</li>
                        <li className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /> Hỗ trợ khách hàng ưu tiên 24/7.</li>
                    </ul>
                </div>
            </div>

            <div className="bg-white rounded-2xl border p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Coins className="w-6 h-6 text-amber-500"/>
                    Mua thêm lượt đăng
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {packages.map((pkg, idx) => (
                        <div key={idx} className={`relative rounded-xl border-2 p-6 flex flex-col transition-all hover:shadow-lg ${pkg.isPopular ? 'border-primary bg-primary/5' : 'border-slate-200'}`}>
                            {pkg.isPopular && <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">ĐỀ XUẤT</div>}
                            <h4 className="font-bold text-lg mb-1">{pkg.name}</h4>
                            <div className="text-3xl font-extrabold text-slate-900 mb-4">{new Intl.NumberFormat('vi-VN').format(pkg.price)}đ</div>
                            {pkg.discount ? (
                                <p className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit mb-6">{pkg.discount}</p>
                            ) : (
                                <p className="text-sm text-transparent mb-6 select-none">-</p> 
                            )}
                            <button 
                                onClick={() => openCheckout(pkg)}
                                className={`mt-auto flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold transition-colors ${pkg.isPopular ? 'bg-primary text-white hover:bg-primary/90' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                                Chọn gói <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {/* Custom Package */}
                    <div className="relative rounded-xl border-2 border-slate-200 p-6 flex flex-col transition-all hover:shadow-lg">
                        <h4 className="font-bold text-lg mb-1">Gói Tùy Chỉnh</h4>
                        <div className="flex items-center gap-2 mb-4 h-9">
                            <input 
                                type="number" 
                                min="1" 
                                value={customAmount} 
                                onChange={(e) => setCustomAmount(parseInt(e.target.value) || "")} 
                                className="w-24 px-3 py-1.5 border-2 rounded-lg text-lg font-bold focus:border-primary outline-none transition-colors" 
                                placeholder="SL" 
                            />
                            <span className="text-sm font-medium text-slate-600">tin</span>
                        </div>
                        <div className="text-3xl font-extrabold text-slate-900 mb-4">
                            {customAmount ? new Intl.NumberFormat('vi-VN').format(Number(customAmount) * unitPrice) : 0}đ
                        </div>
                        <p className="text-sm text-transparent mb-6 select-none">-</p> 
                        <button 
                            onClick={() => openCheckout({ amount: Number(customAmount), price: Number(customAmount) * unitPrice, name: `Gói Tùy Chỉnh (${customAmount} tin)`, discount: null })}
                            disabled={!customAmount || customAmount < 1}
                            className={`mt-auto flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold transition-colors ${!customAmount || customAmount < 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                            Mua ngay <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Checkout Modal Copied/Adapted from Post page */}
            {showCheckout && selectedPackage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-background rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center text-center space-y-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                            <h3 className="font-bold text-xl">Thanh toán Ví V-Coin</h3>
                            <button disabled={checkoutLoading} onClick={() => setShowCheckout(false)} className="text-white hover:text-red-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="flex justify-between items-center bg-slate-50 p-4 border rounded-lg">
                                <div>
                                    <h4 className="font-bold text-slate-800">{selectedPackage.name}</h4>
                                    <p className="text-sm text-slate-500">+{selectedPackage.amount} lượt đăng</p>
                                </div>
                                <div className="text-right">
                                    {appliedVoucher ? (
                                        <>
                                            <div className="text-sm text-slate-400 line-through">{new Intl.NumberFormat('vi-VN').format(originalPrice)}đ</div>
                                            <div className="text-2xl font-black text-emerald-600">{new Intl.NumberFormat('vi-VN').format(finalPrice)}đ</div>
                                        </>
                                    ) : (
                                        <div className="text-2xl font-black text-primary">{new Intl.NumberFormat('vi-VN').format(originalPrice)}đ</div>
                                    )}
                                </div>
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
                                    <p className="text-xs text-muted-foreground text-center">
                                        Hệ thống đang tự động đợi thông báo tiền vào. Nếu webhook chậm, admin vẫn có thể xác nhận thủ công bằng mã này.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 border rounded-xl bg-slate-50 text-sm text-slate-600">
                                    Bấm nút bên dưới để tạo mã VietQR riêng cho giao dịch này. Mã QR sẽ có sẵn số tiền và nội dung chuyển khoản.
                                </div>
                            )}

                            <div className="border-t pt-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mã giảm giá (nếu có)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Ví dụ: TET2026" 
                                        value={voucherCode}
                                        onChange={(e) => {
                                            setVoucherCode(e.target.value);
                                            setVoucherError("");
                                            if (appliedVoucher && e.target.value.toUpperCase() !== appliedVoucher.code) {
                                                setAppliedVoucher(null); 
                                            }
                                        }}
                                        disabled={!!appliedVoucher}
                                        className="w-full px-3 py-2 border rounded text-sm uppercase focus:ring-primary focus:border-primary disabled:bg-slate-100 disabled:text-slate-500"
                                    />
                                    {!appliedVoucher ? (
                                        <button 
                                            onClick={handleApplyVoucher}
                                            disabled={!voucherCode || voucherLoading}
                                            className="px-4 py-2 bg-slate-800 text-white rounded font-medium hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center min-w-[90px]"
                                        >
                                            {voucherLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Áp dụng"}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                setAppliedVoucher(null);
                                                setVoucherCode("");
                                            }}
                                            className="px-4 py-2 bg-red-100 text-red-600 rounded font-medium hover:bg-red-200"
                                        >
                                            Hủy
                                        </button>
                                    )}
                                </div>
                                {voucherError && <p className="text-xs text-red-500 mt-1">{voucherError}</p>}
                                {appliedVoucher && (
                                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3"/> 
                                        Đã áp dụng mã giảm giá thành công!
                                        <span className="font-bold border-l pl-1 ml-1 border-emerald-200">
                                            (-{appliedVoucher.discountType === 'percentage' ? `${appliedVoucher.discountValue}%` : `${new Intl.NumberFormat('vi-VN').format(appliedVoucher.discountValue)}đ`})
                                        </span>
                                    </p>
                                )}
                            </div>

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
