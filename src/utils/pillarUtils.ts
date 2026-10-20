import { BrandProfile, BrandCustomPillar } from '../types';

export const DEFAULT_PILLARS: BrandCustomPillar[] = [
  {
    id: 'pillar_tips',
    name: 'Chia sẻ kiến thức & Tips',
    description: 'Cung cấp cẩm nang hữu ích, mẹo vặt thực chiến, giải đáp thắc mắc chuyên môn giúp khách hàng giải quyết vấn đề.',
    color: 'blue',
    targetObjective: 'Xây dựng vị thế chuyên gia và thúc đẩy khách hàng lưu (Save) hoặc chia sẻ (Share) bài viết.',
  },
  {
    id: 'pillar_sales',
    name: 'Bán hàng / Khuyến mãi',
    description: 'Giới thiệu sản phẩm/dịch vụ cốt lõi, chương trình khuyến mãi, gói combo đặc quyền, thúc đẩy quyết định mua hàng.',
    color: 'rose',
    targetObjective: 'Kích cầu doanh số và thu hút khách hàng inbox đặt hàng ngay.',
  },
  {
    id: 'pillar_engagement',
    name: 'Tương tác & Minigame',
    description: 'Tạo câu hỏi thảo luận, đố vui có thưởng, minigame nhận quà, bắt nhịp các tình huống đời thường gần gũi.',
    color: 'amber',
    targetObjective: 'Tăng đột phá lượt like, comment và kết nối cộng đồng người theo dõi.',
  },
  {
    id: 'pillar_story',
    name: 'Câu chuyện thương hiệu',
    description: 'Kể về nguồn gốc nguyên liệu, hậu trường làm việc, triết lý kinh doanh, tâm huyết của đội ngũ sáng lập.',
    color: 'purple',
    targetObjective: 'Chạm vào cảm xúc và xây dựng sự gắn kết dài hạn, biến khách hàng thành fan trung thành.',
  },
  {
    id: 'pillar_feedback',
    name: 'Feedback & Khách hàng',
    description: 'Chia sẻ cảm nhận thực tế, đánh giá chân thực, hình ảnh trải nghiệm của khách hàng để tạo niềm tin xã hội (Social Proof).',
    color: 'emerald',
    targetObjective: 'Phá bỏ rào cản do dự của khách hàng mới và củng cố uy tín dịch vụ.',
  },
  {
    id: 'pillar_trend',
    name: 'Bắt trend / Đời thường',
    description: 'Nội dung giải trí, meme văn phòng/đời thường hài hước, bắt nhịp xu hướng mạng xã hội khéo léo gắn với sản phẩm.',
    color: 'cyan',
    targetObjective: 'Tạo tiếng cười thư giãn và kích thích người đọc tag bạn bè vào bình luận.',
  },
];

// Lấy danh sách trụ cột của brand (nếu brand có customPillars thì dùng, ngược lại dùng mặc định)
export const getBrandPillars = (brand?: BrandProfile): BrandCustomPillar[] => {
  if (brand?.customPillars && Array.isArray(brand.customPillars) && brand.customPillars.length > 0) {
    return brand.customPillars;
  }
  return DEFAULT_PILLARS;
};

// Tìm thông tin chi tiết của trụ cột theo tên
export const getPillarInfo = (
  pillarName: string,
  brand?: BrandProfile
): BrandCustomPillar | undefined => {
  const pillars = getBrandPillars(brand);
  return (
    pillars.find((p) => p.name.trim().toLowerCase() === pillarName.trim().toLowerCase()) ||
    DEFAULT_PILLARS.find((p) => p.name.trim().toLowerCase() === pillarName.trim().toLowerCase())
  );
};

