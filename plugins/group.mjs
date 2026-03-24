// ═══════════════════════════════════════════════════════════════════════════════
// 👥 أوامر المجموعات - فاطمة بوت v12.0
// ═══════════════════════════════════════════════════════════════════════════════

import { getDatabase, saveDatabase } from '../lib/database.mjs';

export default {
  name: 'Groups',
  commands: [
    'الجميع', 'منشن', 'tagall',
    'المشرفين', 'admins',
    'معلومات', 'infogp', 'معلومات_الجروب',
    'رابط', 'link',
    'فتح', 'open',
    'إغلاق', 'close',
    'طرد', 'kick',
    'ترقية', 'promote',
    'تنزيل', 'demote',
    'تحذير', 'warn',
    'التحذيرات', 'warnings',
    'محو', 'clearwarn',
    'حذف', 'delete', 'del',
    'تثبيت', 'pin',
    'القواعد', 'rules',
    'وضع_قواعد', 'setrules'
  ],

  async execute(sock, msg, ctx) {
    const { from, sender, command, args, text, isGroup, prefix, quoted, isGroupAdmin } = ctx;
    if (!isGroup) return sock.sendMessage(from, { text: '❌ هذا الأمر للمجموعات فقط!' });

    let meta;
    try {
      meta = await sock.groupMetadata(from);
    } catch {
      return;
    }

    const isAdmin = meta.participants.find(p => p.id === sender)?.admin;
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const isBotAdmin = meta.participants.find(p => p.id === botId)?.admin;
    const db = getDatabase();

    // تهيئة بيانات المجموعة
    if (!db.groups) db.groups = {};
    if (!db.groups[from]) db.groups[from] = { warnings: {}, rules: '' };

    // ═══════════════════════════════════════════════════════════════════════════
    // منشن للجميع
    // ═══════════════════════════════════════════════════════════════════════════
    if (['الجميع', 'منشن', 'tagall'].includes(command)) {
      if (!isAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين فقط!' });
      const mentions = meta.participants.map(p => p.id);
      const message = text || '👥 للجميع';
      return sock.sendMessage(from, { text: message, mentions });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // قائمة المشرفين
    // ═══════════════════════════════════════════════════════════════════════════
    if (['المشرفين', 'admins'].includes(command)) {
      const admins = meta.participants.filter(p => p.admin);
      return sock.sendMessage(from, {
        text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

👑 • • ✤ المشرفون ✤ • • 👑

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
${admins.map(a => `• @${a.id.split('@')[0]} ${a.admin === 'superadmin' ? '⭐' : ''}`).join('\n')}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`,
        mentions: admins.map(a => a.id)
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // معلومات المجموعة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['معلومات', 'infogp', 'معلومات_الجروب'].includes(command)) {
      const admins = meta.participants.filter(p => p.admin).length;
      const created = new Date(meta.creation * 1000);

      return sock.sendMessage(from, {
        text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

👥 • • ✤ ${meta.subject} ✤ • • 👥

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ 📝 الوصف: ${meta.desc ? meta.desc.substring(0, 100) + '...' : 'لا يوجد'}
│ 👥 الأعضاء: ${meta.participants.length}
│ 👑 المشرفين: ${admins}
│ 📅 الإنشاء: ${created.toLocaleDateString('ar')}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // رابط المجموعة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['رابط', 'link'].includes(command)) {
      if (!isBotAdmin) return sock.sendMessage(from, { text: '❌ يجب أن أكون مشرفاً أولاً!' });
      try {
        const code = await sock.groupInviteCode(from);
        return sock.sendMessage(from, { text: `🔗 رابط المجموعة:\nhttps://chat.whatsapp.com/${code}` });
      } catch {
        return sock.sendMessage(from, { text: '❌ لا يمكن الحصول على الرابط!' });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // فتح المجموعة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['فتح', 'open'].includes(command)) {
      if (!isAdmin || !isBotAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين فقط!' });
      await sock.groupSettingUpdate(from, 'not_announcement');
      return sock.sendMessage(from, { text: '✅ تم فتح المجموعة للجميع!' });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // إغلاق المجموعة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['إغلاق', 'close'].includes(command)) {
      if (!isAdmin || !isBotAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين فقط!' });
      await sock.groupSettingUpdate(from, 'announcement');
      return sock.sendMessage(from, { text: '✅ تم إغلاق المجموعة! الآن المشرفون فقط يمكنهم الكتابة.' });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // طرد عضو
    // ═══════════════════════════════════════════════════════════════════════════
    if (['طرد', 'kick'].includes(command)) {
      if (!isAdmin || !isBotAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين فقط!' });

      let user = quoted?.mentionedJid?.[0] || (args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
      if (!user || user === sender) return sock.sendMessage(from, { text: '❌ أشر للشخص!' });

      // التحقق من أن المستخدم ليس مشرفاً
      const targetAdmin = meta.participants.find(p => p.id === user)?.admin;
      if (targetAdmin) {
        return sock.sendMessage(from, { text: '❌ لا يمكن طرد مشرف!' });
      }

      await sock.groupParticipantsUpdate(from, [user], 'remove');
      return sock.sendMessage(from, { text: '✅ تم طرد العضو!', mentions: [user] });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ترقية عضو
    // ═══════════════════════════════════════════════════════════════════════════
    if (['ترقية', 'promote'].includes(command)) {
      if (!isAdmin || !isBotAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين فقط!' });

      let user = quoted?.mentionedJid?.[0] || (args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
      if (!user) return sock.sendMessage(from, { text: '❌ أشر للشخص!' });

      await sock.groupParticipantsUpdate(from, [user], 'promote');
      return sock.sendMessage(from, { text: '👑 تمت الترقية!', mentions: [user] });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // تنزيل مشرف
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تنزيل', 'demote'].includes(command)) {
      if (!isAdmin || !isBotAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين فقط!' });

      let user = quoted?.mentionedJid?.[0] || (args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
      if (!user) return sock.sendMessage(from, { text: '❌ أشر للشخص!' });

      await sock.groupParticipantsUpdate(from, [user], 'demote');
      return sock.sendMessage(from, { text: '📉 تم التنزيل!', mentions: [user] });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // تحذير عضو
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تحذير', 'warn'].includes(command)) {
      if (!isAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين فقط!' });

      let user = quoted?.mentionedJid?.[0] || (args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
      if (!user) return sock.sendMessage(from, { text: '❌ أشر للشخص!' });

      const reason = args.slice(1).join(' ') || 'لا يوجد سبب';

      // تسجيل التحذير
      if (!db.groups[from].warnings[user]) {
        db.groups[from].warnings[user] = [];
      }

      db.groups[from].warnings[user].push({
        reason,
        by: sender,
        at: Date.now()
      });

      const warnCount = db.groups[from].warnings[user].length;
      const maxWarns = 3;

      saveDatabase();

      if (warnCount >= maxWarns) {
        // طرد تلقائي بعد 3 تحذيرات
        if (isBotAdmin) {
          await sock.groupParticipantsUpdate(from, [user], 'remove');
          db.groups[from].warnings[user] = [];
          saveDatabase();
          return sock.sendMessage(from, {
            text: `⚠️ تحذير ${warnCount}/${maxWarns}!\n\n🚫 تم طرد العضو بسبب تجاوز الحد!`,
            mentions: [user]
          });
        }
      }

      return sock.sendMessage(from, {
        text: `⚠️ تحذير ${warnCount}/${maxWarns}\n\n👤 المستخدم: @${user.split('@')[0]}\n📝 السبب: ${reason}\n\n⚠️ بعد 3 تحذيرات سيُطرد تلقائياً!`,
        mentions: [user]
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // عرض التحذيرات
    // ═══════════════════════════════════════════════════════════════════════════
    if (['التحذيرات', 'warnings'].includes(command)) {
      let user = quoted?.mentionedJid?.[0] || (args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net') || sender;

      const warnings = db.groups[from].warnings[user] || [];

      if (warnings.length === 0) {
        return sock.sendMessage(from, {
          text: `✅ لا توجد تحذيرات!\n\n👤 @${user.split('@')[0]}`,
          mentions: [user]
        });
      }

      let msg = `⚠️ التحذيرات (${warnings.length}/3):\n\n`;
      warnings.forEach((w, i) => {
        const date = new Date(w.at).toLocaleDateString('ar');
        msg += `${i + 1}. ${w.reason}\n   📅 ${date}\n\n`;
      });

      return sock.sendMessage(from, { text: msg, mentions: [user] });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // محو التحذيرات
    // ═══════════════════════════════════════════════════════════════════════════
    if (['محو', 'clearwarn'].includes(command)) {
      if (!isAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين فقط!' });

      let user = quoted?.mentionedJid?.[0] || (args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
      if (!user) return sock.sendMessage(from, { text: '❌ أشر للشخص!' });

      db.groups[from].warnings[user] = [];
      saveDatabase();

      return sock.sendMessage(from, {
        text: `✅ تم محو جميع التحذيرات!\n\n👤 @${user.split('@')[0]}`,
        mentions: [user]
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // حذف رسالة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['حذف', 'delete', 'del'].includes(command)) {
      if (!isAdmin && !isBotAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين فقط!' });

      if (!quoted) return sock.sendMessage(from, { text: '❌ رد على رسالة لحذفها!' });

      try {
        await sock.sendMessage(from, { delete: quoted.key });
      } catch {
        return sock.sendMessage(from, { text: '❌ لا يمكن حذف الرسالة!' });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // وضع القواعد
    // ═══════════════════════════════════════════════════════════════════════════
    if (['وضع_قواعد', 'setrules'].includes(command)) {
      if (!isAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين فقط!' });

      const rules = args.join(' ');
      if (!rules) return sock.sendMessage(from, { text: '❌ اكتب القواعد!' });

      db.groups[from].rules = rules;
      saveDatabase();

      return sock.sendMessage(from, { text: '✅ تم حفظ القواعد!' });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // عرض القواعد
    // ═══════════════════════════════════════════════════════════════════════════
    if (['القواعد', 'rules'].includes(command)) {
      const rules = db.groups[from].rules;

      if (!rules) {
        return sock.sendMessage(from, { text: '❌ لم يتم وضع قواعد بعد!\n💡 المشرف يمكنه استخدام .وضع_قواعد <القواعد>' });
      }

      return sock.sendMessage(from, {
        text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

📜 • • ✤ قواعد المجموعة ✤ • • 📜

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
${rules}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`
      });
    }
  }
};
