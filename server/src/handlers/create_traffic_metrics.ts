
import { db } from '../db';
import { trafficMetricsTable } from '../db/schema';
import { type CreateTrafficMetricsInput, type TrafficMetrics } from '../schema';

export const createTrafficMetrics = async (input: CreateTrafficMetricsInput): Promise<TrafficMetrics> => {
  try {
    // Insert traffic metrics record
    const result = await db.insert(trafficMetricsTable)
      .values({
        date: input.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        page_views: input.page_views,
        unique_visitors: input.unique_visitors,
        bounce_rate: input.bounce_rate.toString(), // Convert number to string for numeric column
        avg_session_duration: input.avg_session_duration.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const metrics = result[0];
    return {
      ...metrics,
      date: new Date(metrics.date), // Convert date string back to Date object
      bounce_rate: parseFloat(metrics.bounce_rate), // Convert string back to number
      avg_session_duration: parseFloat(metrics.avg_session_duration) // Convert string back to number
    };
  } catch (error) {
    console.error('Traffic metrics creation failed:', error);
    throw error;
  }
};
