import { existsSync } from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';

export function findRepoRoot(start = process.cwd()): string | undefined {
  let dir = path.resolve(start);
  for (let i = 0; i < 8; i++) {
    if (existsSync(path.join(dir, 'docker-compose.yml'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return undefined;
}

export function loadRootEnv(): void {
  const root = findRepoRoot();
  if (root) {
    config({ path: path.join(root, '.env') });
  }

  const url = process.env.DATABASE_URL ?? '';
  if (url && !url.includes('${')) {
    return;
  }

  const user = process.env.POSTGRES_USER;
  const db = process.env.POSTGRES_DB;
  if (!user || !db) {
    return;
  }

  const password = encodeURIComponent(process.env.POSTGRES_PASSWORD ?? '');
  const port = process.env.POSTGRES_PORT ?? '5432';
  process.env.DATABASE_URL = `postgresql://${user}:${password}@localhost:${port}/${db}?schema=public`;
}
