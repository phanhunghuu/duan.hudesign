import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Sidebar, NavTab, ContentSubmodule } from './components/Sidebar';
import { OverviewDashboard } from './components/OverviewDashboard';
const ClientDesignManager = lazy(() => import('./components/ClientDesignManager').then((module) => ({ default: module.ClientDesignManager })));
const QuotationGenerator = lazy(() => import('./components/QuotationGenerator').then((module) => ({ default: module.QuotationGenerator })));
const ContentPlanner = lazy(() => import('./components/ContentPlanner').then((module) => ({ default: module.ContentPlanner })));
const ServicePricingManager = lazy(() => import('./components/ServicePricingManager').then((module) => ({ default: module.ServicePricingManager })));
const AIScriptModal = lazy(() => import('./components/AIScriptModal').then((module) => ({ default: module.AIScriptModal })));
import { Client, DesignItem, Quotation, VideoContent, StudioProfile, ServicePricingBoard } from './types';
import {
  loadClients,
  saveClients,
  loadDesignItems,
  saveDesignItems,
  loadQuotations,
  saveQuotations,
  loadContents,
  saveContents,
  loadStudioProfile,
  saveStudioProfile,
  loadPricingBoards,
  savePricingBoards,
  storage,
} from './utils/storage';
import {
  seedCloudIfEmpty,
  subscribeClients,
  subscribeDesignItems,
  subscribeQuotations,
  subscribeContents,
  subscribeStudioProfile,
  subscribePricingBoards,
  saveClientToCloud,
  deleteClientFromCloud,
  saveDesignItemToCloud,
  deleteDesignItemFromCloud,
  saveQuotationToCloud,
  deleteQuotationFromCloud,
  saveContentToCloud,
  deleteContentFromCloud,
  saveStudioProfileToCloud,
  savePricingBoardToCloud,
  deletePricingBoardFromCloud,
} from './utils/firebaseStorage';
import { initialStudioProfile } from './data/initialData';
import { 
  Settings, 
  X, 
  Save, 
  RefreshCw, 
  Download, 
  Upload, 
  CheckCircle2, 
  Building2, 
  CreditCard, 
  Cloud,
  HardDrive,
  ExternalLink,
  Loader2,
  LogIn,
  LogOut,
  Database,
  Check
} from 'lucide-react';
import { initAuth, googleSignIn, getAccessToken, logout, getCurrentGoogleUser } from './utils/googleAuth';
import { findOrCreateFolder } from './utils/googleDrive';
import { ClientPortalView } from './components/ClientPortalView';
import { findClientBySlug } from './utils/slugUtils';

