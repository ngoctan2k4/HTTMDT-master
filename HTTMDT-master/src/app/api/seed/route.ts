import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";
import { auth } from "@/app/api/auth/[...nextauth]/route";

const cities = ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Bình Dương", "Đồng Nai", "Nha Trang", "Hải Phòng"];
const types = ["Mua bán", "Cho thuê"];
const propertyTypes = ["Căn hộ chung cư", "Nhà phố", "Đất nền", "Biệt thự", "Phòng trọ", "Mặt bằng kinh doanh"];

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTitle(type: string, pType: string, city: string) {
    const adjectives = ["Tuyệt đẹp", "Giá rẻ", "Cực tốt", "Đầu tư sinh lời", "Mới tinh", "Full nội thất", "Giao nhà ngay"];
    const adj = adjectives[getRandomInt(0, adjectives.length - 1)];
    return `${type} ${pType} ${adj} tại trung tâm ${city}`;
}

const imagesPool = [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop"
];

function generateData(count: number) {
    const properties = [];

    for (let i = 0; i < count; i++) {
        const city = cities[getRandomInt(0, cities.length - 1)];
        const type = types[Math.random() > 0.3 ? 0 : 1]; // 70% mua bán
        const pType = propertyTypes[getRandomInt(0, propertyTypes.length - 1)];
        const area = getRandomInt(30, 250);
        const beds = getRandomInt(1, 5);
        const baths = getRandomInt(1, 4);

        let priceValue = 0;
        let priceStr = "";
        if (type === "Mua bán") {
            priceValue = getRandomInt(1, 20) * 1000 + getRandomInt(0, 9) * 100; // 1000 to 20900 (1 tỷ - 20.9 tỷ)
            const ty = Math.floor(priceValue / 1000);
            const triump = priceValue % 1000;
            priceStr = ty > 0 ? (triump > 0 ? `${ty}.${triump / 100} Tỷ` : `${ty} Tỷ`) : `${priceValue} Triệu`;
        } else {
            priceValue = getRandomInt(3, 30); // 3 trieu to 30 trieu
            priceStr = `${priceValue} Triệu/tháng`;
        }

        const numImages = getRandomInt(2, 5);
        const selectedImages = [];
        for (let j = 0; j < numImages; j++) {
            selectedImages.push(imagesPool[getRandomInt(0, imagesPool.length - 1)]);
        }

        properties.push({
            title: generateTitle(type, pType, city),
            description: `Một cơ hội tuyệt vời để sở hữu/thuê ${pType.toLowerCase()} tại ${city}. \nDiện tích rộng rãi ${area}m2, thiết kế tối ưu với ${beds} phòng ngủ, ${baths} phòng vệ sinh. \nNằm trong khu vực an ninh, dân trí cao, gần trường học, chợ, siêu thị và bệnh viện. \nGiá giao dịch cực tốt so với thị trường: ${priceStr}. Liên hệ ngay để xem nhà thực tế!`,
            price: priceStr,
            priceValue: priceValue,
            address: `Đường ${getRandomInt(1, 100)} Khu cư xá, ${city}`,
            city: city,
            type: type,
            propertyType: pType,
            images: selectedImages,
            beds,
            baths,
            area,
            isFeatured: Math.random() > 0.8, // 20% featured
            author: {
                name: `Môi giới ${getRandomInt(1, 50)}`,
                phone: `090${getRandomInt(1000000, 9999999)}`,
            },
            postedDate: new Date(Date.now() - getRandomInt(0, 30) * 24 * 60 * 60 * 1000) // Random in last 30 days
        });
    }

    return properties;
}

export async function GET() {
    try {
        const session = await auth();
        const ownerId = session?.user?.id;
        if (!ownerId) {
            return NextResponse.json({ success: false, error: "Vui lòng đăng nhập để seed và gắn ownerId." }, { status: 401 });
        }

        await dbConnect();

        // Check if data already exists to avoid duplicate seeding
        const count = await Property.countDocuments();
        if (count > 0) {
            const result = await Property.updateMany(
                { $or: [{ ownerId: { $exists: false } }, { ownerId: null }, { ownerId: "" }] },
                { $set: { ownerId } }
            );

            return NextResponse.json({
                success: true,
                message: `Database đã có ${count} tin. Đã gắn ownerId cho ${result.modifiedCount} tin (những tin trước đó chưa có ownerId).`,
            });
        }

        const newProperties = generateData(100).map((p: any) => ({
            ...p,
            ownerId,
        }));

        await Property.insertMany(newProperties);

        return NextResponse.json({
            success: true,
            message: "Successfully seeded 100 properties into the database!"
        });

    } catch (error: unknown) {
        const msg =
            error instanceof Error
                ? error.message
                : (error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string")
                    ? String((error as { message?: unknown }).message)
                    : "Seeding error";
        console.error("Seeding error:", error);
        return NextResponse.json(
            { success: false, error: msg },
            { status: 500 }
        );
    }
}
