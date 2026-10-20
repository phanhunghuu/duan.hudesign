import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Client,
  DesignItem,
  Quotation,
  VideoContent,
  StudioProfile,
  ServicePricingBoard,
  BrandProfile,
  WeeklyPlan,
} from '../types';
import {
  initialClients,
  initialDesignItems,
  initialQuotations,
  initialVideoContents,
  initialStudioProfile,
} from '../data/initialData';
import { initialPricingBoards } from '../data/pricingTemplates';
import { initialBrandProfiles, initialWeeklyPlans } from '../data/initialContentPlanData';
import { syncEntityToSQL, deleteEntityFromSQL } from './sqlStorage';
import {
  loadClients,
  loadDesignItems,
  loadQuotations,
  loadContents,
  loadStudioProfile,
  loadPricingBoards,
  saveClients,
  saveDesignItems,
  saveQuotations,
  saveContents,
  saveStudioProfile,
  savePricingBoards,
} from './storage';

// Collection references
const clientsCol = collection(db, 'clients');
const designItemsCol = collection(db, 'designItems');
const quotationsCol = collection(db, 'quotations');
const contentsCol = collection(db, 'contents');
const pricingBoardsCol = collection(db, 'pricingBoards');
const brandsCol = collection(db, 'brands');
const weeklyPlansCol = collection(db, 'weeklyPlans');
const studioDocRef = doc(db, 'studio', 'profile');

// Initial seed helper: ensure cloud collections have full data without overwriting existing data
export async function seedCloudIfEmpty(): Promise<boolean> {
  try {
    const clientsSnap = await getDocs(clientsCol);
    if (clientsSnap.empty) {
      const batch = writeBatch(db);
      const localClients = loadClients();
      const clientsToSeed = localClients.length > 0 ? localClients : initialClients;
      clientsToSeed.forEach((client) => {
        batch.set(doc(db, 'clients', client.id), client);
      });

      const localDesignItems = loadDesignItems();
      const designsToSeed = localDesignItems.length > 0 ? localDesignItems : initialDesignItems;
      designsToSeed.forEach((item) => {
        batch.set(doc(db, 'designItems', item.id), item);
      });

      const localQuotations = loadQuotations();
      const quotesToSeed = localQuotations.length > 0 ? localQuotations : initialQuotations;
      quotesToSeed.forEach((quotation) => {
        batch.set(doc(db, 'quotations', quotation.id), quotation);
      });

      const localContents = loadContents();
      const contentsToSeed = localContents.length > 0 ? localContents : initialVideoContents;
      contentsToSeed.forEach((content) => {
        batch.set(doc(db, 'contents', content.id), content);
      });

      const localProfile = loadStudioProfile();
      batch.set(studioDocRef, localProfile || initialStudioProfile);

      await batch.commit();
    }

    // Ensure all pricing boards exist
    const pricingSnap = await getDocs(pricingBoardsCol);
    const existingBoardIds = new Set(pricingSnap.docs.map((d) => d.id));
    const localPricing = loadPricingBoards();
    const allBoards = [...(localPricing.length > 0 ? localPricing : initialPricingBoards)];
    initialPricingBoards.forEach((ib) => {
      if (!allBoards.some((b) => b.id === ib.id)) {
        allBoards.push(ib);
      }
    });
    const missingBoards = allBoards.filter((b) => !existingBoardIds.has(b.id));
    if (missingBoards.length > 0) {
      const batch = writeBatch(db);
      missingBoards.forEach((board) => {
        batch.set(doc(db, 'pricingBoards', board.id), board);
      });
      await batch.commit();
    }

    // Ensure brands exist
    const brandsSnap = await getDocs(brandsCol);
    if (brandsSnap.empty) {
      const batch = writeBatch(db);
      initialBrandProfiles.forEach((b) => {
        batch.set(doc(db, 'brands', b.id), b);
      });
      await batch.commit();
    }

    // Ensure weekly plans exist
    const plansSnap = await getDocs(weeklyPlansCol);
    if (plansSnap.empty) {
      const batch = writeBatch(db);
      initialWeeklyPlans.forEach((p) => {
        batch.set(doc(db, 'weeklyPlans', p.id), p);
      });
      await batch.commit();
    }

    return true;
  } catch (error) {
    console.warn('Firebase Firestore seed notice (using local storage fallback):', error);
    return false;
  }
}

