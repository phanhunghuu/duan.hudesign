import { PostFormatType, BrandProfile, WeeklyPlanPost, PostPillar } from '../types';
import { getBrandPillars } from './pillarUtils';

export type VietnameseDayOfWeek = 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6' | 'Thứ 7' | 'Chủ Nhật';

/**
 * Tính chính xác Thứ trong tuần theo chuẩn Tiếng Việt từ chuỗi ngày (YYYY-MM-DD)
 */
export function getVietnameseDayOfWeek(dateStr: string): VietnameseDayOfWeek {
  if (!dateStr) return 'Thứ 2';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return 'Thứ 2';
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed in JS Date
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return 'Thứ 2';

  const d = new Date(year, month, day);
  const dayIndex = d.getDay(); // 0 = Chủ Nhật, 1 = Thứ 2, 2 = Thứ 3, ..., 6 = Thứ 7

  switch (dayIndex) {
    case 0:
      return 'Chủ Nhật';
    case 1:
      return 'Thứ 2';
    case 2:
      return 'Thứ 3';
    case 3:
      return 'Thứ 4';
    case 4:
      return 'Thứ 5';
    case 5:
      return 'Thứ 6';
    case 6:
      return 'Thứ 7';
    default:
      return 'Thứ 2';
  }
}

/**
 * Lấy số ngày của một tháng bất kỳ trong năm
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Định dạng YYYY-MM-DD
 */
export function formatDateYMD(year: number, month: number, day: number): string {
  const m = month < 10 ? `0${month}` : `${month}`;
  const d = day < 10 ? `0${day}` : `${day}`;
  return `${year}-${m}-${d}`;
}

const COMMON_POSTING_HOURS = ['08:30', '11:30', '19:30', '20:00'];

const COMMON_FORMATS: PostFormatType[] = [
  'Single Post (1 ảnh)',
  'Album Carousel (4-6 ảnh)',
  'Reels / Video ngắn',
  'Infographic / Hướng dẫn',
  'Meme / Trích dẫn',
];

/**
 * Gợi ý danh mục chủ đề & sườn bài đề xuất theo từng lĩnh vực để tạo kế hoạch tháng phong phú
 */
