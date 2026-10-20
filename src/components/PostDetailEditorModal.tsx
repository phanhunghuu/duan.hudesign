import React, { useState, useMemo, useEffect } from 'react';
import { WeeklyPlanPost, PostPillar, PostFormatType, PostStatus, BrandProfile } from '../types';
import { 
  X, 
  Calendar, 
  Clock, 
  FileText, 
  Image as ImageIcon, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  Link,
  Layers,
  Palette,
  ExternalLink,
  Lightbulb,
  History,
  Wand2,
  RefreshCw,
  Search,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Flame,
  Check
} from 'lucide-react';
import { 
  checkTopicDuplicate, 
  getSmartTopicSuggestions, 
  generateFullPostContentByAi,
  fetchAiTopicSuggestions,
  fetchAiFullPostContent,
  TopicSuggestion
} from '../utils/aiTopicAndCopywriter';

import { MainTopicSelectWithAdd } from './MainTopicSelectWithAdd';
import { getBrandPillars } from '../utils/pillarUtils';
import { getVietnameseDayOfWeek } from '../utils/dateUtils';

interface PostDetailEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: WeeklyPlanPost | null;
  brand: BrandProfile;
  historyPosts?: (WeeklyPlanPost & { planTitle?: string })[];
  onSavePost: (post: WeeklyPlanPost) => void;
  onUpdateBrand?: (updatedBrand: BrandProfile) => void;
  isLight: boolean;
}

const PILLARS: PostPillar[] = [
  'Chia sẻ kiến thức & Tips',
  'Bán hàng / Khuyến mãi',
  'Tương tác & Minigame',
  'Câu chuyện thương hiệu',
  'Feedback & Khách hàng',
  'Bắt trend / Đời thường',
];

const FORMAT_TYPES: PostFormatType[] = [
  'Single Post (1 ảnh)',
  'Album Carousel (4-6 ảnh)',
  'Reels / Video ngắn',
  'Infographic / Hướng dẫn',
  'Meme / Trích dẫn',
];

