// server/brandStrategicPlanner.ts
import { GoogleGenAI } from '@google/genai';

const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

export async function generateContentWithResilience(
  ai: GoogleGenAI,
  prompt: string,
  config?: any
): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: config || {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });
      if (response && response.text) {
        return { text: response.text, modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`[Gemini Resilience] Model ${model} gặp lỗi: ${errMsg.slice(0, 120)} -> Tự động chuyển model dự phòng tiếp theo...`);
    }
  }
  throw lastError || new Error('Tất cả các mô hình Gemini hiện đang tạm thời bận.');
}

interface BrandStrategyResult {
  targetAudience: string;
  customerPainPoints: string[];
  coreUSP: string;
  buyingObjections: string[];
  brandVoiceKeywords: string[];
  strategicContentAngles: string[];
  contentPillarsAllocation: { pillar: string; percent: number; objective: string }[];
}

interface GenerateWeeklyPlanParams {
  brand: any;
  postCount: number;
  weekFocus: string; // 'balanced' | 'sales' | 'trust' | 'viral' | 'education'
  customWeeklyNote?: string;
  startDate: string;
  weekNumber: number;
}

function getVietnameseDayOfWeek(dateStr: string): string {
  if (!dateStr) return 'Thứ 2';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return 'Thứ 2';
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month - 1, day);
  const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return days[date.getDay()];
}

