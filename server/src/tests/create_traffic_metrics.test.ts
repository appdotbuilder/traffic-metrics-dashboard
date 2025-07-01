
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { trafficMetricsTable } from '../db/schema';
import { type CreateTrafficMetricsInput } from '../schema';
import { createTrafficMetrics } from '../handlers/create_traffic_metrics';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateTrafficMetricsInput = {
  date: new Date('2024-01-15'),
  page_views: 1250,
  unique_visitors: 850,
  bounce_rate: 35.75,
  avg_session_duration: 187.5
};

describe('createTrafficMetrics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create traffic metrics', async () => {
    const result = await createTrafficMetrics(testInput);

    // Basic field validation
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.page_views).toEqual(1250);
    expect(result.unique_visitors).toEqual(850);
    expect(result.bounce_rate).toEqual(35.75);
    expect(result.avg_session_duration).toEqual(187.5);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify numeric types are correct
    expect(typeof result.bounce_rate).toBe('number');
    expect(typeof result.avg_session_duration).toBe('number');
  });

  it('should save traffic metrics to database', async () => {
    const result = await createTrafficMetrics(testInput);

    // Query using proper drizzle syntax
    const metrics = await db.select()
      .from(trafficMetricsTable)
      .where(eq(trafficMetricsTable.id, result.id))
      .execute();

    expect(metrics).toHaveLength(1);
    expect(metrics[0].date).toEqual('2024-01-15'); // Date stored as string in DB
    expect(metrics[0].page_views).toEqual(1250);
    expect(metrics[0].unique_visitors).toEqual(850);
    expect(parseFloat(metrics[0].bounce_rate)).toEqual(35.75);
    expect(parseFloat(metrics[0].avg_session_duration)).toEqual(187.5);
    expect(metrics[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle decimal precision correctly', async () => {
    const preciseInput: CreateTrafficMetricsInput = {
      date: new Date('2024-01-16'),
      page_views: 2000,
      unique_visitors: 1200,
      bounce_rate: 42.37, // Test decimal precision
      avg_session_duration: 245.89 // Test decimal precision
    };

    const result = await createTrafficMetrics(preciseInput);

    expect(result.bounce_rate).toEqual(42.37);
    expect(result.avg_session_duration).toEqual(245.89);

    // Verify precision is maintained in database
    const metrics = await db.select()
      .from(trafficMetricsTable)
      .where(eq(trafficMetricsTable.id, result.id))
      .execute();

    expect(parseFloat(metrics[0].bounce_rate)).toEqual(42.37);
    expect(parseFloat(metrics[0].avg_session_duration)).toEqual(245.89);
  });

  it('should handle edge case values', async () => {
    const edgeCaseInput: CreateTrafficMetricsInput = {
      date: new Date('2024-12-31'),
      page_views: 0, // Minimum page views
      unique_visitors: 0, // Minimum unique visitors
      bounce_rate: 0, // Minimum bounce rate
      avg_session_duration: 0 // Minimum session duration
    };

    const result = await createTrafficMetrics(edgeCaseInput);

    expect(result.page_views).toEqual(0);
    expect(result.unique_visitors).toEqual(0);
    expect(result.bounce_rate).toEqual(0);
    expect(result.avg_session_duration).toEqual(0);
  });
});
