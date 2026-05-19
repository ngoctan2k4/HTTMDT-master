"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, UserCircle, BadgeCheck, Briefcase, Save, Loader2, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const router = useRouter();
    const [userType, setUserType] = useState("Khách hàng");
    const [isVerified, setIsVerified] = useState(false);
    
    // Bank details
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
                if (res.ok) {
                    const data = await res.json();
                    setUserType(data.userType);
                    setIsVerified(data.isVerified);
                    if (data.bankInfo) {
                        setBankName(data.bankInfo.bankName || "");
                        setAccountNumber(data.bankInfo.accountNumber || "");
                        setAccountName(data.bankInfo.accountName || "");
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: "", type: "" });
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userType, bankName, accountNumber, accountName })
            });
            if (res.ok) {
                setMessage({ text: "Cập nhật hồ sơ thành công!", type: "success" });
                router.refresh();
            } else {
                setMessage({ text: "Cập nhật thất bại.", type: "error" });
            }
        } catch (err) {
            setMessage({ text: "Đã xảy ra lỗi hệ thống.", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-3xl font-bold mb-2">Hồ sơ C2C</h1>
            <p className="text-muted-foreground mb-8">Khai báo danh tính để tăng độ uy tín cho các tin đăng của bạn.</p>

            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-primary/5 p-6 border-b flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-background rounded-full border-2 border-primary/20 flex items-center justify-center">
                            <UserCircle className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                Giao diện Hồ sơ
                                {isVerified && <BadgeCheck className="w-5 h-5 text-blue-500" />}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Trạng thái xác thực: {isVerified ? <span className="text-green-600 font-medium">Đã KYC / Xác thực CCCD</span> : <span className="text-amber-600">Chưa xác thực</span>}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-8">
                    {message.text && (
                        <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-4">
                        <h3 className="font-semibold text-base">Bạn đang tham gia An Cư Plus với tư cách gì?</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <label className={`cursor-pointer flex flex-col items-center gap-3 p-4 border-2 rounded-xl transition-all ${userType === 'Khách hàng' ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-muted'}`}>
                                <input type="radio" checked={userType === 'Khách hàng'} onChange={() => setUserType('Khách hàng')} className="hidden" />
                                <UserCircle className={`w-8 h-8 ${userType === 'Khách hàng' ? 'text-primary' : 'text-muted-foreground'}`} />
                                <div className="text-center">
                                    <div className="font-medium text-sm">Người mua / Thuê</div>
                                    <div className="text-xs text-muted-foreground mt-1">Chỉ đi xem và tìm kiếm, không bán.</div>
                                </div>
                            </label>

                            <label className={`cursor-pointer flex flex-col items-center gap-3 p-4 border-2 rounded-xl transition-all ${userType === 'Chính chủ' ? 'border-green-500 bg-green-50 shadow-sm' : 'hover:bg-muted'}`}>
                                <input type="radio" checked={userType === 'Chính chủ'} onChange={() => setUserType('Chính chủ')} className="hidden" />
                                <ShieldCheck className={`w-8 h-8 ${userType === 'Chính chủ' ? 'text-green-500' : 'text-muted-foreground'}`} />
                                <div className="text-center">
                                    <div className="font-medium text-sm">Chính chủ</div>
                                    <div className="text-xs text-muted-foreground mt-1">Tôi là chủ nhà, tự đăng bán/cho thuê.</div>
                                </div>
                            </label>

                            <label className={`cursor-pointer flex flex-col items-center gap-3 p-4 border-2 rounded-xl transition-all ${userType === 'Môi giới' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'hover:bg-muted'}`}>
                                <input type="radio" checked={userType === 'Môi giới'} onChange={() => setUserType('Môi giới')} className="hidden" />
                                <Briefcase className={`w-8 h-8 ${userType === 'Môi giới' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                                <div className="text-center">
                                    <div className="font-medium text-sm">Môi giới viên</div>
                                    <div className="text-xs text-muted-foreground mt-1">Đại lý hoặc sale bán hộ chủ nhà.</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-semibold text-base flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-primary" /> Thông tin Thanh toán / Nhận cọc
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">Cung cấp tài khoản ngân hàng để người mua có thể chuyển khoản cọc cho bạn. Thông tin này chỉ hiện cho khách muốn đặt cọc.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tên Ngân hàng</label>
                                <input 
                                    type="text" 
                                    placeholder="VD: Vietcombank, Techcombank..." 
                                    value={bankName}
                                    onChange={e => setBankName(e.target.value)}
                                    className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Số tài khoản</label>
                                <input 
                                    type="text" 
                                    placeholder="Nhập số tài khoản" 
                                    value={accountNumber}
                                    onChange={e => setAccountNumber(e.target.value)}
                                    className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium">Tên chủ tài khoản</label>
                                <input 
                                    type="text" 
                                    placeholder="NGUYEN VAN A" 
                                    value={accountName}
                                    onChange={e => setAccountName(e.target.value.toUpperCase())}
                                    className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t flex justify-end">
                        <button type="submit" disabled={saving} className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Lưu cấu hình
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
