import React, { useState, useEffect, useMemo } from 'react';
import { BrandProfile, WeeklyPlan, WeeklyPlanPost, PostStatus, StudioProfile } from '../types';
import { initialBrandProfiles, initialWeeklyPlans } from '../data/initialContentPlanData';
import {
  subscribeBrands,
  subscribeWeeklyPlans,
  saveBrandToCloud,
  saveWeeklyPlanToCloud,
  deleteWeeklyPlanFromCloud,
} from '../utils/firebaseStorage';
import { BrandGuidelineModal } from './BrandGuidelineModal';
import { ContentIdeaModal } from './ContentIdeaModal';
import { PostDetailEditorModal } from './PostDetailEditorModal';
import { WeeklyPlanPrintView } from './WeeklyPlanPrintView';
import { BrandProposalExportView } from './BrandProposalExportView';
import { AiAutoPlanModal } from './AiAutoPlanModal';
import { ManageWeeksModal } from './ManageWeeksModal';
import { CreateMonthPlanModal } from './CreateMonthPlanModal';
import { MasterCalendarPlanTable } from './MasterCalendarPlanTable';
import { GeneratedIdea } from '../utils/contentIdeaGenerator';
import { getPillarColorStyle, getBrandPillars } from '../utils/pillarUtils';
import { 
  Calendar, 
  Sparkles, 
  Plus, 
  Printer, 
  Copy, 
  Check, 
  Palette, 
  Clock, 
  FileText, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Image as ImageIcon,
  Share2,
  SlidersHorizontal,
  Search,
  LayoutGrid,
  ListFilter,
  ExternalLink,
  Tag,
  CalendarDays,
  CalendarRange,
  Archive
} from 'lucide-react';

interface FanpageWeeklyPlannerProps {
  studioProfile: StudioProfile;
  isLight: boolean;
}

