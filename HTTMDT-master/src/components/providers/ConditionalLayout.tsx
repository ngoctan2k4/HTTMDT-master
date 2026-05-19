"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Chatbot } from "@/components/chat/Chatbot";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    
    // Danh sách các routes không dùng Header/Footer thông thường
    const isAdminRoute = pathname?.startsWith("/admin");
    
    if (isAdminRoute) {
        // Admin pages: không có Header/Footer của site
        return <>{children}</>;
    }

    // Các trang thông thường: có Header, Footer, Chatbot
    return (
        <>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <Chatbot />
        </>
    );
}
