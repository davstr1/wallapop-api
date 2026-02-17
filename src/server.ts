import path from 'path';
import express from 'express';
import cors from 'cors';
import { WallapopClient } from './client';
import { config } from './config';
import { SearchParams } from './types';
import { filterContinentalSpain } from './filters';

export function createApp(client?: WallapopClient) {
  const app = express();
  const wallapop = client ?? new WallapopClient();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  // ── Health ────────────────────────────────────────────

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // ── Search ────────────────────────────────────────────

  app.get('/api/v1/search', async (req, res, next) => {
    try {
      const params: SearchParams = {
        keywords: req.query.keywords as string | undefined,
        min_sale_price: req.query.min_sale_price ? Number(req.query.min_sale_price) : undefined,
        max_sale_price: req.query.max_sale_price ? Number(req.query.max_sale_price) : undefined,
        distance: req.query.distance ? Number(req.query.distance) : undefined,
        latitude: req.query.latitude ? Number(req.query.latitude) : undefined,
        longitude: req.query.longitude ? Number(req.query.longitude) : undefined,
        category_id: req.query.category_id ? Number(req.query.category_id) : undefined,
        subcategory_ids: req.query.subcategory_ids as string | undefined,
        order_by: req.query.order_by as SearchParams['order_by'],
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        next_page: req.query.next_page as string | undefined,
      };

      if (!params.keywords && !params.next_page) {
        res.status(400).json({ error: 'keywords or next_page is required' });
        return;
      }

      const data = await wallapop.search(params);

      // Post-filter: continental Spain only if requested
      if (req.query.continental === 'true' && data?.data?.section?.payload?.items) {
        data.data.section.payload.items = filterContinentalSpain(data.data.section.payload.items);
      }

      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // ── Item Details ──────────────────────────────────────

  app.get('/api/v1/items/:itemId', async (req, res, next) => {
    try {
      const data = await wallapop.getItem(req.params.itemId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // ── Item Counters (views, favorites, conversations) ────

  app.get('/api/v1/items/:itemId/counters', async (req, res, next) => {
    try {
      const data = await wallapop.getItem(req.params.itemId);
      res.json(data.counters ?? { views: 0, favorites: 0, conversations: 0 });
    } catch (err) {
      next(err);
    }
  });

  // ── Extract Item ID from URL ──────────────────────────

  app.get('/api/v1/itemId', async (req, res, next) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        res.status(400).json({ error: 'url query parameter is required' });
        return;
      }
      const itemId = await wallapop.extractItemId(url);
      res.json({ itemId });
    } catch (err) {
      next(err);
    }
  });

  // ── User Profile ──────────────────────────────────────

  app.get('/api/v1/users/:userId', async (req, res, next) => {
    try {
      const data = await wallapop.getUser(req.params.userId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // ── User Stats ────────────────────────────────────────

  app.get('/api/v1/users/:userId/stats', async (req, res, next) => {
    try {
      const data = await wallapop.getUserStats(req.params.userId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // ── User Items ────────────────────────────────────────

  app.get('/api/v1/users/:userId/items', async (req, res, next) => {
    try {
      const data = await wallapop.getUserItems(req.params.userId, {
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        next_page: req.query.next_page as string | undefined,
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // ── Categories ────────────────────────────────────────

  app.get('/api/v1/categories', async (_req, res, next) => {
    try {
      const data = await wallapop.getCategories();
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // ── Messaging Inbox ───────────────────────────────────

  app.get('/api/v1/inbox', async (req, res, next) => {
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Bearer token required in Authorization header' });
        return;
      }
      const token = auth.slice(7);
      const data = await wallapop.getInbox(token, {
        pageSize: req.query.page_size ? Number(req.query.page_size) : undefined,
        maxMessages: req.query.max_messages ? Number(req.query.max_messages) : undefined,
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // ── Error handler ─────────────────────────────────────

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.response?.status || err.status || 500;
    const message = err.response?.data?.error?.message || err.message || 'Internal server error';
    console.error(`[${status}] ${message}`);
    res.status(status).json({ error: message });
  });

  return app;
}

// Start server if run directly
if (require.main === module) {
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`🚀 Wallapop API running on http://localhost:${config.port}`);
    console.log(`   Proxy: ${config.proxyUrl ? '✅ configured' : '❌ not configured'}`);
  });
}
