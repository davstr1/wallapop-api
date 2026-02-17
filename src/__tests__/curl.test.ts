import {
  curlSearch, curlItem, curlUser, curlUserStats,
  curlUserItems, curlCategories, curlInbox, curlExtractItemId,
} from '../curl';

describe('curl generators', () => {
  describe('curlSearch()', () => {
    it('should generate search curl with keywords', () => {
      const cmd = curlSearch({ keywords: 'iphone' });
      expect(cmd).toContain("Host: api.wallapop.com");
      expect(cmd).toContain("X-DeviceOS: 0");
      expect(cmd).toContain('/api/v3/search');
      expect(cmd).toContain('keywords=iphone');
      expect(cmd).toContain('step=1');
      expect(cmd).toContain('source=keywords');
      expect(cmd).toContain('limit=40');
    });

    it('should include price filters', () => {
      const cmd = curlSearch({ keywords: 'phone', min_sale_price: 100, max_sale_price: 500 });
      expect(cmd).toContain('min_sale_price=100');
      expect(cmd).toContain('max_sale_price=500');
    });

    it('should include location filters', () => {
      const cmd = curlSearch({ keywords: 'bike', latitude: 41.38, longitude: 2.17, distance: 5000 });
      expect(cmd).toContain('latitude=41.38');
      expect(cmd).toContain('longitude=2.17');
      expect(cmd).toContain('distance=5000');
    });

    it('should include category filters', () => {
      const cmd = curlSearch({ keywords: 'car', category_id: 12465, subcategory_ids: '12467,12468' });
      expect(cmd).toContain('category_id=12465');
      expect(cmd).toContain('subcategory_ids=12467%2C12468');
    });

    it('should handle pagination with next_page only', () => {
      const cmd = curlSearch({ next_page: 'tok123' });
      expect(cmd).toContain('next_page=tok123');
      // should not have keywords=<value> param (source=keywords is fine)
      expect(cmd).not.toContain('keywords=tok');
    });

    it('should include order_by', () => {
      const cmd = curlSearch({ keywords: 'tv', order_by: 'price_low_to_high' });
      expect(cmd).toContain('order_by=price_low_to_high');
    });
  });

  describe('curlItem()', () => {
    it('should generate item curl', () => {
      const cmd = curlItem('nz047v45rrjo');
      expect(cmd).toContain("Host: api.wallapop.com");
      expect(cmd).toContain("X-DeviceOS: 0");
      expect(cmd).toContain('/api/v3/items/nz047v45rrjo');
    });
  });

  describe('curlUser()', () => {
    it('should generate user curl', () => {
      const cmd = curlUser('abc123');
      expect(cmd).toContain('/api/v3/users/abc123');
      expect(cmd).toContain("Host: api.wallapop.com");
    });
  });

  describe('curlUserStats()', () => {
    it('should generate user stats curl', () => {
      const cmd = curlUserStats('abc123');
      expect(cmd).toContain('/api/v3/users/abc123/stats');
    });
  });

  describe('curlUserItems()', () => {
    it('should generate user items curl', () => {
      const cmd = curlUserItems('abc123');
      expect(cmd).toContain('/api/v3/users/abc123/items');
    });

    it('should include limit param', () => {
      const cmd = curlUserItems('abc123', { limit: 20 });
      expect(cmd).toContain('limit=20');
    });
  });

  describe('curlCategories()', () => {
    it('should generate categories curl', () => {
      const cmd = curlCategories();
      expect(cmd).toContain('/api/v3/categories');
      expect(cmd).toContain("Host: api.wallapop.com");
    });
  });

  describe('curlInbox()', () => {
    it('should generate inbox curl with bearer token', () => {
      const cmd = curlInbox('my-jwt-token');
      expect(cmd).toContain('/bff/messaging/inbox');
      expect(cmd).toContain('Authorization: Bearer my-jwt-token');
      expect(cmd).toContain('Referer: https://es.wallapop.com/');
      expect(cmd).toContain('page_size=100');
      expect(cmd).toContain('max_messages=1');
    });

    it('should respect custom pageSize and maxMessages', () => {
      const cmd = curlInbox('tok', { pageSize: 50, maxMessages: 5 });
      expect(cmd).toContain('page_size=50');
      expect(cmd).toContain('max_messages=5');
    });

    it('should NOT contain X-DeviceOS (different endpoint)', () => {
      const cmd = curlInbox('tok');
      expect(cmd).not.toContain('X-DeviceOS');
    });
  });

  describe('curlExtractItemId()', () => {
    it('should generate scraping curl for full URL', () => {
      const cmd = curlExtractItemId('https://es.wallapop.com/item/consola-ps4-123');
      expect(cmd).toContain('https://es.wallapop.com/item/consola-ps4-123');
      expect(cmd).toContain('User-Agent');
      expect(cmd).toContain('__NEXT_DATA__');
    });

    it('should build full URL from slug', () => {
      const cmd = curlExtractItemId('consola-ps4-123');
      expect(cmd).toContain('https://es.wallapop.com/item/consola-ps4-123');
    });

    it('should add https:// to partial URL', () => {
      const cmd = curlExtractItemId('es.wallapop.com/item/test');
      expect(cmd).toContain('https://es.wallapop.com/item/test');
    });
  });
});
