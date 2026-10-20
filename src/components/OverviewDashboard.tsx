import React from 'react';
import { Client, DesignItem, Quotation, VideoContent } from '../types';
import { formatVND, formatDate, getDesignStatusBadge, getPriorityBadge, getRelativeTime } from '../utils/formatters';
import { 
  Users, 
  Palette, 
  FileSpreadsheet, 
  Video, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Plus,
  Calendar,
  Layers,
  ChevronRight,
  BadgePercent
} from 'lucide-react';
import { NavTab } from './Navbar';

interface OverviewDashboardProps {
  clients: Client[];
  designItems: DesignItem[];
  quotations: Quotation[];
  videos: VideoContent[];
  onNavigate: (tab: NavTab) => void;
  onOpenNewClient: () => void;
  onOpenNewDesign: () => void;
  onOpenAIScript: () => void;
  onOpenNewQuote: () => void;
  onSelectClient?: (clientId: string) => void;
  isLight: boolean;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  clients = [],
  designItems = [],
  quotations = [],
  videos = [],
  onNavigate,
  onOpenNewClient,
  onOpenNewDesign,
  onOpenAIScript,
  onOpenNewQuote,
  onSelectClient,
  isLight,
}) => {
  // Statistics calculations
  const safeClients = clients || [];
  const safeDesignItems = designItems || [];
  const safeQuotations = quotations || [];
  const safeVideos = videos || [];

  const activeClients = safeClients.filter((c) => c.status === 'active').length;
  const inProgressDesigns = safeDesignItems.filter((d) => d.status === 'in_progress').length;
  const reviewDesigns = safeDesignItems.filter((d) => d.status === 'review').length;
  const todoDesigns = safeDesignItems.filter((d) => d.status === 'todo').length;
  const doneDesigns = safeDesignItems.filter((d) => d.status === 'done').length;

  const totalQuotationValue = safeQuotations.reduce((acc, q) => acc + (q?.total || 0), 0);
  const approvedQuotes = safeQuotations.filter((q) => q && (q.status === 'approved' || q.status === 'paid'));
  const approvedValue = approvedQuotes.reduce((acc, q) => acc + (q?.total || 0), 0);

  const publishedVideos = safeVideos.filter((v) => v && v.status === 'published').length;
  const inProductionVideos = safeVideos.filter((v) => v && (v.status === 'production' || v.status === 'scripted')).length;
  const totalVideoViews = safeVideos.reduce((acc, v) => acc + (v?.actualViews || 0), 0);

  // Urgent and upcoming deadlines
  const urgentTasks = [...safeDesignItems]
    .filter((d) => d && d.status !== 'done')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5);

  const recentClients = [...safeClients].slice(0, 4);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Studio Welcome & Quick Action Bar */}
      <div className={`p-6 sm:p-7 rounded-2xl border transition-all relative overflow-hidden ${
        isLight 
          ? 'bg-white border-neutral-200/90 shadow-2xs text-neutral-900' 
          : 'bg-neutral-900 border-neutral-800 text-white'
      }`}>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isLight ? 'bg-neutral-100 text-neutral-700' : 'bg-neutral-800 text-neutral-300'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Hủ Design Studio Workspace
              </span>
              <span className={`text-xs ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                • {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
              Bảng điều khiển Sáng tạo & Dự án
            </h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${isLight ? 'text-neutral-600' : 'text-neutral-300'}`}>
              Chào mừng bạn trở lại! Hiện có <strong className="text-neutral-900 dark:text-white font-semibold">{inProgressDesigns} ấn phẩm</strong> đang thực hiện, <strong className="text-[#b4532c] dark:text-amber-400 font-semibold">{reviewDesigns} mục</strong> chờ duyệt từ khách hàng.
            </p>
          </div>

          {/* Quick Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenNewDesign}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-black text-white shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tạo việc thiết kế
            </button>
            <button
              onClick={onOpenNewQuote}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isLight 
                  ? 'bg-white hover:bg-neutral-50 border-neutral-300/80 text-neutral-800 shadow-2xs' 
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-neutral-500" />
              Lập báo giá mới
            </button>
            <button
              onClick={() => onNavigate('pricing_board')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#b4532c] hover:bg-[#9a4320] text-white shadow-2xs transition cursor-pointer"
              title="Xem và xuất bảng giá gói dịch vụ gửi khách"
            >
              <BadgePercent className="w-4 h-4" />
              Bảng giá Gói Studio
            </button>
            <button
              onClick={onOpenAIScript}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-800'
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              AI Script Creator
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Khách hàng */}
        <div 
          onClick={() => onNavigate('clients_designs')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
            isLight ? 'bg-white border-neutral-200/90 hover:border-neutral-400 shadow-2xs' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Khách hàng</span>
            <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight">{clients.length}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">({activeClients} đang hợp tác)</span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 flex items-center justify-between">
            <span>Đối tác thương hiệu</span>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-1 transition" />
          </p>
        </div>

        {/* Metric 2: Dự án thiết kế */}
        <div 
          onClick={() => onNavigate('clients_designs')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
            isLight ? 'bg-white border-neutral-200/90 hover:border-neutral-400 shadow-2xs' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Thiết kế đang làm</span>
            <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
              <Palette className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight">{inProgressDesigns + reviewDesigns}</span>
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">/ {designItems.length} tổng số</span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 flex items-center justify-between">
            <span>{doneDesigns} ấn phẩm đã bàn giao</span>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-1 transition" />
          </p>
        </div>

        {/* Metric 3: Doanh số Báo giá */}
        <div 
          onClick={() => onNavigate('quotations')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
            isLight ? 'bg-white border-neutral-200/90 hover:border-neutral-400 shadow-2xs' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Doanh số chốt</span>
            <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#b4532c] dark:text-amber-400 truncate">
              {formatVND(approvedValue)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 flex items-center justify-between">
            <span>{approvedQuotes.length} hợp đồng duyệt</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-1 transition" />
          </p>
        </div>

        {/* Metric 4: Kênh Content TikTok & YouTube */}
        <div 
          onClick={() => onNavigate('content_planner')}
          className={`p-5 rounded-xl border transition-all cursor-pointer group hover:-translate-y-0.5 ${
            isLight ? 'bg-white border-gray-200 hover:border-blue-400 shadow-sm' : 'bg-gray-900/70 border-gray-800 hover:border-blue-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Video Content</span>
            <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-950/40 flex items-center justify-center text-pink-600 dark:text-pink-400">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display">{videos.length}</span>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">({publishedVideos} đã đăng)</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 flex items-center justify-between">
            <span>{totalVideoViews > 0 ? `${(totalVideoViews / 1000).toFixed(1)}k lượt xem` : `${inProductionVideos} đang sản xuất`}</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-1 transition" />
          </p>
        </div>
      </div>

      {/* Main Grid: Design Pipeline & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Urgent Design Items / Workflow */}
        <div className={`lg:col-span-2 p-6 rounded-xl border ${
          isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900/60 border-gray-800'
        }`}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-gray-900 dark:text-gray-100">Design Plan & Deadline Gần nhất</h3>
                <p className="text-xs text-gray-500">Các hạng mục thiết kế ưu tiên cần theo dõi sát sao</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('clients_designs')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 transition"
            >
              Xem tất cả ({designItems.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {urgentTasks.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
              <p className="text-sm font-medium">Tuyệt vời! Không có hạng mục thiết kế nào bị trễ hạn.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {urgentTasks.map((item) => {
                const statusBadge = getDesignStatusBadge(item.status);
                const priorityBadge = getPriorityBadge(item.priority);
                const relativeTime = getRelativeTime(item.deadline);
                const isOverdue = relativeTime.includes('Quá hạn');

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isLight 
                        ? 'bg-gray-50/70 hover:bg-gray-50 border-gray-200/80' 
                        : 'bg-gray-950/60 hover:bg-gray-800/60 border-gray-800'
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${priorityBadge.bg}`}>
                          {priorityBadge.label}
                        </span>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate">
                          {item.clientName}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.category}</span>
                      </div>
                      <h4 className="text-sm font-semibold truncate text-gray-800 dark:text-gray-200">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <div className={`text-xs font-semibold flex items-center gap-1 ${
                          isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(item.deadline)}</span>
                        </div>
                        <span className={`text-[10px] font-bold ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400'}`}>
                          {relativeTime}
                        </span>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${statusBadge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Client Overview & Target Widget */}
        <div className="space-y-6">
          {/* Monthly Target Clean Gradient Widget */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-100 font-medium">Chỉ tiêu tháng (Target)</p>
              <p className="text-2xl font-black mt-1">
                {formatVND(approvedValue).replace('₫', '').trim()} <span className="text-xs text-blue-200 font-normal">/ 100tr</span>
              </p>
              <div className="w-36 h-1.5 bg-white/20 rounded-full mt-2.5 overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.round((approvedValue / 100000000) * 100))}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2 py-1 rounded">
                Studio Growth
              </span>
            </div>
          </div>

          {/* Active Clients Mini Widget */}
          <div className={`p-5 rounded-xl border ${
            isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900/60 border-gray-800'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-display text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Khách hàng tiêu biểu
              </h3>
              <button
                onClick={onOpenNewClient}
                className="p-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                title="Thêm khách hàng"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {recentClients.map((client) => {
                const clientItems = designItems.filter((d) => d.clientId === client.id);
                return (
                  <div
                    key={client.id}
                    onClick={() => {
                      if (onSelectClient) onSelectClient(client.id);
                      onNavigate('clients_designs');
                    }}
                    className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isLight 
                        ? 'bg-gray-50/70 hover:bg-gray-100 border-gray-200/80' 
                        : 'bg-gray-950/60 hover:bg-gray-800/80 border-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {client.avatar ? (
                        <img
                          src={client.avatar}
                          alt={client.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs">
                          {client.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold truncate text-gray-900 dark:text-gray-100">{client.company}</h5>
                        <p className="text-[11px] text-gray-500 truncate">{client.name}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {clientItems.length} việc
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Video Content Pipeline Snippet */}
          <div className={`p-5 rounded-xl border ${
            isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900/60 border-gray-800'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-display text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Video className="w-4 h-4 text-pink-500" />
                Lịch quay & Đăng Video
              </h3>
              <button
                onClick={() => onNavigate('content_planner')}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
              >
                Mở Board
              </button>
            </div>

            <div className="space-y-2">
              {videos.slice(0, 3).map((video) => (
                <div 
                  key={video.id}
                  onClick={() => onNavigate('content_planner')}
                  className={`p-2.5 rounded-lg border text-xs transition cursor-pointer ${
                    isLight ? 'bg-gray-50/70 hover:bg-gray-100 border-gray-200/80' : 'bg-gray-950/60 hover:bg-gray-800/80 border-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      video.platform === 'tiktok' ? 'bg-pink-100 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400' : 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                    }`}>
                      {video.platform === 'tiktok' ? 'TikTok' : 'YouTube'}
                    </span>
                    <span className="text-[10px] text-gray-400">{formatDate(video.scheduledDate)}</span>
                  </div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{video.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
