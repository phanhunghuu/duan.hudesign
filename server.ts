import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { generateContentWithResilience } from './server/brandStrategicPlanner.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    brand: 'Hủ Design',
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// AI Script Generator Endpoint for TikTok & YouTube
app.post('/api/generate-script', async (req, res) => {
  try {
    const { rawIdea, platform, tone, videoLength, targetAudience, format } = req.body;

    if (!rawIdea || typeof rawIdea !== 'string') {
      return res.status(400).json({ error: 'Vui lòng cung cấp ý tưởng thô cho video.' });
    }

    const ai = getGeminiAI();
    const platformLabel = platform === 'tiktok' ? 'TikTok / Reels / Shorts (Video ngắn)' : 'YouTube (Video dài/chuyên sâu)';
    const promptTone = tone || 'Chuyên nghiệp, lôi cuốn & mang phong cách Designer sáng tạo';
    const promptLength = videoLength || (platform === 'tiktok' ? '30-60 giây' : '5-10 phút');

    const prompt = `Bạn là một Content Director kiêm Scriptwriter hàng đầu cho studio thiết kế sáng tạo "Hủ Design" (chuyên về Branding, Packaging, UI/UX, Graphic Design và chia sẻ kinh nghiệm làm nghề thiết kế đồ họa).
Hãy chuyển đổi ý tưởng thô sau thành một kịch bản video hoàn chỉnh, thu hút và có cấu trúc chặt chẽ.

THÔNG TIN ĐẦU VÀO:
- Ý tưởng gốc: "${rawIdea}"
- Nền tảng: ${platformLabel}
- Định dạng / Thể loại: ${format || 'Kiến thức / Bí kíp thiết kế / Behind the scenes'}
- Phong cách / Tone giọng: ${promptTone}
- Thời lượng mục tiêu: ${promptLength}
- Đối tượng người xem: ${targetAudience || 'Khách hàng cần thiết kế, Designer trẻ, Sinh viên mỹ thuật & người yêu sáng tạo'}

YÊU CẦU ĐẦU RA (JSON FORMAT DUY NHẤT):
Trả về định dạng JSON thuần túy (không bọc trong markdown tick nếu có thể, hoặc chuẩn JSON) với cấu trúc sau:
{
  "title": "Tiêu đề video gây tò mò, bắt trend (dưới 70 ký tự)",
  "hook": "Câu mở đầu (Hook 3-5s đầu) cực kỳ cuốn hút, đánh vào nỗi đau (pain point) hoặc tạo sự tò mò ngay lập tức cho người xem kèm hướng dẫn hình ảnh cảnh quay mở màn",
  "hookVisual": "Gợi ý góc máy/hiệu ứng hình ảnh/chữ xuất hiện trong 3s đầu",
  "body": [
    {
      "segment": "Phần 1: Giới thiệu vấn đề / Điểm nhấn cốt lõi",
      "visual": "Gợi ý cảnh quay (Visual/B-roll/Màn hình Figma/Photoshop)",
      "audio": "Lời thoại chi tiết của Host hoặc voice-over",
      "duration": "10s"
    },
    {
      "segment": "Phần 2: Giải pháp & Phân tích chuyên môn",
      "visual": "Thao tác phần mềm hoặc trước & sau (Before/After)",
      "audio": "Lời thoại phân tích sâu sắc, dễ hiểu, đậm chất Hủ Design",
      "duration": "25s"
    },
    {
      "segment": "Phần 3: Bài học thực chiến / Tip đắt giá",
      "visual": "Zoom vào chi tiết thiết kế hoặc bảng màu/typography",
      "audio": "Lời thoại chốt hạ giá trị bài học",
      "duration": "15s"
    }
  ],
  "callToAction": "Lời kêu gọi hành động (CTA) ngắn gọn, tự nhiên hướng người xem bình luận, lưu video hoặc liên hệ Hủ Design nhận tư vấn",
  "ctaVisual": "Gợi ý visual xuất hiện logo Hủ Design hoặc pop-up link bio",
  "suggestedHashtags": ["#HuDesign", "#graphicdesign", "#designvietnam", "#branding", "#tipsdesign"],
  "productionNotes": "Ghi chú về âm nhạc nền (BGM), sound effects (SFX) và tone màu video khuyến nghị"
}`;

    if (!ai) {
      // Fallback generator when API key is not configured
      const fallbackScript = generateCreativeFallbackScript(rawIdea, platform, tone);
      return res.json({ script: fallbackScript, mode: 'template_engine' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const responseText = response.text || '';
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Clean up markdown block if any
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    res.json({ script: parsed, mode: 'gemini_ai' });
  } catch (error: any) {
    console.error('Gemini API Script Error:', error);
    // Even if Gemini fails, generate a rich fallback template so the user is never blocked
    const fallbackScript = generateCreativeFallbackScript(
      req.body?.rawIdea || 'Chia sẻ kinh nghiệm thiết kế',
      req.body?.platform || 'tiktok',
      req.body?.tone || 'Chuyên nghiệp'
    );
    res.json({
      script: fallbackScript,
      mode: 'template_fallback',
      warning: 'Đã tạo kịch bản qua Smart Script Engine của Hủ Design.',
    });
  }
});

// AI Pricing & Terms Generator Endpoint
app.post('/api/generate-pricing-ai', async (req, res) => {
  try {
    const { requestType, serviceTitle, tierName, currentFeatures, notes } = req.body;
    const ai = getGeminiAI();

    const title = serviceTitle || 'Dịch vụ Thiết kế Đồ họa Chuyên nghiệp';
    const type = requestType || 'all';

    const systemPrompt = `Bạn là Giám đốc Sáng tạo & Chuyên gia Báo giá Studio cao cấp của 'Hủ Design' (Studio thiết kế đồ họa, Branding, Bao bì, UI/UX, In ấn & Truyền thông).
Nhiệm vụ của bạn là soạn thảo nội dung tính năng/quyền lợi (Features/Deliverables) và điều khoản hợp tác (Terms & Policies) cho bảng giá dịch vụ gửi khách hàng.
Ngôn ngữ: Tiếng Việt, văn phong chuyên nghiệp, minh bạch, bảo vệ quyền tác giả studio nhưng cực kỳ thuyết phục khách hàng chốt hợp đồng.

DỊCH VỤ / SẢN PHẨM: "${title}"
${tierName ? `TÊN GÓI ĐANG XỬ LÝ: "${tierName}"` : ''}
${notes ? `GHI CHÚ / YÊU CẦU ĐẶC THÙ: "${notes}"` : ''}
${currentFeatures && currentFeatures.length > 0 ? `CÁC TÍNH NĂNG HIỆN CÓ: ${currentFeatures.join(', ')}` : ''}
LOẠI YÊU CẦU: "${type}" (full_tiers: tạo trọn bộ các gói phân cấp, features_only: tạo danh sách tính năng quyền lợi, terms_only: tạo các điều khoản hợp tác, all: tạo cả tính năng và điều khoản)

YÊU CẦU ĐẦU RA:
Trả về duy nhất định dạng JSON thuần túy theo cấu trúc sau:
{
  "summary": "Lời bình luận ngắn gọn về chiến lược định giá và điểm mạnh của gói này (1-2 câu)",
  "suggestedFeatures": [
    {
      "text": "Tên quyền lợi cụ thể (VD: Số mẫu phác thảo ý tưởng: 3 Option riêng biệt)",
      "included": true
    },
    {
      "text": "Số vòng chỉnh sửa hoàn thiện: Tối đa 5 lần",
      "included": true
    },
    {
      "text": "Hỗ trợ giám sát in ấn thực tế tại nhà in",
      "included": false
    }
  ],
  "suggestedTerms": [
    {
      "title": "Tạm ứng & Phương thức thanh toán",
      "content": "Khách hàng tạm ứng 50% chi phí khi xác nhận làm, 50% còn lại thanh toán sau khi nghiệm thu và trước khi nhận bàn giao toàn bộ file gốc."
    },
    {
      "title": "Quy định số lần chỉnh sửa",
      "content": "Gói thiết kế bao gồm số lần chỉnh sửa theo tiêu chuẩn cam kết. Các yêu cầu thay đổi toàn bộ ý tưởng ban đầu hoặc vượt quá số lần quy định sẽ tính thêm 15% - 25% giá trị gói."
    },
    {
      "title": "Bản quyền & Bàn giao file nguồn",
      "content": "Sau khi hoàn tất thanh toán, khách hàng sở hữu toàn bộ bản quyền thương mại đối với phương án duyệt cuối cùng. Bàn giao đầy đủ file vector gốc (AI, PDF chuẩn in, PNG, SVG) cùng thông số màu CMYK/RGB."
    },
    {
      "title": "Thời gian phản hồi & Nghiệm thu",
      "content": "Tiến độ dự án tính theo ngày làm việc. Khách hàng phản hồi góp ý trong vòng 48h để đảm bảo tiến độ bàn giao đúng hạn cam kết."
    }
  ],
  "suggestedTiers": [
    {
      "name": "GÓI TIÊU CHUẨN",
      "price": "1.800.000 VNĐ",
      "subtitle": "Lựa chọn tối ưu cho doanh nghiệp vừa và nhỏ",
      "colorTheme": "purple",
      "iconName": "shield",
      "isPopular": true,
      "popularBadgeText": "KHUYÊN DÙNG",
      "features": [
        { "text": "Số phương án phác thảo: 3 Concept", "included": true },
        { "text": "Số lần chỉnh sửa: 5 lần", "included": true },
        { "text": "File gốc Vector chuẩn in ấn (AI, PDF)", "included": true },
        { "text": "Phối cảnh 3D Mockup thực tế", "included": true },
        { "text": "Cẩm nang quy chuẩn màu sắc & font chữ", "included": true }
      ]
    }
  ]
}`;

    if (!ai) {
      const fallback = generatePricingFallback(title, type, tierName);
      return res.json({ result: fallback, mode: 'template_engine' });
    }

    const { text: responseText } = await generateContentWithResilience(ai, systemPrompt, {
      responseMimeType: 'application/json',
      temperature: 0.7,
    });

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    res.json({ result: parsed, mode: 'gemini_ai' });
  } catch (error: any) {
    console.error('Gemini API Pricing Error:', error);
    const fallback = generatePricingFallback(
      req.body?.serviceTitle || 'Thiết kế đồ họa',
      req.body?.requestType || 'all',
      req.body?.tierName
    );
    res.json({
      result: fallback,
      mode: 'template_fallback',
      warning: 'Đã gợi ý qua Smart Pricing Engine của Hủ Design.',
    });
  }
});

// ========================================================
// AI FANPAGE INTELLIGENCE: DEEP BRAND TOPICS & COPYWRITER
// ========================================================

// 1. AI gợi ý chủ đề chuyên sâu cho thương hiệu (Gemini 3.8 Flash)
app.post('/api/generate-fanpage-topics', async (req, res) => {
  try {
    const { brand, pillar, dayOfWeek, historyTitles, currentTitle } = req.body;
    const ai = getGeminiAI();

    const brandName = brand?.name || 'Thương hiệu';
    const industry = brand?.industry || 'Dịch vụ & Bán lẻ';
    const desc = brand?.businessDescription || 'Không có mô tả chi tiết';
    const tone = brand?.toneOfVoice || 'Thân thiện, chuyên nghiệp, uy tín';
    const dos = Array.isArray(brand?.dos) ? brand.dos.join('; ') : '';
    const donts = Array.isArray(brand?.donts) ? brand.donts.join('; ') : '';
    const generalNotes = brand?.generalNotes || '';
    const historyList = Array.isArray(historyTitles) && historyTitles.length > 0
      ? historyTitles.slice(0, 30).map((t: string) => `- ${t}`).join('\n')
      : 'Chưa có bài viết nào trong các tuần trước.';

    const systemPrompt = `Bạn là một Giám đốc Sáng tạo Nội dung (Creative Content Director) và Chuyên gia Truyền thông Mạng xã hội hàng đầu tại Việt Nam, đang trực tiếp cố vấn chiến lược Fanpage Facebook cho thương hiệu sau:

--- HỒ SƠ THƯƠNG HIỆU ---
- Tên thương hiệu: "${brandName}"
- Lĩnh vực / Ngành nghề: "${industry}"
- Mô tả chi tiết hoạt động kinh doanh, sản phẩm/dịch vụ cốt lõi & tệp khách hàng: "${desc}"
- Tone giọng thương hiệu (Tone of Voice): "${tone}"
- Quy chuẩn NÊN làm: "${dos}"
- Quy chuẩn CẤM kỵ: "${donts}"
- Ghi chú đặc thù: "${generalNotes}"

--- BỐI CẢNH BÀI ĐĂNG CẦN LÊN Ý TƯỞNG ---
- Trụ cột nội dung (Content Pillar): "${pillar || 'Chia sẻ kiến thức & Tips'}"
- Thứ trong tuần phát hành: "${dayOfWeek || 'Thứ 2'}"
${currentTitle ? `- Định hướng ý tưởng hiện có: "${currentTitle}"` : ''}

--- LỊCH SỬ CÁC CHỦ ĐỀ ĐÃ VIẾT (TUYỆT ĐỐI KHÔNG TRÙNG LẶP HOẶC NÓI LẠI Ý CŨ) ---
${historyList}

--- NGUYÊN TẮC BẮT BUỘC ĐỂ NỘI DUNG CHUYÊN SÂU, KHÔNG XÀM, KHÔNG CHUNG CHUNG ---
1. ĐI THẲNG VÀO BẢN CHẤT NGÀNH NGHỀ & SẢN PHẨM/DỊCH VỤ CỦA "${brandName}":
   - Nếu là giao hàng/vận chuyển (như Citiship, shipper, bưu cục, chuyển phát...): Bắt buộc nói về các bài toán thiết thực của chủ shop và khách nhận (ví dụ: mẹo đóng gói hàng dễ vỡ chống nứt vỡ, cách giảm tỷ lệ hoàn đơn xuống dưới 3%, quy trình đối soát tiền COD 24h, bảo hiểm đền bù 100% khi thất lạc, giao siêu tốc nội thành 2h, thái độ phục vụ của shipper, mẹo xả kho mùa sale...).
   - Nếu là F&B (cà phê, trà, quán ăn...): Nói về nguồn gốc hạt, phương pháp pha, trải nghiệm vị giác, combo văn phòng, workshop thử nếm...
   - Nếu là các ngành khác: Phải dùng đúng thuật ngữ chuyên môn, nỗi đau có thật và hành vi thực tế của khách hàng ngành đó.
2. TUYỆT ĐỐI CẤM SÁO RỖNG: Không được đưa ra những câu chung chung vô thưởng vô phạt như "3 bí quyết để thành công", "lựa chọn dịch vụ đúng cách", "kinh nghiệm hữu ích cho bạn"... Mọi tiêu đề phải kích thích tò mò hoặc đánh trúng nỗi đau thực tế.
3. PHÙ HỢP VỚI TRỤ CỘT "${pillar}" & NGÀY "${dayOfWeek}".
4. ĐẢM BẢO TÍNH MỚI LẠ: Hoàn toàn khác biệt với danh sách bài viết đã có trong lịch sử ở trên.

YÊU CẦU ĐẦU RA (CHỈ TRẢ VỀ JSON ARRAY THUẦN TÚY):
[
  {
    "title": "Tiêu đề bài viết sắc bén, thu hút, mang đậm hơi thở thương hiệu ${brandName} (dưới 90 ký tự)",
    "angle": "Góc tiếp cận cụ thể (VD: Bóc mẽ nỗi đau chủ shop, Hướng dẫn thực chiến, So sánh trực quan, Bí kíp tối ưu chi phí, Case-study giải cứu đơn hàng)",
    "whyGood": "Giải thích 1-2 câu ngắn gọn vì sao chủ đề này đánh trúng tâm lý và mang lại tương tác cao cho thương hiệu"
  }
]`;

    if (!ai) {
      // Fallback generator when API key is missing
      const fallback = generateSmartFallbackTopics(brand, pillar, dayOfWeek, historyTitles);
      return res.json({ suggestions: fallback, mode: 'fallback_engine' });
    }

    const { text: responseText } = await generateContentWithResilience(ai, systemPrompt, {
      responseMimeType: 'application/json',
      temperature: 0.7,
    });

    let parsed: any[] = [];
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      parsed = generateSmartFallbackTopics(brand, pillar, dayOfWeek, historyTitles);
    }

    res.json({ suggestions: parsed, mode: 'gemini_ai' });
  } catch (error: any) {
    console.error('Gemini Topic Suggestion Error:', error);
    const fallback = generateSmartFallbackTopics(
      req.body?.brand,
      req.body?.pillar,
      req.body?.dayOfWeek,
      req.body?.historyTitles
    );
    res.json({ suggestions: fallback, mode: 'fallback_engine', error: error.message });
  }
});

// 2. AI viết bài chuyên sâu trọn bộ (Hook, Caption, CTA, Hashtags, Design Brief)
app.post('/api/generate-fanpage-copy', async (req, res) => {
  try {
    const { brand, title, pillar, postType, dayOfWeek, toneStyle } = req.body;
    const ai = getGeminiAI();

    const brandName = brand?.name || 'Thương hiệu';
    const industry = brand?.industry || 'Dịch vụ & Bán lẻ';
    const desc = brand?.businessDescription || 'Doanh nghiệp uy tín, chú trọng chất lượng và dịch vụ';
    const tone = brand?.toneOfVoice || 'Thân thiện, chuyên nghiệp, uy tín';
    const dos = Array.isArray(brand?.dos) ? brand.dos.join('; ') : '';
    const donts = Array.isArray(brand?.donts) ? brand.donts.join('; ') : '';
    const designStyle = brand?.designStyle || 'Hiện đại, tinh tế, nhận diện rõ ràng';
    const primaryColor = brand?.colors?.primary || '#1E293B';
    const secondaryColor = brand?.colors?.secondary || '#3B82F6';
    const headingFont = brand?.fonts?.headingFont || 'Montserrat';

    let toneDirective = `Bám sát chuẩn tone giọng của thương hiệu: "${tone}".`;
    if (toneStyle === 'viral_hook') {
      toneDirective = `Tập trung vào tính tò mò, giật tít dừng lướt trong 3 giây đầu (Scroll-stopping Hook), đánh vào phản trực giác hoặc tâm lý FOMO của người dùng mạng xã hội.`;
    } else if (toneStyle === 'expert') {
      toneDirective = `Văn phong chuyên gia uy tín, mang lại cẩm nang thực chiến, số liệu hoặc hướng dẫn chi tiết từng bước khiến người đọc phải bấm Lưu (Save) hoặc Share bài viết.`;
    } else if (toneStyle === 'emotional') {
      toneDirective = `Ấm áp, thấu hiểu, chạm tới cảm xúc, xưng hô chân thành, kể chuyện từ cái tâm của người làm nghề.`;
    } else if (toneStyle === 'humorous') {
      toneDirective = `Hài hước, duyên dáng, bắt trend khéo léo, tự nhiên, tạo tiếng cười đồng cảm khiến người đọc muốn tag bạn bè ngay vào bình luận.`;
    }

    const systemPrompt = `Bạn là Senior Content Copywriter kiêm Creative Director chuyên viết bài Facebook Fanpage đỉnh cao tại Việt Nam cho thương hiệu:
- Tên thương hiệu: "${brandName}"
- Lĩnh vực kinh doanh: "${industry}"
- Sản phẩm, dịch vụ cốt lõi & Tệp khách hàng: "${desc}"
- Định hướng phong cách thiết kế & Nhận diện: "${designStyle}" (Màu chính: ${primaryColor}, Màu phụ: ${secondaryColor}, Font: ${headingFont})
- Quy chuẩn NÊN làm: "${dos}"
- Điều CẤM kỵ: "${donts}"

BÀI VIẾT CẦN HOÀN THIỆN:
- Tiêu đề chủ đề: "${title || 'Giải pháp đột phá cho khách hàng'}"
- Trụ cột nội dung: "${pillar || 'Chia sẻ kiến thức & Tips'}"
- Định dạng bài: "${postType || 'Single Post (1 ảnh)'}"
- Ngày đăng: "${dayOfWeek || 'Thứ 2'}"
- Phong cách viết: ${toneDirective}

--- NGUYÊN TẮC BẮT BUỘC ĐỂ BÀI VIẾT CHUYÊN SÂU, SẮC BÉN, KHÔNG XÀM ---
1. PHẢI CÓ THỰC TẾ NGÀNH & SẢN PHẨM CỦA "${brandName}":
   - Khắc họa chính xác tình huống, khó khăn, thói quen của khách hàng mục tiêu của "${brandName}".
   - Nếu là giao hàng/vận chuyển (như Citiship): Nhắc trực diện đến việc giao nhận, cước phí, shop online, bảo quản kiện hàng, thời gian hỏa tốc, sự tận tâm của đội ngũ giao vận...
   - Nếu là F&B, gốm sứ, thời trang, giáo dục...: Bắt buộc dùng đúng ngôn ngữ và góc nhìn của ngành đó.
   - TUYỆT ĐỐI KHÔNG viết chung chung, lý thuyết suông như "chọn đúng giải pháp", "thay đổi thói quen", "đạt kết quả tốt".
2. CẤU TRÚC BÀI VIẾT FACEBOOK CHUẨN MỰC:
   - Dòng đầu mở màn là HOOK ngắn gọn, đánh thẳng vào tâm trí người lướt.
   - Các đoạn văn ngắn, cách nhau bằng dòng trống, có emoji tinh tế, tạo độ thoáng mắt dễ đọc trên điện thoại.
   - Thân bài phân tích logic, đưa ra giải pháp thiết thực, lồng ghép tự nhiên ưu thế của "${brandName}".
   - Lời kêu gọi hành động (CTA) kích thích tương tác, inbox hoặc gọi hotline rõ ràng.
3. PHẦN BRIEF THIẾT KẾ (DESIGN BRIEF) CHO DESIGNER HỦ DESIGN:
   - Đưa ra định hướng hình ảnh cụ thể để Designer có thể mở máy lên thiết kế ngay: Tiêu đề đè ảnh, bố cục visual concept, mockup gì, phối màu ${primaryColor} và ${secondaryColor}.

YÊU CẦU ĐẦU RA (CHỈ TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON):
{
  "hook": "Câu hook giật tít 1-2 dòng đầu tiên cực cuốn hút để dừng lướt newsfeed Facebook",
  "caption": "Nội dung caption đầy đủ, phân đoạn rõ ràng bằng xuống dòng và emoji tinh tế, sâu sắc, thực chiến",
  "callToAction": "Lời kêu gọi hành động cụ thể thúc đẩy tương tác/inbox/gọi hotline",
  "hashtags": "#${brandName.replace(/\s+/g, '')} #HashtagNganhHang #HashtagChuDe",
  "designBrief": {
    "aspectRatio": "4:5 (Dọc chuẩn Facebook)",
    "headlineOnImage": "Chữ tiêu đề lớn đè trên ảnh ấn phẩm (dưới 8 từ, cực bắt mắt)",
    "subTextOnImage": "Dòng chữ phụ hoặc tag bổ trợ trên ảnh",
    "visualConcept": "Mô tả bố cục thiết kế chi tiết: nhân vật/sản phẩm nằm ở đâu, mockup gì, phối màu chủ đạo ${primaryColor}, ánh sáng và hiệu ứng đồ họa ra sao",
    "moodAndTone": "Cảm xúc và tinh thần của ấn phẩm (VD: Năng động, tin cậy, hiện đại)"
  }
} `;

    if (!ai) {
      const fallback = generateSmartFallbackCopy(brand, title, pillar, postType, dayOfWeek, toneStyle);
      return res.json({ result: fallback, mode: 'fallback_engine' });
    }

    const { text: responseText } = await generateContentWithResilience(ai, systemPrompt, {
      responseMimeType: 'application/json',
      temperature: 0.7,
    });

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    res.json({ result: parsed, mode: 'gemini_ai' });
  } catch (error: any) {
    console.error('Gemini Copywriting Error:', error);
    const fallback = generateSmartFallbackCopy(
      req.body?.brand,
      req.body?.title,
      req.body?.pillar,
      req.body?.postType,
      req.body?.dayOfWeek,
      req.body?.toneStyle
    );
    res.json({ result: fallback, mode: 'fallback_engine', error: error.message });
  }
});

// 3. AI Phân tích chiến lược thương hiệu chuyên sâu (Brand Strategic Diagnostic)
app.post('/api/analyze-brand-strategy', async (req, res) => {
  try {
    const { brand } = req.body;
    const ai = getGeminiAI();
    const { analyzeBrandStrategy } = await import('./server/brandStrategicPlanner.ts');
    const strategy = await analyzeBrandStrategy(ai, brand);
    res.json({ success: true, strategy, mode: ai ? 'gemini_ai' : 'deep_strategic_engine' });
  } catch (error: any) {
    console.error('Error analyzing brand strategy:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. AI Lập kế hoạch tuần tự động chuyên sâu & thực chiến (Deep Weekly Planner)
app.post('/api/generate-weekly-plan', async (req, res) => {
  try {
    const { brand, postCount, weekFocus, customWeeklyNote, startDate, weekNumber } = req.body;
    const ai = getGeminiAI();
    const { generateStrategicWeeklyPlan } = await import('./server/brandStrategicPlanner.ts');
    const posts = await generateStrategicWeeklyPlan(ai, {
      brand,
      postCount: postCount || 4,
      weekFocus: weekFocus || 'balanced',
      customWeeklyNote: customWeeklyNote || '',
      startDate: startDate || new Date().toISOString().split('T')[0],
      weekNumber: weekNumber || 36,
    });
    res.json({ success: true, posts, mode: ai ? 'gemini_ai' : 'deep_strategic_engine' });
  } catch (error: any) {
    console.error('Error generating weekly plan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper Fallback Topics khi không có AI mạng
function generateSmartFallbackTopics(brand: any, pillar: string, dayOfWeek: string, historyTitles?: string[]) {
  const brandName = brand?.name || 'Thương hiệu';
  const industry = brand?.industry || '';
  const desc = brand?.businessDescription || '';
  const lower = (brandName + ' ' + industry + ' ' + desc).toLowerCase();

  const isShipping = lower.includes('ship') || lower.includes('vận chuyển') || lower.includes('giao hàng') || lower.includes('logistics') || lower.includes('citi');
  const isFnB = lower.includes('f&b') || lower.includes('cà phê') || lower.includes('trà') || lower.includes('quán');

  if (isShipping) {
    return [
      {
        title: `3 bí quyết đóng gói hàng hóa dễ vỡ giúp chủ shop giảm tỷ lệ hoàn đơn về 0%`,
        angle: 'Bí kíp tối ưu vận hành cho chủ shop',
        whyGood: 'Đánh trúng nỗi lo lớn nhất của người bán hàng online: hàng hỏng, khách trả hàng, mất tiền cước.'
      },
      {
        title: `Giao hỏa tốc 2H nội thành: Bí mật giúp shop của bạn chốt đơn ngay khi khách còn nóng lòng`,
        angle: 'Tăng tỷ lệ chốt đơn bán hàng',
        whyGood: 'Tốc độ là vũ khí cạnh tranh số 1 trong thương mại điện tử hiện đại.'
      },
      {
        title: `Minh bạch tiền COD & Đối soát 24h: Giải tỏa nỗi lo đọng vốn kinh doanh của bạn`,
        angle: 'Giải quyết bài toán dòng tiền',
        whyGood: 'Chủ shop luôn muốn tiền về nhanh để xoay vòng vốn nhập hàng.'
      },
      {
        title: `Câu chuyện đằng sau những kiện hàng ngày mưa: Sự tận tâm của các shipper ${brandName}`,
        angle: 'Hình ảnh thương hiệu & Con người',
        whyGood: 'Tạo cảm xúc chân thực, xây dựng sự tin yêu và thiện cảm từ cả người gửi lẫn người nhận.'
      }
    ];
  }

  if (isFnB) {
    return [
      {
        title: `Bí quyết nhận biết hương vị cà phê Arabica rang mộc nguyên chất`,
        angle: 'Cẩm nang sành cà phê',
        whyGood: 'Xây dựng vị thế chuyên môn và thu hút tệp khách yêu thích chất lượng thật.'
      },
      {
        title: `Nạp năng lượng ngày ${dayOfWeek} với combo Cold Brew & Bánh ngọt signature tại ${brandName}`,
        angle: 'Kích thích mua hàng theo ngày',
        whyGood: 'Thúc đẩy quyết định đặt hàng ngay trong giờ giải lao văn phòng.'
      },
      {
        title: `Góc nhỏ yên tĩnh giữa phố thị: Nơi những ý tưởng sáng tạo được khơi nguồn`,
        angle: 'Trải nghiệm không gian & Cảm xúc',
        whyGood: 'Thu hút tệp Freelancer và dân văn phòng tìm kiếm không gian làm việc lý tưởng.'
      },
      {
        title: `Từ nông trại Cầu Đất đến tách cà phê trên tay bạn: Hành trình của sự tận tụy`,
        angle: 'Câu chuyện thương hiệu',
        whyGood: 'Khẳng định nguồn gốc minh bạch và giá trị nguyên bản của sản phẩm.'
      }
    ];
  }

  return [
    {
      title: `Tại sao khách hàng thông thái luôn chọn ${brandName} thay vì những giải pháp giá rẻ?`,
      angle: 'Định vị giá trị cốt lõi',
      whyGood: 'Làm nổi bật chất lượng vượt trội và dịch vụ tận tâm của thương hiệu.'
    },
    {
      title: `Giải quyết triệt để nỗi băn khoăn lớn nhất của bạn trong ngành ${industry || 'dịch vụ'}`,
      angle: 'Gỡ bỏ rào cản khách hàng',
      whyGood: 'Đánh trúng tâm lý ngập ngừng trước khi ra quyết định sử dụng dịch vụ.'
    },
    {
      title: `Quy trình kiểm soát chất lượng nghiêm ngặt tại ${brandName}: Cam kết bằng hành động`,
      angle: 'Xây dựng niềm tin vững chắc',
      whyGood: 'Minh bạch quy trình để khách hàng tuyệt đối an tâm.'
    },
    {
      title: `Ưu đãi đặc quyền ngày ${dayOfWeek}: Trải nghiệm dịch vụ chuẩn 5 sao cùng ${brandName}`,
      angle: 'Kích cầu sử dụng dịch vụ',
      whyGood: 'Tạo động lực hành động ngay để nhận quyền lợi tốt nhất.'
    }
  ];
}

// Helper Fallback Copy khi không có AI mạng
function generateSmartFallbackCopy(brand: any, title: string, pillar: string, postType: string, dayOfWeek: string, toneStyle?: string) {
  const brandName = brand?.name || 'Thương hiệu';
  const industry = brand?.industry || 'Dịch vụ';
  const desc = brand?.businessDescription || '';
  const cleanTitle = title || 'Giải pháp tối ưu cho khách hàng';
  const lower = (brandName + ' ' + industry + ' ' + desc).toLowerCase();
  const isShipping = lower.includes('ship') || lower.includes('vận chuyển') || lower.includes('giao hàng') || lower.includes('logistics') || lower.includes('citi');

  if (isShipping) {
    return {
      hook: `📦 Bạn có biết: 40% khách hàng hủy đơn chỉ vì thời gian giao hàng quá lâu hoặc hàng bị móp méo khi nhận?`,
      caption: `Trong kinh doanh online, kiện hàng trao tay khách không chỉ là sản phẩm – đó là bộ mặt và uy tín của cả cửa hàng bạn!

Tại ${brandName}, chúng tôi hiểu rằng mỗi đơn hàng trao đi là cả sự kỳ vọng của chủ shop:
⚡ Tốc độ giao nhanh chuẩn xác: Rút ngắn tối đa thời gian chờ đợi, khách vừa đặt là hàng đã sẵn sàng giao.
🛡️ Đóng gói & Vận chuyển an toàn: Hàng hóa được nâng niu, chống va đập, bảo hiểm trách nhiệm minh bạch.
💰 Đối soát tiền COD thần tốc: Dòng tiền về tài khoản nhanh gọn, giúp bạn an tâm xoay vòng vốn kinh doanh.
🛵 Đội ngũ shipper chuyên nghiệp: Lịch sự, niềm nở, gọi trước khi giao, tạo ấn tượng đẹp nhất với khách hàng của bạn.

👉 Đừng để khâu vận chuyển cản trở sự bứt phá doanh thu của shop!`,
      callToAction: `📩 Nhắn tin ngay cho ${brandName} hoặc để lại comment bên dưới để nhận ngay Bảng giá cước ưu đãi độc quyền dành riêng cho Shop trong tháng này!`,
      hashtags: `#${brandName.replace(/\s+/g, '')} #GiaoHangNhanh #ShipCOD #VanChuyenUyTin #ToiUuDoanhThuShop #ShipHoaToc`,
      designBrief: {
        aspectRatio: '4:5 (Dọc chuẩn Facebook)',
        headlineOnImage: 'GIAO HÀNG TỐC ĐỘ - AN TÂM ĐỐI SOÁT',
        subTextOnImage: `Đồng hành cùng hàng ngàn shop online cùng ${brandName}`,
        visualConcept: `Hình ảnh shipper ${brandName} trang phục gọn gàng, nụ cười rạng rỡ trao gói hàng vuông vức, sạch sẽ cho khách hàng tại cửa nhà. Phía sau là background thành phố năng động với tone màu chủ đạo ${brand?.colors?.primary || '#1E293B'} và điểm nhấn ${brand?.colors?.secondary || '#3B82F6'}. Kèm huy hiệu cam kết 'Giao đúng hẹn - COD 24h'.`,
        moodAndTone: 'Chuyên nghiệp, tin cậy, tốc độ và tràn đầy năng lượng tích cực.'
      }
    };
  }

  return {
    hook: `💡 Có một sự thật: Chất lượng sản phẩm có thể giữ chân khách hàng, nhưng trải nghiệm dịch vụ mới là thứ khiến họ muốn quay lại nhiều lần hơn!`,
    caption: `Chào bạn, nếu bạn đang tìm kiếm một giải pháp thực sự tử tế và chỉn chu cho nhu cầu ${industry.toLowerCase() || 'của mình'}, thì bài viết này dành riêng cho bạn.

Tại ${brandName}, chúng tôi luôn đặt trải nghiệm của bạn lên hàng đầu:
✨ Chuẩn mực trong từng chi tiết: Từ khâu tư vấn đến lúc hoàn thiện, mọi thứ đều được chăm chút kỹ lưỡng.
✨ Minh bạch và tận tâm: Không có chi phí ẩn, không có lời hứa suông – tất cả đều là cam kết rõ ràng.
✨ Đồng hành dài lâu: Lắng nghe và cải tiến liên tục dựa trên chính phản hồi thực tế của bạn.

Dù bạn đang ở đâu, ${brandName} luôn sẵn sàng mang đến cho bạn trải nghiệm trọn vẹn nhất.`,
    callToAction: `👉 Để lại lời nhắn hoặc liên hệ trực tiếp với chúng tôi ngay hôm nay để nhận tư vấn chi tiết nhất nhé!`,
    hashtags: `#${brandName.replace(/\s+/g, '')} #${industry.replace(/\s+/g, '')} #ChatLuongDauTien #DichVuTanTam`,
    designBrief: {
      aspectRatio: '4:5 (Dọc chuẩn Facebook)',
      headlineOnImage: cleanTitle.toUpperCase().slice(0, 40),
      subTextOnImage: `Trải nghiệm khác biệt cùng ${brandName}`,
      visualConcept: `Bố cục tối giản hiện đại, sản phẩm/dịch vụ đặt ở trung tâm với ánh sáng tự nhiên. Sử dụng tone màu chủ đạo ${brand?.colors?.primary || '#1E293B'} kết hợp khoảng thở thoáng đãng.`,
      moodAndTone: 'Sang trọng, tin cậy, chỉn chu và tinh tế.'
    }
  };
}

// Fallback pricing and terms generator
function generatePricingFallback(serviceTitle: string, type: string, tierName?: string) {
  const lower = (serviceTitle || '').toLowerCase();
  const isLogo = lower.includes('logo') || lower.includes('thương hiệu') || lower.includes('brand');
  const isPackaging = lower.includes('bao bì') || lower.includes('hộp') || lower.includes('tem') || lower.includes('label');
  const isSocial = lower.includes('social') || lower.includes('post') || lower.includes('facebook') || lower.includes('banner');
  const isWeb = lower.includes('web') || lower.includes('app') || lower.includes('ui');

  let features = [
    { text: 'Số phương án phác thảo ý tưởng: 3 Option độc quyền', included: true },
    { text: 'Số vòng chỉnh sửa hoàn thiện: 5 lần theo góp ý', included: true },
    { text: 'Thời gian hoàn thành bàn giao: 3 - 5 ngày làm việc', included: true },
    { text: 'Bàn giao trọn bộ file thiết kế gốc (AI, EPS, PDF, PNG)', included: true },
    { text: 'Quy chuẩn hệ màu in ấn CMYK và hiển thị kỹ thuật số RGB', included: true },
    { text: 'Phối cảnh 3D Mockup thực tế trực quan sinh động', included: true },
    { text: 'Cẩm nang hướng dẫn sử dụng font chữ và mã màu', included: isLogo || isPackaging },
    { text: 'Hỗ trợ kết nối và kiểm tra file trực tiếp với nhà in', included: isPackaging },
  ];

  if (isSocial) {
    features = [
      { text: 'Định dạng chuẩn tỉ lệ Facebook, Instagram, TikTok (1:1, 4:5, 9:16)', included: true },
      { text: 'Lên ý tưởng visual & bố cục theo chiến dịch truyền thông', included: true },
      { text: 'Số lần chỉnh sửa: 3 lần / ấn phẩm', included: true },
      { text: 'Bàn giao ảnh chất lượng cao PNG / JPEG tối ưu dung lượng web', included: true },
      { text: 'Bàn giao file nguồn Photoshop / Illustrator / Canva', included: true },
      { text: 'Hỗ trợ viết headline & copywriting ngắn cho banner', included: true },
    ];
  } else if (isPackaging) {
    features = [
      { text: 'Bản vẽ kỹ thuật trải phẳng chuẩn kích thước khuôn bế dao bế', included: true },
      { text: 'Số phương án concept mặt chính: 3 concept', included: true },
      { text: 'Số vòng chỉnh sửa: 6 lần', included: true },
      { text: 'Quy chuẩn barcode / QR code / thành phần dinh dưỡng chuẩn pháp lý', included: true },
      { text: 'Phối cảnh 3D bao bì chân thực đa góc nhìn', included: true },
      { text: 'Bàn giao file Vector AI xuất out nét, bù xén (Bleed) chuẩn in công nghiệp', included: true },
      { text: 'Hỗ trợ kiểm tra mẫu in proof trực tiếp tại xưởng in', included: true },
    ];
  }

  const terms = [
    {
      title: 'Tạm ứng & Thanh toán',
      content: 'Khách hàng đặt cọc 50% chi phí khi chốt phương án hợp tác, 50% còn lại thanh toán sau khi nghiệm thu và trước khi nhận bàn giao toàn bộ file gốc.',
    },
    {
      title: 'Quy định chỉnh sửa & Phát sinh',
      content: 'Chỉnh sửa theo số vòng cam kết của gói dựa trên concept đã chọn. Đổi toàn bộ ý tưởng sang hướng hoàn toàn mới sẽ tính thêm 30% chi phí.',
    },
    {
      title: 'Bản quyền & Bàn giao file',
      content: 'Khách hàng sở hữu 100% bản quyền thương mại phương án duyệt cuối cùng. Bàn giao đầy đủ file gốc vector và bộ font chữ tương ứng.',
    },
    {
      title: 'Tiến độ & Phản hồi',
      content: 'Tiến độ tính theo ngày làm việc (không tính CN/Lễ). Khách hàng phối hợp phản hồi duyệt trong vòng 24h - 48h để đảm bảo tiến độ bàn giao.',
    },
    {
      title: 'Cam kết bảo mật & Bảo hành file',
      content: 'Hủ Design cam kết bảo mật toàn bộ thông tin dự án chưa công bố của quý khách và lưu trữ bản sao lưu file gốc trong 12 tháng.',
    },
  ];

  return {
    summary: `Đề xuất tiêu chuẩn thiết kế chuyên nghiệp cho ${serviceTitle}, phân bổ quyền lợi tối ưu và quy định rõ ràng trách nhiệm hai bên.`,
    suggestedFeatures: features,
    suggestedTerms: terms,
    suggestedTiers: [
      {
        name: 'GÓI CƠ BẢN (STARTER)',
        price: isSocial ? '1.500.000 VNĐ' : '1.200.000 VNĐ',
        subtitle: 'Khởi đầu tiết kiệm cho shop mới',
        colorTheme: 'green',
        iconName: 'zap',
        buttonText: 'CHỌN GÓI NÀY',
        features: features.slice(0, 4),
      },
      {
        name: 'GÓI TIÊU CHUẨN (PRO)',
        price: isSocial ? '3.500.000 VNĐ' : '2.800.000 VNĐ',
        subtitle: 'Gói hoàn chỉnh được 80% khách hàng tin chọn',
        colorTheme: 'purple',
        iconName: 'shield',
        isPopular: true,
        popularBadgeText: 'KHUYÊN DÙNG',
        buttonText: 'CHỌN GÓI NÀY',
        features: features.slice(0, 6),
      },
      {
        name: 'GÓI TOÀN DIỆN (VIP)',
        price: isSocial ? '6.000.000 VNĐ' : '5.500.000 VNĐ',
        subtitle: 'Đầu tư bài bản cho doanh nghiệp phát triển bứt phá',
        colorTheme: 'orange',
        iconName: 'crown',
        buttonText: 'CHỌN GÓI NÀY',
        features: features.map(f => ({ ...f, included: true })),
      }
    ],
  };
}

// Fallback script builder with high-fidelity studio script patterns
function generateCreativeFallbackScript(idea: string, platform: string, tone?: string) {
  const isTikTok = platform === 'tiktok';
  return {
    title: isTikTok 
      ? `Bí mật thiết kế đằng sau: ${idea.slice(0, 40)}`
      : `Hủ Design Workshop: Hướng dẫn chuyên sâu về ${idea.slice(0, 45)}`,
    hook: isTikTok
      ? `90% Designer mới đều mắc lỗi này khi làm "${idea.slice(0, 30)}"! Xem ngay để không bị khách hàng từ chối bản vẽ!`
      : `Chào mừng bạn đến với Hủ Design! Hôm nay chúng ta sẽ giải quyết triệt để bài toán: "${idea.slice(0, 50)}".`,
    hookVisual: isTikTok
      ? 'Quay cận cảnh gương mặt thể hiện sự ngạc nhiên, cắt nhanh sang màn hình thiết kế bị lỗi màu gạch đỏ (SFX: Whoosh + Glitch).'
      : 'Góc máy chính quay góc làm việc studio Hủ Design, kèm text motion tiêu đề bài giảng và logo Hủ Design màu cyan phát sáng.',
    body: [
      {
        segment: 'Phần 1: Thực trạng & Sai lầm phổ biến',
        visual: 'Show bản thiết kế nháp hoặc mockup chưa chuẩn tỉ lệ / sai hệ màu RGB/CMYK.',
        audio: `Khi bắt tay vào làm "${idea.slice(0, 30)}", nhiều bạn thường chọn bừa font chữ hoặc không phân cấp thị giác (visual hierarchy) rõ ràng...`,
        duration: isTikTok ? '10s' : '1m30s',
      },
      {
        segment: 'Phần 2: Phương pháp xử lý chuẩn Hủ Design Studio',
        visual: 'Screen recording thao tác nhanh trên Adobe Illustrator / Photoshop / Figma với phím tắt mượt mà.',
        audio: 'Bí quyết là áp dụng quy tắc 60-30-10 cho màu sắc, kết hợp lưới grid 8pt để căn chỉnh toàn bộ icon và typography cân đối tuyệt đối.',
        duration: isTikTok ? '20s' : '3m00s',
      },
      {
        segment: 'Phần 3: Kết quả thực tế & Ứng dụng',
        visual: 'Show mockup 3D hoàn chỉnh xoay 360 độ (bao bì, ấn phẩm nhận diện hoặc giao diện app hoàn hảo).',
        audio: 'Và đây là kết quả sau khi tối ưu! Khách hàng duyệt ngay ở lần present đầu tiên mà không cần chỉnh sửa quá nhiều vòng.',
        duration: isTikTok ? '15s' : '2m00s',
      },
    ],
    callToAction: isTikTok
      ? 'Thả tim và follow kênh Hủ Design để bỏ túi thêm 1001 bí kíp thiết kế thực chiến mỗi ngày nhé!'
      : 'Nếu thấy hữu ích, đừng quên nhấn Like, Đăng ký kênh Hủ Design và để lại bình luận chủ đề tiếp theo bạn muốn team phân tích nhé!',
    ctaVisual: 'Animation nút Subscribe/Follow kèm logo Hủ Design và link nhận bộ kit tài nguyên miễn phí.',
    suggestedHashtags: isTikTok
      ? ['#HuDesign', '#GraphicDesignTips', '#HocThietKe', '#FigmaTutorial', '#BrandingDesign']
      : ['#HuDesign', '#DesignTutorial', '#KienThucThietKe', '#BrandingIdentity', '#CreativeAgency'],
    productionNotes: isTikTok
      ? 'Nhạc nền Lofi Hip-hop nhẹ nhàng hoặc beat phonk năng động; text phụ đề dạng typography bật từng từ màu vàng/cyan.'
      : 'Âm thanh thu micro studio trong trẻo, BGM Ambient Chill âm lượng 15%, chuyển cảnh mượt bằng Zoom In/Out nhẹ.',
  };
}

// Cloud SQL Database Entity Sync Endpoints
app.get('/api/db/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const { getCollectionEntities } = await import('./src/db/entities.ts');
    const items = await getCollectionEntities(collection);
    res.json({ success: true, items });
  } catch (error: any) {
    console.error(`Error getting collection ${req.params.collection}:`, error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi đọc dữ liệu từ SQL' });
  }
});

app.post('/api/db/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const { id, data } = req.body;
    if (!id || !data) {
      return res.status(400).json({ success: false, error: 'Thiếu id hoặc data' });
    }
    const { upsertEntity } = await import('./src/db/entities.ts');
    await upsertEntity(collection, id, data);
    res.json({ success: true, id });
  } catch (error: any) {
    console.error(`Error saving to collection ${req.params.collection}:`, error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi ghi dữ liệu vào SQL' });
  }
});

app.delete('/api/db/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const { deleteEntity } = await import('./src/db/entities.ts');
    await deleteEntity(collection, id);
    res.json({ success: true, id });
  } catch (error: any) {
    console.error(`Error deleting from collection ${req.params.collection}:`, error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi xoá dữ liệu từ SQL' });
  }
});

async function startServer() {
  // Setup Vite middleware in dev or serve static in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hủ Design Studio Server running at http://localhost:${PORT}`);
  });
}

startServer();
