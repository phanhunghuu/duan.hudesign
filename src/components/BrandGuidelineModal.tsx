import React, { useState, useEffect, useRef } from 'react';
import { BrandProfile, BrandDemoImage } from '../types';
import { 
  X, 
  Palette, 
  Type, 
  FileText, 
  Folder, 
  Check, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  ExternalLink, 
  ShieldCheck, 
  ShieldAlert, 
  Brain, 
  Target, 
  Flame, 
  RotateCcw, 
  Image as ImageIcon, 
  Upload, 
  Layers, 
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { CustomPillarsManager } from './CustomPillarsManager';
import { getBrandPillars } from '../utils/pillarUtils';

interface BrandGuidelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: BrandProfile;
  onSaveBrand: (updatedBrand: BrandProfile) => void;
  onOpenProposal?: () => void;
  isLight: boolean;
}

export const BrandGuidelineModal: React.FC<BrandGuidelineModalProps> = ({
  isOpen,
  onClose,
  brand,
  onSaveBrand,
  onOpenProposal,
  isLight,
}) => {
  const [formData, setFormData] = useState<BrandProfile>({ ...brand });
  const [newDo, setNewDo] = useState('');
  const [newDont, setNewDont] = useState('');
  const [isAnalyzingStrategy, setIsAnalyzingStrategy] = useState(false);
  const [strategyStatus, setStrategyStatus] = useState<string | null>(null);

  // Demo image form state inside modal
  const [demoImageUrl, setDemoImageUrl] = useState('');
  const [demoImageTitle, setDemoImageTitle] = useState('');
  const [demoImageType, setDemoImageType] = useState<BrandDemoImage['type']>('single_post');
  const [demoImageAspect, setDemoImageAspect] = useState<BrandDemoImage['aspectRatio']>('1:1');
  const [demoImageCaption, setDemoImageCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...brand });
    }
  }, [brand, isOpen]);

  const handleRunStrategyAnalysis = async () => {
    setIsAnalyzingStrategy(true);
    setStrategyStatus(null);
    try {
      const response = await fetch('/api/analyze-brand-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: formData }),
      });
      const data = await response.json();
      if (data.success && data.strategy) {
        setFormData((prev) => ({
          ...prev,
          brandStrategy: data.strategy,
        }));
        setStrategyStatus('Đã phân tích và cập nhật Bản đồ Chiến lược thành công!');
      }
    } catch (e) {
      console.error(e);
      setStrategyStatus('Lỗi phân tích chiến lược');
    } finally {
      setIsAnalyzingStrategy(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBrand({
      ...formData,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  const handleAddDo = () => {
    if (!newDo.trim()) return;
    setFormData((prev) => ({
      ...prev,
      dos: [...prev.dos, newDo.trim()],
    }));
    setNewDo('');
  };

  const handleRemoveDo = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      dos: prev.dos.filter((_, i) => i !== index),
    }));
  };

  const handleAddDont = () => {
    if (!newDont.trim()) return;
    setFormData((prev) => ({
      ...prev,
      donts: [...prev.donts, newDont.trim()],
    }));
    setNewDont('');
  };

  const handleRemoveDont = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      donts: prev.donts.filter((_, i) => i !== index),
    }));
  };

  // Upload file ảnh demo từ máy tính (Base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh dưới 4MB để đảm bảo hiệu năng tối ưu.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (base64) {
        setDemoImageUrl(base64);
        if (!demoImageTitle) {
          setDemoImageTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddDemoImage = () => {
    if (!demoImageUrl.trim()) {
      alert('Vui lòng chọn ảnh từ máy hoặc dán link ảnh!');
      return;
    }
    const newImage: BrandDemoImage = {
      id: `demo_${Date.now()}`,
      title: demoImageTitle.trim() || 'Ấn phẩm thiết kế demo',
      type: demoImageType,
      aspectRatio: demoImageAspect,
      imageUrl: demoImageUrl.trim(),
      caption: demoImageCaption.trim() || undefined,
    };
    setFormData((prev) => ({
      ...prev,
      demoImages: [...(prev.demoImages || []), newImage],
    }));
    setDemoImageUrl('');
    setDemoImageTitle('');
    setDemoImageCaption('');
  };

  const handleRemoveDemoImage = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      demoImages: (prev.demoImages || []).filter((img) => img.id !== id),
    }));
  };

  const handleSaveAndOpenProposal = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...formData,
      updatedAt: new Date().toISOString(),
    };
    onSaveBrand(updated);
    onClose();
    if (onOpenProposal) {
      onOpenProposal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print overflow-y-auto">
      <div className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border ${
        isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#181F2E] border-gray-800 text-gray-100'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isLight ? 'border-gray-200 bg-gray-50/70' : 'border-gray-800 bg-gray-900/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Quy Chuẩn Thương Hiệu: {brand.name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Lưu trữ quy chuẩn màu sắc, font chữ, phong cách thiết kế & văn phong viết bài
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Tên thương hiệu *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                  isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Tên Fanpage Facebook / Kênh đăng
              </label>
              <input
                type="text"
                value={formData.fanpageName}
                onChange={(e) => setFormData({ ...formData, fanpageName: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                  isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Lĩnh vực / Ngành hàng
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                  isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Link Drive chứa tài nguyên ảnh/video
              </label>
              <input
                type="url"
                value={formData.driveFolderUrl || ''}
                placeholder="https://drive.google.com/..."
                onChange={(e) => setFormData({ ...formData, driveFolderUrl: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                  isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                }`}
              />
            </div>
          </div>

          {/* Mô tả hoạt động kinh doanh cho AI */}
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Mô tả hoạt động kinh doanh & Sản phẩm cốt lõi (Để AI hiểu sâu & lập kế hoạch chuẩn) *
              </label>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Cốt lõi cho AI Content</span>
            </div>
            <textarea
              rows={3}
              placeholder="VD: Quán cà phê đặc sản phong cách Vintage tại Sài Gòn. Chuyên cà phê Pour-Over hạt Arabica Cầu Đất, Cold Brew ủ lạnh 24h đóng chai giao tận nơi. Tệp khách là dân văn phòng, người yêu thích không gian yên tĩnh làm việc. Điểm mạnh là hạt rang mộc mỗi tuần..."
              value={formData.businessDescription || ''}
              onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
              className={`w-full px-3.5 py-2 rounded-lg text-sm leading-relaxed border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                isLight ? 'bg-white border-blue-300 text-gray-900' : 'bg-gray-900 border-blue-800 text-gray-100'
              }`}
            />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              💡 Đoạn mô tả này giúp AI hiểu rõ thương hiệu bán gì, phục vụ ai để tự động phân bổ ngày đăng và sáng tạo kịch bản/brief thiết kế chuẩn xác nhất.
            </p>
          </div>

          {/* Bản đồ Chiến lược Thương hiệu Chuyên sâu */}
          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                  Bản Đồ Chiến Lược & Định Vị Cốt Lõi (Brand Strategy Map)
                </h3>
              </div>
              <button
                type="button"
                disabled={isAnalyzingStrategy}
                onClick={handleRunStrategyAnalysis}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-3 h-3 ${isAnalyzingStrategy ? 'animate-spin' : ''}`} />
                <span>{isAnalyzingStrategy ? 'Đang Chẩn Đoán AI...' : 'Chẩn Đoán Chiến Lược AI'}</span>
              </button>
            </div>

            {strategyStatus && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ {strategyStatus}
              </p>
            )}

            {formData.brandStrategy ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1">
                  <div className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Chân dung Khách hàng:
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                    {formData.brandStrategy.targetAudience}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Lợi Thế Cốt Lõi (Core USP):
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                    {formData.brandStrategy.coreUSP}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1">
                  <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    Nỗi đau thầm kín (Pain Points):
                  </div>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    {formData.brandStrategy.customerPainPoints?.slice(0, 3).map((p, idx) => (
                      <li key={idx} className="line-clamp-1">• {p}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1">
                  <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    Rào cản khi mua:
                  </div>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    {formData.brandStrategy.buyingObjections?.slice(0, 3).map((o, idx) => (
                      <li key={idx} className="line-clamp-1">• {o}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">
                Chưa có Bản đồ Chiến lược. Nhấn nút "Chẩn Đoán Chiến Lược AI" để phân tích chuyên sâu khách hàng mục tiêu, nỗi đau và lợi thế cạnh tranh của {formData.name}.
              </p>
            )}
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Link ảnh Logo thương hiệu (URL)
            </label>
            <div className="flex gap-3 items-center">
              {formData.logoUrl && (
                <div className="w-12 h-12 rounded-lg border p-1 bg-white flex items-center justify-center shrink-0">
                  <img src={formData.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <input
                type="text"
                value={formData.logoUrl || ''}
                placeholder="https://images.unsplash.com/... hoặc link logo PNG"
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className={`flex-1 px-3.5 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                  isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                }`}
              />
            </div>
          </div>

          {/* Quy chuẩn Màu sắc thương hiệu */}
          <div className="p-4 rounded-xl border bg-gray-50/50 dark:bg-gray-900/30 dark:border-gray-800 space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold">Hệ thống Màu sắc nhận diện (Brand Colors)</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Màu chính (Primary)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.colors.primary}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, primary: e.target.value }
                    })}
                    className="w-9 h-9 rounded-lg border cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={formData.colors.primary}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, primary: e.target.value }
                    })}
                    className={`w-full px-2 py-1.5 rounded-md text-xs font-mono border ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Màu phụ (Secondary)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.colors.secondary}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, secondary: e.target.value }
                    })}
                    className="w-9 h-9 rounded-lg border cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={formData.colors.secondary}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, secondary: e.target.value }
                    })}
                    className={`w-full px-2 py-1.5 rounded-md text-xs font-mono border ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Màu điểm nhấn (Accent)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.colors.accent || '#F59E0B'}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, accent: e.target.value }
                    })}
                    className="w-9 h-9 rounded-lg border cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={formData.colors.accent || '#F59E0B'}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, accent: e.target.value }
                    })}
                    className={`w-full px-2 py-1.5 rounded-md text-xs font-mono border ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Nền chuẩn (Background)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.colors.background || '#FFFFFF'}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, background: e.target.value }
                    })}
                    className="w-9 h-9 rounded-lg border cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={formData.colors.background || '#FFFFFF'}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, background: e.target.value }
                    })}
                    className={`w-full px-2 py-1.5 rounded-md text-xs font-mono border ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quy chuẩn Font chữ */}
          <div className="p-4 rounded-xl border bg-gray-50/50 dark:bg-gray-900/30 dark:border-gray-800 space-y-3">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold">Hệ thống Font chữ quy chuẩn (Typography)</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Font tiêu đề chính (Headline / Banner)
                </label>
                <input
                  type="text"
                  value={formData.fonts.headingFont}
                  placeholder="VD: Playfair Display / SVN-Futura / Montserrat Bold"
                  onChange={(e) => setFormData({
                    ...formData,
                    fonts: { ...formData.fonts, headingFont: e.target.value }
                  })}
                  className={`w-full px-3.5 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                  }`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Font nội dung (Body / Phụ đề)
                </label>
                <input
                  type="text"
                  value={formData.fonts.primaryFont}
                  placeholder="VD: Be Vietnam Pro / Plus Jakarta Sans / Roboto"
                  onChange={(e) => setFormData({
                    ...formData,
                    fonts: { ...formData.fonts, primaryFont: e.target.value }
                  })}
                  className={`w-full px-3.5 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                  }`}
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Ghi chú về phân cấp font chữ & cách dùng
              </label>
              <input
                type="text"
                value={formData.fonts.fontNotes || ''}
                placeholder="VD: Tiêu đề in hoa đậm nét, phần phụ đề viết thường lùi nhẹ..."
                onChange={(e) => setFormData({
                  ...formData,
                  fonts: { ...formData.fonts, fontNotes: e.target.value }
                })}
                className={`w-full px-3.5 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                  isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                }`}
              />
            </div>
          </div>

          {/* Phong cách thiết kế & Giọng điệu văn phong */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Phong cách thiết kế hình ảnh (Design Style)
              </label>
              <textarea
                rows={3}
                value={formData.designStyle}
                placeholder="VD: Minimalist hiện đại, tone màu ấm, nhiều khoảng thở, ảnh chụp có hạt grain nhẹ..."
                onChange={(e) => setFormData({ ...formData, designStyle: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                  isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Giọng văn & Cách xưng hô (Tone & Voice)
              </label>
              <textarea
                rows={3}
                value={formData.toneOfVoice}
                placeholder="VD: Chân thành, ấm áp, sâu lắng. Xưng 'Nhà...' và gọi khách là 'Bạn' hoặc 'Bạn thương'..."
                onChange={(e) => setFormData({ ...formData, toneOfVoice: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                  isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                }`}
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* HỆ THỐNG TRỤ CỘT NỘI DUNG (CONTENT PILLARS) TÙY CHỈNH CỦA BRAND */}
          {/* ========================================================================= */}
          <div className={`p-5 rounded-2xl border ${
            isLight ? 'bg-indigo-50/30 border-indigo-100' : 'bg-indigo-950/20 border-indigo-900/40'
          }`}>
            <CustomPillarsManager
              brand={formData}
              onUpdatePillars={(updatedPillars) => {
                setFormData((prev) => ({
                  ...prev,
                  customPillars: updatedPillars,
                }));
              }}
              isLight={isLight}
            />
          </div>

          {/* Những điều NÊN LÀM & CẤM KỴ (Dos & Don'ts) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* DOS */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">NÊN LÀM (Do's)</h4>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDo}
                  placeholder="Thêm quy tắc nên làm..."
                  onChange={(e) => setNewDo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDo())}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs border ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddDo}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Thêm
                </button>
              </div>
              <ul className="space-y-1.5">
                {formData.dos.map((item, idx) => (
                  <li key={idx} className="flex items-start justify-between gap-2 text-xs text-gray-700 dark:text-gray-300">
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDo(idx)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* DON'TS */}
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">CẤM KỴ (Don'ts)</h4>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDont}
                  placeholder="Thêm điều kiêng kỵ..."
                  onChange={(e) => setNewDont(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDont())}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs border ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddDont}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Thêm
                </button>
              </div>
              <ul className="space-y-1.5">
                {formData.donts.map((item, idx) => (
                  <li key={idx} className="flex items-start justify-between gap-2 text-xs text-gray-700 dark:text-gray-300">
                    <div className="flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDont(idx)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PHẦN MỚI: QUY CÁCH THIẾT KẾ CHUNG CHO SOCIAL MEDIA */}
          {/* ========================================================================= */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isLight ? 'bg-indigo-50/40 border-indigo-100' : 'bg-indigo-950/20 border-indigo-900/40'
          }`}>
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
              <Layers className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                QUY CÁCH THIẾT KẾ CHUNG CHO SOCIAL MEDIA
              </h4>
            </div>
            <p className="text-[11px] text-gray-500">
              Định dạng chuẩn để trình bày trong Bản Đề Xuất xuất file PDF gửi khách hàng duyệt
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Khoảng cách an toàn (Safe Zone)
                </label>
                <input
                  type="text"
                  placeholder="VD: Cách đều 4 mép tối thiểu 80px - 100px..."
                  value={formData.socialSpecs?.safeZoneNote || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialSpecs: {
                      ...(formData.socialSpecs || {}),
                      safeZoneNote: e.target.value,
                    }
                  })}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Vị trí đặt Logo thương hiệu
                </label>
                <input
                  type="text"
                  placeholder="VD: Góc trên cùng bên phải, kích thước tối đa 10%..."
                  value={formData.socialSpecs?.logoPlacement || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialSpecs: {
                      ...(formData.socialSpecs || {}),
                      logoPlacement: e.target.value,
                    }
                  })}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Quy tắc Text Overlay trên ảnh
                </label>
                <input
                  type="text"
                  placeholder="VD: Chữ trên ảnh không vượt quá 20% khung hình..."
                  value={formData.socialSpecs?.textOverlayRule || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialSpecs: {
                      ...(formData.socialSpecs || {}),
                      textOverlayRule: e.target.value,
                    }
                  })}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Định hướng hình ảnh chụp / ánh sáng
                </label>
                <input
                  type="text"
                  placeholder="VD: Ánh sáng ấm tự nhiên, chụp cận cảnh, tone nâu ấm..."
                  value={formData.socialSpecs?.imageStyleNote || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialSpecs: {
                      ...(formData.socialSpecs || {}),
                      imageStyleNote: e.target.value,
                    }
                  })}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PHẦN MỚI: BỘ ẢNH THIẾT KẾ DEMO (KEY VISUALS / SHOWCASE) */}
          {/* ========================================================================= */}
          <div className={`p-4 rounded-xl border space-y-4 ${
            isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-900/40 border-gray-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  BỘ ẢNH THIẾT KẾ DEMO ({formData.demoImages?.length || 0})
                </h4>
              </div>
              <span className="text-[11px] text-gray-500">
                Ảnh thiết kế mẫu để gửi khách duyệt phong cách
              </span>
            </div>

            {/* Input thêm ảnh demo: Tải từ máy hoặc dán link */}
            <div className="p-3.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Chọn file từ máy */}
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    1. Tải ảnh từ máy tính:
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:border-indigo-500 cursor-pointer bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 transition"
                  >
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>Chọn file ảnh (.png, .jpg, .webp)</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Hoặc dán link URL */}
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    2. Hoặc Dán URL ảnh:
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... hoặc link trực tiếp"
                    value={demoImageUrl}
                    onChange={(e) => setDemoImageUrl(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-700'
                    }`}
                  />
                </div>
              </div>

              {/* Thông tin ảnh demo */}
              {demoImageUrl && (
                <div className="p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-3">
                  <img
                    src={demoImageUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded object-cover border"
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    <span className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã nạp ảnh thành công
                    </span>
                    <span className="text-[11px] text-gray-500 truncate block">
                      {demoImageUrl.startsWith('data:') ? 'Ảnh tải từ máy (Base64)' : demoImageUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDemoImageUrl('')}
                    className="text-red-500 hover:text-red-700 text-xs p-1"
                  >
                    Xóa
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="sm:col-span-1">
                  <input
                    type="text"
                    placeholder="Tên ấn phẩm (VD: Single Post 1:1)"
                    value={demoImageTitle}
                    onChange={(e) => setDemoImageTitle(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-700'
                    }`}
                  />
                </div>
                <div>
                  <select
                    value={demoImageType}
                    onChange={(e) => {
                      const t = e.target.value as BrandDemoImage['type'];
                      setDemoImageType(t);
                      if (t === 'single_post') setDemoImageAspect('1:1');
                      else if (t === 'vertical_poster') setDemoImageAspect('4:5');
                      else if (t === 'story') setDemoImageAspect('9:16');
                    }}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <option value="single_post">Single Post (Vuông 1:1)</option>
                    <option value="vertical_poster">Poster (Dọc 4:5)</option>
                    <option value="story">Story/Reel (9:16)</option>
                    <option value="carousel">Carousel Album</option>
                    <option value="cover">Ảnh Bìa Cover</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ý đồ thiết kế demo..."
                    value={demoImageCaption}
                    onChange={(e) => setDemoImageCaption(e.target.value)}
                    className={`flex-1 px-3 py-1.5 rounded-lg border text-xs ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-700'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAddDemoImage}
                    disabled={!demoImageUrl.trim()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm
                  </button>
                </div>
              </div>
            </div>

            {/* Danh sách ảnh demo hiện có */}
            {formData.demoImages && formData.demoImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {formData.demoImages.map((item) => (
                  <div key={item.id} className="group relative rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 shadow-2xs">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full aspect-square object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="p-2 text-[11px]">
                      <div className="font-bold text-gray-900 dark:text-white truncate">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase">
                        {item.aspectRatio || '1:1'} • {item.type}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDemoImage(item.id)}
                      className="absolute top-1 right-1 p-1 rounded-md bg-red-600/80 hover:bg-red-700 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      title="Xóa ảnh demo này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic text-center py-2">
                Chưa có ảnh demo nào được thêm. Bạn có thể tải ảnh lên để hiển thị trên bản xuất PDF cho khách.
              </p>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-3">
            <div>
              {onOpenProposal && (
                <button
                  type="button"
                  onClick={handleSaveAndOpenProposal}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-linear-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md flex items-center gap-1.5 transition cursor-pointer"
                  title="Lưu và mở ngay trang xuất bản Đề xuất Brand & Social Media"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Xuất Bản Đề Xuất Cho Khách (PDF)</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Lưu Quy Chuẩn Thương Hiệu
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
