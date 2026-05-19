"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ShieldCheck, ShieldOff, Ban, CheckCircle, Loader2 } from "lucide-react";

interface User {
    _id: string;
    name: string;
    email: string;
    role: "user" | "admin";
    isBanned: boolean;
    image?: string;
    createdAt: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
            const data = await res.json();
            setUsers(data.users || []);
            setTotalPages(data.totalPages || 1);
            setTotalUsers(data.totalUsers || 0);
        } catch (err) {
            console.error("Lỗi khi tải danh sách user:", err);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        const timer = setTimeout(() => fetchUsers(), 400);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const updateUser = async (id: string, payload: { role?: string; isBanned?: boolean }) => {
        setActionLoading(id + JSON.stringify(payload));
        try {
            await fetch(`/api/admin/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            await fetchUsers();
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Quản lý Người dùng</h2>
                    <p className="text-muted-foreground mt-1">Tổng cộng {totalUsers} người dùng</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Tìm theo tên hoặc email..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-9 pr-4 h-10 w-full rounded-md border bg-background text-sm"
                />
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left px-4 py-3 font-semibold">Người dùng</th>
                            <th className="text-left px-4 py-3 font-semibold">Email</th>
                            <th className="text-left px-4 py-3 font-semibold">Vai trò</th>
                            <th className="text-left px-4 py-3 font-semibold">Trạng thái</th>
                            <th className="text-left px-4 py-3 font-semibold">Ngày tham gia</th>
                            <th className="text-center px-4 py-3 font-semibold">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-16 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            </td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-16 text-muted-foreground">Không có người dùng nào.</td></tr>
                        ) : users.map((user) => (
                            <tr key={user._id} className={`hover:bg-muted/30 transition-colors ${user.isBanned ? "opacity-60" : ""}`}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium">{user.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                        user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                    }`}>
                                        {user.role === "admin" ? "Admin" : "User"}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                        user.isBanned ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                    }`}>
                                        {user.isBanned ? "Bị khóa" : "Hoạt động"}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-1">
                                        {/* Promote/Demote role */}
                                        <button
                                            onClick={() => updateUser(user._id, { role: user.role === "admin" ? "user" : "admin" })}
                                            title={user.role === "admin" ? "Hạ xuống User" : "Cấp quyền Admin"}
                                            disabled={!!actionLoading}
                                            className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                                        >
                                            {user.role === "admin"
                                                ? <ShieldOff className="h-4 w-4 text-orange-500" />
                                                : <ShieldCheck className="h-4 w-4 text-purple-500" />}
                                        </button>

                                        {/* Ban/Unban */}
                                        <button
                                            onClick={() => updateUser(user._id, { isBanned: !user.isBanned })}
                                            title={user.isBanned ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                                            disabled={!!actionLoading}
                                            className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                                        >
                                            {user.isBanned
                                                ? <CheckCircle className="h-4 w-4 text-green-500" />
                                                : <Ban className="h-4 w-4 text-red-500" />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1 rounded-md border text-sm disabled:opacity-50 hover:bg-muted transition-colors"
                    >
                        Trước
                    </button>
                    <span className="text-sm text-muted-foreground">Trang {page} / {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 rounded-md border text-sm disabled:opacity-50 hover:bg-muted transition-colors"
                    >
                        Tiếp
                    </button>
                </div>
            )}
        </div>
    );
}
