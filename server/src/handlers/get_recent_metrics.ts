
import { db } from '../db';
import { trafficMetricsTable } from '../db/schema';
import { type TrafficMetrics } from '../schema';
import { desc, gte } from 'drizzle-orm';

export const getRecentMetrics = async (days: number = 7): Promise<TrafficMetrics[]> => {
  try {
    // Calculate the start date (days ago from today)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Query for metrics from the last N days, ordered by date descending (most recent first)
    const results = await db.select()
      .from(trafficMetricsTable)
      .where(gte(trafficMetricsTable.date, startDate.toISOString().split('T')[0])) // Convert to YYYY-MM-DD format
      .orderBy(desc(trafficMetricsTable.date))
      .limit(days)
      .execute();

    // Convert numeric fields and date fields back to proper types before returning
    return results.map(metric => ({
      ...metric,
      date: new Date(metric.date), // Convert string date to Date object
      bounce_rate: parseFloat(metric.bounce_rate),
      avg_session_duration: parseFloat(metric.avg_session_duration)
    }));
  } catch (error) {
    console.error('Failed to fetch recent metrics:', error);
    throw error;
  }
};
