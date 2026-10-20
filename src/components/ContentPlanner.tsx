import React, { useState } from 'react';
import { VideoContent, ContentStatus, VideoPlatform, VideoFormat, StudioProfile } from '../types';
import { formatDate, getContentStatusBadge } from '../utils/formatters';
import { AIScriptModal } from './AIScriptModal';
import { FanpageWeeklyPlanner } from './FanpageWeeklyPlanner';
import { 
  Tv, 
  Sparkles, 
  Plus, 
  Filter, 
  Calendar, 
  Eye, 
  Edit3, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  Clock, 
  PlaySquare, 
  Layers, 
  Search, 
  LayoutGrid, 
  List, 
  Flame, 
  ExternalLink,
  Video,
  CalendarDays,
  Share2
} from 'lucide-react';

interface ContentPlannerProps {
  contents: VideoContent[];
  onAddContent: (content: Omit<VideoContent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateContent: (content: VideoContent) => void;
  onDeleteContent: (contentId: string) => void;
  studioProfile?: StudioProfile;
  isLight: boolean;
}

const KANBAN_COLUMNS: { id: ContentStatus; label: string; dotColor: string }[] = [
  { id: 'idea', label: 'Ý tưởng thô', dotColor: 'bg-zinc-400' },
  { id: 'scripted', label: 'Đã có kịch bản', dotColor: 'bg-blue-400' },
  { id: 'filming', label: 'Đang quay', dotColor: 'bg-amber-400' },
  { id: 'editing', label: 'Đang dựng / Edit', dotColor: 'bg-purple-400' },
  { id: 'published', label: 'Đã đăng tải', dotColor: 'bg-emerald-400' },
];

export const ContentPlanner: React.FC<ContentPlannerProps> = ({
  contents = [],
  onAddContent,
  onUpdateContent,
  onDeleteContent,
  studioProfile,
  isLight,
}) => {
  const [activeSubModule, setActiveSubModule] = useState<'fanpage_weekly' | 'video_scripts'>('fanpage_weekly');
  const safeContents = contents || [];
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [isAIScriptModalOpen, setIsAIScriptModalOpen] = useState(false);
  const [selectedScriptItem, setSelectedScriptItem] = useState<VideoContent | null>(null);

  // Manual Add/Edit Form State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<VideoContent | null>(null);
  const [manualForm, setManualForm] = useState({
    title: '',
    platform: 'tiktok' as VideoPlatform,
    format: 'short' as VideoFormat,
    status: 'idea' as ContentStatus,
    rawIdea: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    targetViews: 10000,
    tags: 'TikTok, DesignTips',
    videoUrl: '',
    notes: '',
  });

  // Filter items
  const filteredContents = safeContents.filter((c) => {
    if (!c) return false;
    const matchesPlatform = platformFilter === 'all' || c.platform === platformFilter;
    const matchesSearch =
      (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.rawIdea || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const handleOpenAddManual = () => {
    setEditingContent(null);
    setManualForm({
      title: '',
      platform: 'tiktok',
      format: 'short',
      status: 'idea',
      rawIdea: '',
      scheduledDate: new Date().toISOString().split('T')[0],
      targetViews: 10000,
      tags: 'TikTok, DesignTips',
      videoUrl: '',
      notes: '',
    });
    setIsManualModalOpen(true);
  };

  const handleOpenEditManual = (c: VideoContent) => {
    setEditingContent(c);
    setManualForm({
      title: c.title,
      platform: c.platform,
      format: c.format,
      status: c.status,
      rawIdea: c.rawIdea || '',
      scheduledDate: c.scheduledDate || new Date().toISOString().split('T')[0],
      targetViews: c.targetViews || 10000,
      tags: c.tags?.join(', ') || '',
      videoUrl: c.videoUrl || '',
      notes: c.notes || '',
    });
    setIsManualModalOpen(true);
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.title.trim()) return;

    const tagsArray = manualForm.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (editingContent) {
      onUpdateContent({
        ...editingContent,
        ...manualForm,
        tags: tagsArray,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddContent({
        ...manualForm,
        tags: tagsArray,
      });
    }
    setIsManualModalOpen(false);
  };

  const handleStatusChange = (item: VideoContent, newStatus: ContentStatus) => {
    onUpdateContent({
      ...item,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Module Sub-Navigation */}
      <div className={`p-1.5 rounded-2xl border flex flex-wrap items-center gap-2 max-w-fit shadow-2xs no-print ${
        isLight ? 'bg-gray-100/90 border-gray-200' : 'bg-gray-900/90 border-gray-800'
      }`}>
        <button
          type="button"
          onClick={() => setActiveSubModule('fanpage_weekly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubModule === 'fanpage_weekly'
              ? 'bg-blue-600 text-white shadow-md'
              : isLight
              ? 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/60'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Kế hoạch Fanpage & Brief Tuần (MỚI)</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
            activeSubModule === 'fanpage_weekly' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
          }`}>
            Hot
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubModule('video_scripts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubModule === 'video_scripts'
              ? 'bg-blue-600 text-white shadow-md'
              : isLight
              ? 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/60'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Kịch bản Video / Reels / TikTok</span>
        </button>
      </div>

      {activeSubModule === 'fanpage_weekly' ? (
        <FanpageWeeklyPlanner
          studioProfile={
            studioProfile || {
              studioName: 'HỦ DESIGN',
              phone: '0912 412 132',
              email: 'phanhunghuu@gmail.com',
              address: 'TP. Hồ Chí Minh',
              theme: 'dark',
              enableCloudSync: true,
              autoBackup: true,
            }
          }
          isLight={isLight}
        />
      ) : (
        <div className="space-y-6">
          {/* Top Header & AI Launch Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-display flex items-center gap-2.5">
                <Tv className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                Lên Kế hoạch Nội dung & AI Script Creator
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Quản lý kênh TikTok & YouTube của Hủ Design theo quy trình Kanban và sáng tạo kịch bản video bằng AI
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAIScriptModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                AI Script Creator
              </button>

              <button
                onClick={handleOpenAddManual}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  isLight ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200' : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                }`}
              >
                <Plus className="w-4 h-4" />
                Thêm ý tưởng
              </button>
            </div>
          </div>

      {/* Filter Bar & View Toggle */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900/60 border-gray-800'
      }`}>
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Search */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tiêu đề video hoặc ý tưởng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border transition focus:outline-hidden ${
                isLight ? 'bg-gray-50 border-gray-200 text-gray-800 focus:bg-white focus:border-blue-500' : 'bg-gray-950 border-gray-800 text-gray-100 focus:border-blue-500'
              }`}
            />
          </div>

          {/* Platform filter */}
          <div className="flex items-center gap-1 text-xs">
            {[
              { id: 'all', label: 'Tất cả nền tảng' },
              { id: 'tiktok', label: 'TikTok / Shorts' },
              { id: 'youtube', label: 'YouTube Long-form' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatformFilter(p.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  platformFilter === p.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    : isLight ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Switch */}
        <div className="flex items-center p-1 rounded-lg bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-xs">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-1.5 rounded-md transition ${
              viewMode === 'kanban' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
            title="Xem dạng Bảng Kanban"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md transition ${
              viewMode === 'table' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
            title="Xem dạng Danh sách (Table)"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* VIEW 1: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {KANBAN_COLUMNS.map((col) => {
            const colItems = filteredContents.filter((c) => c.status === col.id);

            return (
              <div
                key={col.id}
                className={`rounded-xl border p-3.5 space-y-3 min-h-[500px] ${
                  isLight ? 'bg-gray-50/70 border-gray-200' : 'bg-gray-900/40 border-gray-800'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                    <h3 className="text-xs font-bold font-display text-gray-800 dark:text-gray-200">{col.label}</h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-gray-500 bg-gray-200 dark:bg-gray-800/80 px-2 py-0.5 rounded-full">
                    {colItems.length}
                  </span>
                </div>

                {/* Card Items */}
                <div className="space-y-2.5">
                  {colItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all relative group ${
                        isLight
                          ? 'bg-white hover:bg-gray-50 border-gray-200 shadow-xs'
                          : 'bg-gray-900 hover:bg-gray-850 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      {/* Platform & Format Badges */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.platform === 'tiktok'
                              ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border border-pink-200 dark:border-pink-800'
                              : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
                          }`}
                        >
                          {item.platform === 'tiktok' ? 'TikTok / Short' : 'YouTube'}
                        </span>

                        {item.script && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded">
                            <Sparkles className="w-3 h-3" />
                            AI Script
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-bold text-zinc-100 leading-snug line-clamp-2">
                        {item.title}
                      </h4>

                      {/* Raw Idea or Hook Snippet */}
                      {item.script ? (
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 italic">
                          "{item.script.hook}"
                        </p>
                      ) : (
                        item.rawIdea && (
                          <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                            {item.rawIdea}
                          </p>
                        )
                      )}

                      {/* Scheduled Date */}
                      {item.scheduledDate && (
                        <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-zinc-500" />
                            {formatDate(item.scheduledDate)}
                          </span>

                          {/* Quick status dropdown */}
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item, e.target.value as ContentStatus)}
                            className="bg-zinc-950 text-zinc-300 text-[10px] rounded px-1.5 py-0.5 border border-zinc-800"
                          >
                            <option value="idea">Ý tưởng</option>
                            <option value="scripted">Có kịch bản</option>
                            <option value="filming">Đang quay</option>
                            <option value="editing">Đang dựng</option>
                            <option value="published">Đã đăng</option>
                          </select>
                        </div>
                      )}

                      {/* Card Actions */}
                      <div className="mt-2 flex items-center justify-end gap-1.5 pt-1.5">
                        {item.script && (
                          <button
                            onClick={() => setSelectedScriptItem(item)}
                            className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mr-auto"
                          >
                            <FileText className="w-3 h-3" />
                            Xem kịch bản
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEditManual(item)}
                          className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => onDeleteContent(item.id)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Xóa"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {colItems.length === 0 && (
                    <div className="text-center py-8 text-[11px] text-zinc-600">
                      Trống
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className={`rounded-2xl border overflow-hidden ${
          isLight ? 'bg-white border-zinc-200' : 'bg-zinc-900/80 border-zinc-800'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-semibold">
                  <th className="py-3 px-4">Tiêu đề Video</th>
                  <th className="py-3 px-3">Nền tảng</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3">Kịch bản</th>
                  <th className="py-3 px-3">Lịch đăng</th>
                  <th className="py-3 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredContents.map((c) => {
                  const statusBadge = getContentStatusBadge(c.status);

                  return (
                    <tr key={c.id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-100">{c.title}</div>
                        {c.rawIdea && <div className="text-[11px] text-zinc-400 truncate max-w-md">{c.rawIdea}</div>}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          c.platform === 'tiktok' ? 'bg-pink-500/15 text-pink-300' : 'bg-red-500/15 text-red-300'
                        }`}>
                          {c.platform === 'tiktok' ? 'TikTok' : 'YouTube'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {c.script ? (
                          <button
                            onClick={() => setSelectedScriptItem(c)}
                            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Đã có AI Script
                          </button>
                        ) : (
                          <span className="text-[11px] text-zinc-500">Chưa tạo</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-zinc-300">
                        {c.scheduledDate ? formatDate(c.scheduledDate) : '—'}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditManual(c)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteContent(c.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: AI SCRIPT CREATOR MODAL */}
      <AIScriptModal
        isOpen={isAIScriptModalOpen}
        onClose={() => setIsAIScriptModalOpen(false)}
        onSaveContent={onAddContent}
        isLight={isLight}
      />

      {/* MODAL 2: VIEW FULL SCRIPT DETAILS MODAL */}
      {selectedScriptItem && selectedScriptItem.script && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className={`w-full max-w-3xl rounded-2xl border p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto ${
            isLight ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-zinc-900 border-zinc-800 text-zinc-100'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Kịch bản Video {selectedScriptItem.platform.toUpperCase()}
                </span>
                <h3 className="text-lg font-bold font-display text-white">{selectedScriptItem.script.title}</h3>
              </div>
              <button
                onClick={() => setSelectedScriptItem(null)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-4 py-4">
              {/* Hook */}
              <div className="p-4 rounded-xl bg-pink-950/20 border border-pink-500/30 space-y-1.5">
                <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">1. HOOK (Mở đầu)</span>
                <p className="text-xs text-white font-medium italic">"{selectedScriptItem.script.hook}"</p>
                <p className="text-[11px] text-zinc-400">🎬 Visual: {selectedScriptItem.script.hookVisual}</p>
              </div>

              {/* Body */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">2. NỘI DUNG (BODY)</span>
                {selectedScriptItem.script.body.map((seg, i) => (
                  <div key={i} className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-zinc-300">
                      <span>{seg.segment}</span>
                      <span className="text-cyan-400 font-mono text-[10px]">{seg.duration}</span>
                    </div>
                    <p className="text-zinc-200">🗣️ Thoại: "{seg.audio}"</p>
                    <p className="text-[11px] text-zinc-400">🎬 Visual: {seg.visual}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">3. KÊU GỌI HÀNH ĐỘNG (CTA)</span>
                <p className="text-xs text-white font-medium">"{selectedScriptItem.script.callToAction}"</p>
                <p className="text-[11px] text-zinc-400">🎬 Visual: {selectedScriptItem.script.ctaVisual}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MANUAL ADD/EDIT CONTENT */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${
            isLight ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-zinc-900 border-zinc-800 text-zinc-100'
          }`}>
            <h3 className="text-lg font-bold font-display mb-4 flex items-center gap-2">
              <Tv className="w-5 h-5 text-cyan-400" />
              {editingContent ? 'Chỉnh sửa Nội dung Video' : 'Thêm Ý tưởng Video mới'}
            </h3>

            <form onSubmit={handleSaveManual} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Tiêu đề Video *</label>
                <input
                  type="text"
                  required
                  value={manualForm.title}
                  onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                  placeholder="VD: 3 lỗi sai phối màu trên bao bì"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Nền tảng</label>
                  <select
                    value={manualForm.platform}
                    onChange={(e) => setManualForm({ ...manualForm, platform: e.target.value as VideoPlatform })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-cyan-500"
                  >
                    <option value="tiktok">TikTok / Short</option>
                    <option value="youtube">YouTube Long-form</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Trạng thái</label>
                  <select
                    value={manualForm.status}
                    onChange={(e) => setManualForm({ ...manualForm, status: e.target.value as ContentStatus })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-cyan-500"
                  >
                    <option value="idea">Ý tưởng thô</option>
                    <option value="scripted">Đã có kịch bản</option>
                    <option value="filming">Đang quay</option>
                    <option value="editing">Đang dựng</option>
                    <option value="published">Đã đăng tải</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Mô tả ý tưởng thô</label>
                <textarea
                  rows={2}
                  value={manualForm.rawIdea}
                  onChange={(e) => setManualForm({ ...manualForm, rawIdea: e.target.value })}
                  placeholder="Ghi chú nhanh về ý tưởng hoặc góc quay..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Lịch dự kiến đăng</label>
                  <input
                    type="date"
                    value={manualForm.scheduledDate}
                    onChange={(e) => setManualForm({ ...manualForm, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Mục tiêu lượt xem (Views)</label>
                  <input
                    type="number"
                    value={manualForm.targetViews}
                    onChange={(e) => setManualForm({ ...manualForm, targetViews: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-md"
                >
                  Lưu thẻ nội dung
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};
