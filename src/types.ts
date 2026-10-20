export type ProjectStatus = 'active' | 'pending' | 'completed' | 'paused';

export interface ClientPackageConfig {
  hasMonthlyPackage: boolean;
  packageName?: string; // Ví dụ: "Gói 15 post / tháng", "Gói 25 post / tháng"
  totalPostsPerMonth: number; // Ví dụ: 15, 25, 30
  activeMonth?: string; // Tháng áp dụng (Định dạng "YYYY-MM", ví dụ "2026-09")
  startDate?: string;
  endDate?: string;
  pricePerMonth?: number;
  notes?: string;
}

export interface Client {
  id: string;
  slug?: string; // URL slug cho khách: ví dụ "citiship", "vintage-roastery"
  name: string;
  company: string;
  email: string;
  phone: string;
  address?: string;
  taxId?: string;
  status: ProjectStatus;
  notes?: string;
  avatar?: string;
  createdAt: string;
  packageConfig?: ClientPackageConfig; // Gói thiết kế theo tháng
  assignedPricingBoardId?: string; // Bảng giá dịch vụ gán cho khách này
}

export type DesignCategory =
  | 'Branding & Logo'
  | 'Packaging & Bao bì'
  | 'Social Media & Quảng cáo'
  | 'UI/UX Website & App'
  | 'Ấn phẩm in ấn (Brochure/Catalogue)'
  | 'Key Visual & Poster'
  | '3D & Motion Graphic'
  | 'Khác';

export type DesignStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface DesignImage {
  id: string;
  url: string; // Data URL, blob or Drive link
  name?: string;
  driveFileId?: string;
  driveFileUrl?: string;
  driveThumbnailUrl?: string;
  uploadedAt?: string;
}

export interface DesignItem {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  category: DesignCategory;
  brief: string;
  moodboardUrls: string[];
  demoImageUrl?: string;
  demoImages?: DesignImage[]; // Danh sách nhiều hình ảnh của bài thiết kế này
  driveFileId?: string;
  driveFileUrl?: string;
  driveThumbnailUrl?: string;
  driveFolderId?: string; // ID thư mục con riêng của bài thiết kế
  driveFolderUrl?: string; // Link thư mục con riêng của bài thiết kế: [Khách]/[Tên bài]
  clientFolderUrl?: string; // Link thư mục khách hàng (thư mục cha)
  deadline: string;
  priority: PriorityLevel;
  status: DesignStatus;
  unitPrice: number;
  quantity: number;
  unit: string; // 'Gói' | 'Bộ' | 'Mẫu' | 'Trang' | 'Bài'
  deliverables?: string;
  clientFeedback?: string;
  postQuota?: number; // Số lượng post tính vào gói tháng (1: 1 hình, 2: multi 4 hình, 3: 5+ hình...)
  targetMonth?: string; // Tháng áp dụng tính gói (ví dụ "2026-09")
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  id: string;
  designItemId?: string;
  title: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  driveFileUrl?: string;
  demoImageUrl?: string;
}

export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'paid' | 'cancelled';

export interface Quotation {
  id: string;
  quotationNumber: string;
  clientId: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  issueDate: string;
  validUntil: string;
  items: QuotationItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  vatPercent: number;
  vatAmount: number;
  total: number;
  depositPercent: number;
  depositAmount: number;
  notes: string;
  paymentTerms: string;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    branch?: string;
    qrImage?: string;
  };
  status: QuotationStatus;
  createdAt: string;
}

export type VideoPlatform = 'tiktok' | 'youtube';
export type VideoFormat = 'short' | 'long' | 'reel' | 'tutorial' | 'behind_scenes';
export type ContentStatus = 'idea' | 'scripted' | 'filming' | 'editing' | 'production' | 'published';

export interface ScriptBodySegment {
  segment: string;
  visual: string;
  audio: string;
  duration: string;
}

export interface VideoScript {
  title: string;
  hook: string;
  hookVisual: string;
  body: ScriptBodySegment[];
  callToAction: string;
  ctaVisual: string;
  suggestedHashtags: string[];
  productionNotes: string;
}

