
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { trafficMetricsTable } from '../db/schema';
import { type CreateTrafficMetricsInput } from '../schema';
import { getRecentMetrics } from '../handlers/get_recent_metrics';

// Helper function to create test traffic metrics
const createTestMetric = async (daysAgo: number): Promise<void> => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  
  await db.insert(trafficMetricsTable)
    .values({
      date: date.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
      page_views: 10000 + daysAgo * 1000,
      unique_visitors: 5000 + daysAgo * 500,
      bounce_rate: (45.5 + daysAgo).toString(),
      avg_session_duration: (180.25 + daysAgo * 10).toString()
    })
    .execute();
};

describe('getRecentMetrics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return recent metrics for default 7 days', async () => {
    // Create test data for the last 5 days
    for (let i = 0; i < 5; i++) {
      await createTestMetric(i);
    }

    const result = await getRecentMetrics();

    expect(result).toHaveLength(5);
    expect(result[0].page_views).toEqual(10000); // Most recent (0 days ago)
    expect(result[4].page_views).toEqual(14000); // Oldest (4 days ago)
    
    // Verify numeric field conversions
    expect(typeof result[0].bounce_rate).toBe('number');
    expect(typeof result[0].avg_session_duration).toBe('number');
    expect(result[0].date).toBeInstanceOf(Date);
  });

  it('should return metrics for specified number of days', async () => {
    // Create test data for the last 10 days
    for (let i = 0; i < 10; i++) {
      await createTestMetric(i);
    }

    const result = await getRecentMetrics(3);

    expect(result).toHaveLength(3);
    expect(result[0].page_views).toEqual(10000); // Most recent
    expect(result[2].page_views).toEqual(12000); // 2 days ago
  });

  it('should return empty array when no metrics exist', async () => {
    const result = await getRecentMetrics();

    expect(result).toHaveLength(0);
  });

  it('should return metrics ordered by date descending', async () => {
    // Create test data out of order
    await createTestMetric(5); // 5 days ago
    await createTestMetric(1); // 1 day ago
    await createTestMetric(3); // 3 days ago

    const result = await getRecentMetrics();

    expect(result).toHaveLength(3);
    // Should be ordered most recent first
    expect(result[0].page_views).toEqual(11000); // 1 day ago
    expect(result[1].page_views).toEqual(13000); // 3 days ago
    expect(result[2].page_views).toEqual(15000); // 5 days ago

    // Verify dates are in descending order
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].date >= result[i + 1].date).toBe(true);
    }
  });

  it('should exclude metrics older than specified days', async () => {
    // Create metrics spanning 10 days
    for (let i = 0; i < 10; i++) {
      await createTestMetric(i);
    }

    const result = await getRecentMetrics(5);

    expect(result).toHaveLength(5);
    // Should only include metrics from last 5 days
    const oldestMetric = result[result.length - 1];
    expect(oldestMetric.page_views).toEqual(14000); // 4 days ago, not 9 days ago
  });

  it('should properly convert numeric and date fields', async () => {
    await createTestMetric(0);

    const result = await getRecentMetrics(1);

    expect(result).toHaveLength(1);
    const metric = result[0];
    
    // Verify all type conversions
    expect(typeof metric.bounce_rate).toBe('number');
    expect(typeof metric.avg_session_duration).toBe('number');
    expect(metric.date).toBeInstanceOf(Date);
    expect(metric.bounce_rate).toEqual(45.5);
    expect(metric.avg_session_duration).toEqual(180.25);
  });
});
