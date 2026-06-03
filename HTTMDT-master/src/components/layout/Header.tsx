"use client"

import Link from "next/link";
import { Search, Building2, PlusCircle, UserCircle, LogOut, Package, LayoutDashboard, Heart, MessageSquare, Wallet } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { autoCorrect } from "@/lib/autoCorrect";
import { UnreadMessageBadge } from "@/components/messages/UnreadMessageBadge";

export function Header() {
    const { data: session } = useSession();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const router = useRouter();
    const [q, setQ] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQ(value);
        if (value.trim().length > 1) {
            const { suggestions: newSuggestions } = autoCorrect(value);
            setSuggestions(newSuggestions);
        } else {
            setSuggestions([]);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent, overrideQ?: string) => {
        e.preventDefault();
        const finalQ = overrideQ !== undefined ? overrideQ : q;
        if (!finalQ.trim()) return;
        setSuggestions([]);
        router.push(`/search?q=${encodeURIComponent(finalQ)}`);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full max-w-[1800px] mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-4 md:gap-8">
                    <Link href="/" className="flex items-center space-x-2 group">
                        <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                            <Building2 className="h-7 w-7 text-primary" />
                        </div>
                        <span className="inline-block font-extrabold text-2xl md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-orange-500 tracking-tight">An Cư Plus</span>
                    </Link>
                    <nav className="hidden md:flex gap-6">
                        <Link
                            href="/search?type=mua-ban"
                            className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Mua bán
                        </Link>
                        <Link
                            href="/search?type=cho-thue"
                            className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Cho thuê
                        </Link>
                        <Link
                            href="/search"
                            className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Dự án
                        </Link>
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-end space-x-4 ml-4 lg:ml-8">
                    <div className="w-full max-w-xs lg:max-w-sm hidden md:flex items-center relative z-50">
                        <form onSubmit={(e) => handleSearchSubmit(e)} className="relative w-full">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-primary" />
                            <input
                                type="search"
                                value={q}
                                onChange={handleSearchChange}
                                placeholder="Tìm kiếm..."
                                autoComplete="off"
                                className="flex h-9 w-full rounded-full border-2 border-primary/20 bg-muted/30 px-4 py-1 text-sm shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                            />
                            {suggestions.length > 0 && (
                                <ul className="absolute top-11 left-0 w-full bg-background border rounded-md shadow-lg py-1 z-50">
                                    <li className="px-4 py-1.5 text-xs text-muted-foreground bg-muted/30 font-semibold border-b">Gợi ý sửa lỗi:</li>
                                    {suggestions.map((s, i) => (
                                        <li 
                                            key={i} 
                                            className="px-4 py-2 hover:bg-muted cursor-pointer text-sm flex items-center gap-2 transition-colors"
                                            onClick={() => {
                                                setQ(s);
                                                handleSearchSubmit({ preventDefault: () => {} } as React.FormEvent, s);
                                            }}
                                        >
                                            <Search className="h-3 w-3 text-muted-foreground" />
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </form>
                    </div>
                    <nav className="flex items-center space-x-4">
                        <div className="flex h-8 items-center gap-4 border-r pr-4 mr-2">
                            <Link href="/dashboard/appointments" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors bg-muted/50 px-3 py-1.5 rounded-full border border-transparent hover:border-primary/30 whitespace-nowrap">
                                <Package className="h-4 w-4 text-orange-500" />
                                <span className="hidden lg:inline-block">Lịch hẹn</span>
                            </Link>
                            {session && (
                                <Link href="/dashboard/messages" className="relative flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors bg-muted/50 px-3 py-1.5 rounded-full border border-transparent hover:border-primary/30 whitespace-nowrap">
                                    <MessageSquare className="h-4 w-4 text-blue-500" />
                                    <span className="hidden lg:inline-block">Hộp thư</span>
                                    <UnreadMessageBadge className="absolute -right-1 -top-2" />
                                </Link>
                            )}
                        </div>

                        {/* Auth State */}
                        {session ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors focus:outline-none"
                                >
                                    {session.user?.image ? (
                                        <img src={session.user.image} alt={session.user.name || "User"} className="h-8 w-8 rounded-full border border-primary/20" />
                                    ) : (
                                        <UserCircle className="h-8 w-8 text-muted-foreground" />
                                    )}
                                    <span className="hidden sm:inline-block truncate max-w-[100px]">{session.user?.name || "User"}</span>
                                </button>

                                {/* Dropdown menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-52 bg-background border rounded-md shadow-lg py-1 z-50">
                                        {/* Admin-only link */}
                                        {session.user?.role === "admin" && (
                                            <>
                                                <Link
                                                    href="/admin"
                                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-purple-600 hover:bg-purple-50"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                >
                                                    <LayoutDashboard className="h-4 w-4" />
                                                    Admin Dashboard
                                                </Link>
                                                <hr className="my-1" />
                                            </>
                                        )}
                                        <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted" onClick={() => setIsDropdownOpen(false)}>
                                            <LayoutDashboard className="h-4 w-4" />
                                            Tin của tôi
                                        </Link>
                                        <Link href="/dashboard/favorites" className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted" onClick={() => setIsDropdownOpen(false)}>
                                            <Heart className="h-4 w-4" />
                                            Tin đã lưu
                                        </Link>
                                        <Link href="/dashboard/billing" className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted" onClick={() => setIsDropdownOpen(false)}>
                                            <Wallet className="h-4 w-4" />
                                            Ví tiền
                                        </Link>
                                        <Link href="/dashboard/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted" onClick={() => setIsDropdownOpen(false)}>
                                            <UserCircle className="h-4 w-4" />
                                            Thông tin tài khoản
                                        </Link>
                                        <Link href="/dashboard/messages" className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted" onClick={() => setIsDropdownOpen(false)}>
                                            <MessageSquare className="h-4 w-4" />
                                            Hộp thư
                                            <UnreadMessageBadge className="ml-auto" />
                                        </Link>
                                        <Link href="/dashboard/post" className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted" onClick={() => setIsDropdownOpen(false)}>
                                            <PlusCircle className="h-4 w-4" />
                                            Đăng tin mới
                                        </Link>
                                        <hr className="my-1" />
                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                signOut({ callbackUrl: '/' });
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full text-left"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link href="/login" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                <UserCircle className="h-5 w-5" />
                                <span className="hidden sm:inline-block">Đăng nhập</span>
                            </Link>
                        )}

                        <Link
                            href="/dashboard/post"
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-bold transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-gradient-to-r from-primary to-orange-500 text-primary-foreground shadow-lg shadow-primary/30 h-10 px-5 py-2 gap-2"
                        >
                            <PlusCircle className="h-5 w-5" />
                            <span className="hidden sm:inline-block">Đăng tin miễn phí</span>
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}
