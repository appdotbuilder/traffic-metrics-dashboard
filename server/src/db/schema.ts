
import { serial, pgTable, timestamp, integer, numeric, date } from 'drizzle-orm/pg-core';

export const trafficMetricsTable = pgTable('traffic_metrics', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(), // Date for the metrics (YYYY-MM-DD)
  page_views: integer('page_views').notNull(), // Total page views for the day
  unique_visitors: integer('unique_visitors').notNull(), // Unique visitors count
  bounce_rate: numeric('bounce_rate', { precision: 5, scale: 2 }).notNull(), // Bounce rate as percentage with 2 decimal places
  avg_session_duration: numeric('avg_session_duration', { precision: 10, scale: 2 }).notNull(), // Average session duration in seconds
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type TrafficMetrics = typeof trafficMetricsTable.$inferSelect; // For SELECT operations
export type NewTrafficMetrics = typeof trafficMetricsTable.$inferInsert; // For INSERT operations

// Export all tables for proper query building
export const tables = { trafficMetrics: trafficMetricsTable };
