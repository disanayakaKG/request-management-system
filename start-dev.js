import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Request Management System (Backend & Frontend)...');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const backend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.resolve(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.resolve(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

backend.on('error', (err) => {
  console.error('💥 Backend process error:', err);
});

frontend.on('error', (err) => {
  console.error('💥 Frontend process error:', err);
});

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  backend.kill();
  frontend.kill();
  process.exit(0);
});
