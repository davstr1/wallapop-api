# wallapop-api

Unofficial Wallapop API client for Node.js. Search items, get details, user profiles, categories, and messaging — via CLI, curl, or code.

Built by reverse-engineering the Wallapop web app. No official API docs exist.

## Install

```bash
git clone https://github.com/davstr1/wallapop-api.git
cd wallapop-api
npm install
cp .env.example .env
```

Configure your `.env`:
```env
PORT=4000
PROXY_URL=http://user:pass@host:port  # recommended — Wallapop blocks direct server requests
```

## Usage

### CLI

```bash
# Search
npm run cli -- search "iphone 13"
npm run cli -- search "bike" --min-price 50 --max-price 300 --lat 41.38 --lon 2.17 --distance 5000

# Item details
npm run cli -- item nz047v45rrjo

# User profile & stats
npm run cli -- user qjwy4weydwzo
npm run cli -- user-stats qjwy4weydwzo
npm run cli -- user-items qjwy4weydwzo

# Categories
npm run cli -- categories

# Messaging inbox (requires bearer token)
npm run cli -- inbox eyJhbGciOi...

# Extract item ID from URL
npm run cli -- item-id "https://es.wallapop.com/item/consola-sony-ps4-pro-123456"
```

### Curl mode (`--curl`)

Generate ready-to-paste curl commands — no server, no Node required:

```bash
npm run cli -- search "iphone" --curl
```
```
curl -s \
  -H 'Host: api.wallapop.com' \
  -H 'X-DeviceOS: 0' \
  'https://api.wallapop.com/api/v3/search?step=1&source=keywords&limit=40&keywords=iphone'
```

Works with all commands and flags:

```bash
npm run cli -- item abc123 --curl
npm run cli -- user xyz789 --curl
npm run cli -- categories --curl
npm run cli -- inbox <token> --curl
npm run cli -- search "phone" --min-price 100 --max-price 500 --curl
```

### Curl cheatsheet (Markdown)

Generate a full markdown doc with all curl examples:

```bash
npm run cli -- curl-md              # print to stdout
npm run cli -- curl-md CURLS.md     # write to file
```

### HTTP Server

```bash
npm run dev   # development (tsx, hot reload)
npm start     # production (requires npm run build first)
```

Endpoints:

| Route | Description |
|-------|-------------|
| `GET /api/v1/search?keywords=...` | Search items |
| `GET /api/v1/items/:id` | Item details |
| `GET /api/v1/itemId?url=...` | Extract item ID from URL |
| `GET /api/v1/users/:id` | User profile |
| `GET /api/v1/users/:id/stats` | User statistics |
| `GET /api/v1/users/:id/items` | User's listings |
| `GET /api/v1/categories` | Category tree |
| `GET /api/v1/inbox` | Messaging inbox (Bearer token required) |
| `GET /health` | Health check |

### As a library

```typescript
import { WallapopClient } from 'wallapop-api';

const client = new WallapopClient();

const results = await client.search({ keywords: 'iphone', max_sale_price: 500 });
const item = await client.getItem('nz047v45rrjo');
const user = await client.getUser('qjwy4weydwzo');
const stats = await client.getUserStats('qjwy4weydwzo');
const categories = await client.getCategories();
```

## API Reference

### Wallapop endpoints used

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/v3/search` | No | Search items by keywords, price, location, category |
| `GET /api/v3/items/{id}` | No | Full item details (price in cents!) |
| `GET /api/v3/users/{id}` | No | User profile |
| `GET /api/v3/users/{id}/stats` | No | User ratings & counters |
| `GET /api/v3/users/{id}/items` | No | User's listings |
| `GET /api/v3/categories` | No | Full category tree |
| `GET /bff/messaging/inbox` | Bearer | User's message inbox |

### Required headers

All public endpoints need exactly two headers:

```
Host: api.wallapop.com
X-DeviceOS: 0
```

That's it. No User-Agent, no Accept, no cookies. The client strips all other headers.

### Bearer token (messaging only)

The messaging endpoint requires a Wallapop user token. To get it:

1. Open **es.wallapop.com** → log in
2. DevTools (`F12`) → **Network** tab
3. Click on your messages or any authenticated action
4. Find a request to `api.wallapop.com` → copy `Authorization: Bearer eyJ...`

Token expires after a few hours/days.

### Gotchas

- **Proxy required** — Wallapop blocks direct server requests. Use a residential/datacenter proxy.
- **Price inconsistency** — `/search` returns euros (`450`), `/items/{id}` returns cents (`75000` = 750€).
- **Pagination** — Uses opaque `next_page` JWT tokens, not page numbers.
- **Throttling** — If >95% of requests return 404, it's throttling, not real 404s.
- **`step=1` and `source=keywords`** — Required params for search, or you get empty results.

## Testing

```bash
npm test              # run all tests
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run tests (Jest) |
| `npm run dev` | Start dev server (tsx) |
| `npm run build` | Compile TypeScript |
| `npm start` | Start production server |
| `npm run cli -- <cmd>` | Run CLI command |

## Project structure

```
src/
├── client.ts          WallapopClient — direct API calls
├── server.ts          Express HTTP server
├── cli.ts             CLI interface
├── curl.ts            Curl command generators
├── curl-md.ts         Markdown cheatsheet generator
├── types.ts           TypeScript types
├── config.ts          Configuration & headers
├── index.ts           Public exports
└── __tests__/
    ├── client.test.ts   20 tests
    ├── server.test.ts   15 tests
    ├── curl.test.ts     18 tests
    └── cli.test.ts      13 tests
```

## License

MIT
