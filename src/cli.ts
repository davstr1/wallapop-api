#!/usr/bin/env node

import { WallapopClient } from './client';
import {
  curlSearch, curlItem, curlUser, curlUserStats,
  curlUserItems, curlCategories, curlInbox, curlExtractItemId,
} from './curl';
import { generateCurlMd } from './curl-md';
import { filterContinentalSpain } from './filters';

const USAGE = `
Usage: wallapop <command> [options]

Commands:
  search <keywords>          Search items
  item <itemId>              Get item details
  item-id <url>              Extract item ID from URL
  user <userId>              Get user profile
  user-stats <userId>        Get user stats
  user-items <userId>        Get user items
  categories                 List all categories
  inbox <bearerToken>        Get messaging inbox (auth required)
  curl-md                    Generate curl cheatsheet (markdown)
  serve                      Start HTTP server

Search options:
  --min-price <n>            Minimum price (€)
  --max-price <n>            Maximum price (€)
  --lat <n>                  Latitude
  --lon <n>                  Longitude
  --distance <n>             Distance in meters
  --category <id>            Category ID
  --subcategories <ids>      Subcategory IDs (comma-separated)
  --order <order>            newest|price_low_to_high|price_high_to_low|distance
  --limit <n>                Results per page (max 40)
  --next-page <token>        Pagination token
  --continental              Filter to continental Spain only (excludes Canarias, Baleares, Ceuta, Melilla)

General:
  --curl                     Print the curl command instead of executing
  --json                     Raw JSON output (default: formatted)
  --help                     Show this help

Examples:
  wallapop search "iphone 13" --min-price 200 --max-price 500
  wallapop search "bike" --curl
  wallapop item nz047v45rrjo --curl
  wallapop categories --curl
  wallapop serve
`;

function parseArgs(argv: string[]): { command: string; args: string[]; flags: Record<string, string> } {
  const command = argv[0] || 'help';
  const args: string[] = [];
  const flags: Record<string, string> = {};

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = 'true';
      }
    } else {
      args.push(arg);
    }
  }

  return { command, args, flags };
}

