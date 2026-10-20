import { Client, DesignItem, Quotation, VideoContent, StudioProfile, ServicePricingBoard } from '../types';
import { initialClients, initialDesignItems, initialQuotations, initialVideoContents, initialStudioProfile } from '../data/initialData';
import { initialPricingBoards } from '../data/pricingTemplates';

const KEYS = {
  CLIENTS: 'hu_design_clients_v1',
  DESIGN_ITEMS: 'hu_design_items_v1',
  QUOTATIONS: 'hu_design_quotations_v1',
  VIDEOS: 'hu_design_videos_v1',
  STUDIO: 'hu_design_studio_v1',
  THEME: 'hu_design_theme_v1',
  PRICING_BOARDS: 'hu_design_pricing_boards_v1',
};

export const loadClients = (): Client[] => {
  try {
    const data = localStorage.getItem(KEYS.CLIENTS);
    if (!data) {
      localStorage.setItem(KEYS.CLIENTS, JSON.stringify(initialClients));
      return initialClients;
    }
    return JSON.parse(data);
  } catch {
    return initialClients;
  }
};

export const saveClients = (clients: Client[]): void => {
  try {
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
  } catch (e) {
    console.error('Save clients failed', e);
  }
};

export const loadDesignItems = (): DesignItem[] => {
  try {
    const data = localStorage.getItem(KEYS.DESIGN_ITEMS);
    if (!data) {
      localStorage.setItem(KEYS.DESIGN_ITEMS, JSON.stringify(initialDesignItems));
      return initialDesignItems;
    }
    return JSON.parse(data);
  } catch {
    return initialDesignItems;
  }
};

export const saveDesignItems = (items: DesignItem[]): void => {
  try {
    localStorage.setItem(KEYS.DESIGN_ITEMS, JSON.stringify(items));
  } catch (e) {
    console.error('Save design items failed', e);
  }
};

export const loadQuotations = (): Quotation[] => {
  try {
    const data = localStorage.getItem(KEYS.QUOTATIONS);
    if (!data) {
      localStorage.setItem(KEYS.QUOTATIONS, JSON.stringify(initialQuotations));
      return initialQuotations;
    }
    return JSON.parse(data);
  } catch {
    return initialQuotations;
  }
};

export const saveQuotations = (quotations: Quotation[]): void => {
  try {
    localStorage.setItem(KEYS.QUOTATIONS, JSON.stringify(quotations));
  } catch (e) {
    console.error('Save quotations failed', e);
  }
};

export const loadContents = (): VideoContent[] => {
  try {
    const data = localStorage.getItem(KEYS.VIDEOS);
    if (!data) {
      localStorage.setItem(KEYS.VIDEOS, JSON.stringify(initialVideoContents));
      return initialVideoContents;
    }
    return JSON.parse(data);
  } catch {
    return initialVideoContents;
  }
};

export const saveContents = (videos: VideoContent[]): void => {
  try {
    localStorage.setItem(KEYS.VIDEOS, JSON.stringify(videos));
  } catch (e) {
    console.error('Save videos failed', e);
  }
};

export const loadStudioProfile = (): StudioProfile => {
  try {
    const data = localStorage.getItem(KEYS.STUDIO);
    if (!data) {
      localStorage.setItem(KEYS.STUDIO, JSON.stringify(initialStudioProfile));
      return initialStudioProfile;
    }
    const parsed = JSON.parse(data);
    let shouldUpdate = false;
    const updated = { ...initialStudioProfile, ...parsed };

    // Upgrade phone if legacy
    if (parsed.phone === '0988 123 456' || parsed.phone === '0988123456') {
      updated.phone = '0912 412 132';
      shouldUpdate = true;
    }

    // Upgrade bank account details if legacy
    if (parsed.bankAccount === '999988886666' || !parsed.bankQrImage || parsed.bankName?.includes('MB Bank')) {
      updated.bankName = initialStudioProfile.bankName;
      updated.bankAccount = initialStudioProfile.bankAccount;
      updated.bankOwner = initialStudioProfile.bankOwner;
      updated.bankBranch = initialStudioProfile.bankBranch;
      updated.bankQrImage = initialStudioProfile.bankQrImage;
      shouldUpdate = true;
    }

    // Upgrade payment terms & notes if using old defaults
    if (!parsed.defaultPaymentTerms || parsed.defaultPaymentTerms.includes('Thanh toán đợt 1: 50% ngay sau khi ký hợp đồng')) {
      updated.defaultPaymentTerms = initialStudioProfile.defaultPaymentTerms;
      shouldUpdate = true;
    }
    if (!parsed.defaultNote || parsed.defaultNote.includes('Báo giá đã bao gồm 03 lần chỉnh sửa theo brief chuẩn')) {
      updated.defaultNote = initialStudioProfile.defaultNote;
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      localStorage.setItem(KEYS.STUDIO, JSON.stringify(updated));
    }
    return updated;
  } catch {
    return initialStudioProfile;
  }
};

