
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { createTrafficMetricsInputSchema, dateRangeInputSchema } from './schema';
import { createTrafficMetrics } from './handlers/create_traffic_metrics';
import { getTrafficMetrics } from './handlers/get_traffic_metrics';
import { getDashboardSummary } from './handlers/get_dashboard_summary';
import { getRecentMetrics } from './handlers/get_recent_metrics';
import { z } from 'zod';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create new traffic metrics entry
  createTrafficMetrics: publicProcedure
    .input(createTrafficMetricsInputSchema)
    .mutation(({ input }) => createTrafficMetrics(input)),
  
  // Get traffic metrics with optional date range filtering
  getTrafficMetrics: publicProcedure
    .input(dateRangeInputSchema.optional())
    .query(({ input }) => getTrafficMetrics(input)),
  
  // Get dashboard summary with aggregated metrics
  getDashboardSummary: publicProcedure
    .input(dateRangeInputSchema.optional())
    .query(({ input }) => getDashboardSummary(input)),
  
  // Get recent metrics for specified number of days
  getRecentMetrics: publicProcedure
    .input(z.number().int().positive().default(7))
    .query(({ input }) => getRecentMetrics(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
