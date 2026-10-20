import React, { useState } from 'react';
import { Client, ServicePricingBoard, DesignItem } from '../types';
import { getClientSlug, getClientShareUrl, calculatePackageQuota } from '../utils/slugUtils';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  MessageCircle, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Settings2,
  Calendar,
  AlertTriangle,
  Flame,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface ClientShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  initialClientId?: string;
  pricingBoards?: ServicePricingBoard[];
  currentBoardId?: string;
  designItems: DesignItem[];
  onUpdateClient: (client: Client) => void;
  onNavigateToClientPortal?: (slug: string) => void;
  isLight: boolean;
}

export const ClientShareLinkModal: React.FC<ClientShareLinkModalProps> = ({
  isOpen,
  onClose,
  clients = [],
  initialClientId,
  pricingBoards = [],
  currentBoardId,
  designItems = [],
  onUpdateClient,
  onNavigateToClientPortal,
  isLight,
}) => {
  if (!isOpen) return null;

  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialClientId || (clients[0]?.id ?? '')
  );
  const [copiedToast, setCopiedToast] = useState(false);
  const [copiedZaloToast, setCopiedZaloToast] = useState(false);
  const [isEditingPackage, setIsEditingPackage] = useState(false);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  // Editable slug state
  const [customSlug, setCustomSlug] = useState<string>(
    selectedClient ? (selectedClient.slug || getClientSlug(selectedClient)) : ''
  );

  // Package editor local form
  const [pkgTotalPosts, setPkgTotalPosts] = useState<number>(
    selectedClient?.packageConfig?.totalPostsPerMonth || 15
  );
  const [pkgName, setPkgName] = useState<string>(
    selectedClient?.packageConfig?.packageName || 'Gói 15 post / tháng'
  );
  const [hasPkg, setHasPkg] = useState<boolean>(
    selectedClient?.packageConfig?.hasMonthlyPackage ?? true
  );

  if (!selectedClient) {
    return null;
  }

  const clientSlug = selectedClient.slug || getClientSlug(selectedClient);
  const shareUrl = getClientShareUrl(selectedClient);
  const quotaStats = calculatePackageQuota(selectedClient, designItems);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handleCopyZaloMessage = () => {
    const msg = `Dạ em chào anh/chị ${selectedClient.name} (${selectedClient.company}) ạ!\n\nHủ Design xin gửi anh/chị đường link theo dõi tiến độ thiết kế & bảng giá dịch vụ trực tuyến của bên mình:\n👉 Link xem trực tiếp: ${shareUrl}\n\nTrang này cập nhật tự động theo thời gian thực mỗi khi Hủ hoàn thiện mẫu mới, đồng thời hiển thị số lượng post còn lại trong gói tháng ${quotaStats.targetMonthLabel}.\n\nAnh/chị xem qua giúp Hủ nhé. Cần hỗ trợ thêm điều gì anh/chị cứ nhắn Hủ bất cứ lúc nào ạ!`;
    navigator.clipboard.writeText(msg);
    setCopiedZaloToast(true);
    setTimeout(() => setCopiedZaloToast(false), 2500);
  };

  const handleSaveSettings = () => {
    const updated: Client = {
      ...selectedClient,
      slug: customSlug.trim() || getClientSlug(selectedClient),
      packageConfig: {
        hasMonthlyPackage: hasPkg,
        packageName: pkgName.trim() || `Gói ${pkgTotalPosts} post / tháng`,
        totalPostsPerMonth: Number(pkgTotalPosts) || 15,
        activeMonth: selectedClient.packageConfig?.activeMonth || quotaStats.targetMonthKey,
      },
      assignedPricingBoardId: currentBoardId || selectedClient.assignedPricingBoardId,
    };
    onUpdateClient(updated);
    setIsEditingPackage(false);
  };

  const handleOpenClientPortal = () => {
    if (onNavigateToClientPortal) {
      onNavigateToClientPortal(clientSlug);
      onClose();
    } else {
      window.open(`/${clientSlug}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        id="client-share-link-modal"
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden my-8 transition-all ${
          isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-gray-900 border-gray-800 text-gray-100'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-5 border-b flex items-center justify-between ${
          isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/60 border-gray-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg flex items-center gap-2">
                Xuất Link Cho Khách Xem (Client Portal)
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Tự động đồng bộ
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Khách theo dõi bảng giá, số lượng post còn lại trong gói tháng & xem demo sản phẩm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Chọn Khách Hàng */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2">
              Khách hàng nhận link:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={selectedClientId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedClientId(newId);
                  const cl = clients.find((c) => c.id === newId);
                  if (cl) {
                    setCustomSlug(cl.slug || getClientSlug(cl));
                    setPkgTotalPosts(cl.packageConfig?.totalPostsPerMonth || 15);
                    setPkgName(cl.packageConfig?.packageName || 'Gói 15 post / tháng');
                    setHasPkg(cl.packageConfig?.hasMonthlyPackage ?? true);
                  }
                }}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm font-semibold transition ${
                  isLight 
                    ? 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500' 
                    : 'bg-gray-800 border-gray-700 text-gray-100 focus:border-indigo-500'
                }`}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company ? `${c.company} (${c.name})` : c.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsEditingPackage(!isEditingPackage)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  isEditingPackage
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : isLight
                    ? 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
                    : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200'
                }`}
              >
                <Settings2 className="w-4 h-4" />
                <span>{isEditingPackage ? 'Đóng cấu hình' : 'Cấu hình gói tháng & URL'}</span>
              </button>
            </div>
          </div>

          {/* Form cấu hình gói & slug nếu bấm mở */}
          {isEditingPackage && (
            <div className={`p-4 rounded-xl border space-y-4 animate-in fade-in duration-150 ${
              isLight ? 'bg-indigo-50/50 border-indigo-200' : 'bg-indigo-950/20 border-indigo-900/50'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Cài Đặt Gói Thiết Kế Tháng & Đường Dẫn Khách
                </span>
                <label className="flex items-center gap-2 text-xs cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={hasPkg}
                    onChange={(e) => setHasPkg(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Áp dụng gói tháng</span>
                </label>
              </div>

              {hasPkg && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                      Số lượng post trong tháng:
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[15, 25, 30].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setPkgTotalPosts(num);
                            setPkgName(`Gói ${num} post / tháng`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                            pkgTotalPosts === num
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : isLight
                              ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                              : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {num} post
                        </button>
                      ))}
                      <input
                        type="number"
                        min="1"
                        value={pkgTotalPosts}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPkgTotalPosts(val);
                          setPkgName(`Gói ${val} post / tháng`);
                        }}
                        className={`w-20 px-2 py-1 rounded-lg border text-xs font-bold text-center ${
                          isLight ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-700'
                        }`}
                        title="Tự nhập số post"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                      Tên gói hiển thị:
                    </label>
                    <input
                      type="text"
                      value={pkgName}
                      onChange={(e) => setPkgName(e.target.value)}
                      placeholder="VD: Gói 15 post / tháng"
                      className={`w-full px-3 py-1.5 rounded-lg border text-xs font-medium ${
                        isLight ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-700'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Đường dẫn Slug */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Đường dẫn xem riêng (Slug URL):
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-mono">
                    {window.location.origin}/
                  </span>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="ten-khach-hang"
                    className={`flex-1 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                      isLight ? 'bg-white border-gray-300 text-indigo-600' : 'bg-gray-800 border-gray-700 text-indigo-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer"
                  >
                    Lưu cài đặt
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Đường Link Trực Quan Dành Cho Khách */}
          <div className={`p-4 rounded-2xl border ${
            isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/40 border-gray-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                Đường link gửi khách hàng:
              </span>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Cập nhật tự động khi thêm bài
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className={`flex-1 px-3.5 py-2.5 rounded-xl border font-mono text-xs sm:text-sm font-bold truncate select-all ${
                isLight ? 'bg-white border-gray-300 text-indigo-700' : 'bg-gray-900 border-gray-700 text-indigo-300'
              }`}>
                {shareUrl}
              </div>

              <button
                type="button"
                id="btn-copy-client-share-link"
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  copiedToast
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                }`}
              >
                {copiedToast ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedToast ? 'Đã chép link!' : 'Chép link'}</span>
              </button>
            </div>

            {/* Thống kê tiến độ gói tháng của khách */}
            {quotaStats.hasPackage && (
              <div className="mt-4 pt-4 border-t border-gray-200/60 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                    quotaStats.remainingQuota > 4
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : quotaStats.remainingQuota > 0
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-red-500/10 text-red-600'
                  }`}>
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-2">
                      <span>{quotaStats.packageName} ({quotaStats.targetMonthLabel})</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        quotaStats.remainingQuota > 4
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : quotaStats.remainingQuota > 0
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                      }`}>
                        Còn {quotaStats.remainingQuota} / {quotaStats.totalQuota} post
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Đã thực hiện: <strong>{quotaStats.usedQuota} post</strong> • Khách tự theo dõi qua link này
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-44">
                  <div className="flex justify-between text-[10px] font-bold mb-1 text-gray-500">
                    <span>Tiến độ gói:</span>
                    <span>{quotaStats.usagePercent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        quotaStats.usagePercent >= 100
                          ? 'bg-red-500'
                          : quotaStats.usagePercent >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, quotaStats.usagePercent)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hành động nhanh: Soạn tin Zalo & Xem thử */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              id="btn-copy-zalo-message"
              onClick={handleCopyZaloMessage}
              className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                copiedZaloToast
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : isLight
                  ? 'bg-blue-50/60 hover:bg-blue-100/80 border-blue-200 text-blue-700'
                  : 'bg-blue-950/30 hover:bg-blue-900/40 border-blue-900 text-blue-300'
              }`}
            >
              <MessageCircle className="w-4 h-4 text-blue-500" />
              <span>{copiedZaloToast ? 'Đã sao chép tin nhắn Zalo!' : 'Soạn tin Zalo gửi khách'}</span>
            </button>

            <button
              type="button"
              id="btn-preview-client-portal"
              onClick={handleOpenClientPortal}
              className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                isLight
                  ? 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800'
                  : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200'
              }`}
            >
              <ExternalLink className="w-4 h-4 text-indigo-500" />
              <span>Mở xem thử giao diện khách thấy</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex items-center justify-between text-xs ${
          isLight ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-gray-800/40 border-gray-800 text-gray-400'
        }`}>
          <span>
            💡 Khách mở link trên điện thoại hoặc máy tính đều xem được mượt mà, không cần đăng nhập.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:opacity-90 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
