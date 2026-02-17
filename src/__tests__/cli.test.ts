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
});