// REALTIME SUBSCRIBERS
export function subscribeClients(
  onUpdate: (clients: Client[]) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    clientsCol,
    (snapshot) => {
      if (!snapshot.empty) {
        const cloudItems = snapshot.docs.map((d) => d.data() as Client);
        const localItems = loadClients();
        const cloudIds = new Set(cloudItems.map((c) => c.id));
        // Preserve any unsynced local client
        const unsynced = localItems.filter((c) => !cloudIds.has(c.id));
        if (unsynced.length > 0) {
          unsynced.forEach((c) => saveClientToCloud(c));
        }
        const combined = [...cloudItems, ...unsynced];
        combined.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        saveClients(combined);
        onUpdate(combined);
      } else {
        const local = loadClients();
        const fallback = local.length > 0 ? local : initialClients;
        onUpdate(fallback);
      }
    },
    (err) => {
      console.warn('Firestore clients listener warning:', err);
      onError?.(err);
    }
  );
}

export function subscribeDesignItems(
  onUpdate: (items: DesignItem[]) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    designItemsCol,
    (snapshot) => {
      if (!snapshot.empty) {
        const cloudItems = snapshot.docs.map((d) => d.data() as DesignItem);
        const localItems = loadDesignItems();
        const cloudIds = new Set(cloudItems.map((i) => i.id));
        const unsynced = localItems.filter((i) => !cloudIds.has(i.id));
        if (unsynced.length > 0) {
          unsynced.forEach((i) => saveDesignItemToCloud(i));
        }
        const combined = [...cloudItems, ...unsynced];
        combined.sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || '').getTime() -
            new Date(a.updatedAt || a.createdAt || '').getTime()
        );
        saveDesignItems(combined);
        onUpdate(combined);
      } else {
        const local = loadDesignItems();
        const fallback = local.length > 0 ? local : initialDesignItems;
        onUpdate(fallback);
      }
    },
    (err) => {
      console.warn('Firestore designItems listener warning:', err);
      onError?.(err);
    }
  );
}

export function subscribeQuotations(
  onUpdate: (quotations: Quotation[]) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    quotationsCol,
    (snapshot) => {
      if (!snapshot.empty) {
        const cloudItems = snapshot.docs.map((d) => d.data() as Quotation);
        const localItems = loadQuotations();
        const cloudIds = new Set(cloudItems.map((q) => q.id));
        const unsynced = localItems.filter((q) => !cloudIds.has(q.id));
        if (unsynced.length > 0) {
          unsynced.forEach((q) => saveQuotationToCloud(q));
        }
        const combined = [...cloudItems, ...unsynced];
        combined.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        saveQuotations(combined);
        onUpdate(combined);
      } else {
        const local = loadQuotations();
        const fallback = local.length > 0 ? local : initialQuotations;
        onUpdate(fallback);
      }
    },
    (err) => {
      console.warn('Firestore quotations listener warning:', err);
      onError?.(err);
    }
  );
}

export function subscribeContents(
  onUpdate: (contents: VideoContent[]) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    contentsCol,
    (snapshot) => {
      if (!snapshot.empty) {
        const cloudItems = snapshot.docs.map((d) => d.data() as VideoContent);
        const localItems = loadContents();
        const cloudIds = new Set(cloudItems.map((c) => c.id));
        const unsynced = localItems.filter((c) => !cloudIds.has(c.id));
        if (unsynced.length > 0) {
          unsynced.forEach((c) => saveContentToCloud(c));
        }
        const combined = [...cloudItems, ...unsynced];
        combined.sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || '').getTime() -
            new Date(a.updatedAt || a.createdAt || '').getTime()
        );
        saveContents(combined);
        onUpdate(combined);
      } else {
        const local = loadContents();
        const fallback = local.length > 0 ? local : initialVideoContents;
        onUpdate(fallback);
      }
    },
    (err) => {
      console.warn('Firestore contents listener warning:', err);
      onError?.(err);
    }
  );
}

