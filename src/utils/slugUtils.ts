import { Client, DesignItem } from '../types';

/**
 * Chuyển đổi chuỗi tiếng Việt có dấu thành URL slug thân thiện, an toàn
 * Ví dụ: "The Vintage Roastery Co." -> "the-vintage-roastery"
 *        "Citiship Cần Thơ" -> "citiship-can-tho"
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD') // Tách dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Xóa ký tự đặc biệt
    .replace(/[\s_]+/g, '-') // Đổi khoảng trắng thành gạch ngang
    .replace(/-+/g, '-') // Gộp nhiều gạch ngang
    .replace(/^-+|-+$/g, ''); // Cắt gạch ngang ở đầu/cuối
}

/**
 * Lấy slug đại diện chuẩn cho khách hàng
 */
export function getClientSlug(client: Client): string {
  if (client.slug && client.slug.trim()) {
    return slugify(client.slug);
  }
  if (client.company && client.company.trim()) {
    return slugify(client.company);
  }
  if (client.name && client.name.trim()) {
    return slugify(client.name);
  }
  return slugify(client.id);
}

/**
 * Tìm kiếm khách hàng theo URL slug hoặc param
 */
export function findClientBySlug(clients: Client[], rawSlug: string): Client | undefined {
  if (!rawSlug || !clients || clients.length === 0) return undefined;
  const cleanParam = slugify(decodeURIComponent(rawSlug));

  // 1. Khớp chính xác với client.slug
  const byCustomSlug = clients.find((c) => c.slug && slugify(c.slug) === cleanParam);
  if (byCustomSlug) return byCustomSlug;

  // 2. Khớp với công ty
  const byCompany = clients.find((c) => slugify(c.company) === cleanParam);
  if (byCompany) return byCompany;

  // 3. Khớp với tên khách
  const byName = clients.find((c) => slugify(c.name) === cleanParam);
  if (byName) return byName;

  // 4. Khớp với ID
  const byId = clients.find((c) => c.id.toLowerCase() === cleanParam.toLowerCase());
  if (byId) return byId;

  // 5. Khớp lỏng nếu slug chứa từ khóa chính (vd "citiship")
  const looseMatch = clients.find(
    (c) =>
      slugify(c.company).includes(cleanParam) ||
      cleanParam.includes(slugify(c.company)) ||
      slugify(c.name).includes(cleanParam)
  );
  return looseMatch;
}

/**
 * Sinh đường link xem dành riêng cho khách hàng dạng /:tenkhachhang
 */
export function getClientShareUrl(client: Client): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hudesign.site';
  const slug = getClientSlug(client);
  return `${origin}/${slug}`;
}

/**
 * Lấy tháng hiện tại dạng YYYY-MM (Ví dụ: "2026-09")
 */
export function getCurrentMonthKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Chuyển YYYY-MM thành chuỗi tiếng Việt dễ đọc (Ví dụ "2026-09" -> "Tháng 09/2026")
 */
export function formatMonthLabel(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey || 'Tháng này';
  const [year, month] = monthKey.split('-');
  return `Tháng ${month}/${year}`;
}

/**
 * Gợi ý quy đổi số lượng post theo quy tắc của Hủ Design:
 * - 1 hình đơn = 1 post
 * - Bài multi 2 - 4 hình = 2 post
 * - Từ 5 hình trở lên = 3 post
 */
export function getRecommendedPostQuota(imageCount: number): number {
  if (imageCount <= 1) return 1;
  if (imageCount <= 4) return 2;
  return 3;
}

export interface PackageQuotaStats {
  hasPackage: boolean;
  packageName: string;
  totalQuota: number;
  usedQuota: number;
  remainingQuota: number;
  usagePercent: number;
  targetMonthKey: string;
  targetMonthLabel: string;
  itemsInMonth: DesignItem[];
  warningLevel: 'safe' | 'warning' | 'completed' | 'exceeded';
}

/**
 * Tính toán số lượng post đã dùng và còn lại trong tháng cho khách hàng
 */
export function calculatePackageQuota(
  client: Client,
  designItems: DesignItem[],
  customMonthKey?: string
): PackageQuotaStats {
  const targetMonthKey = customMonthKey || client.packageConfig?.activeMonth || getCurrentMonthKey();
  const hasPackage = !!client.packageConfig?.hasMonthlyPackage;
  const totalQuota = hasPackage ? client.packageConfig?.totalPostsPerMonth || 15 : 0;
  const packageName = client.packageConfig?.packageName || (hasPackage ? `Gói ${totalQuota} post / tháng` : 'Gói thiết kế theo bài');

  // Lọc các sản phẩm thuộc khách hàng này
  const clientItems = designItems.filter((item) => item.clientId === client.id);

  // Lọc theo tháng: nếu item có targetMonth thì so sánh, nếu không thì lấy theo deadline hoặc createdAt
  const itemsInMonth = clientItems.filter((item) => {
    if (item.targetMonth) {
      return item.targetMonth === targetMonthKey;
    }
    const dateStr = item.deadline || item.createdAt;
    if (dateStr && dateStr.length >= 7) {
      return dateStr.substring(0, 7) === targetMonthKey;
    }
    return true; // Nếu không có ngày thì tính vào tháng hiện tại
  });

  // Tính tổng post đã dùng
  const usedQuota = itemsInMonth.reduce((acc, item) => {
    const quota = typeof item.postQuota === 'number' && item.postQuota > 0 ? item.postQuota : 1;
    return acc + quota;
  }, 0);

  const remainingQuota = Math.max(0, totalQuota - usedQuota);
  const usagePercent = totalQuota > 0 ? Math.min(100, Math.round((usedQuota / totalQuota) * 100)) : 0;

  let warningLevel: 'safe' | 'warning' | 'completed' | 'exceeded' = 'safe';
  if (hasPackage) {
    if (usedQuota > totalQuota) {
      warningLevel = 'exceeded';
    } else if (usedQuota === totalQuota) {
      warningLevel = 'completed';
    } else if (remainingQuota <= 4) {
      warningLevel = 'warning';
    } else {
      warningLevel = 'safe';
    }
  }

  return {
    hasPackage,
    packageName,
    totalQuota,
    usedQuota,
    remainingQuota: totalQuota - usedQuota, // Có thể âm nếu vượt gói
    usagePercent,
    targetMonthKey,
    targetMonthLabel: formatMonthLabel(targetMonthKey),
    itemsInMonth,
    warningLevel,
  };
}