export default function App() {
  // Theme state
  const [isLight, setIsLight] = useState<boolean>(() => {
    return localStorage.getItem('hudiff_theme') === 'light';
  });

  // Keep dark class on html documentElement in sync
  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [isLight]);

  // Public Client Portal routing state (/tenkhachhang)
  const getInitialSlugFromUrl = (): string | null => {
    try {
      const pathname = window.location.pathname.replace(/^\/+/, '');
      if (pathname && !pathname.startsWith('api') && !pathname.includes('.')) {
        return decodeURIComponent(pathname.split('/')[0]);
      }
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('client')) {
        return searchParams.get('client');
      }
      if (window.location.hash) {
        const hash = window.location.hash.replace(/^#/, '');
        if (hash.startsWith('/')) return decodeURIComponent(hash.substring(1));
        if (hash.startsWith('client=')) return decodeURIComponent(hash.replace('client=', ''));
      }
    } catch (e) {
      console.error('Error parsing route slug:', e);
    }
    return null;
  };

  const [routeClientSlug, setRouteClientSlug] = useState<string | null>(getInitialSlugFromUrl);

  // Listen to popstate (browser back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      setRouteClientSlug(getInitialSlugFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigateToPortal = (slug: string) => {
    setRouteClientSlug(slug);
    try {
      window.history.pushState(null, '', `/${slug}`);
    } catch (e) {}
  };

  const handleBackToAdmin = () => {
    setRouteClientSlug(null);
    try {
      window.history.pushState(null, '', '/');
    } catch (e) {}
  };

  // Navigation tab state with persistence
  const [activeTab, setActiveTabState] = useState<NavTab>(() => {
    try {
      const saved = localStorage.getItem('hudiff_active_tab');
      if (saved) return saved as NavTab;
    } catch (e) {}
    return 'overview';
  });

  const setActiveTab = (tab: NavTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('hudiff_active_tab', tab);
    } catch (e) {}
  };

  const [activeContentSubmodule, setActiveContentSubmodule] = useState<ContentSubmodule>(() => {
    try {
      return localStorage.getItem('hudiff_content_submodule') === 'video_scripts'
        ? 'video_scripts'
        : 'fanpage_weekly';
    } catch (e) {
      return 'fanpage_weekly';
    }
  });
  const selectContentSubmodule = (submodule: ContentSubmodule) => {
    setActiveContentSubmodule(submodule);
    try {
      localStorage.setItem('hudiff_content_submodule', submodule);
    } catch (e) {}
  };

  const [createRequest, setCreateRequest] = useState<{ id: number; type: 'client' | 'design' } | null>(null);
  const openCreateForm = (type: 'client' | 'design') => {
    setQuotationClientId('');
    setCreateRequest((previous) => ({ id: (previous?.id || 0) + 1, type }));
    setActiveTab('clients_designs');
  };
  const openVideoScripts = () => {
    selectContentSubmodule('video_scripts');
    setActiveTab('content_planner');
  };

  // Preselected client when jumping from Client/Design manager to Quotation Generator
  const [quotationClientId, setQuotationClientId] = useState<string>('');

  // Core Data States
  const [clients, setClients] = useState<Client[]>(() => loadClients() || []);
  const [designItems, setDesignItems] = useState<DesignItem[]>(() => loadDesignItems() || []);
  const [quotations, setQuotations] = useState<Quotation[]>(() => loadQuotations() || []);
  const [contents, setContents] = useState<VideoContent[]>(() => loadContents() || []);
  const [pricingBoards, setPricingBoards] = useState<ServicePricingBoard[]>(() => loadPricingBoards() || []);
  const [studioProfile, setStudioProfile] = useState<StudioProfile>(() => loadStudioProfile() || initialStudioProfile);
  const [cloudStatus, setCloudStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');

  // Google Drive state
  const [driveUser, setDriveUser] = useState<any>(null);
  const [isCheckingDrive, setIsCheckingDrive] = useState<boolean>(false);
  const [driveStatusMsg, setDriveStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [driveFolderUrl, setDriveFolderUrl] = useState<string | null>(null);

  // Global Modals
  const [isAIScriptModalOpen, setIsAIScriptModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [settingsSavedToast, setSettingsSavedToast] = useState<boolean>(false);

  // Studio profile form state inside Settings Modal
  const [profileForm, setProfileForm] = useState<StudioProfile>(studioProfile);

  useEffect(() => {
    setProfileForm(studioProfile);
  }, [studioProfile]);

  // Auth listener for Google Drive account
  useEffect(() => {
    const unsub = initAuth(
      (user) => {
        setDriveUser(user);
      },
      () => {
        setDriveUser(null);
      }
    );
    return () => unsub();
  }, []);

  // Connect & Realtime Sync with Firebase Firestore
  useEffect(() => {
    let isMounted = true;

    // Seed data on initial connection if cloud database is empty
    seedCloudIfEmpty().then((isReady) => {
      if (isMounted) setCloudStatus(isReady ? 'connected' : 'offline');
    });

    // Realtime subscribers
    const unsubClients = subscribeClients((updatedClients) => {
      if (isMounted) setClients(updatedClients);
    });

    const unsubDesigns = subscribeDesignItems((updatedDesigns) => {
      if (isMounted) setDesignItems(updatedDesigns);
    });

    const unsubQuotes = subscribeQuotations((updatedQuotes) => {
      if (isMounted) setQuotations(updatedQuotes);
    });

    const unsubContents = subscribeContents((updatedContents) => {
      if (isMounted) setContents(updatedContents);
    });

    const unsubStudio = subscribeStudioProfile((updatedStudio) => {
      if (isMounted) setStudioProfile(updatedStudio);
    });

    const unsubPricing = subscribePricingBoards((updatedBoards) => {
      if (isMounted) setPricingBoards(updatedBoards);
    });

    return () => {
      isMounted = false;
      unsubClients();
      unsubDesigns();
      unsubQuotes();
      unsubContents();
      unsubStudio();
      unsubPricing();
    };
  }, []);

  // Sync theme
  const setTheme = (theme: 'dark' | 'light') => {
    const next = theme === 'light';
    setIsLight(next);
    localStorage.setItem('hudiff_theme', theme);
  };

  // CLIENT CRUD HANDLERS
  const handleAddClient = (newClientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...newClientData,
      id: 'cli-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newClient, ...clients];
    setClients(updated);
    saveClients(updated);
    saveClientToCloud(newClient);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    const updated = clients.map((c) => (c.id === updatedClient.id ? updatedClient : c));
    setClients(updated);
    saveClients(updated);
    saveClientToCloud(updatedClient);
  };

  const handleDeleteClient = (clientId: string) => {
    const updated = clients.filter((c) => c.id !== clientId);
    setClients(updated);
    saveClients(updated);
    deleteClientFromCloud(clientId);
  };

  // DESIGN ITEM CRUD HANDLERS
  const handleAddDesignItem = (itemData: Omit<DesignItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: DesignItem = {
      ...itemData,
      id: 'des-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newItem, ...designItems];
    setDesignItems(updated);
    saveDesignItems(updated);
    saveDesignItemToCloud(newItem);
  };

  const handleUpdateDesignItem = (updatedItem: DesignItem) => {
    const updated = designItems.map((d) => (d.id === updatedItem.id ? updatedItem : d));
    setDesignItems(updated);
    saveDesignItems(updated);
    saveDesignItemToCloud(updatedItem);
  };

  const handleDeleteDesignItem = (itemId: string) => {
    const updated = designItems.filter((d) => d.id !== itemId);
    setDesignItems(updated);
    saveDesignItems(updated);
    deleteDesignItemFromCloud(itemId);
  };

  // QUOTATION HANDLERS
  const handleSaveQuotation = (quotation: Quotation) => {
    const existingIndex = quotations.findIndex((q) => q.id === quotation.id);
    let updated: Quotation[];
    if (existingIndex >= 0) {
      updated = [...quotations];
      updated[existingIndex] = quotation;
    } else {
      updated = [quotation, ...quotations];
    }
    setQuotations(updated);
    saveQuotations(updated);
    saveQuotationToCloud(quotation);
  };

  const handleDeleteQuotation = (quotationId: string) => {
    const updated = quotations.filter((q) => q.id !== quotationId);
    setQuotations(updated);
    saveQuotations(updated);
    deleteQuotationFromCloud(quotationId);
  };

  const handleCreateQuotationForClient = (clientId: string) => {
    setQuotationClientId(clientId);
    setActiveTab('quotations');
  };

  // CONTENT CRUD HANDLERS
  const handleAddContent = (contentData: Omit<VideoContent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newContent: VideoContent = {
      ...contentData,
      id: 'vid-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newContent, ...contents];
    setContents(updated);
    saveContents(updated);
    saveContentToCloud(newContent);
  };

  const handleUpdateContent = (updatedContent: VideoContent) => {
    const updated = contents.map((c) => (c.id === updatedContent.id ? updatedContent : c));
    setContents(updated);
    saveContents(updated);
    saveContentToCloud(updatedContent);
  };

  const handleDeleteContent = (contentId: string) => {
    const updated = contents.filter((c) => c.id !== contentId);
    setContents(updated);
    saveContents(updated);
    deleteContentFromCloud(contentId);
  };

  // Pricing Board Handlers
  const handleSavePricingBoard = (board: ServicePricingBoard) => {
    const exists = pricingBoards.some((b) => b.id === board.id);
    const updated = exists
      ? pricingBoards.map((b) => (b.id === board.id ? board : b))
      : [board, ...pricingBoards];
    setPricingBoards(updated);
    savePricingBoards(updated);
    savePricingBoardToCloud(board);
  };

  const handleDeletePricingBoard = (boardId: string) => {
    const updated = pricingBoards.filter((b) => b.id !== boardId);
    setPricingBoards(updated);
    savePricingBoards(updated);
    deletePricingBoardFromCloud(boardId);
  };

  // Save profile in settings
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setStudioProfile(profileForm);
    saveStudioProfile(profileForm);
    saveStudioProfileToCloud(profileForm);
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 2500);
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const dataStr = storage.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hu_design_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && storage.importAllData(content)) {
        setClients(loadClients());
        setDesignItems(loadDesignItems());
        setQuotations(loadQuotations());
        setContents(loadContents());
        setStudioProfile(loadStudioProfile());
        alert('Đã khôi phục dữ liệu sao lưu thành công!');
        setIsSettingsModalOpen(false);
      } else {
        alert('Lỗi: File sao lưu không hợp lệ.');
      }
    };
    reader.readAsText(file);
  };

  // Reset to default data
  const handleResetData = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại dữ liệu mẫu ban đầu của Hủ Design?')) {
      storage.resetAllData();
      setClients(loadClients());
      setDesignItems(loadDesignItems());
      setQuotations(loadQuotations());
      setContents(loadContents());
      setStudioProfile(loadStudioProfile());
      setIsSettingsModalOpen(false);
    }
  };

  // Google Drive Connection Handlers
  const handleConnectGoogleDrive = async () => {
    setIsCheckingDrive(true);
    setDriveStatusMsg(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        const res = await googleSignIn();
        token = res.accessToken;
        setDriveUser(res.user);
      }
      if (!token) {
        throw new Error('Chưa lấy được mã xác thực Google OAuth.');
      }
      // Test creating or locating root folder 'hudesign-du-an'
      const folder = await findOrCreateFolder(token, 'hudesign-du-an');
      setDriveFolderUrl(folder.webViewLink || null);
      setDriveStatusMsg({
        type: 'success',
        text: `Đã kết nối thành công! Thư mục gốc "${folder.name}" trên Google Drive đã sẵn sàng lưu trữ ảnh demo dự án.`,
      });
    } catch (error: any) {
      console.error('Lỗi kết nối Google Drive:', error);
      setDriveStatusMsg({
        type: 'error',
        text: error.message || 'Không thể kết nối đến Google Drive.',
      });
    } finally {
      setIsCheckingDrive(false);
    }
  };

  const handleDisconnectGoogleDrive = async () => {
    try {
      await logout();
      setDriveUser(null);
      setDriveFolderUrl(null);
      setDriveStatusMsg({
        type: 'info',
        text: 'Đã đăng xuất khỏi tài khoản Google Drive.',
      });
    } catch (err: any) {
      console.error('Lỗi khi đăng xuất:', err);
    }
  };

  // Manual re-sync to Cloud
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const handleManualSyncCloud = async () => {
    setIsSyncingCloud(true);
    try {
      await seedCloudIfEmpty();
      clients.forEach((c) => saveClientToCloud(c));
      designItems.forEach((d) => saveDesignItemToCloud(d));
      quotations.forEach((q) => saveQuotationToCloud(q));
      contents.forEach((c) => saveContentToCloud(c));
      pricingBoards.forEach((b) => savePricingBoardToCloud(b));
      saveStudioProfileToCloud(studioProfile);
      alert('Đã kiểm tra và đồng bộ toàn bộ dữ liệu lên Firebase Firestore thành công!');
    } catch (err: any) {
      alert('Lỗi đồng bộ Cloud: ' + (err.message || err));
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // PUBLIC CLIENT PORTAL VIEW (/tenkhachhang)
  if (routeClientSlug) {
    const matchedClient = findClientBySlug(clients, routeClientSlug);
    return (
      <div className={`min-h-screen transition-colors duration-200 ${!isLight ? 'dark' : ''} ${
        isLight ? 'bg-gray-100 text-gray-900' : 'bg-gray-950 text-gray-100'
      }`}>
        <Suspense fallback={<div className="p-8 text-center text-sm text-neutral-500">Đang tải cổng khách hàng...</div>}>
          <ClientPortalView
            client={matchedClient}
            slug={routeClientSlug}
            designItems={designItems}
            quotations={quotations}
            pricingBoards={pricingBoards}
            studioProfile={studioProfile}
            onBackToAdmin={handleBackToAdmin}
            onRefreshData={handleManualSyncCloud}
            isLight={isLight}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-200 ${!isLight ? 'dark' : ''} ${
      isLight ? 'bg-[#f8f9fa] text-neutral-900' : 'bg-gray-950 text-gray-100'
    }`}>
      {/* Left Sidebar on desktop, top bar + slide drawer on mobile */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeContentSubmodule={activeContentSubmodule}
        onSelectContentSubmodule={(submodule) => {
          selectContentSubmodule(submodule);
          setActiveTab('content_planner');
        }}
        theme={isLight ? 'light' : 'dark'}
        setTheme={setTheme}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenNewClient={() => openCreateForm('client')}
        onOpenNewDesign={() => openCreateForm('design')}
        onOpenAIScript={() => setIsAIScriptModalOpen(true)}
        onOpenNewQuote={() => {
          setQuotationClientId('');
          setActiveTab('quotations');
        }}
        cloudStatus={cloudStatus}
        studioName={studioProfile.name || 'HỦ DESIGN'}
        driveUser={driveUser}
        onConnectDrive={handleConnectGoogleDrive}
        onDisconnectDrive={handleDisconnectGoogleDrive}
        isCheckingDrive={isCheckingDrive}
        driveFolderUrl={driveFolderUrl}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Suspense fallback={<div className="flex min-h-48 items-center justify-center gap-2 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải màn hình...</div>}>
        {activeTab === 'overview' && (
          <OverviewDashboard
            clients={clients}
            designItems={designItems}
            quotations={quotations}
            videos={contents}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenNewDesign={() => openCreateForm('design')}
            onOpenVideoScripts={openVideoScripts}
            onSelectClient={(clientId) => {
              setQuotationClientId(clientId);
              setActiveTab('clients_designs');
            }}
            isLight={isLight}
          />
        )}

        {activeTab === 'clients_designs' && (
          <ClientDesignManager
            clients={clients}
            designItems={designItems}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            onAddDesignItem={handleAddDesignItem}
            onUpdateDesignItem={handleUpdateDesignItem}
            onDeleteDesignItem={handleDeleteDesignItem}
            onCreateQuotationForClient={handleCreateQuotationForClient}
            selectedClientIdProp={quotationClientId}
            createRequest={createRequest}
            onNavigateToClientPortal={handleNavigateToPortal}
            isLight={isLight}
          />
        )}

        {activeTab === 'quotations' && (
          <QuotationGenerator
            clients={clients}
            designItems={designItems}
            quotations={quotations}
            studioProfile={studioProfile}
            onSaveQuotation={handleSaveQuotation}
            onDeleteQuotation={handleDeleteQuotation}
            onAddClient={handleAddClient}
            preSelectedClientId={quotationClientId}
            isLight={isLight}
          />
        )}

        {activeTab === 'pricing_board' && (
          <ServicePricingManager
            pricingBoards={pricingBoards}
            onSaveBoard={handleSavePricingBoard}
            onDeleteBoard={handleDeletePricingBoard}
            studioProfile={studioProfile}
            theme={isLight ? 'light' : 'dark'}
            clients={clients}
            designItems={designItems}
            onUpdateClient={handleUpdateClient}
            onNavigateToClientPortal={handleNavigateToPortal}
          />
        )}

        {activeTab === 'content_planner' && (
          <ContentPlanner
            contents={contents}
            onAddContent={handleAddContent}
            onUpdateContent={handleUpdateContent}
            onDeleteContent={handleDeleteContent}
            studioProfile={studioProfile}
            isLight={isLight}
            activeSubModule={activeContentSubmodule}
            onActiveSubModuleChange={selectContentSubmodule}
          />
        )}
        </Suspense>
      </main>
    </div>

      {/* Global AI Script Modal */}
      {isAIScriptModalOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-50 grid place-items-center bg-black/40 text-sm text-white">Đang mở trợ lý AI...</div>}>
          <AIScriptModal
            isOpen={isAIScriptModalOpen}
            onClose={() => setIsAIScriptModalOpen(false)}
            onSaveContent={(newContent) => {
              handleAddContent(newContent);
              setActiveTab('content_planner');
            }}
            isLight={isLight}
          />
        </Suspense>
      )}

      {/* Settings & Studio Profile Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border shadow-2xl p-6 sm:p-8 space-y-6 ${
            isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-gray-900 border-gray-800 text-gray-100'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold font-display">Cài đặt Studio & Dữ liệu</h3>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cloud Database Status Card */}
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
              isLight ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-emerald-950/30 border-emerald-900 text-emerald-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500 text-white shrink-0 shadow-sm">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                      Cơ sở dữ liệu Cloud Firestore
                    </h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                      ● Đang hoạt động
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Mọi dữ liệu (Khách hàng, Thiết kế, Báo giá, Video) được tự động lưu và đồng bộ thời gian thực vĩnh viễn trên Google Firebase.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Thông tin Thương hiệu & Pháp nhân Studio
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Tên Studio</label>
                  <input
                    type="text"
                    value={profileForm.studioName}
                    onChange={(e) => setProfileForm({ ...profileForm, studioName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-semibold border focus:outline-hidden ${
                      isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-950 border-gray-800 text-white'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Người đại diện / Founder</label>
                  <input
                    type="text"
                    value={profileForm.founder}
                    onChange={(e) => setProfileForm({ ...profileForm, founder: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-xs border focus:outline-hidden ${
                      isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-950 border-gray-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Hotline / Zalo</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-xs border focus:outline-hidden ${
                      isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-950 border-gray-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Email liên hệ</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-xs border focus:outline-hidden ${
                      isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-950 border-gray-800 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Địa chỉ Studio</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg text-xs border focus:outline-hidden ${
                    isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-950 border-gray-800 text-white'
                  }`}
                />
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 pt-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Tài khoản Ngân hàng nhận thanh toán Báo giá
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Ngân hàng</label>
                  <input
                    type="text"
                    value={profileForm.bankName}
                    onChange={(e) => setProfileForm({ ...profileForm, bankName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-xs border focus:outline-hidden ${
                      isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-950 border-gray-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Số tài khoản</label>
                  <input
                    type="text"
                    value={profileForm.bankAccount}
                    onChange={(e) => setProfileForm({ ...profileForm, bankAccount: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-mono font-bold border focus:outline-hidden ${
                      isLight ? 'bg-gray-50 border-gray-200 text-blue-600' : 'bg-gray-950 border-gray-800 text-blue-400'
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Tên chủ tài khoản</label>
                  <input
                    type="text"
                    value={profileForm.bankOwner}
                    onChange={(e) => setProfileForm({ ...profileForm, bankOwner: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-xs uppercase font-semibold border focus:outline-hidden ${
                      isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-950 border-gray-800 text-white'
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">URL Ảnh mã QR Chuyển khoản (Vietcombank)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="url"
                      value={profileForm.bankQrImage || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, bankQrImage: e.target.value })}
                      placeholder="https://..."
                      className={`flex-1 px-3 py-2 rounded-lg text-xs border focus:outline-hidden ${
                        isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-950 border-gray-800 text-white'
                      }`}
                    />
                    {profileForm.bankQrImage && (
                      <img
                        src={profileForm.bankQrImage}
                        alt="QR Preview"
                        className="w-8 h-8 rounded object-contain border border-gray-300 bg-white p-0.5"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {settingsSavedToast ? (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Đã lưu thông tin Studio!
                  </span>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Lưu cấu hình
                </button>
              </div>
            </form>

            {/* Cloud & Google Drive Integrations Status */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" />
                Trạng thái Lưu trữ Đám mây & Google Drive
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Firebase Firestore Cloud Card */}
                <div className={`p-4 rounded-xl border ${
                  isLight ? 'bg-gray-50/70 border-gray-200' : 'bg-gray-950/60 border-gray-800'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Cloud className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100">Firebase Firestore Cloud</h5>
                        <p className="text-[11px] text-gray-500">Cơ sở dữ liệu đám mây Realtime</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Đang hoạt động
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex justify-between">
                      <span>Dự án:</span>
                      <span className="font-mono text-gray-800 dark:text-gray-200 font-semibold">gen-lang-client-0714927107</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dữ liệu trực tuyến:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {clients.length} Khách | {designItems.length} Thiết kế | {quotations.length} Báo giá
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleManualSyncCloud}
                    disabled={isSyncingCloud}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      isLight 
                        ? 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700' 
                        : 'bg-gray-900 hover:bg-gray-800 border-gray-700 text-gray-200'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                    <span>{isSyncingCloud ? 'Đang đồng bộ...' : 'Kiểm tra & Đồng bộ lại Cloud'}</span>
                  </button>
                </div>

                {/* Google Drive Card */}
                <div className={`p-4 rounded-xl border ${
                  isLight ? 'bg-gray-50/70 border-gray-200' : 'bg-gray-950/60 border-gray-800'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100">Google Drive REST API</h5>
                        <p className="text-[11px] text-gray-500">Lưu ảnh demo & thư mục dự án</p>
                      </div>
                    </div>
                    {driveUser ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Check className="w-3 h-3" />
                        Đã kết nối
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Chưa kết nối
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-[11px] text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex justify-between">
                      <span>Thư mục gốc:</span>
                      <span className="font-mono text-gray-800 dark:text-gray-200 font-semibold">hudesign-du-an</span>
                    </div>
                    <div className="flex justify-between truncate">
                      <span>Tài khoản:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 truncate ml-2">
                        {driveUser?.email || 'Chưa đăng nhập'}
                      </span>
                    </div>
                  </div>

                  {driveStatusMsg && (
                    <div className={`p-2 rounded-lg text-[11px] mb-2.5 border ${
                      driveStatusMsg.type === 'success' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                        : driveStatusMsg.type === 'error'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                        : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                    }`}>
                      {driveStatusMsg.text}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleConnectGoogleDrive}
                      disabled={isCheckingDrive}
                      className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      {isCheckingDrive ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang kiểm tra...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-3.5 h-3.5" />
                          <span>{driveUser ? 'Kiểm tra lại kết nối' : 'Đăng nhập Google Drive'}</span>
                        </>
                      )}
                    </button>

                    {driveFolderUrl && (
                      <a
                        href={driveFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`p-1.5 rounded-lg border transition ${
                          isLight ? 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700' : 'bg-gray-900 hover:bg-gray-800 border-gray-700 text-gray-200'
                        }`}
                        title="Mở thư mục trên Google Drive"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {driveUser && (
                      <button
                        type="button"
                        onClick={handleDisconnectGoogleDrive}
                        className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition cursor-pointer"
                        title="Đăng xuất tài khoản Google"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Sao lưu & Quản lý Dữ liệu
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleExportBackup}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
                    isLight ? 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700' : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Xuất bản sao lưu (JSON)
                </button>

                <label className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
                  isLight ? 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700' : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200'
                }`}>
                  <Upload className="w-3.5 h-3.5" />
                  Khôi phục từ file JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleResetData}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Đặt lại dữ liệu ban đầu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
