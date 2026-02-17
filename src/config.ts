import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  apiBaseUrl: process.env.API_BASE_URL || 'https://api.wallapop.com/api/v3',
  proxyUrl: process.env.PROXY_URL || '',
  bffBaseUrl: 'https://api.wallapop.com/bff',
};

/**
 * Required headers for all Wallapop public API calls.
 * Only these two — the code actively strips everything else.
 */
export const WALLAPOP_HEADERS = {
  Host: 'api.wallapop.com',
  'X-DeviceOS': '0',
} as const;
