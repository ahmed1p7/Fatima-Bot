// ═══════════════════════════════════════════════════════════════════════════════
// 🌙 فاطمة بوت - النسخة المتطورة v9.0
// ═══════════════════════════════════════════════════════════════════════════════

import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers, delay, getContentType } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadPlugins, execCmd } from './lib/loader.mjs';
import { initAI } from './lib/ai.mjs';
import { getDatabase, saveDatabase } from './lib/database.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sock = null;
let plugins = [];

async function start() {
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'session'));
  const logger = pino({ level: 'silent' });

  sock = makeWASocket({
    version, logger,
    browser: Browsers.macOS('Safari'),
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
    getMessage: async () => ({ conversation: '🌙' }),
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) { console.log('\n📱 امسح QR:\n'); qrcode.generate(qr, { small: true }); }
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) { await delay(5000); start(); }
      else console.log('❌ تسجيل خروج!');
    }
    if (connection === 'open') {
      console.log('\n✅ فاطمة بوت جاهزة! 🌙');
      console.log('🔌 Plugins: ' + plugins.length);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try {
        if (!msg.message || msg.key.fromMe) continue;
        const db = getDatabase();
        db.stats.messages = (db.stats.messages || 0) + 1;

        const from = msg.key.remoteJid;
        const isGroup = from?.endsWith('@g.us');
        const sender = isGroup ? msg.key.participant : from;
        const pushName = msg.pushName || 'مستخدم';
        const isOwner = ['393271166550'].some(o => sender?.includes(o));
        const msgType = getContentType(msg.message);
        
        // الحصول على معلومات المجموعة
        let isGroupAdmin = false;
        let groupMetadata = null;
        if (isGroup) {
          try {
            groupMetadata = await sock.groupMetadata(from);
            isGroupAdmin = groupMetadata.participants?.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));
          } catch {}
        }
        
        let body = '';
        if (msgType === 'conversation') body = msg.message.conversation || '';
        else if (msgType === 'extendedTextMessage') body = msg.message.extendedTextMessage?.text || '';
        else if (msgType === 'imageMessage') body = msg.message.imageMessage?.caption || '';
        else if (msgType === 'videoMessage') body = msg.message.videoMessage?.caption || '';
        if (!body) continue;

        // 🤖 التعلم من الرسائل للذكاء الاصطناعي
        if (isGroup) {
          const { learnFromMessage, generateResponse } = await import('./lib/ai.mjs');
          learnFromMessage(sender, pushName, body, from);
          
          // توليد رد ذكي من فاطمة
          const aiResponse = await generateResponse({ body }, from, sender, pushName);
          if (aiResponse) {
            await delay(1000 + Math.random() * 2000); // تأخير طبيعي
            await sock.sendMessage(from, { text: aiResponse });
          }
        }

        const prefix = db.settings?.prefix || '.';
        const isCommand = body.startsWith(prefix);
        
        if (isCommand) {
          const fullCmd = body.slice(prefix.length).trim();
          const [cmd, ...args] = fullCmd.split(/\s+/);
          const text = args.join(' ');
          const quoted = msg.message.extendedTextMessage?.contextInfo;
          db.stats.commands = (db.stats.commands || 0) + 1;

          const ctx = { from, sender, pushName, isGroup, isGroupAdmin, groupMetadata, isOwner, command: cmd.toLowerCase(), args, text, prefix, quoted, msg };
          await execCmd(sock, msg, ctx);
        }
      } catch (e) { console.error('❌', e.message); }
    }
  });
}

console.log(`
╭═══════════════════════════════════════════════════════════════❖
║   🌙 فَــاطِــمَــة بَــوت v10.0
║   ★ المالك: zaza
║   ★ 🎮 RPG | 🏰 Clans | 🛒 Market | 🤖 AI
╰═══════════════════════════════════════════════════════════════❖
`);

initAI().then(() => loadPlugins()).then(p => { plugins = p; start(); });

process.on('uncaughtException', (e) => {
  if (!String(e.message).includes('Bad MAC')) console.error('❌', e.message);
});

process.on('SIGINT', () => { console.log('\n👋 إغلاق...'); saveDatabase(); process.exit(0); });
