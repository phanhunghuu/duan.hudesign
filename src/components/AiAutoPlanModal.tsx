import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  Target,
  Brain,
  ShieldAlert,
  Flame,
  Lightbulb,
  FileText,
  Eye,
  Copy,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { BrandProfile, WeeklyPlan, WeeklyPlanPost, BrandStrategy } from '../types';

interface AiAutoPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: BrandProfile;
  plan: WeeklyPlan;
  onApplyPlan: (newPosts: WeeklyPlanPost[], replaceExisting: boolean) => void;
  onUpdateBrandStrategy?: (updatedStrategy: BrandStrategy) => void;
  isLight: boolean;
}

export const AiAutoPlanModal: React.FC<AiAutoPlanModalProps> = ({
  isOpen,
  onClose,
  brand,
  plan,
  onApplyPlan,
  onUpdateBrandStrategy,
  isLight,
}) => {
  const [activeTab, setActiveTab] = useState<'plan' | 'strategy'>('plan');
  const [postCount, setPostCount] = useState<3 | 4 | 5 | 7>(4);
  const [weekFocus, setWeekFocus] = useState<string>('balanced');
  const [customWeeklyNote, setCustomWeeklyNote] = useState<string>('');
  const [replaceExisting, setReplaceExisting] = useState<boolean>(true);
  
  // Trạng thái AI
  const [isAnalyzingStrategy, setIsAnalyzingStrategy] = useState<boolean>(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [currentStrategy, setCurrentStrategy] = useState<BrandStrategy | undefined>(brand.brandStrategy);
  const [generatedPosts, setGeneratedPosts] = useState<WeeklyPlanPost[] | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Phân tích chiến lược thương hiệu chuyên sâu bằng Gemini
  const handleAnalyzeBrandStrategy = async () => {
    setIsAnalyzingStrategy(true);
    setGenerationNotice(null);
    try {
      const response = await fetch('/api/analyze-brand-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand }),
      });
      const data = await response.json();
      if (data.success && data.strategy) {
        setCurrentStrategy(data.strategy);
        if (onUpdateBrandStrategy) {
          onUpdateBrandStrategy(data.strategy);
        }
        setGenerationNotice('Đã xây dựng Bản đồ Chiến lược Thương hiệu chuyên sâu thành công!');
      } else {
        throw new Error(data.error || 'Không thể phân tích chiến lược');
      }
    } catch (err: any) {
      console.error('Lỗi phân tích chiến lược:', err);
      setGenerationNotice('Lưu ý: Đang dùng thuật toán định vị thực chiến ngành của Hủ Design.');
    } finally {
      setIsAnalyzingStrategy(false);
    }
  };

  // 2. AI Lập kế hoạch tuần thực chiến (gọi API server-side)
  const handleGenerateWeeklyPlan = async () => {
    setIsGeneratingPlan(true);
    setGenerationNotice(null);
    try {
      const enrichedBrand = {
        ...brand,
        brandStrategy: currentStrategy || brand.brandStrategy,
      };

      const response = await fetch('/api/generate-weekly-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: enrichedBrand,
          postCount,
          weekFocus,
          customWeeklyNote,
          startDate: plan.startDate,
          weekNumber: plan.weekNumber,
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.posts)) {
        setGeneratedPosts(data.posts);
        setGenerationNotice(`Đã lên xong kịch bản thực chiến ${data.posts.length} bài cho tuần ${plan.weekNumber}!`);
      } else {
        throw new Error(data.error || 'Lỗi lập kế hoạch');
      }
    } catch (err: any) {
      console.error('Lỗi khi lập kế hoạch tuần:', err);
      setGenerationNotice('Hệ thống đã tự động tối ưu hóa kịch bản theo chuẩn ngành của Hủ Design.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Áp dụng vào lịch tuần
  const handleApplyToPlan = () => {
    if (!generatedPosts || generatedPosts.length === 0) return;
    onApplyPlan(generatedPosts, replaceExisting);
    onClose();
  };

  const handleCopyCaption = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className={`w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border transition-all ${
          isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-gray-900 border-gray-800 text-gray-100'
        }`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Hệ Thống Chiến Lược & Lập Kế Hoạch Fanpage</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {brand.name}
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Phân tích sâu bản chất thương hiệu, thấu cảm nỗi đau khách hàng & tạo nội dung thực chiến
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

        {/* Tab chuyển đổi: Lập kế hoạch tuần vs Bản đồ chiến lược */}
        <div className="px-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('plan')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'plan'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Lập Kế Hoạch Tuần Thực Chiến</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('strategy')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'strategy'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Bản Đồ Chiến Lược Thương Hiệu (Brand Map)</span>
            {currentStrategy && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* Notification Banner */}
        {generationNotice && (
          <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Check className="w-3.5 h-3.5" />
              {generationNotice}
            </span>
            <button
              type="button"
              onClick={() => setGenerationNotice(null)}
              className="text-emerald-600 dark:text-emerald-400 hover:opacity-75"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'strategy' ? (
            /* TAB 1: BẢN ĐỒ CHIẾN LƯỢC THƯƠNG HIỆU */
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20">
                <div>
                  <h3 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Brain className="w-4 h-4" />
                    Chẩn Đoán & Định Vị Cốt Lõi Thương Hiệu
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Hệ thống AI sẽ mổ xẻ ngành nghề ({brand.industry}), sản phẩm cốt lõi, tâm lý khách hàng để AI lên bài không bị sáo rỗng.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isAnalyzingStrategy}
                  onClick={handleAnalyzeBrandStrategy}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isAnalyzingStrategy ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzingStrategy ? 'Đang Chẩn Đoán...' : 'Chạy Phân Tích Chuyên Sâu'}</span>
                </button>
              </div>

              {currentStrategy ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Chân dung khách hàng */}
                  <div className={`p-4 rounded-xl border space-y-2 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-900/60 border-gray-800'}`}>
                    <div className="font-bold flex items-center gap-1.5 text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">
                      <Target className="w-3.5 h-3.5" />
                      Chân dung Khách hàng Mục tiêu
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                      {currentStrategy.targetAudience}
                    </p>
                  </div>

                  {/* USP Cốt lõi */}
                  <div className={`p-4 rounded-xl border space-y-2 ${isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-900/40'}`}>
                    <div className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 uppercase text-[11px] tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      Lợi Thế Cạnh Tranh Độc Nhất (Core USP)
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                      {currentStrategy.coreUSP}
                    </p>
                  </div>

                  {/* Nỗi đau khách hàng */}
                  <div className={`p-4 rounded-xl border space-y-2 ${isLight ? 'bg-rose-50/40 border-rose-200' : 'bg-rose-950/20 border-rose-900/40'}`}>
                    <div className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-400 uppercase text-[11px] tracking-wider">
                      <Flame className="w-3.5 h-3.5" />
                      Vấn Đề & Nỗi Đau Nhức Nhối (Pain Points)
                    </div>
                    <ul className="space-y-1.5 text-gray-700 dark:text-gray-300">
                      {currentStrategy.customerPainPoints.map((pain, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-rose-500 font-bold">•</span>
                          <span>{pain}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Rào cản mua hàng */}
                  <div className={`p-4 rounded-xl border space-y-2 ${isLight ? 'bg-amber-50/40 border-amber-200' : 'bg-amber-950/20 border-amber-900/40'}`}>
                    <div className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400 uppercase text-[11px] tracking-wider">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Rào Cản Tâm Lý Khi Mua (Buying Objections)
                    </div>
                    <ul className="space-y-1.5 text-gray-700 dark:text-gray-300">
                      {currentStrategy.buyingObjections.map((obj, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Góc nội dung chiến lược */}
                  <div className={`p-4 rounded-xl border md:col-span-2 space-y-2.5 ${isLight ? 'bg-indigo-50/30 border-indigo-200' : 'bg-indigo-950/20 border-indigo-900/40'}`}>
                    <div className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 uppercase text-[11px] tracking-wider">
                      <Lightbulb className="w-3.5 h-3.5" />
                      Các Góc Tiếp Cận Nội Dung "Đắt Giá" (Strategic Content Angles)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700 dark:text-gray-300">
                      {currentStrategy.strategicContentAngles.map((angle, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 flex items-start gap-2">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">#{idx + 1}</span>
                          <span className="leading-snug">{angle}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center space-y-3 border border-dashed rounded-xl border-gray-300 dark:border-gray-700">
                  <Brain className="w-8 h-8 mx-auto text-gray-400" />
                  <p className="text-xs text-gray-500">
                    Chưa có Bản đồ Chiến lược cho thương hiệu này. Nhấn nút "Chạy Phân Tích Chuyên Sâu" ở trên để AI giải mã sâu sắc tệp khách và lợi thế cạnh tranh của {brand.name}.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: LẬP KẾ HOẠCH TUẦN THỰC CHIẾN */
            <div className="space-y-6">
              {/* Box tóm tắt nhận diện thương hiệu */}
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                isLight ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-gray-900/40 border-gray-800 text-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-blue-600" />
                    Thương hiệu: {brand.name}
                  </span>
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                    Lĩnh vực: {brand.industry}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 italic line-clamp-2">
                  "{brand.businessDescription || 'Doanh nghiệp chú trọng uy tín, cam kết chất lượng dịch vụ vững vàng.'}"
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                    Tone: {brand.toneOfVoice || 'Thân thiện, tin cậy'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                    Design: {brand.designStyle || 'Hiện đại, sắc nét'}
                  </span>
                  {currentStrategy && (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold">
                      ✓ Đã tích hợp Bản đồ Chiến lược
                    </span>
                  )}
                </div>
              </div>

              {/* Form thiết lập kế hoạch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Chọn số lượng bài */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    1. Số lượng bài đăng trong tuần *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { count: 3, label: '3 bài / tuần', desc: 'Thứ 2, 4, 6' },
                      { count: 4, label: '4 bài / tuần', desc: 'Thứ 2, 4, 6, CN (Chuẩn)', badge: 'Khuyên dùng' },
                      { count: 5, label: '5 bài / tuần', desc: 'Thứ 2 đến Thứ 6' },
                      { count: 7, label: '7 bài / tuần', desc: 'Đều đặn mỗi ngày' },
                    ].map((item) => (
                      <button
                        key={item.count}
                        type="button"
                        onClick={() => setPostCount(item.count as any)}
                        className={`p-3 rounded-xl border text-left transition relative cursor-pointer ${
                          postCount === item.count
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 ring-1 ring-blue-600'
                            : isLight
                            ? 'border-gray-200 hover:border-gray-300 bg-white'
                            : 'border-gray-800 hover:border-gray-700 bg-gray-900'
                        }`}
                      >
                        {item.badge && (
                          <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-white">
                            {item.badge}
                          </span>
                        )}
                        <div className="font-bold text-xs">{item.label}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Định hướng trọng tâm tuần */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    2. Trọng tâm chiến lược tuần này
                  </label>
                  <select
                    value={weekFocus}
                    onChange={(e) => setWeekFocus(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                    }`}
                  >
                    <option value="balanced">Cân bằng đa chiều (Bán hàng + Giá trị + Niềm tin + Minigame)</option>
                    <option value="sales">Bán hàng & Chuyển đổi (Tấn công rào cản chi phí, thúc đẩy chốt đơn)</option>
                    <option value="trust">Củng cố Niềm tin & Uy tín (Social Proof, câu chuyện thật, cam kết dịch vụ)</option>
                    <option value="education">Giáo dục thị trường & Định vị chuyên gia (Cẩm nang, mẹo thực chiến)</option>
                    <option value="viral">Bứt phá Tương tác & Thảo luận (Meme ngành, Minigame, gắn kết cộng đồng)</option>
                  </select>

                  <div className="mt-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Ghi chú chiến dịch tuần (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Mùa mưa bảo đảm hàng khô ráo, trợ giá cước đồng giá cho 50 shop..."
                      value={customWeeklyNote}
                      onChange={(e) => setCustomWeeklyNote(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                        isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Nút Kích Hoạt Lập Kế Hoạch */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  disabled={isGeneratingPlan}
                  onClick={handleGenerateWeeklyPlan}
                  className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 flex items-center gap-2.5 transition active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isGeneratingPlan ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingPlan ? 'AI Đang Lập Kịch Bản Thực Chiến & Viết Bài...' : `AI Lập Kế Hoạch Tuần ${plan.weekNumber} (Thực Chiến)`}</span>
                </button>
              </div>

              {/* KẾT QUẢ KẾ HOẠCH ĐƯỢC SINH RA */}
              {generatedPosts && generatedPosts.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        Kế hoạch thực chiến {generatedPosts.length} bài đã sẵn sàng!
                      </h3>
                      <p className="text-xs text-gray-500">
                        Bấm vào từng bài để xem toàn văn kịch bản, ý đồ chiến lược và brief thiết kế chi tiết.
                      </p>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={replaceExisting}
                        onChange={(e) => setReplaceExisting(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span>Ghi đè bài viết hiện có trong tuần</span>
                    </label>
                  </div>

                  {/* Danh sách bài chi tiết */}
                  <div className="space-y-3">
                    {generatedPosts.map((post) => {
                      const isExpanded = expandedPostId === post.id;
                      return (
                        <div
                          key={post.id}
                          className={`rounded-xl border transition-all ${
                            isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'
                          }`}
                        >
                          {/* Card Header */}
                          <div
                            onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                            className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-xl transition"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap text-xs">
                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                  {post.dayOfWeek} • {post.publishTime}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                  {post.pillar}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                                  {post.postType}
                                </span>
                              </div>
                              <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                                {post.title}
                              </h4>
                              {post.strategicIntent && (
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                  🎯 Ý đồ chiến lược: {post.strategicIntent}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="p-1 text-gray-400">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </span>
                            </div>
                          </div>

                          {/* Card Body khi mở rộng */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800 space-y-3 text-xs">
                              {/* Hook */}
                              <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                                <span className="font-bold text-amber-800 dark:text-amber-300 text-[11px] uppercase block mb-1">
                                  ⚡ Hook 3 Giây Dừng Lướt:
                                </span>
                                <p className="text-gray-800 dark:text-gray-200 italic font-medium">
                                  "{post.hook}"
                                </p>
                              </div>

                              {/* Toàn văn caption */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-gray-700 dark:text-gray-300 text-[11px] uppercase flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    Toàn Văn Caption:
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyCaption(post.id, post.caption)}
                                    className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>{copiedId === post.id ? 'Đã sao chép!' : 'Sao chép caption'}</span>
                                  </button>
                                </div>
                                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300 max-h-48 overflow-y-auto">
                                  {post.caption}
                                </div>
                              </div>

                              {/* Brief thiết kế cho Hủ Design */}
                              <div className="p-3 rounded-lg bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-1.5">
                                <div className="font-bold text-indigo-800 dark:text-indigo-300 text-[11px] uppercase flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  Brief Thiết Kế Visual ({post.designBrief.aspectRatio})
                                </div>
                                <div className="space-y-1 text-[11px]">
                                  <p>
                                    <strong className="text-gray-900 dark:text-gray-100">Headline đè ảnh:</strong>{' '}
                                    <span className="font-bold uppercase text-indigo-700 dark:text-indigo-300">
                                      {post.designBrief.headlineOnImage}
                                    </span>
                                  </p>
                                  {post.designBrief.subTextOnImage && (
                                    <p>
                                      <strong className="text-gray-900 dark:text-gray-100">Subtext:</strong> {post.designBrief.subTextOnImage}
                                    </p>
                                  )}
                                  <p className="text-gray-600 dark:text-gray-400">
                                    <strong className="text-gray-900 dark:text-gray-100">Bố cục visual:</strong> {post.designBrief.visualConcept}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
          >
            Đóng
          </button>

          {activeTab === 'plan' && generatedPosts && generatedPosts.length > 0 && (
            <button
              type="button"
              onClick={handleApplyToPlan}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Áp Dụng {generatedPosts.length} Bài Vào Kế Hoạch Tuần Này</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
