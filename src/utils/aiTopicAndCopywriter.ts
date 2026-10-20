import { BrandProfile, PostPillar, PostFormatType, WeeklyPlanPost } from '../types';

export interface TopicSuggestion {
  title: string;
  angle: string;
  pillar: PostPillar;
  whyGood: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarity: number; // 0 to 100
  matchedPost?: WeeklyPlanPost & { planTitle?: string };
  reason?: string;
}

// Hàm làm sạch chuỗi và tách từ khóa cốt lõi
const extractKeywords = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'–—]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['những', 'cách', 'làm', 'cho', 'của', 'tại', 'với', 'trong', 'được', 'này', 'các', 'một', 'bạn'].includes(w));
};

// Kiểm tra trùng lặp giữa chủ đề đang nhập và lịch sử các bài đã viết
export const checkTopicDuplicate = (
  currentTitle: string,
  historyPosts: (WeeklyPlanPost & { planTitle?: string })[],
  currentPostId?: string
): DuplicateCheckResult => {
  const cleanCurrent = currentTitle.trim().toLowerCase();
  if (!cleanCurrent || cleanCurrent.length < 5) {
    return { isDuplicate: false, similarity: 0 };
  }

  const currentKeywords = extractKeywords(cleanCurrent);
  if (currentKeywords.length === 0) return { isDuplicate: false, similarity: 0 };

  let maxSimilarity = 0;
  let bestMatch: (WeeklyPlanPost & { planTitle?: string }) | undefined;

  for (const post of historyPosts) {
    // Bỏ qua chính bài viết đang sửa
    if (currentPostId && post.id === currentPostId) continue;

    const postTitleClean = post.title.trim().toLowerCase();
    
    // Trùng khớp hoàn toàn hoặc chứa nguyên cụm
    if (postTitleClean === cleanCurrent) {
      return {
        isDuplicate: true,
        similarity: 100,
        matchedPost: post,
        reason: 'Trùng khớp 100% với một bài viết đã có!',
      };
    }

    if (cleanCurrent.length > 12 && (postTitleClean.includes(cleanCurrent) || cleanCurrent.includes(postTitleClean))) {
      return {
        isDuplicate: true,
        similarity: 90,
        matchedPost: post,
        reason: 'Trùng lặp gần như toàn bộ cụm chủ đề với bài trước đó.',
      };
    }

    // So khớp theo tỷ lệ từ khóa (Jaccard-like)
    const postKeywords = extractKeywords(postTitleClean);
    if (postKeywords.length === 0) continue;

    const common = currentKeywords.filter((k) => postKeywords.includes(k));
    const similarity = Math.round((common.length / Math.max(currentKeywords.length, postKeywords.length)) * 100);

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      bestMatch = post;
    }
  }

  if (maxSimilarity >= 65 && bestMatch) {
    return {
      isDuplicate: true,
      similarity: maxSimilarity,
      matchedPost: bestMatch,
      reason: `Có độ tương đồng ${maxSimilarity}% với bài đã viết: "${bestMatch.title}"`,
    };
  }

  return {
    isDuplicate: false,
    similarity: maxSimilarity,
    matchedPost: bestMatch,
  };
};

