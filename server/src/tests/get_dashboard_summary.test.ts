
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { trafficMetricsTable } from '../db/schema';
import { type DateRangeInput } from '../schema';
import { getDashboardSummary } from '../handlers/get_dashboard_summary';

describe('getDashboardSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return dashboard summary without date filter', async () => {
    // Create test data
    await db.insert(trafficMetricsTable).values([
      {
        date: '2024-01-15',
        page_views: 1000,
        unique_visitors: 800,
        bounce_rate: '45.50',
        avg_session_duration: '180.25'
      },
      {
        date: '2024-01-16',
        page_views: 1200,
        unique_visitors: 900,
        bounce_rate: '40.75',
        avg_session_duration: '200.50'
      }
    ]).execute();

    const result = await getDashboardSummary();

    expect(result.total_page_views).toEqual(2200);
    expect(result.total_unique_visitors).toEqual(1700);
    expect(result.avg_bounce_rate).toBeCloseTo(43.125, 2);
    expect(result.avg_session_duration).toBeCloseTo(190.375, 2);
    expect(result.period_start).toBeInstanceOf(Date);
    expect(result.period_end).toBeInstanceOf(Date);
  });

  it('should return dashboard summary with date range filter', async () => {
    // Create test data spanning different dates
    await db.insert(trafficMetricsTable).values([
      {
        date: '2024-01-10',
        page_views: 500,
        unique_visitors: 400,
        bounce_rate: '50.00',
        avg_session_duration: '150.00'
      },
      {
        date: '2024-01-15',
        page_views: 1000,
        unique_visitors: 800,
        bounce_rate: '45.50',
        avg_session_duration: '180.25'
      },
      {
        date: '2024-01-20',
        page_views: 1500,
        unique_visitors: 1200,
        bounce_rate: '35.25',
        avg_session_duration: '220.75'
      }
    ]).execute();

    const dateRange: DateRangeInput = {
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-20')
    };

    const result = await getDashboardSummary(dateRange);

    expect(result.total_page_views).toEqual(2500);
    expect(result.total_unique_visitors).toEqual(2000);
    expect(result.avg_bounce_rate).toBeCloseTo(40.375, 2);
    expect(result.avg_session_duration).toBeCloseTo(200.5, 2);
    expect(result.period_start).toEqual(dateRange.start_date);
    expect(result.period_end).toEqual(dateRange.end_date);
  });

  it('should return zero values when no data exists', async () => {
    const result = await getDashboardSummary();

    expect(result.total_page_views).toEqual(0);
    expect(result.total_unique_visitors).toEqual(0);
    expect(result.avg_bounce_rate).toEqual(0);
    expect(result.avg_session_duration).toEqual(0);
    expect(result.period_start).toBeInstanceOf(Date);
    expect(result.period_end).toBeInstanceOf(Date);
  });

  it('should return zero values when date range has no matching data', async () => {
    // Create data outside the filter range
    await db.insert(trafficMetricsTable).values({
      date: '2024-01-01',
      page_views: 1000,
      unique_visitors: 800,
      bounce_rate: '45.50',
      avg_session_duration: '180.25'
    }).execute();

    const dateRange: DateRangeInput = {
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-02-28')
    };

    const result = await getDashboardSummary(dateRange);

    expect(result.total_page_views).toEqual(0);
    expect(result.total_unique_visitors).toEqual(0);
    expect(result.avg_bounce_rate).toEqual(0);
    expect(result.avg_session_duration).toEqual(0);
    expect(result.period_start).toEqual(dateRange.start_date);
    expect(result.period_end).toEqual(dateRange.end_date);
  });

  it('should handle single day date range', async () => {
    await db.insert(trafficMetricsTable).values({
      date: '2024-01-15',
      page_views: 1000,
      unique_visitors: 800,
      bounce_rate: '45.50',
      avg_session_duration: '180.25'
    }).execute();

    const dateRange: DateRangeInput = {
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-15')
    };

    const result = await getDashboardSummary(dateRange);

    expect(result.total_page_views).toEqual(1000);
    expect(result.total_unique_visitors).toEqual(800);
    expect(result.avg_bounce_rate).toEqual(45.5);
    expect(result.avg_session_duration).toEqual(180.25);
    expect(result.period_start).toEqual(dateRange.start_date);
    expect(result.period_end).toEqual(dateRange.end_date);
  });
});