// Phân tích ngành nghề chuyên sâu cho Fallback engine thực chiến
function getIndustryDeepKnowledge(brandName: string, industry: string, desc: string, brand?: any) {
  const text = `${brandName} ${industry} ${desc}`.toLowerCase();
  
  // 1. Dịch vụ vận chuyển, shipper, giao nhận, bưu cục (ví dụ: Citiship)
  if (text.includes('ship') || text.includes('vận chuyển') || text.includes('giao hàng') || text.includes('logistics') || text.includes('giao vận') || text.includes('bưu cục')) {
    return {
      category: 'logistics',
      targetAudience: 'Chủ shop online (thời trang, ăn uống, mỹ phẩm, đồ gia dụng) cần giao hàng nội thành/liên tỉnh tức thì; Dân văn phòng và người tiêu dùng mua hàng online cần nhận hàng nguyên vẹn, đúng hẹn.',
      customerPainPoints: [
        'Khách giục đơn nhưng shipper ngâm hàng, nhận đơn chậm hoặc hủy đơn vô cớ.',
        'Hàng hóa dễ vỡ, đồ ăn nóng bị đổ tràn, móp méo hộp khiến khách trả hàng / đánh giá 1 sao.',
        'Chi phí ship thất thường, bị phụ thu giờ cao điểm hoặc thời tiết mưa gió vô lý.',
        'Tiền thu hộ COD bị giữ vốn lâu, đối soát lằng nhằng ảnh hưởng dòng tiền xoay vòng của shop.',
        'Thái độ shipper cộc cằn với khách nhận, làm mất uy tín và thiện cảm của shop.',
      ],
      coreUSP: `${brandName} cam kết tốc độ giao chuẩn xác, đền bù 100% nếu bể vỡ/đổ tràn, cước phí minh bạch không tăng giá giờ cao điểm, và đối soát tiền COD nhanh gọn 24h.`,
      buyingObjections: [
        'Sợ cước phí cao hơn các app công nghệ lớn.',
        'Lo lắng hàng giao chậm trễ vào giờ tan tầm hoặc khi trời mưa gió.',
        'E ngại việc khiếu nại bồi thường nếu hàng bị thất lạc hoặc hư hỏng.',
        'Chưa tin tưởng sự bảo mật và thời gian chuyển khoản tiền COD.',
      ],
      brandVoiceKeywords: ['Nhanh chóng', 'Tận tâm', 'Minh bạch', 'Đúng hẹn', 'Bác tài thân thiện', 'Đồng hành cùng chủ shop'],
      strategicContentAngles: [
        'Bóc trần bài toán chi phí giao hàng: Bí quyết giúp shop giảm 30% tỷ lệ hủy đơn',
        'Câu chuyện shipper mùa mưa: Hành trình bảo bọc kiện hàng khô ráo đến tận tay khách',
        'Case study thực tế: Giải cứu 50 đơn hỏa tốc giờ cao điểm cho shop bánh kem',
        'So sánh trực quan: Đóng gói chuẩn 3 lớp chống va đập vs. đóng ẩu hậu quả ra sao',
        'Góc hậu trường đối soát COD: Dòng tiền về tài khoản chủ shop sau 24h minh bạch thế nào',
        'Vinh danh bác tài: Nụ cười và sự nhiệt tình ghi điểm tuyệt đối trong mắt người nhận',
      ],
      contentPillarsAllocation: [
        { pillar: 'Bán hàng / Khuyến mãi', percent: 35, objective: 'Tung gói cước ưu đãi cho shop mới, kích hoạt đăng ký dùng thử dịch vụ' },
        { pillar: 'Feedback & Khách hàng', percent: 25, objective: 'Chia sẻ đánh giá thật từ chủ shop & hình ảnh giao hàng an toàn củng cố niềm tin' },
        { pillar: 'Chia sẻ kiến thức & Tips', percent: 25, objective: 'Mẹo đóng gói hàng hóa, cẩm nang tối ưu chi phí vận hành cho người kinh doanh' },
        { pillar: 'Tương tác & Minigame', percent: 15, objective: 'Thảo luận các tình huống oái oăm khi ship hàng, minigame tặng mã freeship' },
      ],
      weeklyThemes: [
        {
          day: 'Thứ 2',
          time: '08:00',
          pillar: 'Bán hàng / Khuyến mãi',
          postType: 'Single Post (1 ảnh)',
          title: 'Khởi động tuần lễ bán hàng: Gói trợ giá cước đồng giá cho 100 đơn đầu tuần',
          hook: 'Khách vừa chốt đơn là có shipper nhận ngay sau 5 phút – Đừng để tỷ lệ hủy đơn đầu tuần làm bạn đau đầu!',
          strategicIntent: 'Kích thích các chủ shop lên đơn ngay sáng Thứ 2, xử lý nỗi sợ không có người nhận đơn giờ cao điểm.',
          targetAngle: 'Giải quyết bài toán tồn đơn đầu tuần với ưu đãi trải nghiệm dịch vụ.',
          caption: `Sáng Thứ Hai mở mắt ra thấy thông báo nổ đơn ầm ầm là niềm vui lớn nhất của chủ shop! 🎉\n\nThế nhưng, điều làm các shop "tụt mood" nhất chính là:\n❌ Bấm tìm tài xế mỏi tay nhưng không ai nhận đơn.\n❌ Shipper hẹn 30 phút nhưng 2 tiếng sau mới tới lấy.\n❌ Khách giục liên tục, dọa hủy đơn vì chờ quá lâu.\n\nThấu hiểu nỗi lo đó, ${brandName} triển khai chương trình ĐỒNG HÀNH ĐẦU TUẦN:\n⚡ Bác tài có mặt lấy hàng chỉ sau 5 - 10 phút.\n⚡ Cam kết giao đúng hẹn, bảo quản kiện hàng nguyên vẹn 100%.\n⚡ Tặng ngay voucher giảm 20.000đ cho mọi đơn hàng tạo trước 12h trưa hôm nay!\n\n👉 Đừng để rào cản vận chuyển làm lỡ nhịp kinh doanh của bạn. Nhắn tin cho ${brandName} ngay để đặt đơn hỏa tốc!`,
          cta: 'Inbox Fanpage hoặc gọi Hotline ngay để nhận mã ưu đãi độc quyền hôm nay!',
          headlineOnImage: 'GIAO TỐC ĐỘ • KHÁCH KHÔNG ĐỢI',
          subText: `${brandName} - Trợ giá đầu tuần cho Shop Online`,
          visual: `Ảnh thiết kế đồ họa phong cách ${brand.designStyle || 'hiện đại năng động'}. Màu chủ đạo ${brand.colors?.primary || '#E11D48'}. Hình ảnh shipper chuyên nghiệp cầm kiện hàng đóng gói chỉn chu, nụ cười tươi, đồng hồ bấm giờ 15 phút rực sáng biểu thị tốc độ.`,
        },
        {
          day: 'Thứ 4',
          time: '11:30',
          pillar: 'Chia sẻ kiến thức & Tips',
          postType: 'Album Carousel (4-6 ảnh)',
          title: '3 mẹo đóng gói thực chiến giúp giảm 99% rủi ro bể vỡ hàng hóa khi vận chuyển',
          hook: 'Đừng để một vết nứt nhỏ trên kiện hàng cướp mất khách hàng thân thiết của bạn!',
          strategicIntent: 'Định vị thương hiệu là chuyên gia am hiểu nghề giao nhận, chia sẻ giá trị thực giúp chủ shop tiết kiệm chi phí rủi ro.',
          targetAngle: 'Cẩm nang hướng dẫn thực tế kèm hình ảnh minh họa trực quan.',
          caption: `Có bao giờ bạn rơi vào tình cảnh này chưa:\n📦 Hàng gửi đi nguyên vẹn, nhưng tới tay khách thì hộp bẹp dúm, chai lọ rỉ nước, khách chụp ảnh phản hồi đòi hoàn tiền ngay lập tức?\n\nLà đơn vị vận chuyển đồng hành cùng hàng nghìn chủ shop mỗi ngày, ${brandName} xin chia sẻ 3 nguyên tắc vàng trong đóng gói:\n\n1️⃣ NGUYÊN TẮC "KHOẢNG THỞ CHỐNG SỐC": Luôn bọc tối thiểu 3-4 lớp xốp bóng khí (bubble wrap) và chèn chặt giấy vụn/xốp hạt vào khoảng trống trong thùng carton.\n2️⃣ DÁN BĂNG KEO CHỮ H: Gia cố đáy thùng và nắp thùng theo hình chữ H thay vì chỉ dán một đường thẳng giữa.\n3️⃣ DÁN NHÃN "HÀNG DỄ VỠ - XIN NHẸ TAY": Giúp bác tài nhận biết ngay để ưu tiên xếp ở vị trí an toàn nhất trên thùng xe.\n\n📌 Lưu lại bài viết này ngay để hướng dẫn nhân viên kho đóng gói chuẩn chỉnh nhé!`,
          cta: 'Shop bạn thường gặp khó khăn nhất khi đóng gói mặt hàng nào? Bình luận để đội ngũ tư vấn giải pháp nhé!',
          headlineOnImage: '3 BÍ QUYẾT ĐÓNG GÓI CHUẨN XỊN',
          subText: 'Hạn chế 99% bể vỡ & khiếu nại',
          visual: `Bố cục Album 4 ảnh chuẩn Facebook: Ảnh bìa dạng infographic nổi bật thùng hàng bọc xốp cẩn thận với biểu tượng tick xanh an toàn; 3 ảnh tiếp theo minh họa từng bước đóng gói với font chữ ${brand.fonts?.headingFont || 'Montserrat'} sắc nét, dễ đọc trên điện thoại.`,
        },
        {
          day: 'Thứ 6',
          time: '19:30',
          pillar: 'Feedback & Khách hàng',
          postType: 'Single Post (1 ảnh)',
          title: 'Chuyện thật tuần qua: Bác tài giải cứu đơn hàng sinh nhật kịp trước giờ thổi nến',
          hook: '"18h30 tiệc bắt đầu mà 18h bánh kem mới làm xong, em tưởng phen này đền khách tiền triệu rồi..."',
          strategicIntent: 'Xây dựng Social Proof bằng câu chuyện có thật đầy cảm xúc, thể hiện sự tận tâm và trách nhiệm của đội ngũ shipper.',
          targetAngle: 'Storytelling chân thực chạm tới sự đồng cảm của những người kinh doanh đồ ăn / quà tặng.',
          caption: `Đó là tin nhắn thở phào nhẹ nhõm của chị Mai - chủ một tiệm bánh ngọt tại trung tâm thành phố gửi về cho tổng đài ${brandName} tối Thứ Tư vừa rồi. 🎂\n\nChiếc bánh kem 3 tầng đặt riêng cho một tiệc sinh nhật quan trọng, đường thì kẹt cứng giờ tan tầm trời lại lất phất mưa. Bác tài Tuấn của ${brandName} khi nhận đơn đã cẩn thận:\n🛵 Cố định thùng giữ nhiệt chống rung lắc tuyệt đối.\n🛵 Chạy chậm rãi, chọn các cung đường bằng phẳng để kem không bị xô lệch.\n🛵 Giao đến tận sảnh tiệc lúc 18h20, chiếc bánh vẫn nguyên vẹn từng đường vân hoa kem lộng lẫy.\n\nVới ${brandName}, mỗi kiện hàng không chỉ là một món đồ, mà là niềm tin và uy tín của bạn gửi gắm nơi khách hàng. Tụi mình luôn trân trọng điều đó trên từng mét đường lăn bánh! ❤️`,
          cta: 'Bạn cần một dịch vụ giao hàng chu đáo như người nhà? Nhắn tin cho tụi mình để trải nghiệm ngay hôm nay!',
          headlineOnImage: 'GIỮ TRỌN NIỀM TIN TRÊN TỪNG CHUYẾN XE',
          subText: 'Real Story từ khách hàng của Citiship',
          visual: `Phối cảnh ấm áp, chụp cận cảnh shipper cẩn thận bàn giao chiếc hộp bánh kem thắt nơ xinh xắn cho khách hàng. Ánh đèn vàng buổi tối lấp lánh, logo ${brandName} nổi bật trên áo đồng phục, tone màu chủ đạo ấm áp và đáng tin cậy.`,
        },
        {
          day: 'Chủ Nhật',
          time: '15:00',
          pillar: 'Tương tác & Minigame',
          postType: 'Meme / Trích dẫn',
          title: 'Cuối tuần giải trí: Bắt bài những câu "thần chú" quen thuộc nhất của các shop khi gọi ship',
          hook: 'Nói thật đi, bạn đã từng dùng câu nào trong số những câu dưới đây chưa? 😂',
          strategicIntent: 'Tạo nội dung viral hóm hỉnh, kéo tương tác tự nhiên, xóa bỏ khoảng cách giữa thương hiệu và khách hàng.',
          targetAngle: 'Meme hài hước phản ánh chân thực văn hóa giao hàng.',
          caption: `Chủ Nhật xả hơi một chút cùng ${brandName} nha cả nhà! ☕\n\nTop 4 câu nói kinh điển mà bác tài nhà mình nghe được nhiều nhất trong ngày:\n1️⃣ "Anh ơi đơn này khách hối cháy máy, anh đạp lẹ giùm em nha!" (Đến nơi thấy khách hẹn... 2 tiếng nữa mới về).\n2️⃣ "Hàng này nhẹ hều à anh ơi!" (Ra tới nơi là bao cát 20kg).\n3️⃣ "Khách bảo tới nơi nháy máy 3 hồi là khách xuống liền!" (Đứng đợi 25 phút dưới nắng).\n4️⃣ "Em tip thêm 10k nếu giao kịp 12h trưa!" (Động lực lớn nhất vũ trụ).\n\nNghề ship vui buồn lẫn lộn, nhưng nhờ có sự thấu hiểu và nụ cười của quý khách mà các bác tài luôn sẵn sàng vượt mưa nắng!\n\n👇 Comment câu nói "bá đạo" nhất bạn từng nói với shipper để nhận ngay 1 mã freeship cuối tuần nhé!`,
          cta: 'Thả comment bên dưới, 5 bạn tương tác vui nhất sẽ được tặng mã freeship vào sáng mai!',
          headlineOnImage: 'NHỮNG CÂU NÓI BẤT HỦ KHI GỌI SHIPPER',
          subText: 'Góc xả stress cuối tuần',
          visual: `Bố cục dạng Meme comic 4 ô hài hước, nét vẽ sinh động hiện đại. Biểu cảm hóm hỉnh của bác tài và chủ shop. Màu sắc tươi sáng, bắt mắt trên newsfeed.`,
        },
      ],
    };
  }

  // 2. F&B Cà phê, Trà, Quán ăn
  if (text.includes('coffee') || text.includes('cà phê') || text.includes('tea') || text.includes('trà') || text.includes('f&b') || text.includes('quán') || text.includes('bánh')) {
    return {
      category: 'fnb',
      targetAudience: 'Giới trẻ, dân văn phòng và người sành ẩm thực tìm kiếm không gian làm việc truyền cảm hứng, đồ uống chất lượng thủ công và những phút giây thư giãn.',
      customerPainPoints: [
        'Cà phê công nghiệp vị gắt, nhiều hương liệu nhân tạo gây say hoặc khó chịu dạ dày.',
        'Quán quá ồn ào hoặc bàn ghế không thoải mái cho việc làm việc, đọc sách.',
        'Đồ uống giá cao nhưng chất lượng không tương xứng, nhân viên phục vụ thờ ơ.',
      ],
      coreUSP: `${brandName} mang đến trải nghiệm đồ uống thủ công nguyên bản, nguyên liệu tuyển chọn khắt khe, không gian ấm cúng và sự phục vụ tận tâm như người nhà.`,
      buyingObjections: [
        'Sợ vị cà phê Specialty hoặc trà thủ công kén người uống.',
        'Lo quán đông đúc không có chỗ ngồi thoải mái.',
        'Mức giá có thể cao hơn các quán bình dân thông thường.',
      ],
      brandVoiceKeywords: ['Ấm áp', 'Mộc mạc', 'Chân thành', 'Tinh tế', 'Sâu lắng', 'Chăm chút từng mẻ rang'],
      strategicContentAngles: [
        'Hành trình từ nông trại đến tách cà phê: Vì sao hạt rang mộc lại ngọt hậu tự nhiên?',
        'Góc bình yên giữa phố thị: Không gian tĩnh lặng cho những ai cần tập trung sáng tạo',
        'Cẩm nang chọn đồ uống theo tâm trạng: Hôm nay bạn cần nạp năng lượng hay một nốt trầm?',
        'Behind the scene: Quy trình ủ lạnh Cold Brew 18 tiếng giữ trọn tầng hương trái cây',
      ],
      contentPillarsAllocation: [
        { pillar: 'Câu chuyện thương hiệu', percent: 30, objective: 'Chia sẻ niềm đam mê nguyên liệu thủ công và văn hóa thưởng thức' },
        { pillar: 'Chia sẻ kiến thức & Tips', percent: 30, objective: 'Giáo dục gu thưởng thức, phân biệt cà phê sạch/rang mộc' },
        { pillar: 'Bán hàng / Khuyến mãi', percent: 25, objective: 'Combo đồ uống + bánh ngọt, ưu đãi cho khách đi theo nhóm' },
        { pillar: 'Tương tác & Minigame', percent: 15, objective: 'Bình luận chọn vị signature yêu thích, nhận quà trải nghiệm' },
      ],
      weeklyThemes: [],
    };
  }

  // 3. Nghệ thuật, Gốm sứ, Thủ công mỹ nghệ
  if (text.includes('gốm') || text.includes('ceramic') || text.includes('thủ công') || text.includes('art') || text.includes('nghệ thuật') || text.includes('decor')) {
    return {
      category: 'craft_art',
      targetAudience: 'Những người yêu nghệ thuật sống chậm, người sành trà, kiến trúc sư, chủ homestay và người tìm kiếm quà tặng độc bản mang linh hồn thủ công.',
      customerPainPoints: [
        'Đồ gốm công nghiệp trên thị trường sản xuất hàng loạt, tráng men hóa chất, thiếu chiều sâu thẩm mỹ.',
        'Lo lắng sản phẩm thủ công dễ sứt mẻ men, khó vệ sinh hoặc không an toàn khi đựng đồ ăn nóng.',
        'Khó tìm được món quà tặng vừa sang trọng, vừa hàm chứa câu chuyện văn hóa sâu sắc.',
      ],
      coreUSP: `${brandName} chế tác từng tác phẩm gốm mộc độc bản hoàn toàn bằng tay, nung củi truyền thống với men tro tự nhiên, mỗi sản phẩm là một câu chuyện độc nhất.`,
      buyingObjections: [
        'Giá thành cao hơn đồ sứ công nghiệp.',
        'Sợ nứt vỡ trong quá trình vận chuyển đường xa.',
        'Băn khoăn về cách bảo quản men gốm đúng cách.',
      ],
      brandVoiceKeywords: ['Tĩnh lặng', 'Độc bản', 'Vết rạn thời gian', 'Hồn đất', 'An yên', 'Trân trọng tự nhiên'],
      strategicContentAngles: [
        'Vết hỏa biến ngẫu hứng từ ngọn lửa lò nung: Khi sự bất toàn tạo nên vẻ đẹp độc bản',
        '3 bước dưỡng ấm chén gốm mộc để hương trà ngày càng đậm đà theo năm tháng',
        'Hậu trường vuốt gốm: 10 ngày nhào đất nặn hình trước khi có được một tác phẩm hoàn chỉnh',
        'Gợi ý set quà tặng phong thủy tinh tế dành cho đối tác và người trân quý',
      ],
      contentPillarsAllocation: [
        { pillar: 'Câu chuyện thương hiệu', percent: 35, objective: 'Kể về triết lý chế tác và cái tâm của nghệ nhân gốm' },
        { pillar: 'Chia sẻ kiến thức & Tips', percent: 25, objective: 'Hướng dẫn chơi gốm, dưỡng ấm tử sa, phân biệt men tự nhiên' },
        { pillar: 'Bán hàng / Khuyến mãi', percent: 25, objective: 'Giới thiệu các bộ sưu tập giới hạn, cam kết bảo hành chống nứt vỡ' },
        { pillar: 'Tương tác & Minigame', percent: 15, objective: 'Ngắm dáng gốm đoán chất men, đố vui văn hóa trà đạo' },
      ],
      weeklyThemes: [],
    };
  }

  // 4. Mặc định ngành dịch vụ / thương mại tổng hợp
  return {
    category: 'general_business',
    targetAudience: 'Khách hàng có nhu cầu nâng cao chất lượng cuộc sống hoặc công việc kinh doanh, tìm kiếm giải pháp uy tín, minh bạch và có cam kết đồng hành lâu dài.',
    customerPainPoints: [
      'Gặp phải đơn vị thiếu uy tín, hứa hẹn nhiều nhưng khi thực hiện lại không như cam kết.',
      'Chi phí phát sinh không rõ ràng, quy trình chậm chạp mất thời gian.',
      'Dịch vụ hậu mãi và bảo hành kém chu đáo sau khi đã thanh toán xong.',
    ],
    coreUSP: `${brandName} cam kết chất lượng chuẩn mực, báo giá trọn gói minh bạch và chính sách đồng hành hỗ trợ khách hàng tận tâm trong mọi khâu.`,
    buyingObjections: [
      'Băn khoăn so sánh giá cả với các đơn vị giá rẻ trên thị trường.',
      'Chưa thấy được bằng chứng thực tế (case study) về hiệu quả dịch vụ.',
      'Lo lắng về thời gian hoàn thành có đúng tiến độ hay không.',
    ],
    brandVoiceKeywords: ['Chuyên nghiệp', 'Tận tâm', 'Minh bạch', 'Đáng tin cậy', 'Sáng tạo'],
    strategicContentAngles: [
      'Bóc tách sai lầm phổ biến khiến khách hàng mất tiền oan khi chọn dịch vụ',
      'Quy trình làm việc 4 bước tiêu chuẩn đảm bảo chất lượng đầu ra luôn vượt mong đợi',
      'Case study thực tế: Chúng tôi đã giúp khách hàng giải quyết bài toán hóc búa như thế nào',
      'Cam kết dịch vụ: Những điều khoản bảo vệ quyền lợi tối đa cho khách hàng',
    ],
    contentPillarsAllocation: [
      { pillar: 'Bán hàng / Khuyến mãi', percent: 30, objective: 'Giới thiệu giải pháp then chốt kèm chính sách ưu đãi kích hoạt' },
      { pillar: 'Chia sẻ kiến thức & Tips', percent: 30, objective: 'Cung cấp kiến thức chuyên môn giúp khách hàng đưa ra quyết định thông minh' },
      { pillar: 'Feedback & Khách hàng', percent: 25, objective: 'Đánh giá chân thực và câu chuyện thành công của khách hàng' },
      { pillar: 'Tương tác & Minigame', percent: 15, objective: 'Khảo sát nhu cầu và thảo luận chủ đề nóng trong ngành' },
    ],
    weeklyThemes: [],
  };
}