// Sinh danh sách gợi ý chủ đề thông minh, không trùng với lịch sử đã viết
export const getSmartTopicSuggestions = (
  brand: BrandProfile,
  pillar: PostPillar,
  dayOfWeek: string,
  historyTitles: string[] = []
): TopicSuggestion[] => {
  const brandName = brand.name || 'Thương hiệu';
  const industry = brand.industry || 'Dịch vụ & Bán lẻ';
  const desc = brand.businessDescription || industry;
  
  const isFnB = industry.toLowerCase().includes('f&b') || industry.toLowerCase().includes('cà phê') || industry.toLowerCase().includes('trà');
  const isCeramics = industry.toLowerCase().includes('gốm') || industry.toLowerCase().includes('thủ công') || industry.toLowerCase().includes('decor');
  const isFashion = industry.toLowerCase().includes('thời trang') || industry.toLowerCase().includes('quần áo') || industry.toLowerCase().includes('may mặc');

  let suggestions: TopicSuggestion[] = [];

  switch (pillar) {
    case 'Chia sẻ kiến thức & Tips':
      if (isFnB) {
        suggestions = [
          {
            title: `Bí quyết nhận biết hạt cà phê Arabica nguyên chất và cách bảo quản giữ trọn hương mộc`,
            angle: 'Cẩm nang chuyên gia',
            pillar,
            whyGood: 'Xây dựng uy tín chuyên môn và giải quyết băn khoăn về chất lượng của khách sành cà phê.',
          },
          {
            title: `3 lỗi phổ biến khi ủ Cold Brew tại nhà khiến vị cà phê bị chua gắt`,
            angle: 'Giải quyết vấn đề thường gặp',
            pillar,
            whyGood: 'Đánh trúng tâm lý người thích tự pha chế tại nhà, kích thích lưu bài viết.',
          },
          {
            title: `Tỷ lệ vàng kết hợp sữa và Espresso để có một ly Latte béo mịn đúng điệu`,
            angle: 'Hướng dẫn thực hành',
            pillar,
            whyGood: 'Nội dung trực quan, dễ làm Album Carousel 4 ảnh thu hút tương tác.',
          },
          {
            title: `Nên chọn mức độ rang (Roast Level) nào phù hợp với gu thưởng thức của bạn?`,
            angle: 'Tư vấn cá nhân hóa',
            pillar,
            whyGood: 'Giúp khách hàng dễ chọn loại cà phê phù hợp khi mua hàng tại quán/shop.',
          },
        ];
      } else if (isCeramics) {
        suggestions = [
          {
            title: `3 bước dưỡng men và làm sạch đồ gốm mộc để giữ độ bóng mịn theo năm tháng`,
            angle: 'Cẩm nang bảo quản',
            pillar,
            whyGood: 'Giúp khách an tâm về độ bền của sản phẩm thủ công cao cấp.',
          },
          {
            title: `Cách phân biệt gốm thủ công vuốt tay độc bản và gốm đổ khuôn công nghiệp`,
            angle: 'Nâng cao giá trị sản phẩm',
            pillar,
            whyGood: 'Giáo dục thị trường và khẳng định giá trị nghệ thuật độc bản của thương hiệu.',
          },
          {
            title: `Gợi ý 4 cách bài trí bình gốm mộc mang lại năng lượng an yên cho góc làm việc`,
            angle: 'Ý tưởng decor không gian',
            pillar,
            whyGood: 'Đem lại giá trị thẩm mỹ, thôi thúc khách hàng mua về trang trí.',
          },
        ];
      } else {
        suggestions = [
          {
            title: `3 tiêu chí cốt lõi bạn cần nắm rõ trước khi lựa chọn dịch vụ ${industry}`,
            angle: 'Lời khuyên chuyên gia',
            pillar,
            whyGood: 'Giúp khách hàng có góc nhìn thông thái, nâng tầm vị thế thương hiệu.',
          },
          {
            title: `Sai lầm thường gặp khiến bạn tốn kém chi phí mà không đạt được kết quả như ý`,
            angle: 'Cảnh báo rủi ro',
            pillar,
            whyGood: 'Tạo cảm giác cấp bách, thôi thúc khách hàng đọc hết bài viết.',
          },
          {
            title: `Quy trình 5 bước chuẩn hóa giúp ${brandName} luôn đảm bảo chất lượng cam kết`,
            angle: 'Minh bạch quy trình',
            pillar,
            whyGood: 'Tạo dựng lòng tin vững chắc nơi khách hàng mới.',
          },
        ];
      }
      break;

    case 'Bán hàng / Khuyến mãi':
      suggestions = [
        {
          title: `Ưu đãi độc quyền ${dayOfWeek}: Giảm ngay 15% khi đặt trước sản phẩm signature tại ${brandName}`,
          angle: 'Ưu đãi có giới hạn (Urgency)',
          pillar,
          whyGood: 'Tạo lý do mua ngay trong ngày, thúc đẩy inbox chốt đơn nhanh chóng.',
        },
        {
          title: `Combo trải nghiệm trọn vẹn: Mua 1 được 2 - Món quà tri ân dành riêng cho bạn`,
          angle: 'Combo tiết kiệm',
          pillar,
          whyGood: 'Tăng giá trị đơn hàng trung bình và kích thích thử nghiệm nhiều sản phẩm.',
        },
        {
          title: `Chỉ còn 20 suất: Tặng kèm phần quà độc quyền cho khách hàng đặt hàng trong tuần này`,
          angle: 'Số lượng giới hạn (Scarcity)',
          pillar,
          whyGood: 'Kích thích tâm lý sợ bỏ lỡ (FOMO) của người theo dõi Fanpage.',
        },
      ];
      break;

    case 'Tương tác & Minigame':
      suggestions = [
        {
          title: `Trắc nghiệm vui cuối tuần: Phong cách của bạn thuộc về gu nào tại ${brandName}?`,
          angle: 'Gắn kết & Thấu hiểu',
          pillar,
          whyGood: 'Tăng mạnh lượt bình luận (comment) tự nhiên và giữ chân fanpage.',
        },
        {
          title: `Minigame 1 phút đoán đúng: Điền vào chỗ trống nhận ngay voucher bất ngờ`,
          angle: 'Thử thách có thưởng',
          pillar,
          whyGood: 'Tỷ lệ tương tác cao, tạo không khí hào hứng và thân thiện cho thương hiệu.',
        },
        {
          title: `Nếu được chọn một điều duy nhất cho ngày hôm nay, bạn sẽ bấm số 1 hay số 2?`,
          angle: 'Thảo luận mở',
          pillar,
          whyGood: 'Câu hỏi cực kỳ dễ trả lời trên điện thoại, tăng tương tác thuật toán Facebook.',
        },
      ];
      break;

    case 'Câu chuyện thương hiệu':
      suggestions = [
        {
          title: `Hành trình tạo nên sản phẩm: Vì sao ${brandName} kiên định với chất lượng mộc mạc?`,
          angle: 'Tâm huyết đằng sau hậu trường',
          pillar,
          whyGood: 'Chạm đến cảm xúc, giúp khách hàng thấu hiểu tâm huyết của người sáng lập.',
        },
        {
          title: `Một ngày bình yên tại xưởng/cửa hàng của tụi mình bắt đầu như thế nào?`,
          angle: 'Hậu trường chân thực',
          pillar,
          whyGood: 'Tạo cảm giác ấm cúng, như những người bạn trò chuyện thân tình.',
        },
        {
          title: `Triết lý kinh doanh của ${brandName}: Chất lượng thật từ những điều nhỏ bé nhất`,
          angle: 'Định vị thương hiệu',
          pillar,
          whyGood: 'Khắc sâu hình ảnh thương hiệu có tâm và có tầm trong tâm trí khách hàng.',
        },
      ];
      break;

    case 'Feedback & Khách hàng':
      suggestions = [
        {
          title: `"Lúc đầu mình còn hơi ngập ngừng, nhưng nhận hàng rồi thì mê thật sự!" - Lời nhắn từ khách hàng thân thiết`,
          angle: 'Bằng chứng xã hội (Social Proof)',
          pillar,
          whyGood: 'Xóa tan mọi nghi ngại của khách hàng mới, tỷ lệ chuyển đổi đơn cao.',
        },
        {
          title: `Lời cảm ơn chân thành gửi đến những vị khách đã đồng hành cùng ${brandName} suốt thời gian qua`,
          angle: 'Tri ân & Tôn vinh khách hàng',
          pillar,
          whyGood: 'Tạo sự gắn kết trung thành và khuyến khích khách hàng tiếp tục ủng hộ.',
        },
      ];
      break;

    default: // Bắt trend / Đời thường
      suggestions = [
        {
          title: `Dấu hiệu cho thấy bạn đang cần một khoảng lặng nạp năng lượng ngay lúc này!`,
          angle: 'Đời thường đồng cảm',
          pillar,
          whyGood: 'Rất dễ chia sẻ (share) trên trang cá nhân vì đánh trúng tâm trạng số đông.',
        },
        {
          title: `Nỗi niềm không của riêng ai ngày ${dayOfWeek}: Tự thưởng cho bản thân một chút niềm vui`,
          angle: 'Thấu hiểu cảm xúc',
          pillar,
          whyGood: 'Nhẹ nhàng, không gượng ép bán hàng, tạo thiện cảm tự nhiên.',
        },
      ];
  }

  // Lọc loại bỏ những chủ đề đã có trong lịch sử (nếu tương tự)
  const filtered = suggestions.filter((sug) => {
    const sugKeywords = extractKeywords(sug.title);
    return !historyTitles.some((hTitle) => {
      const hKeywords = extractKeywords(hTitle);
      const common = sugKeywords.filter((k) => hKeywords.includes(k));
      return common.length >= 3;
    });
  });

  return filtered.length > 0 ? filtered : suggestions;
};

