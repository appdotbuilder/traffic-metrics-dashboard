
import { z } from 'zod';

// Traffic metrics schema
export const trafficMetricsSchema = z.object({
  id: z.number(),
  date: z.coerce.date(),
  page_views: z.number().int().nonnegative(),
  unique_visitors: z.number().int().nonnegative(),
  bounce_rate: z.number().min(0).max(100), // Bounce rate as percentage (0-100)
  avg_session_duration: z.number().nonnegative(), // Average session duration in seconds
  created_at: z.coerce.date()
});

export type TrafficMetrics = z.infer<typeof trafficMetricsSchema>;

// Input schema for creating traffic metrics
export const createTrafficMetricsInputSchema = z.object({
  date: z.coerce.date(),
  page_views: z.number().int().nonnegative(),
  unique_visitors: z.number().int().nonnegative(),
  bounce_rate: z.number().min(0).max(100),
  avg_session_duration: z.number().nonnegative()
});

export type CreateTrafficMetricsInput = z.infer<typeof createTrafficMetricsInputSchema>;

// Dashboard summary schema
export const dashboardSummarySchema = z.object({
  total_page_views: z.number().int().nonnegative(),
  total_unique_visitors: z.number().int().nonnegative(),
  avg_bounce_rate: z.number().min(0).max(100),
  avg_session_duration: z.number().nonnegative(),
  period_start: z.coerce.date(),
  period_end: z.coerce.date()
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

// Date range input schema for filtering metrics
export const dateRangeInputSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date()
});

export type DateRangeInput = z.infer<typeof dateRangeInputSchema>;
