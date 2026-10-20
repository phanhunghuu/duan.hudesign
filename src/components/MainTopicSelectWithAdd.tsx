import React, { useState, useEffect } from 'react';
import { BrandProfile, BrandCustomPillar } from '../types';
import { getBrandPillars, COLOR_OPTIONS, getPillarColorStyle } from '../utils/pillarUtils';
import { Plus, Check, X, SlidersHorizontal, Tag, Sparkles } from 'lucide-react';
import { CustomPillarsManager } from './CustomPillarsManager';

interface MainTopicSelectWithAddProps {
  brand: BrandProfile;
  value: string;
  onChange: (pillarName: string) => void;
  onUpdateBrand?: (updatedBrand: BrandProfile) => void;
  isLight: boolean;
  label?: string;
  showLabel?: boolean;
  className?: string;
  required?: boolean;
}

export const MainTopicSelectWithAdd: React.FC<MainTopicSelectWithAddProps> = ({
  brand,
  value,
  onChange,
  onUpdateBrand,
  isLight,
  label = 'Chủ đề chính',
  showLabel = true,
  className = '',
  required = false,
}) => {
  const [currentBrand, setCurrentBrand] = useState<BrandProfile>(brand);

  useEffect(() => {
    setCurrentBrand(brand);
  }, [brand]);

  const brandPillars = getBrandPillars(currentBrand);

  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicColor, setNewTopicColor] = useState('blue');
  const [newTopicObjective, setNewTopicObjective] = useState('');
  const [showManagerModal, setShowManagerModal] = useState(false);

  // Thêm nhanh chủ đề chính mới vào Brand
  const handleQuickAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = newTopicName.trim();
    if (!cleanName) return;

    // Kiểm tra xem đã có chủ đề tên này chưa
    const exists = brandPillars.some(
      (p) => p.name.trim().toLowerCase() === cleanName.toLowerCase()
    );

    if (exists) {
      onChange(cleanName);
      setIsQuickAdding(false);
      setNewTopicName('');
      return;
    }

    const newPillar: BrandCustomPillar = {
      id: `pillar_${Date.now()}`,
      name: cleanName,
      color: newTopicColor,
      targetObjective: newTopicObjective.trim() || undefined,
      description: `Chủ đề chính: ${cleanName}`,
    };

    const updatedPillars = [...brandPillars, newPillar];
    const updatedBrand: BrandProfile = {
      ...currentBrand,
      customPillars: updatedPillars,
      updatedAt: new Date().toISOString(),
    };

    setCurrentBrand(updatedBrand);

    // Cập nhật lên brand
    if (onUpdateBrand) {
      onUpdateBrand(updatedBrand);
    } else {
      // Lưu fallback vào localStorage nếu không truyền onUpdateBrand
      try {
        const stored = localStorage.getItem('hu_design_brand_profiles_v1');
        if (stored) {
          const brands: BrandProfile[] = JSON.parse(stored);
          const next = brands.map((b) => (b.id === brand.id ? updatedBrand : b));
          localStorage.setItem('hu_design_brand_profiles_v1', JSON.stringify(next));
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Chọn ngay chủ đề vừa tạo
    onChange(cleanName);
    setIsQuickAdding(false);
    setNewTopicName('');
    setNewTopicObjective('');
  };

  const handleUpdatePillarsFromManager = (newPillars: BrandCustomPillar[]) => {
    const updatedBrand: BrandProfile = {
      ...currentBrand,
      customPillars: newPillars,
      updatedAt: new Date().toISOString(),
    };

    setCurrentBrand(updatedBrand);

    if (onUpdateBrand) {
      onUpdateBrand(updatedBrand);
    } else {
      try {
        const stored = localStorage.getItem('hu_design_brand_profiles_v1');
        if (stored) {
          const brands: BrandProfile[] = JSON.parse(stored);
          const next = brands.map((b) => (b.id === brand.id ? updatedBrand : b));
          localStorage.setItem('hu_design_brand_profiles_v1', JSON.stringify(next));
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Nếu giá trị hiện tại bị xóa, tự động chuyển sang chủ đề đầu tiên còn lại
    const stillExists = newPillars.some((p) => p.name === value);
    if (!stillExists && newPillars.length > 0) {
      onChange(newPillars[0].name);
    }
  };

  const activePillarStyle = getPillarColorStyle(value, currentBrand);

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <label className={`block font-bold text-xs ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsQuickAdding(!isQuickAdding)}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 cursor-pointer transition"
              title="Thêm nhanh một chủ đề chính mới cho thương hiệu này"
            >
              <Plus className="w-3 h-3" />
              <span>Thêm mới</span>
            </button>
            <span className="text-gray-300 dark:text-gray-700 text-xs">|</span>
            <button
              type="button"
              onClick={() => setShowManagerModal(true)}
              className="text-[11px] font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1 cursor-pointer transition"
              title="Quản lý toàn bộ danh sách chủ đề chính của thương hiệu"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Quản lý</span>
            </button>
          </div>
        </div>
      )}

      {/* Select Box */}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => {
            if (e.target.value === '__add_new_pillar__') {
              setIsQuickAdding(true);
            } else {
              onChange(e.target.value);
            }
          }}
          className={`w-full px-3 py-1.5 rounded-lg border text-xs font-semibold transition appearance-none cursor-pointer pr-8 ${
            isLight
              ? 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
              : 'bg-gray-900 border-gray-700 text-gray-100 focus:border-indigo-500'
          }`}
        >
          {brandPillars.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
          <option value="__add_new_pillar__" className="font-bold text-indigo-600">
            ➕ + Thêm chủ đề chính mới...
          </option>
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <Tag className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Badge xem trước màu chủ đề đang chọn */}
      {value && (
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border shadow-2xs ${activePillarStyle.badge}`}>
            {value}
          </span>
          <span className="text-[10px] text-gray-400">
            ({brandPillars.find(p => p.name === value)?.targetObjective || 'Chủ đề chính thương hiệu'})
          </span>
        </div>
      )}

      {/* Form nhập nhanh Chủ đề chính mới */}
      {isQuickAdding && (
        <div className={`p-3 rounded-xl border mt-2 space-y-2.5 shadow-md ${
          isLight ? 'bg-indigo-50/60 border-indigo-200' : 'bg-indigo-950/30 border-indigo-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Thêm Chủ Đề Chính Mới Cho "{brand.name}"</span>
            </span>
            <button
              type="button"
              onClick={() => setIsQuickAdding(false)}
              className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <input
                type="text"
                autoFocus
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleQuickAdd();
                  }
                }}
                placeholder="VD: Feedback khách hàng, Menu & Món mới, Tuyển dụng..."
                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                  isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-gray-100'
                }`}
              />
            </div>

            {/* Chọn màu sắc nhãn */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium text-gray-500 mr-1">Màu nhãn:</span>
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setNewTopicColor(c.id)}
                  className={`w-5 h-5 rounded-full ${c.bgClass} flex items-center justify-center transition cursor-pointer ${
                    newTopicColor === c.id ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.label}
                >
                  {newTopicColor === c.id && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </button>
              ))}
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsQuickAdding(false)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer ${
                  isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd()}
                disabled={!newTopicName.trim()}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Lưu & Chọn Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quản lý toàn bộ danh sách chủ đề chính nếu người dùng muốn sửa/xóa */}
      {showManagerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border p-5 space-y-4 max-h-[90vh] overflow-y-auto ${
            isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#181F2E] border-gray-800 text-gray-100'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold">
                  Quản Lý Danh Sách Chủ Đề Chính - "{brand.name}"
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManagerModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <CustomPillarsManager
              brand={currentBrand}
              onUpdatePillars={handleUpdatePillarsFromManager}
              isLight={isLight}
              activeSelectedPillar={value}
              onSelectPillar={(pillarName) => {
                onChange(pillarName);
                setShowManagerModal(false);
              }}
              onClose={() => setShowManagerModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
