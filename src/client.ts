import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { config, WALLAPOP_HEADERS } from './config';
import {
  SearchParams,
  SearchResponse,
  ItemDetails,
  UserProfile,
  UserStats,
  CategoriesResponse,
} from './types';

export class WallapopClient {
  private http: AxiosInstance;

  constructor(opts?: { proxyUrl?: string; baseUrl?: string; timeout?: number }) {
    const proxyUrl = opts?.proxyUrl ?? config.proxyUrl;
    const baseUrl = opts?.baseUrl ?? config.apiBaseUrl;

    const axiosConfig: AxiosRequestConfig = {
      baseURL: baseUrl,
      timeout: opts?.timeout ?? 30_000,
      headers: { ...WALLAPOP_HEADERS },
    };

    if (proxyUrl) {
      axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
      axiosConfig.proxy = false; // let the agent handle it
    }

    this.http = axios.create(axiosConfig);

    // Strip all headers except the two required ones
    this.http.interceptors.request.use((req) => {
      const allowed = ['host', 'x-deviceos'];
      if (req.headers) {
        for (const key of Object.keys(req.headers)) {
          if (!allowed.includes(key.toLowerCase())) {
            delete req.headers[key];
          }
        }
      }
      return req;
    });
  }

  // ── Search ──────────────────────────────────────────

  async search(params: SearchParams): Promise<SearchResponse> {
    const query: Record<string, string | number> = {
      step: 1,
      source: 'keywords',
      limit: params.limit ?? 40,
    };

    // If paginating, only need next_page
    if (params.next_page) {
      query.next_page = params.next_page;
    } else {
      if (params.keywords) query.keywords = params.keywords;
      if (params.min_sale_price != null) query.min_sale_price = params.min_sale_price;
      if (params.max_sale_price != null) query.max_sale_price = params.max_sale_price;
      if (params.distance != null) query.distance = params.distance;
      if (params.latitude != null) query.latitude = params.latitude;
      if (params.longitude != null) query.longitude = params.longitude;
      if (params.category_id != null) query.category_id = params.category_id;
      if (params.subcategory_ids) query.subcategory_ids = params.subcategory_ids;
      if (params.order_by) query.order_by = params.order_by;
    }

    const { data } = await this.http.get<SearchResponse>('/search', { params: query });
    return data;
  }

  // ── Item Details ────────────────────────────────────

  async getItem(itemId: string): Promise<ItemDetails> {
    const { data } = await this.http.get<ItemDetails>(`/items/${itemId}`);
    return data;
  }

  // ── User Profile ────────────────────────────────────

  async getUser(userId: string): Promise<UserProfile> {
    const { data } = await this.http.get<UserProfile>(`/users/${userId}`);
    return data;
  }

  // ── User Stats ──────────────────────────────────────

  async getUserStats(userId: string): Promise<UserStats> {
    const { data } = await this.http.get<UserStats>(`/users/${userId}/stats`);
    return data;
  }

  // ── User Items ──────────────────────────────────────

  async getUserItems(userId: string, params?: { limit?: number; next_page?: string }): Promise<unknown> {
    const { data } = await this.http.get(`/users/${userId}/items`, { params });
    return data;
  }

  // ── Categories ──────────────────────────────────────

  async getCategories(): Promise<CategoriesResponse> {
    const { data } = await this.http.get<CategoriesResponse>('/categories');
    return data;
  }

  // ── Messaging (auth required) ───────────────────────

  async getInbox(bearerToken: string, opts?: { pageSize?: number; maxMessages?: number }): Promise<unknown> {
    const { data } = await axios.get(`${config.bffBaseUrl}/messaging/inbox`, {
      params: {
        page_size: opts?.pageSize ?? 100,
        max_messages: opts?.maxMessages ?? 1,
      },
      headers: {
        Accept: 'application/json, text/plain, */*',
        Authorization: `Bearer ${bearerToken}`,
        Referer: 'https://es.wallapop.com/',
        'Accept-Language': 'es,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 30_000,
      // Use same proxy if configured
      ...(config.proxyUrl
        ? { httpsAgent: new HttpsProxyAgent(config.proxyUrl), proxy: false as const }
        : {}),
    });
    return data;
  }

  // ── URL → Item ID (scraping) ────────────────────────

  async extractItemId(urlOrSlug: string): Promise<string> {
    let fullUrl: string;
    if (urlOrSlug.startsWith('http')) {
      fullUrl = urlOrSlug;
    } else if (urlOrSlug.includes('wallapop.com/')) {
      fullUrl = `https://${urlOrSlug}`;
    } else {
      fullUrl = `https://es.wallapop.com/item/${urlOrSlug}`;
    }

    const { data: html } = await axios.get<string>(fullUrl, {
      timeout: 10_000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const match = html.match(
      /<script\s+id="__NEXT_DATA__"\s+type="application\/json">([^<]+)<\/script>/
    );
    if (!match?.[1]) {
      throw new Error('Could not find __NEXT_DATA__ in page');
    }

    const nextData = JSON.parse(match[1]);
    const itemId = nextData?.props?.pageProps?.item?.id;
    if (!itemId) {
      throw new Error('Could not extract item ID from page data');
    }

    return itemId;
  }
}
