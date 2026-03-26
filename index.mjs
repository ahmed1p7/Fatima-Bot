// ═══════════════════════════════════════════════════════════════════════════════
// 🌙 فاطمة بوت - النسخة المتطورة v13.0 مع الأنظمة الجديدة
// ═══════════════════════════════════════════════════════════════════════════════

import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers, delay, getContentType } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadPlugins, execCmd } from './lib/loader.mjs';
import { getDatabase, saveDatabase, getRpgData } from './lib/database.mjs';
import { initScheduler } from './lib/scheduler.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sock = null;
let plugins = [];

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 دالة إرسال القائمة الرئيسية التفاعلية
// ═══════════════════════════════════════════════════════════════════════════════

async function sendMainMenu(remoteJid) {
    const db = getDatabase();
    const rpgData = getRpgData();
    const up = process.uptime();
    const uptime = `${Math.floor(up/86400)}d ${Math.floor((up%86400)/3600)}h ${Math.floor((up%3600)/60)}m`;
    const playersCount = Object.keys(rpgData.players || {}).length;
    const clansCount = Object.keys(rpgData.clans || {}).length;

    const listMessage = {
        text: `أهلاً بك! أنا بوت *فاطمة* 🌙
اختر القسم الذي تريد تصفح أوامره من القائمة أدناه.

⏱️ النشاط: ${uptime}
👥 اللاعبين: ${playersCount} | 🏰 الكلانات: ${clansCount}`,
        footer: 'بواسطة: zaza | نسخة 13.0',
        title: '🌙 فَــاطِــمَــة بَــوت v13.0',
        buttonText: 'فتح الأقسام 📂',
        sections: [
            {
                title: '🎮 الألعاب والأنظمة',
                rows: [
                    { title: 'نظام RPG', rowId: 'rpg_menu', description: 'تسجيل، قتال، صيد، تعدين، وصناديق' },
                    { title: 'المهارات والقدرات', rowId: 'skills_menu', description: 'شجرة مهارات ونقاط قدرة' },
                    { title: 'نظام الزعماء', rowId: 'boss_menu', description: 'قتال جماعي ضد زعماء أقوياء' }
                ]
            },
            {
                title: '🏰 الكلانات',
                rows: [
                    { title: 'نظام الكلانات', rowId: 'clans_menu', description: 'إنشاء كلان وتبرعات وحروب' }
                ]
            },
            {
                title: '🤖 ذكاء وأدوات',
                rows: [
                    { title: 'الذكاء الاصطناعي', rowId: 'ai_menu', description: 'سؤال، ترجمة، وشرح' },
                    { title: 'الأدوات', rowId: 'tools_menu', description: 'أدوات متنوعة' }
                ]
            },
            {
                title: '👥 الإدارة',
                rows: [
                    { title: 'إدارة المجموعات', rowId: 'group_menu', description: 'طرد، ترقية، وإنذارات' },
                    { title: 'أوامر المالك', rowId: 'owner_menu', description: 'إدارة البوت (للمالك فقط)' }
                ]
            }
        ],
        viewOnce: true
    };

    await sock.sendMessage(remoteJid, listMessage);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 القوائم الفرعية
// ═══════════════════════════════════════════════════════════════════════════════

const menuResponses = {
  'rpg_menu': (p) => `@
━─━••❁⊰｢❀｣⊱❁••━─━

🎮 • • ✤ أوامر RPG ✤ • • 🎮

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ 📝 التسجيل:
│ ${p}تسجيل <الصنف>
│ ${p}ملفي - عرض ملفك
│ ${p}حذف_تسجيل تأكيد
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

⚔️ القتال:
│ ${p}هجوم - قتال وحش
│ ${p}تحدي @شخص - PvP
│ ${p}علاج - استعادة HP

💰 الموارد:
│ ${p}يومي - جائزة يومية
│ ${p}عمل - كسب ذهب
│ ${p}صيد - صيد سمك
│ ${p}تعدين - تعدين معادن

📦 الصناديق:
│ ${p}صناديقي - عرض صناديقك
│ ${p}فتح_صندوق <نوع>

⚡ المهارات:
│ ${p}مهاراتي - مهاراتك
│ ${p}شجرة - شجرة المهارات
│ ${p}مهارة <اسم> - فتح مهارة
│ ${p}نقاط <stat> - توزيع نقاط

👹 الزعماء:
│ ${p}زعماء - قائمة الزعماء
│ ${p}قتال_الزعيم - تسجيل
│ ${p}هجوم_زعيم - هجوم

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`,

  'skills_menu': (p) => `@
━─━••❁⊰｢❀｣⊱❁••━─━

⚡ • • ✤ نظام المهارات ✤ • • ⚡

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
🌙 المهارات السلبية (دائمة):
│ • الاستنزاف - استعادة HP
│ • التحمل المتفجر - ضرر إضافي
│ • الاختراق - تجاهل دفاع
│ • الحظ الملعون - فشل الخصم

⚔️ المهارات النشطة (بتهدئة):
│ • سرقة المانا - حرق طاقة
│ • الدرع التلقائي - حماية
│ • الضربة المزدوجة - ضرر مضاعف

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

💡 ${p}شجرة - عرض مهارات صنفك
💡 ${p}مهارة <اسم> - فتح مهارة

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`,

  'boss_menu': (p) => `@
━─━••❁⊰｢❀｣⊱❁••━─━

👹 • • ✤ نظام الزعماء ✤ • • 👹

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
🎭 آلية العمل:
│ 1. يظهر الزعيم عشوائياً
│ 2. التسجيل لمدة 10 دقائق
│ 3. المعركة تدوم 20 دقيقة
│ 4. توزيع الجوائز على الناجين
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

📋 الأوامر:
│ ${p}زعماء - قائمة الزعماء
│ ${p}قتال_الزعيم - تسجيل
│ ${p}هجوم_زعيم - هجوم
│ ${p}حالة_زعيم - معلومات

🏆 MVP يحصل على صندوق ملحمي!

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`,

  'clans_menu': (p) => `@
━─━••❁⊰｢❀｣⊱❁••━─━

🏰 • • ✤ نظام الكلانات ✤ • • 🏰

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
📋 أوامر الكلان:
│ ${p}تأسيس_كلان <اسم>
│ ${p}انضمام #ID
│ ${p}معلومات_كلان
│ ${p}تبرع <نوع> <كمية>
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

⚔️ الحروب:
│ ${p}تحدي #ID - تحدي كلان
│ ${p}حالتي_الحرب

🏘️ مباني الأصناف:
│ المحارب ← الثكنات
│ الساحر ← برج السحر
│ الشافي ← المشفى
│ الرامي/القاتل ← برج الاستطلاع

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`,

  'ai_menu': (p) => `@
━─━••❁⊰｢❀｣⊱❁••━─━

🤖 • • ✤ الذكاء الاصطناعي ✤ • • 🤖

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
📋 الأوامر:
│ ${p}اسأل <سؤال>
│ ${p}نصيحة - نصيحة مخصصة
│ ${p}ترجمة <نص>
│ ${p}شرح <موضوع>
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

🧠 فاطمة ستساعدك في رحلتك!

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`,

  'tools_menu': (p) => `@
━─━••❁⊰｢❀｣⊱❁••━─━

🛠️ • • ✤ الأدوات ✤ • • 🛠️

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ ${p}ملصق - إنشاء ملصق
│ ${p}توليد - توليد صورة AI
│ ${p}تحويل - تحويل صورة
│ ${p}خمن - لعبة تخمين
│ ${p}حجر_ورقة_مقص
│ ${p}كتابة_سريعة
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`,

  'group_menu': (p) => `@
━─━••❁⊰｢❀｣⊱❁••━─━

👥 • • ✤ إدارة المجموعات ✤ • • 👥

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
📢 المنشنات:
│ ${p}منشن - منشن علني
│ ${p}مخفي - منشن مخفي

⚠️ الإنذارات:
│ ${p}إنذار @شخص <سبب>
│ ${p}الإنذارات @شخص
│ ${p}عفو @شخص

👥 الإدارة:
│ ${p}طرد @شخص
│ ${p}ترقية @شخص
│ ${p}تنزيل @شخص
│ ${p}حذف - حذف رسالة

⚙️ الإعدادات:
│ ${p}فتح / ${p}إغلاق
│ ${p}تغيير_اسم <اسم>
│ ${p}القواعد / ${p}وضع_قواعد
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`,

  'owner_menu': (p) => `@
━─━••❁⊰｢❀｣⊱❁••━─━

👑 • • ✤ أوامر المالك ✤ • • 👑

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
🔧 الإدارة:
│ ${p}تحديث - تحديث البوت
│ ${p}إعادة - إعادة التشغيل
│ ${p}إحصائيات - إحصائيات البوت
│ ${p}حالة - حالة البوت

📢 الإرسال:
│ ${p}إرسال <رسالة> - للكل
│ ${p}مجموعات - قائمة المجموعات

🎮 اللاعبين:
│ ${p}تصفير @شخص
│ ${p}إعطاء <نوع> <كمية> @شخص
│ ${p}معلومات_لاعب @شخص
│ ${p}قائمة_اللاعبين

⚙️ قاعدة البيانات:
│ ${p}ترقية - تحديث DB
│ ${p}نسخة_احتياطية
│ ${p}معلومات_قاعدة
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`
};

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
      
      // عرض معلومات القنوات التي يتواجد فيها البوت وتعيين JID القناة
      try {
        const allChats = Object.values(sock.chats);
        const channels = allChats.filter(chat => chat.id.endsWith('@newsletter'));
        if (channels.length > 0) {
          console.log('\n📢 القنوات المتواجدة فيها:');
          for (const channel of channels) {
            console.log(`   - الاسم: ${channel.name || 'غير معروف'} | JID: ${channel.id}`);
            // تعيين JID القناة الأولى لبلاجن الكلان
            const clanPlugin = plugins.find(p => p.name === 'Clan');
            if (clanPlugin && clanPlugin.setChannelJid) {
              clanPlugin.setChannelJid(channel.id);
              console.log(`   ✅ تم تعيين JID القناة لبلاجن الكلان: ${channel.id}`);
            }
          }
        } else {
          console.log('\n⚠️ لم يتم العثور على أي قنوات. تأكد من انضمام البوت للقناة.');
        }
      } catch (err) {
        console.error('❌ خطأ في جلب معلومات القنوات:', err.message);
      }
      
      // تهيئة المجدول
      initScheduler(sock);
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
        const prefix = db.settings?.prefix || '.';
        
        // ═══════════════════════════════════════════════════════════════════════
        // 📋 معالجة ردود القائمة التفاعلية
        // ═══════════════════════════════════════════════════════════════════════
        
        if (msgType === 'interactiveResponseMessage') {
          const paramsJson = msg.message.interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson;
          if (paramsJson) {
            try {
              const selectionId = JSON.parse(paramsJson).id;
              
              if (menuResponses[selectionId]) {
                await sock.sendMessage(from, { text: menuResponses[selectionId](prefix) });
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

        // تسجيل المجموعة
        if (isGroup) {
          db.groups = db.groups || {};
          if (!db.groups[from]) {
            db.groups[from] = { warnings: {}, settings: {} };
          }
        }

        const isCommand = body.startsWith(prefix);
        
        // أمر عرض المينو الرئيسي
        if (body === `${prefix}menu` || body === `${prefix}القائمة` || body === `${prefix}اوامر`) {
          await sendMainMenu(from);
          continue;
        }
        
        if (isCommand) {
          const fullCmd = body.slice(prefix.length).trim();
          const [cmd, ...args] = fullCmd.split(/\s+/);
          const text = args.join(' ');
          
          // استخراج المعلومات من الرسالة المقتبسة
          const quoted = {
            mentionedJid: msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [],
            stanzaId: msg.message.extendedTextMessage?.contextInfo?.stanzaId,
            participant: msg.message.extendedTextMessage?.contextInfo?.participant
          };
          
          db.stats.commands = (db.stats.commands || 0) + 1;

          const ctx = { 
            from, sender, pushName, isGroup, isGroupAdmin, groupMetadata, 
            isOwner, command: cmd.toLowerCase(), args, text, prefix, quoted, msg 
          };
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
║   🌙 فَــاطِــمَــة بَــوت v13.0
║   ★ المالك: zaza
║   ★ 🎮 RPG | ⚡ Skills | 👹 Boss | 🏰 Clans
║   ★ 📜 Quests | 🤖 AI | 🗺️ Territories
╰═══════════════════════════════════════════════════════════════❖
`);

loadPlugins().then(p => { plugins = p; start(); });

process.on('uncaughtException', (e) => {
  if (!String(e.message).includes('Bad MAC')) console.error('❌', e.message);
});

process.on('SIGINT', () => { console.log('\n👋 إغلاق...'); saveDatabase(); process.exit(0); });