export const saveStudioProfile = (profile: StudioProfile): void => {
  try {
    localStorage.setItem(KEYS.STUDIO, JSON.stringify(profile));
  } catch (e) {
    console.error('Save studio profile failed', e);
  }
};

export const loadPricingBoards = (): ServicePricingBoard[] => {
  try {
    const data = localStorage.getItem(KEYS.PRICING_BOARDS);
    if (!data) {
      localStorage.setItem(KEYS.PRICING_BOARDS, JSON.stringify(initialPricingBoards));
      return initialPricingBoards;
    }
    return JSON.parse(data);
  } catch {
    return initialPricingBoards;
  }
};

export const savePricingBoards = (boards: ServicePricingBoard[]): void => {
  try {
    localStorage.setItem(KEYS.PRICING_BOARDS, JSON.stringify(boards));
  } catch (e) {
    console.error('Save pricing boards failed', e);
  }
};

export const storage = {
  getClients: loadClients,
  saveClients,
  getDesignItems: loadDesignItems,
  saveDesignItems,
  getQuotations: loadQuotations,
  saveQuotations,
  getVideos: loadContents,
  saveVideos: saveContents,
  getStudioProfile: loadStudioProfile,
  saveStudioProfile,
  getPricingBoards: loadPricingBoards,
  savePricingBoards,
  getTheme(): 'dark' | 'light' {
    try {
      const t = localStorage.getItem(KEYS.THEME);
      return t === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  },
  saveTheme(theme: 'dark' | 'light'): void {
    try {
      localStorage.setItem(KEYS.THEME, theme);
    } catch (e) {
      console.error('Save theme failed', e);
    }
  },
  resetAllData(): void {
    try {
      localStorage.setItem(KEYS.CLIENTS, JSON.stringify(initialClients));
      localStorage.setItem(KEYS.DESIGN_ITEMS, JSON.stringify(initialDesignItems));
      localStorage.setItem(KEYS.QUOTATIONS, JSON.stringify(initialQuotations));
      localStorage.setItem(KEYS.VIDEOS, JSON.stringify(initialVideoContents));
      localStorage.setItem(KEYS.STUDIO, JSON.stringify(initialStudioProfile));
    } catch (e) {
      console.error('Reset data failed', e);
    }
  },
  exportAllData(): string {
    const data = {
      clients: loadClients(),
      designItems: loadDesignItems(),
      quotations: loadQuotations(),
      videos: loadContents(),
      studioProfile: loadStudioProfile(),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    return JSON.stringify(data, null, 2);
  },
  importAllData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.clients && Array.isArray(parsed.clients)) {
        saveClients(parsed.clients);
      }
      if (parsed.designItems && Array.isArray(parsed.designItems)) {
        saveDesignItems(parsed.designItems);
      }
      if (parsed.quotations && Array.isArray(parsed.quotations)) {
        saveQuotations(parsed.quotations);
      }
      if (parsed.videos && Array.isArray(parsed.videos)) {
        saveContents(parsed.videos);
      }
      if (parsed.studioProfile) {
        saveStudioProfile(parsed.studioProfile);
      }
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },
};
