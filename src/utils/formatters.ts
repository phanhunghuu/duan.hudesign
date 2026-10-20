import { DesignStatus, ProjectStatus, ContentStatus, VideoPlatform, PriorityLevel } from '../types';

export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
}

export function formatVND(amount: number): string {
  if (isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getRelativeTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Ngày mai';
  if (diffDays === -1) return 'Hôm qua';
  if (diffDays < -1) return `Quá hạn ${Math.abs(diffDays)} ngày`;
  return `Còn ${diffDays} ngày`;
}

export function getProjectStatusBadge(status: ProjectStatus): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'active':
      return { label: 'Đang hợp tác', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' };
    case 'pending':
      return { label: 'Chờ phản hồi', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' };
    case 'completed':
      return { label: 'Đã hoàn thành', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' };
    case 'paused':
      return { label: 'Tạm dừng', bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700' };
    default:
      return { label: 'Khác', bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700' };
  }
}

export function getDesignStatusBadge(status: DesignStatus): { label: string; bg: string; text: string; dot: string } {
  switch (status) {
    case 'todo':
      return { label: 'Chưa làm', bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700', text: 'text-gray-700 dark:text-gray-300', dot: 'bg-gray-400' };
    case 'in_progress':
      return { label: 'Đang làm', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500 animate-pulse' };
    case 'review':
      return { label: 'Chờ duyệt', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' };
    case 'done':
      return { label: 'Hoàn thành', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' };
    default:
      return { label: 'Chưa làm', bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700', text: 'text-gray-700 dark:text-gray-300', dot: 'bg-gray-400' };
  }
}

export function getPriorityBadge(priority: PriorityLevel): { label: string; bg: string; text: string } {
  switch (priority) {
    case 'urgent':
      return { label: 'Khẩn cấp', bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300' };
    case 'high':
      return { label: 'Ưu tiên cao', bg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-300' };
    case 'medium':
      return { label: 'Bình thường', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300' };
    case 'low':
      return { label: 'Thấp', bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700', text: 'text-gray-700 dark:text-gray-300' };
  }
}

export function getContentStatusBadge(status: ContentStatus): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'idea':
      return { label: 'Ý tưởng', bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' };
    case 'scripted':
      return { label: 'Đã viết kịch bản', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' };
    case 'production':
      return { label: 'Đang quay/dựng', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' };
    case 'published':
      return { label: 'Đã đăng', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' };
  }
}

export function getPlatformBadge(platform: VideoPlatform): { label: string; icon: string; bg: string; text: string } {
  if (platform === 'tiktok') {
    return {
      label: 'TikTok',
      icon: 'TikTok',
      bg: 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-300 border border-pink-200 dark:border-pink-800',
      text: 'text-pink-600 dark:text-pink-300',
    };
  }
  return {
    label: 'YouTube',
    icon: 'YouTube',
    bg: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800',
    text: 'text-red-600 dark:text-red-300',
  };
}
