import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Property } from "@/models/Property";
import { Setting } from "@/models/Setting";

export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type PropertyForChat = {
  _id: unknown;
  title?: string;
  description?: string;
  propertyType?: string;
  type?: string;
  address?: string;
  city?: string;
  price?: string;
  priceValue?: number;
  area?: number;
  beds?: number;
  baths?: number;
  isFeatured?: boolean;
  postedDate?: Date;
};

type ParsedSearch = {
  isSearchIntent: boolean;
  city?: string;
  citySlug?: string;
  propertyType?: string;
  demand?: "Mua bán" | "Cho thuê";
  minPrice?: number;
  maxPrice?: number;
  targetPrice?: number;
  keywords: string[];
};

type PropertyCandidate = {
  property: PropertyForChat;
  score: number;
  exact: boolean;
  reasons: string[];
};

const cities = [
  { slug: "ha noi", label: "Hà Nội" },
  { slug: "ho chi minh", label: "Hồ Chí Minh" },
  { slug: "sai gon", label: "Hồ Chí Minh" },
  { slug: "da nang", label: "Đà Nẵng" },
  { slug: "nha trang", label: "Nha Trang" },
  { slug: "can tho", label: "Cần Thơ" },
  { slug: "hai phong", label: "Hải Phòng" },
  { slug: "binh duong", label: "Bình Dương" },
  { slug: "dong nai", label: "Đồng Nai" },
  { slug: "long an", label: "Long An" },
  { slug: "da lat", label: "Đà Lạt" },
  { slug: "vung tau", label: "Vũng Tàu" },
];

const propertyTypeKeywords = [
  { keywords: ["biet thu", "villa"], label: "Biệt thự" },
  { keywords: ["chung cu", "can ho", "apartment"], label: "Căn hộ chung cư" },
  { keywords: ["nha pho", "nha rieng"], label: "Nhà phố" },
  { keywords: ["dat nen", "dat"], label: "Đất nền" },
  { keywords: ["phong tro", "tro"], label: "Phòng trọ" },
  { keywords: ["mat bang", "kinh doanh"], label: "Mặt bằng kinh doanh" },
];

const stopWords = new Set([
  "toi",
  "minh",
  "ban",
  "can",
  "tim",
  "cho",
  "co",
  "khong",
  "gia",
  "ty",
  "ti",
  "trieu",
  "mua",
  "ban",
  "thue",
  "nha",
  "bat",
  "dong",
  "san",
  "o",
  "tai",
  "khu",
  "vuc",
  "voi",
  "hay",
  "hoac",
]);

