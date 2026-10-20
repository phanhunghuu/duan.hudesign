// src/db/schema.ts
import { pgTable, text, jsonb, primaryKey } from 'drizzle-orm/pg-core';

export const appEntities = pgTable(
  'app_entities',
  {
    collection: text('collection').notNull(),
    id: text('id').notNull(),
    data: jsonb('data').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.collection, table.id] }),
  })
);
