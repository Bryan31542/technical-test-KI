import { spawn } from 'node:child_process';
import { loadRootEnv } from '../src/load-root-env';

loadRootEnv();

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npx tsx scripts/run-with-root-env.ts <command>...');
  process.exit(1);
}

const child = spawn(args.join(' '), {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});
child.on('exit', (code) => process.exit(code ?? 1));
