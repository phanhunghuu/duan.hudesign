import React, { useState } from 'react';
import { Sparkles, Check, X, Shield, RefreshCw, Layers, FileText, ArrowRight, Copy, CheckCircle2, AlertCircle, Zap, Tag } from 'lucide-react';
import { PricingFeatureItem, PricingTermItem, PricingTierCard, ServicePricingBoard } from '../types';

interface AIPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBoard: ServicePricingBoard;
  onApplyFeaturesToTier?: (tierId: string, features: PricingFeatureItem[]) => void;
  onApplyTerms?: (terms: PricingTermItem[]) => void;
  onApplyFullBoard?: (suggestedTiers: PricingTierCard[], suggestedTerms: PricingTermItem[]) => void;
  theme: 'dark' | 'light';
  targetTierId?: string | null;
}

export const AIPricingModal: React.FC<AIPricingModalProps> = ({
  isOpen,
  onClose,
  activeBoard,
  onApplyFeaturesToTier,
  onApplyTerms,
  onApplyFullBoard,
  theme,
  targetTierId,
}) => {
  const isLight = theme === 'light';

  // Modes: 'features' | 'terms' | 'full'
  const [activeTab, setActiveTab] = useState<'features' | 'terms' | 'full'>(
    targetTierId ? 'features' : 'features'
  );

  const [serviceTitle, setServiceTitle] = useState<string>(activeBoard.title || '');
  const [selectedTierId, setSelectedTierId] = useState<string>(
    targetTierId || activeBoard.tiers[0]?.id || ''
  );
  const [marketPosition, setMarketPosition] = useState<'budget' | 'standard' | 'premium'>('standard');
  const [notes, setNotes] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // AI Response state
  const [aiResult, setAiResult] = useState<{
    summary?: string;
    suggestedFeatures?: { text: string; included: boolean }[];
    suggestedTerms?: { title: string; content: string }[];
    suggestedTiers?: any[];
  } | null>(null);

  // Selected items checkboxes in modal
  const [selectedFeatureIndices, setSelectedFeatureIndices] = useState<number[]>([]);
  const [selectedTermIndices, setSelectedTermIndices] = useState<number[]>([]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const targetTier = activeBoard.tiers.find((t) => t.id === selectedTierId);

    const payload = {
      requestType: activeTab === 'features' ? 'features_only' : activeTab === 'terms' ? 'terms_only' : 'full_tiers',
      serviceTitle: serviceTitle.trim() || activeBoard.title,
      tierName: targetTier?.name || '',
      currentFeatures: targetTier?.features.map((f) => f.text) || [],
      notes: `Định vị: ${marketPosition === 'budget' ? 'Tiết kiệm / Khởi nghiệp' : marketPosition === 'premium' ? 'Cao cấp / VIP' : 'Tiêu chuẩn chuyên nghiệp'}. ${notes}`,
    };

    try {
      const response = await fetch('/api/generate-pricing-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.result) {
        setAiResult(data.result);
        if (data.result.suggestedFeatures) {
          setSelectedFeatureIndices(data.result.suggestedFeatures.map((_: any, idx: number) => idx));
        }
        if (data.result.suggestedTerms) {
          setSelectedTermIndices(data.result.suggestedTerms.map((_: any, idx: number) => idx));
        }
      } else {
        throw new Error(data.error || 'Không nhận được dữ liệu phản hồi');
      }
    } catch (err: any) {
      console.error('AI generate error:', err);
      setErrorMsg('Không thể kết nối với dịch vụ AI. Hệ thống đã chuẩn bị phương án mẫu dự phòng.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle selection
  const toggleFeatureSelect = (index: number) => {
    setSelectedFeatureIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleTermSelect = (index: number) => {
    setSelectedTermIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Apply Features to selected Tier
  const handleApplyFeatures = () => {
    if (!aiResult?.suggestedFeatures || !onApplyFeaturesToTier) return;
    const chosen = aiResult.suggestedFeatures.filter((_, idx) => selectedFeatureIndices.includes(idx));
    if (chosen.length === 0) {
      alert('Vui lòng chọn ít nhất một tính năng để áp dụng.');
      return;
    }

    const newFeatures: PricingFeatureItem[] = chosen.map((f, i) => ({
      id: 'f_ai_' + Date.now() + '_' + i,
      text: f.text,
      included: f.included,
    }));

    onApplyFeaturesToTier(selectedTierId, newFeatures);
    showToast(`Đã thêm ${newFeatures.length} tính năng vào gói thành công!`);
    setTimeout(() => onClose(), 800);
  };

  // Apply Terms to active Board
  const handleApplyTerms = () => {
    if (!aiResult?.suggestedTerms || !onApplyTerms) return;
    const chosen = aiResult.suggestedTerms.filter((_, idx) => selectedTermIndices.includes(idx));
    if (chosen.length === 0) {
      alert('Vui lòng chọn ít nhất một điều khoản để áp dụng.');
      return;
    }

    const newTerms: PricingTermItem[] = chosen.map((t, i) => ({
      id: 'term_ai_' + Date.now() + '_' + i,
      title: t.title,
      content: t.content,
    }));

    onApplyTerms(newTerms);
    showToast(`Đã thêm ${newTerms.length} điều khoản hợp tác vào bảng giá!`);
    setTimeout(() => onClose(), 800);
  };

  // Apply Full Tiers & Terms to active Board
  const handleApplyFull = () => {
    if (!aiResult || !onApplyFullBoard) return;

    const generatedTiers: PricingTierCard[] = (aiResult.suggestedTiers || []).map((tier: any, idx: number) => ({
      id: 'tier_ai_' + Date.now() + '_' + idx,
      name: tier.name || `GÓI ${idx + 1}`,
      price: tier.price || 'Liên hệ',
      subtitle: tier.subtitle || '',
      colorTheme: tier.colorTheme || 'blue',
      iconName: tier.iconName || 'sparkles',
      isPopular: !!tier.isPopular,
      popularBadgeText: tier.popularBadgeText || (tier.isPopular ? 'KHUYÊN DÙNG' : undefined),
      buttonText: 'CHỌN GÓI NÀY',
      features: (tier.features || []).map((feat: any, fIdx: number) => ({
        id: `f_full_${idx}_${fIdx}`,
        text: feat.text,
        included: feat.included !== false,
      })),
    }));

    const generatedTerms: PricingTermItem[] = (aiResult.suggestedTerms || []).map((t: any, idx: number) => ({
      id: 'term_ai_full_' + Date.now() + '_' + idx,
      title: t.title,
      content: t.content,
    }));

    onApplyFullBoard(generatedTiers, generatedTerms);
    showToast('Đã áp dụng toàn bộ các gói và điều khoản mới vào bảng giá!');
    setTimeout(() => onClose(), 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-gray-900 border-gray-800 text-white'
        }`}
      >
        {/* Toast inside modal */}
        {successToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold">Trợ lý AI Soạn Bảng giá & Điều khoản</h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tự động đề xuất quyền lợi dịch vụ, số vòng chỉnh sửa & quy định bảo vệ quyền tác giả Hủ Design
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Mode Tabs */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
            <button
              onClick={() => setActiveTab('features')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'features'
                  ? isLight
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'bg-gray-900 text-blue-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Gợi ý Tính năng / Quyền lợi</span>
            </button>

            <button
              onClick={() => setActiveTab('terms')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'terms'
                  ? isLight
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'bg-gray-900 text-blue-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Soạn Điều khoản & Cam kết</span>
            </button>

            <button
              onClick={() => setActiveTab('full')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'full'
                  ? isLight
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'bg-gray-900 text-blue-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tạo trọn bộ các Gói từ A-Z</span>
            </button>
          </div>

          {/* Form Settings for Prompt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-500" />
                <span>Tên sản phẩm / Dịch vụ thiết kế:</span>
              </label>
              <input
                type="text"
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                placeholder="VD: Thiết kế nhận diện thương hiệu Logo, Thiết kế bao bì trà thảo mộc..."
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border ${
                  isLight ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-700 text-white'
                }`}
              />
            </div>

            {/* Target Tier selector when in features mode */}
            {activeTab === 'features' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Gói dịch vụ cần áp dụng:
                </label>
                <select
                  value={selectedTierId}
                  onChange={(e) => setSelectedTierId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-700 text-white'
                  }`}
                >
                  {activeBoard.tiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.price})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={activeTab === 'features' ? 'space-y-1' : 'sm:col-span-2 space-y-1'}>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Phân khúc thị trường mục tiêu:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMarketPosition('budget')}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    marketPosition === 'budget'
                      ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
                      : isLight
                      ? 'bg-gray-50 border-gray-200 text-gray-600'
                      : 'bg-gray-800 border-gray-700 text-gray-400'
                  }`}
                >
                  Tiết kiệm / Startup
                </button>
                <button
                  type="button"
                  onClick={() => setMarketPosition('standard')}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    marketPosition === 'standard'
                      ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
                      : isLight
                      ? 'bg-gray-50 border-gray-200 text-gray-600'
                      : 'bg-gray-800 border-gray-700 text-gray-400'
                  }`}
                >
                  Tiêu chuẩn (Khuyên dùng)
                </button>
                <button
                  type="button"
                  onClick={() => setMarketPosition('premium')}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    marketPosition === 'premium'
                      ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
                      : isLight
                      ? 'bg-gray-50 border-gray-200 text-gray-600'
                      : 'bg-gray-800 border-gray-700 text-gray-400'
                  }`}
                >
                  Cao cấp / Doanh nghiệp
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Ghi chú thêm hoặc yêu cầu đặc thù:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Cần cam kết xuất file vector AI chuẩn in ấn, hỗ trợ kiểm tra xưởng in, quy định cọc 50%..."
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isLight ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-700 text-white'
                }`}
              />
            </div>
          </div>

          {/* Trigger AI Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI đang nghiên cứu & soạn thảo nội dung...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Bắt đầu tạo nội dung với AI</span>
              </>
            )}
          </button>

          {/* Error Message if any */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* AI RESULT DISPLAY AREA */}
          {/* ========================================================= */}
          {aiResult && (
            <div className="space-y-4 pt-3 border-t border-gray-200 dark:border-gray-800 animate-in fade-in duration-300">
              {/* Summary from AI */}
              {aiResult.summary && (
                <div className={`p-3 rounded-xl text-xs border ${
                  isLight ? 'bg-blue-50/60 border-blue-200 text-blue-900' : 'bg-blue-950/30 border-blue-900 text-blue-200'
                }`}>
                  <p className="font-semibold">{aiResult.summary}</p>
                </div>
              )}

              {/* 1. FEATURES LIST */}
              {(activeTab === 'features' || activeTab === 'full') && aiResult.suggestedFeatures && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      Tính năng & Tiêu chuẩn bàn giao ({aiResult.suggestedFeatures.length} tiêu chí):
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Đã chọn {selectedFeatureIndices.length}/{aiResult.suggestedFeatures.length}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {aiResult.suggestedFeatures.map((feat, idx) => {
                      const isChecked = selectedFeatureIndices.includes(idx);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleFeatureSelect(idx)}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs border transition cursor-pointer ${
                            isChecked
                              ? isLight
                                ? 'bg-blue-50/70 border-blue-300 text-gray-900'
                                : 'bg-blue-950/40 border-blue-700 text-white'
                              : isLight
                              ? 'bg-gray-50 border-gray-200 text-gray-400'
                              : 'bg-gray-800/60 border-gray-700 text-gray-500'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                isChecked
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'border-gray-400 dark:border-gray-600'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className={isChecked ? 'font-medium' : 'line-through'}>
                              {feat.text}
                            </span>
                          </div>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              feat.included
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {feat.included ? 'Bao gồm' : 'Không có'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {activeTab === 'features' && (
                    <button
                      onClick={handleApplyFeatures}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Áp dụng vào gói "{activeBoard.tiers.find((t) => t.id === selectedTierId)?.name}"</span>
                    </button>
                  )}
                </div>
              )}

              {/* 2. TERMS & POLICIES LIST */}
              {(activeTab === 'terms' || activeTab === 'full') && aiResult.suggestedTerms && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      Điều khoản & Quy định bảo vệ Studio ({aiResult.suggestedTerms.length} mục):
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Đã chọn {selectedTermIndices.length}/{aiResult.suggestedTerms.length}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {aiResult.suggestedTerms.map((term, idx) => {
                      const isChecked = selectedTermIndices.includes(idx);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleTermSelect(idx)}
                          className={`p-3 rounded-xl text-xs border transition cursor-pointer ${
                            isChecked
                              ? isLight
                                ? 'bg-indigo-50/60 border-indigo-300'
                                : 'bg-indigo-950/40 border-indigo-700'
                              : isLight
                              ? 'bg-gray-50 border-gray-200 text-gray-400'
                              : 'bg-gray-800/60 border-gray-700 text-gray-500'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                  isChecked
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'border-gray-400 dark:border-gray-600'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <h4 className="font-bold text-gray-900 dark:text-white">{term.title}</h4>
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed pl-6">
                            {term.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {activeTab === 'terms' && (
                    <button
                      onClick={handleApplyTerms}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Áp dụng các điều khoản này vào Bảng giá</span>
                    </button>
                  )}
                </div>
              )}

              {/* 3. FULL TIERS ACTION */}
              {activeTab === 'full' && aiResult.suggestedTiers && (
                <div className="pt-2">
                  <button
                    onClick={handleApplyFull}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Áp dụng toàn bộ ({aiResult.suggestedTiers.length} gói & điều khoản) vào Bảng giá hiện tại</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80 shrink-0">
          <span className="text-[11px] text-gray-500">
            Nội dung được tạo độc quyền cho phong cách làm việc của <strong>Hủ Design</strong>.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
