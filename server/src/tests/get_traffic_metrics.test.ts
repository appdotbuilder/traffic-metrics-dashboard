
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { trafficMetricsTable } from '../db/schema';
import { type DateRangeInput } from '../schema';
import { getTrafficMetrics } from '../handlers/get_traffic_metrics';

describe('getTrafficMetrics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all traffic metrics when no date range is provided', async () => {
    // Create test data
    await db.insert(trafficMetricsTable).values([
      {
        date: '2024-01-01',
        page_views: 1000,
        unique_visitors: 500,
        bounce_rate: '45.5',
        avg_session_duration: '180.75'
      },
      {
        date: '2024-01-02',
        page_views: 1200,
        unique_visitors: 600,
        bounce_rate: '42.3',
        avg_session_duration: '195.25'
      },
      {
        date: '2024-01-03',
        page_views: 800,
        unique_visitors: 400,
        bounce_rate: '50.1',
        avg_session_duration: '165.50'
      }
    ]).execute();

    const result = await getTrafficMetrics();

    expect(result).toHaveLength(3);
    
    // Verify data types and ordering (should be ordered by date ascending)
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].date).toEqual(new Date('2024-01-01'));
    expect(result[0].page_views).toEqual(1000);
    expect(result[0].unique_visitors).toEqual(500);
    expect(typeof result[0].bounce_rate).toBe('number');
    expect(result[0].bounce_rate).toEqual(45.5);
    expect(typeof result[0].avg_session_duration).toBe('number');
    expect(result[0].avg_session_duration).toEqual(180.75);
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second record
    expect(result[1].date).toEqual(new Date('2024-01-02'));
    expect(result[1].page_views).toEqual(1200);
    expect(result[1].bounce_rate).toEqual(42.3);

    // Verify third record
    expect(result[2].date).toEqual(new Date('2024-01-03'));
    expect(result[2].page_views).toEqual(800);
    expect(result[2].avg_session_duration).toEqual(165.50);
  });

  it('should filter traffic metrics by date range', async () => {
    // Create test data spanning multiple days
    await db.insert(trafficMetricsTable).values([
      {
        date: '2024-01-01',
        page_views: 1000,
        unique_visitors: 500,
        bounce_rate: '45.5',
        avg_session_duration: '180.75'
      },
      {
        date: '2024-01-02',
        page_views: 1200,
        unique_visitors: 600,
        bounce_rate: '42.3',
        avg_session_duration: '195.25'
      },
      {
        date: '2024-01-03',
        page_views: 800,
        unique_visitors: 400,
        bounce_rate: '50.1',
        avg_session_duration: '165.50'
      },
      {
        date: '2024-01-05',
        page_views: 900,
        unique_visitors: 450,
        bounce_rate: '48.7',
        avg_session_duration: '172.30'
      }
    ]).execute();

    const dateRange: DateRangeInput = {
      start_date: new Date('2024-01-02'),
      end_date: new Date('2024-01-03')
    };

    const result = await getTrafficMetrics(dateRange);

    expect(result).toHaveLength(2);
    expect(result[0].date).toEqual(new Date('2024-01-02'));
    expect(result[0].page_views).toEqual(1200);
    expect(result[1].date).toEqual(new Date('2024-01-03'));
    expect(result[1].page_views).toEqual(800);
  });

  it('should return empty array when no metrics exist in date range', async () => {
    // Create test data outside the query range
    await db.insert(trafficMetricsTable).values([
      {
        date: '2024-01-01',
        page_views: 1000,
        unique_visitors: 500,
        bounce_rate: '45.5',
        avg_session_duration: '180.75'
      }
    ]).execute();

    const dateRange: DateRangeInput = {
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-02-28')
    };

    const result = await getTrafficMetrics(dateRange);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no traffic metrics exist', async () => {
    const result = await getTrafficMetrics();

    expect(result).toHaveLength(0);
  });

  it('should handle single day date range', async () => {
    // Create test data
    await db.insert(trafficMetricsTable).values([
      {
        date: '2024-01-01',
        page_views: 1000,
        unique_visitors: 500,
        bounce_rate: '45.5',
        avg_session_duration: '180.75'
      },
      {
        date: '2024-01-02',
        page_views: 1200,
        unique_visitors: 600,
        bounce_rate: '42.3',
        avg_session_duration: '195.25'
      }
    ]).execute();

    const dateRange: DateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-01')
    };

    const result = await getTrafficMetrics(dateRange);

    expect(result).toHaveLength(1);
    expect(result[0].date).toEqual(new Date('2024-01-01'));
    expect(result[0].page_views).toEqual(1000);
  });
});
