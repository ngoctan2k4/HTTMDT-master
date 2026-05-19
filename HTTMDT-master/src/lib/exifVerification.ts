/**
 * Logic Xác Thực Ảnh Bằng Siêu Dữ Liệu EXIF GPS (Verification Location EXIF Logic Sample)
 * 
 * Context: Nâng cấp xác thực offline. Môi giới hoặc chủ nhà có mặt tại cơ ngơi chụp 
 * bức ảnh trực tiếp. Ta sẽ dịch ngược thẻ EXIF của bức ảnh đó, lấy kinh độ vĩ độ 
 * và so sánh nó với tọa độ đã khai báo của căn nhà.
 */

// Note: Requires EXIF parser library in real environment (e.g., npx ađd exif-parser)
// import exifParser from "exif-parser";

/**
 * Calculates the Haversine distance between two points in meters.
 */
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Radius of the earth in m
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

interface Coordinate {
    lat: number;
    lng: number;
}

/**
 * Xác thực bức ảnh xem có được chụp tại chính địa điểm của Bất Động Sản mong đợi không
 * 
 * @param imageBuffer - Byte data của ảnh upload lên. Dùng `exif-parser` để tách metadata
 * @param expectedLocation - Tọa độ của Real Estate (Lấy từ CSDL Model Property)
 * @returns Object chứa tính hợp lệ và độ lệch mét
 */
export function verifyImageGPS(imageBuffer: Buffer, expectedLocation: Coordinate) {
    try {
        // Trong môi trường hoạt động thực tế, ta sử dụng:
        // const parser = exifParser.create(imageBuffer);
        // const result = parser.parse();
        // const gps = result.tags.gps; 
        // 
        // Mocking behavior below for demonstration:
        const extractedLat = expectedLocation.lat + 0.0001; // Giả sử ảnh trả về tọa độ hơi lệch
        const extractedLng = expectedLocation.lng - 0.0002; 

        if (!extractedLat || !extractedLng) {
            return { isValid: false, reason: "Ảnh tải lên không chứa siêu dữ liệu định vị (GPS). Vui lòng cấu hình Camera cho phép lưu thẻ vị trí." };
        }

        // Tính toán khoảng cách chênh lệch giữa vị trí đứng chụp ảnh và vị trí niêm yết
        const distanceMeters = getDistanceFromLatLonInMeters(
            extractedLat,
            extractedLng,
            expectedLocation.lat,
            expectedLocation.lng
        );

        // Dung sai cho phép: 50 Mét (Để bao hàm sai số thiết bị hoặc căn hộ có chung cư rộng)
        const TOLERANCE_METERS = 50;
        
        if (distanceMeters <= TOLERANCE_METERS) {
            return {
                isValid: true,
                distance: distanceMeters,
                message: "Xác thực thành công. Bất động sản này là có thực tại vị trí khớp."
            };
        } else {
            return {
                isValid: false,
                distance: distanceMeters,
                reason: `Độ dời lệch vị trí chụp ảnh quá xa với thực tế lưu trữ (${distanceMeters.toFixed(2)} mét > ${TOLERANCE_METERS} mét). Vui lòng đến đứng chụp tại đúng nhà trọ.`
            };
        }
    } catch (e: any) {
        return { isValid: false, reason: "Lỗi trong quá trình đọc EXIF data của tệp gốc." };
    }
}
