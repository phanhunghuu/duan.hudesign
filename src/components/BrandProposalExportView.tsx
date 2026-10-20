import React, { useState, useRef } from 'react';
import { BrandProfile, StudioProfile, BrandDemoImage } from '../types';
import { exportElementToPdf, printElementCleanly } from '../utils/pdfExport';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  Check, 
  Copy, 
  Edit3, 
  Palette, 
  Type, 
  Sparkles,
  Layout,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  X,
  ExternalLink,
  Upload,
  Plus,
  Trash2,
  Loader2,
  Layers,
  Crop
} from 'lucide-react';

interface BrandProposalExportViewProps {
  brand: BrandProfile;
  studio: StudioProfile;
  onBack: () => void;
  onEditBrand: () => void;
  onUpdateBrand: (updatedBrand: BrandProfile) => void;
  isLight: boolean;
}

export const BrandProposalExportView: React.FC<BrandProposalExportViewProps> = ({
  brand,
  studio,
  onBack,
  onEditBrand,
  onUpdateBrand,
  isLight,
}) => {
  const [copiedToast, setCopiedToast] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  
  // Quick Upload / Add Demo image modal or form
  const [isAddingDemo, setIsAddingDemo] = useState(false);
  const [newDemoUrl, setNewDemoUrl] = useState('');
  const [newDemoTitle, setNewDemoTitle] = useState('');
  const [newDemoType, setNewDemoType] = useState<BrandDemoImage['type']>('single_post');
  const [newDemoAspect, setNewDemoAspect] = useState<BrandDemoImage['aspectRatio']>('1:1');
  const [newDemoCaption, setNewDemoCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentRef = useRef<HTMLDivElement>(null);

  // Convert Hex to RGB helper
  const hexToRgb = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      const r = parseInt(cleanHex[0] + cleanHex[0], 16);
      const g = parseInt(cleanHex[1] + cleanHex[1], 16);
      const b = parseInt(cleanHex[2] + cleanHex[2], 16);
      return `rgb(${r}, ${g}, ${b})`;
    }
    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      return `rgb(${r}, ${g}, ${b})`;
    }
    return 'rgb(0, 0, 0)';
  };

  // Tải trực tiếp file PDF
  const handleDownloadPDF = async () => {
    if (!documentRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    setExportSuccess(false);

    try {
      const sanitizedBrand = (brand.name || 'Thuong_hieu').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `HuDesign_Quy_Chuan_Brand_${sanitizedBrand}.pdf`;

      const success = await exportElementToPdf(documentRef.current, {
        fileName,
        quality: 0.95,
        orientation: 'portrait',
      });

      if (success) {
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Download PDF error:', error);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // In ấn sạch sẽ
  const handlePrint = () => {
    if (!documentRef.current) {
      window.print();
      return;
    }
    printElementCleanly(documentRef.current, `HuDesign - Quy Chuẩn Brand & Social - ${brand.name}`);
  };

  // Sao chép tóm tắt gửi khách
  const handleCopySummary = () => {
    const summary = `🎨 BẢN ĐỀ XUẤT QUY CHUẨN THIẾT KẾ & SOCIAL MEDIA
Thương hiệu: ${brand.name}
Đơn vị thiết kế: Hủ Design Studio

1. BẢNG MÀU CHỦ ĐẠO:
- Màu chính: ${brand.colors.primary} (Màu nhận diện cốt lõi)
- Màu phụ: ${brand.colors.secondary} (Phối hợp thương hiệu)
- Màu nhấn: ${brand.colors.accent || '#D97706'} (Kêu gọi hành động / Khuyến mãi)
- Màu nền: ${brand.colors.background || '#FFFFFF'} (Khoảng thở thoáng đãng)
Tỷ lệ vàng: 60% Nền - 30% Nhận diện - 10% Nhấn

2. TYPOGRAPHY (PHÔNG CHỮ):
- Font Tiêu đề (Heading): ${brand.fonts.headingFont}
- Font Nội dung (Body): ${brand.fonts.primaryFont}

3. QUY CÁCH SOCIAL MEDIA:
- Tỷ lệ chuẩn: Vuông 1:1 (1080x1080px) & Dọc 4:5 (1080x1350px) tối ưu hiển thị Mobile
- Vị trí Logo: Góc trên phải hoặc góc dưới tinh tế, cách lề tối thiểu 80px
- Quy tắc chữ trên ảnh: Dưới 20% diện tích khung hình để tối ưu thuật toán hiển thị Facebook
- Phong cách thiết kế: ${brand.designStyle}

Xem chi tiết đầy đủ trong bản PDF bàn giao chính thức từ Hủ Design!`;

    navigator.clipboard.writeText(summary);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  // Handle local image file upload (Base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (< 4MB recommended for smooth rendering)
    if (file.size > 4 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh dung lượng dưới 4MB để tối ưu xuất file PDF sắc nét.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (base64) {
        setNewDemoUrl(base64);
        if (!newDemoTitle) {
          setNewDemoTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Save new demo image
  const handleSaveDemoImage = () => {
    if (!newDemoUrl.trim()) {
      alert('Vui lòng tải ảnh lên hoặc nhập link ảnh!');
      return;
    }

    const newImage: BrandDemoImage = {
      id: `demo_${Date.now()}`,
      title: newDemoTitle.trim() || 'Ấn phẩm thiết kế demo',
      type: newDemoType,
      aspectRatio: newDemoAspect,
      imageUrl: newDemoUrl.trim(),
      caption: newDemoCaption.trim() || undefined,
    };

    const updatedImages = [...(brand.demoImages || []), newImage];
    const updatedBrand: BrandProfile = {
      ...brand,
      demoImages: updatedImages,
      updatedAt: new Date().toISOString(),
    };

    onUpdateBrand(updatedBrand);

    // Reset form
    setNewDemoUrl('');
    setNewDemoTitle('');
    setNewDemoCaption('');
    setIsAddingDemo(false);
  };

  // Delete a demo image
  const handleDeleteDemoImage = (imageId: string) => {
    if (!confirm('Bạn có chắc muốn xóa ảnh demo này khỏi bản đề xuất?')) return;
    const updatedImages = (brand.demoImages || []).filter(img => img.id !== imageId);
    const updatedBrand: BrandProfile = {
      ...brand,
      demoImages: updatedImages,
      updatedAt: new Date().toISOString(),
    };
    onUpdateBrand(updatedBrand);
  };

  const demoImages = brand.demoImages || [];

  return (
    <div className="space-y-6 pb-20">
      {/* ========================================================================= */}
      {/* TOP TOOLBAR (NO-PRINT) */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#181F2E] border border-gray-200 dark:border-gray-800 shadow-xs no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition cursor-pointer"
            title="Quay lại Kế hoạch tuần"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                Bản Đề Xuất Quy Chuẩn Brand & Social Media
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {brand.name}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Trình bày chuyên nghiệp để gửi khách hàng duyệt màu sắc, phông chữ, quy chuẩn social & ấn phẩm demo
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAddingDemo(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Thêm ảnh thiết kế demo từ máy hoặc chèn link"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Ảnh Demo ({demoImages.length})</span>
          </button>

          <button
            onClick={onEditBrand}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition cursor-pointer"
            title="Chỉnh sửa màu sắc, font, phong cách thiết kế"
          >
            <Edit3 className="w-4 h-4" />
            <span>Chỉnh Sửa Brand</span>
          </button>

          <button
            onClick={handleCopySummary}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition cursor-pointer"
            title="Sao chép tóm tắt quy chuẩn để gửi Zalo / Messenger"
          >
            {copiedToast ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedToast ? 'Đã sao chép!' : 'Copy Tóm Tắt'}</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isExportingPdf}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            title="Tải trực tiếp file .pdf về máy tính hoặc điện thoại"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tạo PDF...</span>
              </>
            ) : exportSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã tải PDF về máy!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Tải File PDF (.pdf)</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2 transition cursor-pointer"
            title="In trực tiếp hoặc Lưu dưới dạng PDF qua trình duyệt"
          >
            <Printer className="w-4 h-4" />
            <span>In Bản Cứng (A4)</span>
          </button>
        </div>
      </div>

      {/* MODAL THÊM ẢNH DEMO NHANH */}
      {isAddingDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print overflow-y-auto">
          <div className="bg-white dark:bg-[#181F2E] rounded-2xl max-w-lg w-full p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                  Thêm Ấn Phẩm Thiết Kế Demo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingDemo(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Option 1: Load ảnh từ máy */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  1. Tải ảnh từ máy tính (Khuyên dùng)
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition bg-gray-50 dark:bg-gray-900/50 hover:bg-indigo-50/30"
                >
                  <Upload className="w-6 h-6 text-indigo-600 mx-auto mb-1.5" />
                  <p className="font-bold text-gray-700 dark:text-gray-300">
                    Bấm để chọn file ảnh thiết kế từ máy
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Hỗ trợ PNG, JPG, WEBP (Khổ 1:1, 4:5 hoặc 9:16)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Option 2: Dán link URL ảnh */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  2. Hoặc Dán Đường Dẫn Ảnh Trực Tiếp (Image URL)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... hoặc link Google Drive ảnh trực tiếp"
                  value={newDemoUrl}
                  onChange={(e) => setNewDemoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              {/* Preview Thumbnail if selected */}
              {newDemoUrl && (
                <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center gap-3">
                  <img
                    src={newDemoUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-lg object-cover border border-gray-300 dark:border-gray-700"
                    referrerPolicy="no-referrer"
                    onError={() => console.warn('Lỗi tải ảnh demo preview')}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ảnh đã sẵn sàng
                    </span>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                      {newDemoUrl.startsWith('data:') ? 'Ảnh tải từ máy (Base64)' : newDemoUrl}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewDemoUrl('')}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Xóa ảnh này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Title & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Tiêu đề ấn phẩm demo
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Single Post Khai Trương"
                    value={newDemoTitle}
                    onChange={(e) => setNewDemoTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Loại ấn phẩm
                  </label>
                  <select
                    value={newDemoType}
                    onChange={(e) => {
                      const t = e.target.value as BrandDemoImage['type'];
                      setNewDemoType(t);
                      if (t === 'single_post') setNewDemoAspect('1:1');
                      else if (t === 'vertical_poster') setNewDemoAspect('4:5');
                      else if (t === 'story') setNewDemoAspect('9:16');
                      else if (t === 'cover') setNewDemoAspect('16:9');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="single_post">Single Post (Vuông 1:1)</option>
                    <option value="vertical_poster">Poster / Feed (Dọc 4:5)</option>
                    <option value="story">Story / Reel (Đứng 9:16)</option>
                    <option value="carousel">Album Carousel</option>
                    <option value="cover">Ảnh Bìa Fanpage (Cover)</option>
                    <option value="other">Ấn phẩm khác</option>
                  </select>
                </div>
              </div>

              {/* Caption / Note */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Mô tả / Ý đồ thiết kế demo (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: Demo bố cục chữ nổi bật, tone màu ấm nâu hạt dẻ theo nhận diện"
                  value={newDemoCaption}
                  onChange={(e) => setNewDemoCaption(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t dark:border-gray-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAddingDemo(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveDemoImage}
                disabled={!newDemoUrl.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Lưu Vào Bản Đề Xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PHÓNG TO ẢNH (LIGHTBOX) */}
      {selectedPreviewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm no-print"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedPreviewImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Đóng xem ảnh"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedPreviewImage}
              alt="Demo Enlarge"
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TỜ IN BẢN ĐỀ XUẤT BRAND & SOCIAL GUIDELINES CHUẨN A4 STUDIO */}
      {/* ========================================================================= */}
      <div 
        ref={documentRef}
        className="printable-plan-document max-w-5xl mx-auto bg-white text-gray-900 rounded-2xl shadow-xl border border-gray-200 p-8 sm:p-12 font-sans relative"
      >
        {/* ==================== 1. COVER / HEADER ==================== */}
        <div className="pb-8 border-b-2 border-gray-900 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            {/* Left: Studio & Project Branding */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-gray-900 text-white">
                  {studio.name || 'HỦ DESIGN STUDIO'}
                </span>
                <span className="text-gray-400 font-bold">•</span>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Brand Proposal & Social Guidelines
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight">
                {brand.name}
              </h1>
              <p className="text-sm font-medium text-gray-600">
                Đề xuất Hệ thống Quy chuẩn Nhận diện Thương hiệu & Định dạng Đồ họa Mạng Xã Hội
              </p>
            </div>

            {/* Right: Client Logo or Brand Badge */}
            <div className="sm:text-right shrink-0">
              {brand.logoUrl ? (
                <div className="inline-block p-2 rounded-xl border border-gray-200 bg-gray-50 shadow-2xs">
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center font-black text-2xl text-white shadow-md"
                  style={{ backgroundColor: brand.colors.primary }}
                >
                  {brand.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Metadata Badges Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-200 text-xs">
            <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <span className="block text-[10px] uppercase font-bold text-gray-400">Lĩnh vực</span>
              <span className="font-bold text-gray-800">{brand.industry || 'Kinh doanh & Dịch vụ'}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <span className="block text-[10px] uppercase font-bold text-gray-400">Kênh triển khai</span>
              <span className="font-bold text-gray-800">{brand.fanpageName || brand.name}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <span className="block text-[10px] uppercase font-bold text-gray-400">Phiên bản đề xuất</span>
              <span className="font-bold text-indigo-700">v1.0 (Official Release)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <span className="block text-[10px] uppercase font-bold text-gray-400">Ngày phát hành</span>
              <span className="font-bold text-gray-800">{new Date().toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>

        {/* ==================== 2. BRAND ESSENCE & STRATEGY ==================== */}
        <div className="py-8 border-b border-gray-200 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-black flex items-center justify-center">
              1
            </span>
            <h2 className="text-lg font-black uppercase tracking-wider text-gray-900">
              Định Vị & Tinh Thần Thương Hiệu (Brand Essence)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
              <div className="font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Phong cách thiết kế chủ đạo (Visual Style)
              </div>
              <p className="text-gray-700 leading-relaxed font-medium">
                {brand.designStyle || 'Hiện đại, tối giản, sang trọng, bố cục thông thoáng và giàu tính nhận diện thị giác.'}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
              <div className="font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                <Type className="w-3.5 h-3.5 text-purple-600" />
                Tone giọng & Phong cách xưng hô (Tone of Voice)
              </div>
              <p className="text-gray-700 leading-relaxed font-medium">
                {brand.toneOfVoice || 'Thân thiện, tin cậy, thấu hiểu, chân thành và tôn trọng trải nghiệm của khách hàng.'}
              </p>
            </div>
          </div>

          {/* Business & Target summary if available */}
          {(brand.businessDescription || brand.brandStrategy) && (
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 text-xs space-y-2">
              <div className="font-bold text-indigo-950 uppercase tracking-wider text-[11px]">
                Tệp Khách Hàng Mục Tiêu & Lợi Thế Cạnh Tranh (USP)
              </div>
              <p className="text-gray-700 leading-relaxed">
                {brand.brandStrategy?.targetAudience || brand.businessDescription}
              </p>
              {brand.brandStrategy?.coreUSP && (
                <div className="pt-2 border-t border-indigo-100/80 font-medium text-indigo-900">
                  ⚡ <strong>Điểm khác biệt độc nhất (Core USP):</strong> {brand.brandStrategy.coreUSP}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ==================== 3. COLOR PALETTE ==================== */}
        <div className="py-8 border-b border-gray-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-black flex items-center justify-center">
                2
              </span>
              <h2 className="text-lg font-black uppercase tracking-wider text-gray-900">
                Hệ Thống Bảng Màu Nhận Diện (Color Palette)
              </h2>
            </div>
            <div className="text-xs font-bold text-gray-500">
              Quy tắc tỷ lệ vàng: 60% Nền • 30% Nhận diện • 10% Nhấn
            </div>
          </div>

          {/* Color Swatch Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Primary Color */}
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-xs">
              <div 
                className="h-24 w-full relative flex items-end p-2.5" 
                style={{ backgroundColor: brand.colors.primary }}
              >
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-black/40 text-white backdrop-blur-xs">
                  Chủ Đạo (Primary)
                </span>
              </div>
              <div className="p-3 space-y-1 text-xs">
                <div className="font-black text-gray-950 uppercase text-sm tracking-wider">
                  {brand.colors.primary}
                </div>
                <div className="text-[11px] text-gray-500 font-mono">
                  {hexToRgb(brand.colors.primary)}
                </div>
                <div className="pt-1.5 text-[11px] font-medium text-gray-600 border-t border-gray-100">
                  Ứng dụng: Logo, tiêu đề chính, khối nhận diện chủ đạo (Tỷ lệ 30%).
                </div>
              </div>
            </div>

            {/* Secondary Color */}
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-xs">
              <div 
                className="h-24 w-full relative flex items-end p-2.5" 
                style={{ backgroundColor: brand.colors.secondary }}
              >
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-black/40 text-white backdrop-blur-xs">
                  Màu Phụ (Secondary)
                </span>
              </div>
              <div className="p-3 space-y-1 text-xs">
                <div className="font-black text-gray-950 uppercase text-sm tracking-wider">
                  {brand.colors.secondary}
                </div>
                <div className="text-[11px] text-gray-500 font-mono">
                  {hexToRgb(brand.colors.secondary)}
                </div>
                <div className="pt-1.5 text-[11px] font-medium text-gray-600 border-t border-gray-100">
                  Ứng dụng: Tiêu đề phụ, viền thẻ card, icon minh họa phụ trợ.
                </div>
              </div>
            </div>

            {/* Accent Color */}
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-xs">
              <div 
                className="h-24 w-full relative flex items-end p-2.5" 
                style={{ backgroundColor: brand.colors.accent || '#D97706' }}
              >
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-black/40 text-white backdrop-blur-xs">
                  Màu Nhấn (Accent)
                </span>
              </div>
              <div className="p-3 space-y-1 text-xs">
                <div className="font-black text-gray-950 uppercase text-sm tracking-wider">
                  {brand.colors.accent || '#D97706'}
                </div>
                <div className="text-[11px] text-gray-500 font-mono">
                  {hexToRgb(brand.colors.accent || '#D97706')}
                </div>
                <div className="pt-1.5 text-[11px] font-medium text-gray-600 border-t border-gray-100">
                  Ứng dụng: Nút CTA, badge khuyến mãi, tag nổi bật (Tỷ lệ 10%).
                </div>
              </div>
            </div>

            {/* Background Color */}
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-xs">
              <div 
                className="h-24 w-full relative flex items-end p-2.5 border-b border-gray-200" 
                style={{ backgroundColor: brand.colors.background || '#FFFFFF' }}
              >
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-gray-900/70 text-white backdrop-blur-xs">
                  Màu Nền (Background)
                </span>
              </div>
              <div className="p-3 space-y-1 text-xs">
                <div className="font-black text-gray-950 uppercase text-sm tracking-wider">
                  {brand.colors.background || '#FFFFFF'}
                </div>
                <div className="text-[11px] text-gray-500 font-mono">
                  {hexToRgb(brand.colors.background || '#FFFFFF')}
                </div>
                <div className="pt-1.5 text-[11px] font-medium text-gray-600 border-t border-gray-100">
                  Ứng dụng: Nền ấn phẩm, không gian thở tạo cảm giác sạch sẽ (Tỷ lệ 60%).
                </div>
              </div>
            </div>
          </div>

          {/* Color Ratio Visual Bar */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
              Tỷ Lệ Phân Bổ Màu Sắc Khuyến Nghị Trên Ấn Phẩm
            </div>
            <div className="h-5 w-full rounded-lg overflow-hidden flex shadow-inner">
              <div 
                className="h-full flex items-center justify-center text-[10px] font-bold text-gray-800 border-r border-black/10" 
                style={{ width: '60%', backgroundColor: brand.colors.background || '#F3F4F6' }}
              >
                60% Nền
              </div>
              <div 
                className="h-full flex items-center justify-center text-[10px] font-bold text-white border-r border-black/10" 
                style={{ width: '30%', backgroundColor: brand.colors.primary }}
              >
                30% Nhận Diện
              </div>
              <div 
                className="h-full flex items-center justify-center text-[10px] font-bold text-white" 
                style={{ width: '10%', backgroundColor: brand.colors.accent || '#D97706' }}
              >
                10%
              </div>
            </div>
          </div>
        </div>

        {/* ==================== 4. TYPOGRAPHY SYSTEM ==================== */}
        <div className="py-8 border-b border-gray-200 space-y-6">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-black flex items-center justify-center">
              3
            </span>
            <h2 className="text-lg font-black uppercase tracking-wider text-gray-900">
              Hệ Thống Phông Chữ Đồ Họa (Typography System)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Heading Font */}
            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                  Phông Tiêu Đề (Heading)
                </span>
                <span className="text-xs text-gray-500 font-mono">Size: 32px - 56px</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-950">
                  {brand.fonts.headingFont || 'Montserrat / Playfair'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Dành cho Giật tít, Tiêu đề chính trên ảnh, Con số ưu đãi
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white border border-gray-200 font-bold text-base text-gray-900 tracking-wide">
                Aa Bb Cc Dd Ee Gg Hh Kk Ll Mm 0123456789
              </div>
              <p className="text-xs text-gray-600 italic">
                "{brand.fonts.fontNotes || 'Tiêu đề in đậm, ngắt dòng xúc tích 3-6 từ, giữ độ tương phản cao so với nền ảnh.'}"
              </p>
            </div>

            {/* Body Font */}
            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
                  Phông Thân Bài (Body & Sub-text)
                </span>
                <span className="text-xs text-gray-500 font-mono">Size: 14px - 20px</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-950">
                  {brand.fonts.primaryFont || 'Be Vietnam Pro / Plus Jakarta'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Dành cho Nội dung giải thích, chú thích ảnh, bảng thông số
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white border border-gray-200 text-sm text-gray-800 leading-relaxed font-sans">
                Thương hiệu uy tín • Giao dịch minh bạch • Trải nghiệm dịch vụ tận tâm và chỉn chu trong từng chi tiết.
              </div>
              <p className="text-xs text-gray-600">
                Độ cao dòng (Line-height) tối ưu 1.5 - 1.6, đảm bảo đọc dễ dàng trên màn hình điện thoại di động.
              </p>
            </div>
          </div>
        </div>

        {/* ==================== 5. SOCIAL MEDIA DESIGN SPECS ==================== */}
        <div className="py-8 border-b border-gray-200 space-y-6">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-black flex items-center justify-center">
              4
            </span>
            <h2 className="text-lg font-black uppercase tracking-wider text-gray-900">
              Quy Cách Thiết Kế Chung Cho Social Media
            </h2>
          </div>

          {/* Kích thước chuẩn các nền tảng */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 space-y-1.5 text-center">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mx-auto font-black text-sm">
                1:1
              </div>
              <div className="font-extrabold text-gray-900">Khổ Vuông (Square)</div>
              <div className="text-gray-500 font-mono text-[11px]">1080 x 1080 px</div>
              <p className="text-[11px] text-gray-600">Bài đơn (Single post), minigame, thông báo ngắn</p>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 space-y-1.5 text-center">
              <div className="w-8 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto font-black text-sm">
                4:5
              </div>
              <div className="font-extrabold text-gray-900">Khổ Dọc (Feed Pro)</div>
              <div className="text-gray-500 font-mono text-[11px]">1080 x 1350 px</div>
              <p className="text-[11px] text-gray-600">Chiếm trọn màn hình điện thoại, tăng tương tác tối đa</p>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 space-y-1.5 text-center">
              <div className="w-6 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mx-auto font-black text-sm">
                9:16
              </div>
              <div className="font-extrabold text-gray-900">Khổ Đứng (Story/Reel)</div>
              <div className="text-gray-500 font-mono text-[11px]">1080 x 1920 px</div>
              <p className="text-[11px] text-gray-600">Story 24h, video dọc Facebook Reels & TikTok</p>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 space-y-1.5 text-center">
              <div className="w-12 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mx-auto font-black text-xs">
                Cover
              </div>
              <div className="font-extrabold text-gray-900">Ảnh Bìa Fanpage</div>
              <div className="text-gray-500 font-mono text-[11px]">820 x 312 px</div>
              <p className="text-[11px] text-gray-600">Vùng an toàn căn giữa tránh bị che trên smartphone</p>
            </div>
          </div>

          {/* 3 Quy tắc thiết kế cốt tử */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <Crop className="w-3.5 h-3.5 text-blue-600" />
                Vùng an toàn (Safe Zone):
              </div>
              <p className="text-gray-700 leading-relaxed">
                Cách đều 4 mép tối thiểu 80px - 100px. Tránh đặt chữ quan trọng tại góc dưới cùng nơi giao diện nút Like/Comment của Facebook che khuất.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                Vị trí đặt Logo:
              </div>
              <p className="text-gray-700 leading-relaxed">
                Ưu tiên góc trên cùng bên phải hoặc góc dưới tinh tế. Giữ khoảng cách thở thông thoáng, kích thước logo không chiếm quá 8 - 12% chiều ngang ảnh.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 space-y-1">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                Quy tắc 20% Chữ (Text Rule):
              </div>
              <p className="text-gray-700 leading-relaxed">
                Tổng diện tích văn bản đè trên ảnh không vượt quá 20% khung hình. Đồ họa ưu tiên hình ảnh sản phẩm/không gian chân thực, cô đọng nội dung.
              </p>
            </div>
          </div>

          {/* Bảng DO'S & DON'TS trực quan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            {/* DO'S */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-800 font-extrabold uppercase tracking-wider text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                NÊN LÀM (Do's)
              </div>
              <ul className="space-y-1.5 text-gray-700">
                {brand.dos && brand.dos.length > 0 ? (
                  brand.dos.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Sử dụng bảng màu chuẩn {brand.colors.primary} và {brand.colors.secondary} để đồng bộ nhận diện.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Giữ khoảng thở thoáng đãng, ánh sáng ảnh tự nhiên, rõ nét.</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* DON'TS */}
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-800 font-extrabold uppercase tracking-wider text-[11px]">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                TUYỆT ĐỐI TRÁNH (Don'ts)
              </div>
              <ul className="space-y-1.5 text-gray-700">
                {brand.donts && brand.donts.length > 0 ? (
                  brand.donts.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>Không kéo méo logo, không đổi màu logo tùy tiện khỏi nhận diện chuẩn.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>Không dùng màu sắc neon chói mắt gây khó chịu cho thị giác người xem.</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* ==================== 6. SHOWCASE DEMO DESIGNS ==================== */}
        <div className="py-8 border-b border-gray-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-black flex items-center justify-center">
                5
              </span>
              <h2 className="text-lg font-black uppercase tracking-wider text-gray-900">
                Bộ Sưu Tập Thiết Kế Demo Thực Tế (Showcase Mockup)
              </h2>
            </div>
            <span className="text-xs font-bold text-gray-500">
              {demoImages.length} ấn phẩm demo đã đính kèm
            </span>
          </div>

          {demoImages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {demoImages.map((img) => (
                <div 
                  key={img.id}
                  className="group rounded-xl border border-gray-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition relative flex flex-col"
                >
                  {/* Image Container with Mockup Border */}
                  <div 
                    className="relative bg-gray-100 cursor-pointer overflow-hidden flex items-center justify-center aspect-square"
                    onClick={() => setSelectedPreviewImage(img.imageUrl)}
                    title="Nhấp để xem phóng to"
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white text-xs font-bold">
                      <Maximize2 className="w-4 h-4" />
                      <span>Xem phóng to</span>
                    </div>

                    {/* Badge Aspect Ratio */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-black/60 text-white backdrop-blur-xs">
                      {img.aspectRatio || '1:1'}
                    </div>

                    {/* Delete button (no-print) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDemoImage(img.id);
                      }}
                      className="no-print absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 hover:bg-red-700 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      title="Xóa ấn phẩm này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Caption & Type */}
                  <div className="p-3 border-t border-gray-100 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs text-gray-900 line-clamp-1">
                        {img.title}
                      </h4>
                      {img.caption && (
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                          {img.caption}
                        </p>
                      )}
                    </div>
                    <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase">
                      <span>{img.type.replace('_', ' ')}</span>
                      <span className="text-indigo-600">Hủ Design Demo</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State Guide */
            <div className="p-8 rounded-2xl border-2 border-dashed border-gray-300 text-center space-y-3 bg-gray-50/50">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-sm font-extrabold text-gray-900">
                  Chưa có ấn phẩm thiết kế demo cho {brand.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Bạn có thể tải ảnh demo vừa thiết kế xong từ máy tính hoặc dán link ảnh để trình diễn trực tiếp trong bản đề xuất này gửi khách hàng.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingDemo(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tải Ảnh Thiết Kế Demo Lên Ngay</span>
              </button>
            </div>
          )}
        </div>

        {/* ==================== 7. FOOTER & CONFIRMATION ==================== */}
        <div className="pt-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 pt-4">
            {/* Left: Studio Guarantee */}
            <div className="space-y-2 max-w-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Cam kết chất lượng
              </span>
              <p className="text-xs text-gray-600 leading-relaxed">
                Tất cả quy chuẩn đồ họa trên được Hủ Design Studio nghiên cứu và đề xuất riêng cho <strong>{brand.name}</strong> nhằm tối ưu tính nhận diện, cảm xúc thương hiệu và tỷ lệ chuyển đổi trên nền tảng Social Media.
              </p>
              <div className="text-xs text-gray-500 font-mono pt-1">
                Hotline: {studio.phone || '0901.xxx.xxx'} • Email: {studio.email || 'contact@hudesign.vn'}
              </div>
            </div>

            {/* Right: Signature Blocks */}
            <div className="flex items-center gap-8 sm:gap-12">
              <div className="text-center space-y-12">
                <span className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Đại diện Khách Hàng
                </span>
                <div className="text-xs font-semibold text-gray-400 border-t border-gray-300 pt-1">
                  (Ký & ghi rõ họ tên)
                </div>
              </div>

              <div className="text-center space-y-12">
                <span className="block text-xs font-bold uppercase tracking-wider text-gray-900">
                  Đại diện Hủ Design Studio
                </span>
                <div className="text-xs font-bold text-gray-950 border-t border-gray-900 pt-1">
                  {studio.founder || 'Phan Hùng Hữu (Creative Lead)'}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-gray-400">
            <span>© {new Date().getFullYear()} {studio.name || 'HỦ DESIGN STUDIO'}. All rights reserved.</span>
            <span>Bản quyền tài liệu nhận diện đồ họa thuộc về {brand.name} & Hủ Design.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
