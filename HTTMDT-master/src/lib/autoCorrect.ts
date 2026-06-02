export const CORRECTIONS: Record<string, string> = {
    "tro": "Ph\u00f2ng tr\u1ecd", "troj": "Ph\u00f2ng tr\u1ecd", "nhatro": "Nh\u00e0 tr\u1ecd",
    "biet thuj": "Bi\u1ec7t th\u1ef1", "biet thuw": "Bi\u1ec7t th\u1ef1", "biet thux": "Bi\u1ec7t th\u1ef1",
    // Provinces & Cities
    "ha noi": "Hà Nội", "hanoi": "Hà Nội", "hn": "Hà Nội",
    "ho chi minh": "Hồ Chí Minh", "hcm": "Hồ Chí Minh", "sg": "Hồ Chí Minh", "sai gon": "Hồ Chí Minh",
    "da nang": "Đà Nẵng", "danang": "Đà Nẵng", "dn": "Đà Nẵng",
    "can tho": "Cần Thơ", "cantho": "Cần Thơ", "ct": "Cần Thơ",
    "hai phong": "Hải Phòng", "haiphong": "Hải Phòng", "hp": "Hải Phòng",
    "bien hoa": "Biên Hòa", "thu duc": "Thủ Đức", "binh duong": "Bình Dương",
    
    // Property Types
    "chung cu": "Chung cư", "chungcu": "Chung cư", "cc": "Chung cư",
    "biet thu": "Biệt thự", "bietthu": "Biệt thự", "bt": "Biệt thự",
    "nha rieng": "Nhà riêng", "nharieng": "Nhà riêng",
    "nha mat pho": "Nhà mặt phố", "nhamatpho": "Nhà mặt phố", "nmp": "Nhà mặt phố",
    "can ho": "Căn hộ", "canho": "Căn hộ", "ch": "Căn hộ",
    "dat nen": "Đất nền", "datnen": "Đất nền",
    "phong tro": "Phòng trọ", "phongtro": "Phòng trọ", "nha tro": "Nhà trọ",
    "van phong": "Văn phòng",
    
    // Typos & Telex extensions
    "phongs": "Phòng", "phongf": "Phòng", "phongr": "Phòng", "phongx": "Phòng", "phongj": "Phòng",
    "nhas": "Nhà", "nhaf": "Nhà", "nhar": "Nhà", "nhax": "Nhà", "nhaj": "Nhà",
    "phongs tro": "Phòng trọ", "phong troj": "Phòng trọ", "phongs troj": "Phòng trọ",
    
    // Commands/Actions
    "cho thue": "Cho thuê", "chothue": "Cho thuê",
    "mua ban": "Mua bán", "muaban": "Mua bán",
    "ban nha": "Bán nhà", "bannha": "Bán nhà",
    
    // Districts (Common)
    "quan 1": "Quận 1", "q1": "Quận 1",
    "quan 2": "Quận 2", "q2": "Quận 2",
    "quan 3": "Quận 3", "q3": "Quận 3",
    "quan 4": "Quận 4", "q4": "Quận 4",
    "quan 5": "Quận 5", "q5": "Quận 5",
    "quan 6": "Quận 6", "q6": "Quận 6",
    "quan 7": "Quận 7", "q7": "Quận 7",
    "quan 8": "Quận 8", "q8": "Quận 8",
    "quan 9": "Quận 9", "q9": "Quận 9",
    "quan 10": "Quận 10", "q10": "Quận 10",
    "quan 11": "Quận 11", "q11": "Quận 11",
    "quan 12": "Quận 12", "q12": "Quận 12",
    "binh thanh": "Bình Thạnh", "tan binh": "Tân Bình", "tan phu": "Tân Phú",
    "go vap": "Gò Vấp", "phu nhuan": "Phú Nhuận", "cau giay": "Cầu Giấy", 
    "dong da": "Đống Đa", "ba dinh": "Ba Đình", "hai ba trung": "Hai Bà Trưng", "hoang mai": "Hoàng Mai", "thanh xuan": "Thanh Xuân", "long bien": "Long Biên", "tay ho": "Tây Hồ"
};

function stripDanglingTelex(value: string) {
    return value.replace(/\b([a-z]{3,})(s|f|r|x|j|w)\b/gi, "$1");
}

