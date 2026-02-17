#!/usr/bin/env node

import { WallapopClient } from './client';

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

General:
  --json                     Raw JSON output (default: formatted)
  --help                     Show this help

Examples:
  wallapop search "iphone 13" --min-price 200 --max-price 500
  wallapop search "bike" --lat 41.38 --lon 2.17 --distance 5000
  wallapop search --next-page "eyJhbGci..."
  wallapop item nz047v45rrjo
  wallapop user-stats qjwy4weydwzo
  wallapop categories
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

  if (command === 'help' || command === '--help' || flags.help === 'true') {
    console.log(USAGE);
    process.exit(0);
  }

  if (command === 'serve') {
    // Dynamic import to avoid loading express for CLI commands
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
        output(data, raw);
        break;
      }

      case 'item': {
        if (!args[0]) { console.error('Error: item ID required'); process.exit(1); }
        const data = await client.getItem(args[0]);
        output(data, raw);
        break;
      }

      case 'item-id': {
        if (!args[0]) { console.error('Error: URL required'); process.exit(1); }
        const id = await client.extractItemId(args[0]);
        output({ itemId: id }, raw);
        break;
      }

      case 'user': {
        if (!args[0]) { console.error('Error: user ID required'); process.exit(1); }
        const data = await client.getUser(args[0]);
        output(data, raw);
        break;
      }

      case 'user-stats': {
        if (!args[0]) { console.error('Error: user ID required'); process.exit(1); }
        const data = await client.getUserStats(args[0]);
        output(data, raw);
        break;
      }

      case 'user-items': {
        if (!args[0]) { console.error('Error: user ID required'); process.exit(1); }
        const data = await client.getUserItems(args[0], {
          limit: flags.limit ? Number(flags.limit) : undefined,
          next_page: flags['next-page'],
        });
        output(data, raw);
        break;
      }

      case 'categories': {
        const data = await client.getCategories();
        output(data, raw);
        break;
      }

      case 'inbox': {
        if (!args[0]) { console.error('Error: bearer token required'); process.exit(1); }
        const data = await client.getInbox(args[0], {
          pageSize: flags['page-size'] ? Number(flags['page-size']) : undefined,
          maxMessages: flags['max-messages'] ? Number(flags['max-messages']) : undefined,
        });
        output(data, raw);
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
