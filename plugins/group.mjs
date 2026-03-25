// ═══════════════════════════════════════════════════════════════════════════════
// 👥 أوامر الإدارة والمجموعات - فاطمة بوت v13.0
// ═══════════════════════════════════════════════════════════════════════════════

import { getDatabase, saveDatabase } from '../lib/database.mjs';

export default {
  name: 'Admin',
  commands: [
    'منشن', 'tagall',
    'مخفي', 'hidemention',
    'إنذار', 'warn',
    'الإنذارات', 'warnings',
    'عفو', 'pardon',
    'طرد', 'kick',
    'ترقية', 'promote',
    'تنزيل', 'demote',
    'حذف', 'delete',
    'القواعد', 'rules',
    'وضع_قواعد', 'setrules',
    'فتح', 'open',
    'إغلاق', 'close',
    'تغيير_اسم', 'setname',
    'تغيير_وصف', 'setdesc'
  ],

  async execute(sock, msg, ctx) {
    const { from, sender, command, args, text, prefix, isGroup, isGroupAdmin, groupMetadata, quoted } = ctx;
    
    if (!isGroup) {
      return sock.sendMessage(from, { text: '❌ هذا الأمر يعمل في المجموعات فقط!' });
    }

    const db = getDatabase();
    if (!db.groups) db.groups = {};
    if (!db.groups[from]) db.groups[from] = { warnings: {}, settings: {} };
    
    const group = db.groups[from];

    // ═════════════════════════════════════════════════════════════════════════
    // منشن علني
    // ═════════════════════════════════════════════════════════════════════════
    if (['منشن', 'tagall'].includes(command)) {
      if (!isGroupAdmin) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const participants = groupMetadata?.participants || [];
      const mentions = participants.map(p => p.id);
      const message = text || '📢 منشن عام';

      return sock.sendMessage(from, {
        text: `${message}\n\n${participants.map(p => `@${p.id.split('@')[0]}`).join(' ')}`,
        mentions
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // منشن مخفي
    // ═════════════════════════════════════════════════════════════════════════
    if (['مخفي', 'hidemention'].includes(command)) {
      if (!isGroupAdmin) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const participants = groupMetadata?.participants || [];
      const mentions = participants.map(p => p.id);
      const message = text || '📢 منشن مخفي';

      return sock.sendMessage(from, {
        text: message,
        mentions
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // إنذار
    // ═════════════════════════════════════════════════════════════════════════
    if (['إنذار', 'warn'].includes(command)) {
      if (!isGroupAdmin) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      // التحقق من التهدئة (10 دقائق لكل مشرف)
      const now = Date.now();
      const lastWarn = group.lastWarnBy?.[sender] || 0;
      
      if (now - lastWarn < 10 * 60 * 1000) {
        const remaining = Math.ceil((10 * 60 * 1000 - (now - lastWarn)) / 60000);
        return sock.sendMessage(from, { text: `⏰ انتظر ${remaining} دقيقة قبل إنذار جديد` });
      }

      const targetId = quoted?.mentionedJid?.[0];
      if (!targetId) {
        return sock.sendMessage(from, { text: '❌ أشر للشخص!' });
      }

      const reason = args.slice(1).join(' ') || 'لم يُحدد سبب';
      
      if (!group.warnings) group.warnings = {};
      if (!group.warnings[targetId]) group.warnings[targetId] = [];
      
      group.warnings[targetId].push({
        reason,
        by: sender,
        date: now
      });

      group.lastWarnBy = group.lastWarnBy || {};
      group.lastWarnBy[sender] = now;
      
      saveDatabase();

      const warnCount = group.warnings[targetId].length;
      
      // طرد تلقائي عند 3 إنذارات
      if (warnCount >= 3) {
        try {
          await sock.groupParticipantsUpdate(from, [targetId], 'remove');
          delete group.warnings[targetId];
          saveDatabase();
          
          return sock.sendMessage(from, {
            text: `🚨 تم طرد @${targetId.split('@')[0]} بسبب 3 إنذارات!`,
            mentions: [targetId]
          });
        } catch (e) {
          // إذا فشل الطرد
        }
      }

      return sock.sendMessage(from, {
        text: `⚠️ إنذار لـ @${targetId.split('@')[0]}

📝 السبب: ${reason}
📊 عدد الإنذارات: ${warnCount}/3`,
        mentions: [targetId]
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // الإنذارات
    // ═════════════════════════════════════════════════════════════════════════
    if (['الإنذارات', 'warnings'].includes(command)) {
      const targetId = quoted?.mentionedJid?.[0] || sender;
      const warnings = group.warnings?.[targetId] || [];

      if (warnings.length === 0) {
        return sock.sendMessage(from, { text: '✅ لا توجد إنذارات!' });
      }

      const list = warnings.map((w, i) => 
        `${i + 1}. ${w.reason}\n   📅 <t:${Math.floor(w.date / 1000)}:R>`
      ).join('\n\n');

      return sock.sendMessage(from, {
        text: `⚠️ الإنذارات (@${targetId.split('@')[0]}):

${list}

📊 المجموع: ${warnings.length}/3`,
        mentions: [targetId]
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // عفو
    // ═════════════════════════════════════════════════════════════════════════
    if (['عفو', 'pardon'].includes(command)) {
      if (!isGroupAdmin) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const targetId = quoted?.mentionedJid?.[0];
      if (!targetId) {
        return sock.sendMessage(from, { text: '❌ أشر للشخص!' });
      }

      if (!group.warnings?.[targetId]?.length) {
        return sock.sendMessage(from, { text: '❌ لا يوجد إنذارات لهذا الشخص!' });
      }

      delete group.warnings[targetId];
      saveDatabase();

      return sock.sendMessage(from, {
        text: `✅ تم مسح جميع إنذارات @${targetId.split('@')[0]}!`,
        mentions: [targetId]
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // طرد
    // ═════════════════════════════════════════════════════════════════════════
    if (['طرد', 'kick'].includes(command)) {
      if (!isGroupAdmin) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const targetId = quoted?.mentionedJid?.[0];
      if (!targetId) {
        return sock.sendMessage(from, { text: '❌ أشر للشخص!' });
      }

      try {
        await sock.groupParticipantsUpdate(from, [targetId], 'remove');
        return sock.sendMessage(from, {
          text: `✅ تم طرد @${targetId.split('@')[0]}`,
          mentions: [targetId]
        });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ فشل في الطرد! قد لا أملك الصلاحية.' });
      }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // ترقية
    // ═════════════════════════════════════════════════════════════════════════
    if (['ترقية', 'promote'].includes(command)) {
      if (!isGroupAdmin) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const targetId = quoted?.mentionedJid?.[0];
      if (!targetId) {
        return sock.sendMessage(from, { text: '❌ أشر للشخص!' });
      }

      try {
        await sock.groupParticipantsUpdate(from, [targetId], 'promote');
        return sock.sendMessage(from, {
          text: `✅ تم ترقية @${targetId.split('@')[0]} إلى مشرف`,
          mentions: [targetId]
        });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ فشل في الترقية!' });
      }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // تنزيل
    // ═════════════════════════════════════════════════════════════════════════
    if (['تنزيل', 'demote'].includes(command)) {
      if (!isGroupAdmin) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const targetId = quoted?.mentionedJid?.[0];
      if (!targetId) {
        return sock.sendMessage(from, { text: '❌ أشر للشخص!' });
      }

      try {
        await sock.groupParticipantsUpdate(from, [targetId], 'demote');
        return sock.sendMessage(from, {
          text: `✅ تم تنزيل @${targetId.split('@')[0]} إلى عضو`,
          mentions: [targetId]
        });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ فشل في التنزيل!' });
      }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // حذف رسالة
    // ═════════════════════════════════════════════════════════════════════════
    if (['حذف', 'delete'].includes(command)) {
      if (!isGroupAdmin) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const quotedMsg = quoted?.stanzaId;
      const quotedParticipant = quoted?.participant;

      if (!quotedMsg) {
        return sock.sendMessage(from, { text: '❌ رد على رسالة لحذفها!' });
      }

      try {
        await sock.sendMessage(from, {
          delete: {
            remoteJid: from,
            fromMe: false,
            id: quotedMsg,
            participant: quotedParticipant
          }
        });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ فشل في الحذف!' });
      }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // القواعد
    // ═════════════════════════════════════════════════════════════════════════
    if (['القواعد', 'rules'].includes(command)) {
      const rules = group.settings?.rules || '❌ لم يتم تعيين قواعد بعد!';
      
      return sock.sendMessage(from, {
        text: `📋 قواعد المجموعة:

${rules}

💡 ${prefix}وضع_قواعد <القواعد> لتعيينها`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // وضع قواعد
    // ═════════════════════════════════════════════════════════════════════════
    if (['وضع_قواعد', 'setrules'].includes(command)) {
      if (!isGroupAdmin) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const rules = text;
      if (!rules) {
        return sock.sendMessage(from, { text: '❌ اكتب القواعد!' });
      }

      group.settings = group.settings || {};
      group.settings.rules = rules;
      saveDatabase();

      return sock.sendMessage(from, { text: '✅ تم تعيين القواعد!' });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // فتح/إغلاق المجموعة
    // ═════════════════════════════════════════════════════════════════════════
    if (['فتح', 'open'].includes(command)) {
      if (!isGroupAdmin) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      try {
        await sock.groupSettingUpdate(from, 'not_announcement');
        return sock.sendMessage(from, { text: '✅ تم فتح المجموعة!' });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ فشل!' });
      }
    }

    if (['إغلاق', 'close'].includes(command)) {
      if (!isGroupAdmin) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      try {
        await sock.groupSettingUpdate(from, 'announcement');
        return sock.sendMessage(from, { text: '✅ تم إغلاق المجموعة!' });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ فشل!' });
      }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // تغيير اسم المجموعة
    // ═════════════════════════════════════════════════════════════════════════
    if (['تغيير_اسم', 'setname'].includes(command)) {
      if (!isGroupAdmin) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const name = text;
      if (!name) {
        return sock.sendMessage(from, { text: '❌ اكتب الاسم الجديد!' });
      }

      try {
        await sock.groupUpdateSubject(from, name);
        return sock.sendMessage(from, { text: '✅ تم تغيير الاسم!' });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ فشل!' });
      }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // تغيير وصف المجموعة
    // ═════════════════════════════════════════════════════════════════════════
    if (['تغيير_وصف', 'setdesc'].includes(command)) {
      if (!isGroupAdmin) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const desc = text;
      if (!desc) {
        return sock.sendMessage(from, { text: '❌ اكتب الوصف الجديد!' });
      }

      try {
        await sock.groupUpdateDescription(from, desc);
        return sock.sendMessage(from, { text: '✅ تم تغيير الوصف!' });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ فشل!' });
      }
    }
  }
};
