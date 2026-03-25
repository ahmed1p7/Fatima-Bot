// ═══════════════════════════════════════════════════════════════════════════════
// 👑 أوامر المالك - فاطمة بوت v12.0
// ═══════════════════════════════════════════════════════════════════════════════

import { exec } from 'child_process';
import { promisify } from 'util';
import { saveDatabase, getDatabase, getRpgData, forceMigrateAll, getPlayerSchema, getClanSchema, addFieldToAllPlayers, removeFieldFromAllPlayers } from '../lib/database.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

const banned = new Set();

export default {
  name: 'Owner',
  commands: [
    'تحديث', 'update',
    'إعادة', 'restart',
    'إحصائيات', 'stats',
    'إرسال', 'bc', 'broadcast',
    'مجموعات', 'groups',
    'حظر_عام', 'ban',
    'فك_حظر', 'unban',
    'المحظورين', 'banned',
    'خروج', 'leave',
    'تصفير', 'reset',
    'إعطاء', 'give',
    'سحب', 'take',
    'معلومات_لاعب', 'playerinfo',
    'قائمة_اللاعبين', 'players',
    'حذف_لاعب', 'deleteplayer',
    'وضع_بريفكس', 'setprefix',
    'وضع_اسم', 'setname',
    'حالة', 'status',
    // أوامر قاعدة البيانات الجديدة
    'ترقية', 'migrate',
    'مخطط', 'schema',
    'إضافة_حقل', 'addfield',
    'حذف_حقل', 'removefield',
    'نسخة_احتياطية', 'backup',
    'استعادة', 'restore',
    'معلومات_قاعدة', 'dbinfo'
  ],

  async execute(sock, msg, ctx) {
    const { from, sender, command, args, text, isOwner, prefix, quoted } = ctx;
    if (!isOwner) return sock.sendMessage(from, { text: '❌ هذا الأمر للمالك فقط!' });

    const db = getDatabase();
    const rpgData = getRpgData();

    // ═══════════════════════════════════════════════════════════════════════════
    // تحديث البوت
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تحديث', 'update'].includes(command)) {
      await sock.sendMessage(from, { text: '🔄 جاري التحديث...' });
      saveDatabase();
      try {
        await execAsync('cd ' + process.cwd() + ' && git pull');
        return sock.sendMessage(from, { text: '✅ تم التحديث! استخدم .إعادة لإعادة التشغيل' });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ ' + e.message });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // إعادة التشغيل
    // ═══════════════════════════════════════════════════════════════════════════
    if (['إعادة', 'restart'].includes(command)) {
      await sock.sendMessage(from, { text: '🔄 إعادة تشغيل...' });
      saveDatabase();
      process.exit(0);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // إحصائيات البوت
    // ═══════════════════════════════════════════════════════════════════════════
    if (['إحصائيات', 'stats'].includes(command)) {
      const up = process.uptime();
      const days = Math.floor(up / 86400);
      const hours = Math.floor((up % 86400) / 3600);
      const mins = Math.floor((up % 3600) / 60);

      const playersCount = Object.keys(rpgData.players || {}).length;
      const clansCount = Object.keys(rpgData.clans || {}).length;
      const groupsCount = Object.keys(db.groups || {}).length;

      return sock.sendMessage(from, {
        text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

📊 • • ✤ إحصائيات البوت ✤ • • 📊

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ ⏱️ النشاط: ${days}d ${hours}h ${mins}m
│ 💬 الرسائل: ${(db.stats?.messages || 0).toLocaleString()}
│ ⚡ الأوامر: ${(db.stats?.commands || 0).toLocaleString()}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

👥 المستخدمين:
│ 🎮 اللاعبين: ${playersCount}
│ 🏰 الكلانات: ${clansCount}
│ 📋 المجموعات: ${groupsCount}

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // إرسال رسالة للكل
    // ═══════════════════════════════════════════════════════════════════════════
    if (['إرسال', 'bc', 'broadcast'].includes(command)) {
      if (!text) return sock.sendMessage(from, { text: '❌ اكتب الرسالة!' });

      const chats = await sock.groupFetchAllParticipating();
      const ids = Object.keys(chats);

      await sock.sendMessage(from, { text: `⏳ جاري الإرسال إلى ${ids.length} مجموعة...` });

      let success = 0;
      for (const id of ids) {
        try {
          await sock.sendMessage(id, { text: `📢 إعلان:\n\n${text}` });
          success++;
        } catch {}
      }

      return sock.sendMessage(from, { text: `✅ تم الإرسال إلى ${success}/${ids.length} مجموعة!` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // قائمة المجموعات
    // ═══════════════════════════════════════════════════════════════════════════
    if (['مجموعات', 'groups'].includes(command)) {
      const chats = await sock.groupFetchAllParticipating();
      const list = Object.values(chats).map((g, i) =>
        `${i + 1}. ${g.subject}\n   👥 ${g.participants.length} عضو`
      ).join('\n\n');

      return sock.sendMessage(from, { text: `📋 المجموعات (${Object.keys(chats).length}):\n\n${list}` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // حظر عام
    // ═══════════════════════════════════════════════════════════════════════════
    if (['حظر_عام', 'ban'].includes(command)) {
      let user = quoted?.mentionedJid?.[0] || (args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
      if (!user) return sock.sendMessage(from, { text: '❌ أشر للشخص أو اكتب رقمه!' });

      banned.add(user);

      // إضافة لقاعدة البيانات
      if (!db.banned) db.banned = [];
      if (!db.banned.includes(user)) {
        db.banned.push(user);
        saveDatabase();
      }

      return sock.sendMessage(from, { text: `✅ تم حظر المستخدم!`, mentions: [user] });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // فك الحظر
    // ═══════════════════════════════════════════════════════════════════════════
    if (['فك_حظر', 'unban'].includes(command)) {
      let user = (args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net');

      if (!banned.has(user) && !db.banned?.includes(user)) {
        return sock.sendMessage(from, { text: '❌ هذا المستخدم غير محظور!' });
      }

      banned.delete(user);
      if (db.banned) {
        db.banned = db.banned.filter(u => u !== user);
        saveDatabase();
      }

      return sock.sendMessage(from, { text: '✅ تم فك الحظر!' });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // قائمة المحظورين
    // ═══════════════════════════════════════════════════════════════════════════
    if (['المحظورين', 'banned'].includes(command)) {
      const bannedList = [...banned, ...(db.banned || [])];
      const uniqueBanned = [...new Set(bannedList)];

      if (uniqueBanned.length === 0) {
        return sock.sendMessage(from, { text: '✅ لا يوجد محظورين!' });
      }

      return sock.sendMessage(from, {
        text: `🚫 المحظورين:\n${uniqueBanned.map(u => '• @' + u.split('@')[0]).join('\n')}`,
        mentions: uniqueBanned
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // خروج من المجموعة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['خروج', 'leave'].includes(command)) {
      await sock.sendMessage(from, { text: '👋 خروج من المجموعة...' });
      return sock.groupLeave(from);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // تصفير بيانات لاعب
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تصفير', 'reset'].includes(command)) {
      let user = quoted?.mentionedJid?.[0] || (args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net');

      if (!user) {
        return sock.sendMessage(from, { text: '❌ أشر للشخص أو اكتب رقمه!' });
      }

      if (!rpgData.players?.[user]) {
        return sock.sendMessage(from, { text: '❌ اللاعب غير موجود!' });
      }

      // حفظ الاسم قبل الحذف
      const playerName = rpgData.players[user].name || 'غير معروف';

      delete rpgData.players[user];
      saveDatabase();

      return sock.sendMessage(from, {
        text: `✅ تم تصفير بيانات ${playerName}!`,
        mentions: [user]
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // إعطاء ذهب/عناصر للاعب
    // ═══════════════════════════════════════════════════════════════════════════
    if (['إعطاء', 'give'].includes(command)) {
      const type = args[0]?.toLowerCase();
      const amount = parseInt(args[1]);
      let user = quoted?.mentionedJid?.[0] || (args[2]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net');

      if (!type || !amount) {
        return sock.sendMessage(from, {
          text: `❌ الصيغة: ${prefix}إعطاء <gold/xp/level> <الكمية> <@شخص>\n\nمثال:\n${prefix}إعطاء gold 1000 @شخص\n${prefix}إعطاء xp 500 @شخص\n${prefix}إعطاء level 5 @شخص`
        });
      }

      if (!user) {
        return sock.sendMessage(from, { text: '❌ أشر للشخص!' });
      }

      if (!rpgData.players?.[user]) {
        return sock.sendMessage(from, { text: '❌ اللاعب غير موجود!' });
      }

      const player = rpgData.players[user];

      switch (type) {
        case 'gold':
          player.gold = (player.gold || 0) + amount;
          break;
        case 'xp':
          player.xp = (player.xp || 0) + amount;
          break;
        case 'level':
          player.level = (player.level || 1) + amount;
          break;
        default:
          return sock.sendMessage(from, { text: '❌ نوع غير صحيح! استخدم: gold, xp, level' });
      }

      saveDatabase();
      return sock.sendMessage(from, {
        text: `✅ تم إعطاء ${amount} ${type} إلى ${player.name}!`,
        mentions: [user]
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // سحب من لاعب
    // ═══════════════════════════════════════════════════════════════════════════
    if (['سحب', 'take'].includes(command)) {
      const type = args[0]?.toLowerCase();
      const amount = parseInt(args[1]);
      let user = quoted?.mentionedJid?.[0] || (args[2]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net');

      if (!type || !amount || !user) {
        return sock.sendMessage(from, { text: `❌ الصيغة: ${prefix}سحب <gold/xp> <الكمية> <@شخص>` });
      }

      if (!rpgData.players?.[user]) {
        return sock.sendMessage(from, { text: '❌ اللاعب غير موجود!' });
      }

      const player = rpgData.players[user];

      switch (type) {
        case 'gold':
          player.gold = Math.max(0, (player.gold || 0) - amount);
          break;
        case 'xp':
          player.xp = Math.max(0, (player.xp || 0) - amount);
          break;
        default:
          return sock.sendMessage(from, { text: '❌ نوع غير صحيح!' });
      }

      saveDatabase();
      return sock.sendMessage(from, {
        text: `✅ تم سحب ${amount} ${type} من ${player.name}!`,
        mentions: [user]
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // معلومات لاعب
    // ═══════════════════════════════════════════════════════════════════════════
    if (['معلومات_لاعب', 'playerinfo'].includes(command)) {
      let user = quoted?.mentionedJid?.[0] || (args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net');

      if (!user) {
        return sock.sendMessage(from, { text: '❌ أشر للشخص أو اكتب رقمه!' });
      }

      const player = rpgData.players?.[user];
      if (!player) {
        return sock.sendMessage(from, { text: '❌ اللاعب غير موجود!' });
      }

      return sock.sendMessage(from, {
        text: `📋 معلومات اللاعب:

👤 الاسم: ${player.name}
🎭 الصنف: ${player.class}
🎖️ المستوى: ${player.level}
⭐ XP: ${player.xp}
💰 الذهب: ${(player.gold || 0).toLocaleString()}
🏆 الانتصارات: ${player.wins || 0}
💔 الخسائر: ${player.losses || 0}

📊 الإحصائيات:
⚔️ هجوم: ${player.atk}
🛡️ دفاع: ${player.def}
✨ سحر: ${player.mag}
❤️ صحة: ${player.hp}/${player.maxHp}`,
        mentions: [user]
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // قائمة اللاعبين
    // ═══════════════════════════════════════════════════════════════════════════
    if (['قائمة_اللاعبين', 'players'].includes(command)) {
      const players = Object.entries(rpgData.players || {})
        .map(([id, p]) => ({ id, ...p }))
        .sort((a, b) => (b.level || 1) - (a.level || 1))
        .slice(0, 20);

      if (players.length === 0) {
        return sock.sendMessage(from, { text: '❌ لا يوجد لاعبين!' });
      }

      const list = players.map((p, i) =>
        `${i + 1}. ${p.name} (Lv.${p.level})\n   💰 ${(p.gold || 0).toLocaleString()}`
      ).join('\n\n');

      return sock.sendMessage(from, { text: `🎮 قائمة اللاعبين (${Object.keys(rpgData.players || {}).length}):\n\n${list}` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // حذف لاعب
    // ═══════════════════════════════════════════════════════════════════════════
    if (['حذف_لاعب', 'deleteplayer'].includes(command)) {
      let user = quoted?.mentionedJid?.[0] || (args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net');

      if (!user) {
        return sock.sendMessage(from, { text: '❌ أشر للشخص أو اكتب رقمه!' });
      }

      if (!rpgData.players?.[user]) {
        return sock.sendMessage(from, { text: '❌ اللاعب غير موجود!' });
      }

      delete rpgData.players[user];
      saveDatabase();

      return sock.sendMessage(from, { text: '✅ تم حذف اللاعب!' });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // وضع بريفكس
    // ═══════════════════════════════════════════════════════════════════════════
    if (['وضع_بريفكس', 'setprefix'].includes(command)) {
      const newPrefix = args[0];
      if (!newPrefix) {
        return sock.sendMessage(from, { text: '❌ اكتب البريفكس الجديد!' });
      }

      if (!db.settings) db.settings = {};
      db.settings.prefix = newPrefix;
      saveDatabase();

      return sock.sendMessage(from, { text: `✅ تم تغيير البريفكس إلى: ${newPrefix}` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // وضع اسم البوت
    // ═══════════════════════════════════════════════════════════════════════════
    if (['وضع_اسم', 'setname'].includes(command)) {
      const name = args.join(' ');
      if (!name) {
        return sock.sendMessage(from, { text: '❌ اكتب الاسم الجديد!' });
      }

      if (!db.settings) db.settings = {};
      db.settings.botName = name;
      saveDatabase();

      return sock.sendMessage(from, { text: `✅ تم تغيير اسم البوت إلى: ${name}` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // حالة البوت
    // ═══════════════════════════════════════════════════════════════════════════
    if (['حالة', 'status'].includes(command)) {
      const memUsage = process.memoryUsage();
      const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024);

      return sock.sendMessage(from, {
        text: `📊 حالة البوت:

🖥️ الذاكرة: ${heapUsed}MB / ${heapTotal}MB
📍 البريفكس: ${db.settings?.prefix || '.'}
📛 الاسم: ${db.settings?.botName || 'FATIMA'}
🚫 المحظورين: ${[...banned, ...(db.banned || [])].length}
✅ الحالة: نشط`
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ترقية قاعدة البيانات (Migration)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['ترقية', 'migrate'].includes(command)) {
      await sock.sendMessage(from, { text: '🔄 جاري ترقية قاعدة البيانات...' });
      
      try {
        forceMigrateAll();
        return sock.sendMessage(from, { 
          text: `✅ تم ترقية قاعدة البيانات بنجاح!

📊 الإحصائيات:
│ 👥 اللاعبين: ${Object.keys(rpgData.players || {}).length}
│ 🏰 الكلانات: ${Object.keys(rpgData.clans || {}).length}
│ 📌 الإصدار: ${rpgData.version}` 
        });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ خطأ في الترقية: ' + e.message });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // عرض مخطط اللاعب/الكلان
    // ═══════════════════════════════════════════════════════════════════════════
    if (['مخطط', 'schema'].includes(command)) {
      const type = args[0]?.toLowerCase();
      
      if (type === 'clan' || type === 'كلان') {
        const schema = getClanSchema();
        const fields = Object.entries(schema)
          .map(([k, v]) => `│ ${k}: ${Array.isArray(v) ? '[]' : typeof v}`)
          .join('\n');
        
        return sock.sendMessage(from, {
          text: `🏰 مخطط الكلان:\n\n${fields}`
        });
      }
      
      const schema = getPlayerSchema();
      const mainFields = Object.entries(schema)
        .filter(([k, v]) => typeof v !== 'object' || Array.isArray(v))
        .map(([k, v]) => `│ ${k}: ${Array.isArray(v) ? '[]' : typeof v}`)
        .join('\n');
      
      const statsFields = Object.entries(schema.stats || {})
        .map(([k, v]) => `│   ${k}: ${typeof v}`)
        .join('\n');
      
      return sock.sendMessage(from, {
        text: `🎮 مخطط اللاعب:\n\n📋 الحقول الرئيسية:\n${mainFields}\n\n📊 الإحصائيات:\n${statsFields}\n\n💡 استخدم ${prefix}مخطط كلان لمخطط الكلانات`
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // إضافة حقل جديد لجميع اللاعبين
    // ═══════════════════════════════════════════════════════════════════════════
    if (['إضافة_حقل', 'addfield'].includes(command)) {
      const fieldPath = args[0];
      const defaultValue = args.slice(1).join(' ');
      
      if (!fieldPath) {
        return sock.sendMessage(from, {
          text: `❌ الصيغة: ${prefix}إضافة_حقل <مسار_الحقل> <القيمة_الافتراضية>\n\nمثال:\n${prefix}إضافة_حقل gems 0\n${prefix}إضافة_حقل stats.newStat 100`
        });
      }
      
      try {
        let parsedValue = defaultValue;
        // محاولة تحويل القيمة
        if (defaultValue === 'true') parsedValue = true;
        else if (defaultValue === 'false') parsedValue = false;
        else if (!isNaN(defaultValue) && defaultValue !== '') parsedValue = Number(defaultValue);
        else if (defaultValue === '[]') parsedValue = [];
        else if (defaultValue === '{}') parsedValue = {};
        
        addFieldToAllPlayers(fieldPath, parsedValue);
        return sock.sendMessage(from, { 
          text: `✅ تم إضافة الحقل \`${fieldPath}\` بقيمة \`${parsedValue}\` لجميع اللاعبين!` 
        });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ خطأ: ' + e.message });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // حذف حقل من جميع اللاعبين
    // ═══════════════════════════════════════════════════════════════════════════
    if (['حذف_حقل', 'removefield'].includes(command)) {
      const fieldPath = args[0];
      
      if (!fieldPath) {
        return sock.sendMessage(from, {
          text: `❌ الصيغة: ${prefix}حذف_حقل <مسار_الحقل>\n\nمثال:\n${prefix}حذف_حقل oldField\n${prefix}حذف_حقل stats.oldStat`
        });
      }
      
      try {
        removeFieldFromAllPlayers(fieldPath);
        return sock.sendMessage(from, { 
          text: `✅ تم حذف الحقل \`${fieldPath}\` من جميع اللاعبين!` 
        });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ خطأ: ' + e.message });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // نسخة احتياطية
    // ═══════════════════════════════════════════════════════════════════════════
    if (['نسخة_احتياطية', 'backup'].includes(command)) {
      const DB_DIR = path.join(__dirname, '..', 'database');
      const BACKUP_DIR = path.join(DB_DIR, 'backups');
      
      try {
        if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
        
        const date = new Date();
        const timestamp = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}_${String(date.getHours()).padStart(2,'0')}-${String(date.getMinutes()).padStart(2,'0')}`;
        
        const dbFile = path.join(DB_DIR, 'database.json');
        const rpgFile = path.join(DB_DIR, 'rpg.json');
        
        if (fs.existsSync(dbFile)) {
          fs.copyFileSync(dbFile, path.join(BACKUP_DIR, `database_${timestamp}.json`));
        }
        if (fs.existsSync(rpgFile)) {
          fs.copyFileSync(rpgFile, path.join(BACKUP_DIR, `rpg_${timestamp}.json`));
        }
        
        return sock.sendMessage(from, {
          text: `✅ تم إنشاء نسخة احتياطية!\n\n📁 الملفات:\n│ database_${timestamp}.json\n│ rpg_${timestamp}.json\n\n📂 المسار: database/backups/`
        });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ خطأ: ' + e.message });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // استعادة من نسخة احتياطية
    // ═══════════════════════════════════════════════════════════════════════════
    if (['استعادة', 'restore'].includes(command)) {
      const backupName = args[0];
      
      if (!backupName) {
        // عرض النسخ المتاحة
        const BACKUP_DIR = path.join(__dirname, '..', 'database', 'backups');
        
        if (!fs.existsSync(BACKUP_DIR)) {
          return sock.sendMessage(from, { text: '❌ لا توجد نسخ احتياطية!' });
        }
        
        const files = fs.readdirSync(BACKUP_DIR)
          .filter(f => f.endsWith('.json'))
          .sort()
          .reverse()
          .slice(0, 10);
        
        if (files.length === 0) {
          return sock.sendMessage(from, { text: '❌ لا توجد نسخ احتياطية!' });
        }
        
        const list = files.map(f => `│ ${f}`).join('\n');
        return sock.sendMessage(from, {
          text: `📦 النسخ الاحتياطية المتاحة:\n\n${list}\n\n💡 استخدم: ${prefix}استعادة <اسم_الملف>`
        });
      }
      
      try {
        const DB_DIR = path.join(__dirname, '..', 'database');
        const BACKUP_DIR = path.join(DB_DIR, 'backups');
        const backupFile = path.join(BACKUP_DIR, backupName);
        
        if (!fs.existsSync(backupFile)) {
          return sock.sendMessage(from, { text: '❌ الملف غير موجود!' });
        }
        
        // تحديد نوع الملف
        if (backupName.startsWith('database_')) {
          fs.copyFileSync(backupFile, path.join(DB_DIR, 'database.json'));
        } else if (backupName.startsWith('rpg_')) {
          fs.copyFileSync(backupFile, path.join(DB_DIR, 'rpg.json'));
        }
        
        return sock.sendMessage(from, { 
          text: `✅ تم استعادة ${backupName}!\n\n⚠️ أعد تشغيل البوت لتطبيق التغييرات.\n${prefix}إعادة` 
        });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ خطأ: ' + e.message });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // معلومات قاعدة البيانات
    // ═══════════════════════════════════════════════════════════════════════════
    if (['معلومات_قاعدة', 'dbinfo'].includes(command)) {
      const DB_DIR = path.join(__dirname, '..', 'database');
      const dbFile = path.join(DB_DIR, 'database.json');
      const rpgFile = path.join(DB_DIR, 'rpg.json');
      
      const getFileInfo = (filePath) => {
        if (!fs.existsSync(filePath)) return 'غير موجود';
        const stats = fs.statSync(filePath);
        return `${(stats.size / 1024).toFixed(2)} KB`;
      };
      
      const playersCount = Object.keys(rpgData.players || {}).length;
      const clansCount = Object.keys(rpgData.clans || {}).length;
      
      // حساب إحصائيات إضافية
      let totalGold = 0;
      let totalLevel = 0;
      let maxLevel = 0;
      
      for (const p of Object.values(rpgData.players || {})) {
        totalGold += p.gold || 0;
        totalLevel += p.level || 1;
        maxLevel = Math.max(maxLevel, p.level || 1);
      }
      
      const avgLevel = playersCount > 0 ? (totalLevel / playersCount).toFixed(1) : 0;
      
      return sock.sendMessage(from, {
        text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

📊 • • ✤ معلومات قاعدة البيانات ✤ • • 📊

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ 📌 الإصدار: ${rpgData.version}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

📁 حجم الملفات:
│ database.json: ${getFileInfo(dbFile)}
│ rpg.json: ${getFileInfo(rpgFile)}

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

👥 اللاعبين:
│ 🎮 العدد: ${playersCount}
│ ⭐ أعلى مستوى: ${maxLevel}
│ 📊 متوسط المستوى: ${avgLevel}
│ 💰 إجمالي الذهب: ${totalGold.toLocaleString()}

🏰 الكلانات: ${clansCount}

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`
      });
    }
  }
};

export { banned };
