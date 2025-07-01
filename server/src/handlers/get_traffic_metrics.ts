
import { db } from '../db';
import { trafficMetricsTable } from '../db/schema';
import { type TrafficMetrics, type DateRangeInput } from '../schema';
import { and, gte, lte, asc } from 'drizzle-orm';

export const getTrafficMetrics = async (dateRange?: DateRangeInput): Promise<TrafficMetrics[]> => {
  try {
    // Build query with conditional filtering
    const baseQuery = db.select().from(trafficMetricsTable);
    
    const finalQuery = dateRange
      ? baseQuery.where(
          and(
            gte(trafficMetricsTable.date, dateRange.start_date.toISOString().split('T')[0]), // Convert Date to YYYY-MM-DD string
            lte(trafficMetricsTable.date, dateRange.end_date.toISOString().split('T')[0])
          )
        ).orderBy(asc(trafficMetricsTable.date))
      : baseQuery.orderBy(asc(trafficMetricsTable.date));

    const results = await finalQuery.execute();

    // Convert numeric fields back to numbers and date strings back to Date objects
    return results.map(metric => ({
      ...metric,
      date: new Date(metric.date), // Convert date string to Date object
      bounce_rate: parseFloat(metric.bounce_rate), // Convert numeric string to number
      avg_session_duration: parseFloat(metric.avg_session_duration) // Convert numeric string to number
    }));
  } catch (error) {
    console.error('Failed to get traffic metrics:', error);
    throw error;
  }
};
