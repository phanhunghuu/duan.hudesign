import React, { useState, useEffect } from 'react';
import { BrandProfile, BrandCustomPillar } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  RotateCcw, 
  Sparkles, 
  SlidersHorizontal,
  Lightbulb,
  X,
  AlertTriangle
} from 'lucide-react';
import { 
  DEFAULT_PILLARS, 
  getBrandPillars, 
  COLOR_OPTIONS, 
  getPillarColorStyle, 
  INDUSTRY_PILLAR_TEMPLATES 
} from '../utils/pillarUtils';

interface CustomPillarsManagerProps {
  brand: BrandProfile;
  onUpdatePillars: (updatedPillars: BrandCustomPillar[]) => void;
  isLight: boolean;
  onSelectPillar?: (pillarName: string) => void;
  activeSelectedPillar?: string;
  isCompact?: boolean; // Chế độ gọn khi mở nhanh từ dropdown
  onClose?: () => void;
}

export const CustomPillarsManager: React.FC<CustomPillarsManagerProps> = ({
  brand,
  onUpdatePillars,
  isLight,
  onSelectPillar,
  activeSelectedPillar,
  isCompact = false,
  onClose,
}) => {
  const [pillars, setPillars] = useState<BrandCustomPillar[]>(() => getBrandPillars(brand));

  // Đồng bộ khi brand thay đổi từ bên ngoài
  useEffect(() => {
    setPillars(getBrandPillars(brand));
  }, [brand.id, brand.customPillars]);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // State xác nhận xóa inline (tránh dùng window.confirm vì bị iframe chặn)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmResetDefault, setConfirmResetDefault] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Form state
  const [nameInput, setNameInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [objectiveInput, setObjectiveInput] = useState('');
  const [colorInput, setColorInput] = useState('blue');

  const [showTemplates, setShowTemplates] = useState(false);

  const resetForm = () => {
    setNameInput('');
    setDescriptionInput('');
    setObjectiveInput('');
    setColorInput('blue');
    setIsAddingNew(false);
    setEditingId(null);
  };

  const handleStartEdit = (p: BrandCustomPillar) => {
    setEditingId(p.id);
    setNameInput(p.name);
    setDescriptionInput(p.description || '');
    setObjectiveInput(p.targetObjective || '');
    setColorInput(p.color || 'blue');
    setIsAddingNew(true);
    setConfirmDeleteId(null);
    setWarningMessage(null);
  };

  const handleSavePillar = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName) return;

    let updatedList: BrandCustomPillar[] = [];

    if (editingId) {
      // Cập nhật chủ đề có sẵn
      updatedList = pillars.map((p) => {
        if (p.id === editingId) {
          return {
            ...p,
            name: cleanName,
            description: descriptionInput.trim() || undefined,
            targetObjective: objectiveInput.trim() || undefined,
            color: colorInput,
          };
        }
        return p;
      });
    } else {
      // Thêm mới chủ đề
      const newPillar: BrandCustomPillar = {
        id: `pillar_${Date.now()}`,
        name: cleanName,
        description: descriptionInput.trim() || undefined,
        targetObjective: objectiveInput.trim() || undefined,
        color: colorInput,
      };
      updatedList = [...pillars, newPillar];
      if (onSelectPillar) {
        onSelectPillar(cleanName);
      }
    }

    setPillars(updatedList);
    onUpdatePillars(updatedList);
    resetForm();
  };

  // Xóa chủ đề chính trực tiếp không phụ thuộc window.confirm
  const handleExecuteDelete = (id: string, name: string) => {
    if (pillars.length <= 1) {
      setWarningMessage('Thương hiệu cần giữ ít nhất 1 chủ đề chính!');
      setConfirmDeleteId(null);
      setTimeout(() => setWarningMessage(null), 3500);
      return;
    }

    const updated = pillars.filter((p) => p.id !== id);
    setPillars(updated);
    onUpdatePillars(updated);
    setConfirmDeleteId(null);
    setWarningMessage(null);

    // Nếu bài viết đang chọn chủ đề vừa bị xóa, tự động chọn chủ đề còn lại đầu tiên
    if (activeSelectedPillar === name && onSelectPillar && updated.length > 0) {
      onSelectPillar(updated[0].name);
    }
  };

  const handleApplyTemplate = (templatePillars: Omit<BrandCustomPillar, 'id'>[]) => {
    const formatted: BrandCustomPillar[] = templatePillars.map((p, idx) => ({
      ...p,
      id: `pillar_${Date.now()}_${idx}`,
    }));
    setPillars(formatted);
    onUpdatePillars(formatted);
    setShowTemplates(false);
    setConfirmDeleteId(null);
    if (onSelectPillar && formatted.length > 0) {
      onSelectPillar(formatted[0].name);
    }
  };

  const handleResetToDefault = () => {
    const defaults = [...DEFAULT_PILLARS];
    setPillars(defaults);
    onUpdatePillars(defaults);
    setConfirmResetDefault(false);
    setConfirmDeleteId(null);
    if (onSelectPillar && defaults.length > 0) {
      onSelectPillar(defaults[0].name);
    }
  };

  return (
    <div className={`space-y-4 ${isCompact ? 'text-xs' : 'text-sm'}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 font-bold">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Chủ Đề Chính (Content Topics) của "{brand.name}"</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
              {pillars.length} chủ đề
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Mỗi bài viết khi chọn chủ đề chính sẽ bám sát vào định hướng và mục tiêu nội dung của thương hiệu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-300/40 flex items-center gap-1 transition cursor-pointer"
            title="Xem gợi ý chủ đề theo từng ngành"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Gợi ý theo ngành</span>
          </button>

          {confirmResetDefault ? (
            <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-2 py-1 rounded-lg">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">Khôi phục?</span>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold cursor-pointer"
              >
                Đồng ý
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetDefault(false)}
                className="p-0.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmResetDefault(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-1 cursor-pointer"
              title="Khôi phục danh sách mặc định"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Mặc định</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Thông báo cảnh báo nếu có */}
      {warningMessage && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold animate-pulse">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Bộ gợi ý theo ngành (Industry Templates) */}
      {showTemplates && (
        <div className={`p-4 rounded-xl border space-y-3 shadow-inner ${
          isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/20 border-amber-900/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Chọn bộ chủ đề chính mẫu theo ngành:
            </span>
            <button
              type="button"
              onClick={() => setShowTemplates(false)}
              className="p-1 rounded text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {INDUSTRY_PILLAR_TEMPLATES.map((tmpl, idx) => (
              <div
                key={tmpl.industryName || idx}
                className={`p-2.5 rounded-lg border flex flex-col justify-between gap-2 ${
                  isLight ? 'bg-white border-amber-200/80 shadow-2xs' : 'bg-gray-900/80 border-gray-800'
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-gray-900 dark:text-gray-100 flex items-center justify-between">
                    <span>{tmpl.industryName}</span>
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                      {tmpl.pillars.length} chủ đề
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                    {tmpl.industryKeyword}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl.pillars)}
                  className="w-full py-1 px-2.5 rounded-lg text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  <span>Áp dụng bộ này ({tmpl.pillars.length} chủ đề)</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Thêm / Chỉnh sửa Chủ Đề Chính */}
      {isAddingNew ? (
        <form
          onSubmit={handleSavePillar}
          className={`p-4 rounded-xl border space-y-3 shadow-md ${
            isLight ? 'bg-indigo-50/70 border-indigo-200' : 'bg-indigo-950/30 border-indigo-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              {editingId ? '✏️ Chỉnh Sửa Chủ Đề Chính' : '➕ Thêm Chủ Đề Chính Mới Cho Brand'}
            </span>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 rounded text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Tên chủ đề chính *
              </label>
              <input
                type="text"
                required
                placeholder="VD: Bí quyết đóng gói, Feedback khách hàng, Menu món mới, Tuyển dụng..."
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-lg border text-xs font-bold outline-hidden ${
                  isLight ? 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500' : 'bg-gray-900 border-gray-700 text-gray-100'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Màu sắc nhận diện
              </label>
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColorInput(c.id)}
                    className={`w-5 h-5 rounded-full ${c.bgClass} flex items-center justify-center transition cursor-pointer ${
                      colorInput === c.id ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    title={c.label}
                  >
                    {colorInput === c.id && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Mục tiêu bài viết (Target Objective)
              </label>
              <input
                type="text"
                placeholder="VD: Tạo lòng tin, Chuyển đổi đơn hàng, Giữ chân khách hàng..."
                value={objectiveInput}
                onChange={(e) => setObjectiveInput(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-hidden ${
                  isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-gray-100'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Định hướng nội dung cụ thể (cho AI bám sát)
              </label>
              <input
                type="text"
                placeholder="VD: Tập trung video thực tế, hình ảnh unboxing, chính sách bảo hành rõ ràng..."
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-hidden ${
                  isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-gray-100'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                isLight ? 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700' : 'bg-gray-800 border-gray-700 text-gray-300'
              }`}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingId ? 'Cập Nhật Chủ Đề' : 'Lưu Chủ Đề Mới'}</span>
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsAddingNew(true);
            setConfirmDeleteId(null);
          }}
          className={`w-full py-2 px-3 rounded-xl border border-dashed font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
            isLight
              ? 'border-indigo-300 text-indigo-700 hover:bg-indigo-50/60'
              : 'border-indigo-800 text-indigo-300 hover:bg-indigo-950/30'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Chủ Đề Chính Mới Riêng Cho Brand "{brand.name}"</span>
        </button>
      )}

      {/* Danh sách các Chủ Đề hiện tại */}
      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {pillars.map((pillar) => {
          const colorStyle = getPillarColorStyle(pillar.name, brand);
          const isSelected = activeSelectedPillar === pillar.name;
          const isConfirmingDelete = confirmDeleteId === pillar.id;

          return (
            <div
              key={pillar.id}
              className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isConfirmingDelete
                  ? 'border-rose-300 bg-rose-50/50 dark:bg-rose-950/30 dark:border-rose-800 ring-2 ring-rose-400'
                  : isSelected
                  ? 'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/40'
                  : isLight
                  ? 'bg-white border-gray-200 hover:border-gray-300 shadow-xs'
                  : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${colorStyle.badge}`}>
                    {pillar.name}
                  </span>
                  {pillar.targetObjective && (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full font-medium">
                      🎯 {pillar.targetObjective}
                    </span>
                  )}
                </div>

                {pillar.description && (
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                    <span className="font-semibold text-gray-500">Định hướng chủ đề:</span> {pillar.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                {isConfirmingDelete ? (
                  // Hộp thoại xác nhận xóa trực tiếp inline không cần alert / window.confirm
                  <div className="flex items-center gap-1.5 bg-rose-100/90 dark:bg-rose-900/60 p-1.5 rounded-lg border border-rose-300 dark:border-rose-700 animate-in fade-in duration-200">
                    <span className="text-[11px] font-bold text-rose-800 dark:text-rose-200 px-1">
                      Xóa chủ đề này?
                    </span>
                    <button
                      type="button"
                      onClick={() => handleExecuteDelete(pillar.id, pillar.name)}
                      className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                      title="Xác nhận xóa vĩnh viễn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 text-xs font-semibold cursor-pointer transition border border-gray-300 dark:border-gray-600"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <>
                    {onSelectPillar && (
                      <button
                        type="button"
                        onClick={() => onSelectPillar(pillar.name)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {isSelected ? <Check className="w-3 h-3" /> : null}
                        <span>{isSelected ? 'Đang chọn' : 'Chọn'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleStartEdit(pillar)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                      title="Chỉnh sửa chủ đề này"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeleteId(pillar.id);
                        setWarningMessage(null);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Xóa chủ đề này khỏi thương hiệu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
