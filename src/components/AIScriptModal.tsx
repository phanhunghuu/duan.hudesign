import React, { useState } from 'react';
import { VideoContent, VideoPlatform, VideoScript, VideoFormat } from '../types';
import { 
  Sparkles, 
  Video, 
  Send, 
  Copy, 
  Check, 
  CheckCircle2, 
  Layers, 
  Clock, 
  Hash, 
  ChevronRight, 
  ArrowRight,
  Flame,
  Volume2,
  Tv,
  Film,
  Lightbulb,
  X
} from 'lucide-react';

interface AIScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveContent: (newContent: Omit<VideoContent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  isLight: boolean;
}

const TONE_OPTIONS = [
  'Chuyên gia thiết kế & Phân tích sâu',
  'Hài hước, bắt trend & dí dỏm',
  'Hậu trường thực chiến (Behind The Scenes)',
  'Hướng dẫn từng bước (Step-by-step Tutorial)',
  'Kể chuyện truyền cảm hứng (Storytelling)',
];

const PRESET_IDEAS = [
  'Tại sao logo nổi tiếng luôn dùng hệ màu đơn giản?',
  'Top 3 phím tắt Figma giúp Designer tan làm sớm 2 tiếng',
  'Redesign bao bì hộp bánh trung thu truyền thống theo phong cách Cyberpunk',
  'Khách hàng bảo "Thiết kế cho anh trông sang trọng hơn" và cách xử lý chuẩn Art Director',
  'So sánh 5 font chữ Tiếng Việt hot nhất 2025 cho Social Media',
];

