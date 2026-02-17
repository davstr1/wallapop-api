import request from 'supertest';
import { createApp } from '../server';
import { WallapopClient } from '../client';

// Mock the client
jest.mock('../client');

const MockedClient = WallapopClient as jest.MockedClass<typeof WallapopClient>;

describe('API Server', () => {
  let app: ReturnType<typeof createApp>;
  let mockClient: jest.Mocked<WallapopClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = new MockedClient() as jest.Mocked<WallapopClient>;
    app = createApp(mockClient);
  });

  // ── Health ────────────────────────────────────────────

  describe('GET /health', () => {
    it('should return ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  // ── Search ────────────────────────────────────────────

  describe('GET /api/v1/search', () => {
    it('should return 400 without keywords or next_page', async () => {
      const res = await request(app).get('/api/v1/search');
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/keywords/i);
    });

    it('should proxy search with keywords', async () => {
      const mockData = {
        data: { section: { payload: { items: [] } } },
        meta: {},
      };
      mockClient.search = jest.fn().mockResolvedValue(mockData);

      const res = await request(app).get('/api/v1/search?keywords=iphone');

      expect(res.status).toBe(200);
      expect(mockClient.search).toHaveBeenCalledWith(
        expect.objectContaining({ keywords: 'iphone' })
      );
    });

    it('should pass all query params to client', async () => {
      mockClient.search = jest.fn().mockResolvedValue({ data: { section: { payload: { items: [] } } }, meta: {} });

      await request(app).get(
        '/api/v1/search?keywords=phone&min_sale_price=100&max_sale_price=500&latitude=41.38&longitude=2.17&distance=5000&category_id=15000&order_by=newest&limit=20'
      );

      expect(mockClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          keywords: 'phone',
          min_sale_price: 100,
          max_sale_price: 500,
          latitude: 41.38,
          longitude: 2.17,
          distance: 5000,
          category_id: 15000,
          order_by: 'newest',
          limit: 20,
        })
      );
    });

    it('should accept next_page without keywords', async () => {
      mockClient.search = jest.fn().mockResolvedValue({ data: { section: { payload: { items: [] } } }, meta: {} });

      const res = await request(app).get('/api/v1/search?next_page=token123');
      expect(res.status).toBe(200);
    });
  });

  // ── Item Details ──────────────────────────────────────

  describe('GET /api/v1/items/:itemId', () => {
    it('should return item details', async () => {
      const mockItem = { id: 'abc', title: { original: 'Test' } };
      mockClient.getItem = jest.fn().mockResolvedValue(mockItem);

      const res = await request(app).get('/api/v1/items/abc');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockItem);
      expect(mockClient.getItem).toHaveBeenCalledWith('abc');
    });
  });

  // ── Extract Item ID ───────────────────────────────────

  describe('GET /api/v1/itemId', () => {
    it('should return 400 without url param', async () => {
      const res = await request(app).get('/api/v1/itemId');
      expect(res.status).toBe(400);
    });

    it('should extract item ID from URL', async () => {
      mockClient.extractItemId = jest.fn().mockResolvedValue('xyz789');

      const res = await request(app).get('/api/v1/itemId?url=https://es.wallapop.com/item/test');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ itemId: 'xyz789' });
    });
  });

  // ── User Profile ──────────────────────────────────────

  describe('GET /api/v1/users/:userId', () => {
    it('should return user profile', async () => {
      const mockUser = { id: 'u1', micro_name: 'Test' };
      mockClient.getUser = jest.fn().mockResolvedValue(mockUser);

      const res = await request(app).get('/api/v1/users/u1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUser);
    });
  });

  // ── User Stats ────────────────────────────────────────

  describe('GET /api/v1/users/:userId/stats', () => {
    it('should return user stats', async () => {
      const mockStats = { ratings: [], counters: [] };
      mockClient.getUserStats = jest.fn().mockResolvedValue(mockStats);

      const res = await request(app).get('/api/v1/users/u1/stats');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockStats);
    });
  });

  // ── User Items ────────────────────────────────────────

  describe('GET /api/v1/users/:userId/items', () => {
    it('should return user items', async () => {
      mockClient.getUserItems = jest.fn().mockResolvedValue({ items: [] });

      const res = await request(app).get('/api/v1/users/u1/items?limit=10');

      expect(res.status).toBe(200);
      expect(mockClient.getUserItems).toHaveBeenCalledWith('u1', expect.objectContaining({ limit: 10 }));
    });
  });

  // ── Categories ────────────────────────────────────────

  describe('GET /api/v1/categories', () => {
    it('should return categories', async () => {
      const mockCats = { categories: [{ id: 1, name: 'Cars' }] };
      mockClient.getCategories = jest.fn().mockResolvedValue(mockCats);

      const res = await request(app).get('/api/v1/categories');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockCats);
    });
  });

  // ── Inbox ─────────────────────────────────────────────

  describe('GET /api/v1/inbox', () => {
    it('should return 401 without auth header', async () => {
      const res = await request(app).get('/api/v1/inbox');
      expect(res.status).toBe(401);
    });

    it('should proxy inbox with bearer token', async () => {
      mockClient.getInbox = jest.fn().mockResolvedValue({ conversations: [] });

      const res = await request(app)
        .get('/api/v1/inbox?page_size=50&max_messages=3')
        .set('Authorization', 'Bearer my-token');

      expect(res.status).toBe(200);
      expect(mockClient.getInbox).toHaveBeenCalledWith('my-token', {
        pageSize: 50,
        maxMessages: 3,
      });
    });
  });

  // ── Error handling ────────────────────────────────────

  describe('Error handling', () => {
    it('should return upstream error status', async () => {
      const err: any = new Error('Not Found');
      err.response = { status: 404, data: { error: { message: 'Not Found' } } };
      mockClient.getItem = jest.fn().mockRejectedValue(err);

      const res = await request(app).get('/api/v1/items/nope');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });
  });
});
