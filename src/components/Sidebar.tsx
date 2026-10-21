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
export type ContentSubmodule = 'fanpage_weekly' | 'video_scripts';

export interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  activeContentSubmodule: ContentSubmodule;
  onSelectContentSubmodule: (submodule: ContentSubmodule) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  onOpenSettings: () => void;
  onOpenNewClient: () => void;
  onOpenNewDesign: () => void;
  onOpenAIScript: () => void;
  onOpenNewQuote: () => void;
  cloudStatus?: 'connecting' | 'connected' | 'offline';
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
  activeContentSubmodule,
  onSelectContentSubmodule,
  theme,
  setTheme,
  onOpenSettings,
  onOpenNewClient,
  onOpenNewDesign,
  onOpenAIScript,
  onOpenNewQuote,
  cloudStatus = 'connected',
  studioName = 'HỦ DESIGN',
  driveUser,
  onConnectDrive,
  onDisconnectDrive,
  isCheckingDrive = false,
  driveFolderUrl,
}) => {
  const isLight = theme === 'light';
  const isCloudConnected = cloudStatus === 'connected';
  const cloudStatusLabel = cloudStatus === 'connected'
    ? 'Đã kết nối'
    : cloudStatus === 'connecting'
    ? 'Đang kết nối'
    : 'Ngoại tuyến';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'clients_designs', label: 'Khách hàng & thiết kế', icon: Palette },
    { id: 'quotations', label: 'Báo giá', icon: FileSpreadsheet },
    { id: 'pricing_board', label: 'Bảng giá dịch vụ', icon: BadgePercent },
    { id: 'content_planner', label: 'Nội dung', icon: CalendarDays },
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
      <div className="space-y-4">
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
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Studio Management
              </p>
            </div>
          </button>

          {/* Close button for mobile drawer */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Đóng menu"
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 pt-1">
            Không gian làm việc
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <React.Fragment key={item.id}>
                <button
                  onClick={() => handleSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
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
                {item.id === 'content_planner' && isActive && (
                  <div className="ml-9 mt-1 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-2">
                    {([
                      ['fanpage_weekly', 'Kế hoạch Fanpage'],
                      ['video_scripts', 'Kịch bản Video'],
                    ] as const).map(([submodule, label]) => (
                      <button
                        key={submodule}
                        onClick={() => {
                          onSelectContentSubmodule(submodule);
                          setIsMobileMenuOpen(false);
                        }}
                        aria-current={activeContentSubmodule === submodule ? 'page' : undefined}
                        className={`w-full rounded-lg px-2.5 py-2 text-left text-[13px] transition cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 ${
                          activeContentSubmodule === submodule
                            ? 'font-semibold text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/40'
                            : isLight
                            ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        <div className="relative pt-1">
          <button
            type="button"
            aria-expanded={isCreateMenuOpen}
            onClick={() => setIsCreateMenuOpen((open) => !open)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
          >
            <Plus className="h-4 w-4" /> Tạo mới
          </button>
          {isCreateMenuOpen && (
            <div className={`absolute bottom-full left-0 z-40 mb-2 w-full overflow-hidden rounded-xl border p-1 shadow-lg ${
              isLight ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-900'
            }`}>
              {[
                { label: 'Khách hàng', icon: Users, action: onOpenNewClient },
                { label: 'Việc thiết kế', icon: Palette, action: onOpenNewDesign },
                { label: 'Báo giá', icon: FileSpreadsheet, action: onOpenNewQuote },
                { label: 'Kịch bản với AI', icon: Sparkles, action: onOpenAIScript },
              ].map(({ label, icon: Icon, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setIsCreateMenuOpen(false);
                    setIsMobileMenuOpen(false);
                    action();
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
                    isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4 text-gray-500" /> {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Section: Cloud & Drive status, Settings, Theme toggle */}
      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        {/* Cloud & Drive status badges */}
        <div className="space-y-1.5">
          {/* Cloud Firestore status */}
          <div
            role="status"
            aria-live="polite"
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
              isCloudConnected
                ? isLight
                  ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-800'
                  : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                : cloudStatus === 'connecting'
                ? isLight
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
                : isLight
                ? 'bg-gray-50 border-gray-200 text-gray-700'
                : 'bg-gray-800/40 border-gray-700 text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {cloudStatus === 'connecting' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  isCloudConnected ? 'bg-emerald-500' : cloudStatus === 'connecting' ? 'bg-amber-500' : 'bg-gray-400'
                }`} />
              </span>
              <span>Firestore Cloud</span>
            </div>
            <span className="text-[11px] font-bold opacity-80">{cloudStatusLabel}</span>
          </div>

          {/* Google Drive status */}
          {driveUser ? (
            <div 
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                isLight 
                  ? 'bg-blue-50/70 border-blue-200/80 text-blue-800' 
                  : 'bg-blue-950/30 border-blue-800/50 text-blue-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <HardDrive className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate text-[11px]">{driveUser.email || 'Drive đã kết nối'}</span>
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
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
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
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium border transition cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
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
            aria-label={isLight ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
            className={`p-2 rounded-xl border transition cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
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
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
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
            aria-label="Mở trợ lý AI Content"
            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            title="Trợ lý AI"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            aria-label={isLight ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
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
