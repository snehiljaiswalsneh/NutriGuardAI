import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const logsDir = path.join(rootDir, '.logs');

for (const name of ['backend', 'frontend']) {
  const pidFile = path.join(logsDir, `${name}.pid`);
  if (fs.existsSync(pidFile)) {
    try {
      const pid = fs.readFileSync(pidFile, 'utf8').trim();
      process.kill(-Number(pid), 'SIGKILL');
    } catch {}
    try {
      const pid = fs.readFileSync(pidFile, 'utf8').trim();
      process.kill(Number(pid), 'SIGKILL');
    } catch {}
    fs.unlinkSync(pidFile);
  }
}

try {
  execSync('lsof -ti :3000 | xargs kill -9 2>/dev/null || true');
  execSync('lsof -ti :5173 | xargs kill -9 2>/dev/null || true');
} catch {}

console.log('NutriGuard AI services stopped.');
