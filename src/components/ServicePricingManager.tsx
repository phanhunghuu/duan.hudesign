import React, { useState, useRef } from 'react';
import { ServicePricingBoard, PricingTierCard, PricingFeatureItem, PricingTermItem, PricingColorTheme, PricingLayoutType, StudioProfile, Client, DesignItem } from '../types';
import { initialPricingBoards } from '../data/pricingTemplates';
import { toPng, toBlob } from 'html-to-image';
import { AIPricingModal } from './AIPricingModal';
import { ClientShareLinkModal } from './ClientShareLinkModal';
import {
  Download,
  Copy,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Sparkles,
  Zap,
  Star,
  Shield,
  Crown,
  Layers,
  Monitor,
  Palette,
  Eye,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Info,
  Phone,
  MessageCircle,
  Globe,
  Share2,
  FileText,
  BadgePercent,
  CheckSquare,
  Square,
  HelpCircle,
  Tag,
  ArrowRight,
  Save,
  FolderOpen,
  Search,
  Clock,
  CheckCheck
} from 'lucide-react';

interface ServicePricingManagerProps {
  pricingBoards: ServicePricingBoard[];
  onSaveBoard: (board: ServicePricingBoard) => void;
  onDeleteBoard: (boardId: string) => void;
  studioProfile: StudioProfile;
  theme: 'dark' | 'light';
  clients?: Client[];
  designItems?: DesignItem[];
  onUpdateClient?: (client: Client) => void;
  onNavigateToClientPortal?: (slug: string) => void;
}