// 1. Hàm phân tích chiến lược thương hiệu chuyên sâu
export async function analyzeBrandStrategy(ai: GoogleGenAI | null, brand: any): Promise<BrandStrategyResult> {
  const brandName = brand?.name || 'Thương hiệu';
  const industry = brand?.industry || 'Dịch vụ & Bán lẻ';
  const desc = brand?.businessDescription || '';
  const tone = brand?.toneOfVoice || '';
  const dos = Array.isArray(brand?.dos) ? brand.dos.join('; ') : '';
  const donts = Array.isArray(brand?.donts) ? brand.donts.join('; ') : '';

  const deepKnowledge = getIndustryDeepKnowledge(brandName, industry, desc, brand);

  if (!ai) {
    return {
      targetAudience: deepKnowledge.targetAudience,
      customerPainPoints: deepKnowledge.customerPainPoints,
      coreUSP: deepKnowledge.coreUSP,
      buyingObjections: deepKnowledge.buyingObjections,
      brandVoiceKeywords: deepKnowledge.brandVoiceKeywords,
      strategicContentAngles: deepKnowledge.strategicContentAngles,
      contentPillarsAllocation: deepKnowledge.contentPillarsAllocation,
    };
  }

  const prompt = `Bạn là một Chuyên gia Hoạch định Chiến lược Thương hiệu & Giám đốc Nội dung (Brand Strategy & Content Director) hàng đầu tại Việt Nam.
Hãy phân tích chuyên sâu và xây dựng BẢN ĐỒ CHIẾN LƯỢC NỘI DUNG THƯƠNG HIỆU (Brand Content Strategic Map) cho thương hiệu sau:

--- DỮ LIỆU THƯƠNG HIỆU ---
- Tên thương hiệu: "${brandName}"
- Lĩnh vực / Ngành nghề: "${industry}"
- Mô tả hoạt động kinh doanh, sản phẩm/dịch vụ cốt lõi: "${desc || 'Chưa có mô tả cụ thể'}"
- Tone giọng hiện tại: "${tone || 'Chuyên nghiệp, thân thiện'}"
- Nguyên tắc Nên làm: "${dos}"
- Điều Cấm kỵ: "${donts}"

--- NGUYÊN TẮC PHÂN TÍCH CHUYÊN SÂU (BẮT BUỘC) ---
1. ĐI SÂU VÀO BẢN CHẤT NGÀNH NGHỀ & ĐỜI THỰC:
   - Tuyệt đối KHÔNG viết chung chung, lý thuyết sáo rỗng.
   - Nếu là giao hàng/shipper (như Citiship): Nêu rõ nỗi đau của chủ shop (bị hủy đơn, hàng vỡ, COD ngâm vốn, shipper cọc cằn), cước phí, thái độ phục vụ, tính hỏa tốc.
   - Nếu là F&B, gốm sứ, thời trang, nội thất, v.v.: Bám sát hành vi mua hàng thực tế và tâm lý đặc thù của ngành đó.
2. PHÂN TÍCH CHÂN DUNG KHÁCH HÀNG: Cụ thể họ là ai, làm nghề gì, hoàn cảnh sống/kinh doanh ra sao, điều gì khiến họ mất ngủ mỗi đêm liên quan đến sản phẩm/dịch vụ này.
3. NỖI ĐAU (PAIN POINTS): 4-5 vấn đề nhức nhối nhất mà đối thủ trên thị trường chưa giải quyết triệt để.
4. LỢI THẾ CẠNH TRANH ĐỘC NHẤT (USP): Lý do vì sao khách hàng PHẢI chọn "${brandName}" thay vì bất kỳ ai khác.
5. RÀO CẢN MUA HÀNG (BUYING OBJECTIONS): Những nghi ngờ, sợ hãi khiến khách hàng chần chừ chưa xuống tiền.
6. CÁC GÓC NỘI DUNG CHIẾN LƯỢC (CONTENT ANGLES): 5-7 chủ đề/góc tiếp cận thực chiến để viết bài quanh năm không bao giờ hết ý tưởng.

YÊU CẦU TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON THUẦN TÚY:
{
  "targetAudience": "Mô tả cụ thể chân dung khách hàng mục tiêu (2-3 câu sắc sảo)",
  "customerPainPoints": [
    "Nỗi đau thực tế 1 (cụ thể, nhức nhối)",
    "Nỗi đau thực tế 2",
    "Nỗi đau thực tế 3",
    "Nỗi đau thực tế 4"
  ],
  "coreUSP": "Định vị lợi thế cạnh tranh độc nhất của ${brandName} (1-2 câu súc tích, đắt giá)",
  "buyingObjections": [
    "Rào cản tâm lý 1",
    "Rào cản tâm lý 2",
    "Rào cản tâm lý 3"
  ],
  "brandVoiceKeywords": ["Từ khóa 1", "Từ khóa 2", "Từ khóa 3", "Từ khóa 4", "Từ khóa 5"],
  "strategicContentAngles": [
    "Góc tiếp cận 1: Tiêu đề gợi ý và mục tiêu",
    "Góc tiếp cận 2",
    "Góc tiếp cận 3",
    "Góc tiếp cận 4",
    "Góc tiếp cận 5"
  ],
  "contentPillarsAllocation": [
    { "pillar": "Bán hàng / Khuyến mãi", "percent": 30, "objective": "Mục tiêu cụ thể" },
    { "pillar": "Chia sẻ kiến thức & Tips", "percent": 30, "objective": "Mục tiêu cụ thể" },
    { "pillar": "Feedback & Khách hàng", "percent": 25, "objective": "Mục tiêu cụ thể" },
    { "pillar": "Tương tác & Minigame", "percent": 15, "objective": "Mục tiêu cụ thể" }
  ]
}`;

  try {
    const { text, modelUsed } = await generateContentWithResilience(ai, prompt, {
      responseMimeType: 'application/json',
      temperature: 0.7,
    });
    console.log(`[analyzeBrandStrategy] Thành công với model ${modelUsed}`);

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }
    return parsed;
  } catch (error) {
    console.warn('Gemini analyzeBrandStrategy fallback:', error);
    return {
      targetAudience: deepKnowledge.targetAudience,
      customerPainPoints: deepKnowledge.customerPainPoints,
      coreUSP: deepKnowledge.coreUSP,
      buyingObjections: deepKnowledge.buyingObjections,
      brandVoiceKeywords: deepKnowledge.brandVoiceKeywords,
      strategicContentAngles: deepKnowledge.strategicContentAngles,
      contentPillarsAllocation: deepKnowledge.contentPillarsAllocation,
    };
  }
}

