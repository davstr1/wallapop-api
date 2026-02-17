import { execSync } from 'child_process';
import path from 'path';

const CLI = `npx tsx ${path.join(__dirname, '../cli.ts')}`;

function run(args: string): { stdout: string; stderr: string; code: number } {
  try {
    const stdout = execSync(`${CLI} ${args}`, {
      encoding: 'utf-8',
      timeout: 10_000,
      env: { ...process.env, NODE_ENV: 'test' },
    });
    return { stdout, stderr: '', code: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || '',
      code: err.status ?? 1,
    };
  }
}

describe('CLI', () => {
  it('should show help with --help', () => {
    const { stdout, code } = run('--help');
    expect(code).toBe(0);
    expect(stdout).toContain('Usage:');
    expect(stdout).toContain('search');
    expect(stdout).toContain('item');
    expect(stdout).toContain('categories');
    expect(stdout).toContain('inbox');
    expect(stdout).toContain('serve');
  });

  it('should show help with no args', () => {
    const { stdout, code } = run('help');
    expect(code).toBe(0);
    expect(stdout).toContain('Usage:');
  });

  it('should error on unknown command', () => {
    const { stderr, code } = run('foobar');
    expect(code).toBe(1);
    expect(stderr).toContain('Unknown command');
  });

  it('should error on item without ID', () => {
    const { stderr, code } = run('item');
    expect(code).toBe(1);
    expect(stderr).toContain('item ID required');
  });

  it('should error on user without ID', () => {
    const { stderr, code } = run('user');
    expect(code).toBe(1);
    expect(stderr).toContain('user ID required');
  });

  it('should error on item-id without URL', () => {
    const { stderr, code } = run('item-id');
    expect(code).toBe(1);
    expect(stderr).toContain('URL required');
  });

  it('should error on inbox without token', () => {
    const { stderr, code } = run('inbox');
    expect(code).toBe(1);
    expect(stderr).toContain('bearer token required');
  });

  // ── --curl flag ─────────────────────────────────────

  it('should print curl for search --curl', () => {
    const { stdout, code } = run('search "iphone" --curl');
    expect(code).toBe(0);
    expect(stdout).toContain('curl');
    expect(stdout).toContain('Host: api.wallapop.com');
    expect(stdout).toContain('X-DeviceOS: 0');
    expect(stdout).toContain('/api/v3/search');
    expect(stdout).toContain('keywords=iphone');
  });

  it('should print curl for item --curl', () => {
    const { stdout, code } = run('item abc123 --curl');
    expect(code).toBe(0);
    expect(stdout).toContain('/api/v3/items/abc123');
  });

  it('should print curl for user --curl', () => {
    const { stdout, code } = run('user u1 --curl');
    expect(code).toBe(0);
    expect(stdout).toContain('/api/v3/users/u1');
  });

  it('should print curl for categories --curl', () => {
    const { stdout, code } = run('categories --curl');
    expect(code).toBe(0);
    expect(stdout).toContain('/api/v3/categories');
  });

  it('should print curl for search with filters --curl', () => {
    const { stdout, code } = run('search "phone" --min-price 100 --max-price 500 --curl');
    expect(code).toBe(0);
    expect(stdout).toContain('min_sale_price=100');
    expect(stdout).toContain('max_sale_price=500');
  });

  it('should print curl for inbox --curl', () => {
    const { stdout, code } = run('inbox my-token --curl');
    expect(code).toBe(0);
    expect(stdout).toContain('Bearer my-token');
    expect(stdout).toContain('/bff/messaging/inbox');
  });
});
