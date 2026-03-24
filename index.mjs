// ═══════════════════════════════════════════════════════════════════════════════
// 🌙 فاطمة بوت - النسخة المتطورة v12.0 مع الأنظمة الجديدة
// ═══════════════════════════════════════════════════════════════════════════════

import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers, delay, getContentType } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadPlugins, execCmd } from './lib/loader.mjs';
import { initAI } from './lib/ai.mjs';
import { getDatabase, saveDatabase } from './lib/database.mjs';
import { menus } from './plugins/menu.mjs';
import cron from 'node-cron';
import { resetDailyStamina, spawnRandomBossEvent } from './lib/scheduler.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sock = null;
let plugins = [];

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 دالة إرسال القائمة الرئيسية التفاعلية
// ═══════════════════════════════════════════════════════════════════════════════

async function sendMainMenu(remoteJid) {
    const db = getDatabase();
    const up = process.uptime();
    const uptime = `${Math.floor(up/86400)}d ${Math.floor((up%86400)/3600)}h ${Math.floor((up%3600)/60)}m`;
    const commandsCount = "200+";
    const playersCount = Object.keys(db.players || {}).length;
    const clansCount = Object.keys(db.clans || {}).length;

    const listMessage = {
        text: `أهلاً بك! أنا بوت *فاطمة* 🌙\nاختر القسم الذي تريد تصفح أوامره من القائمة أدناه.\n\n⏱️ النشاط: ${uptime}\n📊 الأوامر المتاحة: ${commandsCount}\n👥 اللاعبين: ${playersCount} | 🏰 الكلانات: ${clansCount}`,
        footer: 'بواسطة: zaza | نسخة 12.0',
        title: '🌙 فَــاطِــمَــة بَــوت v12.0',
        buttonText: 'فتح الأقسام 📂',
        sections: [
            {
                title: '🎮 الألعاب والأنظمة',
                rows: [
                    { title: 'نظام RPG', rowId: 'rpg_menu', description: 'قتال، صيد، تعدين، وصناديق' },
                    { title: 'المهارات والقدرات', rowId: 'skills_menu', description: 'شجرة مهارات ونقاط قدرة' },
                    { title: 'نظام القرية', rowId: 'village_menu', description: 'بناء قرية، وحدات، وهجمات' },
                    { title: 'نظام الزعماء', rowId: 'boss_menu', description: 'قتال جماعي ضد زعماء أقوياء' },
                    { title: 'المهام والإنجازات', rowId: 'quests_menu', description: 'مهام يومية وأسبوعية' }
                ]
            },
            {
                title: '🏰 الكلانات والحروب',
                rows: [
                    { title: 'نظام الكلانات', rowId: 'clans_menu', description: 'إنشاء كلان وتبرعات' },
                    { title: 'حروب الكلانات', rowId: 'war_menu', description: 'تحديات ومعارك كلانية' },
                    { title: 'السوق المفتوح', rowId: 'market_menu', description: 'بيع وشراء بين اللاعبين' }
                ]
            },
            {
                title: '🤖 ذكاء وأدوات',
                rows: [
                    { title: 'الذكاء الاصطناعي', rowId: 'ai_menu', description: 'سؤال، ترجمة، وشرح' },
                    { title: 'الملصقات', rowId: 'sticker_menu', description: 'إنشاء وتحويل الملصقات' },
                    { title: 'الأدوات', rowId: 'tools_menu', description: 'أدوات متنوعة' },
                    { title: 'التحميلات', rowId: 'download_menu', description: 'تحميل فيديوهات وأغاني' }
                ]
            },
            {
                title: '👥 الإدارة',
                rows: [
                    { title: 'إدارة المجموعات', rowId: 'group_menu', description: 'طرد، ترقية، وإعدادات' },
                    { title: 'أوامر المالك', rowId: 'owner_menu', description: 'إدارة البوت (للمالك فقط)' }
                ]
            }
        ],
        viewOnce: true
    };

    await sock.sendMessage(remoteJid, listMessage);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 بدء التشغيل
// ═══════════════════════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════════════════
  // 🕐 المهام المجدولة (Scheduled Tasks)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // إعادة تعيين الطاقة يومياً عند منتصف الليل
  cron.schedule('0 0 * * *', () => {
    console.log('🔄 [Scheduler] إعادة تعيين الطاقة اليومية...');
    resetDailyStamina(sock);
  });
  
  // ظهور الزعماء العشوائي كل ساعة
  cron.schedule('0 * * * *', () => {
    console.log('👹 [Scheduler] فحص ظهور الزعماء...');
    spawnRandomBossEvent(sock);
  });
  
  // حفظ قاعدة البيانات كل 5 دقائق
  cron.schedule('*/5 * * * *', () => {
    saveDatabase();
  });

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
        const prefix = db.settings?.prefix || '.';
        
        // ═══════════════════════════════════════════════════════════════════════
        // 📋 معالجة ردود القائمة التفاعلية
        // ═══════════════════════════════════════════════════════════════════════
        
        if (msgType === 'interactiveResponseMessage') {
          const paramsJson = msg.message.interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson;
          if (paramsJson) {
            try {
              const selectionId = JSON.parse(paramsJson).id;
              
              // الرد بناءً على الاختيار
              const menuResponses = {
                'rpg_menu': () => menus.rpg(prefix),
                'skills_menu': () => menus.skills(prefix),
                'village_menu': () => menus.village(prefix),
                'boss_menu': () => menus.boss(prefix),
                'quests_menu': () => menus.quests(prefix),
                'clans_menu': () => menus.clans(prefix),
                'war_menu': () => menus.war(prefix),
                'market_menu': () => menus.market(prefix),
                'ai_menu': () => menus.ai(prefix),
                'sticker_menu': () => menus.sticker(prefix),
                'tools_menu': () => menus.tools(prefix),
                'download_menu': () => menus.download(prefix),
                'group_menu': () => menus.group(prefix),
                'owner_menu': () => menus.owner(prefix)
              };
              
              if (menuResponses[selectionId]) {
                await sock.sendMessage(from, { text: menuResponses[selectionId]() });
              }
            } catch (e) {
              console.error('❌ خطأ في معالجة القائمة:', e.message);
            }
          }
          continue;
        }
        
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
            await delay(1000 + Math.random() * 2000);
            await sock.sendMessage(from, { text: aiResponse });
          }
        }

        const isCommand = body.startsWith(prefix);
        
        // أمر عرض المينو الرئيسي
        if (body === `${prefix}menu` || body === '.menu') {
          await sendMainMenu(from);
          continue;
        }
        
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

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 الشاشة الافتتاحية
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`
╭═══════════════════════════════════════════════════════════════❖
║   🌙 فَــاطِــمَــة بَــوت v12.0
║   ★ المالك: zaza
║   ★ 🎮 RPG | 🏘️ Village | ⚡ Skills | 👹 Boss
║   ★ 📜 Quests | 🏰 Clans | 🛒 Market | 🤖 AI
╰═══════════════════════════════════════════════════════════════❖
`);

initAI().then(() => loadPlugins()).then(p => { plugins = p; start(); });

process.on('uncaughtException', (e) => {
  if (!String(e.message).includes('Bad MAC')) console.error('❌', e.message);
});

process.on('SIGINT', () => { console.log('\n👋 إغلاق...'); saveDatabase(); process.exit(0); });
