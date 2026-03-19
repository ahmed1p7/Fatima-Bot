import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLUGINS_DIR = path.join(__dirname, '..', 'plugins');

let plugins = [];

export async function loadPlugins() {
  plugins = [];
  try {
    if (!fs.existsSync(PLUGINS_DIR)) fs.mkdirSync(PLUGINS_DIR, { recursive: true });
    const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.mjs'));
    for (const file of files) {
      try {
        const mod = await import('file://' + path.join(PLUGINS_DIR, file));
        if (mod.default && mod.default.commands && mod.default.execute) {
          plugins.push(mod.default);
          console.log('+ ' + file);
        }
      } catch (e) { console.log('- ' + file + ': ' + e.message); }
    }
  } catch (e) { console.log('- Plugins: ' + e.message); }
  return plugins;
}

export async function execCmd(sock, msg, ctx) {
  const { command, from } = ctx;
  for (const p of plugins) {
    if (p.commands.includes(command)) {
      try {
        return await p.execute(sock, msg, ctx);
      } catch (e) {
        return sock.sendMessage(from, { text: 'Error!' });
      }
    }
  }
  return null;
}

export function getPlugins() {
  return plugins;
}