/**
 * Tự động sửa lỗi/thêm dấu cho chuỗi tìm kiếm dựa trên từ điển phổ biến
 */
export function autoCorrect(query: string): { original: string, corrected: string, hasCorrection: boolean, suggestions: string[] } {
    if (!query || query.trim() === "") {
        return { original: query || "", corrected: query || "", hasCorrection: false, suggestions: [] };
    }

    let originalQuery = query;
    let normalizedQuery = query.toLowerCase().trim();
    const normalizedForMatch = stripDanglingTelex(normalizedQuery);
    let finalStr = originalQuery;
    let hasCorrection = false;
    let suggestions: string[] = [];

    // Nếu match cả cụm (VD ng dùng gõ "hcm")
    if (
        (CORRECTIONS[normalizedQuery] && CORRECTIONS[normalizedQuery].toLowerCase() !== normalizedQuery) ||
        (CORRECTIONS[normalizedForMatch] && CORRECTIONS[normalizedForMatch].toLowerCase() !== normalizedForMatch)
    ) {
        finalStr = CORRECTIONS[normalizedQuery] || CORRECTIONS[normalizedForMatch];
        hasCorrection = true;
        suggestions.push(finalStr);
    } else {
        // Find and replace substrings based on keys (larger phrases first to avoid partial replacements)
        // Sort keys by length descending to match longest possible phrases ("ho chi minh" before "hcm")
        const sortedKeys = Object.keys(CORRECTIONS).sort((a, b) => b.length - a.length);
        
        let tempStrToLower = normalizedForMatch;
        
        for (const key of sortedKeys) {
            // Check if word boundary (e.g. `ha noi`, not `chanoi` )
            const regex = new RegExp(`\\b${key}\\b`, 'gi');
            if (regex.test(tempStrToLower)) {
                // Replace in the lowercase version to track changes
                tempStrToLower = tempStrToLower.replace(regex, CORRECTIONS[key]);
                
                // Track suggestions for partial matches
                if (!suggestions.includes(CORRECTIONS[key])) {
                    suggestions.push(CORRECTIONS[key]);
                }
                hasCorrection = true;
            }
        }
        
        if (hasCorrection) {
            // Apply all replaced matches
            finalStr = tempStrToLower;
            
            // Note: Since we use replace on lowercase, the finalStr will be mostly lowercase except the replaced words.
            // If the user had capitalized text, it might be lost. Let's construct a cleaner output:
            // Actually, we can just return the tempStrToLower as it has proper casing from the dictionary for replaced words.
            // But we should capitalize the first letter of the result if it's the beginning of a sentence.
            finalStr = finalStr.charAt(0).toUpperCase() + finalStr.slice(1);
        }
    }
    
    // Add additional logic to build a list of autocomplete suggestions if the user is typing
    // Xoá dấu telex cơ bản ở cuối để gợi ý rộng hơn (VD: phongs -> phong)
    let deTelexedQuery = stripDanglingTelex(normalizedQuery);

    if (query.length > 1) {
        for (const [key, value] of Object.entries(CORRECTIONS)) {
            // Check original, normalized or deTelexed
            if (key.startsWith(normalizedQuery) || 
                value.toLowerCase().startsWith(normalizedQuery) ||
                key.startsWith(deTelexedQuery) || 
                value.toLowerCase().startsWith(deTelexedQuery)) {
                if (!suggestions.includes(value)) {
                    suggestions.push(value);
                }
            }
            if (suggestions.length >= 7) break; 
        }
    }

    // Ưu tiên hiển thị "Phòng trọ" nếu người dùng gõ "phong" hoặc "phongs"
    if ((deTelexedQuery === "phong" || deTelexedQuery === "phong ") && !suggestions.includes("Phòng trọ")) {
        suggestions.unshift("Phòng trọ");
    }
    // Tương tự với "nhà"
    if ((deTelexedQuery === "nha" || deTelexedQuery === "nha ") && !suggestions.includes("Nhà riêng")) {
        suggestions.unshift("Nhà riêng");
    }
    
    // Giới hạn lại số lượng
    suggestions = suggestions.slice(0, 5);

    return { 
        original: originalQuery, 
        corrected: finalStr, 
        hasCorrection,
        suggestions
    };
}