export const AIScriptModal: React.FC<AIScriptModalProps> = ({
  isOpen,
  onClose,
  onSaveContent,
  isLight,
}) => {
  const [rawIdea, setRawIdea] = useState('');
  const [platform, setPlatform] = useState<VideoPlatform>('tiktok');
  const [format, setFormat] = useState<VideoFormat>('short');
  const [tone, setTone] = useState(TONE_OPTIONS[0]);
  const [videoLength, setVideoLength] = useState('30-60 giây');
  const [targetAudience, setTargetAudience] = useState('Designer trẻ, khách hàng doanh nghiệp & người yêu sáng tạo');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<VideoScript | null>(null);
  const [generationSource, setGenerationSource] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerateScript = async () => {
    if (!rawIdea.trim()) return;

    setIsGenerating(true);
    setGeneratedScript(null);

    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawIdea,
          platform,
          format,
          tone,
          videoLength,
          targetAudience,
        }),
      });

      const data = await response.json();
      if (data.script) {
        setGeneratedScript(data.script);
        setGenerationSource(data.mode === 'gemini_ai' ? 'Gemini 3.7 Flash AI' : 'Smart Studio Script Engine');
      }
    } catch (error) {
      console.error('AI Script generation failed:', error);
      // Fallback local generation if server request fails
      const fallback: VideoScript = {
        title: platform === 'tiktok' ? `Bí quyết thiết kế: ${rawIdea.slice(0, 35)}` : `Hướng dẫn chuyên sâu: ${rawIdea.slice(0, 45)}`,
        hook: `Dừng lại 3 giây! Nếu bạn đang làm về ${rawIdea.slice(0, 30)} thì đây là điều bắt buộc phải biết!`,
        hookVisual: 'Cận cảnh thao tác zoom nhanh vào màn hình máy tính với hiệu ứng Whoosh & Glitch cyan.',
        body: [
          {
            segment: 'Phần 1: Sai lầm phổ biến',
            visual: 'Show ví dụ thiết kế lỗi thiếu khoảng thở và sai font chữ.',
            audio: `Khi thực hiện ${rawIdea.slice(0, 30)}, hầu hết mọi người thường mắc lỗi căn chỉnh sai trục thị giác...`,
            duration: '10s',
          },
          {
            segment: 'Phần 2: Giải pháp từ Hủ Design',
            visual: 'Thao tác căn chỉnh bằng thước đo Grid và bảng phối màu Pantone trên Illustrator.',
            audio: 'Chỉ cần áp dụng quy tắc tỷ lệ vàng và phân cấp tiêu đề rõ ràng, sản phẩm sẽ sang trọng hơn gấp 3 lần.',
            duration: '25s',
          },
        ],
        callToAction: 'Lưu video lại và follow kênh Hủ Design để không bỏ lỡ những mẹo thiết kế đỉnh cao mỗi ngày!',
        ctaVisual: 'Animation logo Hủ Design màu cyan phát sáng kèm nút Follow nảy lên.',
        suggestedHashtags: ['#HuDesign', '#GraphicDesign', '#DesignTips', '#HocDesign'],
        productionNotes: 'Nhạc nền beat lofi bassboost nhẹ, text highlight các từ khóa quan trọng.',
      };
      setGeneratedScript(fallback);
      setGenerationSource('Studio Smart Script Engine');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyFullScript = () => {
    if (!generatedScript) return;
    const text = [
      `🎬 KỊCH BẢN VIDEO - HỦ DESIGN`,
      `Tiêu đề: ${generatedScript.title}`,
      `Nền tảng: ${platform === 'tiktok' ? 'TikTok / Shorts' : 'YouTube Long-form'}`,
      `\n🔥 1. HOOK (MỞ ĐẦU):`,
      `• Thoại: "${generatedScript.hook}"`,
      `• Visual gợi ý: ${generatedScript.hookVisual}`,
      `\n📋 2. NỘI DUNG CHÍNH:`,
      ...generatedScript.body.map(
        (b, i) => `[${b.segment} - ${b.duration}]\n• Thoại: "${b.audio}"\n• Cảnh quay: ${b.visual}\n`
      ),
      `\n🚀 3. KÊU GỌI HÀNH ĐỘNG (CTA):`,
      `• Thoại: "${generatedScript.callToAction}"`,
      `• Visual: ${generatedScript.ctaVisual}`,
      `\n🏷️ Hashtags: ${generatedScript.suggestedHashtags?.join(' ')}`,
      `🎵 Ghi chú sản xuất: ${generatedScript.productionNotes}`,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveToPlanner = () => {
    if (!generatedScript) return;

    onSaveContent({
      title: generatedScript.title,
      platform,
      format,
      status: 'scripted',
      rawIdea,
      script: generatedScript,
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tags: [platform === 'tiktok' ? 'TikTok' : 'YouTube', 'AI Script', 'Design Tips'],
      targetViews: platform === 'tiktok' ? 25000 : 10000,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn overflow-y-auto">
      <div className={`w-full max-w-4xl rounded-2xl border p-6 sm:p-8 shadow-2xl my-8 max-h-[92vh] overflow-y-auto ${
        isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-gray-900 border-gray-800 text-gray-100'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display flex items-center gap-2">
                Hủ Design AI Script Creator
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Gemini Powered
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Chuyển ý tưởng thô thành kịch bản video TikTok & YouTube có cấu trúc Hook ➜ Body ➜ CTA chuẩn chuyển đổi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition ${
              isLight ? 'bg-gray-50 hover:bg-gray-100 text-gray-500 border-gray-200' : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border-gray-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Left Column (5 cols): Input Parameters */}
          <div className="lg:col-span-5 space-y-4">
            {/* Raw Idea Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 flex items-center justify-between">
                <span>Ý tưởng video thô *</span>
                <span className="text-[10px] text-gray-400 font-normal">Gõ ý tưởng hoặc chọn bên dưới</span>
              </label>
              <textarea
                rows={3}
                required
                value={rawIdea}
                onChange={(e) => setRawIdea(e.target.value)}
                placeholder="VD: Chỉ ra 3 lỗi sai khi phối màu cho bao bì sản phẩm khiến khách hàng chê quê mùa..."
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border leading-relaxed focus:outline-hidden ${
                  isLight ? 'bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:border-blue-500' : 'bg-gray-950 border-gray-800 text-gray-100 focus:border-blue-500'
                }`}
              />
            </div>

            {/* Preset Suggestions */}
            <div>
              <span className="text-[11px] font-semibold text-gray-500 block mb-1.5 flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                Gợi ý chủ đề nhanh cho Designer:
              </span>
              <div className="space-y-1">
                {PRESET_IDEAS.slice(0, 3).map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRawIdea(preset)}
                    className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition truncate block ${
                      isLight ? 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600 hover:text-blue-600' : 'bg-gray-950/70 hover:bg-gray-800 border-gray-800 text-gray-400 hover:text-blue-300'
                    }`}
                  >
                    • {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform & Format Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Nền tảng</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPlatform('tiktok');
                      setFormat('short');
                      setVideoLength('30-60 giây');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${
                      platform === 'tiktok'
                        ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border-pink-300 dark:border-pink-800 shadow-xs'
                        : isLight ? 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100' : 'bg-gray-950 text-gray-500 border-gray-800 hover:text-gray-300'
                    }`}
                  >
                    TikTok
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPlatform('youtube');
                      setFormat('long');
                      setVideoLength('5-10 phút');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${
                      platform === 'youtube'
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-300 dark:border-red-800 shadow-xs'
                        : isLight ? 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100' : 'bg-gray-950 text-gray-500 border-gray-800 hover:text-gray-300'
                    }`}
                  >
                    YouTube
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Thời lượng</label>
                <input
                  type="text"
                  value={videoLength}
                  onChange={(e) => setVideoLength(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs text-center font-semibold border focus:outline-hidden ${
                    isLight ? 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500' : 'bg-gray-950 border-gray-800 text-gray-100 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>

            {/* Tone of Voice */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Phong cách & Tone giọng</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-hidden ${
                  isLight ? 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500' : 'bg-gray-950 border-gray-800 text-gray-100 focus:border-blue-500'
                }`}
              >
                {TONE_OPTIONS.map((t, i) => (
                  <option key={i} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Generate Trigger Button */}
            <button
              type="button"
              disabled={isGenerating || !rawIdea.trim()}
              onClick={handleGenerateScript}
              className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition ${
                isGenerating || !rawIdea.trim()
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 cursor-pointer'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'AI đang biên kịch kịch bản...' : 'Tạo Kịch bản ngay với AI'}
            </button>
          </div>

          {/* Right Column (7 cols): Result & Preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Film className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Khung Kịch bản Hoàn chỉnh (Hook ➜ Body ➜ CTA)
              </span>

              {generatedScript && (
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                  Engine: {generationSource}
                </span>
              )}
            </div>

            {isGenerating ? (
              <div className={`h-80 rounded-2xl border flex flex-col items-center justify-center text-center p-6 space-y-3 ${
                isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-950 border-gray-800'
              }`}>
                <div className="w-12 h-12 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Đang tạo Hook giật tít & phân bổ cảnh quay...</p>
                <p className="text-xs text-gray-500 max-w-sm">
                  Gemini đang phân tích góc nhìn thiết kế đồ họa chuyên sâu của Hủ Design để tạo lời thoại hấp dẫn nhất.
                </p>
              </div>
            ) : generatedScript ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {/* Title */}
                <div className={`p-3.5 rounded-xl border ${
                  isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-950 border-gray-800'
                }`}>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-0.5">Tiêu đề video</span>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">{generatedScript.title}</h4>
                </div>

                {/* 1. HOOK */}
                <div className="p-4 rounded-xl bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-pink-700 dark:text-pink-400 uppercase tracking-wider">
                    <Flame className="w-4 h-4" />
                    1. HOOK (3-5 Giây đầu tiên giật tít)
                  </div>
                  <p className="text-xs text-gray-800 dark:text-gray-100 font-medium leading-relaxed italic">
                    "{generatedScript.hook}"
                  </p>
                  <div className="text-[11px] text-gray-600 dark:text-gray-400 pt-1 border-t border-pink-200 dark:border-pink-500/20 flex items-start gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-pink-500 shrink-0 mt-0.5" />
                    <span><strong>Gợi ý cảnh quay:</strong> {generatedScript.hookVisual}</span>
                  </div>
                </div>

                {/* 2. BODY SEGMENTS */}
                <div className={`p-4 rounded-xl border space-y-3 ${
                  isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-950 border-gray-800'
                }`}>
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    2. NỘI DUNG CHÍNH (BODY)
                  </div>

                  {generatedScript.body.map((seg, i) => (
                    <div key={i} className={`p-3 rounded-lg border space-y-1.5 ${
                      isLight ? 'bg-white border-gray-200' : 'bg-gray-900/80 border-gray-800'
                    }`}>
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                        <span>{seg.segment}</span>
                        <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-950 px-2 py-0.5 rounded">
                          {seg.duration}
                        </span>
                      </div>
                      <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
                        🗣️ <strong>Lời thoại:</strong> "{seg.audio}"
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        🎬 <strong>Cảnh quay:</strong> {seg.visual}
                      </p>
                    </div>
                  ))}
                </div>

                {/* 3. CTA */}
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 space-y-2">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    3. KÊU GỌI HÀNH ĐỘNG (CTA)
                  </div>
                  <p className="text-xs text-gray-800 dark:text-gray-100 font-medium">
                    "{generatedScript.callToAction}"
                  </p>
                  <div className="text-[11px] text-gray-600 dark:text-gray-400 pt-1 border-t border-emerald-200 dark:border-emerald-500/20">
                    Visual kết thúc: {generatedScript.ctaVisual}
                  </div>
                </div>

                {/* Hashtags & Notes */}
                {generatedScript.suggestedHashtags && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-blue-500" />
                    {generatedScript.suggestedHashtags.map((tag, i) => (
                      <span key={i} className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                        isLight ? 'bg-gray-100 text-blue-700' : 'bg-gray-800 text-blue-300'
                      }`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons for Result */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCopyFullScript}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                      isLight ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200' : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    Sao chép toàn bộ kịch bản
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToPlanner}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Lưu vào Content Planner
                  </button>
                </div>
              </div>
            ) : (
              <div className={`h-80 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center p-6 ${
                isLight ? 'border-gray-200 bg-gray-50/50 text-gray-400' : 'border-gray-800 bg-gray-950/40 text-gray-500'
              }`}>
                <Video className="w-10 h-10 text-gray-400 mb-2" />
                <p className="text-xs font-medium">Nhập ý tưởng và nhấn "Tạo Kịch bản ngay với AI" để xem kết quả ở đây.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
