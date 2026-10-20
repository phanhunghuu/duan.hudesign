import React, { useState } from 'react';
import { Client, DesignItem, Quotation, ServicePricingBoard, StudioProfile } from '../types';
import { calculatePackageQuota, getCurrentMonthKey, formatMonthLabel } from '../utils/slugUtils';
import { formatVND, formatDate } from '../utils/formatters';
import { 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Phone, 
  MessageCircle, 
  Calendar, 
  Layers, 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  Download, 
  FolderOpen, 
  Maximize2, 
  X, 
  ArrowLeft, 
  FileText, 
  CreditCard, 
  Check, 
  RefreshCw, 
  ChevronRight, 
  Image as ImageIcon,
  Tag,
  Star,
  Zap,
  Info
} from 'lucide-react';

interface ClientPortalViewProps {
  client?: Client | null;
  slug?: string;
  designItems: DesignItem[];
  quotations: Quotation[];
  pricingBoards: ServicePricingBoard[];
  studioProfile: StudioProfile;
  onBackToAdmin?: () => void;
  onRefreshData?: () => void;
  isLight: boolean;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  client,
  slug,
  designItems = [],
  quotations = [],
  pricingBoards = [],
  studioProfile,
  onBackToAdmin,
  onRefreshData,
  isLight = true,
}) => {
  // Navigation tabs in Client Portal
  const [activeTab, setActiveTab] = useState<'progress' | 'pricing' | 'quote'>('progress');

  // Month selector for monthly package
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    client?.packageConfig?.activeMonth || getCurrentMonthKey()
  );

  // Lightbox modal for previewing design images
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  if (!client) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
        <div className={`max-w-md w-full p-8 rounded-3xl border text-center space-y-4 ${isLight ? 'bg-white border-slate-200 shadow-xl' : 'bg-slate-900 border-slate-800'}`}>
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-display">Không tìm thấy khách hàng</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Đường dẫn <strong>/{slug || ''}</strong> chưa được tạo hoặc đã thay đổi tên. Vui lòng liên hệ Studio để nhận đường link mới nhất.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            {studioProfile?.phone && (
              <a
                href={`tel:${studioProfile.phone}`}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 text-slate-700 dark:text-slate-200"
              >
                <Phone className="w-4 h-4 text-emerald-500" />
                Hotline: {studioProfile.phone}
              </a>
            )}
            {onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer"
              >
                Quay về Bảng điều khiển Studio
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Realtime package quota calculations
  const quotaStats = calculatePackageQuota(client, designItems, selectedMonthKey);

  // Client's quotations
  const clientQuotes = quotations.filter((q) => q.clientId === client.id);

  // Board pricing to display (either specifically assigned or the first social/combo board)
  const activePricingBoard = 
    pricingBoards.find((b) => b.id === client.assignedPricingBoardId) ||
    pricingBoards.find((b) => b.category?.toLowerCase().includes('social') || b.title?.toLowerCase().includes('social')) ||
    pricingBoards[0];

  // Available months extracted from design items
  const availableMonths = Array.from(
    new Set([
      getCurrentMonthKey(),
      client.packageConfig?.activeMonth || '',
      ...designItems
        .filter((d) => d.clientId === client.id)
        .map((d) => (d.targetMonth || d.deadline || d.createdAt || '').substring(0, 7))
        .filter((m) => m && m.length === 7),
    ])
  ).filter(Boolean);

  return (
    <div className={`min-h-screen font-sans ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      {/* Top Banner (Admin Quick Back Bar if applicable) */}
      {onBackToAdmin && (
        <div className="bg-indigo-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Đang ở chế độ xem thử liên kết của khách hàng: <strong>{client.company || client.name}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            {onRefreshData && (
              <button
                onClick={onRefreshData}
                className="px-2.5 py-1 rounded bg-indigo-700 hover:bg-indigo-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                title="Cập nhật dữ liệu mới nhất"
              >
                <RefreshCw className="w-3 h-3" />
                Làm mới
              </button>
            )}
            <button
              onClick={onBackToAdmin}
              className="px-3 py-1 rounded bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Quay lại Quản trị Studio
            </button>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className={`border-b sticky top-0 z-30 backdrop-blur-md transition-colors ${
        isLight ? 'bg-white/90 border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800 shadow-md'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              HỦ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight">
                  {studioProfile.studioName || 'Hủ Design Studio'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Client Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tiến độ thiết kế & Báo giá dành cho: <strong className="text-slate-900 dark:text-slate-100">{client.company || client.name}</strong>
              </p>
            </div>
          </div>

          {/* Quick Contact & Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <a
              href={`https://zalo.me/${(studioProfile.phone || '0912412132').replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Nhắn Zalo Hủ Design</span>
            </a>
            <a
              href={`tel:${studioProfile.phone || '0912412132'}`}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' 
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              <Phone className="w-4 h-4 text-emerald-500" />
              <span className="hidden xs:inline">{studioProfile.phone || '0912.412.132'}</span>
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
            <button
              onClick={() => setActiveTab('progress')}
              className={`py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'progress'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Tiến Độ Gói Tháng & Sản Phẩm ({quotaStats.itemsInMonth.length})</span>
            </button>

            {activePricingBoard && (
              <button
                onClick={() => setActiveTab('pricing')}
                className={`py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'pricing'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>Bảng Giá Dịch Vụ</span>
              </button>
            )}

            {clientQuotes.length > 0 && (
              <button
                onClick={() => setActiveTab('quote')}
                className={`py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'quote'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Báo Giá & Thanh Toán ({clientQuotes.length})</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ======================================================== */}
        {/* TAB 1: TIẾN ĐỘ GÓI THIẾT KẾ THÁNG & SẢN PHẨM               */}
        {/* ======================================================== */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* HERO CARD: THỐNG KÊ SỐ POST CÒN LẠI TRONG THÁNG */}
            {quotaStats.hasPackage ? (
              <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
                isLight 
                  ? 'bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white border-indigo-700' 
                  : 'bg-gradient-to-br from-indigo-950 via-slate-900 to-black text-white border-slate-800'
              }`}>
                {/* Background ambient lighting */}
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left Column: Tên gói & Tháng */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
                        {quotaStats.packageName}
                      </span>
                      {availableMonths.length > 1 && (
                        <select
                          value={selectedMonthKey}
                          onChange={(e) => setSelectedMonthKey(e.target.value)}
                          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full px-3 py-1 text-xs font-bold transition focus:outline-hidden"
                        >
                          {availableMonths.map((m) => (
                            <option key={m} value={m} className="bg-slate-900 text-white">
                              {formatMonthLabel(m)}
                            </option>
                          ))}
                        </select>
                      )}
                      <span className="text-xs text-indigo-200">
                        ({quotaStats.targetMonthLabel})
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      Theo Dõi Tiến Độ Thiết Kế Trong Tháng
                    </h2>

                    <p className="text-xs sm:text-sm text-indigo-200 max-w-xl">
                      Mỗi khi Hủ Design hoàn thiện sản phẩm mới, danh mục sẽ được cập nhật tự động ngay trên trang này.
                    </p>

                    <div className="pt-2 flex items-center gap-2 text-[11px] text-amber-300 font-semibold">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>Quy đổi bài đăng: 1 hình đơn = 1 post • Album 2-4 hình = 2 post • Từ 5 hình = 3 post</span>
                    </div>
                  </div>

                  {/* Right Column: 3 Metric Counters */}
                  <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0 bg-white/5 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10">
                    <div className="text-center px-1">
                      <span className="text-[11px] uppercase tracking-wider text-indigo-200 font-bold block">Tổng Gói</span>
                      <span className="text-2xl sm:text-4xl font-black text-white">{quotaStats.totalQuota}</span>
                      <span className="text-[10px] text-indigo-300 block">post</span>
                    </div>

                    <div className="text-center px-1 border-x border-white/10">
                      <span className="text-[11px] uppercase tracking-wider text-indigo-200 font-bold block">Đã Dùng</span>
                      <span className="text-2xl sm:text-4xl font-black text-amber-400">{quotaStats.usedQuota}</span>
                      <span className="text-[10px] text-indigo-300 block">post</span>
                    </div>

                    <div className="text-center px-1">
                      <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block">Còn Lại</span>
                      <span className={`text-2xl sm:text-4xl font-black ${
                        quotaStats.remainingQuota > 4
                          ? 'text-emerald-400'
                          : quotaStats.remainingQuota > 0
                          ? 'text-amber-300'
                          : 'text-red-400'
                      }`}>
                        {quotaStats.remainingQuota}
                      </span>
                      <span className="text-[10px] text-emerald-300 block">post</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex justify-between items-center text-xs font-bold text-indigo-200 mb-2">
                    <span>Tiến độ thực hiện gói tháng:</span>
                    <span className="text-white font-mono">{quotaStats.usedQuota} / {quotaStats.totalQuota} post ({quotaStats.usagePercent}%)</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden p-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 shadow-sm ${
                        quotaStats.usagePercent >= 100
                          ? 'bg-gradient-to-r from-amber-400 to-red-500'
                          : quotaStats.usagePercent >= 75
                          ? 'bg-gradient-to-r from-emerald-400 to-amber-400'
                          : 'bg-gradient-to-r from-blue-400 to-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, quotaStats.usagePercent)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Trường hợp khách thiết kế theo dự án/bài lẻ */
              <div className={`p-6 rounded-2xl border ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      Gói Thiết Kế Linh Hoạt
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black mt-1">Danh Mục Sản Phẩm Đang Thực Hiện</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Tổng số: <strong>{quotaStats.itemsInMonth.length} sản phẩm / bài thiết kế</strong>
                    </p>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Dữ liệu đồng bộ trực tiếp từ Hủ Design</span>
                  </div>
                </div>
              </div>
            )}

            {/* DANH SÁCH BÀI THIẾT KẾ / SẢN PHẨM TRONG THÁNG */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-indigo-500" />
                    Danh Sách Sản Phẩm Trong {quotaStats.targetMonthLabel}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {quotaStats.itemsInMonth.length} bài
                  </span>
                </div>

                <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cập nhật mới nhất lúc {new Date().toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              {quotaStats.itemsInMonth.length === 0 ? (
                <div className={`p-12 text-center rounded-3xl border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <ImageIcon className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-50" />
                  <h4 className="font-bold text-base text-slate-700 dark:text-slate-300">Chưa có sản phẩm thiết kế nào trong {quotaStats.targetMonthLabel}</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Hủ Design đang tiến hành lên ý tưởng và thiết kế. Khi có bản demo hoặc hoàn tất, sản phẩm sẽ xuất hiện tại đây ngay lập tức.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {quotaStats.itemsInMonth.map((item, index) => {
                    const postQuota = typeof item.postQuota === 'number' && item.postQuota > 0 ? item.postQuota : 1;
                    const demoImages = item.demoImages || [];
                    const mainImage = item.demoImageUrl || demoImages[0]?.url;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border overflow-hidden flex flex-col transition-all hover:shadow-lg ${
                          isLight 
                            ? 'bg-white border-slate-200 hover:border-indigo-300' 
                            : 'bg-slate-900 border-slate-800 hover:border-indigo-700'
                        }`}
                      >
                        {/* Image Preview Box */}
                        <div className="relative aspect-4/3 bg-slate-100 dark:bg-slate-800 overflow-hidden group">
                          {mainImage ? (
                            <img
                              src={mainImage}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                              <ImageIcon className="w-10 h-10 mb-1 opacity-40" />
                              <span className="text-xs">Đang cập nhật file ảnh demo</span>
                            </div>
                          )}

                          {/* Post Quota Badge (Tính bao nhiêu post vào gói) */}
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-600 text-white shadow-md flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              Tính {postQuota} post
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="absolute top-3 right-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-md ${
                              item.status === 'done'
                                ? 'bg-emerald-600 text-white'
                                : item.status === 'review'
                                ? 'bg-amber-500 text-white'
                                : 'bg-blue-600 text-white'
                            }`}>
                              {item.status === 'done' ? 'Đã hoàn thành' : item.status === 'review' ? 'Chờ duyệt' : 'Đang thiết kế'}
                            </span>
                          </div>

                          {/* Quick Lightbox Button if image exists */}
                          {mainImage && (
                            <button
                              type="button"
                              onClick={() => setPreviewImage({ url: mainImage, title: item.title })}
                              className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition shadow-md cursor-pointer"
                              title="Xem ảnh phóng to"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Multi Image Indicator */}
                          {demoImages.length > 1 && (
                            <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs">
                              Album {demoImages.length} ảnh
                            </div>
                          )}
                        </div>

                        {/* Content Info */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{item.category}</span>
                              <span>•</span>
                              <span>{item.deadline ? `Hạn: ${formatDate(item.deadline)}` : formatDate(item.createdAt)}</span>
                            </div>

                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2">
                              {item.title}
                            </h4>

                            {item.brief && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                {item.brief}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons: Tải file Drive / Xem album */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-400 font-medium">
                              Bài #{index + 1}
                            </span>

                            <div className="flex items-center gap-2">
                              {item.driveFolderUrl && (
                                <a
                                  href={item.driveFolderUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded-lg font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-1 transition"
                                  title="Mở thư mục Google Drive bài này"
                                >
                                  <FolderOpen className="w-3.5 h-3.5" />
                                  <span>Tải file gốc</span>
                                </a>
                              )}
                              {mainImage && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage({ url: mainImage, title: item.title })}
                                  className="px-2.5 py-1 rounded-lg font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition cursor-pointer"
                                >
                                  <Maximize2 className="w-3.5 h-3.5" />
                                  <span>Xem ảnh</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: BẢNG GIÁ DỊCH VỤ CỦA HỦ DESIGN                     */}
        {/* ======================================================== */}
        {activeTab === 'pricing' && activePricingBoard && (
          <div className="space-y-6">
            <div className={`p-6 sm:p-8 rounded-3xl border text-center ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                {activePricingBoard.category || 'Bảng Giá Dịch Vụ Niêm Yết'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-2 text-slate-900 dark:text-slate-100">
                {activePricingBoard.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto mt-2">
                {activePricingBoard.subtitle || 'Chọn gói thiết kế phù hợp với quy mô và chiến lược thương hiệu của bạn'}
              </p>
            </div>

            {/* Pricing Tiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePricingBoard.tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`rounded-2xl border p-6 flex flex-col justify-between relative transition-all ${
                    tier.isPopular
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-xl ' + (isLight ? 'bg-white' : 'bg-slate-900')
                      : isLight
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  {tier.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-indigo-600 text-white shadow-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {tier.popularBadgeText || 'Khuyên dùng'}
                      </span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-black text-lg text-slate-900 dark:text-slate-100">{tier.name}</h4>
                      {tier.subtitle && (
                        <p className="text-xs text-slate-500 mt-0.5">{tier.subtitle}</p>
                      )}
                    </div>

                    <div className="py-2 border-y border-slate-100 dark:border-slate-800">
                      <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                        {tier.price}
                      </span>
                    </div>

                    {/* Features list */}
                    <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                      {tier.features.map((feat) => (
                        <li key={feat.id} className="flex items-start gap-2">
                          {feat.included ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <span className={feat.included ? '' : 'text-slate-400 line-through'}>
                            {feat.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href={`https://zalo.me/${(studioProfile.phone || '0912412132').replace(/[^0-9]/g, '')}?text=Chào Hủ Design, mình muốn tư vấn ${tier.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                        tier.isPopular
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                          : isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{tier.buttonText || 'Tư Vấn Gói Này'}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Terms & Conditions */}
            {activePricingBoard.showTerms && activePricingBoard.terms.length > 0 && (
              <div className={`p-6 rounded-2xl border ${
                isLight ? 'bg-slate-100/60 border-slate-200' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4">
                  Quy trình làm việc & Điều khoản dịch vụ
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activePricingBoard.terms.map((term) => (
                    <div key={term.id} className="space-y-1">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {term.title}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                        {term.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: BÁO GIÁ & THÔNG TIN THANH TOÁN                     */}
        {/* ======================================================== */}
        {activeTab === 'quote' && (
          <div className="space-y-6">
            {clientQuotes.map((q) => (
              <div
                key={q.id}
                className={`p-6 sm:p-8 rounded-3xl border shadow-sm ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      Báo giá #{q.quotationNumber}
                    </span>
                    <h3 className="text-xl font-black mt-1">Báo Giá Dịch Vụ Thiết Kế</h3>
                    <p className="text-xs text-slate-500">
                      Ngày phát hành: {formatDate(q.issueDate)} • Hiệu lực đến: {formatDate(q.validUntil)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Tổng thanh toán:</span>
                    <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                      {formatVND(q.total)}
                    </span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="py-6 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                        <th className="py-2">Hạng mục thiết kế</th>
                        <th className="py-2 text-center">Số lượng</th>
                        <th className="py-2 text-right">Đơn giá</th>
                        <th className="py-2 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {q.items.map((it) => (
                        <tr key={it.id}>
                          <td className="py-3 pr-4 font-semibold text-slate-800 dark:text-slate-200">
                            {it.title}
                            {it.description && (
                              <span className="block text-[11px] font-normal text-slate-400 mt-0.5">
                                {it.description}
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-center">{it.quantity} {it.unit}</td>
                          <td className="py-3 text-right">{formatVND(it.unitPrice)}</td>
                          <td className="py-3 text-right font-bold">{formatVND(it.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Payment & Bank Account Info */}
                <div className={`mt-6 p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-700'
                }`}>
                  <div className="space-y-2 max-w-md">
                    <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-500" />
                      Thông tin chuyển khoản thanh toán
                    </h4>
                    <p className="text-xs text-slate-500 whitespace-pre-line leading-relaxed">
                      {q.paymentTerms || studioProfile.defaultPaymentTerms}
                    </p>
                    <div className="pt-2 text-xs space-y-1 font-mono">
                      <p>Ngân hàng: <strong>{q.bankInfo.bankName || studioProfile.bankName}</strong></p>
                      <p>Số tài khoản: <strong className="text-indigo-600 dark:text-indigo-400 text-sm select-all">{q.bankInfo.accountNumber || studioProfile.bankAccount}</strong></p>
                      <p>Chủ tài khoản: <strong>{q.bankInfo.accountHolder || studioProfile.bankOwner}</strong></p>
                    </div>
                  </div>

                  {(q.bankInfo.qrImage || studioProfile.bankQrImage) && (
                    <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 shrink-0 text-center">
                      <img
                        src={q.bankInfo.qrImage || studioProfile.bankQrImage}
                        alt="Mã QR Chuyển Khoản"
                        className="w-36 h-36 object-contain mx-auto"
                      />
                      <span className="text-[10px] font-bold text-slate-600 block mt-1">Quét mã chuyển khoản</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
            <p className="text-white text-sm font-bold mt-3 text-center">
              {previewImage.title}
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`border-t py-8 text-center text-xs mt-12 transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-400' : 'bg-slate-900 border-slate-800 text-slate-500'
      }`}>
        <p className="font-semibold text-slate-600 dark:text-slate-400">
          {studioProfile.studioName} • {studioProfile.tagline}
        </p>
        <p className="mt-1">
          Hotline: {studioProfile.phone} • Email: {studioProfile.email}
        </p>
      </footer>
    </div>
  );
};
