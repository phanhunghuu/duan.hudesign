// src/db/entities.ts
import { db } from './index.ts';
import { appEntities } from './schema.ts';
import { eq, and } from 'drizzle-orm';

export async function getCollectionEntities(collectionName: string) {
  try {
    const rows = await db
      .select()
      .from(appEntities)
      .where(eq(appEntities.collection, collectionName));
    return rows.map((r) => r.data);
  } catch (error) {
    console.error(`Database query failed for collection ${collectionName}:`, error);
    throw new Error(`Failed to query ${collectionName}`, { cause: error });
  }
}

export async function upsertEntity(collectionName: string, id: string, data: any) {
  try {
    const now = new Date().toISOString();
    await db
      .insert(appEntities)
      .values({
        collection: collectionName,
        id,
        data,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [appEntities.collection, appEntities.id],
        set: {
          data,
          updatedAt: now,
        },
      });
  } catch (error) {
    console.error(`Database upsert failed for ${collectionName}:${id}:`, error);
    throw new Error(`Failed to upsert ${collectionName}:${id}`, { cause: error });
  }
}

export async function deleteEntity(collectionName: string, id: string) {
  try {
    await db
      .delete(appEntities)
      .where(and(eq(appEntities.collection, collectionName), eq(appEntities.id, id)));
  } catch (error) {
    console.error(`Database delete failed for ${collectionName}:${id}:`, error);
    throw new Error(`Failed to delete ${collectionName}:${id}`, { cause: error });
  }
}
