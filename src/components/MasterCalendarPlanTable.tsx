import React, { useState } from 'react';
import { WeeklyPlan, WeeklyPlanPost, BrandProfile, PostFormatType } from '../types';
import { 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Edit3, 
  Trash2, 
  FileText, 
  Printer, 
  Check, 
  X, 
  ChevronRight, 
  Layers, 
  ArrowRight,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';
import { getBrandPillars, getPillarColorStyle, getPillarInfo } from '../utils/pillarUtils';
import { MainTopicSelectWithAdd } from './MainTopicSelectWithAdd';
import { getVietnameseDayOfWeek } from '../utils/dateUtils';

interface MasterCalendarPlanTableProps {
  plan: WeeklyPlan;
  brand: BrandProfile;
  isLight: boolean;
  onUpdatePlan: (updatedPlan: WeeklyPlan) => void;
  onOpenFullPostEditor: (post: WeeklyPlanPost) => void;
  onOpenPrintPreview?: () => void;
  onOpenAiPlanner?: () => void;
  onUpdateBrand?: (updatedBrand: BrandProfile) => void;
}

const FORMAT_OPTIONS: PostFormatType[] = [
  'Single Post (1 ảnh)',
  'Album Carousel (4-6 ảnh)',
  'Reels / Video ngắn',
  'Infographic / Hướng dẫn',
  'Meme / Trích dẫn',
];

const DAYS_OF_WEEK = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'] as const;

export const MasterCalendarPlanTable: React.FC<MasterCalendarPlanTableProps> = ({
  plan,
  brand,
  isLight,
  onUpdatePlan,
  onOpenFullPostEditor,
  onOpenPrintPreview,
  onOpenAiPlanner,
  onUpdateBrand,
}) => {
  const brandPillars = getBrandPillars(brand);
  const posts = plan.posts || [];

  // State cho Form thêm nhanh sườn chủ đề
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [quickDay, setQuickDay] = useState<typeof DAYS_OF_WEEK[number]>('Thứ 2');
  const [quickDate, setQuickDate] = useState(plan.startDate || new Date().toISOString().split('T')[0]);
  const [quickTime, setQuickTime] = useState('08:30');
  const [quickPillar, setQuickPillar] = useState(brandPillars[0]?.name || 'Chia sẻ kiến thức & Tips');
  const [quickFormat, setQuickFormat] = useState<PostFormatType>('Single Post (1 ảnh)');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickAngle, setQuickAngle] = useState('');

  // State cho Modal sửa nhanh sườn
  const [editingPostOutline, setEditingPostOutline] = useState<WeeklyPlanPost | null>(null);

  // Thống kê tiến độ sườn
  const totalPosts = posts.length;
  const approvedTopics = posts.filter((p) => p.topicApproval === 'approved').length;
  const fullContentPosts = posts.filter((p) => (p.stage === 'full_content' || (p.caption && p.caption.trim().length > 30))).length;
  const outlineOnlyPosts = totalPosts - fullContentPosts;

  // Tính toán ngày trong tuần theo startDate
  const handleDayChange = (day: typeof DAYS_OF_WEEK[number]) => {
    setQuickDay(day);
    if (plan.startDate) {
      const baseDate = new Date(plan.startDate);
      const dayIndex = DAYS_OF_WEEK.indexOf(day);
      baseDate.setDate(baseDate.getDate() + dayIndex);
      setQuickDate(baseDate.toISOString().split('T')[0]);
    }
  };

  // Thêm nhanh slot chủ đề
  const handleSaveQuickPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) {
      alert('Vui lòng nhập tiêu đề / chủ đề đề xuất!');
      return;
    }

    const newPost: WeeklyPlanPost = {
      id: `post_${Date.now()}`,
      dayOfWeek: quickDay,
      publishDate: quickDate,
      publishTime: quickTime,
      pillar: quickPillar,
      postType: quickFormat,
      title: quickTitle.trim(),
      topic: quickTitle.trim(),
      angle: quickAngle.trim() || undefined,
      targetAngle: quickAngle.trim() || undefined,
      hook: '',
      caption: '',
      callToAction: '',
      hashtags: `#${brand.name.replace(/\s+/g, '')}`,
      stage: 'outline', // Đánh dấu chỉ mới lên sườn
      topicApproval: 'pending', // Chờ khách duyệt
      status: 'draft',
      designBrief: {
        aspectRatio: '4:5 (Dọc chuẩn Facebook)',
        headlineOnImage: quickTitle.trim(),
        visualConcept: `Hình ảnh ấn phẩm bám theo phong cách ${brand.designStyle || 'hiện đại'}.`,
        moodAndTone: 'Chuyên nghiệp, tinh tế',
      },
    };

    onUpdatePlan({
      ...plan,
      posts: [...posts, newPost],
      updatedAt: new Date().toISOString(),
    });

    // Reset form
    setQuickTitle('');
    setQuickAngle('');
    setIsQuickAdding(false);
  };

  // Cập nhật trạng thái duyệt chủ đề của một bài
  const handleToggleTopicApproval = (postId: string, newApproval: 'pending' | 'approved' | 'rejected') => {
    const updated = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          topicApproval: newApproval,
          // Nếu đã chốt thì có thể đánh dấu status sang pending_approval hoặc approved
          status: newApproval === 'approved' ? (p.status === 'draft' ? 'pending_approval' : p.status) : p.status,
        };
      }
      return p;
    });
    onUpdatePlan({
      ...plan,
      posts: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  // Chốt duyệt tất cả chủ đề (Khi khách OK toàn bộ sườn)
  const handleApproveAllTopics = () => {
    if (posts.length === 0) return;
    if (window.confirm(`Khách hàng đã đồng ý duyệt toàn bộ ${posts.length} chủ đề này? Bạn có muốn chốt tất cả để bắt đầu viết chi tiết?`)) {
      const updated = posts.map((p) => ({
        ...p,
        topicApproval: 'approved' as const,
      }));
      onUpdatePlan({
        ...plan,
        outlineStatus: 'topics_approved',
        posts: updated,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Xóa slot bài
  const handleDeletePost = (postId: string, title: string) => {
    if (window.confirm(`Xóa slot đề xuất "${title || 'Không có tiêu đề'}" khỏi lịch?`)) {
      onUpdatePlan({
        ...plan,
        posts: posts.filter((p) => p.id !== postId),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Lưu sửa sườn nhanh
  const handleSaveEditOutline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPostOutline) return;

    const updated = posts.map((p) => {
      if (p.id === editingPostOutline.id) {
        return {
          ...editingPostOutline,
          topic: editingPostOutline.title,
        };
      }
      return p;
    });

    onUpdatePlan({
      ...plan,
      posts: updated,
      updatedAt: new Date().toISOString(),
    });
    setEditingPostOutline(null);
  };

  return (
    <div className="space-y-4">
      {/* Banner Hướng Dẫn Workflow 2 Giai Đoạn */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isLight ? 'bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/50 border-blue-100' : 'bg-gradient-to-r from-blue-950/30 via-indigo-950/20 to-purple-950/20 border-blue-900/40'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>GIAI ĐOẠN 1: BẢNG LỊCH KẾ HOẠCH TỔNG QUÁT (MASTER PLAN)</span>
            </span>
            <span className="text-xs font-semibold text-gray-500">
              {plan.planType === 'month'
                ? `Kế hoạch Tháng ${plan.monthNumber || ''}/${plan.year} • ${plan.postingFrequency === 'every_other_day' ? '15 bài (2 ngày 1 bài)' : plan.postingFrequency === 'daily' ? '30 bài (1 ngày 1 bài)' : `${posts.length} bài`} (${plan.startDate} → ${plan.endDate})`
                : `Tuần ${plan.weekNumber} (${plan.startDate} → ${plan.endDate})`}
            </span>
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Lên sườn ngày đăng & chủ đề đề xuất để gửi khách hàng duyệt trước
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            💡 <strong className="text-indigo-600 dark:text-indigo-400">Quy trình thông minh:</strong> Chỉ cần chốt Thứ/Ngày, Trụ cột và Tiêu đề đề xuất với khách. Khi khách duyệt OK sườn này, bấm <strong>"Viết chi tiết"</strong> để AI hoặc bạn viết bài sâu sắc, tránh mất công viết trước rồi khách không ưng!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {totalPosts > 0 && (
            <button
              type="button"
              onClick={handleApproveAllTopics}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              title="Khách hàng đã đồng ý toàn bộ sườn chủ đề"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Chốt Tất Cả Chủ Đề ({approvedTopics}/{totalPosts})</span>
            </button>
          )}

          {onOpenPrintPreview && (
            <button
              type="button"
              onClick={onOpenPrintPreview}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                isLight 
                  ? 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700' 
                  : 'bg-gray-900 hover:bg-gray-800 border-gray-700 text-gray-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-indigo-500" />
              <span>In / Gửi Bảng Sườn Cho Khách</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsQuickAdding(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Sườn Bài Mới</span>
          </button>
        </div>
      </div>

      {/* Thanh Tiến Độ Đề Xuất */}
      <div className={`px-4 py-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
        isLight ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-900/60 border-gray-800 text-gray-300'
      }`}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-900 dark:text-gray-100">Tổng lịch tuần:</span>
            <span className="px-2 py-0.5 rounded-md font-bold bg-gray-100 dark:bg-gray-800">
              {totalPosts} bài viết
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              Đã chốt chủ đề: <strong>{approvedTopics}/{totalPosts}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="font-medium text-amber-700 dark:text-amber-400">
              Chờ duyệt: <strong>{totalPosts - approvedTopics}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-medium text-blue-700 dark:text-blue-400">
              Đã viết chi tiết: <strong>{fullContentPosts}</strong>
            </span>
            <span className="text-gray-400 font-normal">
              (Chỉ mới có sườn: {outlineOnlyPosts})
            </span>
          </div>
        </div>

        {totalPosts === 0 && (
          <div className="text-gray-400 text-xs italic">
            Chưa có bài nào. Hãy bấm "Thêm Sườn Bài Mới" hoặc dùng AI Lập Kế Hoạch Tuần.
          </div>
        )}
      </div>

      {/* Form Thêm Nhanh Sườn Bài Mới (Inline Accordion) */}
      {isQuickAdding && (
        <form
          onSubmit={handleSaveQuickPost}
          className={`p-4 rounded-2xl border space-y-4 animate-in fade-in duration-200 ${
            isLight ? 'bg-indigo-50/60 border-indigo-200' : 'bg-indigo-950/30 border-indigo-800'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-2.5 border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                Thêm Nhanh Slot Bài Vào Kế Hoạch Lịch (Chỉ cần lên sườn đề xuất)
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsQuickAdding(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Thứ trong tuần */}
            <div>
              <label className="block font-bold text-gray-600 dark:text-gray-400 mb-1">
                Thứ trong tuần *
              </label>
              <select
                value={quickDay}
                onChange={(e) => handleDayChange(e.target.value as any)}
                className={`w-full px-3 py-1.5 rounded-lg border font-medium ${
                  isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                }`}
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Ngày đăng & Giờ */}
            <div>
              <label className="block font-bold text-gray-600 dark:text-gray-400 mb-1">
                Ngày & Giờ dự kiến *
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={quickDate}
                  onChange={(e) => {
                    const nd = e.target.value;
                    setQuickDate(nd);
                    if (nd) {
                      setQuickDay(getVietnameseDayOfWeek(nd) as any);
                    }
                  }}
                  className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                    isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-gray-100'
                  }`}
                />
                <input
                  type="time"
                  value={quickTime}
                  onChange={(e) => setQuickTime(e.target.value)}
                  className={`w-20 px-2 py-1.5 rounded-lg border text-xs text-center font-bold ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                  }`}
                />
              </div>
            </div>

            {/* Chủ đề chính (Lấy theo brand, có thể tự thêm list mới) */}
            <div>
              <MainTopicSelectWithAdd
                brand={brand}
                value={quickPillar}
                onChange={(val) => setQuickPillar(val)}
                onUpdateBrand={onUpdateBrand}
                isLight={isLight}
                label="Chủ đề chính *"
                required
              />
            </div>

            {/* Định dạng */}
            <div>
              <label className="block font-bold text-gray-600 dark:text-gray-400 mb-1">
                Định dạng bài đăng *
              </label>
              <select
                value={quickFormat}
                onChange={(e) => setQuickFormat(e.target.value as any)}
                className={`w-full px-3 py-1.5 rounded-lg border font-medium ${
                  isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                }`}
              >
                {FORMAT_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tiêu đề đề xuất & Ý đồ */}
          <div className="space-y-2 text-xs">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Tiêu đề / Chủ đề đề xuất gửi khách *
              </label>
              <input
                type="text"
                required
                placeholder="VD: 3 mẹo đóng gói hàng dễ vỡ giúp chủ shop giảm hoàn đơn về 0%..."
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-hidden ${
                  isLight ? 'bg-white border-gray-300 focus:border-indigo-500' : 'bg-gray-900 border-gray-700 focus:border-indigo-400'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold text-gray-600 dark:text-gray-400 mb-1">
                Góc tiếp cận / Ý đồ truyền thông tóm tắt (Để khách đọc hiểu lý do đăng bài này)
              </label>
              <input
                type="text"
                placeholder="VD: Đánh trúng nỗi lo bể hàng mất cước của shop online, hướng dẫn quấn xốp nổ 3 lớp, tạo uy tín..."
                value={quickAngle}
                onChange={(e) => setQuickAngle(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-hidden ${
                  isLight ? 'bg-white border-gray-300 focus:border-indigo-500' : 'bg-gray-900 border-gray-700 focus:border-indigo-400'
                }`}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsQuickAdding(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Lưu Vào Bảng Kế Hoạch Tuần</span>
            </button>
          </div>
        </form>
      )}

      {/* BẢNG MA TRẬN LỊCH KẾ HOẠCH TỔNG QUÁT */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${
        isLight ? 'bg-white border-gray-200' : 'bg-gray-900/60 border-gray-800'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b font-bold tracking-wider uppercase text-[11px] ${
                isLight ? 'bg-gray-100/90 border-gray-200 text-gray-800' : 'bg-gray-950/60 border-gray-800 text-gray-300'
              }`}>
                <th className="py-3.5 px-4 w-36">Thứ & Ngày</th>
                <th className="py-3.5 px-3 w-44">Chủ đề chính</th>
                <th className="py-3.5 px-3 w-36">Định dạng</th>
                <th className="py-3.5 px-4">Chủ đề & Tiêu đề đề xuất</th>
                <th className="py-3.5 px-3 w-40 text-center">Duyệt sườn (Khách)</th>
                <th className="py-3.5 px-3 w-36 text-center">Tiến độ nội dung</th>
                <th className="py-3.5 px-4 w-44 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-medium">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 space-y-2">
                    <Calendar className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
                    <p className="font-medium text-sm">Chưa có bài viết nào trong bảng lịch kế hoạch tuần này.</p>
                    <p className="text-xs">Bấm "+ Thêm Sườn Bài Mới" để lên lịch đề xuất các ngày trong tuần.</p>
                  </td>
                </tr>
              ) : (
                posts.map((post, idx) => {
                  const pillarColor = getPillarColorStyle(post.pillar, brand);
                  const pillarInfo = getPillarInfo(post.pillar, brand);
                  const isApproved = post.topicApproval === 'approved';
                  const isFullContent = post.stage === 'full_content' || (post.caption && post.caption.trim().length > 30);
                  const displayDay = post.publishDate ? getVietnameseDayOfWeek(post.publishDate) : post.dayOfWeek;

                  return (
                    <tr
                      key={post.id}
                      className={`group transition hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 ${
                        idx % 2 === 0 ? (isLight ? 'bg-white' : 'bg-transparent') : (isLight ? 'bg-gray-50/30' : 'bg-gray-950/20')
                      }`}
                    >
                      {/* Cột Thứ & Ngày */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-0.5">
                          <span className={`font-bold flex items-center gap-1.5 text-xs ${
                            isLight ? 'text-gray-900' : 'text-gray-100'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                            {displayDay}
                          </span>
                          <div className={`text-[11px] flex items-center gap-1 font-medium ${
                            isLight ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>{post.publishDate}</span>
                          </div>
                          <div className={`text-[11px] font-bold flex items-center gap-1 ${
                            isLight ? 'text-indigo-700' : 'text-indigo-400'
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span>{post.publishTime || '08:30'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Cột Trụ cột */}
                      <td className="py-3 px-3 align-top">
                        <div className="space-y-1">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border shadow-2xs ${pillarColor.badge}`}>
                            {post.pillar}
                          </span>
                          {pillarInfo?.targetObjective && (
                            <p className={`text-[10px] line-clamp-1 font-medium ${
                              isLight ? 'text-gray-600' : 'text-gray-400'
                            }`} title={pillarInfo.targetObjective}>
                              🎯 {pillarInfo.targetObjective}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Cột Định dạng */}
                      <td className="py-3 px-3 align-top">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                          isLight 
                            ? 'bg-gray-100 text-gray-800 border-gray-300' 
                            : 'bg-gray-800 text-gray-200 border-gray-700'
                        }`}>
                          {post.postType}
                        </span>
                      </td>

                      {/* Cột Chủ đề & Tiêu đề đề xuất */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1">
                          <h4 className={`font-bold text-xs leading-snug transition ${
                            isLight 
                              ? 'text-gray-950 group-hover:text-indigo-600' 
                              : 'text-gray-100 group-hover:text-indigo-400'
                          }`}>
                            {post.title || '(Chưa có tiêu đề đề xuất)'}
                          </h4>

                          {(post.angle || post.targetAngle) && (
                            <p className={`text-[11px] leading-relaxed font-medium ${
                              isLight ? 'text-gray-600' : 'text-gray-400'
                            }`}>
                              <span className={`font-bold ${isLight ? 'text-gray-800' : 'text-gray-200'}`}>Ý đồ:</span> {post.angle || post.targetAngle}
                            </p>
                          )}

                          {post.clientNote && (
                            <div className={`p-1.5 rounded-lg text-[11px] flex items-start gap-1 font-medium border ${
                              isLight
                                ? 'bg-rose-50 text-rose-950 border-rose-200'
                                : 'bg-rose-950/40 text-rose-200 border-rose-900/60'
                            }`}>
                              <MessageSquare className="w-3 h-3 shrink-0 mt-0.5 text-rose-600" />
                              <span><strong>Khách góp ý:</strong> {post.clientNote}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Cột Duyệt sườn (Khách) */}
                      <td className="py-3 px-3 align-top text-center">
                        <div className="inline-flex flex-col items-center gap-1.5">
                          {isApproved ? (
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 shadow-2xs ${
                              isLight
                                ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                : 'bg-emerald-950/60 text-emerald-200 border-emerald-800'
                            }`}>
                              <CheckCircle2 className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                              <span>Đã chốt sườn</span>
                            </span>
                          ) : post.topicApproval === 'rejected' ? (
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 shadow-2xs ${
                              isLight
                                ? 'bg-rose-100 text-rose-950 border-rose-300'
                                : 'bg-rose-950/60 text-rose-200 border-rose-800'
                            }`}>
                              <AlertCircle className={`w-3.5 h-3.5 ${isLight ? 'text-rose-700' : 'text-rose-400'}`} />
                              <span>Khách đổi chủ đề</span>
                            </span>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 shadow-2xs ${
                              isLight
                                ? 'bg-amber-100 text-amber-950 border-amber-300'
                                : 'bg-amber-950/60 text-amber-200 border-amber-800'
                            }`}>
                              <Clock className={`w-3.5 h-3.5 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
                              <span>Chờ khách duyệt</span>
                            </span>
                          )}

                          {/* Quick Switch Approval */}
                          <div className="flex items-center gap-1 text-[10px]">
                            {!isApproved && (
                              <button
                                type="button"
                                onClick={() => handleToggleTopicApproval(post.id, 'approved')}
                                className={`px-1.5 py-0.5 rounded font-bold border transition cursor-pointer ${
                                  isLight
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                    : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800'
                                }`}
                                title="Chốt đồng ý sườn bài này"
                              >
                                [✓ Chốt]
                              </button>
                            )}
                            {isApproved && (
                              <button
                                type="button"
                                onClick={() => handleToggleTopicApproval(post.id, 'pending')}
                                className={`px-1.5 py-0.5 rounded font-medium border transition cursor-pointer ${
                                  isLight
                                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                                }`}
                                title="Chuyển về trạng thái chờ duyệt"
                              >
                                [Mở lại]
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleTopicApproval(post.id, 'rejected')}
                              className={`px-1.5 py-0.5 rounded font-bold border transition cursor-pointer ${
                                isLight
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                                  : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800'
                              }`}
                              title="Đánh dấu khách yêu cầu đổi chủ đề"
                            >
                              [Đổi]
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Cột Tiến độ nội dung */}
                      <td className="py-3 px-3 align-top text-center">
                        {isFullContent ? (
                          <div className="space-y-0.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border inline-flex items-center gap-1 shadow-2xs ${
                              isLight
                                ? 'bg-indigo-100 text-indigo-950 border-indigo-300'
                                : 'bg-indigo-950/60 text-indigo-200 border-indigo-800'
                            }`}>
                              <Sparkles className={`w-3 h-3 ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`} />
                              <span>Đã viết chi tiết</span>
                            </span>
                            <p className={`text-[10px] font-semibold ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                              {post.caption ? `${post.caption.length} ký tự` : ''}
                            </p>
                          </div>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border inline-flex items-center gap-1 ${
                            isLight
                              ? 'bg-gray-100 text-gray-700 border-gray-300'
                              : 'bg-gray-800/80 text-gray-300 border-gray-700'
                          }`}>
                            <FileText className="w-3 h-3 text-gray-400" />
                            <span>Mới lên sườn</span>
                          </span>
                        )}
                      </td>

                      {/* Cột Thao tác */}
                      <td className="py-3 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenFullPostEditor(post)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                              isFullContent
                                ? isLight
                                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300 shadow-2xs'
                                  : 'bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-700'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-2xs'
                            }`}
                            title={isFullContent ? 'Xem & Chỉnh sửa bài viết' : 'Bắt đầu viết chi tiết cho chủ đề này'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{isFullContent ? 'Sửa bài' : 'Viết chi tiết'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingPostOutline(post)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isLight
                                ? 'text-gray-500 hover:text-indigo-600 hover:bg-gray-100'
                                : 'text-gray-400 hover:text-indigo-400 hover:bg-gray-800'
                            }`}
                            title="Sửa nhanh thông tin sườn"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePost(post.id, post.title)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isLight
                                ? 'text-gray-500 hover:text-rose-600 hover:bg-gray-100'
                                : 'text-gray-400 hover:text-rose-400 hover:bg-gray-800'
                            }`}
                            title="Xóa slot bài này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Sửa Nhanh Thông Tin Sườn */}
      {editingPostOutline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl border p-5 space-y-4 ${
            isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#181F2E] border-gray-800 text-gray-100'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <span>Chỉnh Sửa Sườn Chủ Đề & Lịch Đăng</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingPostOutline(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditOutline} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Thứ trong tuần
                  </label>
                  <select
                    value={editingPostOutline.dayOfWeek}
                    onChange={(e) => setEditingPostOutline({ ...editingPostOutline, dayOfWeek: e.target.value as any })}
                    className={`w-full px-3 py-1.5 rounded-lg border ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                    }`}
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Giờ đăng
                  </label>
                  <input
                    type="time"
                    value={editingPostOutline.publishTime || '08:30'}
                    onChange={(e) => setEditingPostOutline({ ...editingPostOutline, publishTime: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg border ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <MainTopicSelectWithAdd
                    brand={brand}
                    value={editingPostOutline.pillar}
                    onChange={(val) => setEditingPostOutline({ ...editingPostOutline, pillar: val as any })}
                    onUpdateBrand={onUpdateBrand}
                    isLight={isLight}
                    label="Chủ đề chính"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Trạng thái duyệt của khách
                  </label>
                  <select
                    value={editingPostOutline.topicApproval || 'pending'}
                    onChange={(e) => setEditingPostOutline({ ...editingPostOutline, topicApproval: e.target.value as any })}
                    className={`w-full px-3 py-1.5 rounded-lg border font-bold ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                    }`}
                  >
                    <option value="pending">Chờ khách duyệt</option>
                    <option value="approved">Đã chốt chủ đề (Approved)</option>
                    <option value="rejected">Khách yêu cầu đổi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Tiêu đề đề xuất *
                </label>
                <input
                  type="text"
                  required
                  value={editingPostOutline.title}
                  onChange={(e) => setEditingPostOutline({ ...editingPostOutline, title: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border font-bold ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Ý đồ truyền thông / Góc tiếp cận
                </label>
                <textarea
                  rows={2}
                  value={editingPostOutline.angle || editingPostOutline.targetAngle || ''}
                  onChange={(e) => setEditingPostOutline({ 
                    ...editingPostOutline, 
                    angle: e.target.value,
                    targetAngle: e.target.value 
                  })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Ghi chú góp ý từ khách hàng (nếu có)
                </label>
                <input
                  type="text"
                  placeholder="VD: Khách muốn nhấn mạnh thêm phần giao hỏa tốc 2h..."
                  value={editingPostOutline.clientNote || ''}
                  onChange={(e) => setEditingPostOutline({ ...editingPostOutline, clientNote: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-lg border ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingPostOutline(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
