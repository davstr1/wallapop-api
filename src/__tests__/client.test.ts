import axios from 'axios';
import { WallapopClient } from '../client';

// Mock axios entirely
jest.mock('axios', () => {
  const mockInstance = {
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: { headers: { common: {} } },
  };
  const mock: any = jest.fn(() => mockInstance);
  mock.create = jest.fn(() => mockInstance);
  mock.get = jest.fn();
  mock.isAxiosError = jest.fn();
  mock.__mockInstance = mockInstance;
  return mock;
});

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockHttp = (axios as any).__mockInstance;

describe('WallapopClient', () => {
  let client: WallapopClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new WallapopClient({ baseUrl: 'https://api.wallapop.com/api/v3' });
  });

  // ── Search ────────────────────────────────────────────

  describe('search()', () => {
    const mockSearchResponse = {
      data: {
        section: {
          payload: {
            items: [
              {
                id: 'abc123',
                title: 'iPhone 13',
                price: { amount: 450, currency: 'EUR' },
                user_id: 'xyz789',
              },
            ],
          },
        },
      },
      meta: { next_page: 'token123' },
    };

    it('should search with keywords and required params (step=1, source=keywords)', async () => {
      mockHttp.get.mockResolvedValueOnce({ data: mockSearchResponse });

      const result = await client.search({ keywords: 'iphone' });

      expect(mockHttp.get).toHaveBeenCalledWith('/search', {
        params: expect.objectContaining({
          keywords: 'iphone',
          step: 1,
          source: 'keywords',
          limit: 40,
        }),
      });
      expect(result).toEqual(mockSearchResponse);
    });

    it('should include price filters when provided', async () => {
      mockHttp.get.mockResolvedValueOnce({ data: mockSearchResponse });

      await client.search({
        keywords: 'laptop',
        min_sale_price: 100,
        max_sale_price: 500,
      });

      expect(mockHttp.get).toHaveBeenCalledWith('/search', {
        params: expect.objectContaining({
          keywords: 'laptop',
          min_sale_price: 100,
          max_sale_price: 500,
        }),
      });
    });

    it('should include location filters when provided', async () => {
      mockHttp.get.mockResolvedValueOnce({ data: mockSearchResponse });

      await client.search({
        keywords: 'bike',
        latitude: 41.3851,
        longitude: 2.1734,
        distance: 5000,
      });

      expect(mockHttp.get).toHaveBeenCalledWith('/search', {
        params: expect.objectContaining({
          latitude: 41.3851,
          longitude: 2.1734,
          distance: 5000,
        }),
      });
    });

    it('should include category filters when provided', async () => {
      mockHttp.get.mockResolvedValueOnce({ data: mockSearchResponse });

      await client.search({
        keywords: 'car',
        category_id: 12465,
        subcategory_ids: '12467,12468',
      });

      expect(mockHttp.get).toHaveBeenCalledWith('/search', {
        params: expect.objectContaining({
          category_id: 12465,
          subcategory_ids: '12467,12468',
        }),
      });
    });

    it('should support order_by parameter', async () => {
      mockHttp.get.mockResolvedValueOnce({ data: mockSearchResponse });

      await client.search({ keywords: 'tv', order_by: 'price_low_to_high' });

      expect(mockHttp.get).toHaveBeenCalledWith('/search', {
        params: expect.objectContaining({
          order_by: 'price_low_to_high',
        }),
      });
    });

    it('should paginate with next_page token (no keywords needed)', async () => {
      mockHttp.get.mockResolvedValueOnce({ data: mockSearchResponse });

      await client.search({ next_page: 'eyJhbGciOi...' });

      expect(mockHttp.get).toHaveBeenCalledWith('/search', {
        params: expect.objectContaining({
          next_page: 'eyJhbGciOi...',
          step: 1,
          source: 'keywords',
        }),
      });
      // keywords should NOT be in the params
      const callParams = mockHttp.get.mock.calls[0][1].params;
      expect(callParams.keywords).toBeUndefined();
    });

    it('should respect custom limit', async () => {
      mockHttp.get.mockResolvedValueOnce({ data: mockSearchResponse });

      await client.search({ keywords: 'test', limit: 20 });

      expect(mockHttp.get).toHaveBeenCalledWith('/search', {
        params: expect.objectContaining({ limit: 20 }),
      });
    });
  });

  // ── Item Details ──────────────────────────────────────

  describe('getItem()', () => {
    const mockItem = {
      id: 'nz047v45rrjo',
      title: { original: 'iPhone 13 Pro' },
      price: { cash: { amount: 75000, currency: 'EUR' } },
      user: { id: 'user123', micro_name: 'Juan' },
    };

    it('should fetch item by ID', async () => {
      mockHttp.get.mockResolvedValueOnce({ data: mockItem });

      const result = await client.getItem('nz047v45rrjo');

      expect(mockHttp.get).toHaveBeenCalledWith('/items/nz047v45rrjo');
      expect(result).toEqual(mockItem);
    });

    it('should propagate 404 errors', async () => {
      mockHttp.get.mockRejectedValueOnce({
        response: { status: 404, data: { error: { message: 'Not Found' } } },
      });

      await expect(client.getItem('invalid')).rejects.toEqual(
        expect.objectContaining({ response: expect.objectContaining({ status: 404 }) })
      );
    });
  });

  // ── User Profile ──────────────────────────────────────

  describe('getUser()', () => {
    const mockUser = {
      id: 'qjwy4weydwzo',
      micro_name: 'Juan M.',
      type: 'normal',
      location: { city: 'Barcelona', zip: '08001' },
      register_date: 1664267456000,
      featured: false,
    };

    it('should fetch user profile', async () => {
      mockHttp.get.mockResolvedValueOnce({ data: mockUser });

      const result = await client.getUser('qjwy4weydwzo');

      expect(mockHttp.get).toHaveBeenCalledWith('/users/qjwy4weydwzo');
      expect(result).toEqual(mockUser);
    });
  });

  // ── User Stats ────────────────────────────────────────

  describe('getUserStats()', () => {
    const mockStats = {
      ratings: [{ type: 'reviews', value: 85 }],
      counters: [
        { type: 'sold', value: 55 },
        { type: 'reviews', value: 12 },
      ],
    };

    it('should fetch user stats', async () => {
      mockHttp.get.mockResolvedValueOnce({ data: mockStats });

      const result = await client.getUserStats('qjwy4weydwzo');

      expect(mockHttp.get).toHaveBeenCalledWith('/users/qjwy4weydwzo/stats');
      expect(result).toEqual(mockStats);
    });
  });

  // ── User Items ────────────────────────────────────────

  describe('getUserItems()', () => {
    it('should fetch user items', async () => {
      mockHttp.get.mockResolvedValueOnce({ data: { items: [] } });

      await client.getUserItems('user123', { limit: 20 });

      expect(mockHttp.get).toHaveBeenCalledWith('/users/user123/items', {
        params: { limit: 20 },
      });
    });
  });

  // ── Categories ────────────────────────────────────────

  describe('getCategories()', () => {
    const mockCategories = {
      categories: [
        { id: 12465, name: 'Cars', icon_id: 'cat_cars', vertical_id: 'CARS', subcategories: [] },
      ],
    };

    it('should fetch categories', async () => {
      mockHttp.get.mockResolvedValueOnce({ data: mockCategories });

      const result = await client.getCategories();

      expect(mockHttp.get).toHaveBeenCalledWith('/categories');
      expect(result).toEqual(mockCategories);
    });
  });

  // ── Messaging Inbox ───────────────────────────────────

  describe('getInbox()', () => {
    it('should call bff endpoint with bearer token', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: { conversations: [] } });

      const result = await client.getInbox('my-jwt-token', { pageSize: 50, maxMessages: 3 });

      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/bff/messaging/inbox'),
        expect.objectContaining({
          params: { page_size: 50, max_messages: 3 },
          headers: expect.objectContaining({
            Authorization: 'Bearer my-jwt-token',
            Referer: 'https://es.wallapop.com/',
          }),
        })
      );
      expect(result).toEqual({ conversations: [] });
    });

    it('should use defaults for pageSize and maxMessages', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: {} });

      await client.getInbox('token');

      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: { page_size: 100, max_messages: 1 },
        })
      );
    });
  });

  // ── Extract Item ID ───────────────────────────────────

  describe('extractItemId()', () => {
    const fakeHtml = `
      <html><body>
      <script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"item":{"id":"4z48gq2wl8jy"}}}}</script>
      </body></html>
    `;

    it('should extract item ID from full URL', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: fakeHtml });

      const id = await client.extractItemId('https://es.wallapop.com/item/consola-ps4-123');

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://es.wallapop.com/item/consola-ps4-123',
        expect.any(Object)
      );
      expect(id).toBe('4z48gq2wl8jy');
    });

    it('should handle partial URL (no protocol)', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: fakeHtml });

      const id = await client.extractItemId('es.wallapop.com/item/consola-ps4-123');

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://es.wallapop.com/item/consola-ps4-123',
        expect.any(Object)
      );
      expect(id).toBe('4z48gq2wl8jy');
    });

    it('should handle bare slug', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: fakeHtml });

      const id = await client.extractItemId('consola-ps4-123');

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://es.wallapop.com/item/consola-ps4-123',
        expect.any(Object)
      );
      expect(id).toBe('4z48gq2wl8jy');
    });

    it('should throw if __NEXT_DATA__ not found', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: '<html><body>nothing here</body></html>' });

      await expect(client.extractItemId('bad-slug')).rejects.toThrow('Could not find __NEXT_DATA__');
    });

    it('should throw if item ID not in data', async () => {
      const html = `<script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{}}}</script>`;
      mockAxios.get.mockResolvedValueOnce({ data: html });

      await expect(client.extractItemId('bad-slug')).rejects.toThrow('Could not extract item ID');
    });
  });
});