const STATUSES: { id: PostStatus; label: string; color: string }[] = [
  { id: 'draft', label: 'Bản thảo', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  { id: 'pending_approval', label: 'Chờ khách duyệt', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  { id: 'approved', label: 'Khách đã duyệt', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { id: 'designed', label: 'Đã thiết kế xong', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  { id: 'published', label: 'Đã đăng bài', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
];

export const PostDetailEditorModal: React.FC<PostDetailEditorModalProps> = ({
  isOpen,
  onClose,
  post,
  brand,
  historyPosts = [],
  onSavePost,
  onUpdateBrand,
  isLight,
}) => {
  const [formData, setFormData] = useState<WeeklyPlanPost>(() => {
    if (post) return { ...post };
    return {
      id: `post_${Date.now()}`,
      dayOfWeek: 'Thứ 2',
      publishDate: new Date().toISOString().split('T')[0],
      publishTime: '08:30',
      pillar: 'Chia sẻ kiến thức & Tips',
      postType: 'Single Post (1 ảnh)',
      title: '',
      hook: '',
      caption: '',
      callToAction: '',
      hashtags: `#${brand.name.replace(/\s+/g, '')}`,
      designBrief: {
        aspectRatio: '4:5 (Dọc chuẩn Facebook)',
        headlineOnImage: '',
        subTextOnImage: '',
        visualConcept: '',
        moodAndTone: brand.designStyle || 'Hiện đại, tối giản',
        assetNotes: '',
      },
      status: 'draft',
      clientNote: '',
    };
  });

  // Đồng bộ formData chính xác khi người dùng mở hoặc đổi bài viết cần sửa
  useEffect(() => {
    if (isOpen) {
      if (post) {
        setFormData({ ...post });
      } else {
        setFormData({
          id: `post_${Date.now()}`,
          dayOfWeek: 'Thứ 2',
          publishDate: new Date().toISOString().split('T')[0],
          publishTime: '08:30',
          pillar: 'Chia sẻ kiến thức & Tips',
          postType: 'Single Post (1 ảnh)',
          title: '',
          hook: '',
          caption: '',
          callToAction: '',
          hashtags: `#${brand.name.replace(/\s+/g, '')}`,
          designBrief: {
            aspectRatio: '4:5 (Dọc chuẩn Facebook)',
            headlineOnImage: '',
            subTextOnImage: '',
            visualConcept: '',
            moodAndTone: brand.designStyle || 'Hiện đại, tối giản',
            assetNotes: '',
          },
          status: 'draft',
          clientNote: '',
        });
      }
      setShowTopicSuggestions(false);
      setAiSuccessMessage(null);
      setActiveTab('content');
    }
  }, [post, isOpen, brand]);

  const [activeTab, setActiveTab] = useState<'content' | 'brief'>('content');
  
  // UI states for AI & History
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedTone, setSelectedTone] = useState<'brand' | 'viral_hook' | 'expert' | 'emotional' | 'humorous'>('brand');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  
  // AI Dynamic Topics & Status
  const [aiTopicSuggestions, setAiTopicSuggestions] = useState<TopicSuggestion[]>([]);
  const [isLoadingAiTopics, setIsLoadingAiTopics] = useState(false);
  const [aiModeUsed, setAiModeUsed] = useState<'gemini_ai' | 'fallback_engine' | null>(null);

  // History search state
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyPillarFilter, setHistoryPillarFilter] = useState<string>('all');

  // Lấy danh sách tiêu đề trong lịch sử để tránh trùng lặp khi gợi ý
  const historyTitles = useMemo(() => {
    return historyPosts.map((p) => p.title).filter(Boolean);
  }, [historyPosts]);

  // Kiểm tra trùng lặp chủ đề trong thời gian thực
  const duplicateCheck = useMemo(() => {
    return checkTopicDuplicate(formData.title, historyPosts, formData.id);
  }, [formData.title, historyPosts, formData.id]);

  // Gợi ý chủ đề thông minh dự phòng
  const fallbackTopicSuggestions = useMemo(() => {
    return getSmartTopicSuggestions(brand, formData.pillar, formData.dayOfWeek, historyTitles);
  }, [brand, formData.pillar, formData.dayOfWeek, historyTitles]);

  // Danh sách chủ đề hiển thị (Ưu tiên AI Gemini phân tích chuyên sâu)
  const displayTopicSuggestions = aiTopicSuggestions.length > 0 ? aiTopicSuggestions : fallbackTopicSuggestions;

  // Gọi Gemini AI gợi ý chủ đề mới phân tích sâu thương hiệu
  const handleLoadAiTopics = async () => {
    setIsLoadingAiTopics(true);
    try {
      const res = await fetchAiTopicSuggestions(
        brand,
        formData.pillar,
        formData.dayOfWeek,
        historyTitles,
        formData.title
      );
      setAiTopicSuggestions(res.suggestions);
      setAiModeUsed(res.mode);
    } catch (err) {
      console.error(err);
      setAiTopicSuggestions(fallbackTopicSuggestions);
    } finally {
      setIsLoadingAiTopics(false);
    }
  };

  // Lọc danh sách lịch sử chủ đề
  const filteredHistoryPosts = useMemo(() => {
    return historyPosts.filter((p) => {
      const matchQuery = !historySearchQuery.trim() || 
        p.title.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        (p.caption && p.caption.toLowerCase().includes(historySearchQuery.toLowerCase()));
      const matchPillar = historyPillarFilter === 'all' || p.pillar === historyPillarFilter;
      return matchQuery && matchPillar;
    });
  }, [historyPosts, historySearchQuery, historyPillarFilter]);

  if (!isOpen) return null;

  // Xử lý áp dụng chủ đề gợi ý
  const handleApplyTopicSuggestion = (sug: TopicSuggestion, autoGenerate: boolean = false) => {
    const updated = {
      ...formData,
      title: sug.title,
    };
    setFormData(updated);
    setShowTopicSuggestions(false);

    if (autoGenerate) {
      handleTriggerAiWriting(sug.title);
    }
  };

  // Kích hoạt AI viết bài tự động phân tích sâu thương hiệu
  const handleTriggerAiWriting = async (customTitle?: string) => {
    const targetTitle = customTitle || formData.title;
    if (!targetTitle.trim()) {
      alert('Vui lòng nhập hoặc chọn một tiêu đề/chủ đề bài viết trước khi để AI viết bài!');
      return;
    }

    setIsAiGenerating(true);
    setAiSuccessMessage(null);

    try {
      const generated = await fetchAiFullPostContent({
        brand,
        title: targetTitle,
        pillar: formData.pillar,
        postType: formData.postType,
        dayOfWeek: formData.dayOfWeek,
        toneStyle: selectedTone,
      });

      setFormData((prev) => ({
        ...prev,
        title: targetTitle,
        hook: generated.hook,
        caption: generated.caption,
        callToAction: generated.callToAction,
        hashtags: generated.hashtags,
        designBrief: {
          ...prev.designBrief,
          ...generated.designBrief,
        },
      }));

      setAiModeUsed(generated.mode);
      setAiSuccessMessage(
        generated.mode === 'gemini_ai'
          ? `🤖 AI Gemini đã phân tích sâu thương hiệu "${brand.name}" và viết xong toàn bộ bài viết!`
          : `✨ Đã hoàn thiện toàn bộ bài viết và đồng bộ Brief thiết kế sang Tab 2!`
      );
      setTimeout(() => setAiSuccessMessage(null), 6000);
    } catch (err) {
      console.error(err);
      // fallback
      const fallbackGen = generateFullPostContentByAi({
        brand,
        title: targetTitle,
        pillar: formData.pillar,
        postType: formData.postType,
        dayOfWeek: formData.dayOfWeek,
        toneStyle: selectedTone,
      });
      setFormData((prev) => ({
        ...prev,
        title: targetTitle,
        hook: fallbackGen.hook,
        caption: fallbackGen.caption,
        callToAction: fallbackGen.callToAction,
        hashtags: fallbackGen.hashtags,
        designBrief: {
          ...prev.designBrief,
          ...fallbackGen.designBrief,
        },
      }));
      setAiSuccessMessage('✨ Đã viết bài theo hồ sơ thương hiệu!');
      setTimeout(() => setAiSuccessMessage(null), 4000);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSavePost({
      ...formData,
      id: post ? post.id : formData.id,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print overflow-y-auto">
      <div className={`relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border ${
        isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#181F2E] border-gray-800 text-gray-100'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isLight ? 'border-gray-200 bg-gray-50/70' : 'border-gray-800 bg-gray-900/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {post ? 'Chỉnh Sửa Bài Đăng' : 'Tạo Bài Đăng Mới'} ({brand.name})
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Nội dung bài viết (Content Copywriting) & Brief thiết kế hình ảnh cho Designer
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

        {/* Schedule & Pillar Quick Bar */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/40 dark:bg-gray-900/20 grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-gray-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-indigo-500" />
              <span>Ngày đăng</span>
            </label>
            <input
              type="date"
              value={formData.publishDate || ''}
              onChange={(e) => {
                const newDate = e.target.value;
                const autoDay = newDate ? getVietnameseDayOfWeek(newDate) : formData.dayOfWeek;
                setFormData({
                  ...formData,
                  publishDate: newDate,
                  dayOfWeek: autoDay,
                });
              }}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-semibold ${
                isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-gray-100'
              }`}
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-500 mb-1">Thứ trong tuần</label>
            <select
              value={formData.dayOfWeek}
              onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value as any })}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-medium ${
                isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
              }`}
            >
              <option value="Thứ 2">Thứ 2</option>
              <option value="Thứ 3">Thứ 3</option>
              <option value="Thứ 4">Thứ 4</option>
              <option value="Thứ 5">Thứ 5</option>
              <option value="Thứ 6">Thứ 6</option>
              <option value="Thứ 7">Thứ 7</option>
              <option value="Chủ Nhật">Chủ Nhật</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-500 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-500" />
              <span>Giờ đăng</span>
            </label>
            <input
              type="text"
              value={formData.publishTime}
              placeholder="VD: 08:30 hoặc 19:30"
              onChange={(e) => setFormData({ ...formData, publishTime: e.target.value })}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-medium ${
                isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
              }`}
            />
          </div>

          <div>
            <MainTopicSelectWithAdd
              brand={brand}
              value={formData.pillar}
              onChange={(newPillar) => setFormData({ ...formData, pillar: newPillar as any })}
              onUpdateBrand={onUpdateBrand}
              isLight={isLight}
              label="Chủ đề chính"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-500 mb-1">Loại bài đăng</label>
            <select
              value={formData.postType}
              onChange={(e) => setFormData({ ...formData, postType: e.target.value as any })}
              className={`w-full px-2.5 py-1.5 rounded-lg border ${
                isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
              }`}
            >
              {FORMAT_TYPES.map((fmt) => (
                <option key={fmt} value={fmt}>{fmt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-500 mb-1">Trạng thái duyệt</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className={`w-full px-2.5 py-1.5 rounded-lg font-bold border ${
                isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
              }`}
            >
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Switching: Content vs Brief */}
        <div className="px-6 pt-3 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'content'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            1. Nội Dung Bài Viết (Copywriting)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('brief')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'brief'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            2. Brief Thiết Kế Hình Ảnh (Design Brief)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'content' ? (
            /* TAB 1: CONTENT COPYWRITING */
            <div className="space-y-4">
              {/* Khu vực Tiêu đề bài viết kèm Gợi ý AI & Lịch sử */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Tiêu đề / Chủ đề bài viết *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const nextShow = !showTopicSuggestions;
                        setShowTopicSuggestions(nextShow);
                        if (nextShow && aiTopicSuggestions.length === 0) {
                          handleLoadAiTopics();
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                      <span>{showTopicSuggestions ? 'Đóng gợi ý' : 'Gợi ý chủ đề AI'}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100">
                        {displayTopicSuggestions.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowHistoryModal(true)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-gray-500" />
                      <span>Lịch sử chủ đề</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {historyPosts.length}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Panel Danh sách gợi ý chủ đề thông minh */}
                {showTopicSuggestions && (
                  <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-200">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Chủ đề chuyên sâu cho "{brand.name}" • Trụ cột: {formData.pillar} ({formData.dayOfWeek})</span>
                        {aiModeUsed === 'gemini_ai' && (
                          <span className="px-1.5 py-0.2 rounded-sm text-[9px] font-black uppercase bg-emerald-600 text-white">
                            Gemini AI
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={isLoadingAiTopics}
                        onClick={handleLoadAiTopics}
                        className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingAiTopics ? 'animate-spin' : ''}`} />
                        <span>{isLoadingAiTopics ? 'Đang phân tích...' : 'Làm mới gợi ý'}</span>
                      </button>
                    </div>

                    {isLoadingAiTopics ? (
                      <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-indigo-700 dark:text-indigo-300">
                        <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                        <span className="font-semibold">AI Gemini đang phân tích chuyên sâu hồ sơ thương hiệu {brand.name} ({brand.industry})...</span>
                        <span className="text-[11px] text-gray-500">Đang đối chiếu các bài đã viết để đảm bảo không trùng lặp ý tưởng</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {displayTopicSuggestions.map((sug, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                              isLight ? 'bg-white border-indigo-100 hover:border-indigo-300' : 'bg-gray-900 border-gray-800 hover:border-indigo-700'
                            }`}
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                                  {sug.angle}
                                </span>
                                <span className="text-[10px] text-gray-400">#Gợi ý {idx + 1}</span>
                              </div>
                              <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {sug.title}
                              </p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
                                💡 {sug.whyGood}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <button
                                type="button"
                                onClick={() => handleApplyTopicSuggestion(sug, false)}
                                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition cursor-pointer"
                              >
                                Chọn tiêu đề này
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApplyTopicSuggestion(sug, true)}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center gap-1 cursor-pointer"
                              >
                                <Wand2 className="w-3 h-3" />
                                Chọn & AI viết luôn
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Ô input Tiêu đề */}
                <input
                  type="text"
                  required
                  placeholder="VD: Bí quyết ủ Cold Brew tại nhà thơm ngon chuẩn vị"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                  }`}
                />

                {/* Cảnh báo trùng lặp chủ đề hoặc Báo xanh mới mẻ */}
                {duplicateCheck.isDuplicate && duplicateCheck.matchedPost ? (
                  <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-800 dark:text-amber-300">
                          ⚠️ Cảnh báo trùng lặp chủ đề ({duplicateCheck.similarity}% tương đồng)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 font-semibold">
                          {duplicateCheck.matchedPost.planTitle || 'Tuần trước'} ({duplicateCheck.matchedPost.dayOfWeek})
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Bài đã viết: <strong>"{duplicateCheck.matchedPost.title}"</strong>.
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300/90 italic">
                        💡 Lời khuyên: Bạn nên khai thác góc nhìn mới hoặc bấm "Gợi ý chủ đề AI" ở trên để nội dung luôn mới mẻ, thu hút tương tác tốt hơn!
                      </p>
                    </div>
                  </div>
                ) : formData.title.trim().length >= 6 ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Chủ đề mới mẻ, không bị trùng lặp với {historyPosts.length} bài viết đã lưu trong các tuần trước.</span>
                  </div>
                ) : null}
              </div>

              {/* KHỐI AI COPYWRITER & BRIEF STUDIO */}
              <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <Wand2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                        Trợ Lý AI Viết Bài Tự Động
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-indigo-600 text-white">
                          Pro
                        </span>
                      </h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Sinh trọn bộ: Hook dừng lướt, Full Caption, CTA, Hashtag & Brief ảnh sang Tab 2
                      </p>
                    </div>
                  </div>

                  {/* Chọn Tone giọng văn */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="text-[11px] font-bold text-gray-500">Giọng văn:</span>
                    <select
                      value={selectedTone}
                      onChange={(e) => setSelectedTone(e.target.value as any)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold ${
                        isLight ? 'bg-white border-gray-300 text-gray-800' : 'bg-gray-900 border-gray-700 text-gray-200'
                      }`}
                    >
                      <option value="brand">🎯 Chuẩn Brand ({brand.toneOfVoice || 'Thân thiện'})</option>
                      <option value="viral_hook">🔥 Bắt mắt & Dừng lướt (Viral Hook)</option>
                      <option value="expert">🧠 Chuyên gia & Cẩm nang giá trị</option>
                      <option value="emotional">❤️ Gần gũi, ấm áp & Cảm xúc</option>
                      <option value="humorous">😄 Hài hước & Bắt trend</option>
                    </select>
                  </div>
                </div>

                {/* Khối hiển thị dữ liệu thương hiệu AI đang phân tích */}
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-gray-900/80 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      Đang phân tích chuyên sâu: <strong className="text-indigo-600 dark:text-indigo-400">{brand.name}</strong> • Ngành: {brand.industry || 'Dịch vụ'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                    <span>Tone: <strong>{brand.toneOfVoice || 'Thân thiện, uy tín'}</strong></span>
                    {brand.businessDescription ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                        ✓ Đã nạp mô tả kinh doanh
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                        ℹ️ Chưa có mô tả chi tiết
                      </span>
                    )}
                  </div>
                </div>

                {/* Các nút bấm AI */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isAiGenerating}
                    onClick={() => handleTriggerAiWriting()}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isAiGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>AI đang phân tích & viết bài...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>✨ AI Viết Toàn Bộ Bài Viết (1 Click)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isAiGenerating}
                    onClick={() => {
                      if (!formData.title.trim()) {
                        alert('Vui lòng có tiêu đề trước để AI viết câu Hook!');
                        return;
                      }
                      handleTriggerAiWriting();
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    Sinh lại toàn bộ
                  </button>

                  <button
                    type="button"
                    disabled={isAiGenerating}
                    onClick={() => {
                      if (!formData.title.trim()) {
                        alert('Vui lòng có tiêu đề trước để AI viết lại caption!');
                        return;
                      }
                      const gen = generateFullPostContentByAi({
                        brand,
                        title: formData.title,
                        pillar: formData.pillar,
                        postType: formData.postType,
                        dayOfWeek: formData.dayOfWeek,
                        toneStyle: selectedTone,
                      });
                      setFormData((p) => ({ ...p, caption: gen.caption }));
                      setAiSuccessMessage('✨ Đã sinh lại toàn bộ Caption chi tiết!');
                      setTimeout(() => setAiSuccessMessage(null), 3000);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    Viết lại Caption
                  </button>

                  <button
                    type="button"
                    disabled={isAiGenerating}
                    onClick={() => {
                      if (!formData.title.trim()) {
                        alert('Vui lòng có tiêu đề trước để đồng bộ Brief thiết kế!');
                        return;
                      }
                      const gen = generateFullPostContentByAi({
                        brand,
                        title: formData.title,
                        pillar: formData.pillar,
                        postType: formData.postType,
                        dayOfWeek: formData.dayOfWeek,
                        toneStyle: selectedTone,
                      });
                      setFormData((p) => ({ 
                        ...p, 
                        designBrief: { ...p.designBrief, ...gen.designBrief } 
                      }));
                      setAiSuccessMessage('🎨 Đã đồng bộ ý tưởng hình ảnh sang Tab 2 (Design Brief)!');
                      setTimeout(() => setAiSuccessMessage(null), 3000);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5 text-pink-500" />
                    Đồng bộ Brief ảnh (Tab 2)
                  </button>
                </div>

                {/* Thông báo kết quả AI */}
                {aiSuccessMessage && (
                  <div className="px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{aiSuccessMessage}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center justify-between">
                  <span>Câu Hook mở đầu (3 giây đầu / Dòng đầu tiên giật tít)</span>
                  <span className="text-[11px] font-normal text-blue-600">Quyết định 80% tỷ lệ dừng lướt</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Đừng vội mua cà phê nếu bạn chưa biết mẹo này..."
                  value={formData.hook}
                  onChange={(e) => setFormData({ ...formData, hook: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Nội dung chi tiết bài viết (Full Caption)
                </label>
                <textarea
                  rows={8}
                  placeholder="Viết toàn bộ nội dung bài đăng, bao gồm các ý chính, gạch đầu dòng, cảm xúc..."
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm leading-relaxed border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Lời kêu gọi hành động (Call To Action - CTA)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Inbox ngay để nhận voucher giảm 20% hôm nay!"
                    value={formData.callToAction}
                    onChange={(e) => setFormData({ ...formData, callToAction: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Bộ Hashtags
                  </label>
                  <input
                    type="text"
                    placeholder="#ThuongHieu #ColdBrew #CoffeeGuide"
                    value={formData.hashtags}
                    onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                    }`}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: DESIGN BRIEF */
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <p className="font-bold text-blue-700 dark:text-blue-400">
                  🎨 Nhắc lại Quy chuẩn thương hiệu {brand.name}:
                </p>
                <p>• Màu chính: <span className="font-mono">{brand.colors.primary}</span> | Màu phụ: <span className="font-mono">{brand.colors.secondary}</span></p>
                <p>• Font: <strong>{brand.fonts.headingFont}</strong> (Tiêu đề) - <strong>{brand.fonts.primaryFont}</strong> (Nội dung)</p>
                <p>• Style: {brand.designStyle}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Tỉ lệ hình ảnh (Aspect Ratio)
                  </label>
                  <select
                    value={formData.designBrief.aspectRatio}
                    onChange={(e) => setFormData({
                      ...formData,
                      designBrief: { ...formData.designBrief, aspectRatio: e.target.value as any }
                    })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                    }`}
                  >
                    <option value="4:5 (Dọc chuẩn Facebook)">4:5 (Dọc chuẩn Facebook mobile)</option>
                    <option value="1:1 (Vuông)">1:1 (Ảnh vuông Instagram/Feed)</option>
                    <option value="Album 4 ảnh (1 dọc 3 vuông)">Album 4 ảnh (1 dọc 3 vuông)</option>
                    <option value="9:16 (Story / Reel)">9:16 (Story / Reels / TikTok)</option>
                    <option value="16:9 (Ngang)">16:9 (Ngang / Banner)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Chữ chính đè trên hình (Main Visual Headline)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 3 BÍ QUYẾT Ủ COLD BREW TẠI NHÀ"
                    value={formData.designBrief.headlineOnImage}
                    onChange={(e) => setFormData({
                      ...formData,
                      designBrief: { ...formData.designBrief, headlineOnImage: e.target.value }
                    })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm font-bold border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Chữ phụ đè trên hình (Subtext on Image)
                </label>
                <input
                  type="text"
                  placeholder="VD: Thơm ngon • Tiết kiệm • Dễ làm"
                  value={formData.designBrief.subTextOnImage || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    designBrief: { ...formData.designBrief, subTextOnImage: e.target.value }
                  })}
                  className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Mô tả ý tưởng & bố cục hình ảnh (Visual Concept & Layout)
                </label>
                <textarea
                  rows={4}
                  placeholder="VD: Chai thủy tinh Cold Brew đặt nghiêng góc 45 độ, xung quanh có vài lát cam vàng và hạt cà phê rơi tự nhiên. Ánh sáng xiên chiều, nền gỗ mộc mạc..."
                  value={formData.designBrief.visualConcept}
                  onChange={(e) => setFormData({
                    ...formData,
                    designBrief: { ...formData.designBrief, visualConcept: e.target.value }
                  })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm leading-relaxed border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Mood & Tone hình ảnh
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Ấm áp, mộc mạc, sang trọng, màu vintage nhẹ..."
                    value={formData.designBrief.moodAndTone}
                    onChange={(e) => setFormData({
                      ...formData,
                      designBrief: { ...formData.designBrief, moodAndTone: e.target.value }
                    })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Ghi chú tài nguyên ảnh raw / Link Drive
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Lấy ảnh trong thư mục /Assets/Chai-ColdBrew-01.jpg"
                    value={formData.designBrief.assetNotes || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      designBrief: { ...formData.designBrief, assetNotes: e.target.value }
                    })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                    }`}
                  />
                </div>
              </div>

              {/* Chèn link ảnh đã thiết kế hoàn thiện */}
              <div className="p-4 rounded-xl border-2 border-dashed border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    Link Ảnh Đã Thiết Kế Xong (Designed Image URL)
                  </label>
                  {formData.designedImageUrl && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ✓ Đã có ảnh thiết kế
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Dán link ảnh (https://...jpg, png, Cloudinary, Imgur, Drive...)"
                    value={formData.designedImageUrl || ''}
                    onChange={(e) => {
                      const url = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        designedImageUrl: url,
                        // Tự động chuyển trạng thái sang đã thiết kế nếu trước đó là draft/chờ duyệt
                        status: url.trim() && (prev.status === 'draft' || prev.status === 'pending_approval') 
                          ? 'designed' 
                          : prev.status
                      }));
                    }}
                    className={`flex-1 px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 outline-hidden ${
                      isLight ? 'bg-white border-emerald-300 text-gray-900' : 'bg-gray-900 border-emerald-800 text-gray-100'
                    }`}
                  />
                  {formData.designedImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, designedImageUrl: '' })}
                      className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg border border-red-200 transition"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>

                {/* Preview ảnh nếu có link */}
                {formData.designedImageUrl && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                      <span>Xem trước ảnh thiết kế thực tế:</span>
                      <a 
                        href={formData.designedImageUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-emerald-600 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        Mở ảnh tab mới <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="w-full max-w-xs mx-auto aspect-4/5 sm:aspect-square rounded-xl overflow-hidden border border-emerald-300 shadow-md bg-gray-100 relative flex items-center justify-center">
                      <img
                        src={formData.designedImageUrl}
                        alt="Ảnh thiết kế"
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  💡 Khi chèn link ảnh, bản in duyệt PDF sẽ tự động hiển thị tác phẩm hoàn thiện này để khách hàng xem duyệt song song cùng nội dung caption!
                </p>
              </div>
            </div>
          )}

          {/* Ghi chú phản hồi của khách hàng */}
          <div className="p-3.5 rounded-xl border bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1">
              Ghi chú / Yêu cầu chỉnh sửa từ khách hàng (Client Feedback)
            </label>
            <input
              type="text"
              placeholder="VD: Khách duyệt layout nhưng yêu cầu chỉnh lại font số to hơn..."
              value={formData.clientNote || ''}
              onChange={(e) => setFormData({ ...formData, clientNote: e.target.value })}
              className={`w-full px-3 py-1.5 rounded-lg text-xs border ${
                isLight ? 'bg-white border-amber-300' : 'bg-gray-900 border-amber-700'
              }`}
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t flex items-center justify-between">
            <div className="text-xs text-gray-400">
              * Nhớ lưu lại sau khi hoàn tất chỉnh sửa
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Lưu Bài Đăng
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* MODAL LỊCH SỬ CÁC CHỦ ĐỀ ĐÃ VIẾT */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border ${
            isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#181F2E] border-gray-800 text-gray-100'
          }`}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    Lịch Sử Chủ Đề Đã Viết ({brand.name})
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tổng cộng {historyPosts.length} bài viết đã lập kế hoạch qua các tuần
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bộ lọc & Tìm kiếm */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên chủ đề, từ khóa..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                  }`}
                />
              </div>

              <select
                value={historyPillarFilter}
                onChange={(e) => setHistoryPillarFilter(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs border font-medium ${
                  isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                }`}
              >
                <option value="all">Tất cả chủ đề chính ({historyPosts.length})</option>
                {getBrandPillars(brand).map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Danh sách bài viết trong lịch sử */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredHistoryPosts.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  Không tìm thấy bài viết nào phù hợp với bộ lọc.
                </div>
              ) : (
                filteredHistoryPosts.map((hPost) => (
                  <div
                    key={hPost.id}
                    className={`p-3 rounded-xl border transition ${
                      isLight ? 'bg-white border-gray-200 hover:border-indigo-300' : 'bg-gray-900/60 border-gray-800 hover:border-indigo-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {hPost.planTitle || 'Tuần'} • {hPost.dayOfWeek}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          {hPost.pillar}
                        </span>
                      </div>
                      <span className="text-gray-400 text-[10px]">
                        {hPost.publishDate}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {hPost.title}
                    </p>

                    {hPost.hook && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 italic mb-2">
                        Hook: "{hPost.hook}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800/60">
                      <span className="text-[10px] text-gray-400">
                        Định dạng: {hPost.postType}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            title: `${hPost.title} (Góc nhìn mới)`,
                            pillar: hPost.pillar,
                          }));
                          setShowHistoryModal(false);
                        }}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Dùng làm nền tảng (Đổi góc nhìn) <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
              <span className="text-gray-400">
                Hiển thị {filteredHistoryPosts.length} / {historyPosts.length} bài
              </span>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