function output(data: unknown, raw: boolean) {
  if (raw) {
    process.stdout.write(JSON.stringify(data) + '\n');
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function main() {
  const { command, args, flags } = parseArgs(process.argv.slice(2));
  const raw = flags.json === 'true';
  const curlMode = flags.curl === 'true';

  if (command === 'help' || command === '--help' || flags.help === 'true') {
    console.log(USAGE);
    process.exit(0);
  }

  if (command === 'curl-md') {
    const md = generateCurlMd();
    if (args[0]) {
      const fs = await import('fs');
      fs.writeFileSync(args[0], md);
      console.log(`✅ Written to ${args[0]}`);
    } else {
      console.log(md);
    }
    return;
  }

  if (command === 'serve') {
    const { createApp } = await import('./server');
    const { config } = await import('./config');
    const port = flags.port ? parseInt(flags.port) : config.port;
    const app = createApp();
    app.listen(port, () => {
      console.log(`🚀 Wallapop API running on http://localhost:${port}`);
      console.log(`   Proxy: ${config.proxyUrl ? '✅ configured' : '❌ not configured'}`);
    });
    return;
  }

  // ── Curl mode: just print the command ─────────────────

  if (curlMode) {
    switch (command) {
      case 'search':
        console.log(curlSearch({
          keywords: args[0],
          min_sale_price: flags['min-price'] ? Number(flags['min-price']) : undefined,
          max_sale_price: flags['max-price'] ? Number(flags['max-price']) : undefined,
          latitude: flags.lat ? Number(flags.lat) : undefined,
          longitude: flags.lon ? Number(flags.lon) : undefined,
          distance: flags.distance ? Number(flags.distance) : undefined,
          category_id: flags.category ? Number(flags.category) : undefined,
          subcategory_ids: flags.subcategories,
          order_by: flags.order,
          limit: flags.limit ? Number(flags.limit) : undefined,
          next_page: flags['next-page'],
        }));
        break;
      case 'item':
        if (!args[0]) { console.error('Error: item ID required'); process.exit(1); }
        console.log(curlItem(args[0]));
        break;
      case 'item-id':
        if (!args[0]) { console.error('Error: URL required'); process.exit(1); }
        console.log(curlExtractItemId(args[0]));
        break;
      case 'user':
        if (!args[0]) { console.error('Error: user ID required'); process.exit(1); }
        console.log(curlUser(args[0]));
        break;
      case 'user-stats':
        if (!args[0]) { console.error('Error: user ID required'); process.exit(1); }
        console.log(curlUserStats(args[0]));
        break;
      case 'user-items':
        if (!args[0]) { console.error('Error: user ID required'); process.exit(1); }
        console.log(curlUserItems(args[0], {
          limit: flags.limit ? Number(flags.limit) : undefined,
          next_page: flags['next-page'],
        }));
        break;
      case 'categories':
        console.log(curlCategories());
        break;
      case 'inbox':
        if (!args[0]) { console.error('Error: bearer token required'); process.exit(1); }
        console.log(curlInbox(args[0], {
          pageSize: flags['page-size'] ? Number(flags['page-size']) : undefined,
          maxMessages: flags['max-messages'] ? Number(flags['max-messages']) : undefined,
        }));
        break;
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
    return;
  }

  // ── Execute mode: call the API ────────────────────────

  const client = new WallapopClient();

  try {
    switch (command) {
      case 'search': {
        const data = await client.search({
          keywords: args[0],
          min_sale_price: flags['min-price'] ? Number(flags['min-price']) : undefined,
          max_sale_price: flags['max-price'] ? Number(flags['max-price']) : undefined,
          latitude: flags.lat ? Number(flags.lat) : undefined,
          longitude: flags.lon ? Number(flags.lon) : undefined,
          distance: flags.distance ? Number(flags.distance) : undefined,
          category_id: flags.category ? Number(flags.category) : undefined,
          subcategory_ids: flags.subcategories,
          order_by: flags.order as any,
          limit: flags.limit ? Number(flags.limit) : undefined,
          next_page: flags['next-page'],
        });

        // Post-filter: continental Spain only
        if (flags.continental === 'true' && data?.data?.section?.payload?.items) {
          data.data.section.payload.items = filterContinentalSpain(data.data.section.payload.items);
        }

        output(data, raw);
        break;
      }

      case 'item': {
        if (!args[0]) { console.error('Error: item ID required'); process.exit(1); }
        output(await client.getItem(args[0]), raw);
        break;
      }

      case 'item-id': {
        if (!args[0]) { console.error('Error: URL required'); process.exit(1); }
        output({ itemId: await client.extractItemId(args[0]) }, raw);
        break;
      }

      case 'user': {
        if (!args[0]) { console.error('Error: user ID required'); process.exit(1); }
        output(await client.getUser(args[0]), raw);
        break;
      }

      case 'user-stats': {
        if (!args[0]) { console.error('Error: user ID required'); process.exit(1); }
        output(await client.getUserStats(args[0]), raw);
        break;
      }

      case 'user-items': {
        if (!args[0]) { console.error('Error: user ID required'); process.exit(1); }
        output(await client.getUserItems(args[0], {
          limit: flags.limit ? Number(flags.limit) : undefined,
          next_page: flags['next-page'],
        }), raw);
        break;
      }

      case 'categories': {
        output(await client.getCategories(), raw);
        break;
      }

      case 'inbox': {
        if (!args[0]) { console.error('Error: bearer token required'); process.exit(1); }
        output(await client.getInbox(args[0], {
          pageSize: flags['page-size'] ? Number(flags['page-size']) : undefined,
          maxMessages: flags['max-messages'] ? Number(flags['max-messages']) : undefined,
        }), raw);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.log(USAGE);
        process.exit(1);
    }
  } catch (err: any) {
    const status = err.response?.status;
    const message = err.response?.data?.error?.message || err.message;
    console.error(`Error${status ? ` (${status})` : ''}: ${message}`);
    process.exit(1);
  }
}

main();
