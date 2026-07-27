const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const cwd = path.resolve(__dirname, '..');
const logDir = path.join(cwd, '.logs');
fs.mkdirSync(logDir, { recursive: true });

const runtimeBin = 'C:\\Users\\QIQI\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\bin';
const runtimeNode = 'C:\\Users\\QIQI\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin';
const env = {
  ...process.env,
  PATH: `${runtimeNode};${runtimeBin};${process.env.PATH || ''}`,
};

function start(name, command, args, logName) {
  const out = fs.openSync(path.join(logDir, `${logName}.log`), 'a');
  const err = fs.openSync(path.join(logDir, `${logName}.err.log`), 'a');
  const child = spawn(command, args, {
    cwd,
    detached: true,
    env,
    shell: true,
    stdio: ['pipe', out, err],
    windowsHide: true,
  });

  child.stdin.write('\n');
  child.unref();
  console.log(`${name} pid ${child.pid}`);
}

start('api', 'pnpm', ['dev:api'], 'api');
start('vite', 'pnpm', ['exec', 'vite', '--host', '127.0.0.1', '--port', process.env.VITE_PORT || '5176'], 'vite');

setInterval(() => {}, 2_147_483_647);