function getMonthlyTopicLibrary(brand: BrandProfile) {
  const brandName = brand.name || 'Thương hiệu';
  const text = `${brandName} ${brand.industry || ''} ${brand.businessDescription || ''}`.toLowerCase();
  const isLogistics = text.includes('ship') || text.includes('vận chuyển') || text.includes('giao hàng') || text.includes('logistics') || text.includes('citi');
  const isFnB = text.includes('cà phê') || text.includes('coffee') || text.includes('f&b') || text.includes('trà') || text.includes('bánh') || text.includes('quán');
  const isPottery = text.includes('gốm') || text.includes('art') || text.includes('thủ công') || text.includes('decor');

  if (isLogistics) {
    return [
      {
        title: `Mẹo đóng gói hàng dễ vỡ chuẩn 3 lớp chống va đập tuyệt đối`,
        angle: 'Hướng dẫn chủ shop quấn xốp nổ và chèn góc để giảm tỷ lệ hoàn đơn về 0%',
        format: 'Infographic / Hướng dẫn' as PostFormatType,
      },
      {
        title: `Bảng cước ưu đãi đồng giá nội thành dành riêng cho Shop đối tác tháng này`,
        angle: 'Tung chính sách chiết khấu cước cực tốt để kích cầu chủ shop gửi hàng',
        format: 'Single Post (1 ảnh)' as PostFormatType,
      },
      {
        title: `Case study: Giải cứu 60 đơn hàng hỏa tốc trong cơn mưa ngập chiều tan tầm`,
        angle: 'Kể lại tình huống shipper vượt ngập giao bánh kem đúng giờ sinh nhật khách',
        format: 'Album Carousel (4-6 ảnh)' as PostFormatType,
      },
      {
        title: `Chủ shop thở phào với quy trình đối soát tiền COD 24h tự động`,
        angle: 'Minh bạch dòng tiền xoay vòng vốn kinh doanh không bị giam vốn lâu',
        format: 'Single Post (1 ảnh)' as PostFormatType,
      },
      {
        title: `Minigame: Bắt trúng tình huống oái oăm của shipper - Nhận mã Freeship cả tuần`,
        angle: 'Tạo thảo luận sôi nổi, đồng cảm với những khoảnh khắc đời thường của nghề giao hàng',
        format: 'Single Post (1 ảnh)' as PostFormatType,
      },
      {
        title: `5 thói quen nhỏ khi dán nhãn bưu kiện giúp shipper giao nhanh gấp đôi`,
        angle: 'Chia sẻ kinh nghiệm ghi số điện thoại phụ và lưu ý thời gian khách nhận hàng',
        format: 'Infographic / Hướng dẫn' as PostFormatType,
      },
      {
        title: `Đội ngũ shipper thân thiện: Nụ cười mở lối cho mọi đơn hàng trọn vẹn`,
        angle: 'Vinh danh tinh thần trách nhiệm của tài xế, tạo dựng thiện cảm lớn với người nhận',
        format: 'Single Post (1 ảnh)' as PostFormatType,
      },
      {
        title: `Chính sách cam kết đền bù 100% nếu hàng hóa bể vỡ hoặc thất lạc`,
        angle: 'Xóa bỏ hoàn toàn nỗi sợ rủi ro khi chuyển giao hàng giá trị cao',
        format: 'Single Post (1 ảnh)' as PostFormatType,
      },
      {
        title: `Bí quyết giữ độ nóng giòn cho đồ ăn giao đi của các quán F&B đắt khách`,
        angle: 'Chia sẻ mẹo dùng túi giữ nhiệt chuyên dụng và chọn cung đường tối ưu',
        format: 'Album Carousel (4-6 ảnh)' as PostFormatType,
      },
      {
        title: `Tổng kết tháng: Những con số biết nói về tỷ lệ giao thành công 99.2%`,
        angle: 'Social proof vững chắc khẳng định uy tín và năng lực phục vụ của thương hiệu',
        format: 'Infographic / Hướng dẫn' as PostFormatType,
      },
      {
        title: `Gửi trọn niềm tin: Lắng nghe tâm sự thật của một chủ shop gắn bó hơn 2 năm`,
        angle: 'Feedback người thật việc thật chạm tới sự đồng cảm của cộng đồng kinh doanh',
        format: 'Album Carousel (4-6 ảnh)' as PostFormatType,
      },
      {
        title: `Cuối tuần xả hơi: Dự đoán doanh thu đơn hàng cùng ${brandName}`,
        angle: 'Tương tác nhẹ nhàng, kết nối thân tình với các chủ shop sau tuần làm việc bận rộn',
        format: 'Meme / Trích dẫn' as PostFormatType,
      },
      {
        title: `Hạ tầng kho bãi và hệ thống phân luồng kiện hàng thông minh`,
        angle: 'Show quy mô vận hành chuyên nghiệp phía sau mỗi lượt bấm tạo đơn trên app',
        format: 'Reels / Video ngắn' as PostFormatType,
      },
      {
        title: `Cảnh báo chiêu trò mạo danh shipper lừa đảo tiền thu hộ của khách`,
        angle: 'Bảo vệ khách hàng bằng kiến thức nhận diện shipper chính chủ và mã đơn hợp lệ',
        format: 'Infographic / Hướng dẫn' as PostFormatType,
      },
      {
        title: `Chương trình tri ân: Giảm 20% phí giao hàng cho 50 đơn đầu tiên của tuần mới`,
        angle: 'Kích hoạt hành động tạo đơn đầu tuần cho các shop mới gia nhập',
        format: 'Single Post (1 ảnh)' as PostFormatType,
      },
    ];
  }

  if (isFnB) {
    return [
      {
        title: `Thứ Hai khởi đầu tuần mới bằng tách cà phê hạt Arabica Cầu Đất rang mộc`,
        angle: 'Gợi mở cảm hứng làm việc đầu tuần với hương thơm hoa trái và vị chua thanh nhẹ',
        format: 'Single Post (1 ảnh)' as PostFormatType,
      },
      {
        title: `Bí quyết ủ Cold Brew 24h chuẩn vị: Vì sao không bị đắng chát hay chua gắt?`,
        angle: 'Cẩm nang pha chế chia sẻ tỉ lệ vàng giữa nước lạnh và độ thô của bột cà phê',
        format: 'Infographic / Hướng dẫn' as PostFormatType,
      },
      {
        title: `Combo Bữa Sáng Năng Lượng: Cà phê đóng chai mang đi + Croissant bơ Pháp giòn rụm`,
        angle: 'Kích thích dân văn phòng đặt bữa sáng giao tận bàn làm việc trước 9h',
        format: 'Single Post (1 ảnh)' as PostFormatType,
      },
      {
        title: `Góc bàn gỗ bên khung cửa sổ ngày mưa: Nơi những dòng suy tưởng lắng đọng`,
        angle: 'Bắt trọn cảm xúc ngày mưa Sài Gòn, mời gọi khách ghé quán trải nghiệm không gian',
        format: 'Single Post (1 ảnh)' as PostFormatType,
      },
      {
        title: `Phân biệt Arabica và Robusta trong 3 nốt nhạc cho người mới tập uống cà phê`,
        angle: 'Giải thích trực quan hình dáng hạt, lượng caffeine và tầng hương thơm',
        format: 'Album Carousel (4-6 ảnh)' as PostFormatType,
      },
      {
        title: `Trải nghiệm thử nếm cà phê Cupping: Đánh thức vị giác cùng Barista`,
        angle: 'Giới thiệu workshop cuối tuần nâng tầm hiểu biết về văn hóa cà phê đặc sản',
        format: 'Album Carousel (4-6 ảnh)' as PostFormatType,
      },
      {
        title: `Hành trình những quả cà phê chín mọng từ nông trại cao nguyên Cầu Đất`,
        angle: 'Câu chuyện người nông dân tỉ mẩn hái chọn từng trái cà phê chín đỏ',
        format: 'Single Post (1 ảnh)' as PostFormatType,
      },
      {
        title: `Ưu đãi Thứ Tư: Tặng thêm 1 shot Espresso khi mua bình Cold Brew 500ml`,
        angle: 'Khuyến mãi giữa tuần tạo động lực cho khách hàng bổ sung năng lượng làm việc',
        format: 'Single Post (1 ảnh)' as PostFormatType,
      },
      {
        title: `Playlist âm nhạc nhẹ nhàng bên tách Pour-Over cho buổi chiều làm việc hiệu quả`,
        angle: 'Chia sẻ gu âm nhạc mộc mạc thư thái, kết nối sâu sắc với người yêu cà phê',
        format: 'Single Post (1 ảnh)' as PostFormatType,
      },
      {
        title: `Lời nhắn từ khách quen: 'Quán là nơi mình hoàn thành trọn vẹn dự án tốt nghiệp'`,
        angle: 'Feedback chân thành khẳng định giá trị không gian yên tĩnh và thân thiện',
        format: 'Album Carousel (4-6 ảnh)' as PostFormatType,
      },
      {
        title: `Bật mí cách bảo quản hạt cà phê rang mộc giữ trọn hương thơm tới 30 ngày`,
        angle: 'Mẹo dùng van 1 chiều và hộp kín tránh ánh sáng mặt trời',
        format: 'Infographic / Hướng dẫn' as PostFormatType,
      },
      {
        title: `Món mới tuần này: Cold Brew Cam Vàng mật ong ngọt thanh sảng khoái`,
        angle: 'Ra mắt hương vị thức uống mới phù hợp cho những ngày nắng nóng',
        format: 'Single Post (1 ảnh)' as PostFormatType,
      },
      {
        title: `Góc pha chế Barista: Nghệ thuật kiểm soát dòng nước khi rót Pour-Over V60`,
        angle: 'Show kỹ năng điêu luyện và sự tỉ mỉ của thợ pha chế chuyên nghiệp',
        format: 'Reels / Video ngắn' as PostFormatType,
      },
      {
        title: `Đố vui cuối tuần: Bạn nhận diện được bao nhiêu nốt hương trong ly cà phê sáng nay?`,
        angle: 'Tương tác minigame nhận voucher trải nghiệm đồ uống mới tại quán',
        format: 'Single Post (1 ảnh)' as PostFormatType,
      },
      {
        title: `Chủ Nhật chậm lại một nhịp: Tự thưởng cho bản thân một buổi sáng thong dong`,
        angle: 'Truyền tải thông điệp sống chậm, chữa lành tâm hồn sau một tuần bận rộn',
        format: 'Single Post (1 ảnh)' as PostFormatType,
      },
    ];
  }

  // Mặc định cho thương hiệu tổng quát
  return [
    {
      title: `Tại sao khách hàng thông thái luôn chọn ${brandName} thay vì phương án giá rẻ?`,
      angle: 'Định vị giá trị cốt lõi, chất lượng bền vững và dịch vụ tận tâm',
      format: 'Single Post (1 ảnh)' as PostFormatType,
    },
    {
      title: `3 sai lầm phổ biến khiến bạn mất nhiều chi phí mà không đạt kết quả mong muốn`,
      angle: 'Chỉ ra lỗi sai thực tế và gợi mở giải pháp khắc phục triệt để',
      format: 'Album Carousel (4-6 ảnh)' as PostFormatType,
    },
    {
      title: `Chương trình ưu đãi khởi động tháng mới: Đặc quyền chỉ dành cho 30 khách đầu tiên`,
      angle: 'Tạo cảm giác khan hiếm và động lực hành động ngay trong tuần đầu tháng',
      format: 'Single Post (1 ảnh)' as PostFormatType,
    },
    {
      title: `Quy trình làm việc 4 bước chuẩn mực cam kết chất lượng đầu ra vượt mong đợi`,
      angle: 'Minh bạch quy trình giúp khách hàng an tâm tuyệt đối khi hợp tác',
      format: 'Infographic / Hướng dẫn' as PostFormatType,
    },
    {
      title: `Case study thực tế: Chúng tôi đã đồng hành cùng khách hàng vượt khó ra sao?`,
      angle: 'Minh chứng thuyết phục bằng số liệu và kết quả thực tế',
      format: 'Album Carousel (4-6 ảnh)' as PostFormatType,
    },
    {
      title: `Góc chuyên gia: Lời khuyên vàng dành riêng cho bạn trước khi đưa ra quyết định`,
      angle: 'Chia sẻ kiến thức chuyên sâu xây dựng vị thế dẫn đầu trong ngành',
      format: 'Single Post (1 ảnh)' as PostFormatType,
    },
    {
      title: `Lắng nghe chia sẻ chân thực từ khách hàng đã trải nghiệm dịch vụ tại ${brandName}`,
      angle: 'Social proof người thật việc thật gia tăng độ tin cậy thương hiệu',
      format: 'Single Post (1 ảnh)' as PostFormatType,
    },
    {
      title: `Minigame tương tác: Bạn quan tâm yếu tố nào nhất khi lựa chọn đối tác?`,
      angle: 'Thấu hiểu mong muốn khách hàng và tăng lượt bình luận cho fanpage',
      format: 'Single Post (1 ảnh)' as PostFormatType,
    },
    {
      title: `Hậu trường sản xuất / chuẩn bị: Sự tỉ mỉ trong từng chi tiết nhỏ nhất`,
      angle: 'Bộc lộ cái tâm làm nghề và sự chăm chút dành cho khách hàng',
      format: 'Reels / Video ngắn' as PostFormatType,
    },
    {
      title: `Giải đáp 5 câu hỏi thường gặp nhất của khách hàng trước khi sử dụng dịch vụ`,
      angle: 'Xóa tan mọi băn khoăn và rào cản tâm lý mua hàng',
      format: 'Album Carousel (4-6 ảnh)' as PostFormatType,
    },
    {
      title: `Chính sách bảo hành & Đồng hành dài lâu: Lời hứa danh dự từ ${brandName}`,
      angle: 'Khẳng định trách nhiệm và cam kết hậu mãi vững chắc',
      format: 'Single Post (1 ảnh)' as PostFormatType,
    },
    {
      title: `Bật mí bí kíp tối ưu hiệu quả và tiết kiệm 30% ngân sách cho doanh nghiệp`,
      angle: 'Cẩm nang giá trị cao kích thích người đọc bấm Lưu bài viết',
      format: 'Infographic / Hướng dẫn' as PostFormatType,
    },
    {
      title: `Cột mốc đáng nhớ trong tháng: Cảm ơn sự đồng hành và tin tưởng của quý khách`,
      angle: 'Gửi lời tri ân chân thành, củng cố mối quan hệ gắn kết với khách hàng',
      format: 'Single Post (1 ảnh)' as PostFormatType,
    },
    {
      title: `Cuối tuần thư giãn: Những khoảnh khắc tích cực tiếp thêm năng lượng mới`,
      angle: 'Nội dung nhẹ nhàng, lan tỏa tinh thần lạc quan đến cộng đồng người theo dõi',
      format: 'Meme / Trích dẫn' as PostFormatType,
    },
    {
      title: `Ưu đãi chặng cuối tháng: Nhanh tay đăng ký để không bỏ lỡ cơ hội tốt nhất`,
      angle: 'Kêu gọi hành động dứt điểm trước khi kết thúc chu kỳ ưu đãi',
      format: 'Single Post (1 ảnh)' as PostFormatType,
    },
  ];
}

