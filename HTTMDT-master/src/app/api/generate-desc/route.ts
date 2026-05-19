import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { type, area, beds, address } = await req.json();

        // In a real app, this would call Google Gemini API
        // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        // const prompt = `Viết mô tả bán BĐS...`
        // const result = await model.generateContent(prompt);

        // Mock response for demo
        const generatedDescription = `✨ CƠ HỘI SỞ HỮU ${type?.toUpperCase() || 'BẤT ĐỘNG SẢN'} TẠI ${address?.toUpperCase() || 'VỊ TRÍ ĐẮC ĐỊA'} ✨

🏠 Thông tin nổi bật:
- Diện tích rộng rãi: ${area || 'Đang cập nhật'} m2.
- Thiết kế hiện đại tối ưu công năng với ${beds || 'nhiều'} phòng ngủ.
- Vị trí vàng tại ${address || 'khu vực trung tâm'}, thuận tiện di chuyển, tiện ích xung quanh bạt ngàn (trường học, siêu thị, bệnh viện...).

💎 Bất động sản này không chỉ là một nơi an cư lý tưởng mà còn là cơ hội đầu tư sinh lời vượt trội trong tương lai nhờ quy hoạch đồng bộ của khu vực.
Khu dân cư văn minh, an ninh đảm bảo 24/7. Sổ đỏ chính chủ, pháp lý minh bạch, sẵn sàng giao dịch ngay.

📞 Liên hệ ngay hôm nay để được tư vấn chi tiết và xem nhà trực tiếp!`;

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        return NextResponse.json({ description: generatedDescription });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to generate description" },
            { status: 500 }
        );
    }
}
