import React, { useState } from 'react';
import { BrandProfile, PostPillar, WeeklyPlanPost } from '../types';
import { generateContentIdeas, GeneratedIdea } from '../utils/contentIdeaGenerator';
import { 
  X, 
  Sparkles, 
  Search, 
  Plus, 
  Check, 
  ArrowRight, 
  Lightbulb, 
  Layers, 
  Image as ImageIcon,
  Copy,
  SlidersHorizontal
} from 'lucide-react';

interface ContentIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: BrandProfile;
  onSelectIdeaToAdd: (idea: GeneratedIdea) => void;
  isLight: boolean;
}

const PILLAR_OPTIONS: { id: PostPillar; label: string; color: string }[] = [
  { id: 'Chia sẻ kiến thức & Tips', label: 'Kiến thức & Mẹo hay', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
  { id: 'Bán hàng / Khuyến mãi', label: 'Bán hàng & Ưu đãi', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30' },
  { id: 'Tương tác & Minigame', label: 'Tương tác & Game', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
  { id: 'Câu chuyện thương hiệu', label: 'Brand Story', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' },
  { id: 'Feedback & Khách hàng', label: 'Feedback khách', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
  { id: 'Bắt trend / Đời thường', label: 'Bắt trend & Hài hước', color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30' },
];

export const ContentIdeaModal: React.FC<ContentIdeaModalProps> = ({
  isOpen,
  onClose,
  brand,
  onSelectIdeaToAdd,
  isLight,
}) => {
  const [topicInput, setTopicInput] = useState('');
  const [selectedPillar, setSelectedPillar] = useState<PostPillar | undefined>(undefined);
  const [ideas, setIdeas] = useState<GeneratedIdea[]>(() => generateContentIdeas('Cà phê & Không gian làm việc', brand));
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateContentIdeas(topicInput, brand, selectedPillar);
      setIdeas(generated);
      setIsGenerating(false);
    }, 350);
  };

  const handleCopyCaption = (idea: GeneratedIdea) => {
    navigator.clipboard.writeText(`${idea.hook}\n\n${idea.captionPreview}\n\n${idea.callToAction}\n\n${idea.hashtags}`);
    setCopiedId(idea.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print overflow-y-auto">
      <div className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border ${
        isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#181F2E] border-gray-800 text-gray-100'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isLight ? 'border-gray-200 bg-gradient-to-r from-blue-50/70 to-indigo-50/70' : 'border-gray-800 bg-gradient-to-r from-blue-950/40 to-indigo-950/40'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Gợi Ý Ý Tưởng Bài Viết & Brief Thiết Kế</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  AI Generator
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Nhập chủ đề hoặc từ khóa để sinh ý tưởng content và brief thiết kế tự động cho <strong>{brand.name}</strong>
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

        {/* Input Bar */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800/80 space-y-4">
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={topicInput}
                placeholder="VD: Ra mắt món mới, Ngày mưa Sài Gòn, Chương trình khuyến mãi 8/3, Bí quyết chọn hạt..."
                onChange={(e) => setTopicInput(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500 outline-hidden ${
                  isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center justify-center gap-2 transition cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? 'Đang tạo ý tưởng...' : 'Gợi ý ngay'}
            </button>
          </form>

          {/* Pillar Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-gray-400 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> Trụ cột:
            </span>
            <button
              type="button"
              onClick={() => setSelectedPillar(undefined)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedPillar === undefined
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Tất cả
            </button>
            {PILLAR_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedPillar(opt.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedPillar === opt.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ideas List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {ideas.length} Ý Tưởng Bài Viết Đề Xuất
            </span>
            <span className="text-xs text-gray-400">
              Tone: <strong>{brand.toneOfVoice.split('.')[0]}</strong>
            </span>
          </div>

          <div className="space-y-4">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className={`p-5 rounded-2xl border transition-all hover:shadow-md space-y-4 ${
                  isLight ? 'bg-white border-gray-200 hover:border-blue-300' : 'bg-gray-900/60 border-gray-800 hover:border-blue-500/50'
                }`}
              >
                {/* Idea Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        {idea.pillar}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {idea.postType}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {idea.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyCaption(idea)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedId === idea.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === idea.id ? 'Đã sao chép' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectIdeaToAdd(idea);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm Vào Kế Hoạch Tuần
                    </button>
                  </div>
                </div>

                {/* Hook & Caption Preview */}
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 text-xs space-y-2">
                  <p className="font-semibold text-blue-600 dark:text-blue-400">
                    🎯 Hook mở đầu: <span className="font-normal text-gray-700 dark:text-gray-300">"{idea.hook}"</span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {idea.captionPreview}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {idea.hashtags}
                  </p>
                </div>

                {/* Design Brief Suggestion */}
                <div className="p-3 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-400">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Brief Thiết Kế Gợi Ý ({idea.designBriefSuggestion.aspectRatio})</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Text đè ảnh:</strong> {idea.designBriefSuggestion.headlineOnImage}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <strong>Visual:</strong> {idea.designBriefSuggestion.visualConcept}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
