
import { db } from '../db';
import { trafficMetricsTable } from '../db/schema';
import { type DashboardSummary, type DateRangeInput } from '../schema';
import { gte, lte, and, avg, sum, SQL } from 'drizzle-orm';

export const getDashboardSummary = async (dateRange?: DateRangeInput): Promise<DashboardSummary> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    if (dateRange) {
      conditions.push(gte(trafficMetricsTable.date, dateRange.start_date.toISOString().split('T')[0]));
      conditions.push(lte(trafficMetricsTable.date, dateRange.end_date.toISOString().split('T')[0]));
    }

    // Build the complete query at once
    const baseQuery = db.select({
      total_page_views: sum(trafficMetricsTable.page_views),
      total_unique_visitors: sum(trafficMetricsTable.unique_visitors),
      avg_bounce_rate: avg(trafficMetricsTable.bounce_rate),
      avg_session_duration: avg(trafficMetricsTable.avg_session_duration)
    }).from(trafficMetricsTable);

    // Apply where clause if conditions exist
    const query = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    const result = await query.execute();
    const data = result[0];

    // Set default date range if not provided
    const defaultStartDate = new Date('2024-01-01');
    const defaultEndDate = new Date('2024-12-31');

    return {
      total_page_views: parseInt(data.total_page_views || '0'),
      total_unique_visitors: parseInt(data.total_unique_visitors || '0'),
      avg_bounce_rate: parseFloat(data.avg_bounce_rate || '0'),
      avg_session_duration: parseFloat(data.avg_session_duration || '0'),
      period_start: dateRange?.start_date || defaultStartDate,
      period_end: dateRange?.end_date || defaultEndDate
    };
  } catch (error) {
    console.error('Dashboard summary retrieval failed:', error);
    throw error;
  }
};
