import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Message } from "@/models/Message";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { User } from "@/models/User";
import { Property } from "@/models/Property";
import { Setting } from "@/models/Setting";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Vui lòng đăng nhập để gửi tin nhắn" }, { status: 401 });
        }

        const body = await req.json();
        const { receiverId, propertyId, content } = body;

        if (!receiverId || !content) {
            return NextResponse.json({ error: "Thiếu thông tin nhận hoặc nội dung" }, { status: 400 });
        }

        if (receiverId === session.user.id) {
            return NextResponse.json({ error: "Bạn không thể tự gửi tin nhắn cho mình" }, { status: 400 });
        }

        await dbConnect();

        // 1. Fetch restricted words from settings
        const restrictedSetting = await Setting.findOne({ key: "restricted_words" });
        let restrictedWords: string[] = ["địt", "lồn", "cặc", "chửi", "lừa đảo", "đụ", "má"];
        
        if (restrictedSetting && restrictedSetting.value) {
            if (Array.isArray(restrictedSetting.value)) {
                restrictedWords = restrictedSetting.value;
            } else if (typeof restrictedSetting.value === "string") {
                restrictedWords = restrictedSetting.value.split(",").map((w: string) => w.trim()).filter(Boolean);
            }
        }

        // 2. Masking (Che giấu từ cấm)
        let maskedContent = content;
        if (restrictedWords.length > 0) {
            // Sort words by length descending so longer phrases match first
            restrictedWords.sort((a, b) => b.length - a.length);
            // Escape regex characters
            const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(restrictedWords.map(escapeRegExp).join("|"), "gi");

            maskedContent = maskedContent.replace(pattern, "***");
        }

        await Message.create({
            senderId: session.user.id,
            receiverId,
            propertyId,
            content: maskedContent
        });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error("Message Error:", error);
        return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        User.init();
        Property.init();

        const userId = session.user.id;

        // Find messages where user is receiver or sender
        const messages = await Message.find({
            $or: [{ receiverId: userId }, { senderId: userId }]
        })
            .populate('senderId', 'name avatar')
            .populate('receiverId', 'name avatar')
            .populate('propertyId', 'title')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(messages);
    } catch (err) {
        return NextResponse.json({ error: "Fail" }, { status: 500 });
    }
}
