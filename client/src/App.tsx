
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, TrendingUpIcon, UsersIcon, MousePointerClickIcon, ClockIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { TrafficMetrics, DashboardSummary, DateRangeInput } from '../../server/src/schema';

function App() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentMetrics, setRecentMetrics] = useState<TrafficMetrics[]>([]);
  const [allMetrics, setAllMetrics] = useState<TrafficMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{
    start_date: string;
    end_date: string;
  }>({
    start_date: '2024-01-01',
    end_date: '2024-01-31'
  });

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load summary data
      const summaryResult = await trpc.getDashboardSummary.query();
      setSummary(summaryResult);

      // Load recent metrics (last 7 days)
      const recentResult = await trpc.getRecentMetrics.query(7);
      setRecentMetrics(recentResult);

      // Load all metrics
      const allResult = await trpc.getTrafficMetrics.query();
      setAllMetrics(allResult);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadFilteredMetrics = useCallback(async () => {
    if (!dateRange.start_date || !dateRange.end_date) return;
    
    setIsLoading(true);
    try {
      const dateRangeInput: DateRangeInput = {
        start_date: new Date(dateRange.start_date),
        end_date: new Date(dateRange.end_date)
      };

      const [summaryResult, metricsResult] = await Promise.all([
        trpc.getDashboardSummary.query(dateRangeInput),
        trpc.getTrafficMetrics.query(dateRangeInput)
      ]);

      setSummary(summaryResult);
      setAllMetrics(metricsResult);
    } catch (error) {
      console.error('Failed to load filtered data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const getMetricTrend = (current: number, previous: number): { percentage: number; isPositive: boolean } => {
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(change),
      isPositive: change > 0
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📊 Website Traffic Analytics
          </h1>
          <p className="text-gray-600">
            Monitor your website performance with real-time traffic insights
          </p>
        </div>

        {/* Date Range Filter */}
        <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Date Range Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.start_date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDateRange((prev) => ({ ...prev, start_date: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.end_date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDateRange((prev) => ({ ...prev, end_date: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <Button onClick={loadFilteredMetrics} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                {isLoading ? 'Loading...' : 'Apply Filter'}
              </Button>
              <Button variant="outline" onClick={loadDashboardData} disabled={isLoading}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Total Page Views</CardTitle>
                <MousePointerClickIcon className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(summary.total_page_views)}</div>
                <p className="text-xs opacity-90 mt-1">
                  Period: {summary.period_start.toLocaleDateString()} - {summary.period_end.toLocaleDateString()}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Unique Visitors</CardTitle>
                <UsersIcon className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(summary.total_unique_visitors)}</div>
                <p className="text-xs opacity-90 mt-1">
                  {((summary.total_unique_visitors / summary.total_page_views) * 100).toFixed(1)}% of page views
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Avg Bounce Rate</CardTitle>
                <TrendingUpIcon className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.avg_bounce_rate.toFixed(1)}%</div>
                <Badge variant={summary.avg_bounce_rate > 50 ? "destructive" : "secondary"} className="mt-1">
                  {summary.avg_bounce_rate > 50 ? 'Needs Attention' : 'Good'}
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Avg Session Duration</CardTitle>
                <ClockIcon className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(summary.avg_session_duration)}</div>
                <p className="text-xs opacity-90 mt-1">
                  {summary.avg_session_duration.toFixed(1)} seconds
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-white shadow-md">
            <TabsTrigger value="recent" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Recent Metrics (7 days)
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              All Metrics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>📈 Recent Traffic Trends</CardTitle>
                <CardDescription>
                  Daily metrics for the last 7 days with trend analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentMetrics.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No recent metrics available</p>
                ) : (
                  <div className="space-y-4">
                    {recentMetrics.map((metric: TrafficMetrics, index: number) => {
                      const previousMetric = recentMetrics[index + 1];
                      const pageViewTrend = previousMetric ? getMetricTrend(metric.page_views, previousMetric.page_views) : null;
                      const visitorTrend = previousMetric ? getMetricTrend(metric.unique_visitors, previousMetric.unique_visitors) : null;

                      return (
                        <div key={metric.id} className="p-4 rounded-lg border bg-gradient-to-r from-gray-50 to-white">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {metric.date.toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Added {metric.created_at.toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {index === 0 ? 'Latest' : `${index + 1} days ago`}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                              <div className="text-sm text-gray-600">Page Views</div>
                              <div className="text-xl font-bold text-blue-600">{formatNumber(metric.page_views)}</div>
                              {pageViewTrend && (
                                <div className={`text-xs ${pageViewTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                  {pageViewTrend.isPositive ? '↗' : '↘'} {pageViewTrend.percentage.toFixed(1)}%
                                </div>
                              )}
                            </div>
                            
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                              <div className="text-sm text-gray-600">Unique Visitors</div>
                              <div className="text-xl font-bold text-green-600">{formatNumber(metric.unique_visitors)}</div>
                              {visitorTrend && (
                                <div className={`text-xs ${visitorTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                  {visitorTrend.isPositive ? '↗' : '↘'} {visitorTrend.percentage.toFixed(1)}%
                                </div>
                              )}
                            </div>
                            
                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                              <div className="text-sm text-gray-600">Bounce Rate</div>
                              <div className="text-xl font-bold text-orange-600">{metric.bounce_rate.toFixed(1)}%</div>
                            </div>
                            
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                              <div className="text-sm text-gray-600">Session Duration</div>
                              <div className="text-xl font-bold text-purple-600">{formatDuration(metric.avg_session_duration)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>📋 Complete Metrics Table</CardTitle>
                <CardDescription>
                  All recorded traffic metrics {summary && `(${summary.period_start.toLocaleDateString()} - ${summary.period_end.toLocaleDateString()})`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allMetrics.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No metrics available for the selected period</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2">
                          <th className="text-left p-3 font-semibold">Date</th>
                          <th className="text-right p-3 font-semibold">Page Views</th>
                          <th className="text-right p-3 font-semibold">Unique Visitors</th>
                          <th className="text-right p-3 font-semibold">Bounce Rate</th>
                          <th className="text-right p-3 font-semibold">Avg Session</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allMetrics.map((metric: TrafficMetrics) => (
                          <tr key={metric.id} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="p-3">
                              <div>
                                <div className="font-medium">
                                  {metric.date.toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {metric.date.toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                              </div>
                            </td>
                            <td className="text-right p-3">
                              <div className="font-semibold text-blue-600">
                                {formatNumber(metric.page_views)}
                              </div>
                            </td>
                            <td className="text-right p-3">
                              <div className="font-semibold text-green-600">
                                {formatNumber(metric.unique_visitors)}
                              </div>
                            </td>
                            <td className="text-right p-3">
                              <Badge variant={metric.bounce_rate > 50 ? "destructive" : "secondary"}>
                                {metric.bounce_rate.toFixed(1)}%
                              </Badge>
                            </td>
                            <td className="text-right p-3">
                              <div className="font-semibold text-purple-600">
                                {formatDuration(metric.avg_session_duration)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>🚀 Powered by Analytics Dashboard • Data refreshed in real-time</p>
          <p className="mt-1">
            📊 Showing {summary ? formatNumber(summary.total_page_views) : '0'} total page views 
            • {summary ? formatNumber(summary.total_unique_visitors) : '0'} unique visitors
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
