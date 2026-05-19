import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    trustHost: true,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "mock-client-id",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-client-secret",
            authorization: {
                params: {
                    prompt: "consent select_account",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                await dbConnect();

                // Lấy user có password (select: false trong schema nên cần +password)
                const user = await User.findOne({ email: credentials.email }).select("+password");

                if (!user || !user.password) {
                    return null; // Không tìm thấy user hoặc user đăng nhập bằng Google nhưng cố dùng password
                }

                const isPasswordMatch = await bcrypt.compare(credentials.password as string, user.password);

                if (!isPasswordMatch) {
                    return null;
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role, // Pass role from db to token
                };
            }
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        // Callback signIn được gọi trước khi session/jwt được tạo (kể cả Google)
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                await dbConnect();
                try {
                    const existingUser = await User.findOne({ email: user.email });

                    if (!existingUser) {
                        // User mới từ Google, tự động tạo mới
                        const newUser = new User({
                            name: user.name,
                            email: user.email,
                            image: user.image,
                            role: "user", // Default role
                            // Không có password vì dùng Google
                        });
                        await newUser.save();
                        // Gán id mới tạo vào user object để jwt callback có thể lấy
                        user.id = newUser._id.toString();
                        user.role = newUser.role;
                    } else {
                        user.id = existingUser._id.toString();
                        user.role = existingUser.role;
                    }
                    return true;
                } catch (error) {
                    console.error("Lỗi khi lưu Google user:", error);
                    return false;
                }
            }
            return true; // Cho phép Đăng nhập Credentials
        },
        async jwt({ token, user }) {
            // Khi user đăng nhập thành công lần đầu, truyền thông tin vào token
            if (user) {
                token.sub = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            // Đẩy thông tin từ token ra session để frontend có thể dùng
            if (session?.user) {
                session.user.id = token.sub as string;
                session.user.role = token.role as string;
            }
            return session;
        }
    }
});
