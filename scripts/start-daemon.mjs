import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const logsDir = path.join(rootDir, '.logs');
fs.mkdirSync(logsDir, { recursive: true });

// First clean up any existing processes on 3000 / 5173
try {
  execSync('lsof -ti :3000 | xargs kill -9 2>/dev/null || true');
  execSync('lsof -ti :5173 | xargs kill -9 2>/dev/null || true');
} catch {}

function launch(name, folder, cmd, args, logFile) {
  const out = fs.openSync(path.join(logsDir, logFile), 'w');
  const child = spawn(cmd, args, {
    cwd: path.join(rootDir, folder),
    detached: true,
    stdio: ['ignore', out, out],
    env: process.env,
  });
  child.unref();
  fs.writeFileSync(path.join(logsDir, `${name}.pid`), String(child.pid));
  console.log(`[${name}] started as detached background process (PID: ${child.pid})`);
}

launch('backend', 'nutriguard-backend', 'npm', ['run', 'dev'], 'backend.log');
launch('frontend', 'nutriguard-frontend', 'npm', ['run', 'dev'], 'frontend.log');

console.log('Background services launched.');
console.log('Logs available in: ' + logsDir);