// AI Copywriter: Tự động viết toàn bộ bài viết (Hook, Full Caption, CTA, Hashtags, Brief thiết kế)
export const generateFullPostContentByAi = (params: {
  brand: BrandProfile;
  title: string;
  pillar: PostPillar;
  postType: PostFormatType;
  dayOfWeek: string;
  toneStyle?: 'brand' | 'viral_hook' | 'expert' | 'emotional' | 'humorous';
}): {
  hook: string;
  caption: string;
  callToAction: string;
  hashtags: string;
  designBrief: {
    aspectRatio: '1:1 (Vuông)' | '4:5 (Dọc chuẩn Facebook)' | '9:16 (Story / Reel)' | '16:9 (Ngang)' | 'Album 4 ảnh (1 dọc 3 vuông)';
    headlineOnImage: string;
    subTextOnImage: string;
    visualConcept: string;
    moodAndTone: string;
  };
} => {
  const { brand, title, pillar, postType, dayOfWeek, toneStyle = 'brand' } = params;
  const brandName = brand.name || 'Thương hiệu';
  const cleanTitle = title.trim() || 'Chia sẻ giá trị và trải nghiệm đặc biệt';
  const desc = brand.businessDescription || brand.industry || 'Chất lượng hàng đầu và dịch vụ tận tâm';

  // 1. SINH CÂU HOOK (3s đầu tiên)
  let hook = '';
  if (toneStyle === 'viral_hook') {
    hook = `Đừng vội lướt qua nếu bạn chưa biết bí mật đằng sau ${cleanTitle.toLowerCase()}!`;
  } else if (toneStyle === 'expert') {
    hook = `Có những chi tiết rất nhỏ nhưng quyết định đến 90% sự thành bại của ${cleanTitle.toLowerCase()}...`;
  } else if (toneStyle === 'emotional') {
    hook = `Đôi khi, điều khiến chúng ta thấy bình yên nhất lại đến từ những điều dung dị như thế này...`;
  } else if (toneStyle === 'humorous') {
    hook = `Nghe bảo ai đọc được bài này trong ngày ${dayOfWeek} là tuần này gặp toàn điều may mắn thôi đấy!`;
  } else {
    // Chuẩn brand
    hook = pillar === 'Bán hàng / Khuyến mãi'
      ? `Cơ hội đặc biệt chỉ dành riêng cho bạn trong dịp này cùng ${brandName}!`
      : `Bạn đã bao giờ tự hỏi điều gì tạo nên sự khác biệt cho ${cleanTitle.toLowerCase()}?`;
  }

  // 2. SINH NỘI DUNG CHI TIẾT (FULL CAPTION CHIA ĐOẠN ĐẸP)
  let caption = '';
  const hashBrand = `#${brandName.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '')}`;
  const industryTag = `#${brand.industry.split(' ')[0] || 'Branding'}`;

  if (pillar === 'Chia sẻ kiến thức & Tips') {
    caption = `💡 ${cleanTitle}\n\nTrong guồng quay bận rộn hàng ngày, việc nắm được bí quyết đúng sẽ giúp bạn tiết kiệm rất nhiều thời gian và tận hưởng trọn vẹn giá trị.\n\nHôm nay, ${brandName} xin chia sẻ cùng bạn 3 điều cốt lõi:\n\n1️⃣ Lựa chọn chuẩn ngay từ đầu: Đừng chỉ nhìn vào vẻ hào nhoáng bên ngoài, hãy chú trọng vào chất lượng thực tế và nguồn gốc rõ ràng.\n\n2️⃣ Thực hành đúng quy trình: Chỉ cần thay đổi một vài thao tác nhỏ như hướng dẫn ở trên, bạn sẽ cảm nhận sự khác biệt rõ rệt.\n\n3️⃣ Duy trì thói quen bền bỉ: Mọi điều tuyệt vời đều cần thời gian để phát huy trọn vẹn giá trị của nó.\n\n✨ Tại ${brandName}, chúng mình luôn đặt tâm huyết trong từng sản phẩm để mang đến cho bạn trải nghiệm trọn vẹn nhất.\n\n${desc ? `📌 Về ${brandName}: ${desc}` : ''}`;
  } else if (pillar === 'Bán hàng / Khuyến mãi') {
    caption = `🎁 ĐẶC QUYỀN DÀNH RIÊNG CHO BẠN TẠI ${brandName.toUpperCase()}!\n\n${cleanTitle}\n\nSau những ngày làm việc chăm chỉ, bạn xứng đáng được tự thưởng cho mình những điều tuyệt vời nhất. Và ${brandName} ở đây để biến điều đó trở nên trọn vẹn hơn bao giờ hết:\n\n✨ CHI TIẾT ƯU ĐÃI:\n• Giảm ngay ưu đãi đặc biệt khi đặt hàng / trải nghiệm sớm\n• Quà tặng kèm phiên bản độc quyền chỉ có trong đợt này\n• Hỗ trợ tư vấn tận tâm 1:1 theo đúng nhu cầu của bạn\n\n⏰ Số lượng có hạn: Chương trình chỉ diễn ra trong thời gian ngắn hoặc đến khi hết quà tặng.`;
  } else if (pillar === 'Câu chuyện thương hiệu') {
    caption = `🌿 CÂU CHUYỆN ĐẰNG SAU TỪNG SẢN PHẨM TẠI ${brandName.toUpperCase()}\n\n${cleanTitle}\n\nCó những buổi sáng sớm khi xưởng làm việc bắt đầu đỏ lửa hay tiếng máy móc vận hành đều đặn, tụi mình lại tự nhắc nhau về lý do vì sao bắt đầu.\n\nVới ${brandName}, không đơn thuần là trao đi một món đồ hay dịch vụ, mà là trao đi sự chân thành, niềm tin và sự trân trọng đến từng khách hàng đã tin tưởng lựa chọn.\n\nCảm ơn bạn đã luôn là một phần ý nghĩa trong hành trình của chúng mình! ❤️`;
  } else if (pillar === 'Tương tác & Minigame') {
    caption = `🎉 THẢ LỎNG CÙNG ${brandName.toUpperCase()} • BÌNH LUẬN NHẬN QUÀ!\n\n${cleanTitle}\n\nGác lại những bộn bề sau một ngày bận rộn, cùng tụi mình tham gia một thử thách nho nhỏ để giải tỏa căng thẳng nhé!\n\n👉 Luật chơi cực kỳ đơn giản:\n1. Thả tim cho bài viết này\n2. Để lại lựa chọn của bạn ở phần bình luận bên dưới\n3. Gắn thẻ (tag) 1 người bạn thân cùng tham gia\n\n🎁 03 phần quà may mắn sẽ được gửi tặng ngẫu nhiên cho những bạn có câu trả lời thú vị nhất!`;
  } else {
    caption = `✨ ${cleanTitle}\n\nChào ngày mới tràn đầy năng lượng cùng ${brandName}!\n\n${desc}\n\nHy vọng bài viết này sẽ mang đến cho bạn thêm nhiều nguồn cảm hứng mới mẻ và những góc nhìn thú vị. Hãy để lại cảm nghĩ của bạn bên dưới nhé!`;
  }

  // 3. LỜI KÊU GỌI HÀNH ĐỘNG (CALL TO ACTION)
  let callToAction = '';
  if (pillar === 'Bán hàng / Khuyến mãi') {
    callToAction = 'Nhắn tin (Inbox) Fanpage ngay hôm nay để giữ suất ưu đãi đặc quyền!';
  } else if (pillar === 'Tương tác & Minigame') {
    callToAction = 'Bình luận câu trả lời của bạn ngay bên dưới để rinh quà nhé!';
  } else if (pillar === 'Chia sẻ kiến thức & Tips') {
    callToAction = 'Lưu lại bài viết hoặc chia sẻ cho bạn bè để áp dụng ngay khi cần!';
  } else {
    callToAction = 'Nhắn tin cho Fanpage nếu bạn cần thêm tư vấn chi tiết nhé!';
  }

  // 4. HASHTAGS
  const hashtags = `${hashBrand} ${industryTag} #HuDesign #MarketingFanpage #ChatLuong #Trending2026`;

  // 5. BRIEF THIẾT KẾ HÌNH ẢNH ĐỒNG BỘ
  const aspectRatio = postType === 'Album Carousel (4-6 ảnh)' 
    ? 'Album 4 ảnh (1 dọc 3 vuông)'
    : postType === 'Reels / Video ngắn'
    ? '9:16 (Story / Reel)'
    : '4:5 (Dọc chuẩn Facebook)';

  const headlineOnImage = cleanTitle.length > 35 
    ? cleanTitle.slice(0, 35).toUpperCase() + '...' 
    : cleanTitle.toUpperCase();

  const visualConcept = `Bố cục nổi bật theo chuẩn tỉ lệ ${aspectRatio}. Màu sắc chủ đạo theo nhận diện thương hiệu (${brand.colors.primary} phối ${brand.colors.secondary || brand.colors.accent}). Font tiêu đề ${brand.fonts.headingFont} to rõ ràng, hình ảnh sản phẩm chụp góc ánh sáng tự nhiên mộc mạc, tạo cảm giác cao cấp chuyên nghiệp.`;

  const moodAndTone = brand.designStyle || 'Hiện đại, thanh lịch, truyền cảm hứng';

  return {
    hook,
    caption,
    callToAction,
    hashtags,
    designBrief: {
      aspectRatio,
      headlineOnImage,
      subTextOnImage: `${brandName} • Chất lượng hàng đầu`,
      visualConcept,
      moodAndTone,
    },
  };
};