// Bảng màu cho từng color key với độ tương phản cao, chữ sắc nét cả nền sáng và tối
const COLOR_STYLES: Record<string, { badge: string; border: string; dot: string }> = {
  blue: {
    badge: 'bg-blue-100/90 dark:bg-blue-950/60 text-blue-950 dark:text-blue-200 border-blue-300 dark:border-blue-800 font-bold',
    border: 'border-blue-500',
    dot: 'bg-blue-500',
  },
  rose: {
    badge: 'bg-rose-100/90 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800 font-bold',
    border: 'border-rose-500',
    dot: 'bg-rose-500',
  },
  amber: {
    badge: 'bg-amber-100/90 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800 font-bold',
    border: 'border-amber-500',
    dot: 'bg-amber-500',
  },
  purple: {
    badge: 'bg-purple-100/90 dark:bg-purple-950/60 text-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-800 font-bold',
    border: 'border-purple-500',
    dot: 'bg-purple-500',
  },
  emerald: {
    badge: 'bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800 font-bold',
    border: 'border-emerald-500',
    dot: 'bg-emerald-500',
  },
  cyan: {
    badge: 'bg-cyan-100/90 dark:bg-cyan-950/60 text-cyan-950 dark:text-cyan-200 border-cyan-300 dark:border-cyan-800 font-bold',
    border: 'border-cyan-500',
    dot: 'bg-cyan-500',
  },
  indigo: {
    badge: 'bg-indigo-100/90 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 border-indigo-300 dark:border-indigo-800 font-bold',
    border: 'border-indigo-500',
    dot: 'bg-indigo-500',
  },
  orange: {
    badge: 'bg-orange-100/90 dark:bg-orange-950/60 text-orange-950 dark:text-orange-200 border-orange-300 dark:border-orange-800 font-bold',
    border: 'border-orange-500',
    dot: 'bg-orange-500',
  },
  teal: {
    badge: 'bg-teal-100/90 dark:bg-teal-950/60 text-teal-950 dark:text-teal-200 border-teal-300 dark:border-teal-800 font-bold',
    border: 'border-teal-500',
    dot: 'bg-teal-500',
  },
};

export const COLOR_OPTIONS: { id: string; label: string; bgClass: string }[] = [
  { id: 'blue', label: 'Xanh dương', bgClass: 'bg-blue-500' },
  { id: 'rose', label: 'Đỏ hồng', bgClass: 'bg-rose-500' },
  { id: 'amber', label: 'Vàng cam', bgClass: 'bg-amber-500' },
  { id: 'purple', label: 'Tím mộng mơ', bgClass: 'bg-purple-500' },
  { id: 'emerald', label: 'Xanh lục bảo', bgClass: 'bg-emerald-500' },
  { id: 'cyan', label: 'Xanh ngọc', bgClass: 'bg-cyan-500' },
  { id: 'indigo', label: 'Xanh chàm', bgClass: 'bg-indigo-500' },
  { id: 'orange', label: 'Cam nhiệt đới', bgClass: 'bg-orange-500' },
  { id: 'teal', label: 'Xanh Teal', bgClass: 'bg-teal-500' },
];

export const getPillarColorStyle = (
  pillarName: string,
  brand?: BrandProfile
): { badge: string; border: string; dot: string } => {
  const info = getPillarInfo(pillarName, brand);
  const colorKey = info?.color || 'blue';
  return COLOR_STYLES[colorKey] || COLOR_STYLES.blue;
};