// 2. Hàm sinh kế hoạch tuần chuyên sâu thực chiến
export async function generateStrategicWeeklyPlan(
  ai: GoogleGenAI | null,
  params: GenerateWeeklyPlanParams
): Promise<any[]> {
  const { brand, postCount, weekFocus, customWeeklyNote, startDate, weekNumber } = params;
  const brandName = brand?.name || 'Thương hiệu';
  const industry = brand?.industry || 'Dịch vụ & Bán lẻ';
  const desc = brand?.businessDescription || '';
  const strategy = brand?.brandStrategy;
  const designStyle = brand?.designStyle || 'Hiện đại, sắc nét, chuyên nghiệp';
  const primaryColor = brand?.colors?.primary || '#1E293B';
  const secondaryColor = brand?.colors?.secondary || '#3B82F6';
  const headingFont = brand?.fonts?.headingFont || 'Montserrat';

  const deepKnowledge = getIndustryDeepKnowledge(brandName, industry, desc, brand);

  // Phân tích định hướng tuần
  let focusInstruction = 'Chiến lược cân bằng toàn diện: Kết hợp hài hòa giữa Bán hàng, Kiến thức giá trị, Minh chứng khách hàng và Tương tác.';
  if (weekFocus === 'sales') {
    focusInstruction = 'TRỌNG TÂM TUẦN: BÁN HÀNG & CHUYỂN ĐỔI (Direct Response). Tấn công trực tiếp vào rào cản mua hàng, tung ưu đãi độc quyền, thúc đẩy khách hàng nhắn tin hoặc gọi hotline chốt đơn ngay.';
  } else if (weekFocus === 'trust') {
    focusInstruction = 'TRỌNG TÂM TUẦN: CỦNG CỐ NIỀM TIN & UY TÍN (Trust & Social Proof). Sử dụng câu chuyện khách hàng có thật, chứng minh cam kết bảo hiểm/bảo hành, hậu trường chất lượng dịch vụ.';
  } else if (weekFocus === 'viral') {
    focusInstruction = 'TRỌNG TÂM TUẦN: BỨT PHÁ TƯƠNG TÁC & THẢO LUẬN (Viral & Community Engagement). Minigame thảo luận vấn đề nóng, meme hài hước về ngành, tạo tranh luận văn minh để tăng tương tác fanpage.';
  } else if (weekFocus === 'education') {
    focusInstruction = 'TRỌNG TÂM TUẦN: GIÁO DỤC THỊ TRƯỜNG & ĐỊNH VỊ CHUYÊN GIA (Educational & Value-first). Cẩm nang hướng dẫn thực chiến, vạch trần sai lầm phổ biến, giải pháp tối ưu chi phí.';
  }

  // Lấy danh sách chủ đề chính của thương hiệu (customPillars hoặc mặc định)
  const brandPillarsList = (brand?.customPillars && Array.isArray(brand.customPillars) && brand.customPillars.length > 0)
    ? brand.customPillars.map((p: any) => `+ "${p.name}": ${p.description || ''} (Mục tiêu: ${p.targetObjective || ''})`).join('\n')
    : `+ "Chia sẻ kiến thức & Tips"\n+ "Bán hàng / Khuyến mãi"\n+ "Feedback & Khách hàng"\n+ "Tương tác & Minigame"\n+ "Câu chuyện thương hiệu"\n+ "Bắt trend / Đời thường"`;

  const prompt = `Bạn là Giám đốc Sáng tạo (Creative Director) kiêm Chuyên gia Hoạch định Nội dung Fanpage của Studio thiết kế 'Hủ Design'.
Bạn đang trực tiếp lên Kế Hoạch Nội Dung Thực Chiến Tuần ${weekNumber || 36} cho Fanpage của thương hiệu đối tác sau:

--- HỒ SƠ THƯƠNG HIỆU CHIẾN LƯỢC ---
- Tên thương hiệu: "${brandName}"
- Lĩnh vực: "${industry}"
- Sản phẩm/dịch vụ cốt lõi & Tệp khách hàng: "${desc || deepKnowledge.targetAudience}"
- Lợi thế cạnh tranh độc nhất (USP): "${strategy?.coreUSP || deepKnowledge.coreUSP}"
- Nỗi đau nhức nhối của khách: "${strategy?.customerPainPoints?.join('; ') || deepKnowledge.customerPainPoints.join('; ')}"
- Rào cản mua hàng: "${strategy?.buyingObjections?.join('; ') || deepKnowledge.buyingObjections.join('; ')}"
- Phong cách nhận diện thiết kế: "${designStyle}" (Tone màu chủ đạo: ${primaryColor}, Màu phụ: ${secondaryColor}, Font: ${headingFont})
- Tone giọng: "${brand?.toneOfVoice || 'Thân thiện, uy tín, gần gũi'}"

--- DANH SÁCH CHỦ ĐỀ CHÍNH (CONTENT TOPICS) CỦA THƯƠNG HIỆU NÀY ---
(QUAN TRỌNG: Các bài viết bạn tạo ra trong kế hoạch tuần BẮT BUỘC phải gán giá trị trường "pillar" khớp chính xác với một trong các Chủ đề chính bên dưới):
${brandPillarsList}

--- ĐỊNH HƯỚNG KẾ HOẠCH TUẦN ---
- Số lượng bài viết cần lập: ${postCount} bài trong tuần.
- Ngày bắt đầu tuần: ${startDate}
- ${focusInstruction}
${customWeeklyNote ? `- GHI CHÚ ĐẶC BIỆT CHO CHIẾN DỊCH TUẦN NÀY: "${customWeeklyNote}" (BẮT BUỘC PHẢI LỒNG GHÉP VÀO NỘI DUNG)` : ''}

--- QUY TẮC BẮT BUỘC ĐỂ BÀI VIẾT THỰC CHIẾN, CHUYÊN SÂU, KHÔNG XÀM ---
1. ĐI THẲNG VÀO BẢN CHẤT NGÀNH CỦA "${brandName}":
   - Nếu là giao hàng/vận chuyển (như Citiship): Viết về tình huống thực tế của chủ shop (đóng gói hàng dễ vỡ, giao hỏa tốc 2h, đối soát COD 24h, bảo hiểm bể vỡ, shipper thân thiện nhiệt tình, cứu đơn gấp giờ cao điểm...).
   - Nếu là F&B: Nói về hương vị, mẻ rang, nguyên liệu, trải nghiệm khách hàng, combo văn phòng.
   - Nếu là ngành khác: Dùng đúng thuật ngữ, số liệu và tình huống có thật của ngành.
2. TUYỆT ĐỐI CẤM: Không dùng câu văn sáo rỗng vô thưởng vô phạt như: "Bạn đã biết đến giải pháp tối ưu nhất...", "3 điều quan trọng bạn cần lưu ý khi lựa chọn dịch vụ...", "Ưu đãi đặc quyền dành riêng cho khách hàng trong dịp cuối tuần...".
3. MỖI BÀI VIẾT PHẢI CÓ:
   - "strategicIntent": Giải thích rõ ý đồ chiến lược (Bài này giải quyết nỗi đau nào của khách hàng, nhắm vào mục tiêu gì).
   - "targetAngle": Góc tiếp cận cụ thể (VD: Bóc trần rào cản chi phí, Case study giao hàng gấp, Cẩm nang đóng hàng, Meme cuối tuần...).
   - "title": Tiêu đề sắc sảo, đánh trúng tâm lý.
   - "hook": Câu mở đầu giật tít 3 giây khiến người dùng phải dừng lướt newsfeed.
   - "caption": Toàn văn bài đăng hoàn chỉnh, ngắt đoạn thoáng mắt bằng xuống dòng và bullet/emoji tinh tế, giàu cảm xúc và tính thuyết phục.
   - "callToAction": Kêu gọi hành động cụ thể, kích thích inbox, gọi hotline hoặc bình luận.
   - "hashtags": Bộ hashtag nhận diện và ngành hàng.
   - "designBrief": Brief thiết kế cực kỳ chi tiết cho Designer Hủ Design:
     + aspectRatio: '4:5 (Dọc chuẩn Facebook)' hoặc 'Album 4 ảnh (1 dọc 3 vuông)' hoặc '1:1 (Vuông)'.
     + headlineOnImage: Câu tiêu đề lớn đè trên ảnh ấn phẩm (dưới 8 từ, cực bắt mắt).
     + subTextOnImage: Tag phụ hoặc câu dẫn nhỏ trên ảnh.
     + visualConcept: Hướng dẫn bố cục cụ thể (nhân vật/sản phẩm nằm ở đâu, mockup gì, phối màu chủ đạo ${primaryColor}, ánh sáng ra sao).
     + moodAndTone: Tinh thần thị giác của ấn phẩm.

YÊU CẦU TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON ARRAY:
[
  {
    "dayOfWeek": "Thứ 2",
    "publishTime": "08:00",
    "pillar": "Bán hàng / Khuyến mãi",
    "postType": "Single Post (1 ảnh)",
    "strategicIntent": "Ý đồ chiến lược của bài viết",
    "targetAngle": "Góc tiếp cận cụ thể",
    "title": "Tiêu đề bài viết sắc sảo",
    "hook": "Câu mở đầu giật tít 3 giây dừng lướt newsfeed",
    "caption": "Toàn văn bài viết hoàn chỉnh, sâu sắc, thực chiến...",
    "callToAction": "Lời kêu gọi hành động cụ thể",
    "hashtags": "#${brandName.replace(/\\s+/g, '')} #HashtagNganh #HashtagChuDe",
    "designBrief": {
      "aspectRatio": "4:5 (Dọc chuẩn Facebook)",
      "headlineOnImage": "TIÊU ĐỀ LỚN TRÊN ẢNH",
      "subTextOnImage": "Dòng chữ phụ",
      "visualConcept": "Mô tả bố cục thiết kế chi tiết với màu sắc ${primaryColor}...",
      "moodAndTone": "Hiện đại, tin cậy, tràn đầy năng lượng"
    }
  }
]`;

  if (!ai) {
    return generateFallbackWeeklyPlan(deepKnowledge, postCount, brand, startDate, customWeeklyNote);
  }

  try {
    const { text, modelUsed } = await generateContentWithResilience(ai, prompt, {
      responseMimeType: 'application/json',
      temperature: 0.7,
    });
    console.log(`[generateStrategicWeeklyPlan] Thành công với model ${modelUsed}`);

    let parsed: any[] = [];
    try {
      parsed = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return generateFallbackWeeklyPlan(deepKnowledge, postCount, brand, startDate, customWeeklyNote);
    }

    // Gắn thêm id, publishDate và status
    const start = new Date(startDate);
    const dayMap: Record<string, number> = {
      'Thứ 2': 0,
      'Thứ 3': 1,
      'Thứ 4': 2,
      'Thứ 5': 3,
      'Thứ 6': 4,
      'Thứ 7': 5,
      'Chủ Nhật': 6,
    };

    return parsed.map((item, idx) => {
      const dayOffset = dayMap[item.dayOfWeek] !== undefined ? dayMap[item.dayOfWeek] : idx;
      const postDate = new Date(start);
      postDate.setDate(start.getDate() + dayOffset);
      const dateStr = postDate.toISOString().split('T')[0];

      return {
        id: `post_${Date.now()}_${idx + 1}`,
        dayOfWeek: getVietnameseDayOfWeek(dateStr),
        publishDate: dateStr,
        publishTime: item.publishTime || '08:30',
        pillar: item.pillar || 'Chia sẻ kiến thức & Tips',
        postType: item.postType || 'Single Post (1 ảnh)',
        strategicIntent: item.strategicIntent || 'Nâng cao nhận diện và giải quyết bài toán cốt lõi của khách hàng.',
        targetAngle: item.targetAngle || 'Góc tiếp cận thực tế.',
        title: item.title,
        hook: item.hook,
        caption: item.caption,
        callToAction: item.callToAction,
        hashtags: item.hashtags || `#${brandName.replace(/\s+/g, '')} #HuDesign`,
        designBrief: item.designBrief || {
          aspectRatio: '4:5 (Dọc chuẩn Facebook)',
          headlineOnImage: item.title,
          visualConcept: `Thiết kế phong cách ${designStyle}, màu sắc chủ đạo ${primaryColor}.`,
          moodAndTone: 'Chuyên nghiệp, tinh tế',
        },
        status: 'draft',
      };
    });
  } catch (error) {
    console.error('Gemini generateStrategicWeeklyPlan error:', error);
    return generateFallbackWeeklyPlan(deepKnowledge, postCount, brand, startDate, customWeeklyNote);
  }
}