// ========================================================
// ASYNC API FETCHERS (GEMINI 3.1 FLASH-LITE SERVER BACKEND)
// ========================================================

// API Caller: Gọi Gemini AI Server để phân tích sâu thương hiệu và gợi ý chủ đề
export async function fetchAiTopicSuggestions(
  brand: BrandProfile,
  pillar: PostPillar,
  dayOfWeek: string,
  historyTitles: string[] = [],
  currentTitle?: string
): Promise<{ suggestions: TopicSuggestion[]; mode: 'gemini_ai' | 'fallback_engine' }> {
  try {
    const res = await fetch('/api/generate-fanpage-topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand,
        pillar,
        dayOfWeek,
        historyTitles,
        currentTitle,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        return {
          suggestions: data.suggestions.map((s: any) => ({
            title: s.title,
            angle: s.angle || 'Góc nhìn chuyên sâu',
            pillar: pillar,
            whyGood: s.whyGood || 'Tối ưu tương tác cho thương hiệu',
          })),
          mode: data.mode || 'gemini_ai',
        };
      }
    }
  } catch (error) {
    console.warn('API fetchAiTopicSuggestions error, using smart fallback engine:', error);
  }

  // Fallback
  return {
    suggestions: getSmartTopicSuggestions(brand, pillar, dayOfWeek, historyTitles),
    mode: 'fallback_engine',
  };
}