export function subscribeStudioProfile(
  onUpdate: (profile: StudioProfile) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    studioDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const profile = snapshot.data() as StudioProfile;
        saveStudioProfile(profile);
        onUpdate(profile);
      } else {
        const local = loadStudioProfile();
        onUpdate(local || initialStudioProfile);
      }
    },
    (err) => {
      console.warn('Firestore studio profile listener warning:', err);
      onError?.(err);
    }
  );
}

export function subscribePricingBoards(
  onUpdate: (boards: ServicePricingBoard[]) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    pricingBoardsCol,
    (snapshot) => {
      if (!snapshot.empty) {
        const cloudItems = snapshot.docs.map((d) => d.data() as ServicePricingBoard);
        const cloudIds = new Set(cloudItems.map((b) => b.id));
        const combined = [...cloudItems];
        // Ensure all initial pricing boards exist
        initialPricingBoards.forEach((ib) => {
          if (!cloudIds.has(ib.id)) {
            combined.push(ib);
          }
        });
        savePricingBoards(combined);
        onUpdate(combined);
      } else {
        const local = loadPricingBoards();
        const fallback = local && local.length > 0 ? local : initialPricingBoards;
        onUpdate(fallback);
      }
    },
    (err) => {
      console.warn('Firestore pricing boards listener warning:', err);
      onError?.(err);
    }
  );
}

// Brands and Weekly Plans subscribers
export function subscribeBrands(
  onUpdate: (brands: BrandProfile[]) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    brandsCol,
    (snapshot) => {
      if (!snapshot.empty) {
        const cloudItems = snapshot.docs.map((d) => d.data() as BrandProfile);
        const cloudIds = new Set(cloudItems.map((b) => b.id));
        const combined = [...cloudItems];
        initialBrandProfiles.forEach((ib) => {
          if (!cloudIds.has(ib.id)) {
            combined.push(ib);
          }
        });
        try {
          localStorage.setItem('hu_design_brand_profiles_v1', JSON.stringify(combined));
        } catch (e) {}
        onUpdate(combined);
      } else {
        try {
          const saved = localStorage.getItem('hu_design_brand_profiles_v1');
          if (saved) {
            onUpdate(JSON.parse(saved));
            return;
          }
        } catch (e) {}
        onUpdate(initialBrandProfiles);
      }
    },
    (err) => {
      console.warn('Firestore brands listener warning:', err);
      onError?.(err);
    }
  );
}

export function subscribeWeeklyPlans(
  onUpdate: (plans: WeeklyPlan[]) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    weeklyPlansCol,
    (snapshot) => {
      if (!snapshot.empty) {
        const cloudItems = snapshot.docs.map((d) => d.data() as WeeklyPlan);
        const cloudIds = new Set(cloudItems.map((p) => p.id));
        const combined = [...cloudItems];
        initialWeeklyPlans.forEach((ip) => {
          if (!cloudIds.has(ip.id)) {
            combined.push(ip);
          }
        });
        try {
          localStorage.setItem('hu_design_weekly_plans_v1', JSON.stringify(combined));
        } catch (e) {}
        onUpdate(combined);
      } else {
        try {
          const saved = localStorage.getItem('hu_design_weekly_plans_v1');
          if (saved) {
            onUpdate(JSON.parse(saved));
            return;
          }
        } catch (e) {}
        onUpdate(initialWeeklyPlans);
      }
    },
    (err) => {
      console.warn('Firestore weeklyPlans listener warning:', err);
      onError?.(err);
    }
  );
}

// CLOUD MUTATION ACTIONS (Synchronizing to both Firestore and PostgreSQL)
export async function saveClientToCloud(client: Client): Promise<void> {
  syncEntityToSQL('clients', client.id, client);
  try {
    await setDoc(doc(db, 'clients', client.id), client);
  } catch (error) {
    console.error('Error saving client to Firestore:', error);
  }
}

export async function deleteClientFromCloud(clientId: string): Promise<void> {
  deleteEntityFromSQL('clients', clientId);
  try {
    await deleteDoc(doc(db, 'clients', clientId));
  } catch (error) {
    console.error('Error deleting client from Firestore:', error);
  }
}

