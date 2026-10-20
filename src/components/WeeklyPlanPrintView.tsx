import React, { useState, useRef } from 'react';
import { WeeklyPlan, BrandProfile, StudioProfile } from '../types';
import { exportElementToPdf, printElementCleanly } from '../utils/pdfExport';
import { getPillarColorStyle } from '../utils/pillarUtils';
import { getVietnameseDayOfWeek } from '../utils/dateUtils';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  Copy, 
  Check, 
  Calendar, 
  Clock, 
  Palette, 
  Type, 
  Share2, 
  FileCheck,
  Phone,
  Globe,
  Sparkles,
  ExternalLink,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  CalendarDays,
  FileText
} from 'lucide-react';

interface WeeklyPlanPrintViewProps {
  plan: WeeklyPlan;
  brand: BrandProfile;
  studioProfile: StudioProfile;
  onBack: () => void;
  isLight: boolean;
}

export const WeeklyPlanPrintView: React.FC<WeeklyPlanPrintViewProps> = ({
  plan,
  brand,
  studioProfile,
  onBack,
  isLight,
}) => {
  const [printMode, setPrintMode] = useState<'outline_calendar' | 'full_content'>('outline_calendar');
  const [copiedToast, setCopiedToast] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!documentRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    setExportSuccess(false);

    try {
      const sanitizedBrand = (brand.name || 'Thuong_hieu').replace(/[^a-zA-Z0-9_-]/g, '_');
      const sanitizedTitle = (plan.title || 'Ke_hoach').replace(/[^a-zA-Z0-9_-]/g, '_');
      const modeSuffix = printMode === 'outline_calendar' ? 'Lich_Suon_De_Xuat' : 'Noi_Dung_Chi_Tiet';
      const fileName = `HuDesign_${sanitizedBrand}_${sanitizedTitle}_${modeSuffix}.pdf`;

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

  const handlePrint = () => {
    if (!documentRef.current) {
      window.print();
      return;
    }
    const modeName = printMode === 'outline_calendar' ? 'Lịch Sườn Đề Xuất' : 'Nội Dung Chi Tiết';
    printElementCleanly(documentRef.current, `HuDesign - ${plan.title} - ${brand.name} (${modeName})`);
  };

  const handleCopyPlanText = () => {
    let text = '';
    const isMonth = plan.planType === 'month';
    if (printMode === 'outline_calendar') {
      text = isMonth 
        ? `📋 BẢNG LỊCH KẾ HOẠCH BÀI ĐĂNG THÁNG (SƯỜN CHỦ ĐỀ ĐỀ XUẤT)\n`
        : `📋 BẢNG LỊCH KẾ HOẠCH BÀI ĐĂNG TUẦN (SƯỜN CHỦ ĐỀ ĐỀ XUẤT)\n`;
      text += `🏢 Thương hiệu: ${brand.name}\n`;
      text += `📅 Kế hoạch: ${plan.title} (${plan.startDate} - ${plan.endDate})\n`;
      text += `🎯 Mục tiêu: ${plan.mainGoal}\n`;
      text += `----------------------------------------\n\n`;

      plan.posts.forEach((p, idx) => {
        const accurateDay = p.publishDate ? getVietnameseDayOfWeek(p.publishDate) : p.dayOfWeek;
        text += `📌 ${idx + 1}. [${accurateDay} • ${p.publishDate} - ${p.publishTime}] • ${p.pillar} (${p.postType})\n`;
        text += `🔹 Tiêu đề đề xuất: ${p.title}\n`;
        if (p.angle || p.targetAngle) {
          text += `🔹 Góc tiếp cận / Ý đồ: ${p.angle || p.targetAngle}\n`;
        }
        text += `🔹 Trạng thái: ${p.topicApproval === 'approved' ? '✅ Đã chốt chủ đề' : '⏳ Chờ duyệt'}\n\n`;
      });
      text += `👉 Quý khách vui lòng xem qua sườn chủ đề và ngày đăng trên. Nếu OK chốt, Hu Design sẽ tiến hành viết toàn văn bài viết và làm brief thiết kế chi tiết.\n`;
    } else {
      text = isMonth
        ? `📋 KẾ HOẠCH BÀI ĐĂNG THÁNG & BRIEF THIẾT KẾ CHI TIẾT\n`
        : `📋 KẾ HOẠCH BÀI ĐĂNG TUẦN & BRIEF THIẾT KẾ CHI TIẾT\n`;
      text += `🏢 Thương hiệu: ${brand.name}\n`;
      text += `📅 Kế hoạch: ${plan.title} (${plan.startDate} - ${plan.endDate})\n`;
      text += `🎯 Mục tiêu: ${plan.mainGoal}\n`;
      text += `----------------------------------------\n\n`;

      plan.posts.forEach((p, idx) => {
        const accurateDay = p.publishDate ? getVietnameseDayOfWeek(p.publishDate) : p.dayOfWeek;
        text += `📌 BÀI ${idx + 1}: [${accurateDay} • ${p.publishDate || ''} - ${p.publishTime}] • ${p.pillar}\n`;
        text += `🔹 Tiêu đề: ${p.title}\n`;
        text += `🔹 Hook: ${p.hook}\n`;
        text += `🔹 Caption:\n${p.caption}\n`;
        text += `🔹 CTA: ${p.callToAction}\n`;
        text += `🔹 Hashtags: ${p.hashtags}\n`;
        text += `🎨 BRIEF THIẾT KẾ (${p.designBrief.aspectRatio}):\n`;
        text += `• Text đè ảnh: ${p.designBrief.headlineOnImage}\n`;
        text += `• Ý tưởng visual: ${p.designBrief.visualConcept}\n`;
        text += `• Mood & Tone: ${p.designBrief.moodAndTone}\n\n`;
      });
    }

    text += `✍️ Thực hiện bởi HỦ DESIGN • Hotline/Zalo: 0912 412 132`;

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar (no-print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#181F2E] border border-gray-200 dark:border-gray-800 shadow-xs no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Xuất Bản In Kế Hoạch Tuần & PDF Gửi Khách
            </h2>
            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setPrintMode('outline_calendar')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  printMode === 'outline_calendar'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Bản Lịch Sườn Đề Xuất (Gửi Khách Duyệt Sườn Trước)</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('full_content')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  printMode === 'full_content'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Bản Bài Viết & Brief Chi Tiết</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyPlanText}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center gap-2 transition cursor-pointer"
          >
            {copiedToast ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedToast ? 'Đã sao chép kịch bản!' : 'Copy kịch bản gửi Zalo'}</span>
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

      {/* ========================================================================= */}
      {/* TỜ IN KẾ HOẠCH TUẦN CHUẨN STUDIO (PRINTABLE A4 DOCUMENT) */}
      {/* ========================================================================= */}
      <div 
        ref={documentRef}
        className="printable-plan-document max-w-5xl mx-auto bg-white text-gray-900 rounded-2xl shadow-xl border border-gray-200 p-8 sm:p-12 font-sans relative"
      >
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-gray-950">
          {/* Left: Studio Info */}
          <div className="space-y-2">
            <div>
              <img
                src="https://res.cloudinary.com/dcwgy4tnb/image/upload/v1770527011/hudesign-logo_uprmzz.png"
                alt="HỦ DESIGN"
                className="h-8 sm:h-9 w-auto object-contain"
                crossOrigin="anonymous"
              />
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Chuyên thiết kế nhận diện thương hiệu & Sáng tạo nội dung Fanpage
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-600 pt-1">
              <span className="flex items-center gap-1 font-semibold">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                0912 412 132
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                phanhunghuu@gmail.com
              </span>
            </div>
          </div>

          {/* Right: Client & Week Info */}
          <div className="text-left sm:text-right space-y-1.5 pt-1">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-indigo-100 text-indigo-800 tracking-wider">
              {printMode === 'outline_calendar' 
                ? 'BẢNG LỊCH KẾ HOẠCH & CHỦ ĐỀ ĐỀ XUẤT (GIAI ĐOẠN 1: DUYỆT SƯỜN)' 
                : 'BẢNG DUYỆT KẾ HOẠCH NỘI DUNG & BRIEF THIẾT KẾ (GIAI ĐOẠN 2: CHI TIẾT)'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-950 uppercase tracking-tight mt-1">
              {brand.name}
            </h1>
            <p className="text-xs text-gray-600 font-medium">
              Fanpage: <strong>{brand.fanpageName || brand.name}</strong> • Ngành: {brand.industry}
            </p>
            <p className="text-xs font-bold text-indigo-700">
              Thời gian áp dụng: {plan.startDate} đến {plan.endDate} (Tuần {plan.weekNumber})
            </p>
          </div>
        </div>

        {/* Brand Guidelines Summary Box */}
        <div className="my-6 p-4 rounded-xl border border-gray-200 bg-gray-50/70 text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <span className="font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-blue-600" />
              Quy chuẩn thương hiệu đã đồng bộ (Brand Guidelines)
            </span>
            <span className="text-[11px] text-gray-500">
              Style: <strong>{brand.designStyle}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Colors */}
            <div>
              <span className="block text-[11px] font-bold text-gray-500 mb-1">Màu nhận diện:</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: brand.colors.primary }} />
                  <span className="font-mono text-[11px]">{brand.colors.primary}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: brand.colors.secondary }} />
                  <span className="font-mono text-[11px]">{brand.colors.secondary}</span>
                </div>
                {brand.colors.accent && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: brand.colors.accent }} />
                    <span className="font-mono text-[11px]">{brand.colors.accent}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Typography */}
            <div>
              <span className="block text-[11px] font-bold text-gray-500 mb-1">Font chữ quy chuẩn:</span>
              <p className="text-gray-800">
                Tiêu đề: <strong>{brand.fonts.headingFont}</strong> • Nội dung: <strong>{brand.fonts.primaryFont}</strong>
              </p>
            </div>

            {/* Tone of voice */}
            <div>
              <span className="block text-[11px] font-bold text-gray-500 mb-1">Văn phong Fanpage:</span>
              <p className="text-gray-700 truncate" title={brand.toneOfVoice}>
                {brand.toneOfVoice}
              </p>
            </div>
          </div>

          {/* Goal */}
          {plan.mainGoal && (
            <div className="pt-2 border-t border-gray-200 flex items-start gap-2">
              <span className="font-bold text-blue-700 whitespace-nowrap">🎯 Mục tiêu tuần này:</span>
              <span className="text-gray-800 font-medium">{plan.mainGoal}</span>
            </div>
          )}
        </div>

        {/* NỘI DUNG CHÍNH DỰA THEO PRINT MODE */}
        {printMode === 'outline_calendar' ? (
          /* ========================================================================= */
          /* CHẾ ĐỘ 1: BẢNG LỊCH KẾ HOẠCH TỔNG QUÁT (MASTER OUTLINE CALENDAR) */
          /* ========================================================================= */
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b-2 border-gray-900">
              <h3 className="font-black text-sm uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-indigo-600" />
                <span>BẢNG MA TRẬN LỊCH ĐĂNG & CHỦ ĐỀ ĐỀ XUẤT ({plan.posts.length} BÀI)</span>
              </h3>
              <span className="text-xs text-indigo-700 font-bold">
                * Khách hàng vui lòng duyệt qua sườn chủ đề và ngày đăng bên dưới
              </span>
            </div>

            <div className="border border-gray-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 font-black uppercase text-[11px] text-gray-700">
                    <th className="py-3 px-3 w-10 text-center">STT</th>
                    <th className="py-3 px-3 w-32">Thứ & Ngày, Giờ</th>
                    <th className="py-3 px-3 w-36">Chủ đề chính</th>
                    <th className="py-3 px-3 w-28">Định dạng</th>
                    <th className="py-3 px-4">Tiêu đề đề xuất & Ý đồ truyền thông</th>
                    <th className="py-3 px-3 w-28 text-center">Xác nhận duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {plan.posts.map((post, idx) => {
                    const pillarStyle = getPillarColorStyle(post.pillar, brand);
                    const accurateDay = post.publishDate ? getVietnameseDayOfWeek(post.publishDate) : post.dayOfWeek;
                    return (
                      <tr key={post.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                        <td className="py-3 px-3 text-center font-bold text-gray-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-gray-900">{accurateDay}</div>
                          <div className="text-[11px] text-gray-600">{post.publishDate}</div>
                          <div className="text-[11px] font-bold text-indigo-700">{post.publishTime || '08:30'}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${pillarStyle.badge}`}>
                            {post.pillar}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-gray-700 font-medium">
                          {post.postType}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-950 text-xs leading-snug">
                            {post.title}
                          </div>
                          {(post.angle || post.targetAngle) && (
                            <div className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                              <span className="font-bold text-gray-700">Ý đồ:</span> {post.angle || post.targetAngle}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {post.topicApproval === 'approved' ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ Đã chốt
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              Chờ duyệt
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Khung Ghi Chú Xác Nhận Duyệt Sườn */}
            <div className="mt-8 pt-6 border-t-2 border-gray-200 text-xs page-break-inside-avoid">
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2">
                <h4 className="font-black uppercase text-indigo-900 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>XÁC NHẬN CHỐT KHUNG SƯỜN KẾ HOẠCH BÀI ĐĂNG</span>
                </h4>
                <p className="text-gray-700 leading-relaxed text-xs">
                  Sau khi Quý khách xác nhận đồng ý với khung sườn ngày đăng, trụ cột và tiêu đề đề xuất trên, <strong>HỦ DESIGN</strong> sẽ tiến hành viết toàn văn bài viết (Hook 3s, Caption chi tiết, Lời kêu gọi hành động) và triển khai bộ ảnh thiết kế theo đúng quy chuẩn thương hiệu đã duyệt.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* CHẾ ĐỘ 2: CHI TIẾT TOÀN VĂN BÀI VIẾT & BRIEF THIẾT KẾ */
          /* ========================================================================= */
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b-2 border-gray-900">
              <h3 className="font-black text-sm uppercase tracking-wider text-gray-900">
                CHI TIẾT KỊCH BẢN BÀI ĐĂNG ({plan.posts.length} BÀI TRONG TUẦN)
              </h3>
              <span className="text-xs text-gray-500">
                * Quý khách vui lòng xem qua và phản hồi nếu cần điều chỉnh
              </span>
            </div>

          {plan.posts.map((post, idx) => (
            <div
              key={post.id}
              className="border border-gray-200 rounded-xl overflow-hidden page-break-inside-avoid shadow-2xs"
            >
              {/* Post Header Bar */}
              <div className="bg-gray-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-xs">
                    {idx + 1}
                  </span>
                  <div className="font-bold flex items-center gap-2">
                    <span className="text-blue-300 font-black uppercase">
                      {post.publishDate ? getVietnameseDayOfWeek(post.publishDate) : post.dayOfWeek}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>{post.publishDate}</span>
                    <span className="text-gray-400">•</span>
                    <span className="bg-gray-800 px-2 py-0.5 rounded-md text-amber-300 font-mono">
                      {post.publishTime}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-900/80 text-blue-200 font-semibold text-[11px]">
                    {post.pillar}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-300 text-[11px]">
                    {post.postType}
                  </span>
                </div>
              </div>

              {/* Post Content & Design Brief Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                {/* Left 7 Columns: Content Copywriting */}
                <div className="md:col-span-7 p-5 space-y-3 bg-white">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                      TIÊU ĐỀ BÀI ĐĂNG
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-gray-950 leading-snug">
                      {post.title}
                    </h4>
                  </div>

                  {post.hook && (
                    <div className="p-2.5 rounded-lg bg-blue-50/60 border-l-3 border-blue-600 text-xs">
                      <span className="font-bold text-blue-800">Hook mở đầu: </span>
                      <span className="text-gray-800 italic">"{post.hook}"</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                      NỘI DUNG CHI TIẾT (FULL CAPTION)
                    </span>
                    <div className="text-xs text-gray-800 leading-relaxed whitespace-pre-line bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                      {post.caption || 'Chưa cập nhật nội dung chi tiết.'}
                    </div>
                  </div>

                  {post.callToAction && (
                    <div className="text-xs text-gray-800">
                      <strong className="text-emerald-700">Lời kêu gọi (CTA): </strong>
                      {post.callToAction}
                    </div>
                  )}

                  {post.hashtags && (
                    <div className="text-[11px] text-gray-500 font-mono">
                      {post.hashtags}
                    </div>
                  )}
                </div>

                {/* Right 5 Columns: Design Brief or Finished Image */}
                <div className="md:col-span-5 p-5 space-y-3 bg-gray-50/40 border-t md:border-t-0 md:border-l border-gray-100">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      {post.designedImageUrl ? 'ẢNH THIẾT KẾ & BRIEF' : 'BRIEF THIẾT KẾ HÌNH ẢNH'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      {post.designBrief.aspectRatio}
                    </span>
                  </div>

                  {/* Hiển thị ảnh thiết kế hoàn thiện nếu có */}
                  {post.designedImageUrl ? (
                    <div className="space-y-2.5">
                      <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/60 shadow-md bg-white">
                        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-emerald-600 text-white shadow-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Đã Thiết Kế Xong
                        </div>
                        <img
                          src={post.designedImageUrl}
                          alt="Ảnh thiết kế hoàn thiện"
                          className="w-full h-auto max-h-72 object-cover"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>

                      {post.designBrief.headlineOnImage && (
                        <div className="p-2 rounded-md bg-white border border-gray-200 text-xs">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block">Chữ chính trên ảnh:</span>
                          <strong className="text-gray-900">{post.designBrief.headlineOnImage}</strong>
                        </div>
                      )}

                      {post.designBrief.visualConcept && (
                        <p className="text-[11px] text-gray-600 italic">
                          💡 Ý tưởng: {post.designBrief.visualConcept}
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Khi chưa có ảnh thì hiển thị brief chữ */
                    <div className="space-y-3">
                      {post.designBrief.headlineOnImage && (
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                            CHỮ CHÍNH TRÊN ẢNH (VISUAL TEXT)
                          </span>
                          <p className="text-xs font-black text-gray-900 uppercase p-2 rounded-md bg-white border border-gray-200">
                            {post.designBrief.headlineOnImage}
                          </p>
                          {post.designBrief.subTextOnImage && (
                            <p className="text-[11px] text-gray-600 mt-1 pl-1">
                              Phụ: {post.designBrief.subTextOnImage}
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                          Ý TƯỞNG & BỐ CỤC VISUAL
                        </span>
                        <p className="text-xs text-gray-700 leading-relaxed p-2.5 rounded-md bg-white border border-gray-200">
                          {post.designBrief.visualConcept || 'Chưa có mô tả bố cục.'}
                        </p>
                      </div>

                      {post.designBrief.moodAndTone && (
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                            MOOD & TONE HÌNH ẢNH
                          </span>
                          <p className="text-xs text-gray-600 font-medium">
                            {post.designBrief.moodAndTone}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {post.clientNote && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      <strong className="block text-[10px] uppercase font-bold text-amber-800">Ý kiến khách hàng:</strong>
                      {post.clientNote}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      </div>
    </div>
  );
};