// API Caller: Gọi Gemini AI Server để viết toàn bộ bài viết (Hook, Caption, CTA, Hashtags, Design Brief)
export async function fetchAiFullPostContent(params: {
  brand: BrandProfile;
  title: string;
  pillar: PostPillar;
  postType: PostFormatType;
  dayOfWeek: string;
  toneStyle?: 'brand' | 'viral_hook' | 'expert' | 'emotional' | 'humorous';
}): Promise<{
  hook: string;
  caption: string;
  callToAction: string;
  hashtags: string;
  designBrief: {
    aspectRatio: '1:1 (Vuông)' | '4:5 (Dọc chuẩn Facebook)' | '9:16 (Story / Reel)' | '16:9 (Ngang)' | 'Album 4 ảnh (1 dọc 3 vuông)';
    headlineOnImage: string;
    subTextOnImage: string;
    visualConcept: string;
    moodAndTone: string;
  };
  mode: 'gemini_ai' | 'fallback_engine';
}> {
  try {
    const res = await fetch('/api/generate-fanpage-copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.result && data.result.caption) {
        return {
          hook: data.result.hook || '',
          caption: data.result.caption || '',
          callToAction: data.result.callToAction || '',
          hashtags: data.result.hashtags || '',
          designBrief: {
            aspectRatio: data.result.designBrief?.aspectRatio || '4:5 (Dọc chuẩn Facebook)',
            headlineOnImage: data.result.designBrief?.headlineOnImage || params.title.toUpperCase(),
            subTextOnImage: data.result.designBrief?.subTextOnImage || `${params.brand.name} • Uy tín hàng đầu`,
            visualConcept: data.result.designBrief?.visualConcept || 'Bố cục hiện đại, phối màu nhận diện thương hiệu.',
            moodAndTone: data.result.designBrief?.moodAndTone || params.brand.designStyle || 'Chuyên nghiệp',
          },
          mode: data.mode || 'gemini_ai',
        };
      }
    }
  } catch (error) {
    console.warn('API fetchAiFullPostContent error, using local smart fallback:', error);
  }

  // Fallback
  return {
    ...generateFullPostContentByAi(params),
    mode: 'fallback_engine',
  };
}
