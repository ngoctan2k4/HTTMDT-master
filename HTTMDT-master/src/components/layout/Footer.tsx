import Link from "next/link";
import { Building2 } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t bg-muted/20">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <Building2 className="h-6 w-6 text-primary" />
                            <span className="font-bold text-xl text-primary">An Cư Plus</span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            Giải pháp tìm kiếm và đăng tin bất động sản trực tuyến hàng đầu, nhanh chóng và hiệu quả.
                        </p>
                    </div>
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wider">
                            Về chúng tôi
                        </h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/" className="hover:text-primary">Giới thiệu</Link></li>
                            <li><Link href="/" className="hover:text-primary">Quy chế hoạt động</Link></li>
                            <li><Link href="/" className="hover:text-primary">Liên hệ</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wider">
                            Hỗ trợ khách hàng
                        </h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/" className="hover:text-primary">Hướng dẫn đăng tin</Link></li>
                            <li><Link href="/" className="hover:text-primary">Bảng giá dịch vụ</Link></li>
                            <li><Link href="/" className="hover:text-primary">Quy định an toàn</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wider">
                            Tải ứng dụng
                        </h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>Ứng dụng sắp ra mắt trên iOS và Android để trải nghiệm tìm kiếm tiện lợi hơn.</p>
                        </div>
                    </div>
                </div>
                <div className="mt-8 border-t pt-8 flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
                    <p>© 2024 An Cư Plus. All rights reserved.</p>
                    <div className="flex gap-4">
                        <Link href="/" className="hover:text-primary">Điều khoản</Link>
                        <Link href="/" className="hover:text-primary">Bảo mật</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
