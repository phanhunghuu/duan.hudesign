import React, { useState } from 'react';
import { BrandProfile, WeeklyPlan, WeeklyPlanPost, PostPillar } from '../types';
import { 
  Calendar, 
  X, 
  Sparkles, 
  Check, 
  Clock, 
  FileText, 
  CalendarRange, 
  Zap, 
  Layers, 
  ArrowRight 
} from 'lucide-react';
import { getVietnameseDayOfWeek } from '../utils/dateUtils';
import { getBrandPillars } from '../utils/pillarUtils';

interface CreateMonthPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: BrandProfile;
  onCreateMonthPlan?: (newPlan: WeeklyPlan) => void;
  onCreatePlan?: (newPlan: WeeklyPlan) => void;
  isLight: boolean;
}

export const CreateMonthPlanModal: React.FC<CreateMonthPlanModalProps> = ({
  isOpen,
  onClose,
  brand,
  onCreateMonthPlan,
  onCreatePlan,
  isLight,
}) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [frequency, setFrequency] = useState<'every_other_day' | 'daily' | 'custom'>('every_other_day');
  const [customPostCount, setCustomPostCount] = useState<number>(15);
  const [mainGoal, setMainGoal] = useState<string>(
    brand.industry.toLowerCase().includes('ship') || brand.industry.toLowerCase().includes('vận chuyển')
      ? 'Đẩy mạnh nhận diện dịch vụ giao hàng nhanh, tăng lượng shop đặt đơn nội ô và củng cố niềm tin'
      : `Đẩy mạnh tương tác Fanpage và xây dựng uy tín thương hiệu ${brand.name} trong tháng`
  );
  const [autoSeedPosts, setAutoSeedPosts] = useState<boolean>(true);

  if (!isOpen) return null;

  // Tính số ngày trong tháng
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const monthStr = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;
  const startDate = `${selectedYear}-${monthStr}-01`;
  const endDate = `${selectedYear}-${monthStr}-${daysInMonth < 10 ? `0${daysInMonth}` : daysInMonth}`;

  const calculatedPostCount = frequency === 'every_other_day' 
    ? Math.ceil(daysInMonth / 2) // ~15 bài
    : frequency === 'daily' 
      ? daysInMonth // 30 hoặc 31 bài
      : customPostCount;

  // Sinh danh sách ngày đăng theo tần suất
  const generateDates = (): string[] => {
    const dates: string[] = [];
    if (frequency === 'daily') {
      for (let day = 1; day <= daysInMonth; day++) {
        const dStr = day < 10 ? `0${day}` : `${day}`;
        dates.push(`${selectedYear}-${monthStr}-${dStr}`);
      }
    } else if (frequency === 'every_other_day') {
      for (let day = 1; day <= daysInMonth; day += 2) {
        const dStr = day < 10 ? `0${day}` : `${day}`;
        dates.push(`${selectedYear}-${monthStr}-${dStr}`);
      }
    } else {
      // Custom: chia đều trong tháng
      const step = Math.max(1, Math.floor(daysInMonth / customPostCount));
      let currentDay = 1;
      while (dates.length < customPostCount && currentDay <= daysInMonth) {
        const dStr = currentDay < 10 ? `0${currentDay}` : `${currentDay}`;
        dates.push(`${selectedYear}-${monthStr}-${dStr}`);
        currentDay += step;
      }
    }
    return dates;
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    const dates = generateDates();
    const brandPillars = getBrandPillars(brand);
    const times = ['08:30', '11:30', '14:30', '19:30', '20:00'];

    // Mẫu ý tưởng thực chiến phù hợp với ngành
    const isLogistics = brand.industry.toLowerCase().includes('ship') || 
      brand.industry.toLowerCase().includes('vận chuyển') || 
      brand.name.toLowerCase().includes('ship');

    const posts: WeeklyPlanPost[] = autoSeedPosts ? dates.map((dStr, idx) => {
      const pillarObj = brandPillars[idx % brandPillars.length];
      const pillarName = (pillarObj?.name || 'Chia sẻ kiến thức & Tips') as PostPillar;
      const publishTime = times[idx % times.length];
      const accurateDay = getVietnameseDayOfWeek(dStr);

      let title = `Chủ đề bài ${idx + 1}: ${pillarName} (${brand.name})`;
      let hook = `Điểm chạm số ${idx + 1} dành cho khách hàng trong tháng ${selectedMonth}`;
      let angle = `Tập trung vào giá trị thực tế cho khách hàng`;

      if (isLogistics) {
        const logisticsTemplates = [
          {
            title: 'Bảng giá cước vận chuyển nội ô Cần Thơ siêu tiết kiệm cho chủ shop',
            hook: 'Chi phí ship cao khiến khách phân vân không chốt đơn? Đừng lo, Citiship có giải pháp tối ưu cho bạn!',
            angle: 'Chứng minh giải pháp tiết kiệm chi phí giao hàng'
          },
          {
            title: 'Quy trình giao hỏa tốc 2H: Cam kết không trễ hẹn với khách',
            hook: 'Khách cần hàng gấp trong 2 tiếng? Bấm gọi shipper Citiship có mặt sau 15 phút!',
            angle: 'Nhấn mạnh tốc độ và sự tiện lợi'
          },
          {
            title: 'Mẹo đóng gói hàng dễ vỡ & nước uống chuẩn chỉnh không đổ vỡ',
            hook: '90% sự cố giao hàng xuất phát từ khâu đóng gói. Xem ngay 4 bước đóng gói chuẩn từ shipper!',
            angle: 'Chia sẻ kiến thức hữu ích, tạo uy tín chuyên gia'
          },
          {
            title: 'Chính sách bảo hiểm hàng hóa 100% bể vỡ & thất lạc tại Citiship',
            hook: 'Gửi hàng qua shipper có an tâm không? Citiship cam kết đền bù 100% nếu có sự cố!',
            angle: 'Giải tỏa rào cản sợ rủi ro của chủ shop'
          },
          {
            title: 'Chuyện nghề shipper: Những chuyến hàng dưới cơn mưa Cần Thơ',
            hook: 'Trời mưa thì mặc trời mưa, đơn của khách vẫn tới tay an toàn nguyên vẹn...',
            angle: 'Tạo cảm xúc, gắn kết thương hiệu với sự tận tâm'
          },
          {
            title: 'Đối soát COD 24h: Dòng tiền về tài khoản chủ shop ngay trong ngày',
            hook: 'Không lo bị om vốn COD! Cùng Citiship kiểm tra tiền về ví thần tốc mỗi ngày.',
            angle: 'Đánh trúng nỗi đau kẹt vốn COD của người bán hàng'
          },
          {
            title: 'Phản hồi thực tế từ chủ shop thời trang tại Ninh Kiều sau 6 tháng đồng hành',
            hook: '“Từ ngày dùng Citiship, tỷ lệ hủy đơn giảm hẳn 40% vì khách nhận hàng quá nhanh!”',
            angle: 'Bằng chứng xã hội (Social Proof)'
          },
          {
            title: 'Minigame tuần: Đoán biển số xe shipper Citiship - Nhận voucher ship 0đ',
            hook: 'Cuối tuần giải trí rinh voucher giao hàng miễn phí cùng Citiship nhé cả nhà ơi!',
            angle: 'Kích thích tương tác like, share, comment'
          },
          {
            title: 'Tuyển chọn shipper văn minh: Lịch sự, niềm nở, hỗ trợ khách tận tình',
            hook: 'Shipper chính là bộ mặt thứ hai của shop bạn trước khách hàng.',
            angle: 'Khẳng định văn hóa phục vụ chuyên nghiệp'
          },
          {
            title: 'Ưu đãi đặc quyền: Tặng 5 đơn giao hàng miễn phí cho shop mới ký gửi',
            hook: 'Trải nghiệm ngay dịch vụ shipper chuyên nghiệp nhất Cần Thơ hoàn toàn miễn phí!',
            angle: 'Kêu gọi dùng thử cho khách hàng mới'
          },
        ];

        const template = logisticsTemplates[idx % logisticsTemplates.length];
        title = template.title;
        hook = template.hook;
        angle = template.angle;
      }

      return {
        id: `post_month_${selectedMonth}_${idx + 1}_${Date.now()}`,
        dayOfWeek: accurateDay as any,
        publishDate: dStr,
        publishTime,
        pillar: pillarName,
        postType: (idx % 3 === 0 ? 'Album bài viết (3-4 ảnh)' : idx % 2 === 0 ? 'Single Post (1 ảnh)' : 'Infographic / Hướng dẫn') as any,
        title,
        hook,
        caption: `${hook}\n\n[Nội dung bài viết chi tiết được hoàn thiện ở Giai đoạn 2 sau khi duyệt sườn].\n\n👉 Liên hệ ngay: ${brand.name}`,
        callToAction: 'Inbox ngay hoặc để lại bình luận để được hỗ trợ nhanh nhất!',
        hashtags: `#${brand.name.replace(/\s+/g, '')} #Thang${selectedMonth} #KeHoachFanpage`,
        stage: 'outline',
        topicApproval: 'pending',
        status: 'draft',
        angle,
        designBrief: {
          aspectRatio: '4:5 (Dọc chuẩn Facebook)',
          headlineOnImage: title.toUpperCase(),
          subTextOnImage: `${brand.name} • Tháng ${selectedMonth}/${selectedYear}`,
          visualConcept: `Hình ảnh ấn tượng đại diện cho chủ đề: ${pillarName}`,
          moodAndTone: brand.designStyle || 'Hiện đại, rõ ràng, bắt mắt',
        },
      };
    }) : [];

    const planTitle = `Kế hoạch Fanpage Tháng ${selectedMonth < 10 ? '0' : ''}${selectedMonth}/${selectedYear} (${calculatedPostCount} bài • ${frequency === 'every_other_day' ? '2 ngày 1 bài' : frequency === 'daily' ? '1 ngày 1 bài' : 'Lịch tùy chỉnh'})`;

    const newPlan: WeeklyPlan = {
      id: `plan_${brand.id}_m${selectedMonth < 10 ? '0' : ''}${selectedMonth}_${selectedYear}_${Date.now()}`,
      brandId: brand.id,
      title: planTitle,
      weekNumber: 1, // Kế hoạch tháng bắt đầu tuần 1 của tháng
      monthNumber: selectedMonth,
      year: selectedYear,
      startDate,
      endDate,
      mainGoal: mainGoal.trim() || `Tập trung phát triển Fanpage ${brand.name} tháng ${selectedMonth}/${selectedYear}`,
      status: 'draft',
      planType: 'month',
      postingFrequency: frequency,
      posts,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (onCreateMonthPlan) {
      onCreateMonthPlan(newPlan);
    } else if (onCreatePlan) {
      onCreatePlan(newPlan);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto no-print">
      <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border transition-all ${
        isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#181F2E] border-gray-800 text-gray-100'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isLight ? 'border-gray-200 bg-linear-to-r from-blue-50/80 to-indigo-50/50' : 'border-gray-800 bg-gray-900/60'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30">
              <CalendarRange className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Tạo Kế Hoạch Đăng Bài Theo Tháng</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  Tháng {selectedMonth}/{selectedYear}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Thương hiệu: <strong className="text-blue-600 dark:text-blue-400">{brand.name}</strong> ({brand.industry})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-6 space-y-5">
          {/* 1. Chọn Tháng & Năm */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                1. Chọn Tháng
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl text-sm font-bold border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                  isLight ? 'bg-gray-50 border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-gray-100'
                }`}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Tháng {m < 10 ? `0${m}` : m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Năm
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl text-sm font-bold border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                  isLight ? 'bg-gray-50 border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-gray-100'
                }`}
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          {/* 2. Chọn Tần Suất Đăng Bài */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              2. Chọn Tần Suất Đăng Bài Trong Tháng
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: 2 ngày 1 bài (15 bài) */}
              <div
                onClick={() => setFrequency('every_other_day')}
                className={`p-4 rounded-xl border-2 transition cursor-pointer relative ${
                  frequency === 'every_other_day'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                    : isLight
                      ? 'border-gray-200 hover:border-gray-300 bg-white'
                      : 'border-gray-800 hover:border-gray-700 bg-gray-900/40'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-blue-600">🌟 2 NGÀY 1 BÀI</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Khuyên dùng
                    </span>
                  </div>
                  {frequency === 'every_other_day' && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <p className="text-base font-black text-gray-900 dark:text-gray-100">
                  Khoảng 15 bài / tháng
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Đăng xen kẽ (ngày 01, 03, 05, 07...). Giữ tần suất ổn định cao mà không làm loãng tương tác.
                </p>
              </div>

              {/* Option B: 1 ngày 1 bài (30 bài) */}
              <div
                onClick={() => setFrequency('daily')}
                className={`p-4 rounded-xl border-2 transition cursor-pointer relative ${
                  frequency === 'daily'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                    : isLight
                      ? 'border-gray-200 hover:border-gray-300 bg-white'
                      : 'border-gray-800 hover:border-gray-700 bg-gray-900/40'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-indigo-600">⚡ 1 NGÀY 1 BÀI</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      Tối đa tần suất
                    </span>
                  </div>
                  {frequency === 'daily' && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <p className="text-base font-black text-gray-900 dark:text-gray-100">
                  {daysInMonth} bài / tháng
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Đăng đều đặn mỗi ngày từ 01 đến {daysInMonth}. Phù hợp cho Fanpage đang mở bán sản phẩm, chạy chiến dịch.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Mục tiêu trọng tâm của tháng */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              3. Mục Tiêu Trọng Tâm Của Tháng {selectedMonth}
            </label>
            <input
              type="text"
              value={mainGoal}
              onChange={(e) => setMainGoal(e.target.value)}
              placeholder="VD: Đẩy mạnh dịch vụ shipper hỏa tốc 2h, tăng 30% khách inbox..."
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border ${
                isLight ? 'bg-gray-50 border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-gray-100'
              }`}
            />
          </div>

          {/* 4. Tùy chọn sinh sẵn bài viết */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isLight ? 'bg-amber-50/60 border-amber-200/80' : 'bg-amber-950/20 border-amber-900/50'
          }`}>
            <input
              type="checkbox"
              id="autoSeedCheck"
              checked={autoSeedPosts}
              onChange={(e) => setAutoSeedPosts(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="autoSeedCheck" className="text-xs cursor-pointer select-none">
              <strong className="block text-amber-900 dark:text-amber-300 font-bold mb-0.5">
                Tự động tạo sẵn khung {calculatedPostCount} bài viết trong tháng
              </strong>
              <span className="text-gray-600 dark:text-gray-400">
                Hệ thống sẽ tự động gán ngày đăng chuẩn ({startDate} → {endDate}), tính toán chính xác thứ trong tuần, và phân bổ xen kẽ các Trụ cột nội dung của thương hiệu.
              </span>
            </label>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 flex items-center gap-2 transition cursor-pointer active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Tạo Kế Hoạch Tháng {selectedMonth}/{selectedYear} ({calculatedPostCount} bài)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