export async function saveDesignItemToCloud(item: DesignItem): Promise<void> {
  syncEntityToSQL('designItems', item.id, item);
  try {
    await setDoc(doc(db, 'designItems', item.id), item);
  } catch (error) {
    console.error('Error saving design item to Firestore:', error);
  }
}

export async function deleteDesignItemFromCloud(itemId: string): Promise<void> {
  deleteEntityFromSQL('designItems', itemId);
  try {
    await deleteDoc(doc(db, 'designItems', itemId));
  } catch (error) {
    console.error('Error deleting design item from Firestore:', error);
  }
}

export async function saveQuotationToCloud(quotation: Quotation): Promise<void> {
  syncEntityToSQL('quotations', quotation.id, quotation);
  try {
    await setDoc(doc(db, 'quotations', quotation.id), quotation);
  } catch (error) {
    console.error('Error saving quotation to Firestore:', error);
  }
}

export async function deleteQuotationFromCloud(quotationId: string): Promise<void> {
  deleteEntityFromSQL('quotations', quotationId);
  try {
    await deleteDoc(doc(db, 'quotations', quotationId));
  } catch (error) {
    console.error('Error deleting quotation from Firestore:', error);
  }
}

export async function saveContentToCloud(content: VideoContent): Promise<void> {
  syncEntityToSQL('contents', content.id, content);
  try {
    await setDoc(doc(db, 'contents', content.id), content);
  } catch (error) {
    console.error('Error saving content to Firestore:', error);
  }
}

export async function deleteContentFromCloud(contentId: string): Promise<void> {
  deleteEntityFromSQL('contents', contentId);
  try {
    await deleteDoc(doc(db, 'contents', contentId));
  } catch (error) {
    console.error('Error deleting content from Firestore:', error);
  }
}

export async function saveStudioProfileToCloud(profile: StudioProfile): Promise<void> {
  syncEntityToSQL('studio', 'profile', profile);
  try {
    await setDoc(studioDocRef, profile);
  } catch (error) {
    console.error('Error saving studio profile to Firestore:', error);
  }
}

export async function savePricingBoardToCloud(board: ServicePricingBoard): Promise<void> {
  syncEntityToSQL('pricingBoards', board.id, board);
  try {
    await setDoc(doc(db, 'pricingBoards', board.id), board);
  } catch (error) {
    console.error('Error saving pricing board to Firestore:', error);
  }
}

export async function deletePricingBoardFromCloud(boardId: string): Promise<void> {
  deleteEntityFromSQL('pricingBoards', boardId);
  try {
    await deleteDoc(doc(db, 'pricingBoards', boardId));
  } catch (error) {
    console.error('Error deleting pricing board from Firestore:', error);
  }
}

export async function saveBrandToCloud(brand: BrandProfile): Promise<void> {
  syncEntityToSQL('brands', brand.id, brand);
  try {
    await setDoc(doc(db, 'brands', brand.id), brand);
  } catch (error) {
    console.error('Error saving brand to Firestore:', error);
  }
}

export async function deleteBrandFromCloud(brandId: string): Promise<void> {
  deleteEntityFromSQL('brands', brandId);
  try {
    await deleteDoc(doc(db, 'brands', brandId));
  } catch (error) {
    console.error('Error deleting brand from Firestore:', error);
  }
}

export async function saveWeeklyPlanToCloud(plan: WeeklyPlan): Promise<void> {
  syncEntityToSQL('weeklyPlans', plan.id, plan);
  try {
    await setDoc(doc(db, 'weeklyPlans', plan.id), plan);
  } catch (error) {
    console.error('Error saving weekly plan to Firestore:', error);
  }
}

export async function deleteWeeklyPlanFromCloud(planId: string): Promise<void> {
  deleteEntityFromSQL('weeklyPlans', planId);
  try {
    await deleteDoc(doc(db, 'weeklyPlans', planId));
  } catch (error) {
    console.error('Error deleting weekly plan from Firestore:', error);
  }
}