export const FanpageWeeklyPlanner: React.FC<FanpageWeeklyPlannerProps> = ({
  studioProfile,
  isLight,
}) => {
  // Brand profiles state
  const [brands, setBrands] = useState<BrandProfile[]>(() => {
    try {
      const saved = localStorage.getItem('hu_design_brand_profiles_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return initialBrandProfiles;
  });

  const [selectedBrandId, setSelectedBrandIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('hu_design_selected_brand_id');
      if (saved && brands.some((b) => b.id === saved)) return saved;
    } catch (e) {}
    return brands[0]?.id || 'brand_vintage_roastery';
  });

  const setSelectedBrandId = (id: string) => {
    setSelectedBrandIdState(id);
    try {
      localStorage.setItem('hu_design_selected_brand_id', id);
    } catch (e) {}
  };

  const activeBrand = brands.find((b) => b.id === selectedBrandId) || brands[0];

  // Weekly plans state
  const [plans, setPlans] = useState<WeeklyPlan[]>(() => {
    try {
      const saved = localStorage.getItem('hu_design_weekly_plans_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return initialWeeklyPlans;
  });

  // Selected plan ID state
  const [selectedPlanId, setSelectedPlanIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('hu_design_selected_plan_id');
      if (saved && plans.some((p) => p.id === saved)) return saved;
    } catch (e) {}
    const brandFirstPlan = plans.find((p) => p.brandId === (brands[0]?.id || 'brand_vintage_roastery'));
    return brandFirstPlan?.id || plans[0]?.id || 'plan_roastery_w36';
  });

  const setSelectedPlanId = (id: string) => {
    setSelectedPlanIdState(id);
    try {
      localStorage.setItem('hu_design_selected_plan_id', id);
    } catch (e) {}
  };

  // Realtime cloud listener for Brands and Weekly Plans
  useEffect(() => {
    const unsubBrands = subscribeBrands((cloudBrands) => {
      if (cloudBrands && cloudBrands.length > 0) {
        setBrands(cloudBrands);
      }
    });

    const unsubPlans = subscribeWeeklyPlans((cloudPlans) => {
      if (cloudPlans && cloudPlans.length > 0) {
        setPlans(cloudPlans);
      }
    });

    return () => {
      unsubBrands();
      unsubPlans();
    };
  }, []);

  // Current active plan for selected brand & plan
  const brandPlans = useMemo(() => plans.filter((p) => p.brandId === activeBrand.id), [plans, activeBrand.id]);
  const brandMonthPlans = useMemo(() => brandPlans.filter((p) => p.planType === 'month'), [brandPlans]);
  const brandWeekPlans = useMemo(() => brandPlans.filter((p) => p.planType !== 'month'), [brandPlans]);
  const [planFilterType, setPlanFilterType] = useState<'all' | 'month' | 'week'>('all');

  const activePlan = brandPlans.find((p) => p.id === selectedPlanId) || brandPlans[0] || {
    id: `plan_${activeBrand.id}_current`,
    brandId: activeBrand.id,
    title: `Kế hoạch tuần này - ${activeBrand.name}`,
    weekNumber: 36,
    year: 2026,
    startDate: '2026-09-01',
    endDate: '2026-09-07',
    mainGoal: 'Tăng tương tác và đẩy mạnh bán hàng cho tuần',
    status: 'draft',
    posts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const isCurrentPlanMonth = activePlan.planType === 'month';

  // Toàn bộ bài viết trong lịch sử của brand hiện tại (qua tất cả các tuần) để kiểm tra trùng lặp
  const historyPostsForActiveBrand = useMemo(() => {
    return plans
      .filter((p) => p.brandId === activeBrand.id)
      .flatMap((p) =>
        p.posts.map((post) => ({
          ...post,
          planTitle: p.title,
        }))
      );
  }, [plans, activeBrand.id]);

  // View state: 'planner', 'print_preview', or 'brand_proposal'
  const [viewMode, setViewMode] = useState<'planner' | 'print_preview' | 'brand_proposal'>('planner');
  const [plannerLayout, setPlannerLayout] = useState<'calendar_table' | 'grid' | 'list'>('calendar_table');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [isPostEditorOpen, setIsPostEditorOpen] = useState(false);
  const [isAutoPlanModalOpen, setIsAutoPlanModalOpen] = useState(false);
  const [isManageWeeksModalOpen, setIsManageWeeksModalOpen] = useState(false);
  const [isCreateMonthPlanModalOpen, setIsCreateMonthPlanModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<WeeklyPlanPost | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Tự động chuyển selectedPlanId khi đổi brand nếu cần
  const handleSelectBrand = (brandId: string) => {
    setSelectedBrandId(brandId);
    const targetBrandPlans = plans.filter((p) => p.brandId === brandId);
    if (targetBrandPlans.length > 0) {
      setSelectedPlanId(targetBrandPlans[0].id);
    }
  };

  // AI Auto Plan Handler
  const handleApplyAiPlan = (newPosts: WeeklyPlanPost[], replaceExisting: boolean) => {
    updateActivePlan((prev) => ({
      ...prev,
      posts: replaceExisting ? newPosts : [...prev.posts, ...newPosts],
    }));
    showToast(`AI đã áp dụng thành công ${newPosts.length} bài viết vào ${activePlan.title}!`);
  };

  // Create new weekly plan
  const handleCreatePlan = (newPlan: WeeklyPlan) => {
    const nextPlans = [newPlan, ...plans];
    setPlans(nextPlans);
    setSelectedPlanId(newPlan.id);
    try {
      localStorage.setItem('hu_design_weekly_plans_v1', JSON.stringify(nextPlans));
    } catch (e) {}
    saveWeeklyPlanToCloud(newPlan);
    showToast(`Đã tạo kế hoạch mới: "${newPlan.title}"!`);
  };

  // Update plan status (archive, draft, etc)
  const handleUpdatePlanStatus = (planId: string, status: WeeklyPlan['status']) => {
    const nextPlans = plans.map((p) => (p.id === planId ? { ...p, status, updatedAt: new Date().toISOString() } : p));
    setPlans(nextPlans);
    const updatedPlan = nextPlans.find((p) => p.id === planId);
    if (updatedPlan) {
      saveWeeklyPlanToCloud(updatedPlan);
    }
    try {
      localStorage.setItem('hu_design_weekly_plans_v1', JSON.stringify(nextPlans));
    } catch (e) {}
    showToast(status === 'completed' ? 'Đã lưu trữ tuần này!' : 'Đã mở lại tuần này!');
  };

  // Delete plan
  const handleDeletePlan = (planId: string) => {
    if (brandPlans.length <= 1) {
      showToast('Cần giữ lại ít nhất 1 tuần kế hoạch!');
      return;
    }
    const nextPlans = plans.filter((p) => p.id !== planId);
    setPlans(nextPlans);
    const remaining = nextPlans.filter((p) => p.brandId === activeBrand.id);
    if (remaining.length > 0) {
      setSelectedPlanId(remaining[0].id);
    }
    try {
      localStorage.setItem('hu_design_weekly_plans_v1', JSON.stringify(nextPlans));
    } catch (e) {}
    deleteWeeklyPlanFromCloud(planId);
    showToast('Đã xóa kế hoạch tuần!');
  };

  // Save brands to state and localStorage
  const handleSaveBrand = (updatedBrand: BrandProfile) => {
    const nextBrands = brands.map((b) => (b.id === updatedBrand.id ? updatedBrand : b));
    setBrands(nextBrands);
    try {
      localStorage.setItem('hu_design_brand_profiles_v1', JSON.stringify(nextBrands));
    } catch (e) {
      console.error(e);
    }
    saveBrandToCloud(updatedBrand);
    showToast(`Đã lưu quy chuẩn thương hiệu "${updatedBrand.name}"!`);
  };

  const handleUpdateBrandStrategy = (strategy: any) => {
    const updatedBrand: BrandProfile = {
      ...activeBrand,
      brandStrategy: strategy,
      updatedAt: new Date().toISOString(),
    };
    handleSaveBrand(updatedBrand);
  };

  const handleCreateNewBrand = () => {
    const newBrand: BrandProfile = {
      id: `brand_${Date.now()}`,
      name: `Thương hiệu mới ${brands.length + 1}`,
      fanpageName: `Fanpage mới`,
      industry: 'F&B / Bán lẻ',
      colors: {
        primary: '#1E293B',
        secondary: '#3B82F6',
        accent: '#F59E0B',
        background: '#FFFFFF',
      },
      fonts: {
        primaryFont: 'Be Vietnam Pro',
        headingFont: 'Playfair Display',
      },
      designStyle: 'Hiện đại, tối giản, thanh lịch',
      toneOfVoice: 'Chuyên nghiệp, thân thiện',
      dos: ['Dùng đúng bảng màu nhận diện', 'Chèn hotline cuối bài'],
      donts: ['Không viết hoa toàn bộ', 'Không dùng hình ảnh mờ nhòe'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextBrands = [...brands, newBrand];
    setBrands(nextBrands);
    setSelectedBrandId(newBrand.id);
    try {
      localStorage.setItem('hu_design_brand_profiles_v1', JSON.stringify(nextBrands));
    } catch (e) {}
    saveBrandToCloud(newBrand);
    setIsBrandModalOpen(true);
  };

  // Save Plan updates
  const updateActivePlan = (updater: (prev: WeeklyPlan) => WeeklyPlan) => {
    const updated = updater(activePlan);
    updated.updatedAt = new Date().toISOString();

    const exists = plans.some((p) => p.id === updated.id);
    const nextPlans = exists ? plans.map((p) => (p.id === updated.id ? updated : p)) : [...plans, updated];

    setPlans(nextPlans);
    try {
      localStorage.setItem('hu_design_weekly_plans_v1', JSON.stringify(nextPlans));
    } catch (e) {}
    saveWeeklyPlanToCloud(updated);
  };

  const handleSaveWeeklyPlan = (updated: WeeklyPlan) => {
    updateActivePlan(() => updated);
  };

  const handleSavePost = (savedPost: WeeklyPlanPost) => {
    updateActivePlan((prev) => {
      // Xác định chính xác bài viết đang sửa: ưu tiên editingPost.id hoặc savedPost.id
      const targetId = editingPost ? editingPost.id : savedPost.id;
      const exists = prev.posts.some((p) => p.id === targetId || p.id === savedPost.id);

      const nextPosts = exists
        ? prev.posts.map((p) => (p.id === targetId || p.id === savedPost.id ? { ...savedPost, id: targetId } : p))
        : [...prev.posts, savedPost];
      return { ...prev, posts: nextPosts };
    });
    setIsPostEditorOpen(false);
    setEditingPost(null);
    showToast(`Đã lưu bài viết "${savedPost.title}"!`);
  };

  const handleDeletePost = (postId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài đăng này khỏi kế hoạch tuần?')) return;
    updateActivePlan((prev) => ({
      ...prev,
      posts: prev.posts.filter((p) => p.id !== postId),
    }));
    showToast('Đã xóa bài đăng!');
  };

  const handleQuickStatusChange = (postId: string, newStatus: PostStatus) => {
    updateActivePlan((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (p.id === postId ? { ...p, status: newStatus } : p)),
    }));
    showToast('Đã cập nhật trạng thái bài viết!');
  };

  const handleApplyIdeaToAdd = (idea: GeneratedIdea) => {
    const newPost: WeeklyPlanPost = {
      id: `post_${Date.now()}`,
      dayOfWeek: 'Thứ 4',
      publishDate: activePlan.startDate,
      publishTime: '09:30',
      pillar: idea.pillar,
      postType: idea.postType,
      title: idea.title,
      hook: idea.hook,
      caption: idea.captionPreview,
      callToAction: idea.callToAction,
      hashtags: idea.hashtags,
      designBrief: {
        aspectRatio: idea.designBriefSuggestion.aspectRatio,
        headlineOnImage: idea.designBriefSuggestion.headlineOnImage,
        visualConcept: idea.designBriefSuggestion.visualConcept,
        moodAndTone: idea.designBriefSuggestion.moodAndTone,
      },
      status: 'draft',
    };

    updateActivePlan((prev) => ({
      ...prev,
      posts: [...prev.posts, newPost],
    }));

    showToast(`Đã thêm bài "${idea.title}" vào kế hoạch tuần!`);
  };

  // Filtered posts
  const filteredPosts = activePlan.posts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.hook.toLowerCase().includes(q) ||
      p.caption.toLowerCase().includes(q) ||
      p.pillar.toLowerCase().includes(q) ||
      p.dayOfWeek.toLowerCase().includes(q)
    );
  });

  // Stats calculation
  const totalPosts = activePlan.posts.length;
  const approvedCount = activePlan.posts.filter((p) => p.status === 'approved' || p.status === 'published' || p.status === 'designed').length;
  const pendingCount = activePlan.posts.filter((p) => p.status === 'pending_approval' || p.status === 'draft').length;

  if (viewMode === 'print_preview') {
    return (
      <WeeklyPlanPrintView
        plan={activePlan}
        brand={activeBrand}
        studioProfile={studioProfile}
        onBack={() => setViewMode('planner')}
        isLight={isLight}
      />
    );
  }

  if (viewMode === 'brand_proposal') {
    return (
      <BrandProposalExportView
        brand={activeBrand}
        studio={studioProfile}
        onBack={() => setViewMode('planner')}
        onEditBrand={() => setIsBrandModalOpen(true)}
        onUpdateBrand={handleSaveBrand}
        isLight={isLight}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP BAR: BRAND SELECTOR & ACTION BUTTONS */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-gray-200 shadow-xs' : 'bg-[#181F2E] border-gray-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Brand Selection Dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">
                CHỌN THƯƠNG HIỆU / FANPAGE KHÁCH HÀNG
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedBrandId}
                  onChange={(e) => handleSelectBrand(e.target.value)}
                  className={`px-3 py-2 rounded-xl text-sm font-bold border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                    isLight ? 'bg-gray-50 border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-gray-100'
                  }`}
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.industry})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleCreateNewBrand}
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 text-blue-600 dark:text-blue-400 flex items-center gap-1.5 transition cursor-pointer"
                  title="Thêm thương hiệu mới"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Thương hiệu mới</span>
                </button>
              </div>
            </div>

            {/* Brand Colors Pill Indicator */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-800">
              <div className="flex items-center -space-x-1.5" title="Bảng màu thương hiệu">
                <div className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-900" style={{ backgroundColor: activeBrand.colors.primary }} />
                <div className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-900" style={{ backgroundColor: activeBrand.colors.secondary }} />
                {activeBrand.colors.accent && (
                  <div className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-900" style={{ backgroundColor: activeBrand.colors.accent }} />
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsBrandModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5 text-blue-600" />
                <span>Quy chuẩn Brand</span>
              </button>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* TẠO KẾ HOẠCH THÁNG BUTTON */}
            <button
              type="button"
              onClick={() => setIsCreateMonthPlanModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md shadow-indigo-500/25 flex items-center gap-2 transition cursor-pointer active:scale-98"
              title="Tạo kế hoạch đăng bài theo tháng (15 bài - 2 ngày 1 bài hoặc 30 bài - 1 ngày 1 bài)"
            >
              <CalendarRange className="w-4 h-4 text-amber-300" />
              <span>+ Tạo Kế Hoạch Tháng</span>
            </button>

            {/* AI AUTO PLAN BUTTON */}
            <button
              type="button"
              onClick={() => setIsAutoPlanModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md shadow-blue-500/25 flex items-center gap-2 transition cursor-pointer active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isCurrentPlanMonth ? 'AI Lập Kịch Bản Tháng' : 'AI Lập Kế Hoạch Tuần'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsIdeaModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50 hover:bg-purple-100 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Gợi ý ý tưởng (AI)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingPost(null);
                setIsPostEditorOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm bài đăng</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('brand_proposal')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-linear-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition cursor-pointer active:scale-98"
              title="Xuất bản đề xuất Quy Chuẩn Brand & Social Media (Màu sắc, Font, Kích thước chuẩn & Ảnh Demo)"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>Xuất Đề Xuất Brand (PDF)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('print_preview')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isCurrentPlanMonth ? 'Xuất Kế Hoạch Tháng' : 'Xuất Kế Hoạch Tuần'}</span>
            </button>
          </div>
        </div>

        {/* Brand Summary Sub-Bar */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-4 flex-wrap">
            <span>Fanpage: <strong>{activeBrand.fanpageName || activeBrand.name}</strong></span>
            <span>Style: <strong>{activeBrand.designStyle.split('.')[0]}</strong></span>
            <span>Tone: <strong>{activeBrand.toneOfVoice.split('.')[0]}</strong></span>
            <button
              type="button"
              onClick={() => setIsBrandModalOpen(true)}
              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-bold flex items-center gap-1 cursor-pointer"
              title="Quản lý danh sách chủ đề chính của thương hiệu"
            >
              <span>Chủ đề chính: <strong>{getBrandPillars(activeBrand).length} mục</strong></span>
            </button>
          </div>

          <div className="flex items-center gap-3 font-semibold text-gray-700 dark:text-gray-300">
            <span>Tổng số: <strong>{totalPosts} bài</strong></span>
            <span className="text-emerald-600">• Đã duyệt/xong: <strong>{approvedCount}</strong></span>
            <span className="text-amber-600">• Đang chờ duyệt: <strong>{pendingCount}</strong></span>
          </div>
        </div>
      </div>

      {/* PLAN SELECTOR, MANAGEMENT & GOAL BAR */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
        isLight ? 'bg-white border-gray-200 shadow-2xs' : 'bg-[#181F2E] border-gray-800'
      }`}>
        {/* Left: Plan Selector & Actions */}
        <div className="flex flex-wrap items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-black shrink-0 mt-0.5 sm:mt-0">
            {isCurrentPlanMonth ? <CalendarRange className="w-5 h-5 text-indigo-600" /> : <CalendarDays className="w-5 h-5 text-blue-600" />}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                KẾ HOẠCH NỘI DUNG:
              </span>
              {/* Type Filter Pills */}
              <div className="inline-flex rounded-lg p-0.5 bg-gray-100 dark:bg-gray-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPlanFilterType('all')}
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                    planFilterType === 'all'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  Tất cả ({brandPlans.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPlanFilterType('month')}
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    planFilterType === 'month'
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <span>📅 Tháng ({brandMonthPlans.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlanFilterType('week')}
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    planFilterType === 'week'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <span>📆 Tuần ({brandWeekPlans.length})</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                  isLight ? 'bg-gray-50 border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-gray-100'
                }`}
              >
                {planFilterType === 'month' ? (
                  brandMonthPlans.length === 0 ? (
                    <option value="">(Chưa có kế hoạch tháng)</option>
                  ) : (
                    brandMonthPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        📅 {p.title} {p.status === 'completed' ? '(Đã lưu trữ)' : `(${p.posts.length} bài)`}
                      </option>
                    ))
                  )
                ) : planFilterType === 'week' ? (
                  brandWeekPlans.length === 0 ? (
                    <option value="">(Chưa có kế hoạch tuần)</option>
                  ) : (
                    brandWeekPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        📆 {p.title} {p.status === 'completed' ? '(Đã lưu trữ)' : `(${p.posts.length} bài)`}
                      </option>
                    ))
                  )
                ) : (
                  <>
                    {brandMonthPlans.length > 0 && (
                      <optgroup label="📅 KẾ HOẠCH THEO THÁNG">
                        {brandMonthPlans.map((p) => (
                          <option key={p.id} value={p.id}>
                            📅 {p.title} {p.status === 'completed' ? '(Đã lưu trữ)' : `(${p.posts.length} bài)`}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {brandWeekPlans.length > 0 && (
                      <optgroup label="📆 KẾ HOẠCH THEO TUẦN">
                        {brandWeekPlans.map((p) => (
                          <option key={p.id} value={p.id}>
                            📆 {p.title} {p.status === 'completed' ? '(Đã lưu trữ)' : `(${p.posts.length} bài)`}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {brandPlans.length === 0 && (
                      <option value="">(Chưa có kế hoạch)</option>
                    )}
                  </>
                )}
              </select>

              {/* Nút Tạo Kế Hoạch Tháng Trực Tiếp */}
              <button
                type="button"
                onClick={() => setIsCreateMonthPlanModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 flex items-center gap-1 transition cursor-pointer shadow-2xs"
                title="Tạo kế hoạch theo tháng (15 bài hoặc 30 bài)"
              >
                <CalendarRange className="w-3.5 h-3.5 text-indigo-600" />
                <span>+ Kế hoạch Tháng</span>
              </button>

              {/* Nút Quản Lý Kế Hoạch & Lưu Trữ */}
              <button
                type="button"
                onClick={() => setIsManageWeeksModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-gray-300 dark:border-gray-700 hover:border-blue-500 text-gray-700 dark:text-gray-300 hover:text-blue-600 flex items-center gap-1 transition cursor-pointer"
                title="Quản lý tất cả kế hoạch tháng/tuần & Lưu trữ"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Quản lý & Lưu trữ</span>
              </button>

              {isCurrentPlanMonth && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 flex items-center gap-1">
                  <CalendarRange className="w-3 h-3" />
                  Kế hoạch Tháng ({activePlan.postingFrequency === 'every_other_day' ? '15 bài • 2 ngày 1 bài' : activePlan.postingFrequency === 'daily' ? '30 bài • 1 ngày 1 bài' : `${activePlan.posts.length} bài`})
                </span>
              )}

              {activePlan.status === 'completed' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 flex items-center gap-1">
                  <Archive className="w-3 h-3" />
                  Đã lưu trữ
                </span>
              )}
            </div>

            <p className="text-[11px] text-gray-500 mt-1">
              Thời gian: <strong>{activePlan.startDate}</strong> đến <strong>{activePlan.endDate}</strong> • Tổng: <strong>{activePlan.posts.length} bài</strong>
            </p>
          </div>
        </div>

        {/* Center: Goal input */}
        <div className="flex-1 max-w-md">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
            {isCurrentPlanMonth ? 'Mục tiêu trọng tâm của tháng này' : 'Mục tiêu trọng tâm của tuần này'}
          </label>
          <input
            type="text"
            value={activePlan.mainGoal}
            placeholder={isCurrentPlanMonth ? 'Nhập mục tiêu trọng tâm của tháng...' : 'Nhập mục tiêu trọng tâm của tuần...'}
            onChange={(e) => updateActivePlan((p) => ({ ...p, mainGoal: e.target.value }))}
            className={`w-full px-3 py-1.5 rounded-xl text-xs border ${
              isLight ? 'bg-gray-50 border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-gray-100'
            }`}
          />
        </div>

        {/* Right: Search & Layout Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-hidden ${
                isLight ? 'bg-gray-50 border-gray-300' : 'bg-gray-900 border-gray-700'
              }`}
            />
          </div>

          <div className="flex items-center gap-1 border rounded-xl p-1 border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
            <button
              type="button"
              onClick={() => setPlannerLayout('calendar_table')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-xs font-bold flex items-center gap-1.5 ${
                plannerLayout === 'calendar_table' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Xem Bảng Lịch Kế Hoạch Tổng Quát (Lên sườn bài để khách duyệt trước)"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Bảng Lịch (Master Plan)</span>
            </button>
            <button
              type="button"
              onClick={() => setPlannerLayout('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                plannerLayout === 'grid' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Xem dạng Lưới Thẻ (Grid)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setPlannerLayout('list')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                plannerLayout === 'list' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Xem dạng Danh sách chi tiết (List)"
            >
              <ListFilter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Gợi ý tạo kế hoạch tháng nếu thương hiệu chưa có kế hoạch tháng nào */}
      {brandMonthPlans.length === 0 && (
        <div className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
          isLight ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950' : 'bg-indigo-950/20 border-indigo-900/50 text-indigo-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
              <CalendarRange className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <p className="font-bold">
                Bạn muốn lên kế hoạch đăng bài theo tháng cho {activeBrand.name}?
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-[11px]">
                Hệ thống hỗ trợ tạo trọn bộ 15 bài (2 ngày 1 bài) hoặc 30 bài (1 ngày 1 bài) chuẩn ngày đăng và sườn chủ đề.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateMonthPlanModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Kế Hoạch Tháng Ngay</span>
          </button>
        </div>
      )}

      {/* POSTS DISPLAY */}
      {plannerLayout === 'calendar_table' ? (
        /* ========================================================================= */
        /* CHẾ ĐỘ 1: BẢNG LỊCH KẾ HOẠCH TỔNG QUÁT (MASTER CALENDAR TABLE VIEW) */
        /* Giúp lên sườn ngày đăng, trụ cột & tiêu đề đề xuất để khách chốt trước */
        /* ========================================================================= */
        <MasterCalendarPlanTable
          plan={activePlan}
          brand={activeBrand}
          isLight={isLight}
          onUpdatePlan={handleSaveWeeklyPlan}
          onOpenFullPostEditor={(post) => {
            setEditingPost(post);
            setIsPostEditorOpen(true);
          }}
          onOpenPrintPreview={() => setViewMode('print_preview')}
          onOpenAiPlanner={() => setIsAutoPlanModalOpen(true)}
          onUpdateBrand={handleSaveBrand}
        />
      ) : filteredPosts.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border border-dashed ${
          isLight ? 'bg-white border-gray-300' : 'bg-[#181F2E] border-gray-800'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 mx-auto flex items-center justify-center mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
            Chưa có bài đăng nào trong kế hoạch tuần này
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
            Bấm nút "Gợi ý ý tưởng bài viết (AI)" để nhận ngay 5 ý tưởng bài viết kèm brief thiết kế, hoặc bấm "+ Thêm bài đăng" để tự viết kịch bản.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsIdeaModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Gợi ý ý tưởng AI
            </button>
            <button
              onClick={() => {
                setEditingPost(null);
                setIsPostEditorOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm bài đăng mới
            </button>
          </div>
        </div>
      ) : plannerLayout === 'grid' ? (
        /* DẠNG GRID THEO CÁC BÀI ĐĂNG TUẦN */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className={`rounded-2xl border transition-all flex flex-col justify-between hover:shadow-md ${
                isLight ? 'bg-white border-gray-200 hover:border-blue-300' : 'bg-[#181F2E] border-gray-800 hover:border-blue-500/50'
              }`}
            >
              {/* Card Top */}
              <div className="p-5 space-y-3">
                {/* Day & Time Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-blue-600 text-white">
                      {post.dayOfWeek}
                    </span>
                    <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {post.publishTime}
                    </span>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={post.status}
                    onChange={(e) => handleQuickStatusChange(post.id, e.target.value as any)}
                    className={`text-[11px] font-bold px-2 py-1 rounded-md border outline-hidden ${
                      post.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : post.status === 'designed'
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : post.status === 'pending_approval'
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-gray-50 text-gray-600 border-gray-300'
                    }`}
                  >
                    <option value="draft">Bản thảo</option>
                    <option value="pending_approval">Chờ duyệt</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="designed">Đã thiết kế</option>
                    <option value="published">Đã đăng</option>
                  </select>
                </div>

                {/* Pillar and Format */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  <span className={`px-2 py-0.5 rounded-md border shadow-2xs ${getPillarColorStyle(post.pillar, activeBrand).badge}`}>
                    {post.pillar}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md font-medium border ${
                    isLight 
                      ? 'bg-gray-100 text-gray-700 border-gray-200' 
                      : 'bg-gray-800 text-gray-300 border-gray-700'
                  }`}>
                    {post.postType}
                  </span>
                </div>

                {/* Title & Hook */}
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2">
                    {post.title}
                  </h3>
                  {post.hook && (
                    <p className="text-xs text-gray-500 italic line-clamp-2">
                      "{post.hook}"
                    </p>
                  )}
                </div>

                {/* Image Preview or Design Brief Snippet */}
                {post.designedImageUrl ? (
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/50 bg-black/5 group">
                      <img
                        src={post.designedImageUrl}
                        alt="Ảnh thiết kế"
                        className="w-full h-36 object-cover transition duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        Ảnh đã hoàn thành
                      </div>
                      <a
                        href={post.designedImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-2 right-2 px-2 py-1 rounded-md text-[10px] font-bold bg-black/70 hover:bg-black text-white flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Xem ảnh gốc
                      </a>
                    </div>

                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
                        <span>Text: "{post.designBrief.headlineOnImage || 'Visual'}"</span>
                        <span>{post.designBrief.aspectRatio}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-indigo-600 dark:text-indigo-400">
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Brief thiết kế
                      </span>
                      <span className="text-[10px] uppercase">{post.designBrief.aspectRatio}</span>
                    </div>
                    {post.designBrief.headlineOnImage && (
                      <p className="font-bold text-gray-800 dark:text-gray-200 line-clamp-1">
                        Text: "{post.designBrief.headlineOnImage}"
                      </p>
                    )}
                    <p className="text-gray-500 line-clamp-2 text-[11px]">
                      {post.designBrief.visualConcept || 'Chưa có mô tả bố cục.'}
                    </p>
                  </div>
                )}

                {/* Client Feedback Note if any */}
                {post.clientNote && (
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-[11px] text-amber-800 dark:text-amber-300">
                    <strong>Khách note:</strong> {post.clientNote}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/20">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${post.title}\n\n${post.hook}\n\n${post.caption}\n\n${post.callToAction}`);
                    showToast('Đã sao chép caption bài viết!');
                  }}
                  className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPost(post);
                      setIsPostEditorOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition cursor-pointer"
                    title="Chỉnh sửa chi tiết"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePost(post.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition cursor-pointer"
                    title="Xóa bài đăng"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* DẠNG DANH SÁCH CHI TIẾT (LIST VIEW) */
        <div className="space-y-4">
          {filteredPosts.map((post, idx) => (
            <div
              key={post.id}
              className={`p-5 rounded-2xl border transition-all space-y-4 ${
                isLight ? 'bg-white border-gray-200' : 'bg-[#181F2E] border-gray-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
                        {post.dayOfWeek} • {post.publishDate}
                      </span>
                      <span className="font-mono text-xs text-amber-600 font-semibold bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md">
                        {post.publishTime}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-md border shadow-2xs ${getPillarColorStyle(post.pillar, activeBrand).badge}`}>
                        {post.pillar}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={post.status}
                    onChange={(e) => handleQuickStatusChange(post.id, e.target.value as any)}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg border"
                  >
                    <option value="draft">Bản thảo</option>
                    <option value="pending_approval">Chờ duyệt</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="designed">Đã thiết kế</option>
                    <option value="published">Đã đăng</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingPost(post);
                      setIsPostEditorOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-100 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Sửa
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePost(post.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title & Caption */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/40 space-y-2">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{post.title}</h4>
                  {post.hook && <p className="italic text-gray-500">"{post.hook}"</p>}
                  <p className="whitespace-pre-line text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-4">
                    {post.caption}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/20 dark:bg-indigo-950/10 space-y-2">
                  <div className="flex items-center justify-between font-bold text-indigo-700 dark:text-indigo-400">
                    <span>Brief: {post.designBrief.headlineOnImage || 'Text chính'}</span>
                    <span>{post.designBrief.aspectRatio}</span>
                  </div>

                  {post.designedImageUrl && (
                    <div className="relative rounded-lg overflow-hidden border border-emerald-500/50 my-2">
                      <img
                        src={post.designedImageUrl}
                        alt="Ảnh thiết kế"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Đã thiết kế
                      </span>
                    </div>
                  )}

                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {post.designBrief.visualConcept}
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    Mood: {post.designBrief.moodAndTone}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODALS */}
      {isBrandModalOpen && (
        <BrandGuidelineModal
          key={activeBrand.id}
          isOpen={isBrandModalOpen}
          onClose={() => setIsBrandModalOpen(false)}
          brand={activeBrand}
          onSaveBrand={handleSaveBrand}
          onOpenProposal={() => setViewMode('brand_proposal')}
          isLight={isLight}
        />
      )}

      {isIdeaModalOpen && (
        <ContentIdeaModal
          isOpen={isIdeaModalOpen}
          onClose={() => setIsIdeaModalOpen(false)}
          brand={activeBrand}
          onSelectIdeaToAdd={handleApplyIdeaToAdd}
          isLight={isLight}
        />
      )}

      {isPostEditorOpen && (
        <PostDetailEditorModal
          key={editingPost ? editingPost.id : 'new_post'}
          isOpen={isPostEditorOpen}
          onClose={() => {
            setIsPostEditorOpen(false);
            setEditingPost(null);
          }}
          post={editingPost}
          brand={activeBrand}
          historyPosts={historyPostsForActiveBrand}
          onSavePost={handleSavePost}
          onUpdateBrand={handleSaveBrand}
          isLight={isLight}
        />
      )}

      <AiAutoPlanModal
        isOpen={isAutoPlanModalOpen}
        onClose={() => setIsAutoPlanModalOpen(false)}
        brand={activeBrand}
        plan={activePlan}
        onApplyPlan={handleApplyAiPlan}
        onUpdateBrandStrategy={handleUpdateBrandStrategy}
        isLight={isLight}
      />

      <ManageWeeksModal
        isOpen={isManageWeeksModalOpen}
        onClose={() => setIsManageWeeksModalOpen(false)}
        brand={activeBrand}
        plans={plans}
        activePlanId={activePlan.id}
        onSelectPlan={(planId) => setSelectedPlanId(planId)}
        onCreatePlan={handleCreatePlan}
        onOpenCreateMonthPlan={() => {
          setIsManageWeeksModalOpen(false);
          setIsCreateMonthPlanModalOpen(true);
        }}
        onUpdatePlanStatus={handleUpdatePlanStatus}
        onDeletePlan={handleDeletePlan}
        isLight={isLight}
      />

      <CreateMonthPlanModal
        isOpen={isCreateMonthPlanModalOpen}
        onClose={() => setIsCreateMonthPlanModalOpen(false)}
        brand={activeBrand}
        onCreateMonthPlan={(newPlan) => {
          handleCreatePlan(newPlan);
          setIsCreateMonthPlanModalOpen(false);
        }}
        isLight={isLight}
      />
    </div>
  );
};
