import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { LayoutDashboard, Users, Building2, LogOut, AlertTriangle, Banknote, ShieldCheck, Ticket, Settings, MessageSquare } from "lucide-react";
import { UnreadMessageBadge } from "@/components/messages/UnreadMessageBadge";
import { AdminTaskBadge } from "@/components/admin/AdminTaskBadge";

const navItems = [
    { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, taskScope: null },
    { href: "/admin/users", label: "Quản lý User", icon: Users, taskScope: null },
    { href: "/admin/properties", label: "Quản lý BĐS", icon: Building2, taskScope: "properties" },
    { href: "/admin/appointments", label: "Giao dịch / Lịch hẹn", icon: Banknote, taskScope: "appointments" },
    { href: "/dashboard/messages", label: "Tin nhắn", icon: MessageSquare, taskScope: null },
    { href: "/admin/vouchers", label: "Quản lý Mã Giảm Giá", icon: Ticket, taskScope: null },
    { href: "/admin/reports", label: "Báo cáo cộng đồng", icon: AlertTriangle, taskScope: "reports" },
    { href: "/admin/moderation", label: "Xử lý Khiếu nại", icon: ShieldCheck, taskScope: "moderation" },
    { href: "/admin/settings", label: "Cấu hình Hệ thống", icon: Settings, taskScope: null },
] as const;

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) redirect("/login");
    if (session.user.role !== "admin") redirect("/");

    return (
        <div className="min-h-screen bg-[#f8fafc] flex font-sans selection:bg-primary/20">
            {/* Sidebar (Dark Premium Theme) */}
            <aside className="w-[260px] bg-[#0f172a] border-r border-slate-800 h-screen sticky top-0 hidden md:flex flex-col shadow-2xl z-20">
                <div className="h-20 px-6 font-extrabold text-2xl text-white border-b border-slate-800 flex items-center gap-3">
                    <div className="bg-gradient-to-br from-primary to-orange-500 p-2 rounded-xl shadow-lg shadow-primary/20">
                        <Building2 className="h-6 w-6 text-white" />
                    </div>
                    An Cư Plus
                </div>
                
                <div className="px-6 py-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quản trị viên</p>
                </div>

                <nav className="px-4 space-y-1.5 flex-1">
                    {navItems.map(({ href, label, icon: Icon, taskScope }) => (
                        <Link
                            key={href}
                            href={href}
                            className="group flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white font-medium text-sm transition-all relative overflow-hidden"
                        >
                            <div className="absolute inset-y-0 left-0 w-1 bg-primary rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Icon className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                            <span className="flex-1">{label}</span>
                            {href === "/dashboard/messages" && <UnreadMessageBadge className="ml-auto ring-[#0f172a]" />}
                            {taskScope && <AdminTaskBadge scope={taskScope} className="ml-auto" />}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800 mt-auto">
                    <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 font-medium text-sm transition-colors">
                        <LogOut className="h-5 w-5" />
                        Thoát về Trang chủ
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden relative">
                {/* Background ambient glow */}
                <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                
                {/* Header */}
                <header className="h-20 bg-white/70 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 z-10 sticky top-0">
                    <div>
                        <h1 className="font-bold text-xl text-slate-800">Dashboard</h1>
                        <p className="text-sm text-slate-500">Hệ thống quản lý trung tâm</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-800 leading-none">{session.user.name}</p>
                            <p className="text-xs text-slate-500 mt-1">{session.user.email}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-500 p-0.5 shadow-md">
                            <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-primary font-bold text-sm">
                                {session.user.name?.charAt(0).toUpperCase() || "A"}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-8 flex-1 z-10 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
