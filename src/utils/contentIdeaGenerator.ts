import { PostPillar, PostFormatType, BrandProfile } from '../types';

export interface GeneratedIdea {
  id: string;
  title: string;
  hook: string;
  pillar: PostPillar;
  postType: PostFormatType;
  captionPreview: string;
  callToAction: string;
  hashtags: string;
  designBriefSuggestion: {
    aspectRatio: '1:1 (Vuông)' | '4:5 (Dọc chuẩn Facebook)' | '9:16 (Story / Reel)' | '16:9 (Ngang)' | 'Album 4 ảnh (1 dọc 3 vuông)';
    headlineOnImage: string;
    visualConcept: string;
    moodAndTone: string;
  };
}

export const generateContentIdeas = (
  topic: string,
  brand?: BrandProfile,
  pillar?: PostPillar
): GeneratedIdea[] => {
  const brandName = brand?.name || 'Thương hiệu';
  const cleanTopic = topic.trim() || 'Chia sẻ giá trị và kết nối khách hàng';
  const industry = brand?.industry || 'Dịch vụ & Bán lẻ';
  const brandTone = brand?.toneOfVoice || 'Thân thiện, chuyên nghiệp';

  const defaultIdeas: GeneratedIdea[] = [
    {
      id: `idea_${Date.now()}_1`,
      title: `Bí quyết ${cleanTopic} chuẩn chuyên gia mà ít người để ý`,
      hook: `Đừng vội bỏ qua nếu bạn đang tìm kiếm giải pháp tối ưu cho ${cleanTopic.toLowerCase()}!`,
      pillar: pillar || 'Chia sẻ kiến thức & Tips',
      postType: 'Album Carousel (4-6 ảnh)',
      captionPreview: `Bạn có biết vì sao rất nhiều người gặp khó khăn khi triển khai ${cleanTopic.toLowerCase()}?\n\nHôm nay ${brandName} sẽ chia sẻ cùng bạn 3 nguyên tắc vàng giúp bạn nắm bắt dễ dàng và tiết kiệm đến 50% thời gian!\n\n👉 Xem chi tiết từng slide ảnh để áp dụng ngay nhé!`,
      callToAction: `Lưu lại bài viết này hoặc chia sẻ cho bạn bè cùng biết nhé!`,
      hashtags: `#${brandName.replace(/\s+/g, '')} #${cleanTopic.replace(/\s+/g, '')} #KienThuc #TipsHay #ChuyenNghiep`,
      designBriefSuggestion: {
        aspectRatio: 'Album 4 ảnh (1 dọc 3 vuông)',
        headlineOnImage: `3 BÍ QUYẾT: ${cleanTopic.toUpperCase()}`,
        visualConcept: `Bộ ảnh Album thông tin Carousel tối giản. Slide 1 là ảnh chụp chủ thể kèm chữ nổi bật, các slide sau sử dụng đồ họa thông tin, mũi tên chỉ dẫn theo màu nhận diện thương hiệu.`,
        moodAndTone: `Hiện đại, tri thức, rõ ràng và mạch lạc.`,
      },
    },
    {
      id: `idea_${Date.now()}_2`,
      title: `Đằng sau câu chuyện ${cleanTopic} tại ${brandName}`,
      hook: `Có những chi tiết nhỏ nhưng nếu không đủ tâm huyết, chắc chắn tụi mình sẽ không thể làm trọn vẹn...`,
      pillar: 'Câu chuyện thương hiệu',
      postType: 'Single Post (1 ảnh)',
      captionPreview: `Mỗi sản phẩm hay dịch vụ khi ra đời đều mang theo một câu chuyện riêng.\n\nVới chủ đề "${cleanTopic}", ${brandName} luôn tâm niệm rằng sự chỉn chu từ những điều nhỏ bé nhất chính là lời cảm ơn chân thành gửi đến bạn.\n\nCùng nhìn lại những khoảnh khắc hậu trường và tâm huyết của đội ngũ tụi mình nhé!`,
      callToAction: `Bạn có cảm nhận gì về câu chuyện này? Hãy để lại một dòng bình luận cho tụi mình biết nhé!`,
      hashtags: `#${brandName.replace(/\s+/g, '')} #Storytelling #BehindTheScenes #GiaTriThat`,
      designBriefSuggestion: {
        aspectRatio: '4:5 (Dọc chuẩn Facebook)',
        headlineOnImage: `TẬN TÂM TRONG TỪNG CHI TIẾT`,
        visualConcept: `Ảnh chụp góc cận cảnh hậu trường làm việc thực tế, ánh sáng tự nhiên, ấm áp, có sự xuất hiện của bàn tay con người đang chăm chút sản phẩm.`,
        moodAndTone: `Chân thực, xúc cảm, ấm cúng và gần gũi.`,
      },
    },
    {
      id: `idea_${Date.now()}_3`,
      title: `Ưu đãi giới hạn: Trải nghiệm ${cleanTopic} nhận quà đặc biệt`,
      hook: `Chỉ dành riêng cho tuần này: Cơ hội đặc biệt để bạn trải nghiệm ${cleanTopic.toLowerCase()} với mức giá cực kỳ hấp dẫn!`,
      pillar: 'Bán hàng / Khuyến mãi',
      postType: 'Single Post (1 ảnh)',
      captionPreview: `Nhằm tri ân sự ủng hộ của tất cả khách hàng thân yêu, ${brandName} gửi tặng bạn chương trình ưu đãi độc quyền:\n\n🎁 Tặng ngay voucher ưu đãi hấp dẫn khi đăng ký trải nghiệm ${cleanTopic.toLowerCase()}\n⏰ Thời gian áp dụng: Từ hôm nay đến hết Chủ Nhật tuần này\n\nSố lượng có hạn, nhanh tay để không bỏ lỡ bạn nhé!`,
      callToAction: `Nhắn tin (Inbox) cho Fanpage ngay hôm nay để nhận mã ưu đãi độc quyền!`,
      hashtags: `#${brandName.replace(/\s+/g, '')} #UuDaiDacBiet #KhuyenMaiTuan #DealHot`,
      designBriefSuggestion: {
        aspectRatio: '4:5 (Dọc chuẩn Facebook)',
        headlineOnImage: `ƯU ĐÃI ĐỘC QUYỀN • TUẦN NÀY`,
        visualConcept: `Hình ảnh sản phẩm/dịch vụ chính đặt nổi bật ở trung tâm, bố cục banner khuyến mãi sắc nét, có tag badge giảm giá tinh tế, không sến súa.`,
        moodAndTone: `Bắt mắt, năng động, thôi thúc hành động ngay nhưng vẫn giữ đúng quy chuẩn thương hiệu.`,
      },
    },
    {
      id: `idea_${Date.now()}_4`,
      title: `Minigame / Thử thách tương tác: Bạn chọn phương án nào cho ${cleanTopic}?`,
      hook: `1 phút trổ tài đoán đúng - nhận ngay phần quà siêu xịn từ ${brandName}!`,
      pillar: 'Tương tác & Minigame',
      postType: 'Single Post (1 ảnh)',
      captionPreview: `Một trò chơi nhỏ dành cho các tín đồ của ${brandName} giải trí giữa tuần đây!\n\nHãy nhìn vào hình ảnh và chọn đáp án chính xác nhất về ${cleanTopic.toLowerCase()}:\n🅰️ Phương án A\n🅱️ Phương án B\n\n🎁 03 phần quà bất ngờ sẽ được trao cho 3 bạn may mắn có câu trả lời đúng và sớm nhất!`,
      callToAction: `Bình luận đáp án của bạn kèm 1 con số may mắn từ 00-99 ngay bên dưới nhé!`,
      hashtags: `#${brandName.replace(/\s+/g, '')} #Minigame #NhanQua #TuongTacFanpage`,
      designBriefSuggestion: {
        aspectRatio: '1:1 (Vuông)',
        headlineOnImage: `ĐOÁN ĐÚNG • NHẬN QUÀ XỊN`,
        visualConcept: `Bố cục so sánh 2 nửa (A vs B) với đồ họa sinh động, câu hỏi ngắn gọn, font chữ to rõ ràng dễ đọc lướt trên điện thoại.`,
        moodAndTone: `Tươi vui, mời gọi tương tác, màu sắc bắt mắt.`,
      },
    },
    {
      id: `idea_${Date.now()}_5`,
      title: `Phản hồi thực tế từ khách hàng sau khi trải nghiệm ${cleanTopic}`,
      hook: `"Trước đây mình từng rất đắn đo, nhưng sau khi thử thì hoàn toàn bất ngờ!" - Cảm nhận từ một vị khách đặc biệt.`,
      pillar: 'Feedback & Khách hàng',
      postType: 'Single Post (1 ảnh)',
      captionPreview: `Không có gì làm ${brandName} hạnh phúc hơn việc đọc những dòng tin nhắn feedback dễ thương từ khách hàng sau khi trải nghiệm.\n\nCảm ơn bạn đã tin tưởng và đồng hành cùng ${brandName} trong suốt thời gian qua. Đọc trọn vẹn cảm nhận bên dưới để hiểu vì sao dịch vụ này lại được yêu mến đến vậy nhé!`,
      callToAction: `Bạn đã trải nghiệm dịch vụ chưa? Hãy để lại cảm nhận cho tụi mình cùng biết với nha!`,
      hashtags: `#${brandName.replace(/\s+/g, '')} #CustomerFeedback #DanhGiaThat #CamOnKhachHang`,
      designBriefSuggestion: {
        aspectRatio: '4:5 (Dọc chuẩn Facebook)',
        headlineOnImage: `NHỮNG DÒNG TIN NHẮN DỄ THƯƠNG`,
        visualConcept: `Chèn mockup đoạn chat tin nhắn feedback chân thực của khách (che tên nhạy cảm), kèm bức ảnh sản phẩm hoặc nụ cười khách hàng nhẹ nhàng phía sau.`,
        moodAndTone: `Đáng tin cậy, ấm lòng, mộc mạc và chân thực.`,
      },
    },
  ];

  return defaultIdeas;
};
