import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const inquiries = sqliteTable('inquiries', {
  id: text('id').primaryKey(),
  payloadHash: text('payload_hash').notNull(),
  reference: text('reference').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  occasion: text('occasion').notNull(),
  eventDate: text('event_date').notNull(),
  eventTime: text('event_time'),
  venue: text('venue').notNull(),
  guests: integer('guests').notNull(),
  budget: integer('budget'),
  menu: text('menu').notNull(),
  message: text('message').notNull(),
  consentAt: text('consent_at').notNull(),
  status: text('status').notNull().default('new'),
  createdAt: text('created_at').notNull(),
}, (table) => [index('idx_inquiries_status_created').on(table.status, table.createdAt)]);
export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, (table) => [index('idx_rate_limits_expiry').on(table.expiresAt)]);