function normalizeText(value: string) {
  let repaired = "";
  try {
    repaired = Buffer.from(value, "latin1").toString("utf8");
  } catch {
    repaired = "";
  }

  return `${value} ${repaired}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<ChatMessage>;
  return (item.role === "user" || item.role === "assistant") && typeof item.content === "string";
}

const defaultRestrictedWords = ["địt", "lồn", "cặc", "chửi", "lừa đảo", "đụ", "má"];

async function getRestrictedWords() {
  try {
    await dbConnect();
    const setting = await Setting.findOne({ key: "restricted_words" }).lean<{ value?: unknown }>();
    const value = setting?.value;

    if (Array.isArray(value)) {
      return value.filter((word): word is string => typeof word === "string" && word.trim().length > 0);
    }

    if (typeof value === "string") {
      return value.split(",").map((word) => word.trim()).filter(Boolean);
    }
  } catch (error) {
    console.error("Restricted words load error:", error);
  }

  return defaultRestrictedWords;
}

function containsRestrictedWords(message: string, restrictedWords: string[]) {
  const normalizedMessage = normalizeText(message);

  return restrictedWords.some((word) => {
    const rawWord = word.trim();
    if (!rawWord) return false;

    const escaped = rawWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(escaped, "i").test(message)) return true;

    const normalizedWord = normalizeText(rawWord).trim();
    return normalizedWord.length > 0 && normalizedMessage.includes(normalizedWord);
  });
}

function getPropertyId(value: unknown) {
  return String(value);
}

function parsePriceValue(text: string) {
  const normalized = normalizeText(text).replace(/,/g, ".");
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(ty|ti|trieu)/);
  if (!match) return undefined;

  const value = Number(match[1]);
  if (!Number.isFinite(value)) return undefined;

  return match[2].startsWith("trieu") ? value : value * 1000;
}

function getPropertyPriceValue(property: PropertyForChat) {
  if (typeof property.priceValue === "number" && Number.isFinite(property.priceValue)) {
    return property.priceValue;
  }

  return parsePriceValue(property.price || "");
}

function extractKeywords(query: string) {
  return normalizeText(query)
    .split(/[^a-z0-9]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !stopWords.has(word))
    .slice(0, 12);
}

function parsePrices(query: string) {
  const normalized = normalizeText(query).replace(/,/g, ".");
  const pairedPriceMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:-|den|toi|hoac|hay|va)\s*(\d+(?:\.\d+)?)\s*(ty|ti|trieu)/
  );

  const prices = pairedPriceMatch
    ? [
        Number(pairedPriceMatch[1]) * (pairedPriceMatch[3].startsWith("trieu") ? 1 : 1000),
        Number(pairedPriceMatch[2]) * (pairedPriceMatch[3].startsWith("trieu") ? 1 : 1000),
      ].filter((value) => Number.isFinite(value))
    : [];

  for (const match of normalized.matchAll(/(\d+(?:\.\d+)?)\s*(ty|ti|trieu)/g)) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) {
      prices.push(match[2].startsWith("trieu") ? value : value * 1000);
    }
  }

  return Array.from(new Set(prices));
}

function parseSearchQuery(query: string): ParsedSearch {
  const normalized = normalizeText(query);
  const keywords = extractKeywords(query);
  const result: ParsedSearch = { isSearchIntent: false, keywords };

  const city = cities.find((item) => normalized.includes(item.slug));
  if (city) {
    result.city = city.label;
    result.citySlug = city.slug;
  }

  const propertyType = propertyTypeKeywords.find((item) => item.keywords.some((keyword) => normalized.includes(keyword)));
  if (propertyType) result.propertyType = propertyType.label;

  if (/\b(cho thue|thue)\b/.test(normalized)) {
    result.demand = "Cho thuê";
  } else if (/\b(mua|ban|mua ban)\b/.test(normalized)) {
    result.demand = "Mua bán";
  }

  const prices = parsePrices(query);
  if (prices.length > 0) {
    const low = Math.min(...prices);
    const high = Math.max(...prices);
    const asksForBudget = /\b(ngan sach|duoi|toi da|khong qua|tam gia|budget)\b/.test(normalized);
    const asksAround = /\b(khoang|tam|gan|xap xi)\b/.test(normalized);
    const asksMinimum = /\b(tu|tren|it nhat)\b/.test(normalized);

    result.targetPrice = prices.length === 1 ? prices[0] : (low + high) / 2;

    if (asksForBudget) {
      result.maxPrice = high;
    } else if (asksMinimum) {
      result.minPrice = low;
    } else if (asksAround) {
      result.minPrice = low * 0.85;
      result.maxPrice = high * 1.15;
    } else {
      result.minPrice = low * 0.95;
      result.maxPrice = high * 1.05;
    }
  }

  const hasPrice = prices.length > 0;
  const hasPropertyTerm =
    Boolean(result.propertyType) ||
    /\b(bat dong san|bds|nha dat|nha|can ho|chung cu|biet thu|dat nen|phong tro|mat bang)\b/.test(normalized);
  const hasSearchVerb = /\b(tim|goi y|co|mua|thue|can mua|can thue|xem|loc)\b/.test(normalized);
  const asksGeneralInfo = /\b(hien nay|the nao|xu huong|thi truong|tu van|quy trinh|thu tuc|lam sao|kinh nghiem)\b/.test(
    normalized
  );
  const asksListing =
    (hasSearchVerb && hasPropertyTerm) ||
    (hasSearchVerb && hasPrice) ||
    (Boolean(result.citySlug) && hasPropertyTerm) ||
    (Boolean(result.propertyType) && hasPrice) ||
    hasPrice;

  result.isSearchIntent = asksGeneralInfo && !hasPrice ? false : asksListing;

  return result;
}

function getSearchText(property: PropertyForChat) {
  return normalizeText(
    [
      property.title,
      property.description,
      property.propertyType,
      property.type,
      property.address,
      property.city,
      property.price,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function hasConflictingCity(property: PropertyForChat, requestedCitySlug: string) {
  const haystack = getSearchText(property);

  return cities.some((city) => {
    return city.slug !== requestedCitySlug && haystack.includes(city.slug);
  });
}

function scoreProperty(property: PropertyForChat, parsed: ParsedSearch, currentPropertyId?: string): PropertyCandidate {
  const haystack = getSearchText(property);
  const priceValue = getPropertyPriceValue(property);
  const reasons: string[] = [];
  let score = 0;
  let hardMiss = false;

  if (currentPropertyId && getPropertyId(property._id) === currentPropertyId) {
    score += 25;
    reasons.push("tin đang xem");
  }

  if (parsed.citySlug) {
    if (hasConflictingCity(property, parsed.citySlug)) {
      score -= 45;
      hardMiss = true;
    } else if (haystack.includes(parsed.citySlug)) {
      score += 28;
      reasons.push(`đúng khu vực ${parsed.city}`);
    } else {
      score -= 35;
      hardMiss = true;
    }
  }

  if (parsed.propertyType) {
    const typeWords = normalizeText(parsed.propertyType).split(/\s+/).filter(Boolean);
    const typeMatches = typeWords.some((word) => haystack.includes(word));
    if (typeMatches) {
      score += 24;
      reasons.push(`đúng loại ${parsed.propertyType}`);
    } else {
      score -= 25;
      hardMiss = true;
    }
  }

  if (parsed.demand) {
    if (haystack.includes(normalizeText(parsed.demand))) {
      score += 18;
      reasons.push(parsed.demand);
    } else {
      score -= 20;
      hardMiss = true;
    }
  }

  if (typeof parsed.minPrice === "number" || typeof parsed.maxPrice === "number") {
    if (typeof priceValue !== "number") {
      score -= 10;
      hardMiss = true;
    } else {
      const inRange =
        (typeof parsed.minPrice !== "number" || priceValue >= parsed.minPrice) &&
        (typeof parsed.maxPrice !== "number" || priceValue <= parsed.maxPrice);

      if (inRange) {
        score += 35;
        reasons.push(`giá ${property.price}`);
      } else if (typeof parsed.targetPrice === "number") {
        const distanceRatio = Math.abs(priceValue - parsed.targetPrice) / Math.max(parsed.targetPrice, 1);
        if (distanceRatio <= 0.35) {
          score += Math.max(0, 20 - Math.round(distanceRatio * 50));
          reasons.push(`giá gần yêu cầu (${property.price})`);
        } else {
          score -= 50;
        }
        hardMiss = true;
      }
    }
  }

  for (const keyword of parsed.keywords) {
    if (haystack.includes(keyword)) score += 4;
  }

  if (property.isFeatured) score += 2;

  const exact = !hardMiss && score > 0;
  return { property, score, exact, reasons };
}

function isReasonableNearby(candidate: PropertyCandidate, parsed: ParsedSearch) {
  const haystack = getSearchText(candidate.property);

  if (parsed.citySlug && !haystack.includes(parsed.citySlug)) return false;
  if (parsed.citySlug && hasConflictingCity(candidate.property, parsed.citySlug)) return false;

  if (parsed.propertyType) {
    const typeWords = normalizeText(parsed.propertyType).split(/\s+/).filter(Boolean);
    if (!typeWords.some((word) => haystack.includes(word))) return false;
  }

  if (parsed.demand && !haystack.includes(normalizeText(parsed.demand))) return false;

  if (typeof parsed.targetPrice === "number") {
    const priceValue = getPropertyPriceValue(candidate.property);
    if (typeof priceValue !== "number") return false;
    const distanceRatio = Math.abs(priceValue - parsed.targetPrice) / Math.max(parsed.targetPrice, 1);
    if (distanceRatio > 0.35) return false;
  }

  return candidate.score >= 25;
}

function formatPropertyContext(candidates: PropertyCandidate[]) {
  return candidates
    .slice(0, 8)
    .map(({ property, score, exact, reasons }) => {
      const id = getPropertyId(property._id);
      const address = [property.address, property.city].filter(Boolean).join(", ");
      return [
        `Mức khớp: ${exact ? "khớp đúng" : "gần đúng"}`,
        `Điểm: ${score}`,
        `Lý do: ${reasons.join("; ") || "phù hợp tương đối"}`,
        `Link: /property/${id}`,
        `Tiêu đề: ${property.title || "Chưa có tiêu đề"}`,
        `Nhu cầu: ${property.type || "Chưa rõ"}`,
        `Loại: ${property.propertyType || "Chưa rõ"}`,
        `Khu vực: ${address || "Chưa rõ"}`,
        `Giá: ${property.price || "Chưa rõ"}`,
        `Diện tích: ${property.area || 0}m2`,
        `Phòng ngủ: ${property.beds || 0}`,
        `Phòng tắm: ${property.baths || 0}`,
      ].join(", ");
    })
    .map((line) => `- ${line}`)
    .join("\n");
}

function formatDirectReply(mode: string, parsed: ParsedSearch, candidates: PropertyCandidate[]) {
  if (candidates.length === 0) {
    return `Tôi đã kiểm tra dữ liệu hiện có nhưng chưa thấy tin nào khớp với ${describeFilters(
      parsed
    )}. Tôi sẽ không gợi ý tin không có trong hệ thống.`;
  }

  const intro =
    mode === "exact"
      ? "Tôi đã tìm thấy một vài tin phù hợp trong dữ liệu hiện có:"
      : `Hiện chưa có tin đúng hoàn toàn với ${describeFilters(parsed)}, nhưng có vài tin gần tiêu chí:`;

  const lines = candidates.slice(0, 3).map(({ property, exact }) => {
    const address = [property.address, property.city].filter(Boolean).join(", ");
    return [
      `- ${property.title || "Tin bất động sản"}`,
      `  Giá: ${property.price || "Chưa rõ"}`,
      `  Loại: ${property.propertyType || "Chưa rõ"} | Nhu cầu: ${property.type || "Chưa rõ"}`,
      `  Khu vực: ${address || "Chưa rõ"}`,
      `  Diện tích: ${property.area || 0}m2`,
      `  Mức khớp: ${exact ? "khớp đúng" : "gần đúng"}`,
      `  Xem chi tiết: /property/${getPropertyId(property._id)}`,
    ].join("\n");
  });

  return `${intro}\n\n${lines.join("\n\n")}`;
}

function describeFilters(parsed: ParsedSearch) {
  const filters = [
    parsed.city ? `khu vực ${parsed.city}` : "",
    parsed.propertyType ? `loại ${parsed.propertyType}` : "",
    parsed.demand ? `nhu cầu ${parsed.demand}` : "",
    typeof parsed.minPrice === "number" || typeof parsed.maxPrice === "number"
      ? `giá ${parsed.minPrice ? `${(parsed.minPrice / 1000).toFixed(2)} tỷ trở lên` : ""}${
          parsed.minPrice && parsed.maxPrice ? " đến " : ""
        }${parsed.maxPrice ? `${(parsed.maxPrice / 1000).toFixed(2)} tỷ` : ""}`
      : "",
  ].filter(Boolean);

  return filters.length > 0 ? filters.join(", ") : "tiêu chí bạn vừa hỏi";
}

function getCurrentPropertyId(pagePath: unknown) {
  if (typeof pagePath !== "string") return undefined;
  const match = pagePath.match(/^\/property\/([a-f0-9]{24})/i);
  return match?.[1];
}

async function getPropertyContext(userQuery: string, pagePath?: unknown) {
  try {
    await dbConnect();

    const parsed = parseSearchQuery(userQuery);
    const currentPropertyId = getCurrentPropertyId(pagePath);

    if (!parsed.isSearchIntent && !currentPropertyId) {
      return {
        contextData: "Người dùng đang hỏi tư vấn chung. Không cần gợi ý tin đăng cụ thể nếu người dùng chưa yêu cầu tìm bất động sản.",
        mode: "general",
        parsed,
        exactCount: 0,
        candidateCount: 0,
        candidates: [],
      };
    }

    const properties = await Property.find({
      expiryDate: { $not: { $lte: new Date() } },
      status: { $nin: ["rejected", "sold"] },
    })
      .sort({ isFeatured: -1, postedDate: -1 })
      .limit(300)
      .lean<PropertyForChat[]>();

    if (properties.length === 0) {
      return {
        contextData: "Hiện hệ thống chưa có tin bất động sản nào.",
        mode: "empty",
        parsed,
        exactCount: 0,
        candidateCount: 0,
        candidates: [],
      };
    }

    const scored = properties
      .map((property) => scoreProperty(property, parsed, currentPropertyId))
      .sort((a, b) => b.score - a.score);

    const exactCandidates = scored.filter((candidate) => candidate.exact && candidate.score > 0);
    const nearbyCandidates = scored.filter((candidate) => !candidate.exact && isReasonableNearby(candidate, parsed));
    const fallbackCandidates = parsed.isSearchIntent ? [] : scored.filter((candidate) => candidate.score > 0);
    const candidates =
      exactCandidates.length > 0
        ? exactCandidates
        : nearbyCandidates.length > 0
          ? nearbyCandidates
          : fallbackCandidates.length > 0
            ? fallbackCandidates
            : parsed.isSearchIntent
              ? []
              : scored.slice(0, 5);

    const mode = exactCandidates.length > 0 ? "exact" : candidates.length > 0 ? "nearby" : "none";

    return {
      contextData:
        mode === "none"
          ? `Không có tin đăng nào trong database khớp với ${describeFilters(parsed)}.`
          : formatPropertyContext(candidates),
      mode,
      parsed,
      exactCount: exactCandidates.length,
      candidateCount: candidates.length,
      candidates,
    };
  } catch (error) {
    console.error("Chat context DB error:", error);
    return {
      contextData:
        "Không thể tải dữ liệu bất động sản từ hệ thống lúc này. Vẫn có thể tư vấn quy trình chung, nhưng không được bịa tin đăng cụ thể.",
      mode: "error",
      parsed: parseSearchQuery(userQuery),
      exactCount: 0,
      candidateCount: 0,
      candidates: [],
    };
  }
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
      return NextResponse.json(
        {
          error: "Chưa cấu hình GEMINI_API_KEY.",
          details: "Thêm GEMINI_API_KEY vào file .env.local rồi khởi động lại dev server.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages.filter(isChatMessage) : [];

    if (messages.length === 0) {
      return NextResponse.json({ error: "Thiếu dữ liệu messages." }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user") {
      return NextResponse.json({ error: "Tin nhắn cuối phải là của người dùng." }, { status: 400 });
    }

    const restrictedWords = await getRestrictedWords();
    if (containsRestrictedWords(lastMessage.content, restrictedWords)) {
      return NextResponse.json({
        reply:
          "Tin nhắn của bạn có nội dung không phù hợp nên tôi chưa xử lý yêu cầu này. Bạn vui lòng nhập lại bằng ngôn từ lịch sự hơn nhé.",
        blocked: true,
      });
    }

    const { contextData, mode, parsed, exactCount, candidateCount, candidates } = await getPropertyContext(
      lastMessage.content,
      body?.pagePath
    );

    if (mode === "none" && parsed.isSearchIntent) {
      return NextResponse.json({
        reply: `Tôi đã kiểm tra dữ liệu hiện có nhưng chưa thấy tin nào khớp với ${describeFilters(
          parsed
        )}. Tôi sẽ không gợi ý giá hoặc tin không có trong hệ thống. Bạn có thể thử nới ngân sách, đổi khu vực, hoặc bỏ bớt loại bất động sản để tôi tìm lại.`,
      });
    }

    if (parsed.isSearchIntent) {
      return NextResponse.json({ reply: formatDirectReply(mode, parsed, candidates) });
    }

    const systemPrompt = `
Bạn là "An Cư Plus AI", trợ lý bất động sản của nền tảng An Cư Plus tại Việt Nam.
Bạn trả lời bằng tiếng Việt, thân thiện, ngắn gọn, rõ ý. Xưng là "Tôi" và gọi khách hàng là "Bạn".

Nguồn dữ liệu:
- Các ứng viên bên dưới được lấy trực tiếp từ MongoDB của website An Cư Plus.
- Chế độ dữ liệu: ${mode}.
- Số tin khớp đúng: ${exactCount}.
- Số tin ứng viên được đưa vào ngữ cảnh: ${candidateCount}.

Quy tắc bắt buộc:
- Khi giới thiệu tin đăng cụ thể, CHỈ dùng dữ liệu trong phần "Dữ liệu bất động sản hiện có".
- Không bịa giá, địa chỉ, pháp lý, chủ nhà hoặc ID tin đăng nếu dữ liệu không có.
- Nếu chế độ dữ liệu là "exact", hãy giới thiệu 1-3 tin khớp nhất.
- Nếu chế độ dữ liệu là "nearby", phải nói rõ "hiện chưa có tin đúng hoàn toàn, nhưng có vài tin gần tiêu chí" rồi mới gợi ý.
- Nếu không có dữ liệu phù hợp, nói rõ là chưa có tin phù hợp trong hệ thống.
- Với mỗi tin đăng, luôn ghi đường dẫn chi tiết đúng dạng: /property/ID
- Không hiển thị ID riêng lẻ nếu đã có đường dẫn chi tiết.
- Không dùng bảng markdown.
- Nếu câu hỏi là tư vấn pháp lý/tài chính quan trọng, nhắc người dùng kiểm tra với chuyên gia phù hợp.

Dữ liệu bất động sản hiện có:
${contextData}
`.trim();

    const history = messages
      .slice(0, -1)
      .filter((message) => message.content.trim())
      .filter((message, index) => !(index === 0 && message.role === "assistant"))
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      }));

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
        systemInstruction: systemPrompt,
      });

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMessage.content);
      const reply = result.response.text().trim();

      return NextResponse.json({ reply });
    } catch (aiError) {
      console.error("Gemini AI Error, using data fallback:", aiError);
      if (!parsed.isSearchIntent) {
        return NextResponse.json({
          reply:
            "Tôi đang gặp lỗi kết nối AI nên chưa thể tư vấn chi tiết câu hỏi chung này. Nếu bạn muốn tìm tin cụ thể theo giá, khu vực hoặc loại bất động sản, tôi vẫn có thể tra trực tiếp trong dữ liệu hệ thống.",
        });
      }
      return NextResponse.json({ reply: formatDirectReply(mode, parsed, candidates) });
    }
  } catch (error) {
    console.error("Gemini AI Error:", error);
    const details = error instanceof Error ? error.message : "Lỗi không xác định";

    return NextResponse.json(
      {
        error: "Lỗi kết nối tới hệ thống AI.",
        details,
      },
      { status: 500 }
    );
  }
}
