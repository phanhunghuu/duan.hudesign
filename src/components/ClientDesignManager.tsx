import React, { useState, useEffect, useRef } from 'react';
import { Client, DesignItem, DesignImage, DesignStatus, ProjectStatus, PriorityLevel, DesignCategory } from '../types';
import { formatVND, formatDate, getDesignStatusBadge, getPriorityBadge, getProjectStatusBadge, getRelativeTime } from '../utils/formatters';
import { 
  Users, 
  Palette, 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  ExternalLink, 
  Image as ImageIcon, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Trash2, 
  FileSpreadsheet, 
  MessageSquare, 
  ArrowUpRight,
  Eye,
  AlertCircle,
  Tag,
  Briefcase,
  Upload,
  CloudUpload,
  HardDrive,
  Folder,
  FolderOpen,
  FolderPlus,
  Link2,
  Check,
  Loader2,
  ImagePlus,
  Images,
  Sparkles,
  Paperclip,
  Maximize2,
  X,
  Share2,
  Flame,
  Zap,
  Info
} from 'lucide-react';
import { googleSignIn, getAccessToken, initAuth } from '../utils/googleAuth';
import { ensureClientFolderStructure, ensureDesignItemFolderStructure, uploadDemoImageToDrive, dataURLToBlob } from '../utils/googleDrive';
import { ClientShareLinkModal } from './ClientShareLinkModal';
import { calculatePackageQuota, getClientSlug, getRecommendedPostQuota, getCurrentMonthKey } from '../utils/slugUtils';

