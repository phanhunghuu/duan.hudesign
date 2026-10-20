// src/utils/sqlStorage.ts
// Dual-sync storage helper: automatically backs up to PostgreSQL (Cloud SQL) via API
export async function syncEntityToSQL(collection: string, id: string, data: any): Promise<void> {
  try {
    await fetch(`/api/db/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, data }),
    });
  } catch (err) {
    // Non-blocking
    console.warn(`[SQL Storage] Failed to sync ${collection}/${id}:`, err);
  }
}

export async function deleteEntityFromSQL(collection: string, id: string): Promise<void> {
  try {
    await fetch(`/api/db/${collection}/${id}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn(`[SQL Storage] Failed to delete ${collection}/${id}:`, err);
  }
}

export async function fetchEntitiesFromSQL<T = any>(collection: string): Promise<T[] | null> {
  try {
    const res = await fetch(`/api/db/${collection}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.warn(`[SQL Storage] Failed to fetch ${collection}:`, err);
    return null;
  }
}