// Gợi ý danh sách trụ cột chuyên sâu theo từng ngành nghề mẫu
export const INDUSTRY_PILLAR_TEMPLATES: {
  industryName: string;
  industryKeyword: string;
  pillars: Omit<BrandCustomPillar, 'id'>[];
}[] = [
  {
    industryName: 'Giao Vận / Logistics / Chuyển Phát (như Citiship)',
    industryKeyword: 'vận chuyển, logistics, giao hàng, shipper, bưu cục, chuyển phát',
    pillars: [
      {
        name: 'Góc Chủ Shop & Đơn Hàng',
        description: 'Tập trung vào nỗi đau và giải pháp cho chủ shop online: cách giảm tỷ lệ hoàn đơn, đối soát COD 24h, bảo quản hàng dễ vỡ.',
        color: 'blue',
        targetObjective: 'Tăng uy tín đối với đối tác kinh doanh và chủ shop bán lẻ.',
      },
      {
        name: 'Gói Cước & Khuyến Mãi',
        description: 'Bảng giá cước siêu tốc, ưu đãi đồng giá nội thành, chính sách chiết khấu nạp ví cho khách hàng thân thiết.',
        color: 'rose',
        targetObjective: 'Thúc đẩy khách đăng ký tạo đơn ngay trong tuần.',
      },
      {
        name: 'Hành Trình Shipper & Tận Tâm',
        description: 'Câu chuyện người thật việc thật: những chuyến xe đội mưa giao hàng, sự chu đáo và thái độ niềm nở của đội ngũ giao vận.',
        color: 'purple',
        targetObjective: 'Tạo thiện cảm sâu sắc và xây dựng hình ảnh thương hiệu có trách nhiệm.',
      },
      {
        name: 'Cẩm Nang Đóng Gói Chuẩn Sàn',
        description: 'Hướng dẫn quấn bóng khí, dán tem hàng dễ vỡ, quy chuẩn đóng thùng carton không bị móp méo.',
        color: 'emerald',
        targetObjective: 'Kích thích khách hàng lưu bài viết để tra cứu khi đóng hàng.',
      },
      {
        name: 'Phản Hồi Khách Quen & Bảo Hiểm',
        description: 'Feedback các shop hợp tác lâu năm, cam kết đền bù 100% khi xảy ra sự cố ngoài ý muốn.',
        color: 'amber',
        targetObjective: 'Triệt tiêu nỗi lo mất mát hàng hóa và củng cố niềm tin tuyệt đối.',
      },
      {
        name: 'Chuyện Nghề Giao Hàng & Hài Hước',
        description: 'Các tình huống dở khóc dở cười khi đi giao hàng, câu chuyện shipper và khách nhận tạo tiếng cười thư giãn.',
        color: 'cyan',
        targetObjective: 'Thu hút bình luận và chia sẻ viral tự nhiên trên Facebook.',
      },
    ],
  },
  {
    industryName: 'F&B - Cà Phê, Trà & Đồ Uống',
    industryKeyword: 'f&b, cà phê, trà, quán cafe, bánh ngọt, nhà hàng, đồ uống',
    pillars: [
      {
        name: 'Kiến Thức Hạt & Kỹ Thuật Pha',
        description: 'Phân biệt Arabica/Robusta, mẹo ủ Cold Brew tại nhà, tỷ lệ nước và nhiệt độ pha Pour-Over hoàn hảo.',
        color: 'blue',
        targetObjective: 'Định vị gu thưởng thức sành điệu và thương hiệu chuyên nghiệp.',
      },
      {
        name: 'Menu Mới & Ưu Đãi Giờ Vàng',
        description: 'Ra mắt món signature theo mùa, combo cà phê + bánh ngọt văn phòng, deal mang đi tiện lợi.',
        color: 'rose',
        targetObjective: 'Kích thích khách ghé quán hoặc đặt giao hàng trong ngày.',
      },
      {
        name: 'Góc Quán, Nhạc & Cảm Xúc',
        description: 'Không gian yên tĩnh làm việc cho Freelancer, góc ngắm mưa, cảm xúc đầu tuần thư thái bên tách cà phê.',
        color: 'amber',
        targetObjective: 'Thu hút khách hàng tìm kiếm địa điểm check-in và làm việc lý tưởng.',
      },
      {
        name: 'Nông Trại & Hạt Rang Mộc',
        description: 'Hành trình từ nông trại Cầu Đất đến xưởng rang, câu chuyện về người nông dân hái chín 100%.',
        color: 'purple',
        targetObjective: 'Truyền tải giá trị nguyên bản và tình yêu với hạt cà phê Việt.',
      },
      {
        name: 'Cảm Nhận Khách Hàng & Workshop',
        description: 'Khoảnh khắc khách hàng thân thiết, hình ảnh workshop nếm cà phê cupping miễn phí cuối tuần.',
        color: 'emerald',
        targetObjective: 'Xây dựng cộng đồng người yêu cà phê gắn bó.',
      },
    ],
  },
  {
    industryName: 'Nghệ Thuật Thủ Công, Gốm Sứ & Decor',
    industryKeyword: 'gốm, thủ công, handmade, trà đạo, decor, mỹ thuật, wabi-sabi',
    pillars: [
      {
        name: 'Nghệ Thuật Đất & Men Tro Độc Bản',
        description: 'Quy trình vuốt tay trên bàn xoay, bí mật bài men tro tự nhiên, triết lý vẻ đẹp mộc mạc Wabi-Sabi.',
        color: 'indigo',
        targetObjective: 'Tôn vinh giá trị lao động thủ công và độ độc bản của từng tác phẩm.',
      },
      {
        name: 'Trà Đạo & Nghệ Thuật Sống Chậm',
        description: 'Cách dưỡng ấm trà, chọn chén theo loại trà, tạo không gian thiền định sau ngày dài bận rộn.',
        color: 'teal',
        targetObjective: 'Thu hút tệp khách yêu thích phong cách sống bình yên, có chiều sâu.',
      },
      {
        name: 'Workshop Trải Nghiệm Cuối Tuần',
        description: 'Lịch workshop tự tay nặn gốm thứ 7 & Chủ Nhật, thành phẩm đáng yêu của các học viên.',
        color: 'amber',
        targetObjective: 'Kêu gọi đăng ký giữ chỗ cho các buổi trải nghiệm.',
      },
      {
        name: 'Bộ Sưu Tập Giới Hạn & Đặt Hàng',
        description: 'Giới thiệu mẻ gốm mới ra lò, các bộ ấm chén số lượng giới hạn kèm quà tặng đóng gói hộp mộc.',
        color: 'rose',
        targetObjective: 'Thúc đẩy mua sắm sưu tầm hoặc làm quà tặng tinh tế.',
      },
    ],
  },
  {
    industryName: 'Thời Trang, Mỹ Phẩm & Làm Đẹp',
    industryKeyword: 'thời trang, mỹ phẩm, skincare, quần áo, spa, làm đẹp',
    pillars: [
      {
        name: 'Bí Quyết Phối Đồ & Skincare Đúng Cách',
        description: 'Mix & match trang phục theo dáng người, quy trình chăm sóc da chuẩn y khoa, mẹo chọn tone màu.',
        color: 'blue',
        targetObjective: 'Tạo giá trị thực tế khiến người xem bấm lưu bài viết.',
      },
      {
        name: 'Bộ Sưu Tập Mới & Ưu Đãi Flash Sale',
        description: 'Lookbook mùa mới, chương trình giảm giá đặc quyền, quà tặng kèm đơn hàng giá trị cao.',
        color: 'rose',
        targetObjective: 'Tạo cảm giác cấp bách để chốt đơn ngay lập tức.',
      },
      {
        name: 'Feedback Thực Tế & Before/After',
        description: 'Hình ảnh khách hàng mặc đồ thực tế, làn da cải thiện sau liệu trình, review chân thật.',
        color: 'emerald',
        targetObjective: 'Tạo sự tin tưởng tuyệt đối về chất lượng sản phẩm.',
      },
      {
        name: 'Chuyện Hậu Trường & Chất Liệu',
        description: 'Quy trình chọn vải sợi tự nhiên, kỹ thuật may đo tinh xảo hoặc thành phần lành tính an toàn.',
        color: 'purple',
        targetObjective: 'Định vị thương hiệu cao cấp và chỉn chu.',
      },
    ],
  },
];