export const ServicePricingManager: React.FC<ServicePricingManagerProps> = ({
  pricingBoards,
  onSaveBoard,
  onDeleteBoard,
  studioProfile,
  theme,
  clients = [],
  designItems = [],
  onUpdateClient,
  onNavigateToClientPortal,
}) => {
  const isLight = theme === 'light';

  // Available boards state fallback
  const boards = pricingBoards && pricingBoards.length > 0 ? pricingBoards : initialPricingBoards;

  // Currently selected board
  const [selectedBoardId, setSelectedBoardId] = useState<string>(boards[0]?.id || 'pricing_logo_master');
  const activeBoard = boards.find((b) => b.id === selectedBoardId) || boards[0];

  // Editor mode: 'preview' (chế độ xem & xuất ảnh) hoặc 'editor' (chế độ tùy chỉnh nội dung)
  const [viewMode, setViewMode] = useState<'preview' | 'editor'>('preview');

  // Export image states
  const captureRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active modal or sub-edit states
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [newFeatureText, setNewFeatureText] = useState<{ [tierId: string]: string }>({});

  // AI Pricing Modal states
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [aiTargetTierId, setAiTargetTierId] = useState<string | null>(null);

  // Saved Boards Manager Modal states
  const [isSavedBoardsModalOpen, setIsSavedBoardsModalOpen] = useState<boolean>(false);
  const [searchBoardQuery, setSearchBoardQuery] = useState<string>('');

  // Client Share Link Modal state
  const [isClientShareModalOpen, setIsClientShareModalOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Handlers for applying AI suggestions
  const handleApplyAIFeaturesToTier = (tierId: string, newFeatures: PricingFeatureItem[]) => {
    updateActiveBoard((prev) => ({
      ...prev,
      tiers: prev.tiers.map((t) =>
        t.id === tierId ? { ...t, features: [...t.features, ...newFeatures] } : t
      ),
    }));
    showToast(`Đã thêm ${newFeatures.length} tính năng vào gói thành công!`);
  };

  const handleApplyAITerms = (newTerms: PricingTermItem[]) => {
    updateActiveBoard((prev) => ({
      ...prev,
      showTerms: true,
      terms: [...prev.terms, ...newTerms],
    }));
    showToast(`Đã thêm ${newTerms.length} điều khoản vào bảng giá thành công!`);
  };

  const handleApplyAIFullBoard = (newTiers: PricingTierCard[], newTerms: PricingTermItem[]) => {
    updateActiveBoard((prev) => ({
      ...prev,
      showTerms: true,
      tiers: newTiers,
      terms: newTerms,
    }));
    showToast(`Đã cập nhật toàn bộ các gói và điều khoản mới từ AI!`);
  };

  // Helper for rendering icons
  const renderTierIcon = (iconName?: string, className: string = 'w-6 h-6') => {
    switch (iconName) {
      case 'zap':
        return <Zap className={className} />;
      case 'star':
        return <Star className={className} />;
      case 'shield':
        return <Shield className={className} />;
      case 'crown':
        return <Crown className={className} />;
      case 'sparkles':
        return <Sparkles className={className} />;
      case 'layers':
        return <Layers className={className} />;
      case 'monitor':
        return <Monitor className={className} />;
      case 'palette':
        return <Palette className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  // Color theme mapper
  const getThemeStyles = (colorTheme: PricingColorTheme, isPopular: boolean = false) => {
    switch (colorTheme) {
      case 'green':
      case 'emerald':
        return {
          cardBorder: isPopular ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-emerald-200 hover:border-emerald-400',
          topAccent: 'bg-emerald-500',
          iconBg: 'bg-emerald-50 text-emerald-600',
          priceColor: 'text-emerald-600',
          buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
          badgeBg: 'bg-emerald-600 text-white',
          checkColor: 'text-emerald-600',
        };
      case 'blue':
        return {
          cardBorder: isPopular ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-blue-200 hover:border-blue-400',
          topAccent: 'bg-blue-600',
          iconBg: 'bg-blue-50 text-blue-600',
          priceColor: 'text-blue-600',
          buttonBg: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
          badgeBg: 'bg-blue-600 text-white',
          checkColor: 'text-blue-600',
        };
      case 'purple':
        return {
          cardBorder: isPopular ? 'border-purple-600 ring-2 ring-purple-500/25' : 'border-purple-200 hover:border-purple-400',
          topAccent: 'bg-purple-600',
          iconBg: 'bg-purple-50 text-purple-600',
          priceColor: 'text-purple-600',
          buttonBg: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20',
          badgeBg: 'bg-purple-600 text-white',
          checkColor: 'text-purple-600',
        };
      case 'orange':
        return {
          cardBorder: isPopular ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-orange-200 hover:border-orange-400',
          topAccent: 'bg-orange-500',
          iconBg: 'bg-orange-50 text-orange-600',
          priceColor: 'text-orange-600',
          buttonBg: 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20',
          badgeBg: 'bg-orange-600 text-white',
          checkColor: 'text-orange-600',
        };
      case 'pink':
        return {
          cardBorder: isPopular ? 'border-pink-500 ring-2 ring-pink-500/20' : 'border-pink-200 hover:border-pink-400',
          topAccent: 'bg-pink-500',
          iconBg: 'bg-pink-50 text-pink-600',
          priceColor: 'text-pink-600',
          buttonBg: 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-500/20',
          badgeBg: 'bg-pink-600 text-white',
          checkColor: 'text-pink-600',
        };
      case 'indigo':
        return {
          cardBorder: isPopular ? 'border-indigo-600 ring-2 ring-indigo-500/25' : 'border-indigo-200 hover:border-indigo-400',
          topAccent: 'bg-indigo-600',
          iconBg: 'bg-indigo-50 text-indigo-600',
          priceColor: 'text-indigo-600',
          buttonBg: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20',
          badgeBg: 'bg-indigo-600 text-white',
          checkColor: 'text-indigo-600',
        };
      default:
        return {
          cardBorder: isPopular ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-gray-300',
          topAccent: 'bg-blue-600',
          iconBg: 'bg-gray-100 text-gray-700',
          priceColor: 'text-gray-900',
          buttonBg: 'bg-blue-600 hover:bg-blue-700 text-white',
          badgeBg: 'bg-blue-600 text-white',
          checkColor: 'text-blue-600',
        };
    }
  };

  // EXPORT IMAGE HANDLER (PNG 2X / 3X HD)
  const handleExportPng = async () => {
    if (!captureRef.current) return;
    setIsExporting(true);
    try {
      // Allow DOM to settle
      await new Promise((resolve) => setTimeout(resolve, 200));

      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 2.5, // Siêu nét chất lượng 2.5x
        backgroundColor: '#ffffff',
      });

      const safeTitle = (activeBoard.title || 'Bang-Gia-Dich-Vu')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-');
      const filename = `${safeTitle}-HuDesign.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      showToast(`Đã xuất và tải ảnh "${filename}" thành công!`);
    } catch (err) {
      console.error('Export image error:', err);
      showToast('Có lỗi khi tạo ảnh. Vui lòng thử lại!');
    } finally {
      setIsExporting(false);
    }
  };

  // COPY IMAGE TO CLIPBOARD (dán trực tiếp vào Zalo / Messenger)
  const handleCopyImageToClipboard = async () => {
    if (!captureRef.current) return;
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const blob = await toBlob(captureRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      if (!blob) {
        throw new Error('Blob generation failed');
      }

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        showToast('Đã sao chép ảnh vào bộ nhớ tạm! Bạn có thể nhấn Ctrl + V vào Zalo/Messenger để gửi khách ngay.');
      } else {
        handleExportPng();
      }
    } catch (err) {
      console.error('Copy clipboard error:', err);
      // Fallback: download
      handleExportPng();
    } finally {
      setIsExporting(false);
    }
  };

  // MUTATION HANDLERS
  const updateActiveBoard = (updater: (prev: ServicePricingBoard) => ServicePricingBoard) => {
    const updated = updater(activeBoard);
    updated.updatedAt = new Date().toISOString();
    onSaveBoard(updated);
  };

  const handleCreateNewBoard = () => {
    const newBoard: ServicePricingBoard = {
      id: 'pricing_' + Date.now(),
      title: 'BẢNG GIÁ DỊCH VỤ THIẾT KẾ MỚI',
      subtitle: 'Báo giá tiêu chuẩn áp dụng từ ' + new Date().toLocaleDateString('vi-VN'),
      layoutType: 'cards',
      category: 'Branding & Logo',
      updatedAt: new Date().toISOString(),
      showTerms: true,
      showContactFooter: true,
      contactNote: `${studioProfile.studioName || 'Hủ Design'} • Hotline: ${studioProfile.phone || '0912.412.132'}`,
      watermarkText: 'HỦ DESIGN',
      tiers: [
        {
          id: 't_1',
          name: 'GÓI CƠ BẢN',
          price: '500.000 VNĐ',
          subtitle: 'Phù hợp nhu cầu đơn giản',
          colorTheme: 'green',
          iconName: 'zap',
          buttonText: 'CHỌN GÓI NÀY',
          features: [
            { id: 'f1', text: 'Số mẫu phác thảo: 2 mẫu', included: true },
            { id: 'f2', text: 'Số lần chỉnh sửa: 3 lần', included: true },
            { id: 'f3', text: 'Thời gian hoàn thành: 3 ngày', included: true },
            { id: 'f4', text: 'Bàn giao file gốc: Có', included: true },
          ],
        },
        {
          id: 't_2',
          name: 'GÓI TIÊU CHUẨN',
          price: '1.200.000 VNĐ',
          subtitle: 'Gói được khách hàng chọn nhiều nhất',
          colorTheme: 'purple',
          iconName: 'shield',
          isPopular: true,
          popularBadgeText: 'KHUYÊN DÙNG',
          buttonText: 'CHỌN GÓI NÀY',
          features: [
            { id: 'f1', text: 'Số mẫu phác thảo: 4 mẫu', included: true },
            { id: 'f2', text: 'Số lần chỉnh sửa: 6 lần', included: true },
            { id: 'f3', text: 'Thời gian hoàn thành: 5 ngày', included: true },
            { id: 'f4', text: 'Bàn giao file gốc + Phối cảnh 3D', included: true },
          ],
        },
      ],
      terms: [
        {
          id: 'term_1',
          title: 'Tạm ứng & Thanh toán',
          content: 'Đặt cọc 50% khi chốt gói, 50% thanh toán sau khi hoàn tất bàn giao.',
        },
      ],
    };

    onSaveBoard(newBoard);
    setSelectedBoardId(newBoard.id);
    setViewMode('editor');
    showToast('Đã tạo bảng giá mới thành công!');
  };

  // LƯU BẢNG GIÁ HIỆN TẠI (vào State, Storage & Cloud)
  const handleSaveCurrentBoard = () => {
    const updated: ServicePricingBoard = {
      ...activeBoard,
      updatedAt: new Date().toISOString(),
    };
    onSaveBoard(updated);
    showToast(`Đã lưu bảng giá "${activeBoard.title}" vào hệ thống & Cloud!`);
  };

  // NHÂN BẢN BẢNG GIÁ (Sao chép ra bản mới để dùng lại & chỉnh sửa)
  const handleDuplicateBoard = (boardToClone?: ServicePricingBoard) => {
    const source = boardToClone || activeBoard;
    const cloned: ServicePricingBoard = {
      ...JSON.parse(JSON.stringify(source)),
      id: 'pricing_' + Date.now(),
      title: `${source.title} (Bản sao)`,
      updatedAt: new Date().toISOString(),
    };
    onSaveBoard(cloned);
    setSelectedBoardId(cloned.id);
    setViewMode('editor');
    setIsSavedBoardsModalOpen(false);
    showToast(`Đã nhân bản bảng giá thành "${cloned.title}"!`);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Bạn có chắc muốn khôi phục lại các bảng giá mẫu gốc ban đầu không?')) {
      initialPricingBoards.forEach((b) => onSaveBoard(b));
      setSelectedBoardId(initialPricingBoards[0].id);
      showToast('Đã khôi phục các bảng giá mẫu thành công!');
    }
  };

  // Tier Features management
  const updateFeatureText = (tierId: string, featureId: string, newText: string) => {
    updateActiveBoard((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) => {
        if (tier.id !== tierId) return tier;
        return {
          ...tier,
          features: tier.features.map((f) => {
            if (f.id !== featureId) return f;
            return { ...f, text: newText };
          }),
        };
      }),
    }));
  };

  const toggleFeatureIncluded = (tierId: string, featureId: string) => {
    updateActiveBoard((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) => {
        if (tier.id !== tierId) return tier;
        return {
          ...tier,
          features: tier.features.map((f) => {
            if (f.id !== featureId) return f;
            return { ...f, included: !f.included };
          }),
        };
      }),
    }));
  };

  const addFeatureToTier = (tierId: string) => {
    const text = newFeatureText[tierId]?.trim();
    if (!text) return;

    updateActiveBoard((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) => {
        if (tier.id !== tierId) return tier;
        return {
          ...tier,
          features: [
            ...tier.features,
            { id: 'f_' + Date.now(), text, included: true },
          ],
        };
      }),
    }));

    setNewFeatureText((prev) => ({ ...prev, [tierId]: '' }));
  };

  const removeFeatureFromTier = (tierId: string, featureId: string) => {
    updateActiveBoard((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) => {
        if (tier.id !== tierId) return tier;
        return {
          ...tier,
          features: tier.features.filter((f) => f.id !== featureId),
        };
      }),
    }));
  };

  const addTier = () => {
    const colors: PricingColorTheme[] = ['blue', 'green', 'purple', 'orange', 'pink'];
    const randomColor = colors[activeBoard.tiers.length % colors.length];

    const newTier: PricingTierCard = {
      id: 'tier_' + Date.now(),
      name: `GÓI MỚI ${activeBoard.tiers.length + 1}`,
      price: '1.500.000 VNĐ',
      subtitle: 'Mô tả ngắn gọn cho gói',
      colorTheme: randomColor,
      iconName: 'sparkles',
      buttonText: 'CHỌN GÓI NÀY',
      features: [
        { id: 'f1', text: 'Quyền lợi / Tiêu chuẩn 1', included: true },
        { id: 'f2', text: 'Quyền lợi / Tiêu chuẩn 2', included: true },
        { id: 'f3', text: 'Tính năng nâng cao: Không', included: false },
      ],
    };

    updateActiveBoard((prev) => ({
      ...prev,
      tiers: [...prev.tiers, newTier],
    }));
  };

  const removeTier = (tierId: string) => {
    if (activeBoard.tiers.length <= 1) {
      alert('Bảng giá cần có ít nhất 1 gói hoặc dịch vụ.');
      return;
    }
    updateActiveBoard((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((t) => t.id !== tierId),
    }));
  };

  const addTerm = () => {
    const newTerm: PricingTermItem = {
      id: 'term_' + Date.now(),
      title: 'Điều khoản mới',
      content: 'Nhập nội dung quy định, thời hạn bàn giao hoặc phương thức thanh toán tại đây.',
    };
    updateActiveBoard((prev) => ({
      ...prev,
      terms: [...prev.terms, newTerm],
    }));
  };

  const removeTerm = (termId: string) => {
    updateActiveBoard((prev) => ({
      ...prev,
      terms: prev.terms.filter((t) => t.id !== termId),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-900 text-white text-xs font-semibold shadow-2xl border border-gray-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Toolbar */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-gray-200 shadow-xs' : 'bg-gray-900 border-gray-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Board Selector Tabs & Quick Open Manager */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {/* Quick Open Saved Boards Button */}
            <button
              onClick={() => setIsSavedBoardsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition cursor-pointer shrink-0 shadow-xs"
              title="Xem danh sách tất cả các bảng giá đã lưu để mở nhanh hoặc quản lý"
            >
              <FolderOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Bảng giá đã lưu</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
                {boards.length}
              </span>
            </button>

            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1 shrink-0" />

            {boards.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBoardId(b.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedBoardId === b.id
                    ? isLight
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : isLight
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{b.title}</span>
              </button>
            ))}

            <button
              onClick={handleCreateNewBoard}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-dashed transition cursor-pointer shrink-0 ${
                isLight ? 'border-gray-300 text-gray-600 hover:bg-gray-50' : 'border-gray-700 text-gray-400 hover:bg-gray-800'
              }`}
              title="Tạo bảng giá cho sản phẩm thiết kế khác"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo mới</span>
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={() => {
                setAiTargetTierId(null);
                setIsAIModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-sm shadow-blue-500/20 transition cursor-pointer shrink-0"
              title="Mở Trợ lý AI viết tính năng cho các gói & điều khoản studio"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Viết Gói & Điều khoản</span>
            </button>
          </div>

          {/* Action buttons: Save, Duplicate, Switch mode & Export Image */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Quick Save Board Button */}
            <button
              onClick={handleSaveCurrentBoard}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 transition cursor-pointer shrink-0"
              title="Lưu lại toàn bộ bảng giá này vào hệ thống và Cloud"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu bảng giá</span>
            </button>

            {/* Duplicate Board Button */}
            <button
              onClick={() => handleDuplicateBoard()}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer shrink-0 ${
                isLight 
                  ? 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100' 
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
              }`}
              title="Tạo bản sao mới từ bảng giá này để chỉnh sửa thành dịch vụ khác"
            >
              <Copy className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Nhân bản</span>
            </button>

            {/* Toggle View / Edit mode */}
            <div className={`flex items-center p-1 rounded-xl border ${
              isLight ? 'bg-gray-100 border-gray-200' : 'bg-gray-800 border-gray-700'
            }`}>
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'preview'
                    ? isLight
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'bg-gray-900 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem & Xuất ảnh</span>
              </button>

              <button
                onClick={() => setViewMode('editor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'editor'
                    ? isLight
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'bg-gray-900 text-blue-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Tùy chỉnh giá & nội dung</span>
              </button>
            </div>

            {/* Copy image button */}
            <button
              onClick={handleCopyImageToClipboard}
              disabled={isExporting}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isLight
                  ? 'bg-gray-50 border-gray-300 text-gray-800 hover:bg-gray-100'
                  : 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700'
              }`}
              title="Sao chép ảnh vào clipboard để dán trực tiếp vào Zalo/Messenger"
            >
              <Copy className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Sao chép ảnh</span>
            </button>

            {/* Xuất link khách xem trực tiếp (/tenkhachhang) */}
            <button
              onClick={() => setIsClientShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 transition cursor-pointer shrink-0"
              title="Xuất đường link trực tiếp cho khách xem (/tenkhachhang) tự động cập nhật sản phẩm & số post còn lại"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Xuất link khách xem (/tenkhachhang)</span>
            </button>

            {/* Export PNG button */}
            <button
              onClick={handleExportPng}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Đang tạo ảnh...' : 'Tải ảnh gửi khách'}</span>
            </button>

            {/* Reset Defaults button */}
            <button
              onClick={handleResetToDefaults}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isLight ? 'border-gray-200 text-gray-500 hover:bg-gray-100' : 'border-gray-700 text-gray-400 hover:bg-gray-800'
              }`}
              title="Khôi phục lại các bảng giá mẫu chuẩn ban đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CHẾ ĐỘ BIÊN TẬP / TÙY CHỈNH GIÁ & NỘI DUNG (EDITOR MODE) */}
      {/* ========================================================================= */}
      {viewMode === 'editor' && (
        <div className={`p-5 sm:p-6 rounded-2xl border space-y-6 animate-in fade-in duration-200 ${
          isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'
        }`}>
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                Cài đặt & Tùy biến bảng giá
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Chỉnh sửa tiêu đề, các gói dịch vụ, giá tiền, màu sắc và điều khoản kèm theo.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Save changes button */}
              <button
                onClick={handleSaveCurrentBoard}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 transition cursor-pointer"
                title="Lưu lại toàn bộ nội dung vừa sửa vào hệ thống và Cloud"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu thay đổi</span>
              </button>

              {/* Duplicate button */}
              <button
                onClick={() => handleDuplicateBoard()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  isLight 
                    ? 'bg-gray-50 hover:bg-gray-100 border-gray-300 text-gray-700' 
                    : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300'
                }`}
                title="Tạo bản sao mới của bảng giá này"
              >
                <Copy className="w-3.5 h-3.5 text-blue-500" />
                <span>Nhân bản</span>
              </button>

              {/* Delete Board Button */}
              {boards.length > 1 && (
                <button
                  onClick={() => {
                    if (window.confirm(`Bạn có chắc muốn xóa bảng giá "${activeBoard.title}" không?`)) {
                      onDeleteBoard(activeBoard.id);
                      setSelectedBoardId(boards.find((b) => b.id !== activeBoard.id)?.id || '');
                      setViewMode('preview');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa bảng giá</span>
                </button>
              )}

              <button
                onClick={() => setViewMode('preview')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Hoàn tất & Xem ảnh</span>
              </button>
            </div>
          </div>

          {/* Form Settings Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Tiêu đề chính bảng giá (Tên sản phẩm / Dịch vụ):
              </label>
              <input
                type="text"
                value={activeBoard.title}
                onChange={(e) => updateActiveBoard((p) => ({ ...p, title: e.target.value }))}
                placeholder="VD: BẢNG GIÁ THIẾT KẾ LOGO, BRANDING KIT COMBO..."
                className={`w-full px-3.5 py-2 rounded-xl text-sm font-bold border transition ${
                  isLight ? 'bg-white border-gray-300 text-gray-900 focus:border-blue-500' : 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Kiểu bố cục trình bày:
              </label>
              <select
                value={activeBoard.layoutType}
                onChange={(e) => updateActiveBoard((p) => ({ ...p, layoutType: e.target.value as PricingLayoutType }))}
                className={`w-full px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                  isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'
                }`}
              >
                <option value="cards">Dạng thẻ cột so sánh các gói (Cards - Logo, Branding Kit)</option>
                <option value="rows">Dạng danh sách dịch vụ lẻ (Rows - Social Media, In ấn)</option>
              </select>
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Phụ đề giới thiệu:
              </label>
              <input
                type="text"
                value={activeBoard.subtitle}
                onChange={(e) => updateActiveBoard((p) => ({ ...p, subtitle: e.target.value }))}
                placeholder="VD: Chọn gói phù hợp với quy mô doanh nghiệp của bạn..."
                className={`w-full px-3.5 py-2 rounded-xl text-xs border transition ${
                  isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'
                }`}
              />
            </div>
          </div>

          {/* TIERS LIST SETTINGS */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Danh sách các gói dịch vụ ({activeBoard.tiers.length} gói)
              </h4>
              <button
                onClick={addTier}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm gói mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeBoard.tiers.map((tier, idx) => (
                <div
                  key={tier.id}
                  className={`p-4 rounded-xl border space-y-3 relative transition ${
                    editingTierId === tier.id
                      ? 'ring-2 ring-blue-500'
                      : isLight
                      ? 'bg-gray-50/70 border-gray-200'
                      : 'bg-gray-800/60 border-gray-700'
                  }`}
                >
                  {/* Top header of tier card editor */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      Cột #{idx + 1}
                    </span>

                    <button
                      onClick={() => removeTier(tier.id)}
                      className="text-gray-400 hover:text-rose-500 transition p-1"
                      title="Xóa gói này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Tier Name & Price */}
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Tên gói:</label>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) =>
                          updateActiveBoard((prev) => ({
                            ...prev,
                            tiers: prev.tiers.map((t) => (t.id === tier.id ? { ...t, name: e.target.value } : t)),
                          }))
                        }
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold border ${
                          isLight ? 'bg-white border-gray-300' : 'bg-gray-700 border-gray-600 text-white'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Mức giá:</label>
                      <input
                        type="text"
                        value={tier.price}
                        onChange={(e) =>
                          updateActiveBoard((prev) => ({
                            ...prev,
                            tiers: prev.tiers.map((t) => (t.id === tier.id ? { ...t, price: e.target.value } : t)),
                          }))
                        }
                        placeholder="VD: 700.000 VNĐ, 200.000 VNĐ / Post"
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 border ${
                          isLight ? 'bg-white border-gray-300' : 'bg-gray-700 border-gray-600 text-blue-400'
                        }`}
                      />
                    </div>

                    {/* Subtitle / Description */}
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Mô tả / Phụ đề ngắn:</label>
                      <input
                        type="text"
                        value={tier.subtitle || tier.description || ''}
                        onChange={(e) =>
                          updateActiveBoard((prev) => ({
                            ...prev,
                            tiers: prev.tiers.map((t) =>
                              t.id === tier.id ? { ...t, subtitle: e.target.value, description: e.target.value } : t
                            ),
                          }))
                        }
                        placeholder="VD: Khởi đầu chuyên nghiệp cho shop nhỏ"
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs border ${
                          isLight ? 'bg-white border-gray-300' : 'bg-gray-700 border-gray-600 text-white'
                        }`}
                      />
                    </div>

                    {/* Color Theme & Badge */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500">Màu chủ đạo:</label>
                        <select
                          value={tier.colorTheme}
                          onChange={(e) =>
                            updateActiveBoard((prev) => ({
                              ...prev,
                              tiers: prev.tiers.map((t) =>
                                t.id === tier.id ? { ...t, colorTheme: e.target.value as PricingColorTheme } : t
                              ),
                            }))
                          }
                          className={`w-full px-2 py-1 rounded text-xs border ${
                            isLight ? 'bg-white border-gray-300' : 'bg-gray-700 border-gray-600 text-white'
                          }`}
                        >
                          <option value="green">Xanh lá (Green)</option>
                          <option value="blue">Xanh dương (Blue)</option>
                          <option value="purple">Tím (Purple)</option>
                          <option value="orange">Cam (Orange)</option>
                          <option value="pink">Hồng (Pink)</option>
                          <option value="indigo">Chàm (Indigo)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-gray-500">Biểu tượng (Icon):</label>
                        <select
                          value={tier.iconName || 'sparkles'}
                          onChange={(e) =>
                            updateActiveBoard((prev) => ({
                              ...prev,
                              tiers: prev.tiers.map((t) =>
                                t.id === tier.id ? { ...t, iconName: e.target.value } : t
                              ),
                            }))
                          }
                          className={`w-full px-2 py-1 rounded text-xs border ${
                            isLight ? 'bg-white border-gray-300' : 'bg-gray-700 border-gray-600 text-white'
                          }`}
                        >
                          <option value="zap">Tia sét (Zap)</option>
                          <option value="star">Ngôi sao (Star)</option>
                          <option value="shield">Chiếc khiên (Shield)</option>
                          <option value="crown">Vương miện (Crown)</option>
                          <option value="sparkles">Lấp lánh (Sparkles)</option>
                          <option value="layers">Xếp lớp (Layers)</option>
                          <option value="monitor">Màn hình (Monitor)</option>
                          <option value="palette">Bảng vẽ (Palette)</option>
                        </select>
                      </div>
                    </div>

                    {/* Popular Badge Toggle */}
                    <div className="pt-1 flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={tier.isPopular || false}
                          onChange={(e) =>
                            updateActiveBoard((prev) => ({
                              ...prev,
                              tiers: prev.tiers.map((t) =>
                                t.id === tier.id
                                  ? {
                                      ...t,
                                      isPopular: e.target.checked,
                                      popularBadgeText: t.popularBadgeText || 'KHUYÊN DÙNG',
                                    }
                                  : t
                              ),
                            }))
                          }
                          className="rounded text-blue-600"
                        />
                        <span>Badge nổi bật</span>
                      </label>

                      {tier.isPopular && (
                        <input
                          type="text"
                          value={tier.popularBadgeText || 'KHUYÊN DÙNG'}
                          onChange={(e) =>
                            updateActiveBoard((prev) => ({
                              ...prev,
                              tiers: prev.tiers.map((t) =>
                                t.id === tier.id ? { ...t, popularBadgeText: e.target.value } : t
                              ),
                            }))
                          }
                          className={`w-28 px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${
                            isLight ? 'bg-white border-blue-300 text-blue-600' : 'bg-gray-700 border-blue-500 text-blue-300'
                          }`}
                          placeholder="KHUYÊN DÙNG"
                        />
                      )}
                    </div>
                  </div>

                  {/* Feature Checklist of this tier */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase text-gray-500">
                        Tính năng & Quyền lợi:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAiTargetTierId(tier.id);
                          setIsAIModalOpen(true);
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition cursor-pointer"
                        title="Dùng AI gợi ý thêm tính năng/quyền lợi cho gói này"
                      >
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        <span>AI Gợi ý</span>
                      </button>
                    </div>

                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {tier.features.map((feat) => (
                        <div
                          key={feat.id}
                          className={`flex items-center gap-1.5 p-1 rounded-lg border transition ${
                            isLight
                              ? 'bg-white border-gray-200 hover:border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20'
                              : 'bg-gray-700/80 border-gray-600 hover:border-gray-500 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/20'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleFeatureIncluded(tier.id, feat.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition cursor-pointer shrink-0 rounded"
                            title={feat.included ? 'Đang BẬT (Bấm để gạch bỏ tiêu chí này)' : 'Đang TẮT (Bấm để bật lại)'}
                          >
                            {feat.included ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            )}
                          </button>

                          <input
                            type="text"
                            value={feat.text}
                            onChange={(e) => updateFeatureText(tier.id, feat.id, e.target.value)}
                            className={`flex-1 min-w-0 bg-transparent px-1 py-0.5 text-xs outline-none ${
                              feat.included
                                ? isLight ? 'text-gray-800 font-medium' : 'text-gray-100 font-medium'
                                : 'text-gray-400 line-through'
                            }`}
                            placeholder="Nhập nội dung tiêu chí..."
                          />

                          <button
                            type="button"
                            onClick={() => removeFeatureFromTier(tier.id, feat.id)}
                            className="text-gray-400 hover:text-rose-500 p-1 transition cursor-pointer shrink-0 rounded"
                            title="Xóa tiêu chí này"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add new feature input */}
                    <div className="flex items-center gap-1 pt-1">
                      <input
                        type="text"
                        value={newFeatureText[tier.id] || ''}
                        onChange={(e) =>
                          setNewFeatureText((prev) => ({ ...prev, [tier.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addFeatureToTier(tier.id);
                          }
                        }}
                        placeholder="Thêm tiêu chí (VD: 4 Option, File AI...)"
                        className={`flex-1 px-2.5 py-1 rounded text-xs border ${
                          isLight ? 'bg-white border-gray-300' : 'bg-gray-700 border-gray-600 text-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => addFeatureToTier(tier.id)}
                        className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                        title="Thêm tiêu chí"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TERMS & POLICIES SETTINGS */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Điều khoản, quy trình & cam kết ({activeBoard.terms.length} mục)
                </h4>
                <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeBoard.showTerms}
                    onChange={(e) => updateActiveBoard((p) => ({ ...p, showTerms: e.target.checked }))}
                    className="rounded text-blue-600"
                  />
                  <span>Hiển thị điều khoản trên ảnh</span>
                </label>
              </div>

              {activeBoard.showTerms && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAiTargetTierId(null);
                      setIsAIModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                    title="Dùng AI soạn các điều khoản hợp tác chuẩn studio"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>AI Soạn điều khoản</span>
                  </button>

                  <button
                    onClick={addTerm}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm điều khoản</span>
                  </button>
                </div>
              )}
            </div>

            {activeBoard.showTerms && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeBoard.terms.map((term, tIdx) => (
                  <div
                    key={term.id}
                    className={`p-3.5 rounded-xl border space-y-2 ${
                      isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/60 border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={term.title}
                        onChange={(e) =>
                          updateActiveBoard((prev) => ({
                            ...prev,
                            terms: prev.terms.map((t) =>
                              t.id === term.id ? { ...t, title: e.target.value } : t
                            ),
                          }))
                        }
                        placeholder="Tiêu đề (VD: Quy trình tạm ứng, File bàn giao...)"
                        className={`flex-1 px-2 py-1 rounded text-xs font-bold border ${
                          isLight ? 'bg-white border-gray-300' : 'bg-gray-700 border-gray-600 text-white'
                        }`}
                      />
                      <button
                        onClick={() => removeTerm(term.id)}
                        className="text-gray-400 hover:text-rose-500 p-1"
                        title="Xóa điều khoản này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={term.content}
                      onChange={(e) =>
                        updateActiveBoard((prev) => ({
                          ...prev,
                          terms: prev.terms.map((t) =>
                            t.id === term.id ? { ...t, content: e.target.value } : t
                          ),
                        }))
                      }
                      placeholder="Nội dung điều khoản chi tiết..."
                      className={`w-full px-2.5 py-1.5 rounded text-xs border ${
                        isLight ? 'bg-white border-gray-300' : 'bg-gray-700 border-gray-600 text-white'
                      }`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STUDIO FOOTER SETTINGS */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeBoard.showContactFooter}
                  onChange={(e) => updateActiveBoard((p) => ({ ...p, showContactFooter: e.target.checked }))}
                  className="rounded text-blue-600"
                />
                <span>Hiển thị thông tin liên hệ & bản quyền Studio ở chân trang</span>
              </label>
            </div>

            {activeBoard.showContactFooter && (
              <input
                type="text"
                value={activeBoard.contactNote || ''}
                onChange={(e) => updateActiveBoard((p) => ({ ...p, contactNote: e.target.value }))}
                placeholder="VD: Hủ Design Studio • Hotline/Zalo: 0987.654.321 • Email: contact@hudesign.vn"
                className={`w-full px-3.5 py-2 rounded-xl text-xs border ${
                  isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'
                }`}
              />
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CHẾ ĐỘ XEM TRƯỚC & KHU VỰC CHỤP XUẤT ẢNH (CANVAS PRINT TARGET) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {/* Export Hint Banner */}
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs border ${
          isLight ? 'bg-blue-50/70 border-blue-200 text-blue-900' : 'bg-blue-950/30 border-blue-800/40 text-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Khung bên dưới được render chuẩn kích thước đồ họa. Khi bấm <strong>"Tải ảnh gửi khách"</strong> hoặc <strong>"Sao chép ảnh"</strong>, ảnh PNG 2.5K sẽ được lưu nguyên vẹn sắc nét.
            </span>
          </div>

          <button
            onClick={() => setViewMode('editor')}
            className="hidden sm:inline-flex items-center gap-1 font-bold text-blue-700 dark:text-blue-300 hover:underline cursor-pointer ml-4 whitespace-nowrap"
          >
            <span>Chỉnh sửa thông tin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ===================================================================== */}
        {/* KHỐI DOM SẼ ĐƯỢC CHỤP HÌNH BẰNG HTML-TO-IMAGE */}
        {/* ===================================================================== */}
        <div className="overflow-x-auto pb-4">
          <div
            ref={captureRef}
            id="pricing-board-capture-area"
            style={{ width: '100%', minWidth: '920px', maxWidth: '1280px', margin: '0 auto' }}
            className="bg-white text-gray-900 p-8 sm:p-12 rounded-3xl shadow-2xl border border-gray-200 font-sans relative overflow-hidden"
          >
            {/* Elegant Background Accents */}
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-50/60 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-50/60 rounded-full blur-3xl pointer-events-none" />

            {/* Logo Hủ Design góc trái nhỏ gọn */}
            <div className="absolute top-6 left-6 sm:top-8 sm:left-10 z-20 flex items-center gap-2">
              <img
                src="https://res.cloudinary.com/dcwgy4tnb/image/upload/v1770527011/hudesign-logo_uprmzz.png"
                alt="Hủ Design"
                className="h-7 sm:h-8 w-auto object-contain"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Header: Title & Subtitle */}
            <div className="text-center space-y-2 mb-10 relative z-10 pt-2 sm:pt-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-gray-950 uppercase">
                {activeBoard.title}
              </h1>
              {activeBoard.subtitle && (
                <p className="text-sm sm:text-base text-gray-500 font-medium max-w-2xl mx-auto">
                  {activeBoard.subtitle}
                </p>
              )}
              <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mt-3" />
            </div>

            {/* =============================================================== */}
            {/* LAYOUT KIỂU 1: DẠNG THẺ CỘT SO SÁNH (PRICING TIERS CARDS) */}
            {/* =============================================================== */}
            {activeBoard.layoutType === 'cards' && (
              <div className={`grid gap-5 items-stretch relative z-10 ${
                activeBoard.tiers.length === 2
                  ? 'grid-cols-2 max-w-3xl mx-auto'
                  : activeBoard.tiers.length === 3
                  ? 'grid-cols-3'
                  : 'grid-cols-4'
              }`}>
                {activeBoard.tiers.map((tier) => {
                  const style = getThemeStyles(tier.colorTheme, tier.isPopular);

                  return (
                    <div
                      key={tier.id}
                      className={`relative flex flex-col justify-between bg-white rounded-2xl border-2 transition-all p-5 sm:p-6 shadow-sm ${style.cardBorder} ${
                        tier.isPopular ? 'scale-[1.02] shadow-xl z-20' : 'hover:shadow-md'
                      }`}
                    >
                      {/* Popular Badge */}
                      {tier.isPopular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30">
                          <span className={`px-3.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase shadow-md ${style.badgeBg}`}>
                            {tier.popularBadgeText || 'KHUYÊN DÙNG'}
                          </span>
                        </div>
                      )}

                      {/* Card Header */}
                      <div className="text-center pb-5 border-b border-gray-100 space-y-3">
                        {/* Icon Circle */}
                        <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${style.iconBg}`}>
                          {renderTierIcon(tier.iconName, 'w-6 h-6')}
                        </div>

                        {/* Tier Name & Description / Subtitle */}
                        <div>
                          <h3 className={`text-sm sm:text-base font-extrabold uppercase tracking-wide ${style.priceColor}`}>
                            {tier.name}
                          </h3>
                          {tier.subtitle && (
                            <p className="text-[11px] sm:text-xs text-gray-500 mt-1 leading-relaxed break-words">
                              {tier.subtitle}
                            </p>
                          )}
                        </div>

                        {/* Price Display */}
                        <div className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${style.priceColor}`}>
                          {tier.price}
                        </div>
                      </div>

                      {/* Features List */}
                      <div className="pt-5 pb-2 space-y-2.5 flex-1">
                        {tier.features.map((feat) => (
                          <div
                            key={feat.id}
                            className={`flex items-start gap-2 text-xs ${
                              feat.included ? 'text-gray-700' : 'text-gray-300'
                            }`}
                          >
                            <span className="shrink-0 mt-0.5">
                              {feat.included ? (
                                <Check className={`w-3.5 h-3.5 ${style.checkColor}`} />
                              ) : (
                                <X className="w-3.5 h-3.5 text-gray-300" />
                              )}
                            </span>
                            <span className={`leading-relaxed ${!feat.included ? 'opacity-80' : 'font-medium'}`}>
                              {feat.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* =============================================================== */}
            {/* LAYOUT KIỂU 2: DẠNG DANH SÁCH DỊCH VỤ LẺ (PRICING SERVICE ROWS) */}
            {/* =============================================================== */}
            {activeBoard.layoutType === 'rows' && (
              <div className="space-y-3.5 max-w-4xl mx-auto relative z-10">
                {activeBoard.tiers.map((item) => {
                  const style = getThemeStyles(item.colorTheme, item.isPopular);

                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white border border-gray-200/90 hover:border-blue-400 transition-all shadow-xs gap-4 relative overflow-hidden ${
                        item.isPopular ? 'ring-2 ring-purple-500/30' : ''
                      }`}
                    >
                      {item.isPopular && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700">
                          {item.popularBadgeText || 'HOT'}
                        </span>
                      )}

                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
                          {renderTierIcon(item.iconName, 'w-6 h-6')}
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-gray-950">
                            {item.name}
                          </h3>
                          {(item.description || item.subtitle) && (
                            <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
                              {item.description || item.subtitle}
                            </p>
                          )}

                          {/* Mini features */}
                          {item.features && item.features.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 pt-1.5">
                              {item.features.map((f) => (
                                <span
                                  key={f.id}
                                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium"
                                >
                                  <Check className="w-3 h-3 text-blue-600" />
                                  <span>{f.text}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price on right side */}
                      <div className="sm:text-right shrink-0">
                        <span className="text-lg sm:text-xl font-black font-mono text-purple-700 tracking-tight block">
                          {item.price}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-400 block mt-0.5 uppercase tracking-wider">
                          Đã bao gồm file bàn giao
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* =============================================================== */}
            {/* ĐIỀU KHOẢN & YÊU CẦU THỰC HIỆN (TERMS & POLICIES) */}
            {/* =============================================================== */}
            {activeBoard.showTerms && activeBoard.terms && activeBoard.terms.length > 0 && (
              <div className="mt-10 pt-6 border-t border-gray-200 relative z-10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Quy trình thực hiện & Điều khoản hợp tác</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {activeBoard.terms.map((term, tIndex) => (
                    <div
                      key={term.id}
                      className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1 text-left"
                    >
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[10px] flex items-center justify-center font-mono">
                          {tIndex + 1}
                        </span>
                        <span>{term.title}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        {term.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* CHÂN TRANG & THÔNG TIN STUDIO (FOOTER CONTACT) */}
            {/* =============================================================== */}
            {activeBoard.showContactFooter && (
              <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-3 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="font-black text-gray-900 tracking-wider">
                    {((activeBoard.watermarkText || studioProfile.studioName || 'HỦ DESIGN').replace(/\s*STUDIO\s*/gi, '')).trim() || 'HỦ DESIGN'}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-[11px] text-gray-500">Thiết kế nhận diện & Quảng cáo</span>
                </div>

                <div className="flex items-center gap-4 text-[11px] font-semibold text-gray-600">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-blue-600" />
                    {studioProfile.phone && studioProfile.phone !== '0988 123 456' ? studioProfile.phone : '0912 412 132'}
                  </span>
                  {studioProfile.email && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-blue-600" />
                      {studioProfile.email}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Assistant Modal */}
      <AIPricingModal
        isOpen={isAIModalOpen}
        onClose={() => {
          setIsAIModalOpen(false);
          setAiTargetTierId(null);
        }}
        activeBoard={activeBoard}
        onApplyFeaturesToTier={handleApplyAIFeaturesToTier}
        onApplyTerms={handleApplyAITerms}
        onApplyFullBoard={handleApplyAIFullBoard}
        theme={theme}
        targetTierId={aiTargetTierId}
      />

      {/* ========================================================================= */}
      {/* MODAL: QUẢN LÝ & MỞ NHANH BẢNG GIÁ ĐÃ LƯU (SAVED BOARDS MANAGER) */}
      {/* ========================================================================= */}
      {isSavedBoardsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${
              isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800 text-white'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-gray-950 dark:text-white">
                      Kho Bảng Giá Dịch Vụ Đã Lưu
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                      {boards.length} bảng giá
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Mở nhanh để xuất ảnh gửi khách hoặc chỉnh sửa lại theo từng chiến dịch
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSavedBoardsModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar & Actions */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/70 dark:bg-gray-800/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchBoardQuery}
                  onChange={(e) => setSearchBoardQuery(e.target.value)}
                  placeholder="Tìm bảng giá theo tên hoặc loại..."
                  className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs outline-none border transition ${
                    isLight
                      ? 'bg-white border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-gray-800'
                      : 'bg-gray-800 border-gray-700 focus:border-blue-400 text-white'
                  }`}
                />
                {searchBoardQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchBoardQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsSavedBoardsModalOpen(false);
                    handleCreateNewBoard();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tạo bảng giá mới</span>
                </button>
              </div>
            </div>

            {/* Modal Content - List of Boards */}
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-190px)] space-y-3">
              {boards
                .filter((b) => {
                  if (!searchBoardQuery.trim()) return true;
                  const q = searchBoardQuery.toLowerCase();
                  return (
                    b.title.toLowerCase().includes(q) ||
                    (b.subtitle && b.subtitle.toLowerCase().includes(q)) ||
                    (b.category && b.category.toLowerCase().includes(q))
                  );
                })
                .map((b) => {
                  const isCurrent = b.id === activeBoard.id;
                  const formattedDate = b.updatedAt
                    ? new Date(b.updatedAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : 'Mặc định';

                  return (
                    <div
                      key={b.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? isLight
                            ? 'bg-blue-50/40 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-blue-950/20 border-blue-600 ring-2 ring-blue-500/20'
                          : isLight
                          ? 'bg-white border-gray-200 hover:border-gray-300'
                          : 'bg-gray-800/60 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Board Info */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white">
                              {b.title}
                            </h3>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white flex items-center gap-1">
                                <CheckCheck className="w-3 h-3" />
                                Đang mở
                              </span>
                            )}
                            {b.category && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                {b.category}
                              </span>
                            )}
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formattedDate}
                            </span>
                          </div>

                          {b.subtitle && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                              {b.subtitle}
                            </p>
                          )}

                          {/* Mini tiers badge summary */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] font-semibold text-gray-400">
                              {b.tiers.length} gói giá:
                            </span>
                            {b.tiers.map((t) => (
                              <span
                                key={t.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                              >
                                <span>{t.name}</span>
                                <span className="text-blue-600 dark:text-blue-400">
                                  ({t.price})
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          {/* Mở & Xuất ảnh */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBoardId(b.id);
                              setViewMode('preview');
                              setIsSavedBoardsModalOpen(false);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer"
                            title="Mở bảng giá này ở chế độ xuất hình ảnh gửi khách"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Mở xem & Gửi ảnh</span>
                          </button>

                          {/* Chỉnh sửa */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBoardId(b.id);
                              setViewMode('editor');
                              setIsSavedBoardsModalOpen(false);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                              isLight
                                ? 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                                : 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200'
                            }`}
                            title="Chỉnh sửa chi tiết tên gói, nội dung, giá tiền"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                            <span>Chỉnh sửa</span>
                          </button>

                          {/* Nhân bản */}
                          <button
                            type="button"
                            onClick={() => handleDuplicateBoard(b)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              isLight
                                ? 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'
                                : 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300'
                            }`}
                            title="Tạo bản sao mới từ bảng giá này"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Xóa */}
                          {boards.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Bạn có chắc chắn muốn xóa bảng giá "${b.title}" không?`
                                  )
                                ) {
                                  onDeleteBoard(b.id);
                                  if (selectedBoardId === b.id) {
                                    setSelectedBoardId(
                                      boards.find((item) => item.id !== b.id)?.id || ''
                                    );
                                  }
                                  showToast(`Đã xóa bảng giá "${b.title}"!`);
                                }
                              }}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              title="Xóa bảng giá này khỏi hệ thống"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {boards.filter((b) => {
                if (!searchBoardQuery.trim()) return true;
                const q = searchBoardQuery.toLowerCase();
                return (
                  b.title.toLowerCase().includes(q) ||
                  (b.subtitle && b.subtitle.toLowerCase().includes(q)) ||
                  (b.category && b.category.toLowerCase().includes(q))
                );
              }).length === 0 && (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <FolderOpen className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
                  <p className="text-xs font-semibold">
                    Không tìm thấy bảng giá nào khớp với từ khóa "{searchBoardQuery}".
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 flex items-center justify-between">
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                💡 Mẹo: Nhân bản bảng giá giúp bạn tạo nhanh phiên bản bảng giá cho các mùa khuyến mãi hoặc dịch vụ khác.
              </span>
              <button
                type="button"
                onClick={() => setIsSavedBoardsModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isLight
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                }`}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xuất Link Khách Xem (/tenkhachhang) */}
      <ClientShareLinkModal
        isOpen={isClientShareModalOpen}
        onClose={() => setIsClientShareModalOpen(false)}
        clients={clients}
        designItems={designItems}
        currentBoardId={selectedBoardId}
        onUpdateClient={onUpdateClient}
        onNavigateToClientPortal={onNavigateToClientPortal}
        isLight={isLight}
      />
    </div>
  );
};
