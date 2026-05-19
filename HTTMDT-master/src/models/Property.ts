import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({
    ownerId: { type: String, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    priceValue: { type: Number }, // To allow sorting
    address: { type: String, required: true },
    city: { type: String, required: true },
    type: { type: String, required: true }, // Mua bán / Cho thuê
    propertyType: { type: String, required: true }, // Căn hộ, Nhà phố...
    images: [{ type: String }],
    legalDocuments: [{ type: String }], // Ảnh giấy tờ pháp lý (Sổ đỏ/Sổ hồng)
    videoUrl: { type: String },
    beds: { type: Number, default: 0 },
    baths: { type: Number, default: 0 },
    area: { type: Number, required: true },
    isFeatured: { type: Boolean, default: false },
    author: {
        name: { type: String, default: "Owner" },
        phone: { type: String, default: "0901234567" },
        avatar: { type: String, default: "" },
        email: { type: String },
        joinDate: { type: String, default: "Gần đây" },
        isVerified: { type: Boolean, default: false },
        userType: { type: String, default: "Khách hàng" }
    },
    // O2O Workflow Fields
    isVerified: { type: Boolean, default: false }, // Xác thực GPS/Offline
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere', default: [0, 0] } // [longitude, latitude] từ Metadata GPS của ảnh
    },
    inputCoordinates: { type: [Number], default: [0, 0] }, // Tọa độ người dùng tự chỉ định trên Map
    tourAvailability: [{ type: String }], // Lịch rảnh có thể set hẹn offline
    fraudReports: { type: Number, default: 0 }, // Số lượt bị báo cáo tin ảo
    status: { type: String, enum: ["pending", "pending_verification", "approved", "rejected", "under_review", "sold"], default: "pending_verification" },
    postedDate: { type: Date, default: Date.now },
    expiryDate: { type: Date }
});

export const Property = mongoose.models.Property || mongoose.model("Property", propertySchema);
