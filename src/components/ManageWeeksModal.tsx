import React, { useState } from 'react';
import { WeeklyPlan, BrandProfile } from '../types';
import { 
  Calendar, 
  X, 
  Plus, 
  Archive, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Check, 
  ChevronRight,
  Sparkles,
  Layers,
  CalendarDays,
  CalendarRange
} from 'lucide-react';

interface ManageWeeksModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: BrandProfile;
  plans: WeeklyPlan[];
  activePlanId: string;
  onSelectPlan: (planId: string) => void;
  onCreatePlan: (newPlan: WeeklyPlan) => void;
  onOpenCreateMonthPlan?: () => void;
  onUpdatePlanStatus: (planId: string, status: WeeklyPlan['status']) => void;
  onDeletePlan: (planId: string) => void;
  isLight: boolean;
}

export const ManageWeeksModal: React.FC<ManageWeeksModalProps> = ({
  isOpen,
  onClose,
  brand,
  plans,
  activePlanId,
  onSelectPlan,
  onCreatePlan,
  onOpenCreateMonthPlan,
  onUpdatePlanStatus,
  onDeletePlan,
  isLight,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'month' | 'week' | 'archived'>('all');

  // Form tạo tuần mới
  const currentWeekNumber = 37;
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [newWeekTitle, setNewWeekTitle] = useState(`Kế hoạch tuần ${currentWeekNumber}`);
  const [newWeekNumber, setNewWeekNumber] = useState(currentWeekNumber);
  const [newStartDate, setNewStartDate] = useState(todayStr);
  const [newEndDate, setNewEndDate] = useState(
    new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newMainGoal, setNewMainGoal] = useState('Đẩy mạnh tương tác Fanpage & Giới thiệu dịch vụ cốt lõi');

  if (!isOpen) return null;

  // Lọc danh sách kế hoạch của thương hiệu hiện tại
  const brandPlans = plans.filter((p) => p.brandId === brand.id);
  const monthPlans = brandPlans.filter((p) => p.planType === 'month');
  const weekPlans = brandPlans.filter((p) => p.planType !== 'month');

  const displayedPlans = brandPlans.filter((p) => {
    if (filterStatus === 'month') return p.planType === 'month';
    if (filterStatus === 'week') return p.planType !== 'month';
    if (filterStatus === 'archived') return p.status === 'completed';
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlan: WeeklyPlan = {
      id: `plan_${brand.id}_w${newWeekNumber}_${Date.now()}`,
      brandId: brand.id,
      title: newWeekTitle.trim() || `Kế hoạch tuần ${newWeekNumber}`,
      planType: 'week',
      weekNumber: Number(newWeekNumber),
      year: new Date().getFullYear(),
      startDate: newStartDate,
      endDate: newEndDate,
      mainGoal: newMainGoal.trim() || 'Tập trung xây dựng nội dung chất lượng cho tuần',
      status: 'draft',
      posts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onCreatePlan(newPlan);
    onSelectPlan(newPlan.id);
    setActiveTab('list');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print overflow-y-auto">
      <div className={`relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border ${
        isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#181F2E] border-gray-800 text-gray-100'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isLight ? 'border-gray-200 bg-gray-50/70' : 'border-gray-800 bg-gray-900/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <CalendarRange className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Quản Lý Kế Hoạch Nội Dung ({brand.name})</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Lập kế hoạch theo Tháng hoặc theo Tuần, chuyển đổi linh hoạt và lưu trữ
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

        {/* Tab Controls */}
        <div className="px-6 pt-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`pb-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'list'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Tất Cả Kế Hoạch ({brandPlans.length})
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`pb-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'create'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              + Thêm Tuần Mới
            </button>
            {onOpenCreateMonthPlan && (
              <button
                type="button"
                onClick={onOpenCreateMonthPlan}
                className="mb-2 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Mở bảng tạo kế hoạch trọn vẹn cả tháng (15 bài hoặc 30 bài)"
              >
                <CalendarRange className="w-3.5 h-3.5 text-amber-300" />
                <span>+ Tạo Kế Hoạch Tháng</span>
              </button>
            )}
          </div>

          {activeTab === 'list' && (
            <div className="flex gap-1 pb-2 flex-wrap">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  filterStatus === 'all'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Tất cả ({brandPlans.length})
              </button>
              <button
                onClick={() => setFilterStatus('month')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ${
                  filterStatus === 'month'
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span>📅 Tháng ({monthPlans.length})</span>
              </button>
              <button
                onClick={() => setFilterStatus('week')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ${
                  filterStatus === 'week'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span>📆 Tuần ({weekPlans.length})</span>
              </button>
              <button
                onClick={() => setFilterStatus('archived')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  filterStatus === 'archived'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Lưu trữ
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'list' ? (
            <div className="space-y-3">
              {displayedPlans.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Chưa có kế hoạch nào trong mục này.</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {onOpenCreateMonthPlan && (
                      <button
                        onClick={onOpenCreateMonthPlan}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white flex items-center gap-1.5"
                      >
                        <CalendarRange className="w-3.5 h-3.5" />
                        <span>+ Tạo Kế Hoạch Tháng</span>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('create')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tạo Tuần Mới</span>
                    </button>
                  </div>
                </div>
              ) : (
                displayedPlans.map((p) => {
                  const isCurrent = p.id === activePlanId;
                  const isArchived = p.status === 'completed';
                  const isMonthPlan = p.planType === 'month';

                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isCurrent
                          ? isMonthPlan 
                            ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 ring-1 ring-indigo-500'
                            : 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-blue-500'
                          : isLight
                          ? 'border-gray-200 hover:border-gray-300 bg-white'
                          : 'border-gray-800 hover:border-gray-700 bg-gray-900/60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`p-1 rounded-md text-xs ${
                            isMonthPlan ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                          }`}>
                            {isMonthPlan ? <CalendarRange className="w-3.5 h-3.5" /> : <CalendarDays className="w-3.5 h-3.5" />}
                          </span>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {p.title}
                          </h3>
                          {isMonthPlan && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200">
                              Kế hoạch Tháng ({p.postingFrequency === 'every_other_day' ? '15 bài • 2 ngày 1 bài' : p.postingFrequency === 'daily' ? '30 bài • 1 ngày 1 bài' : `${p.posts.length} bài`})
                            </span>
                          )}
                          {isCurrent && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-white ${
                              isMonthPlan ? 'bg-indigo-600' : 'bg-blue-600'
                            }`}>
                              Đang Mở
                            </span>
                          )}
                          {isArchived && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                              <Archive className="w-3 h-3" />
                              Lưu trữ
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-500">
                          Thời gian: <strong>{p.startDate}</strong> đến <strong>{p.endDate}</strong> • {p.posts.length} bài viết
                        </p>

                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 italic">
                          🎯 Mục tiêu: {p.mainGoal}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Nút lưu trữ / hoàn thành */}
                        <button
                          type="button"
                          onClick={() => onUpdatePlanStatus(p.id, isArchived ? 'draft' : 'completed')}
                          title={isArchived ? 'Mở lại tuần này' : 'Lưu trữ tuần này (Hoàn thành)'}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${
                            isArchived
                              ? 'border-gray-300 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                              : 'border-amber-300 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100'
                          }`}
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>{isArchived ? 'Mở lại' : 'Lưu trữ'}</span>
                        </button>

                        {/* Nút chọn tuần */}
                        {!isCurrent ? (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectPlan(p.id);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>Xem & Quản lý</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 text-xs font-bold text-blue-600 flex items-center gap-1">
                            <Check className="w-4 h-4" /> Đang xem
                          </span>
                        )}

                        {/* Nút xóa tuần nếu có nhiều hơn 1 tuần */}
                        {brandPlans.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onDeletePlan(p.id)}
                            title="Xóa tuần này"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Form Tạo Tuần Mới */
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Tên kế hoạch tuần *
                  </label>
                  <input
                    type="text"
                    required
                    value={newWeekTitle}
                    onChange={(e) => setNewWeekTitle(e.target.value)}
                    placeholder="VD: Kế hoạch tuần 37 (08/09 - 14/09)"
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Số tuần trong năm
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={53}
                    value={newWeekNumber}
                    onChange={(e) => setNewWeekNumber(Number(e.target.value))}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Ngày bắt đầu (Thứ 2) *
                  </label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Ngày kết thúc (Chủ Nhật) *
                  </label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Mục tiêu chính của tuần này
                </label>
                <textarea
                  rows={2}
                  value={newMainGoal}
                  onChange={(e) => setNewMainGoal(e.target.value)}
                  placeholder="VD: Đẩy mạnh dòng Cold Brew ủ lạnh, tăng tương tác minigame cuối tuần..."
                  className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                  }`}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Khởi Tạo Kế Hoạch Tuần Mới</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