interface ClientDesignManagerProps {
  clients: Client[];
  designItems: DesignItem[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onAddDesignItem: (item: Omit<DesignItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateDesignItem: (item: DesignItem) => void;
  onDeleteDesignItem: (itemId: string) => void;
  onCreateQuotationForClient: (clientId: string) => void;
  selectedClientIdProp?: string;
  onNavigateToClientPortal?: (slug: string) => void;
  isLight: boolean;
}

const CATEGORIES: DesignCategory[] = [
  'Branding & Logo',
  'Packaging & Bao bì',
  'Social Media & Quảng cáo',
  'UI/UX Website & App',
  'Ấn phẩm in ấn (Brochure/Catalogue)',
  'Key Visual & Poster',
  '3D & Motion Graphic',
  'Khác',
];

export const ClientDesignManager: React.FC<ClientDesignManagerProps> = ({
  clients = [],
  designItems = [],
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onAddDesignItem,
  onUpdateDesignItem,
  onDeleteDesignItem,
  onCreateQuotationForClient,
  selectedClientIdProp,
  onNavigateToClientPortal,
  isLight,
}) => {
  const safeClients = clients || [];
  const safeDesignItems = designItems || [];

  // State for active client selection
  const [selectedClientId, setSelectedClientId] = useState<string>(
    selectedClientIdProp || (safeClients[0]?.id ?? '')
  );

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState<string>('all');
  const [designStatusFilter, setDesignStatusFilter] = useState<string>('all');

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [editingDesignItem, setEditingDesignItem] = useState<DesignItem | null>(null);

  const [viewingBriefItem, setViewingBriefItem] = useState<DesignItem | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Form states for Client Modal
  const [clientForm, setClientForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    status: 'active' as ProjectStatus,
    notes: '',
    avatar: '',
  });

  // Local representation of an image in the design item
  interface LocalDesignImage {
    id: string;
    previewUrl: string;
    name: string;
    blob?: Blob;
    driveFileId?: string;
    driveFileUrl?: string;
    driveThumbnailUrl?: string;
  }

  // Form states for Design Item Modal
  const [designForm, setDesignForm] = useState({
    clientId: selectedClientId,
    title: '',
    category: 'Branding & Logo' as DesignCategory,
    brief: '',
    moodboardUrls: '',
    demoImageUrl: '',
    driveFileId: '',
    driveFileUrl: '',
    driveThumbnailUrl: '',
    driveFolderId: '',
    driveFolderUrl: '',
    clientFolderUrl: '',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'medium' as PriorityLevel,
    status: 'todo' as DesignStatus,
    unitPrice: 5000000,
    quantity: 1,
    unit: 'Gói',
    deliverables: '',
    clientFeedback: '',
    postQuota: 1, // Số post tính vào gói tháng (1: 1 hình, 2: multi 4 hình, 3: 5+ hình)
    targetMonth: getCurrentMonthKey(),
  });

  // Multiple images state for the design item being created/edited
  const [designImages, setDesignImages] = useState<LocalDesignImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [previewModalImage, setPreviewModalImage] = useState<{ url: string; name?: string; driveUrl?: string } | null>(null);

  // Google Drive upload & auth states
  const [isUploadingToDrive, setIsUploadingToDrive] = useState<boolean>(false);
  const [driveUploadSuccess, setDriveUploadSuccess] = useState<string | null>(null);
  const [driveUploadError, setDriveUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to append multiple files to designImages
  const handleFilesSelect = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setDriveUploadError('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP, GIF, SVG)');
      return;
    }

    const newImages: LocalDesignImage[] = imageFiles.map((file, idx) => ({
      id: `local-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      previewUrl: URL.createObjectURL(file),
      name: file.name || `Hình ảnh ${designImages.length + idx + 1}`,
      blob: file,
    }));

    setDesignImages((prev) => [...prev, ...newImages]);
    setDriveUploadSuccess(null);
    setDriveUploadError(null);
  };

  // Clipboard paste handler (supports multiple images or sequential pasting)
  useEffect(() => {
    if (!isDesignModalOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            pastedFiles.push(file);
          }
        }
      }

      if (pastedFiles.length > 0) {
        e.preventDefault();
        handleFilesSelect(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [isDesignModalOpen, designImages.length]);

  // Remove one image from current design item
  const handleRemoveImage = (id: string) => {
    setDesignImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Set an image as primary cover image (moves to index 0)
  const handleSetAsPrimaryImage = (id: string) => {
    setDesignImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (!target) return prev;
      return [target, ...prev.filter((img) => img.id !== id)];
    });
  };

  // Upload ALL Images into a specific Sub-folder on Google Drive
  // Hierarchy: hudesign-du-an / [Tên Khách Hàng - Doanh nghiệp] / [Tên Bài Thiết Kế]
  const handleUploadDemoToDrive = async () => {
    if (designImages.length === 0) {
      setDriveUploadError('Vui lòng thêm ít nhất 1 hình ảnh (dán Ctrl+V, kéo thả hoặc chọn từ máy) trước khi tải lên.');
      return;
    }

    try {
      setIsUploadingToDrive(true);
      setDriveUploadError(null);
      setDriveUploadSuccess(null);

      // 1. Get or request Google OAuth Token
      let token = await getAccessToken();
      if (!token) {
        const authRes = await googleSignIn();
        token = authRes.accessToken;
      }

      if (!token) {
        throw new Error('Chưa thể kết nối Google Drive. Vui lòng cấp quyền truy cập.');
      }

      // 2. Identify target client info
      const targetClient = safeClients.find((c) => c.id === designForm.clientId) || activeClient;
      const clientName = targetClient?.name || 'Khách hàng';
      const clientCompany = targetClient?.company || '';

      // 3. Ensure 3-level Folder Hierarchy:
      // hudesign-du-an / [Client Folder] / [Design Item Subfolder]
      const designTitle = designForm.title.trim() || 'Bài thiết kế';
      const { rootFolder, clientFolder, designFolder } = await ensureDesignItemFolderStructure(
        token,
        clientName,
        clientCompany,
        designTitle
      );

      // 4. Sequentially upload each image into the designFolder
      const updatedImages = [...designImages];
      const safeTitle = (designTitle || 'san-pham').replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9\- ]/g, '');
      const timeStamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      let successCount = 0;

      for (let i = 0; i < updatedImages.length; i++) {
        const itemImg = updatedImages[i];
        setUploadProgress({ current: i + 1, total: updatedImages.length });

        let blobToUpload = itemImg.blob;
        if (!blobToUpload && itemImg.previewUrl.startsWith('data:')) {
          blobToUpload = dataURLToBlob(itemImg.previewUrl);
        } else if (!blobToUpload && itemImg.previewUrl.startsWith('blob:')) {
          try {
            const res = await fetch(itemImg.previewUrl);
            blobToUpload = await res.blob();
          } catch (e) {
            console.warn('Lỗi đọc blob của ảnh:', e);
          }
        }

        if (blobToUpload) {
          const fileName = `${safeTitle} - Hình ${i + 1} - ${timeStamp}.png`;
          const uploadResult = await uploadDemoImageToDrive(token, designFolder.id, blobToUpload, fileName);

          updatedImages[i] = {
            ...itemImg,
            driveFileId: uploadResult.fileId,
            driveFileUrl: uploadResult.webViewLink,
            driveThumbnailUrl: uploadResult.thumbnailLink || itemImg.previewUrl,
          };
          successCount++;
        } else if (itemImg.driveFileUrl) {
          successCount++;
        }
      }

      setDesignImages(updatedImages);

      // 5. Update designForm with subfolder URL and primary image URL
      const primaryImg = updatedImages[0];
      setDesignForm((prev) => ({
        ...prev,
        demoImageUrl: primaryImg?.previewUrl || prev.demoImageUrl,
        driveFileId: primaryImg?.driveFileId || prev.driveFileId,
        driveFileUrl: primaryImg?.driveFileUrl || prev.driveFileUrl,
        driveThumbnailUrl: primaryImg?.driveThumbnailUrl || prev.driveThumbnailUrl,
        driveFolderId: designFolder.id,
        driveFolderUrl: designFolder.webViewLink,
        clientFolderUrl: clientFolder.webViewLink,
      }));

      setDriveUploadSuccess(
        `Đã tạo thư mục con "${designFolder.name}" và tải ${successCount} ảnh lên Google Drive thành công!`
      );
    } catch (err: any) {
      console.error('Lỗi khi tải ảnh lên Google Drive:', err);
      setDriveUploadError(err.message || 'Tải ảnh lên Google Drive thất bại.');
    } finally {
      setIsUploadingToDrive(false);
      setUploadProgress(null);
    }
  };

  // Filter clients
  const filteredClients = safeClients.filter((c) => {
    if (!c) return false;
    const matchesSearch =
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = clientStatusFilter === 'all' || c.status === clientStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Current active client
  const activeClient = safeClients.find((c) => c?.id === selectedClientId) || safeClients[0];

  // Current client's design items
  const currentClientItems = safeDesignItems.filter((d) => d && d.clientId === activeClient?.id);
  const filteredDesignItems = currentClientItems.filter((item) => {
    if (!item) return false;
    const matchesStatus = designStatusFilter === 'all' || item.status === designStatusFilter;
    return matchesStatus;
  });

  // Client Modal Handlers
  const handleOpenAddClient = () => {
    setEditingClient(null);
    setClientForm({
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      status: 'active',
      notes: '',
      avatar: '',
    });
    setIsClientModalOpen(true);
  };

  const handleOpenEditClient = (client: Client) => {
    setEditingClient(client);
    setClientForm({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      address: client.address || '',
      taxId: client.taxId || '',
      status: client.status,
      notes: client.notes || '',
      avatar: client.avatar || '',
    });
    setIsClientModalOpen(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.company) return;

    if (editingClient) {
      onUpdateClient({
        ...editingClient,
        ...clientForm,
      });
    } else {
      onAddClient(clientForm);
    }
    setIsClientModalOpen(false);
  };

  // Design Item Modal Handlers
  const handleOpenAddDesign = () => {
    if (!activeClient) return;
    setEditingDesignItem(null);
    setDesignImages([]);
    setDriveUploadSuccess(null);
    setDriveUploadError(null);
    setDesignForm({
      clientId: activeClient.id,
      title: '',
      category: 'Branding & Logo',
      brief: '',
      moodboardUrls: '',
      demoImageUrl: '',
      driveFileId: '',
      driveFileUrl: '',
      driveThumbnailUrl: '',
      driveFolderId: '',
      driveFolderUrl: '',
      clientFolderUrl: '',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'medium',
      status: 'todo',
      unitPrice: 5000000,
      quantity: 1,
      unit: 'Gói',
      deliverables: '',
      clientFeedback: '',
      postQuota: 1,
      targetMonth: getCurrentMonthKey(),
    });
    setIsDesignModalOpen(true);
  };

  const handleOpenEditDesign = (item: DesignItem) => {
    setEditingDesignItem(item);
    setDriveUploadSuccess(null);
    setDriveUploadError(null);

    // Initialize images from item.demoImages or legacy demoImageUrl
    let initialImages: LocalDesignImage[] = [];
    if (item.demoImages && item.demoImages.length > 0) {
      initialImages = item.demoImages.map((img, idx) => ({
        id: img.id || `img-${idx}-${Date.now()}`,
        previewUrl: img.url,
        name: img.name || `Hình ${idx + 1}`,
        driveFileId: img.driveFileId,
        driveFileUrl: img.driveFileUrl,
        driveThumbnailUrl: img.driveThumbnailUrl,
      }));
    } else if (item.demoImageUrl) {
      initialImages = [{
        id: `img-legacy-${Date.now()}`,
        previewUrl: item.demoImageUrl,
        name: 'Ảnh chính',
        driveFileId: item.driveFileId,
        driveFileUrl: item.driveFileUrl,
        driveThumbnailUrl: item.driveThumbnailUrl,
      }];
    }
    setDesignImages(initialImages);

    setDesignForm({
      clientId: item.clientId,
      title: item.title,
      category: item.category,
      brief: item.brief,
      moodboardUrls: item.moodboardUrls?.join('\n') || '',
      demoImageUrl: item.demoImageUrl || '',
      driveFileId: item.driveFileId || '',
      driveFileUrl: item.driveFileUrl || '',
      driveThumbnailUrl: item.driveThumbnailUrl || '',
      driveFolderId: item.driveFolderId || '',
      driveFolderUrl: item.driveFolderUrl || '',
      clientFolderUrl: item.clientFolderUrl || '',
      deadline: item.deadline,
      priority: item.priority,
      status: item.status,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      unit: item.unit,
      deliverables: item.deliverables || '',
      clientFeedback: item.clientFeedback || '',
      postQuota: typeof item.postQuota === 'number' && item.postQuota > 0 ? item.postQuota : 1,
      targetMonth: item.targetMonth || (item.deadline ? item.deadline.substring(0, 7) : getCurrentMonthKey()),
    });
    setIsDesignModalOpen(true);
  };

  const handleSaveDesign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!designForm.title || !designForm.clientId) return;

    const urls = designForm.moodboardUrls
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    const client = clients.find((c) => c.id === designForm.clientId);
    const clientName = client?.company || client?.name || 'Khách hàng';

    // Map designImages to DesignImage[] for storage
    const mappedImages: DesignImage[] = designImages.map((img) => ({
      id: img.id,
      url: img.previewUrl,
      name: img.name,
      driveFileId: img.driveFileId,
      driveFileUrl: img.driveFileUrl,
      driveThumbnailUrl: img.driveThumbnailUrl,
      uploadedAt: new Date().toISOString(),
    }));

    const primaryImg = mappedImages[0];

    const designPayload = {
      ...designForm,
      clientName,
      moodboardUrls: urls,
      demoImageUrl: primaryImg?.url || designForm.demoImageUrl || '',
      demoImages: mappedImages,
      driveFileId: primaryImg?.driveFileId || designForm.driveFileId || '',
      driveFileUrl: primaryImg?.driveFileUrl || designForm.driveFileUrl || '',
      driveThumbnailUrl: primaryImg?.driveThumbnailUrl || designForm.driveThumbnailUrl || '',
      driveFolderId: designForm.driveFolderId || '',
      driveFolderUrl: designForm.driveFolderUrl || '',
      clientFolderUrl: designForm.clientFolderUrl || '',
    };

    if (editingDesignItem) {
      onUpdateDesignItem({
        ...editingDesignItem,
        ...designPayload,
      });
    } else {
      onAddDesignItem(designPayload);
    }
    setIsDesignModalOpen(false);
  };

  const handleQuickStatusChange = (item: DesignItem, newStatus: DesignStatus) => {
    onUpdateDesignItem({
      ...item,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Quản lý Thiết kế & Khách hàng
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Theo dõi kế hoạch thiết kế (Design Plan), brief, moodboard và xuất báo giá cho từng đối tác
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddClient}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              isLight 
                ? 'bg-white hover:bg-neutral-50 text-neutral-850 border-neutral-300/80 shadow-2xs' 
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-100 border-neutral-700'
            }`}
          >
            + Khách hàng mới
          </button>
          <button
            onClick={handleOpenAddDesign}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-black text-white rounded-xl shadow-2xs transition cursor-pointer"
          >
            + Thêm việc thiết kế
          </button>
        </div>
      </div>

      {/* Main Layout: Left Sidebar Clients List + Right Main Design Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols): Clients Directory */}
        <div className={`lg:col-span-4 rounded-2xl border p-4 sm:p-5 space-y-4 ${
          isLight ? 'bg-white border-neutral-200/90 shadow-2xs' : 'bg-neutral-900 border-neutral-800'
        }`}>
          {/* Search & Status Filter for Clients */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm khách hàng hoặc công ty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition focus:outline-hidden ${
                  isLight 
                    ? 'bg-white border-neutral-200/90 focus:border-neutral-400 text-neutral-900 placeholder:text-neutral-400' 
                    : 'bg-neutral-950 border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-600'
                }`}
              />
            </div>

            {/* Status Pills Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'active', label: 'Đang hợp tác' },
                { id: 'pending', label: 'Chờ' },
                { id: 'completed', label: 'Xong' },
              ].map((tab) => {
                const isActive = clientStatusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setClientStatusFilter(tab.id)}
                    className={`px-3.5 py-1 rounded-full text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-neutral-900 text-white shadow-2xs'
                        : isLight
                        ? 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Client List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredClients.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                Không tìm thấy khách hàng phù hợp.
              </div>
            ) : (
              filteredClients.map((client) => {
                const isSelected = selectedClientId === client.id;
                const clientItems = designItems.filter((d) => d.clientId === client.id);
                const activeCount = clientItems.filter((d) => d.status === 'in_progress' || d.status === 'review').length;
                const statusBadge = getProjectStatusBadge(client.status);

                return (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? isLight
                          ? 'bg-[#fffdfb] border-[#b4532c]/80 shadow-2xs ring-1 ring-[#b4532c]/20'
                          : 'bg-neutral-800/80 border-[#b4532c]/80 shadow-md ring-1 ring-[#b4532c]/30'
                        : isLight
                        ? 'bg-white hover:bg-neutral-50/80 border-neutral-200/80 shadow-2xs'
                        : 'bg-neutral-900 hover:bg-neutral-800/70 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        {client.avatar ? (
                          <img
                            src={client.avatar}
                            alt={client.name}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold flex items-center justify-center text-xs shrink-0 tracking-wider">
                            {client.company ? client.company.slice(0, 2).toUpperCase() : client.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold truncate text-neutral-900 dark:text-neutral-100 group-hover:text-black dark:group-hover:text-white transition">
                            {client.company}
                          </h4>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{client.name}</p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                        client.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                          : client.status === 'completed'
                          ? 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200/80'
                      }`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span>
                        <strong className="text-neutral-800 dark:text-neutral-200 font-semibold">{clientItems.length}</strong> sản phẩm thiết kế
                      </span>
                      {activeCount > 0 && (
                        <span className="text-[#b4532c] dark:text-amber-400 font-semibold">
                          {activeCount} đang làm
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (8 cols): Selected Client's Detail & Design Plan */}
        <div className="lg:col-span-8 space-y-6">
          {activeClient ? (
            <>
              {/* Active Client Info Banner */}
              <div className={`p-5 sm:p-6 rounded-2xl border transition ${
                isLight ? 'bg-white border-neutral-200/90 shadow-2xs' : 'bg-neutral-900 border-neutral-800'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {activeClient.avatar ? (
                      <img
                        src={activeClient.avatar}
                        alt={activeClient.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-2xl object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-850 dark:text-neutral-100 font-bold flex items-center justify-center text-base tracking-wider shrink-0">
                        {activeClient.company ? activeClient.company.slice(0, 2).toUpperCase() : activeClient.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                          {activeClient.company}
                        </h3>
                        <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
                          activeClient.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                            : activeClient.status === 'completed'
                            ? 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200/80'
                        }`}>
                          {getProjectStatusBadge(activeClient.status).label}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        Liên hệ: <strong className="text-neutral-800 dark:text-neutral-200">{activeClient.name}</strong> • {activeClient.phone || 'Chưa có SĐT'} {activeClient.email && `• ${activeClient.email}`}
                      </p>
                      {activeClient.address && (
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate max-w-xl">
                          📍 {activeClient.address}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions for active client */}
                  <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-black text-white shadow-2xs transition cursor-pointer"
                      title="Xuất đường link khách xem trực tiếp (/tenkhachhang)"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Link Khách Xem (/{activeClient.slug || getClientSlug(activeClient)})</span>
                    </button>
                    <button
                      onClick={() => onCreateQuotationForClient(activeClient.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#b4532c] hover:bg-[#9a4320] text-white shadow-2xs transition cursor-pointer"
                      title="Lập bảng thống kê & Báo giá cho khách này"
                    >
                      Tạo Báo giá
                    </button>
                    <button
                      onClick={() => handleOpenEditClient(activeClient)}
                      className={`p-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                        isLight 
                          ? 'border-neutral-200/90 bg-white hover:bg-neutral-50 text-neutral-700' 
                          : 'border-neutral-700 bg-neutral-800 hover:bg-neutral-750 text-neutral-300'
                      }`}
                      title="Chỉnh sửa thông tin khách hàng"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Package Quota Tracker Bar */}
                {(() => {
                  const quotaStats = calculatePackageQuota(activeClient, safeDesignItems);
                  return (
                    <div className={`mt-4 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isLight ? 'bg-[#fffdfb] border-orange-200/60' : 'bg-neutral-950/60 border-neutral-800'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                              {quotaStats.packageName} ({quotaStats.targetMonthLabel})
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200/80">
                              CÒN LẠI: {quotaStats.remainingQuota} / {quotaStats.totalQuota} POST
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                            Đã thực hiện: <strong>{quotaStats.usedQuota} post</strong> • Tự động đồng bộ link khách xem
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-56">
                        <div className="flex-1">
                          <div className="flex justify-between text-[11px] font-medium mb-1 text-neutral-500">
                            <span>Tiến độ gói:</span>
                            <span>{quotaStats.usagePercent}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                quotaStats.usagePercent >= 100 ? 'bg-rose-500' : quotaStats.usagePercent >= 80 ? 'bg-amber-500' : 'bg-neutral-900 dark:bg-white'
                              }`}
                              style={{ width: `${Math.min(100, quotaStats.usagePercent)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {activeClient.notes && (
                  <div className={`mt-3.5 p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    isLight 
                      ? 'bg-neutral-50 border-neutral-200 text-neutral-700' 
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-300'
                  }`}>
                    <MessageSquare className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span><strong>Ghi chú dự án:</strong> {activeClient.notes}</span>
                  </div>
                )}
              </div>

              {/* Design Plan (Kế hoạch thiết kế) Header & Filter */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                      Kế hoạch thiết kế ({currentClientItems.length} sản phẩm)
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Danh mục ấn phẩm, brief, moodboard và tiến độ hoàn thiện
                    </p>
                  </div>

                  {/* Filter by Status */}
                  <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'todo', label: 'Chưa làm' },
                      { id: 'in_progress', label: 'Đang làm' },
                      { id: 'review', label: 'Chờ duyệt' },
                      { id: 'done', label: 'Hoàn thiện' },
                    ].map((tab) => {
                      const isActive = designStatusFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setDesignStatusFilter(tab.id)}
                          className={`px-3.5 py-1 rounded-full text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                            isActive
                              ? 'bg-neutral-900 text-white shadow-2xs'
                              : isLight
                              ? 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* List of Design Deliverables */}
                {filteredDesignItems.length === 0 ? (
                  <div className={`text-center py-12 rounded-xl border ${
                    isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900/40 border-gray-800'
                  }`}>
                    <Palette className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chưa có sản phẩm thiết kế nào trong danh mục này</p>
                    <p className="text-xs text-gray-400 mt-1">Bấm nút bên dưới để tạo hạng mục thiết kế đầu tiên cho {activeClient.company}.</p>
                    <button
                      onClick={handleOpenAddDesign}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm sản phẩm thiết kế
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {filteredDesignItems.map((item) => {
                      const statusBadge = getDesignStatusBadge(item.status);
                      const priorityBadge = getPriorityBadge(item.priority);
                      const relativeTime = getRelativeTime(item.deadline);

                      return (
                        <div
                          key={item.id}
                          className={`p-5 rounded-2xl border transition-all ${
                            isLight 
                              ? 'bg-white hover:border-neutral-300 border-neutral-200/90 shadow-2xs' 
                              : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                                  item.priority === 'urgent'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : item.priority === 'high'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                                }`}>
                                  {priorityBadge.label}
                                </span>
                                <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                                  isLight ? 'bg-neutral-100 text-neutral-700' : 'bg-neutral-800 text-neutral-300'
                                }`}>
                                  {item.category}
                                </span>
                                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 flex items-center gap-1">
                                  Tính {item.postQuota || 1} post
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-[#b4532c]">
                                  {formatVND(item.unitPrice)} / {item.unit}
                                </span>
                              </div>

                              <h4 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mt-1">
                                {item.title}
                              </h4>

                              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                                {item.brief || 'Chưa có ghi chú mô tả'}
                              </p>
                            </div>

                            {/* Status Quick Switch Dropdown */}
                            <div className="flex items-center gap-2 self-end sm:self-start">
                              <select
                                value={item.status}
                                onChange={(e) => handleQuickStatusChange(item, e.target.value as DesignStatus)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition cursor-pointer focus:outline-hidden ${
                                  item.status === 'done'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : item.status === 'review'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : item.status === 'in_progress'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : isLight
                                    ? 'bg-white text-neutral-700 border-neutral-200/90'
                                    : 'bg-neutral-800 text-neutral-200 border-neutral-700'
                                }`}
                              >
                                <option value="todo">Chưa làm</option>
                                <option value="in_progress">Đang làm</option>
                                <option value="review">Chờ duyệt</option>
                                <option value="done">Hoàn thành</option>
                              </select>

                              <button
                                onClick={() => handleOpenEditDesign(item)}
                                className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                                  isLight ? 'border-neutral-200/90 bg-white hover:bg-neutral-50 text-neutral-700' : 'border-neutral-700 bg-neutral-800 hover:bg-neutral-750 text-neutral-300'
                                }`}
                                title="Chỉnh sửa"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onDeleteDesignItem(item.id)}
                                className="p-2 rounded-xl border border-neutral-200/90 dark:border-neutral-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-neutral-400 hover:text-rose-600 transition cursor-pointer"
                                title="Xóa hạng mục"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Demo Images Gallery & Subfolder Google Drive preview */}
                          {(() => {
                            const itemImages = (item.demoImages && item.demoImages.length > 0)
                              ? item.demoImages
                              : (item.demoImageUrl ? [{ id: 'legacy-1', url: item.demoImageUrl, driveFileUrl: item.driveFileUrl, driveThumbnailUrl: item.driveThumbnailUrl, name: 'Ảnh demo' }] : []);
                            
                            const hasImagesOrDrive = itemImages.length > 0 || item.driveFolderUrl || item.driveFileUrl;
                            if (!hasImagesOrDrive) return null;

                            return (
                              <div className={`mt-3 p-3.5 rounded-xl border flex flex-col gap-3 ${
                                isLight 
                                  ? 'bg-[#f8f9fa] border-neutral-200/80 text-neutral-800' 
                                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-200'
                              }`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                      Bộ ảnh thiết kế ({itemImages.length} hình)
                                    </div>

                                    {item.driveFolderUrl && (
                                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                        Thư mục riêng: {item.title}
                                      </span>
                                    )}
                                  </div>

                                  {/* Quick links to Google Drive subfolder & client folder */}
                                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                                    {item.driveFolderUrl && (
                                      <a
                                        href={item.driveFolderUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-black text-white flex items-center gap-1.5 shadow-2xs transition"
                                        title="Mở thư mục con của bài thiết kế này trên Google Drive"
                                      >
                                        <FolderOpen className="w-3.5 h-3.5" />
                                        <span>Thư mục bài này</span>
                                      </a>
                                    )}

                                    {item.clientFolderUrl && (
                                      <a
                                        href={item.clientFolderUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1 transition ${
                                          isLight 
                                            ? 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200/90' 
                                            : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border-neutral-700'
                                        }`}
                                        title="Mở thư mục gốc của khách hàng trên Google Drive"
                                      >
                                        <Folder className="w-3 h-3 text-amber-500" />
                                        <span className="hidden sm:inline">Thư mục khách</span>
                                      </a>
                                    )}

                                    {item.driveFileUrl && !item.driveFolderUrl && (
                                      <a
                                        href={item.driveFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 shadow-2xs transition"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        Mở Drive
                                      </a>
                                    )}
                                  </div>
                                </div>

                                {/* Images Thumbnail Strip */}
                                {itemImages.length > 0 && (
                                  <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                                    {itemImages.slice(0, 5).map((img, idx) => (
                                      <div
                                        key={img.id || idx}
                                        onClick={() => setPreviewModalImage({ url: img.url, name: img.name || `${item.title} - Hình ${idx + 1}`, driveUrl: img.driveFileUrl })}
                                        className="relative group/thumb cursor-pointer shrink-0 rounded-lg overflow-hidden border border-blue-200 dark:border-blue-800 hover:border-blue-500 transition shadow-2xs"
                                        title={img.name || `Hình ${idx + 1} (Bấm để xem phóng to)`}
                                      >
                                        <img
                                          src={img.url}
                                          alt={img.name || `Hình ${idx + 1}`}
                                          referrerPolicy="no-referrer"
                                          className="w-14 h-14 object-cover group-hover/thumb:scale-105 transition duration-200"
                                        />
                                        {idx === 0 && (
                                          <span className="absolute bottom-0.5 left-0.5 px-1 py-0.2 rounded bg-black/70 text-white text-[9px] font-bold">
                                            Chính
                                          </span>
                                        )}
                                        <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover/thumb:opacity-100 transition flex items-center justify-center text-white">
                                          <Maximize2 className="w-3.5 h-3.5 drop-shadow" />
                                        </div>
                                      </div>
                                    ))}

                                    {itemImages.length > 5 && (
                                      <button
                                        type="button"
                                        onClick={() => setViewingBriefItem(item)}
                                        className={`w-14 h-14 rounded-lg border flex flex-col items-center justify-center font-bold text-xs shrink-0 transition ${
                                          isLight 
                                            ? 'bg-blue-100/70 hover:bg-blue-200/80 text-blue-800 border-blue-200' 
                                            : 'bg-blue-900/30 hover:bg-blue-900/60 text-blue-300 border-blue-800'
                                        }`}
                                      >
                                        <span>+{itemImages.length - 5}</span>
                                        <span className="text-[9px] font-normal">ảnh nữa</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Moodboard & Deliverables Snippet */}
                          <div className="mt-4 pt-3.5 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3">
                              {item.moodboardUrls && item.moodboardUrls.length > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <ImageIcon className="w-3.5 h-3.5 text-neutral-500" />
                                  <span className="text-neutral-500 dark:text-neutral-400 font-medium">Moodboard:</span>
                                  <div className="flex items-center -space-x-2">
                                    {item.moodboardUrls.slice(0, 3).map((url, i) => (
                                      <a
                                        key={i}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block relative group/img"
                                      >
                                        <img
                                          src={url}
                                          alt="Moodboard"
                                          referrerPolicy="no-referrer"
                                          className="w-6 h-6 rounded-md object-cover border border-neutral-200 dark:border-neutral-700 hover:scale-125 transition z-10 hover:z-20"
                                        />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-neutral-400 text-[11px]">Chưa đính kèm moodboard</span>
                              )}

                              {item.clientFeedback && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-medium border border-amber-200 dark:border-amber-800">
                                  <MessageSquare className="w-3 h-3" />
                                  Có phản hồi mới
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                                <span>Hạn: <strong className="text-neutral-800 dark:text-neutral-200">{formatDate(item.deadline)}</strong></span>
                                <span className="text-[11px] text-[#b4532c] dark:text-amber-400 font-medium">({relativeTime})</span>
                              </div>

                              <button
                                onClick={() => setViewingBriefItem(item)}
                                className="text-xs font-semibold text-neutral-800 hover:text-black dark:text-neutral-200 dark:hover:text-white flex items-center gap-1 transition cursor-pointer"
                              >
                                <span>Chi tiết Brief</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-zinc-500">
              Vui lòng chọn một khách hàng từ danh sách bên trái.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Add/Edit Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className={`w-full max-w-xl rounded-2xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto ${
            isLight ? 'bg-white border-gray-200 text-gray-900 shadow-xl' : 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl'
          }`}>
            <div className={`px-6 py-4 border-b shrink-0 flex items-center justify-between ${isLight ? 'border-gray-200 bg-white' : 'border-zinc-800 bg-zinc-900'}`}>
              <h3 className={`text-base sm:text-lg font-bold font-display flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-zinc-100'}`}>
                <Users className="w-5 h-5 text-cyan-500" />
                {editingClient ? 'Chỉnh sửa thông tin Khách hàng' : 'Thêm Khách hàng mới cho Hủ Design'}
              </h3>
              <button
                type="button"
                onClick={() => setIsClientModalOpen(false)}
                className={`p-1.5 rounded-lg text-xs font-semibold transition ${isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-zinc-800 text-zinc-400'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Tên khách hàng / Đại diện *</label>
                    <input
                      type="text"
                      required
                      value={clientForm.name}
                      onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                      placeholder="VD: Nguyễn Văn A"
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition ${
                        isLight 
                          ? 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Tên Thương hiệu / Doanh nghiệp *</label>
                    <input
                      type="text"
                      required
                      value={clientForm.company}
                      onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                      placeholder="VD: The Vintage Roastery"
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition ${
                        isLight 
                          ? 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Số điện thoại / Zalo</label>
                    <input
                      type="text"
                      value={clientForm.phone}
                      onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                      placeholder="0901 234 567"
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition ${
                        isLight 
                          ? 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Email liên hệ</label>
                    <input
                      type="email"
                      value={clientForm.email}
                      onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                      placeholder="client@brand.com"
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition ${
                        isLight 
                          ? 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Địa chỉ văn phòng / Cửa hàng</label>
                  <input
                    type="text"
                    value={clientForm.address}
                    onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                    placeholder="VD: 124 Pasteur, Quận 1, TP.HCM"
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition ${
                      isLight 
                        ? 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Trạng thái hợp tác</label>
                    <select
                      value={clientForm.status}
                      onChange={(e) => setClientForm({ ...clientForm, status: e.target.value as ProjectStatus })}
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition ${
                        isLight 
                          ? 'bg-gray-50 border border-gray-300 text-gray-900 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-cyan-500'
                      }`}
                    >
                      <option value="active">Đang hợp tác</option>
                      <option value="pending">Chờ phản hồi / Báo giá</option>
                      <option value="completed">Đã hoàn thành</option>
                      <option value="paused">Tạm dừng</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Ảnh đại diện (URL)</label>
                    <input
                      type="text"
                      value={clientForm.avatar}
                      onChange={(e) => setClientForm({ ...clientForm, avatar: e.target.value })}
                      placeholder="https://..."
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition ${
                        isLight 
                          ? 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Ghi chú phong cách / Yêu cầu riêng</label>
                  <textarea
                    rows={2}
                    value={clientForm.notes}
                    onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                    placeholder="VD: Khách thích tone màu đất, không dùng font quá uốn lượn..."
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition ${
                      isLight 
                        ? 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500'
                    }`}
                  />
                </div>
              </div>

              <div className={`px-6 py-3.5 border-t shrink-0 flex items-center justify-end gap-3 ${isLight ? 'border-gray-200 bg-gray-50/50' : 'border-zinc-800 bg-zinc-900/80'}`}>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${isLight ? 'text-gray-600 hover:text-gray-900' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-md transition"
                >
                  Lưu khách hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add/Edit Design Deliverable Modal */}
      {isDesignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto ${
            isLight ? 'bg-white border-gray-200 text-gray-900 shadow-xl' : 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl'
          }`}>
            <div className={`px-6 py-4 border-b shrink-0 flex items-center justify-between ${isLight ? 'border-gray-200 bg-white' : 'border-zinc-800 bg-zinc-900'}`}>
              <h3 className={`text-base sm:text-lg font-bold font-display flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-zinc-100'}`}>
                <Palette className="w-5 h-5 text-cyan-500" />
                {editingDesignItem ? 'Chỉnh sửa Sản phẩm Thiết kế' : 'Thêm Sản phẩm Thiết kế mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsDesignModalOpen(false)}
                className={`p-1.5 rounded-lg text-xs font-semibold transition ${isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-zinc-800 text-zinc-400'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDesign} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Tên sản phẩm thiết kế *</label>
                    <input
                      type="text"
                      required
                      value={designForm.title}
                      onChange={(e) => setDesignForm({ ...designForm, title: e.target.value })}
                      placeholder="VD: Thiết kế Bộ nhận diện thương hiệu Master Brand"
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition ${
                        isLight 
                          ? 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Khách hàng</label>
                    <select
                      value={designForm.clientId}
                      onChange={(e) => setDesignForm({ ...designForm, clientId: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition ${
                        isLight 
                          ? 'bg-gray-50 border border-gray-300 text-gray-900 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-cyan-500'
                      }`}
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.company} ({c.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Danh mục thiết kế</label>
                    <select
                      value={designForm.category}
                      onChange={(e) => setDesignForm({ ...designForm, category: e.target.value as DesignCategory })}
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition ${
                        isLight 
                          ? 'bg-gray-50 border border-gray-300 text-gray-900 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-cyan-500'
                      }`}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Mức độ ưu tiên</label>
                    <select
                      value={designForm.priority}
                      onChange={(e) => setDesignForm({ ...designForm, priority: e.target.value as PriorityLevel })}
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition ${
                        isLight 
                          ? 'bg-gray-50 border border-gray-300 text-gray-900 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-cyan-500'
                      }`}
                    >
                      <option value="low">Thấp</option>
                      <option value="medium">Bình thường</option>
                      <option value="high">Ưu tiên cao</option>
                      <option value="urgent">Khẩn cấp</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Trạng thái</label>
                    <select
                      value={designForm.status}
                      onChange={(e) => setDesignForm({ ...designForm, status: e.target.value as DesignStatus })}
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition ${
                        isLight 
                          ? 'bg-gray-50 border border-gray-300 text-gray-900 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-cyan-500'
                      }`}
                    >
                      <option value="todo">Chưa làm</option>
                      <option value="in_progress">Đang làm</option>
                      <option value="review">Chờ duyệt</option>
                      <option value="done">Hoàn thành</option>
                    </select>
                  </div>
                </div>

                {/* BỘ SƯU TẬP ẢNH THIẾT KẾ & THƯ MỤC CON GOOGLE DRIVE */}
                <div className={`p-4 rounded-xl border space-y-3.5 ${
                  isLight ? 'bg-blue-50/50 border-blue-200' : 'bg-zinc-950/80 border-blue-900/40'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <FolderPlus className="w-4 h-4" />
                        Bộ sưu tập ảnh thiết kế & Thư mục con Google Drive
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Mỗi bài thiết kế sẽ có 1 <strong>thư mục con riêng biệt</strong> chứa toàn bộ ảnh của bài:
                        <br />
                        <span className="font-mono text-[10px] text-blue-600 dark:text-blue-300">
                          hudesign-du-an / [{activeClient?.company || activeClient?.name || 'Khách hàng'}] / [{designForm.title.trim() || 'Tên bài thiết kế'}]
                        </span>
                      </p>
                    </div>

                    {designForm.driveFolderUrl && (
                      <a
                        href={designForm.driveFolderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition shrink-0 self-start"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        Mở thư mục con bài này
                      </a>
                    )}
                  </div>

                  {/* Hidden file input supporting multiple files */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFilesSelect(e.target.files);
                      }
                    }}
                  />

                  {/* Paste & Dropzone Area */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleFilesSelect(e.dataTransfer.files);
                      }
                    }}
                    className={`relative p-4 rounded-xl border-2 border-dashed transition ${
                      isDragOver 
                        ? 'border-blue-500 bg-blue-100/40 dark:bg-blue-950/60' 
                        : isLight ? 'border-blue-200 bg-white' : 'border-zinc-800 bg-zinc-900/60'
                    }`}
                  >
                    {designImages.length > 0 ? (
                      <div className="space-y-3">
                        {/* Top bar with count & batch upload button */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-zinc-800">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                              Đã chọn {designImages.length} hình ảnh
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
                              Ảnh đầu tiên là ảnh đại diện
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={handleUploadDemoToDrive}
                              disabled={isUploadingToDrive}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-2xs transition disabled:opacity-50"
                            >
                              {isUploadingToDrive ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Đang tải {uploadProgress ? `${uploadProgress.current}/${uploadProgress.total}` : ''}...</span>
                                </>
                              ) : (
                                <>
                                  <CloudUpload className="w-3.5 h-3.5" />
                                  <span>{designForm.driveFolderUrl ? 'Tải lại toàn bộ lên Drive' : 'Tạo thư mục con & Tải lên Drive'}</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 transition ${
                                isLight ? 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Thêm ảnh
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDesignImages([]);
                                setDesignForm((prev) => ({
                                  ...prev,
                                  demoImageUrl: '',
                                  driveFileId: '',
                                  driveFileUrl: '',
                                  driveThumbnailUrl: '',
                                }));
                              }}
                              className="px-2 py-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            >
                              Xóa hết
                            </button>
                          </div>
                        </div>

                        {/* Image Grid of thumbnails */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1">
                          {designImages.map((img, idx) => (
                            <div
                              key={img.id}
                              className={`relative rounded-xl overflow-hidden border p-2 flex flex-col justify-between group transition ${
                                idx === 0 
                                  ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30' 
                                  : isLight ? 'border-gray-200 bg-gray-50/70' : 'border-zinc-800 bg-zinc-900'
                              }`}
                            >
                              <div
                                onClick={() => setPreviewModalImage({ url: img.previewUrl, name: img.name, driveUrl: img.driveFileUrl })}
                                className="relative rounded-lg overflow-hidden aspect-video bg-black/10 cursor-pointer mb-2"
                              >
                                <img
                                  src={img.previewUrl}
                                  alt={img.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-105 transition"
                                />
                                {idx === 0 && (
                                  <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold shadow-xs">
                                    Ảnh chính
                                  </span>
                                )}
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                  <Maximize2 className="w-4 h-4 drop-shadow" />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <p className="text-[11px] font-medium text-gray-800 dark:text-zinc-200 truncate" title={img.name}>
                                  {img.name || `Hình ${idx + 1}`}
                                </p>

                                <div className="flex items-center justify-between gap-1 text-[10px]">
                                  {img.driveFileUrl ? (
                                    <a
                                      href={img.driveFileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 hover:underline"
                                    >
                                      <Check className="w-3 h-3" /> Trên Drive
                                    </a>
                                  ) : (
                                    <span className="text-amber-600 dark:text-amber-400">
                                      Chưa upload
                                    </span>
                                  )}

                                  <div className="flex items-center gap-1">
                                    {idx !== 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleSetAsPrimaryImage(img.id)}
                                        className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                                        title="Đặt làm ảnh bìa/chính"
                                      >
                                        Làm ảnh chính
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImage(img.id)}
                                      className="text-gray-400 hover:text-rose-500 p-0.5 rounded transition"
                                      title="Xóa hình này"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center pt-1">
                          Mẹo: Bạn có thể tiếp tục nhấn <kbd className="px-1 py-0.2 bg-gray-200 dark:bg-zinc-800 rounded font-mono text-[9px]">Ctrl + V</kbd> hoặc kéo thả thêm nhiều ảnh bất cứ lúc nào.
                        </p>
                      </div>
                    ) : (
                      <div className="py-6 space-y-2.5 text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <ImagePlus className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                            Nhấn <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-zinc-800 rounded font-mono text-[10px]">Ctrl + V</kbd> để dán ảnh từ Clipboard (hỗ trợ nhiều hình)
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            Hoặc kéo thả nhiều file ảnh vào đây / chọn từ máy tính
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition ${
                            isLight ? 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300 shadow-2xs' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Chọn một hoặc nhiều ảnh từ máy
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Notifications & Links */}
                  {driveUploadSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium">{driveUploadSuccess}</span>
                      </div>
                      {designForm.driveFolderUrl && (
                        <a
                          href={designForm.driveFolderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1 shrink-0 transition"
                        >
                          <FolderOpen className="w-3 h-3" />
                          Mở thư mục con trên Drive
                        </a>
                      )}
                    </div>
                  )}

                  {driveUploadError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{driveUploadError}</span>
                    </div>
                  )}

                  {/* Google Drive Links: Subfolder & Client Folder */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className={`block text-[11px] font-semibold mb-1 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
                        Link Thư mục con của bài thiết kế này (Google Drive):
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          value={designForm.driveFolderUrl}
                          onChange={(e) => setDesignForm({ ...designForm, driveFolderUrl: e.target.value })}
                          placeholder="https://drive.google.com/drive/folders/..."
                          className={`w-full px-3 py-1.5 pr-8 rounded-lg text-xs font-mono outline-none transition ${
                            isLight 
                              ? 'bg-white border border-gray-300 text-gray-900 focus:border-blue-600' 
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-100 focus:border-blue-500'
                          }`}
                        />
                        {designForm.driveFolderUrl && (
                          <a
                            href={designForm.driveFolderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700"
                            title="Mở thư mục con"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={`block text-[11px] font-semibold mb-1 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
                        Link Thư mục gốc của khách hàng (Thư mục cha):
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          value={designForm.clientFolderUrl}
                          onChange={(e) => setDesignForm({ ...designForm, clientFolderUrl: e.target.value })}
                          placeholder="https://drive.google.com/drive/folders/..."
                          className={`w-full px-3 py-1.5 pr-8 rounded-lg text-xs font-mono outline-none transition ${
                            isLight 
                              ? 'bg-white border border-gray-300 text-gray-900 focus:border-blue-600' 
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-100 focus:border-blue-500'
                          }`}
                        />
                        {designForm.clientFolderUrl && (
                          <a
                            href={designForm.clientFolderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-600 hover:text-amber-700"
                            title="Mở thư mục khách hàng"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Mô tả Brief yêu cầu thiết kế *</label>
                  <textarea
                    rows={3}
                    required
                    value={designForm.brief}
                    onChange={(e) => setDesignForm({ ...designForm, brief: e.target.value })}
                    placeholder="Mô tả chi tiết ý tưởng, thông điệp truyền tải, yêu cầu kỹ thuật, phong cách thiết kế..."
                    className={`w-full px-3 py-2 rounded-xl text-xs leading-relaxed outline-none transition ${
                      isLight 
                        ? 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Link Moodboard tham khảo (mỗi dòng 1 link ảnh/Figma)</label>
                  <textarea
                    rows={2}
                    value={designForm.moodboardUrls}
                    onChange={(e) => setDesignForm({ ...designForm, moodboardUrls: e.target.value })}
                    placeholder="https://images.unsplash.com/...&#10;https://www.figma.com/..."
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono text-[11px] outline-none transition ${
                      isLight 
                        ? 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500'
                    }`}
                  />
                </div>

                {/* Quy đổi số post tính vào gói tháng của khách */}
                <div className={`p-4 rounded-2xl border space-y-2.5 ${
                  isLight ? 'bg-amber-50/70 border-amber-200' : 'bg-amber-950/20 border-amber-900/50'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-500" />
                      Số lượng post tính vào gói tháng:
                    </label>
                    <span className="text-[11px] text-amber-700/80 dark:text-amber-400">
                      (Quy tắc: 1 hình = 1 post • multi 4 hình = 2 post • 5 hình trở lên = 3 post)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { count: 1, label: '1 hình = 1 post' },
                      { count: 2, label: 'Multi 4 hình = 2 post' },
                      { count: 3, label: '5+ hình = 3 post' },
                    ].map((item) => (
                      <button
                        key={item.count}
                        type="button"
                        onClick={() => setDesignForm({ ...designForm, postQuota: item.count })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          designForm.postQuota === item.count
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                            : isLight
                            ? 'bg-white border-amber-300 text-amber-900 hover:bg-amber-100/60'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}

                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-[11px] font-semibold text-gray-500">Tùy chỉnh:</span>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={designForm.postQuota}
                        onChange={(e) => setDesignForm({ ...designForm, postQuota: Number(e.target.value) })}
                        className={`w-16 px-2 py-1 rounded-lg border text-xs font-black text-center ${
                          isLight ? 'bg-white border-amber-300 text-amber-900' : 'bg-zinc-900 border-zinc-700 text-amber-300'
                        }`}
                      />
                      <span className="text-xs font-bold text-gray-500">post</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Đơn giá (VNĐ)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={designForm.unitPrice}
                      onChange={(e) => setDesignForm({ ...designForm, unitPrice: Number(e.target.value) })}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-semibold outline-none transition ${
                        isLight 
                          ? 'bg-gray-50 border border-gray-300 text-cyan-600 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                          : 'bg-zinc-950 border border-zinc-800 text-cyan-400 focus:border-cyan-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Số lượng</label>
                    <input
                      type="number"
                      min="1"
                      value={designForm.quantity}
                      onChange={(e) => setDesignForm({ ...designForm, quantity: Number(e.target.value) })}
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition ${
                        isLight 
                          ? 'bg-gray-50 border border-gray-300 text-gray-900 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-cyan-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Đơn vị tính</label>
                    <input
                      type="text"
                      value={designForm.unit}
                      onChange={(e) => setDesignForm({ ...designForm, unit: e.target.value })}
                      placeholder="Gói, Bộ, Mẫu..."
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition ${
                        isLight 
                          ? 'bg-gray-50 border border-gray-300 text-gray-900 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-cyan-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Deadline bàn giao</label>
                    <input
                      type="date"
                      required
                      value={designForm.deadline}
                      onChange={(e) => setDesignForm({ ...designForm, deadline: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition ${
                        isLight 
                          ? 'bg-gray-50 border border-gray-300 text-gray-900 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-cyan-500'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Định dạng bàn giao (Deliverables)</label>
                  <input
                    type="text"
                    value={designForm.deliverables}
                    onChange={(e) => setDesignForm({ ...designForm, deliverables: e.target.value })}
                    placeholder="VD: File gốc AI, PDF chuẩn in ấn, Vector SVG, Mockup 3D render..."
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition ${
                      isLight 
                        ? 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>Phản hồi / Góp ý từ khách hàng (nếu có)</label>
                  <textarea
                    rows={2}
                    value={designForm.clientFeedback}
                    onChange={(e) => setDesignForm({ ...designForm, clientFeedback: e.target.value })}
                    placeholder="Ghi nhận các feedback chỉnh sửa sau mỗi vòng present..."
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition ${
                      isLight 
                        ? 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600' 
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500'
                    }`}
                  />
                </div>
              </div>

              <div className={`px-6 py-3.5 border-t shrink-0 flex items-center justify-end gap-3 ${isLight ? 'border-gray-200 bg-gray-50/50' : 'border-zinc-800 bg-zinc-900/80'}`}>
                <button
                  type="button"
                  onClick={() => setIsDesignModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${isLight ? 'text-gray-600 hover:text-gray-900' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-md transition"
                >
                  Lưu sản phẩm thiết kế
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: View Full Brief & Moodboard Gallery Modal */}
      {viewingBriefItem && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto ${
            isLight ? 'bg-white border-gray-200 text-gray-900 shadow-2xl' : 'bg-zinc-900 border-zinc-800 text-zinc-100'
          }`}>
            <div className={`px-6 py-4 border-b shrink-0 flex items-center justify-between ${isLight ? 'border-gray-200 bg-white' : 'border-zinc-800 bg-zinc-900'}`}>
              <div className="min-w-0 pr-4">
                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">{viewingBriefItem.category}</span>
                <h3 className={`text-base sm:text-lg font-bold font-display truncate ${isLight ? 'text-gray-900' : 'text-zinc-100'}`}>{viewingBriefItem.title}</h3>
                <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>Khách hàng: <strong className={isLight ? 'text-gray-900' : 'text-zinc-200'}>{viewingBriefItem.clientName}</strong></p>
              </div>
              <button
                onClick={() => setViewingBriefItem(null)}
                className={`p-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                  isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-zinc-800 text-zinc-400'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Demo Images Gallery & Subfolder Google Drive in Brief Modal */}
              {(() => {
                const briefImages = (viewingBriefItem.demoImages && viewingBriefItem.demoImages.length > 0)
                  ? viewingBriefItem.demoImages
                  : (viewingBriefItem.demoImageUrl ? [{ id: 'brief-img-legacy', url: viewingBriefItem.demoImageUrl, driveFileUrl: viewingBriefItem.driveFileUrl, driveThumbnailUrl: viewingBriefItem.driveThumbnailUrl, name: 'Ảnh demo' }] : []);
                
                const hasImagesOrDrive = briefImages.length > 0 || viewingBriefItem.driveFolderUrl || viewingBriefItem.driveFileUrl;
                if (!hasImagesOrDrive) return null;

                return (
                  <div className={`p-4 rounded-xl border space-y-3 ${
                    isLight ? 'bg-blue-50/70 border-blue-200' : 'bg-blue-950/30 border-blue-900/50'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                          <Images className="w-4 h-4" />
                          Bộ sưu tập ảnh thiết kế ({briefImages.length} hình)
                        </h4>
                        {viewingBriefItem.driveFolderUrl && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-bold flex items-center gap-1">
                            <FolderOpen className="w-3 h-3" /> Thư mục riêng
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {viewingBriefItem.driveFolderUrl && (
                          <a
                            href={viewingBriefItem.driveFolderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 shadow-2xs transition"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            Mở thư mục bài này
                          </a>
                        )}
                        {viewingBriefItem.clientFolderUrl && (
                          <a
                            href={viewingBriefItem.clientFolderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 transition ${
                              isLight ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700'
                            }`}
                          >
                            <Folder className="w-3 h-3 text-amber-500" />
                            Thư mục khách
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Image Grid */}
                    {briefImages.length > 0 && (
                      <div className={`grid gap-3 ${
                        briefImages.length === 1 
                          ? 'grid-cols-1' 
                          : briefImages.length === 2 
                          ? 'grid-cols-2' 
                          : 'grid-cols-2 sm:grid-cols-3'
                      }`}>
                        {briefImages.map((img, idx) => (
                          <div
                            key={img.id || idx}
                            onClick={() => setPreviewModalImage({ url: img.url, name: img.name || `${viewingBriefItem.title} - Hình ${idx + 1}`, driveUrl: img.driveFileUrl })}
                            className="relative rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/60 bg-black/5 group/gallery cursor-pointer aspect-video flex items-center justify-center shadow-xs"
                          >
                            <img
                              src={img.url}
                              alt={img.name || `Hình ${idx + 1}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover/gallery:scale-105 transition duration-300"
                            />
                            {idx === 0 && (
                              <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shadow-xs">
                                Ảnh chính
                              </span>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/gallery:opacity-100 transition flex items-center justify-center text-white gap-2">
                              <span className="text-xs font-bold flex items-center gap-1">
                                <Maximize2 className="w-3.5 h-3.5" /> Xem phóng to
                              </span>
                            </div>
                            {img.driveFileUrl && (
                              <a
                                href={img.driveFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 hover:bg-black text-white text-[10px] font-medium flex items-center gap-1"
                                title="Mở file trên Google Drive"
                              >
                                <ExternalLink className="w-2.5 h-2.5" /> Drive
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>Mô tả Brief Yêu cầu</h4>
                <div className={`p-4 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                  isLight ? 'bg-gray-50 border border-gray-200 text-gray-800' : 'bg-zinc-950 border border-zinc-800 text-zinc-200'
                }`}>
                  {viewingBriefItem.brief}
                </div>
              </div>

              {viewingBriefItem.moodboardUrls && viewingBriefItem.moodboardUrls.length > 0 && (
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>Moodboard & Tham khảo thị giác</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewingBriefItem.moodboardUrls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group relative rounded-xl overflow-hidden border aspect-video block ${
                          isLight ? 'border-gray-200 bg-gray-100' : 'border-zinc-800 bg-zinc-950'
                        }`}
                      >
                        <img
                          src={url}
                          alt="Moodboard visual"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2.5">
                          <span className="text-[11px] text-white flex items-center gap-1">
                            Mở ảnh gốc <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {viewingBriefItem.deliverables && (
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>Định dạng file bàn giao</h4>
                  <p className={`text-xs p-3 rounded-xl ${
                    isLight ? 'bg-gray-50 border border-gray-200 text-gray-800' : 'bg-zinc-950 border border-zinc-800 text-zinc-300'
                  }`}>
                    {viewingBriefItem.deliverables}
                  </p>
                </div>
              )}

              {viewingBriefItem.clientFeedback && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Phản hồi từ khách hàng</h4>
                  <p className="text-xs text-amber-900 dark:text-amber-200 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                    {viewingBriefItem.clientFeedback}
                  </p>
                </div>
              )}
            </div>

            <div className={`px-6 py-3.5 border-t shrink-0 flex items-center justify-end ${isLight ? 'border-gray-200 bg-gray-50/50' : 'border-zinc-800 bg-zinc-900/80'}`}>
              <button
                onClick={() => setViewingBriefItem(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xuất Link Khách Xem (Client Portal) */}
      <ClientShareLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        clients={safeClients}
        initialClientId={activeClient?.id}
        designItems={safeDesignItems}
        onUpdateClient={onUpdateClient}
        onNavigateToClientPortal={onNavigateToClientPortal}
        isLight={isLight}
      />
    </div>
  );
};