function generateFallbackWeeklyPlan(deepKnowledge: any, count: number, brand: any, startDate: string, customNote?: string) {
  const brandName = brand?.name || 'Thương hiệu';
  const start = new Date(startDate);
  const primaryColor = brand?.colors?.primary || '#1E293B';
  const designStyle = brand?.designStyle || 'Hiện đại, chuyên nghiệp';

  const baseThemes = deepKnowledge.weeklyThemes && deepKnowledge.weeklyThemes.length >= count
    ? deepKnowledge.weeklyThemes.slice(0, count)
    : [
        {
          day: 'Thứ 2',
          time: '08:00',
          pillar: 'Bán hàng / Khuyến mãi',
          postType: 'Single Post (1 ảnh)',
          title: `Khởi đầu tuần mới cùng giải pháp tối ưu chi phí từ ${brandName}`,
          hook: `Bạn đã sẵn sàng bứt phá mục tiêu tuần mới mà không lo áp lực vận hành?`,
          strategicIntent: 'Kích hoạt nhu cầu sử dụng dịch vụ ngay đầu tuần với chính sách hỗ trợ khách hàng tốt nhất.',
          targetAngle: 'Giải quyết bài toán tối ưu chi phí và nâng cao hiệu suất đầu tuần.',
          caption: `Chào tuần mới tràn đầy năng lượng từ ${brandName}! ✨\n\nBước vào tuần làm việc mới, tối ưu hóa thời gian và chi phí luôn là ưu tiên hàng đầu của mọi khách hàng. Với quy trình chuẩn hóa và cam kết chất lượng đồng hành, ${brandName} luôn sẵn sàng hỗ trợ bạn chu đáo nhất.\n\n${customNote ? `📌 Điểm nhấn tuần này: ${customNote}\n\n` : ''}Đừng ngần ngại nhắn tin cho chúng mình để được hỗ trợ giải pháp phù hợp nhất nhé!`,
          cta: 'Inbox Fanpage ngay để được đội ngũ chuyên viên tư vấn chi tiết!',
          headlineOnImage: 'KHỞI ĐỘNG TUẦN MỚI THUẬN LỢI',
          subText: `${brandName} đồng hành cùng bạn`,
          visual: `Bố cục nổi bật dịch vụ trung tâm trên nền ${designStyle}, phối màu chủ đạo ${primaryColor}.`,
        },
        {
          day: 'Thứ 4',
          time: '11:30',
          pillar: 'Chia sẻ kiến thức & Tips',
          postType: 'Album Carousel (4-6 ảnh)',
          title: `Cẩm nang thực chiến: 3 tiêu chí quan trọng khi lựa chọn ${brand.industry || 'dịch vụ'}`,
          hook: `Có những sai lầm tưởng chừng nhỏ nhưng có thể khiến bạn tiêu tốn hàng triệu đồng...`,
          strategicIntent: 'Xây dựng vị thế chuyên gia trong ngành, giúp khách hàng nhận biết sự khác biệt giữa dịch vụ chất lượng và hàng trôi nổi.',
          targetAngle: 'Cẩm nang so sánh và phân tích thực tế.',
          caption: `Lựa chọn đối tác đồng hành chưa bao giờ là việc dễ dàng.\n\n${brandName} xin chia sẻ 3 tiêu chí cốt lõi bạn cần kiểm tra trước khi quyết định:\n1️⃣ Quy trình cam kết rõ ràng, minh bạch về chi phí.\n2️⃣ Đội ngũ thực thi có kinh nghiệm và tận tâm.\n3️⃣ Chính sách bảo hành và hỗ trợ giải quyết sự cố tức thì.\n\nLưu lại ngay bài viết này để làm cẩm nang kiểm tra bạn nhé!`,
          cta: 'Bạn quan tâm nhất đến tiêu chí nào ở trên? Hãy để lại bình luận để cùng trao đổi nhé!',
          headlineOnImage: '3 TIÊU CHÍ BẠN CẦN BIẾT',
          subText: 'Cẩm nang lựa chọn chuẩn xác',
          visual: `Thiết kế dạng Album 4 ảnh: Ảnh bìa dọc 4:5 với tiêu đề nổi bật; 3 ảnh vuông minh họa 3 tiêu chí với icon trực quan.`,
        },
        {
          day: 'Thứ 6',
          time: '19:30',
          pillar: 'Feedback & Khách hàng',
          postType: 'Single Post (1 ảnh)',
          title: `Câu chuyện thành công: Khách hàng nói gì sau 3 tháng đồng hành cùng ${brandName}?`,
          hook: `"Lựa chọn ${brandName} là quyết định sáng suốt nhất của tôi trong năm nay!"`,
          strategicIntent: 'Tạo dựng bằng chứng xã hội (Social Proof) vững chắc để thúc đẩy khách hàng đang phân vân ra quyết định.',
          targetAngle: 'Case-study trải nghiệm khách hàng chân thực.',
          caption: `Không gì hạnh phúc hơn khi nhận được những lời nhắn gửi chân tình từ khách hàng sau thời gian đồng hành. ❤️\n\nSự hài lòng và tin tưởng của quý khách chính là động lực lớn nhất để đội ngũ ${brandName} không ngừng nỗ lực hoàn thiện dịch vụ mỗi ngày.\n\nCảm ơn bạn đã luôn trao gửi niềm tin nơi ${brandName}!`,
          cta: 'Bạn cũng muốn có trải nghiệm tuyệt vời như trên? Hãy nhắn tin cho chúng mình ngay!',
          headlineOnImage: 'NIỀM TIN TỪ KHÁCH HÀNG',
          subText: 'Real Feedback & Story',
          visual: `Layout tinh tế, kết hợp trích dẫn feedback chân thực của khách hàng cùng hình ảnh thực tế chất lượng cao.`,
        },
        {
          day: 'Chủ Nhật',
          time: '15:00',
          pillar: 'Tương tác & Minigame',
          postType: 'Meme / Trích dẫn',
          title: `Góc thư giãn cuối tuần: Câu đố vui có thưởng cùng ${brandName}`,
          hook: `Cuối tuần xả hơi, nhận quà thảnh thơi cùng ${brandName} nhé! 🎁`,
          strategicIntent: 'Tăng tương tác fanpage, tạo sự gắn kết thân mật giữa thương hiệu và cộng đồng.',
          targetAngle: 'Trò chơi tương tác nhẹ nhàng ngày Chủ Nhật.',
          caption: `Chủ Nhật thư thả một chút cùng ${brandName} nhé cả nhà! ☕\n\nTham gia mini-challenge nhỏ dưới đây để nhận ngay những phần quà bất ngờ:\n👉 Bước 1: Thả tim bài viết này.\n👉 Bước 2: Để lại câu trả lời hoặc chia sẻ trải nghiệm đáng nhớ nhất của bạn tuần qua.\n\nTụi mình sẽ gửi tặng 3 phần quà trải nghiệm cho 3 bạn may mắn nhất vào sáng mai!`,
          cta: 'Bình luận câu trả lời của bạn ngay bên dưới nhé!',
          headlineOnImage: 'MINIGAME CUỐI TUẦN',
          subText: 'Chơi vui • Nhận quà chất',
          visual: `Bố cục tươi vui, màu sắc trẻ trung, đồ họa dạng game hoặc câu đố kích thích thị giác.`,
        },
      ];

  const dayMap: Record<string, number> = {
    'Thứ 2': 0,
    'Thứ 3': 1,
    'Thứ 4': 2,
    'Thứ 5': 3,
    'Thứ 6': 4,
    'Thứ 7': 5,
    'Chủ Nhật': 6,
  };

  return baseThemes.slice(0, count).map((t: any, idx: number) => {
    const dayOffset = dayMap[t.day] !== undefined ? dayMap[t.day] : idx;
    const postDate = new Date(start);
    postDate.setDate(start.getDate() + dayOffset);
    const dateStr = postDate.toISOString().split('T')[0];

    return {
      id: `post_${Date.now()}_${idx + 1}`,
      dayOfWeek: getVietnameseDayOfWeek(dateStr),
      publishDate: dateStr,
      publishTime: t.time || '08:30',
      pillar: t.pillar,
      postType: t.postType,
      strategicIntent: t.strategicIntent,
      targetAngle: t.targetAngle,
      title: t.title,
      hook: t.hook,
      caption: t.caption,
      callToAction: t.cta,
      hashtags: `#${brandName.replace(/\s+/g, '')} #${brand.industry ? brand.industry.split(' ')[0] : 'Branding'} #HuDesign`,
      designBrief: {
        aspectRatio: t.postType.includes('Album') ? 'Album 4 ảnh (1 dọc 3 vuông)' : '4:5 (Dọc chuẩn Facebook)',
        headlineOnImage: t.headlineOnImage,
        subTextOnImage: t.subText,
        visualConcept: t.visual,
        moodAndTone: 'Chuyên nghiệp, cuốn hút, chuẩn nhận diện thương hiệu',
      },
      status: 'draft',
    };
  });
}
