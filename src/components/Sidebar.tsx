import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Palette, 
  FileSpreadsheet, 
  BadgePercent, 
  CalendarDays,
  Settings, 
  Sun, 
  Moon, 
  Plus, 
  Sparkles,
  Cloud,
  HardDrive,
  Users,
  Menu,
  X,
  ExternalLink,
  FolderOpen,
  CheckCircle2
} from 'lucide-react';

export type NavTab = 'overview' | 'clients_designs' | 'quotations' | 'pricing_board' | 'content_planner';

export interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  onOpenSettings: () => void;
  onOpenNewClient: () => void;
  onOpenNewDesign: () => void;
  onOpenAIScript: () => void;
  onOpenNewQuote: () => void;
  isCloudSynced?: boolean;
  studioName?: string;
  driveUser?: any;
  onConnectDrive?: () => void;
  onDisconnectDrive?: () => void;
  isCheckingDrive?: boolean;
  driveFolderUrl?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  onOpenSettings,
  onOpenNewClient,
  onOpenNewDesign,
  onOpenAIScript,
  onOpenNewQuote,
  isCloudSynced = true,
  studioName = 'HỦ DESIGN',
  driveUser,
  onConnectDrive,
  onDisconnectDrive,
  isCheckingDrive = false,
  driveFolderUrl,
}) => {
  const isLight = theme === 'light';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'clients_designs', label: 'Thiết kế & Khách hàng', icon: Palette },
    { id: 'pricing_board', label: 'Bảng giá Gói & Dịch vụ', icon: BadgePercent },
    { id: 'quotations', label: 'Tạo Báo Giá Đơn lẻ', icon: FileSpreadsheet },
    { id: 'content_planner', label: 'Kế hoạch Content', icon: CalendarDays },
  ];

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const initials = studioName
    ? studioName
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'HỦ';

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between select-none p-4">
      {/* Top Header / Branding */}
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => handleSelectTab('overview')}
            className="flex items-center gap-3 text-left group focus:outline-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-xs group-hover:scale-105 transition-transform">
              {initials}
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white line-clamp-1">
                {studioName}
              </h1>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                Studio Management
              </p>
            </div>
          </button>

          {/* Close button for mobile drawer */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Button: AI Script */}
        <button
          onClick={() => {
            setIsMobileMenuOpen(false);
            onOpenAIScript();
          }}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
            isLight
              ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-900'
              : 'bg-neutral-800/80 hover:bg-neutral-800 border-neutral-700 text-neutral-100'
          }`}
          title="Trợ lý AI tạo kịch bản & nội dung"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Trợ lý AI Content</span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
            PRO
          </span>
        </button>

        {/* Navigation List */}
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 px-3 py-1">
            Menu Chính
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                    isActive
                      ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                      : isLight
                      ? 'text-gray-700 hover:text-black hover:bg-gray-100'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Add Shortcuts */}
        <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-800">
          <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 px-3 py-1">
            Thao tác nhanh
          </div>
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenNewClient();
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-medium border transition cursor-pointer ${
                isLight 
                  ? 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700' 
                  : 'bg-gray-800/60 hover:bg-gray-800 border-gray-700 text-gray-300'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span>+ Khách hàng</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenNewDesign();
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-medium border transition cursor-pointer ${
                isLight 
                  ? 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700' 
                  : 'bg-gray-800/60 hover:bg-gray-800 border-gray-700 text-gray-300'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500" />
              <span>+ Thiết kế</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer Section: Cloud & Drive status, Settings, Theme toggle */}
      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        {/* Cloud & Drive status badges */}
        <div className="space-y-1.5">
          {/* Cloud Firestore status */}
          <div 
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium border ${
              isLight 
                ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-800' 
                : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Firestore Cloud</span>
            </div>
            <span className="text-[10px] font-bold uppercase opacity-80">Online</span>
          </div>

          {/* Google Drive status */}
          {driveUser ? (
            <div 
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium border ${
                isLight 
                  ? 'bg-blue-50/70 border-blue-200/80 text-blue-800' 
                  : 'bg-blue-950/30 border-blue-800/50 text-blue-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <HardDrive className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate text-[10px]">{driveUser.email || 'Drive đã kết nối'}</span>
              </div>
              {driveFolderUrl && (
                <a
                  href={driveFolderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline shrink-0 text-[10px] flex items-center gap-0.5 text-blue-700 dark:text-blue-300 ml-1"
                  title="Mở thư mục Google Drive gốc"
                >
                  <FolderOpen className="w-3 h-3" />
                </a>
              )}
            </div>
          ) : onConnectDrive ? (
            <button
              onClick={onConnectDrive}
              disabled={isCheckingDrive}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                isLight 
                  ? 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700' 
                  : 'bg-gray-800/40 hover:bg-gray-800 border-gray-700 text-gray-300'
              }`}
              title="Đăng nhập tài khoản Google Drive để đồng bộ file thiết kế"
            >
              <div className="flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-gray-400" />
                <span>Google Drive</span>
              </div>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Kết nối</span>
            </button>
          ) : null}
        </div>

        {/* Action icons row: Settings & Theme switch */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Settings Button */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenSettings();
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300'
            }`}
            title="Cài đặt thông tin Studio & Sao lưu dữ liệu"
          >
            <Settings className="w-4 h-4 text-gray-500" />
            <span>Cài đặt</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300'
            }`}
            title={isLight ? 'Chuyển sang Giao diện Tối' : 'Chuyển sang Giao diện Sáng'}
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-300" />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (lg and above) */}
      <aside className={`hidden lg:flex w-64 h-screen sticky top-0 shrink-0 border-r transition-colors z-30 no-print flex-col ${
        isLight 
          ? 'bg-white border-gray-200 text-gray-900' 
          : 'bg-[#111827] border-gray-800 text-gray-100'
      }`}>
        {sidebarContent}
      </aside>

      {/* Mobile Top Header Bar (< lg) */}
      <header className={`lg:hidden sticky top-0 z-40 border-b transition-colors no-print px-4 py-3 flex items-center justify-between ${
        isLight 
          ? 'bg-white/95 backdrop-blur-md border-gray-200 text-gray-900 shadow-xs' 
          : 'bg-[#111827]/95 backdrop-blur-md border-gray-800 text-gray-100'
      }`}>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Mở Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
              {initials}
            </div>
            <span className="font-bold text-sm">{studioName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI script quick button */}
          <button
            onClick={onOpenAIScript}
            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs"
            title="Trợ lý AI"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-300" />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-over Drawer Backdrop & Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Body */}
          <div className={`relative w-72 max-w-[85vw] h-full shadow-2xl flex flex-col z-10 transition-transform ${
            isLight ? 'bg-white text-gray-900' : 'bg-[#111827] text-gray-100'
          }`}>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
