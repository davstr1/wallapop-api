import { WALLAPOP_HEADERS, config } from './config';

const BASE = 'https://api.wallapop.com/api/v3';
const BFF = 'https://api.wallapop.com/bff';

function h(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([k, v]) => `-H '${k}: ${v}'`)
    .join(' \\\n  ');
}

const STD_HEADERS = h(WALLAPOP_HEADERS as Record<string, string>);

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v != null) as [string, string | number][];
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

function withProxy(cmd: string): string {
  if (config.proxyUrl) {
    return `${cmd} \\\n  --proxy '${config.proxyUrl}'`;
  }
  return cmd;
}

export interface SearchCurlParams {
  keywords?: string;
  min_sale_price?: number;
  max_sale_price?: number;
  distance?: number;
  latitude?: number;
  longitude?: number;
  category_id?: number;
  subcategory_ids?: string;
  order_by?: string;
  limit?: number;
  next_page?: string;
}

export function curlSearch(params: SearchCurlParams): string {
  const q: Record<string, string | number | undefined> = {
    step: 1,
    source: 'keywords',
    limit: params.limit ?? 40,
  };

  if (params.next_page) {
    q.next_page = params.next_page;
  } else {
    if (params.keywords) q.keywords = params.keywords;
    if (params.min_sale_price != null) q.min_sale_price = params.min_sale_price;
    if (params.max_sale_price != null) q.max_sale_price = params.max_sale_price;
    if (params.distance != null) q.distance = params.distance;
    if (params.latitude != null) q.latitude = params.latitude;
    if (params.longitude != null) q.longitude = params.longitude;
    if (params.category_id != null) q.category_id = params.category_id;
    if (params.subcategory_ids) q.subcategory_ids = params.subcategory_ids;
    if (params.order_by) q.order_by = params.order_by;
  }

  return withProxy(`curl -s \\\n  ${STD_HEADERS} \\\n  '${BASE}/search${qs(q)}'`);
}

export function curlItem(itemId: string): string {
  return withProxy(`curl -s \\\n  ${STD_HEADERS} \\\n  '${BASE}/items/${itemId}'`);
}

export function curlUser(userId: string): string {
  return withProxy(`curl -s \\\n  ${STD_HEADERS} \\\n  '${BASE}/users/${userId}'`);
}

export function curlUserStats(userId: string): string {
  return withProxy(`curl -s \\\n  ${STD_HEADERS} \\\n  '${BASE}/users/${userId}/stats'`);
}

export function curlUserItems(userId: string, params?: { limit?: number; next_page?: string }): string {
  const q: Record<string, string | number | undefined> = {};
  if (params?.limit) q.limit = params.limit;
  if (params?.next_page) q.next_page = params.next_page;
  return withProxy(`curl -s \\\n  ${STD_HEADERS} \\\n  '${BASE}/users/${userId}/items${qs(q)}'`);
}

export function curlCategories(): string {
  return withProxy(`curl -s \\\n  ${STD_HEADERS} \\\n  '${BASE}/categories'`);
}

export function curlInbox(bearerToken: string, opts?: { pageSize?: number; maxMessages?: number }): string {
  const q: Record<string, string | number | undefined> = {
    page_size: opts?.pageSize ?? 100,
    max_messages: opts?.maxMessages ?? 1,
  };
  const headers = h({
    Accept: 'application/json, text/plain, */*',
    Authorization: `Bearer ${bearerToken}`,
    Referer: 'https://es.wallapop.com/',
    'Accept-Language': 'es,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
  });
  return withProxy(`curl -s \\\n  ${headers} \\\n  '${BFF}/messaging/inbox${qs(q)}'`);
}

export function curlExtractItemId(url: string): string {
  let fullUrl: string;
  if (url.startsWith('http')) {
    fullUrl = url;
  } else if (url.includes('wallapop.com/')) {
    fullUrl = `https://${url}`;
  } else {
    fullUrl = `https://es.wallapop.com/item/${url}`;
  }
  return `curl -s \\\n  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' \\\n  '${fullUrl}' \\\n  | grep -o '__NEXT_DATA__[^<]*' \\\n  | sed 's/__NEXT_DATA__\" type=\"application\\/json\">//' \\\n  | python3 -c "import sys,json; print(json.loads(sys.stdin.read())['props']['pageProps']['item']['id'])"`;
}