export interface VideoContent {
  id: string;
  title: string;
  platform: VideoPlatform;
  format: VideoFormat;
  status: ContentStatus;
  rawIdea: string;
  script?: VideoScript;
  scheduledDate: string;
  tags: string[];
  targetViews?: number;
  actualViews?: number;
  videoLink?: string;
  videoUrl?: string;
  duration?: string;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudioProfile {
  studioName: string;
  tagline: string;
  founder: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  bankName: string;
  bankAccount: string;
  bankOwner: string;
  bankBranch: string;
  bankQrImage?: string;
  defaultPaymentTerms: string;
  defaultNote: string;
}

export type PricingLayoutType = 'cards' | 'rows';

export type PricingColorTheme = 'green' | 'blue' | 'purple' | 'orange' | 'pink' | 'emerald' | 'indigo' | 'red' | 'dark';

export interface PricingFeatureItem {
  id: string;
  text: string;
  included: boolean; // true: icon check xanh/màu, false: icon x xám
}

export interface PricingTierCard {
  id: string;
  name: string; // VD: CƠ BẢN, PHỔ THÔNG, KIT CORE...
  price: string; // VD: 700.000 VNĐ, 1.000.000 VNĐ, 350.000 - 450.000 VNĐ, 200.000 VNĐ / Post
  subtitle?: string; // VD: Khởi đầu chuyên nghiệp cho Shop nhỏ
  colorTheme: PricingColorTheme;
  iconName?: string; // zap, star, shield, crown, sparkles, layers, monitor, palette...
  isPopular?: boolean; // Hiển thị badge "KHUYÊN DÙNG" / "HOT"
  popularBadgeText?: string; // VD: "KHUYÊN DÙNG"
  buttonText: string; // "CHỌN GÓI NÀY", "ĐẶT THIẾT KẾ", "TƯ VẤN NGAY"
  features: PricingFeatureItem[];
  description?: string; // Dành cho layout rows
}

export interface PricingTermItem {
  id: string;
  iconName?: string;
  title: string; // VD: "Thời gian demo & bàn giao", "Quy trình tạm ứng & thanh toán"...
  content: string; // Nội dung chi tiết
}

export interface ServicePricingBoard {
  id: string;
  title: string; // VD: "BẢNG GIÁ THIẾT KẾ LOGO", "BRANDING KIT COMBO", "SOCIAL MEDIA"
  subtitle: string; // VD: "Chọn gói phù hợp với quy mô doanh nghiệp của bạn"
  layoutType: PricingLayoutType; // 'cards' (cột so sánh) hoặc 'rows' (danh sách lẻ)
  category: string;
  tiers: PricingTierCard[];
  terms: PricingTermItem[];
  showTerms: boolean;
  showContactFooter: boolean;
  contactNote?: string;
  watermarkText?: string;
  updatedAt: string;
}

// ==========================================
// FANPAGE CONTENT & DESIGN WEEKLY PLANNER
// ==========================================

export interface BrandColorConfig {
  primary: string; // Mã HEX (VD: #1E293B)
  secondary: string; // #3B82F6
  accent?: string; // #F59E0B
  background?: string; // #FFFFFF
}

export interface BrandFontConfig {
  primaryFont: string; // Font chính (VD: Montserrat / Be Vietnam Pro)
  headingFont: string; // Font tiêu đề (VD: Playfair Display / SVN-Futura)
  fontNotes?: string;
}

export interface BrandStrategy {
  targetAudience: string; // Chân dung khách hàng chi tiết (Nhân khẩu học, hành vi, bối cảnh)
  customerPainPoints: string[]; // Nỗi đau thầm kín & vấn đề nhức nhối thực tế
  coreUSP: string; // Lợi thế cạnh tranh độc nhất (Unique Selling Proposition)
  buyingObjections: string[]; // Rào cản tâm lý khi chi tiền / chọn dịch vụ
  brandVoiceKeywords: string[]; // Từ khóa phong cách giọng văn & cách xưng hô
  strategicContentAngles: string[]; // Các góc tiếp cận nội dung "đắt giá" của ngành
  contentPillarsAllocation?: { pillar: string; percent: number; objective: string }[]; // Tỷ lệ phân bổ trụ cột
}

export interface SocialDesignSpecs {
  safeZoneNote?: string; // Vùng an toàn (VD: Cách mép 80-100px, tránh các vùng UI của Facebook/Instagram)
  logoPlacement?: string; // Vị trí đặt logo (VD: Góc trên cùng bên phải, kích thước max 12% chiều ngang)
  textOverlayRule?: string; // Quy tắc chữ trên ảnh (VD: Tối đa 20% khung hình, dùng font Heading tương phản cao)
  imageStyleNote?: string; // Phong cách hình ảnh (VD: Chụp góc cận, ánh sáng tự nhiên, tone ấm, hạn chế ảnh stock)
  graphicElementsNote?: string; // Khối hình & Họa tiết nhận diện (VD: Khung bo góc 16px, đường line mảnh 1.5px, icon tối giản)
  aspectRatioRules?: { ratio: string; size: string; purpose: string }[];
}

export interface BrandDemoImage {
  id: string;
  title: string; // VD: Ấn phẩm Single Post - Chương trình Chào Hè
  type: 'single_post' | 'vertical_poster' | 'story' | 'carousel' | 'cover' | 'other';
  imageUrl: string; // URL ảnh hoặc Base64 data URL
  caption?: string;
  aspectRatio?: '1:1' | '4:5' | '9:16' | '16:9';
}

export interface BrandProfile {
  id: string;
  name: string; // Tên thương hiệu (VD: The Vintage Roastery, Gốm Mộc Art Cafe...)
  clientId?: string; // Liên kết với danh sách Client nếu có
  fanpageName: string; // Tên hiển thị Fanpage
  fanpageUrl?: string;
  industry: string; // Lĩnh vực (F&B, Mỹ phẩm, Thời trang, Vận chuyển, v.v.)
  businessDescription?: string; // Mô tả hoạt động kinh doanh, sản phẩm/dịch vụ cốt lõi, đối tượng khách hàng mục tiêu để AI hiểu sâu
  brandStrategy?: BrandStrategy; // Bản đồ phân tích chiến lược thương hiệu chuyên sâu
  logoUrl?: string; // URL ảnh logo thương hiệu
  driveFolderUrl?: string; // Link Drive tư liệu thương hiệu
  colors: BrandColorConfig;
  fonts: BrandFontConfig;
  designStyle: string; // VD: Tối giản hiện đại (Minimalism), tone màu ấm, nhiều khoảng thở
  toneOfVoice: string; // VD: Chân thành, ấm áp, lịch sự, xưng 'Nhà...' - 'Bạn'
  dos: string[]; // Những điều NÊN làm
  donts: string[]; // Những điều CẤM KỴ
  socialSpecs?: SocialDesignSpecs; // Quy cách thiết kế chung cho Social Media
  demoImages?: BrandDemoImage[]; // Bộ ảnh thiết kế demo của thương hiệu
  customPillars?: BrandCustomPillar[]; // Danh sách các trụ cột nội dung tùy chỉnh riêng của thương hiệu
  generalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandCustomPillar {
  id: string;
  name: string; // Tên trụ cột (VD: "Chia sẻ kiến thức & Tips", "Menu & Món mới", "Bí kíp đóng gói Citiship"...)
  description?: string; // Định hướng nội dung / Mô tả chủ đề bài viết bám vào (VD: Giải thích chi tiết về kỹ thuật, hướng dẫn mẹo vặt, chia sẻ trải nghiệm thực tế...)
  color?: string; // Tên màu hoặc mã màu nhận diện (VD: blue, rose, amber, purple, emerald, cyan, indigo...)
  targetObjective?: string; // Mục tiêu tương tác (VD: Tăng uy tín chuyên môn, Chốt đơn, Tăng thảo luận...)
}

export type PostPillar = 
  | 'Bán hàng / Khuyến mãi'
  | 'Chia sẻ kiến thức & Tips'
  | 'Tương tác & Minigame'
  | 'Câu chuyện thương hiệu'
  | 'Feedback & Khách hàng'
  | 'Bắt trend / Đời thường'
  | (string & {});

export type PostFormatType = 
  | 'Single Post (1 ảnh)'
  | 'Album Carousel (4-6 ảnh)'
  | 'Reels / Video ngắn'
  | 'Infographic / Hướng dẫn'
  | 'Meme / Trích dẫn';

export type PostStatus = 'draft' | 'pending_approval' | 'approved' | 'designed' | 'published';

export interface PostDesignBrief {
  aspectRatio: '1:1 (Vuông)' | '4:5 (Dọc chuẩn Facebook)' | '9:16 (Story / Reel)' | '16:9 (Ngang)' | 'Album 4 ảnh (1 dọc 3 vuông)';
  headlineOnImage: string; // Chữ chính đè trên ảnh
  subTextOnImage?: string; // Chữ phụ
  visualConcept: string; // Mô tả bố cục, hình chụp hay vẽ, phối màu
  moodAndTone: string; // Cảm xúc, ánh sáng, style ảnh
  assetNotes?: string; // Link ảnh raw / Drive cần dùng
}

export interface WeeklyPlanPost {
  id: string;
  dayOfWeek: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6' | 'Thứ 7' | 'Chủ Nhật';
  publishDate: string; // YYYY-MM-DD
  publishTime: string; // ví dụ: "08:30", "11:30", "19:30", "20:00"
  pillar: PostPillar;
  postType: PostFormatType;
  title: string; // Tiêu đề / Chủ đề bài viết
  hook: string; // 3 giây đầu / Dòng mở đầu giật tít
  caption: string; // Nội dung đầy đủ bài viết
  callToAction: string; // Lời kêu gọi hành động (CTA)
  hashtags: string; // Bộ hashtag
  strategicIntent?: string; // Ý đồ chiến lược: Giải quyết nỗi đau/rào cản nào, thúc đẩy mục tiêu gì
  targetAngle?: string; // Góc tiếp cận: Khai phá nỗi sợ, Case study thực tế, Bẻ gãy rào cản giá, Social Proof...
  topic?: string; // Chủ đề cốt lõi / Tóm tắt ý tưởng truyền thông
  angle?: string; // Góc tiếp cận tóm tắt cho khách hàng duyệt sườn
  stage?: 'outline' | 'full_content'; // 'outline': mới lên sườn đề xuất | 'full_content': đã viết chi tiết hoàn chỉnh
  topicApproval?: 'pending' | 'approved' | 'rejected' | 'revised'; // Trạng thái duyệt sườn chủ đề từ khách hàng
  designBrief: PostDesignBrief;
  designedImageUrl?: string; // Link ảnh thiết kế đã làm xong (ảnh trực tiếp hoặc link Drive/Figma/Cloudinary)
  status: PostStatus;
  clientNote?: string; // Nhận xét / yêu cầu chỉnh sửa từ khách hàng
}

export interface WeeklyPlan {
  id: string;
  brandId: string;
  title: string; // VD: Kế hoạch tuần 36 (01/09 - 07/09)
  weekNumber: number;
  year: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  mainGoal: string; // Mục tiêu tuần
  status: 'draft' | 'pending_approval' | 'approved' | 'in_progress' | 'completed';
  outlineStatus?: 'draft' | 'submitted_to_client' | 'topics_approved' | 'in_writing' | 'completed'; // Trạng thái tiến độ duyệt sườn & viết bài
  posts: WeeklyPlanPost[];
  clientFeedback?: string;
  planType?: 'month' | 'week'; // 'month': Kế hoạch theo tháng, 'week': Kế hoạch theo tuần
  monthNumber?: number; // 1 - 12 (khi planType === 'month')
  postingFrequency?: 'daily' | 'every_other_day' | 'weekly_custom'; // 'daily': 1 ngày 1 bài, 'every_other_day': 2 ngày 1 bài
  createdAt: string;
  updatedAt: string;
}

