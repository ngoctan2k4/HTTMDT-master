"use client";

import { useEffect, useState } from "react";
import { Save, AlertCircle } from "lucide-react";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // States for various settings
    const [restrictedWords, setRestrictedWords] = useState<string>("");
    
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/admin/settings");
                if (res.ok) {
                    const data = await res.json();
                    
                    if (data.restricted_words) {
                        if (Array.isArray(data.restricted_words)) {
                            setRestrictedWords(data.restricted_words.join(", "));
                        } else {
                            setRestrictedWords(data.restricted_words);
                        }
                    } else {
                        // default
                        setRestrictedWords("địt, lồn, cặc, chửi, lừa đảo, đụ, má");
                    }
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (key: string, value: any) => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, value }),
            });
            if (res.ok) {
                alert("Đã lưu cấu hình thành công");
            } else {
                alert("Không thể lưu cấu hình");
            }
        } catch (error) {
            alert("Lỗi kết nối");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveRestrictedWords = () => {
        // Parse comma separated string to array
        const wordsArray = restrictedWords
            .split(",")
            .map(w => w.trim())
            .filter(Boolean);
        handleSave("restricted_words", wordsArray);
    };

    if (loading) {
        return <div className="flex h-96 items-center justify-center">Đang tải cấu hình...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cấu hình Hệ thống</h1>
                <p className="text-muted-foreground mt-1 text-sm">Quản lý các tham số hoạt động chung của hệ thống</p>
            </div>

            <div className="grid gap-6">
                {/* Chat Moderation Settings */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        Quản lý Chat (Lọc Từ Ngữ)
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Danh sách từ cấm (cách nhau bởi dấu phẩy)</label>
                            <textarea 
                                value={restrictedWords}
                                onChange={(e) => setRestrictedWords(e.target.value)}
                                className="w-full h-32 px-4 py-3 rounded-md border text-sm"
                                placeholder="ví dụ: lừa đảo, chửi thề, spam..."
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Những từ này sẽ tự động bị biến thành `***` khi người dùng nhắn tin cho nhau.
                            </p>
                        </div>
                        
                        <button 
                            onClick={handleSaveRestrictedWords}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors text-sm"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </div>
                
                {/* Other settings can be added here in the future */}
                
            </div>
        </div>
    );
}
