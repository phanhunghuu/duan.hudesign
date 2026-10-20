import React, { useState, useEffect, useRef } from 'react';
import { Client, DesignItem, Quotation, QuotationItem, StudioProfile } from '../types';
import { formatVND, formatDate, removeVietnameseTones } from '../utils/formatters';
import { exportElementToPdf, printElementCleanly } from '../utils/pdfExport';
import { Logo } from './Logo';
import { 
  FileSpreadsheet, 
  Printer, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  FileText, 
  Download, 
  Send, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  CreditCard,
  Sparkles,
  History,
  Eye,
  RefreshCw,
  CloudUpload,
  Link2,
  ExternalLink,
  HardDrive,
  Folder,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

interface QuotationGeneratorProps {
  clients: Client[];
  designItems: DesignItem[];
  quotations: Quotation[];
  studioProfile: StudioProfile;
  onSaveQuotation: (quotation: Quotation) => void;
  onDeleteQuotation: (quotationId: string) => void;
  onAddClient?: (clientData: Omit<Client, 'id' | 'createdAt'>) => void;
  preSelectedClientId?: string;
  isLight: boolean;
}

export const QuotationGenerator: React.FC<QuotationGeneratorProps> = ({
  clients = [],
  designItems = [],
  quotations = [],
  studioProfile,
  onSaveQuotation,
  onDeleteQuotation,
  onAddClient,
  preSelectedClientId,
  isLight,
}) => {
  const safeClients = clients || [];
  const safeDesignItems = designItems || [];
  const safeQuotations = quotations || [];

  // Client selection
  const [selectedClientId, setSelectedClientId] = useState<string>(
    preSelectedClientId || (safeClients[0]?.id ?? 'new')
  );

  // Editable Client Info states
  const activeClient = safeClients.find((c) => c?.id === selectedClientId);
  const [clientName, setClientName] = useState<string>(activeClient?.name || '');
  const [clientCompany, setClientCompany] = useState<string>(activeClient?.company || '');
  const [clientPhone, setClientPhone] = useState<string>(activeClient?.phone || '');
  const [clientEmail, setClientEmail] = useState<string>(activeClient?.email || '');
  const [saveToClientList, setSaveToClientList] = useState<boolean>(false);

  // Sync client form when selecting from dropdown
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId === 'new') {
      setClientName('');
      setClientCompany('');
      setClientPhone('');
      setClientEmail('');
      setSaveToClientList(true);
    } else {
      const found = safeClients.find((c) => c.id === clientId);
      if (found) {
        setClientName(found.name || '');
        setClientCompany(found.company || '');
        setClientPhone(found.phone || '');
        setClientEmail(found.email || '');
      }
    }
  };

  // Quotation header states
  const [quotationNumber, setQuotationNumber] = useState(
    `HD-${new Date().getFullYear()}-${String(safeQuotations.length + 1).padStart(3, '0')}`
  );
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [validDays, setValidDays] = useState(30);

  // Quotation line items
  const [quoteItems, setQuoteItems] = useState<QuotationItem[]>([]);

  // Financial modifiers
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountAmountCustom, setDiscountAmountCustom] = useState<number>(0);
  const [useCustomDiscount, setUseCustomDiscount] = useState<boolean>(false);
  const [vatPercent, setVatPercent] = useState<number>(8);
  const [depositPercent, setDepositPercent] = useState<number>(50);
  const [depositAmountCustom, setDepositAmountCustom] = useState<number>(0);
  const [useCustomDeposit, setUseCustomDeposit] = useState<boolean>(false);
  const [paymentTerms, setPaymentTerms] = useState<string>(studioProfile?.defaultPaymentTerms || '');
  const [notes, setNotes] = useState<string>(studioProfile.defaultNote);

  // UI Modes
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'history'>('editor');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);
  const [viewingSavedQuote, setViewingSavedQuote] = useState<Quotation | null>(null);

  // When selected client changes or initial load, auto-populate from client's design items
  useEffect(() => {
    // Auto-populate when selecting existing client
    if (activeClient && selectedClientId !== 'new') {
      const clientDesigns = designItems.filter((d) => d.clientId === activeClient.id);
      if (clientDesigns.length > 0) {
        const generatedItems: QuotationItem[] = clientDesigns.map((d) => ({
          id: 'qi-' + d.id,
          designItemId: d.id,
          title: d.title,
          category: d.category,
          description: d.brief || 'Ấn phẩm thiết kế theo nhận diện thương hiệu.',
          quantity: d.quantity || 1,
          unit: d.unit || 'Gói',
          unitPrice: d.unitPrice || 5000000,
          amount: (d.quantity || 1) * (d.unitPrice || 5000000),
          driveFileId: d.driveFileId || '',
          driveFileUrl: d.driveFileUrl || '',
          driveThumbnailUrl: d.driveThumbnailUrl || '',
          driveFolderUrl: d.driveFolderUrl || '',
          demoImageUrl: d.demoImageUrl || '',
        }));
        setQuoteItems(generatedItems);
      } else {
        // Fallback default single item
        setQuoteItems([
          {
            id: 'qi-default-1',
            title: 'Gói Thiết kế Nhận diện Thương hiệu & Ấn phẩm',
            category: 'Branding & Logo',
            description: 'Thiết kế concept, quy chuẩn màu sắc, font chữ và các ấn phẩm ứng dụng.',
            quantity: 1,
            unit: 'Gói',
            unitPrice: 15000000,
            amount: 15000000,
          },
        ]);
      }
    } else if (selectedClientId === 'new' && quoteItems.length === 0) {
      setQuoteItems([
        {
          id: 'qi-default-1',
          title: 'Gói Thiết kế Nhận diện Thương hiệu & Ấn phẩm',
          category: 'Branding & Logo',
          description: 'Thiết kế concept, quy chuẩn màu sắc, font chữ và các ấn phẩm ứng dụng.',
          quantity: 1,
          unit: 'Gói',
          unitPrice: 15000000,
          amount: 15000000,
        },
      ]);
    }
  }, [selectedClientId, designItems]);

  // Calculations
  const subtotal = quoteItems.reduce((acc, item) => acc + item.amount, 0);
  const calculatedDiscount = useCustomDiscount
    ? discountAmountCustom
    : Math.round((subtotal * discountPercent) / 100);
  const afterDiscount = Math.max(0, subtotal - calculatedDiscount);
  const vatAmount = Math.round((afterDiscount * vatPercent) / 100);
  const grandTotal = afterDiscount + vatAmount;
  const depositAmount = useCustomDeposit
    ? Math.min(grandTotal, depositAmountCustom)
    : Math.round((grandTotal * depositPercent) / 100);
  const remainingAmount = Math.max(0, grandTotal - depositAmount);
  const effectiveDepositPercent = grandTotal > 0
    ? (useCustomDeposit ? Math.round((depositAmount / grandTotal) * 100) : depositPercent)
    : depositPercent;

  // Valid until date calculation
  const validUntilDate = new Date(new Date(issueDate).getTime() + validDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Item modifications
  const handleItemChange = (index: number, field: keyof QuotationItem, value: any) => {
    const updated = [...quoteItems];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      item.amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    }
    updated[index] = item;
    setQuoteItems(updated);
  };

  const handleAddItem = () => {
    const newItem: QuotationItem = {
      id: 'qi-' + Date.now(),
      title: 'Hạng mục thiết kế bổ sung',
      category: 'Khác',
      description: 'Mô tả chi tiết sản phẩm và định dạng bàn giao.',
      quantity: 1,
      unit: 'Mẫu',
      unitPrice: 3000000,
      amount: 3000000,
    };
    setQuoteItems([...quoteItems, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (quoteItems.length <= 1) return;
    const updated = quoteItems.filter((_, i) => i !== index);
    setQuoteItems(updated);
  };

  const handleImportAllClientDesigns = () => {
    if (!activeClient) return;
    const clientDesigns = designItems.filter((d) => d.clientId === activeClient.id);
    const generatedItems: QuotationItem[] = clientDesigns.map((d) => ({
      id: 'qi-' + d.id + '-' + Date.now(),
      designItemId: d.id,
      title: d.title,
      category: d.category,
      description: d.brief || 'Ấn phẩm thiết kế chuyên nghiệp.',
      quantity: d.quantity || 1,
      unit: d.unit || 'Gói',
      unitPrice: d.unitPrice || 5000000,
      amount: (d.quantity || 1) * (d.unitPrice || 5000000),
      driveFileId: d.driveFileId || '',
      driveFileUrl: d.driveFileUrl || '',
      driveThumbnailUrl: d.driveThumbnailUrl || '',
      driveFolderUrl: d.driveFolderUrl || '',
      demoImageUrl: d.demoImageUrl || '',
    }));
    setQuoteItems(generatedItems);
  };

  // Save current quotation
  const handleSaveCurrentQuote = () => {
    const effectiveClientId = activeClient?.id || 'cli-' + Date.now();
    const effectiveClientName = clientName.trim() || activeClient?.name || 'Khách hàng mới';
    const effectiveClientCompany = clientCompany.trim() || activeClient?.company || 'Đơn vị đối tác';

    // Optionally save new client to client database
    if (saveToClientList && onAddClient && selectedClientId === 'new' && (clientName || clientCompany)) {
      onAddClient({
        name: effectiveClientName,
        company: effectiveClientCompany,
        email: clientEmail.trim() || 'contact@client.com',
        phone: clientPhone.trim() || '0900000000',
        status: 'active',
      });
    }

    const newQuotation: Quotation = {
      id: 'quote-' + Date.now(),
      quotationNumber,
      clientId: effectiveClientId,
      clientName: effectiveClientName,
      clientCompany: effectiveClientCompany,
      clientEmail: clientEmail || activeClient?.email || '',
      clientPhone: clientPhone || activeClient?.phone || '',
      clientAddress: activeClient?.address || '',
      issueDate,
      validUntil: validUntilDate,
      items: quoteItems,
      subtotal,
      discountPercent: useCustomDiscount ? 0 : discountPercent,
      discountAmount: calculatedDiscount,
      vatPercent,
      vatAmount,
      total: grandTotal,
      depositPercent: effectiveDepositPercent,
      depositAmount,
      notes,
      paymentTerms,
      bankInfo: {
        bankName: studioProfile.bankName,
        accountNumber: studioProfile.bankAccount,
        accountHolder: studioProfile.bankOwner,
        branch: studioProfile.bankBranch,
      },
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    onSaveQuotation(newQuotation);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  // State & Ref for PDF Export
  const quotationRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);

  // Download PDF file directly
  const handleDownloadPDF = async () => {
    if (!quotationRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    setPdfSuccess(false);

    try {
      const sanitizedClient = (clientCompany || clientName || 'Khach_hang').replace(/[^a-zA-Z0-9_-]/g, '_');
      const sanitizedNum = (quotationNumber || 'Bao_gia').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `Bao_gia_HuDesign_${sanitizedNum}_${sanitizedClient}.pdf`;

      const success = await exportElementToPdf(quotationRef.current, {
        fileName,
        quality: 0.95,
        orientation: 'portrait',
      });

      if (success) {
        setPdfSuccess(true);
        setTimeout(() => setPdfSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Download quotation PDF error:', error);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Print to PDF trigger
  const handlePrintPDF = () => {
    if (!quotationRef.current) {
      window.print();
      return;
    }
    printElementCleanly(quotationRef.current, `Báo giá ${quotationNumber} - ${clientCompany || clientName}`);
  };

  // Copy plain text summary for messaging
  const handleCopyTextSummary = () => {
    const effectiveClientName = clientName.trim() || activeClient?.name || 'Khách hàng';
    const effectiveClientCompany = clientCompany.trim() || activeClient?.company || 'Đơn vị';

    const textLines = [
      `🎨 BẢNG BÁO GIÁ THIẾT KẾ - HỦ DESIGN STUDIO`,
      `Mã số: ${quotationNumber} | Ngày: ${formatDate(issueDate)}`,
      `Khách hàng: ${effectiveClientCompany} (${effectiveClientName})`,
      `------------------------------------------`,
      ...quoteItems.map(
        (it, idx) =>
          `${idx + 1}. ${it.title}\n   • Số lượng: ${it.quantity} ${it.unit} x ${formatVND(it.unitPrice)} = ${formatVND(it.amount)}${it.driveFileUrl ? `\n   • Link xem demo (Google Drive): ${it.driveFileUrl}` : ''}`
      ),
      `------------------------------------------`,
      `Tạm tính: ${formatVND(subtotal)}`,
      calculatedDiscount > 0 ? `Chiết khấu: -${formatVND(calculatedDiscount)}` : '',
      vatAmount > 0 ? `Thuế VAT (${vatPercent}%): +${formatVND(vatAmount)}` : '',
      `TỔNG CỘNG: ${formatVND(grandTotal)}`,
      depositAmount > 0 ? `Tạm ứng đợt 1 (${effectiveDepositPercent}%): ${formatVND(depositAmount)}` : '',
      depositAmount > 0 ? `Còn lại: ${formatVND(remainingAmount)}` : '',
      `------------------------------------------`,
      `Thông tin thanh toán:`,
      `• Ngân hàng: ${studioProfile.bankName || 'Vietcombank chi nhánh Cần Thơ'}`,
      `• Số tài khoản: ${studioProfile.bankAccount || '1015064592'}`,
      `• Chủ tài khoản: ${studioProfile.bankOwner || 'PHAN HUNG HUU'}`,
      `• Nội dung: thanh toan dich vu ${removeVietnameseTones(effectiveClientName)}`,
      `Trân trọng cảm ơn Quý đối tác đã tin tưởng Hủ Design!`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(textLines);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-display flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Tạo Bảng Thống kê & Báo giá Studio
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Tự động tổng hợp các sản phẩm thiết kế, tính toán đơn giá, thuế VAT và xuất mẫu báo giá chuẩn PDF
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'editor' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-bold shadow-xs' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Chỉnh sửa báo giá
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'preview' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-bold shadow-xs' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Xem trước (Preview)
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'history' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-bold shadow-xs' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Lịch sử ({quotations.length})
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: EDITOR MODE */}
      {activeTab === 'editor' && (
        <div className="space-y-6 no-print">
          {/* Client & Metadata Configuration Card */}
          <div className={`p-5 sm:p-6 rounded-xl border ${
            isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900/80 border-gray-800'
          }`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              1. Thông tin Khách hàng & Báo giá
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Chọn từ danh sách khách có sẵn
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleSelectClient(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-semibold border focus:outline-hidden ${
                      isLight ? 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500' : 'bg-gray-950 border-gray-800 text-gray-100 focus:border-blue-500'
                    }`}
                  >
                    <option value="new">➕ + Nhập khách hàng mới trực tiếp...</option>
                    {safeClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Ngày báo giá *</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs border focus:outline-hidden ${
                      isLight ? 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500' : 'bg-gray-950 border-gray-800 text-gray-100 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              {/* Direct Name & Company inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200/60 dark:border-gray-800/60">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Tên khách hàng / Người đại diện *
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Nguyễn Thanh Tùng..."
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs border focus:outline-hidden ${
                      isLight ? 'bg-white border-gray-300 text-gray-900 focus:border-blue-500' : 'bg-gray-950 border-gray-700 text-gray-100 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Tên đơn vị / Doanh nghiệp *
                  </label>
                  <input
                    type="text"
                    placeholder="VD: The Vintage Roastery Co."
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs border focus:outline-hidden ${
                      isLight ? 'bg-white border-gray-300 text-gray-900 focus:border-blue-500' : 'bg-gray-950 border-gray-700 text-gray-100 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              {/* Optional Phone/Email & Auto-save Checkbox */}
              {selectedClientId === 'new' && (
                <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Số điện thoại (tùy chọn)
                      </label>
                      <input
                        type="text"
                        placeholder="VD: 0903 888 777"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded-md text-xs border focus:outline-hidden ${
                          isLight ? 'bg-white border-gray-200 text-gray-900 focus:border-blue-500' : 'bg-gray-900 border-gray-800 text-gray-100 focus:border-blue-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Email (tùy chọn)
                      </label>
                      <input
                        type="email"
                        placeholder="VD: contact@client.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded-md text-xs border focus:outline-hidden ${
                          isLight ? 'bg-white border-gray-200 text-gray-900 focus:border-blue-500' : 'bg-gray-900 border-gray-800 text-gray-100 focus:border-blue-500'
                        }`}
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-blue-800 dark:text-blue-300 font-medium">
                    <input
                      type="checkbox"
                      checked={saveToClientList}
                      onChange={(e) => setSaveToClientList(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span>Tự động lưu khách hàng mới này vào mục Khách hàng của Studio</span>
                  </label>
                </div>
              )}

              {/* Quick client info tag */}
              {activeClient && selectedClientId !== 'new' && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <div>
                    Đã liên kết với hồ sơ: <strong className="text-gray-900 dark:text-gray-200">{activeClient.company}</strong> ({activeClient.name})
                  </div>
                  <button
                    type="button"
                    onClick={handleImportAllClientDesigns}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Nạp lại việc thiết kế của khách này
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className={`rounded-xl border overflow-hidden ${
            isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900/80 border-gray-800'
          }`}>
            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  2. Danh mục Sản phẩm & Đơn giá
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Tự động tính thành tiền theo số lượng và đơn giá</p>
              </div>

              <button
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm hạng mục
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b text-gray-500 font-semibold ${
                    isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-950/60 border-gray-800'
                  }`}>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4 min-w-[240px]">Tên sản phẩm thiết kế & Brief</th>
                    <th className="py-3 px-4 min-w-[130px]">Danh mục</th>
                    <th className="py-3 px-3 w-20 text-center">SL</th>
                    <th className="py-3 px-3 w-24">Đơn vị</th>
                    <th className="py-3 px-4 min-w-[140px] text-right">Đơn giá (VNĐ)</th>
                    <th className="py-3 px-4 min-w-[140px] text-right">Thành tiền (VNĐ)</th>
                    <th className="py-3 px-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {quoteItems.map((item, index) => (
                    <tr key={item.id} className={isLight ? 'hover:bg-gray-50/80 transition' : 'hover:bg-gray-800/30 transition'}>
                      <td className="py-3 px-4 text-center font-mono text-gray-400">{index + 1}</td>
                      <td className="py-3 px-4 space-y-1">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                          placeholder="Tên sản phẩm..."
                          className={`w-full px-2 py-1 rounded-lg border font-bold focus:outline-hidden ${
                            isLight ? 'bg-white border-gray-200 text-gray-900 focus:border-blue-500' : 'bg-gray-950 border-gray-800 text-gray-100 focus:border-blue-500'
                          }`}
                        />
                        <textarea
                          rows={2}
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Mô tả chi tiết ấn phẩm..."
                          className={`w-full px-2 py-1 rounded-lg border text-[11px] focus:outline-hidden ${
                            isLight ? 'bg-gray-50 border-gray-200 text-gray-600 focus:border-blue-500' : 'bg-gray-950/70 border-gray-800 text-gray-300 focus:border-blue-500'
                          }`}
                        />
                        {/* Link Google Drive Demo in Editor */}
                        <div className="pt-1 flex items-center gap-2 flex-wrap text-[11px]">
                          <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                            <CloudUpload className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <input
                              type="url"
                              value={item.driveFileUrl || ''}
                              onChange={(e) => handleItemChange(index, 'driveFileUrl', e.target.value)}
                              placeholder="Link Google Drive Demo (https://drive.google.com/...)"
                              className={`w-full px-2 py-0.5 rounded text-[11px] font-mono border focus:outline-hidden ${
                                isLight ? 'bg-white border-gray-200 text-blue-600 focus:border-blue-500' : 'bg-gray-900 border-gray-800 text-blue-400 focus:border-blue-500'
                              }`}
                            />
                          </div>
                          {item.driveFileUrl && (
                            <a
                              href={item.driveFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:underline px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800"
                            >
                              <ExternalLink className="w-2.5 h-2.5" /> Xem Demo
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                          className={`w-full px-2 py-1 rounded-lg border focus:outline-hidden ${
                            isLight ? 'bg-white border-gray-200 text-gray-700 focus:border-blue-500' : 'bg-gray-950 border-gray-800 text-gray-300 focus:border-blue-500'
                          }`}
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          className={`w-full px-2 py-1 text-center rounded-lg border focus:outline-hidden ${
                            isLight ? 'bg-white border-gray-200 text-gray-900 focus:border-blue-500' : 'bg-gray-950 border-gray-800 text-gray-100 focus:border-blue-500'
                          }`}
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          className={`w-full px-2 py-1 rounded-lg border text-center focus:outline-hidden ${
                            isLight ? 'bg-white border-gray-200 text-gray-700 focus:border-blue-500' : 'bg-gray-950 border-gray-800 text-gray-300 focus:border-blue-500'
                          }`}
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          min="0"
                          step="500000"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                          className={`w-full px-2 py-1 rounded-lg border font-semibold text-right focus:outline-hidden ${
                            isLight ? 'bg-white border-gray-200 text-blue-600 focus:border-blue-500' : 'bg-gray-950 border-gray-800 text-blue-400 focus:border-blue-500'
                          }`}
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-gray-900 dark:text-gray-100">
                        {formatVND(item.amount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          title="Xóa dòng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Summary & Payment Terms */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Notes & Bank info */}
            <div className={`lg:col-span-7 p-5 sm:p-6 rounded-xl border space-y-4 ${
              isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900/80 border-gray-800'
            }`}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                3. Kiểm tra thông tin & Ghi chú Studio
              </h3>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Kiểm tra thông tin</label>
                <textarea
                  rows={4}
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs border leading-relaxed focus:outline-hidden ${
                    isLight ? 'bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-500' : 'bg-gray-950 border-gray-800 text-gray-200 focus:border-blue-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Ghi chú</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs border focus:outline-hidden ${
                    isLight ? 'bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-500' : 'bg-gray-950 border-gray-800 text-gray-200 focus:border-blue-500'
                  }`}
                />
              </div>

              <div className={`p-3.5 rounded-lg border text-xs ${
                isLight ? 'bg-blue-50/50 border-blue-100 text-gray-700' : 'bg-gray-950 border-gray-800 text-gray-300'
              }`}>
                <div className="font-bold text-blue-600 dark:text-blue-400 mb-1">Tài khoản Ngân hàng thụ hưởng:</div>
                <div>{studioProfile.bankName} - Chi nhánh: {studioProfile.bankBranch}</div>
                <div>Số tài khoản: <strong className="font-mono text-gray-900 dark:text-white">{studioProfile.bankAccount}</strong></div>
                <div>Chủ tài khoản: <strong className="text-gray-900 dark:text-white">{studioProfile.bankOwner}</strong></div>
              </div>
            </div>

            {/* Right: Calculations breakdown */}
            <div className={`lg:col-span-5 p-5 sm:p-6 rounded-xl border space-y-4 ${
              isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900/80 border-gray-800'
            }`}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                4. Tổng kết Chi phí
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <span>Tổng tiền sản phẩm (Tạm tính):</span>
                  <span className="font-bold font-mono text-sm text-gray-900 dark:text-white">{formatVND(subtotal)}</span>
                </div>

                {/* Discount options */}
                <div className={`p-3 rounded-lg border space-y-2 ${
                  isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-950 border-gray-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium">Chiết khấu / Giảm giá:</span>
                    <span className="font-bold font-mono text-rose-600">
                      -{formatVND(calculatedDiscount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUseCustomDiscount(false)}
                      className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                        !useCustomDiscount
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800'
                      }`}
                    >
                      Theo % (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(Number(e.target.value))}
                        className="w-10 bg-transparent text-center font-bold text-blue-600 dark:text-blue-400 border-b border-gray-300 dark:border-gray-600 focus:outline-hidden"
                      />
                      %)
                    </button>

                    <button
                      type="button"
                      onClick={() => setUseCustomDiscount(true)}
                      className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                        useCustomDiscount
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800'
                      }`}
                    >
                      Nhập số tiền trực tiếp
                    </button>
                  </div>

                  {useCustomDiscount && (
                    <input
                      type="number"
                      min="0"
                      step="100000"
                      value={discountAmountCustom}
                      onChange={(e) => setDiscountAmountCustom(Number(e.target.value))}
                      placeholder="Số tiền giảm (VNĐ)"
                      className={`w-full px-2 py-1 rounded border text-xs font-mono ${
                        isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-gray-900 border-gray-700 text-white'
                      }`}
                    />
                  )}
                </div>

                {/* VAT Tax */}
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-1.5">
                    <span>Thuế GTGT (VAT):</span>
                    <select
                      value={vatPercent}
                      onChange={(e) => setVatPercent(Number(e.target.value))}
                      className={`px-1.5 py-0.5 rounded border text-[11px] font-bold ${
                        isLight ? 'bg-white border-gray-200 text-blue-600' : 'bg-gray-950 border-gray-800 text-blue-400'
                      }`}
                    >
                      <option value="0">0% (Không VAT)</option>
                      <option value="8">8% (Nghị định giảm thuế)</option>
                      <option value="10">10% (Tiêu chuẩn)</option>
                    </select>
                  </div>
                  <span className="font-bold font-mono text-gray-900 dark:text-white">+{formatVND(vatAmount)}</span>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-base font-extrabold text-gray-900 dark:text-gray-100">
                  <span className="tracking-wide">TỔNG CỘNG:</span>
                  <span className="text-2xl font-mono text-blue-600 dark:text-blue-400 font-black">
                    {formatVND(grandTotal)}
                  </span>
                </div>

                {/* Tạm ứng Configuration Section */}
                <div className={`p-3 rounded-lg border space-y-2.5 ${
                  isLight ? 'bg-blue-50/60 border-blue-200/80 text-blue-950' : 'bg-blue-950/20 border-blue-500/30 text-blue-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-blue-700 dark:text-blue-300">
                        Tạm ứng đợt 1 ({effectiveDepositPercent}%):
                      </span>
                    </div>
                    <span className="text-sm font-extrabold font-mono text-blue-700 dark:text-blue-300">
                      {formatVND(depositAmount)}
                    </span>
                  </div>

                  {/* Mode toggles */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[30, 50, 70, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setUseCustomDeposit(false);
                          setDepositPercent(pct);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                          !useCustomDeposit && depositPercent === pct
                            ? 'bg-blue-600 text-white shadow-xs'
                            : isLight
                            ? 'bg-white hover:bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-700'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setUseCustomDeposit(false)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition flex items-center gap-1 ${
                        !useCustomDeposit && ![30, 50, 70, 100].includes(depositPercent)
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isLight
                          ? 'bg-white hover:bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-700'
                      }`}
                    >
                      <span>Tùy chỉnh:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={depositPercent}
                        onChange={(e) => {
                          setUseCustomDeposit(false);
                          setDepositPercent(Math.min(100, Math.max(0, Number(e.target.value))));
                        }}
                        className="w-9 bg-transparent text-center font-bold underline focus:outline-hidden"
                      />
                      <span>%</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomDeposit(true);
                        if (depositAmountCustom === 0) {
                          setDepositAmountCustom(depositAmount);
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                        useCustomDeposit
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isLight
                          ? 'bg-white hover:bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-700'
                      }`}
                    >
                      Nhập số tiền VNĐ
                    </button>
                  </div>

                  {useCustomDeposit && (
                    <div className="pt-1">
                      <input
                        type="number"
                        min="0"
                        max={grandTotal}
                        step="500000"
                        value={depositAmountCustom}
                        onChange={(e) => setDepositAmountCustom(Number(e.target.value))}
                        placeholder="Số tiền tạm ứng cụ thể (VNĐ)"
                        className={`w-full px-2.5 py-1.5 rounded-md border text-xs font-mono font-bold ${
                          isLight
                            ? 'bg-white border-blue-300 text-blue-900 focus:border-blue-500'
                            : 'bg-gray-900 border-blue-500/40 text-blue-200 focus:border-blue-400'
                        } focus:outline-hidden`}
                      />
                    </div>
                  )}

                  <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-between pt-0.5">
                    <span>Thanh toán ngay sau khi xác nhận báo giá</span>
                    <span>Còn lại nghiệm thu: <strong className="font-mono text-rose-600 dark:text-rose-400">{formatVND(remainingAmount)}</strong></span>
                  </div>
                </div>

                {/* Còn lại Section */}
                <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  isLight ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                }`}>
                  <div>
                    <span className="font-bold block text-rose-700 dark:text-rose-400">Còn lại thanh toán đợt 2:</span>
                    <span className="text-[10px] text-rose-500/80 dark:text-rose-400/80">Thanh toán khi nghiệm thu bàn giao toàn bộ file</span>
                  </div>
                  <span className="text-sm font-extrabold font-mono text-rose-600 dark:text-rose-400">
                    {formatVND(remainingAmount)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-2">
                <button
                  onClick={() => setActiveTab('preview')}
                  className="w-full py-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  Xem trước Báo giá & In / Xuất PDF
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSaveCurrentQuote}
                    className={`py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      isLight ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200' : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Lưu báo giá
                  </button>

                  <button
                    onClick={handleCopyTextSummary}
                    className={`py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      isLight ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200' : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700'
                    }`}
                  >
                    {copiedNotification ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Đã chép!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-blue-600" />
                        Sao chép gửi Zalo
                      </>
                    )}
                  </button>
                </div>

                {savedNotification && (
                  <p className="text-center text-xs text-emerald-600 font-semibold animate-pulse">
                    ✓ Đã lưu bảng báo giá thành công vào hệ thống!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: LIVE PREVIEW & PRINT READY QUOTATION */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          {/* Top Preview Action Bar */}
          <div className={`no-print p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'
          }`}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  isLight ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200' : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                }`}
              >
                ← Quay lại chỉnh sửa
              </button>
              <span className="text-xs text-gray-500">
                Bảng báo giá cho <strong className="text-gray-900 dark:text-white">{activeClient?.company}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyTextSummary}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition ${
                  isLight ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200' : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700'
                }`}
              >
                {copiedNotification ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-blue-600" />}
                Sao chép Text Zalo
              </button>
              <button
                onClick={handleSaveCurrentQuote}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition ${
                  isLight ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200' : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Lưu vào hệ thống
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={isExportingPdf}
                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                title="Tải trực tiếp file .pdf về máy tính / điện thoại"
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tạo PDF...</span>
                  </>
                ) : pdfSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Đã tải PDF về máy!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Tải File PDF (.pdf)</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePrintPDF}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-2 transition cursor-pointer"
                title="In hoặc Lưu dưới dạng PDF qua trình duyệt"
              >
                <Printer className="w-4 h-4" />
                In Báo Giá (A4)
              </button>
            </div>
          </div>

          {/* THE OFFICIAL PRINTABLE QUOTATION SHEET (A4 Minimalist Studio Style) */}
          <div className="w-full overflow-x-auto pb-6">
            <div 
              ref={quotationRef}
              className="quotation-printable w-full max-w-[800px] mx-auto bg-white text-gray-900 rounded-xl shadow-md p-6 sm:p-8 md:p-10 border border-gray-200 transition-all font-sans relative box-border"
            >
              {/* Header: Studio Logo & Client Info (Clean & Minimalist) */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-5 border-b-2 border-gray-900">
                <div className="space-y-2.5">
                  <img
                    src="https://res.cloudinary.com/dcwgy4tnb/image/upload/v1770527011/hudesign-logo_uprmzz.png"
                    alt="Hủ Design"
                    className="h-9 sm:h-11 w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-xs text-gray-800 space-y-0.5">
                    <p>
                      <span className="text-gray-500 font-medium">Khách hàng:</span>{' '}
                      <strong className="text-gray-900">{clientName || '---'}</strong>
                    </p>
                    <p>
                      <span className="text-gray-500 font-medium">Đơn vị:</span>{' '}
                      <strong className="text-gray-900">{clientCompany || '---'}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right flex flex-col sm:items-end justify-between pt-0.5">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-wide text-gray-900 font-display uppercase">
                    BÁO GIÁ DỊCH VỤ
                  </h1>
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100/90 px-3 py-1 rounded-lg border border-gray-200">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ngày báo giá:</span>
                    <strong className="text-gray-900 font-semibold">{formatDate(issueDate)}</strong>
                  </div>
                </div>
              </div>

              {/* Quotation Table */}
              <div className="py-5">
                <table className="w-full text-left text-xs border-collapse table-fixed">
                  <thead>
                    <tr className="border-b-2 border-gray-900 bg-gray-100 text-gray-900 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
                      <th className="py-2.5 px-1.5 w-[5%] text-center">STT</th>
                      <th className="py-2.5 px-2.5 w-[37%]">Hạng mục & Chi tiết thiết kế</th>
                      <th className="py-2.5 px-1.5 w-[13%] text-center">Phân loại</th>
                      <th className="py-2.5 px-1 w-[9%] text-center">Demo</th>
                      <th className="py-2.5 px-1 w-[5%] text-center">SL</th>
                      <th className="py-2.5 px-1 w-[7%] text-center">ĐVT</th>
                      <th className="py-2.5 px-2 w-[11%] text-right">Đơn giá</th>
                      <th className="py-2.5 px-2 w-[13%] text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quoteItems.map((item, index) => (
                      <tr key={item.id} className="align-top page-break-inside-avoid">
                        <td className="py-2.5 px-1.5 text-center font-mono font-semibold text-gray-500 text-[11px]">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-2.5 space-y-1">
                          <div className="font-bold text-gray-900 text-xs sm:text-[13px] leading-snug break-words">
                            {item.title}
                          </div>
                          {item.description && (
                            <div className="text-[10px] sm:text-[11px] text-gray-600 leading-relaxed whitespace-pre-line break-words">
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-1.5 text-center">
                          {item.category ? (
                            <span className="inline-block text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 leading-tight break-words max-w-full">
                              {item.category}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-300 font-mono">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-1 text-center whitespace-nowrap">
                          {item.driveFileUrl || item.demoImageUrl ? (
                            <a
                              href={item.driveFileUrl || item.demoImageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white transition group"
                              title="Xem ảnh demo"
                            >
                              <span>Xem ảnh</span>
                              <ExternalLink className="w-2.5 h-2.5 text-blue-500 group-hover:text-white transition" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-gray-300 font-mono">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-1 text-center font-bold text-gray-800 text-[11px]">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-1 text-center text-gray-700 text-[11px] break-words">
                          {item.unit}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-gray-800 font-medium text-[11px] whitespace-nowrap">
                          {formatVND(item.unitPrice)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-gray-900 text-xs sm:text-[13px] whitespace-nowrap">
                          {formatVND(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary */}
              <div className="pt-4 border-t-2 border-gray-900 flex flex-col sm:flex-row justify-between gap-6 page-break-inside-avoid">
                {/* Payment Details */}
                <div className="flex-1 space-y-3 text-xs text-gray-700">
                  <div>
                    <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] mb-1.5">
                      THÔNG TIN CHUYỂN KHOẢN
                    </h4>
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <img
                        src={studioProfile.bankQrImage || "https://res.cloudinary.com/dcwgy4tnb/image/upload/v1788150305/35b04d18-2b37-4d17-872e-c63fb6103626.png"}
                        alt="Vietcombank QR"
                        className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-md border border-gray-200 bg-white p-1 shrink-0 shadow-2xs"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-[11px] text-gray-800 space-y-1">
                        <p>
                          <span className="text-gray-500 font-medium">Ngân hàng:</span>{' '}
                          <strong>{studioProfile.bankName || 'Vietcombank chi nhánh Cần Thơ'}</strong>
                        </p>
                        <p>
                          <span className="text-gray-500 font-medium">Số tài khoản:</span>{' '}
                          <strong className="font-mono text-blue-700 text-xs font-bold">{studioProfile.bankAccount || '1015064592'}</strong>
                        </p>
                        <p>
                          <span className="text-gray-500 font-medium">Chủ tài khoản:</span>{' '}
                          <strong>{studioProfile.bankOwner || 'PHAN HUNG HUU'}</strong>
                        </p>
                        <p>
                          <span className="text-gray-500 font-medium">Nội dung:</span>{' '}
                          <strong className="font-mono text-gray-900 font-bold bg-white px-1.5 py-0.5 rounded border border-gray-200 inline-block mt-0.5">
                            thanh toan dich vu {removeVietnameseTones(clientName || activeClient?.name || 'khach hang')}
                          </strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {paymentTerms && (
                    <div>
                      <h5 className="font-bold text-gray-900 text-[11px] uppercase tracking-wider mb-0.5">Kiểm tra thông tin:</h5>
                      <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-line">{paymentTerms}</p>
                    </div>
                  )}

                  {notes && (
                    <div>
                      <h5 className="font-bold text-gray-900 text-[11px] uppercase tracking-wider mb-0.5">Ghi chú:</h5>
                      <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-line">{notes}</p>
                    </div>
                  )}
                </div>

                {/* Total Calculation Column */}
                <div className="w-full sm:w-72 shrink-0 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-200 text-gray-700">
                    <span>Cộng tiền hàng (Tạm tính):</span>
                    <span className="font-mono font-bold text-gray-900">{formatVND(subtotal)}</span>
                  </div>

                  {calculatedDiscount > 0 && (
                    <div className="flex justify-between py-1 border-b border-gray-200 text-rose-600">
                      <span>Chiết khấu ưu đãi:</span>
                      <span className="font-mono font-bold">-{formatVND(calculatedDiscount)}</span>
                    </div>
                  )}

                  {vatAmount > 0 && (
                    <div className="flex justify-between py-1 border-b border-gray-200 text-gray-700">
                      <span>Thuế VAT ({vatPercent}%):</span>
                      <span className="font-mono font-bold text-gray-900">+{formatVND(vatAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2.5 border-b-2 border-gray-900 text-sm font-extrabold text-gray-900">
                    <span className="tracking-wide uppercase font-extrabold">TỔNG CỘNG:</span>
                    <span className="font-mono text-blue-600 text-lg sm:text-xl font-black">{formatVND(grandTotal)}</span>
                  </div>

                  {depositAmount > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 flex justify-between items-center text-xs text-blue-900 font-bold">
                        <span>Tạm ứng đợt 1 ({effectiveDepositPercent}%):</span>
                        <span className="font-mono text-sm">{formatVND(depositAmount)}</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex justify-between items-center text-xs font-bold text-rose-700">
                        <span>Còn lại:</span>
                        <span className="font-mono text-sm sm:text-base font-black text-rose-600">
                          {formatVND(remainingAmount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400">
                Cảm ơn Quý khách đã tin tưởng và đồng hành cùng Hủ Design Studio. Chúc Quý đối tác phát triển thịnh vượng!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: QUOTATION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4 no-print">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Lịch sử Báo giá đã tạo ({quotations.length})
            </h3>
          </div>

          {quotations.length === 0 ? (
            <div className={`text-center py-12 rounded-xl border ${
              isLight ? 'border-gray-200 bg-gray-50/50 text-gray-400' : 'border-gray-800 bg-gray-900/40 text-gray-500'
            }`}>
              <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Chưa có bản báo giá nào được lưu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quotations.map((q) => (
                <div
                  key={q.id}
                  className={`p-5 rounded-xl border transition-all ${
                    isLight ? 'bg-white border-gray-200 shadow-xs' : 'bg-gray-900/70 border-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">{q.quotationNumber}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {q.status === 'approved' ? 'Đã duyệt' : 'Đã gửi'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1">{q.clientCompany}</h4>
                      <p className="text-xs text-gray-500">Người nhận: {q.clientName} • {formatDate(q.issueDate)}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-extrabold font-mono text-gray-900 dark:text-white block">
                        {formatVND(q.total)}
                      </span>
                      <span className="text-[11px] text-gray-500">{q.items.length} hạng mục</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedClientId(q.clientId);
                        setQuotationNumber(q.quotationNumber);
                        setQuoteItems(q.items);
                        setIssueDate(q.issueDate);
                        setDiscountPercent(q.discountPercent);
                        setVatPercent(q.vatPercent);
                        setDepositPercent(q.depositPercent ?? 50);
                        setDepositAmountCustom(q.depositAmount ?? 0);
                        setUseCustomDeposit(false);
                        setPaymentTerms(q.paymentTerms);
                        setNotes(q.notes);
                        setActiveTab('preview');
                      }}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Xem & In lại
                    </button>

                    <button
                      onClick={() => onDeleteQuotation(q.id)}
                      className="text-xs text-gray-400 hover:text-rose-500 transition"
                      title="Xóa báo giá"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
