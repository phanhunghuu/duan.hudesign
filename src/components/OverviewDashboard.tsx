import React from 'react';
import { Client, DesignItem, Quotation, VideoContent } from '../types';
import { formatVND, formatDate, getDesignStatusBadge, getPriorityBadge, getRelativeTime } from '../utils/formatters';
import { 
  Users, 
  Palette, 
  Video, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Plus,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { NavTab } from './Navbar';

interface OverviewDashboardProps {
  clients: Client[];
  designItems: DesignItem[];
  quotations: Quotation[];
  videos: VideoContent[];
  onNavigate: (tab: NavTab) => void;
  onOpenNewDesign: () => void;
  onOpenVideoScripts: () => void;
  onSelectClient?: (clientId: string) => void;
  isLight: boolean;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  clients = [],
  designItems = [],
  quotations = [],
  videos = [],
  onNavigate,
  onOpenNewDesign,
  onOpenVideoScripts,
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
  const doneDesigns = safeDesignItems.filter((d) => d.status === 'done').length;

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
    <div className="space-y-5 animate-fadeIn">
      {/* Page heading and one primary action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={`text-sm ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className={`mt-1 text-2xl sm:text-3xl font-bold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
            Tổng quan
          </h1>
          <p className={`mt-1 text-sm ${isLight ? 'text-neutral-600' : 'text-neutral-300'}`}>
            {inProgressDesigns} việc đang làm · {reviewDesigns} việc chờ khách duyệt
          </p>
        </div>
        <button
          onClick={onOpenNewDesign}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Tạo việc thiết kế
        </button>
      </div>

      {/* Needs Attention: deadlines and active design work */}
      <div className={`p-6 rounded-xl border ${
          isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900/60 border-gray-800'
        }`}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-gray-900 dark:text-gray-100">Cần chú ý</h3>
                <p className="text-xs text-gray-500">Deadline và trạng thái các việc thiết kế đang mở</p>
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
              <p className="text-sm font-medium">Không có hạng mục thiết kế nào cần theo dõi lúc này.</p>
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

      {/* 4 Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Khách hàng */}
        <div role="button" tabIndex={0}
          onClick={() => onNavigate('clients_designs')}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onNavigate('clients_designs'); } }}
          className={`w-full p-4 rounded-xl border text-left transition-colors cursor-pointer group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
            isLight ? 'bg-white border-neutral-200 hover:border-neutral-400' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Khách hàng</span>
          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">{clients.length}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">({activeClients} đang hợp tác)</span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 flex items-center justify-between">
            <span>Đối tác thương hiệu</span>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-1 transition" />
          </p>
        </div>

        {/* Metric 2: Dự án thiết kế */}
        <div role="button" tabIndex={0}
          onClick={() => onNavigate('clients_designs')}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onNavigate('clients_designs'); } }}
          className={`w-full p-4 rounded-xl border text-left transition-colors cursor-pointer group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
            isLight ? 'bg-white border-neutral-200 hover:border-neutral-400' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Thiết kế đang làm</span>
          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
              <Palette className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">{inProgressDesigns + reviewDesigns}</span>
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">/ {designItems.length} tổng số</span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 flex items-center justify-between">
            <span>{doneDesigns} ấn phẩm đã bàn giao</span>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-1 transition" />
          </p>
        </div>

        {/* Metric 3: Doanh số Báo giá */}
        <div role="button" tabIndex={0}
          onClick={() => onNavigate('quotations')}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onNavigate('quotations'); } }}
          className={`w-full p-4 rounded-xl border text-left transition-colors cursor-pointer group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
            isLight ? 'bg-white border-neutral-200 hover:border-neutral-400' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Doanh số chốt</span>
            <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white truncate">
              {formatVND(approvedValue)}
            </span>
          </div>
          <div className="mt-2">
            <div className="mb-1 flex justify-between text-[11px] text-neutral-500">
              <span>Chỉ tiêu 100tr</span>
              <span>{Math.min(100, Math.round((approvedValue / 100000000) * 100))}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-neutral-700 transition-all dark:bg-neutral-300"
                style={{ width: `${Math.min(100, Math.round((approvedValue / 100000000) * 100))}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1 flex items-center justify-between">
            <span>{approvedQuotes.length} hợp đồng duyệt</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-1 transition" />
          </p>
        </div>

        {/* Metric 4: Kênh Content TikTok & YouTube */}
        <div role="button" tabIndex={0}
          onClick={onOpenVideoScripts}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpenVideoScripts(); } }}
          className={`w-full p-4 rounded-xl border text-left transition-colors cursor-pointer group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
            isLight ? 'bg-white border-neutral-200 hover:border-neutral-400' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Video content</span>
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{videos.length}</span>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">({publishedVideos} đã đăng)</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 flex items-center justify-between">
            <span>{totalVideoViews > 0 ? `${(totalVideoViews / 1000).toFixed(1)}k lượt xem` : `${inProductionVideos} đang sản xuất`}</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-1 transition" />
          </p>
        </div>
      </div>

      {/* Supporting studio snapshots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Active Clients Mini Widget */}
          <div className={`p-4 rounded-xl border ${
            isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900/60 border-gray-800'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-display text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Khách hàng
              </h3>
            </div>

            <div className="space-y-2.5">
              {recentClients.map((client) => {
                const clientItems = designItems.filter((d) => d.clientId === client.id);
                return (
                  <div role="button" tabIndex={0}
                    key={client.id}
                    onClick={() => {
                      if (onSelectClient) onSelectClient(client.id);
                      onNavigate('clients_designs');
                    }}
                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (onSelectClient) onSelectClient(client.id); onNavigate('clients_designs'); } }}
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
          <div className={`p-4 rounded-xl border ${
            isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900/60 border-gray-800'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-display text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Video className="w-4 h-4 text-pink-500" />
                Lịch quay & Đăng Video
              </h3>
              <button
                onClick={onOpenVideoScripts}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
              >
                Mở Board
              </button>
            </div>

            <div className="space-y-2">
              {videos.length === 0 ? (
                <p className="rounded-lg border border-dashed border-neutral-200 px-3 py-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
                  Chưa có kịch bản video.
                </p>
              ) : videos.slice(0, 3).map((video) => (
                <div role="button" tabIndex={0}
                  key={video.id}
                  onClick={onOpenVideoScripts}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpenVideoScripts(); } }}
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
  );
};