/**
 * Sinh danh sách bài viết cho toàn bộ một Tháng theo mô hình tần suất:
 * - 'daily': 1 ngày 1 bài (đăng mỗi ngày)
 * - 'every_other_day': 2 ngày 1 bài (đăng cách ngày)
 */
export function generateMonthlyPosts(
  brand: BrandProfile,
  year: number,
  month: number, // 1 - 12
  frequency: 'daily' | 'every_other_day',
  startFromDay: number = 1
): WeeklyPlanPost[] {
  const daysInMonth = getDaysInMonth(year, month);
  const brandPillars = getBrandPillars(brand);
  const topicLibrary = getMonthlyTopicLibrary(brand);
  const step = frequency === 'every_other_day' ? 2 : 1;

  const posts: WeeklyPlanPost[] = [];
  let postIndex = 0;

  for (let day = startFromDay; day <= daysInMonth; day += step) {
    const dateStr = formatDateYMD(year, month, day);
    const dayOfWeek = getVietnameseDayOfWeek(dateStr);
    const hour = COMMON_POSTING_HOURS[postIndex % COMMON_POSTING_HOURS.length];
    
    // Luân chuyển đều các trụ cột nội dung
    const pillarObj = brandPillars[postIndex % brandPillars.length];
    const pillarName: PostPillar = (pillarObj?.name || 'Chia sẻ kiến thức & Tips') as PostPillar;

    // Lấy ý tưởng từ thư viện đề xuất phong phú
    const templateTopic = topicLibrary[postIndex % topicLibrary.length];
    const title = templateTopic ? templateTopic.title : `Chủ đề bài viết ngày ${day}/${month}`;
    const angle = templateTopic ? templateTopic.angle : `Góc tiếp cận bám sát trụ cột ${pillarName}`;
    const postType = templateTopic ? templateTopic.format : COMMON_FORMATS[postIndex % COMMON_FORMATS.length];

    const post: WeeklyPlanPost = {
      id: `post_${year}_m${month}_d${day}_${Date.now()}_${postIndex + 1}`,
      dayOfWeek,
      publishDate: dateStr,
      publishTime: hour,
      pillar: pillarName,
      postType,
      title,
      topic: title,
      angle,
      targetAngle: angle,
      strategicIntent: pillarObj?.targetObjective || 'Xây dựng tương tác và củng cố nhận diện thương hiệu.',
      hook: '',
      caption: '',
      callToAction: '',
      hashtags: `#${(brand.name || 'HuDesign').replace(/\s+/g, '')} #${brand.industry ? brand.industry.split(' ')[0] : 'Fanpage'}`,
      stage: 'outline',
      topicApproval: 'pending',
      status: 'draft',
      designBrief: {
        aspectRatio: '4:5 (Dọc chuẩn Facebook)',
        headlineOnImage: title.toUpperCase().slice(0, 45),
        subTextOnImage: brand.name || 'Hủ Design',
        visualConcept: `Ấn phẩm thiết kế theo phong cách ${brand.designStyle || 'hiện đại'}, màu chủ đạo ${brand.colors?.primary || '#1E293B'}, tạo điểm nhấn thu hút trên newsfeed.`,
        moodAndTone: 'Chuyên nghiệp, ấn tượng, chỉn chu',
      },
    };

    posts.push(post);
    postIndex++;
  }

  return posts;
}
