// ═══════════════════════════════════════════════════════════════════════════════
// 👥 أوامر الإدارة والمجموعات - فاطمة بوت v13.0 (محدث)
// ═══════════════════════════════════════════════════════════════════════════════

import { getDatabase, saveDatabase } from '../lib/database.mjs';

// دالة مساعدة لتأخير التنفيذ (للمنشنات المتعددة)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// التحقق من أن البوت مشرف في المجموعة
async function isBotAdmin(sock, groupId) {
  try {
    const metadata = await sock.groupMetadata(groupId);
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const botParticipant = metadata.participants.find(p => p.id === botId);
    return botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
  } catch {
    return false;
  }
}

// التحقق من أن المستخدم مشرف في المجموعة
function isUserAdmin(groupMetadata, userId) {
  const participant = groupMetadata.participants.find(p => p.id === userId);
  return participant?.admin === 'admin' || participant?.admin === 'superadmin';
}

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
    const { from, sender, command, args, text, prefix, isGroup, isGroupAdmin, groupMetadata, quoted, isOwner } = ctx;
    
    if (!isGroup) {
      return sock.sendMessage(from, { text: '❌ هذا الأمر يعمل في المجموعات فقط!' });
    }

    // التحقق من وجود groupMetadata
    if (!groupMetadata) {
      return sock.sendMessage(from, { text: '❌ لا يمكن جلب بيانات المجموعة. حاول مرة أخرى.' });
    }

    const db = getDatabase();
    if (!db.groups) db.groups = {};
    if (!db.groups[from]) db.groups[from] = { warnings: {}, settings: {}, lastWarnBy: {} };
    
    const group = db.groups[from];

    // ═════════════════════════════════════════════════════════════════════════
    // منشن علني (مقسم للمجموعات الكبيرة)
    // ═════════════════════════════════════════════════════════════════════════
    if (['منشن', 'tagall'].includes(command)) {
      if (!isGroupAdmin && !isOwner) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const participants = groupMetadata.participants || [];
      if (participants.length === 0) {
        return sock.sendMessage(from, { text: '❌ لا يوجد أعضاء في المجموعة!' });
      }

      const message = text || '📢 منشن عام';
      const mentions = participants.map(p => p.id);
      const chunkSize = 100;
      const chunks = [];

      for (let i = 0; i < mentions.length; i += chunkSize) {
        chunks.push(mentions.slice(i, i + chunkSize));
      }

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const mentionText = chunk.map(id => `@${id.split('@')[0]}`).join(' ');
        const fullText = i === 0 ? `${message}\n\n${mentionText}` : mentionText;
        await sock.sendMessage(from, { text: fullText, mentions: chunk });
        if (i < chunks.length - 1) await delay(1000);
      }
      return;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // منشن مخفي (مقسم أيضاً)
    // ═════════════════════════════════════════════════════════════════════════
    if (['مخفي', 'hidemention'].includes(command)) {
      if (!isGroupAdmin && !isOwner) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const participants = groupMetadata.participants || [];
      if (participants.length === 0) {
        return sock.sendMessage(from, { text: '❌ لا يوجد أعضاء في المجموعة!' });
      }

      const message = text || '📢 منشن مخفي';
      const mentions = participants.map(p => p.id);
      const chunkSize = 100;
      const chunks = [];

      for (let i = 0; i < mentions.length; i += chunkSize) {
        chunks.push(mentions.slice(i, i + chunkSize));
      }

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const fullText = i === 0 ? message : `... (${i+1}/${chunks.length})`;
        await sock.sendMessage(from, { text: fullText, mentions: chunk });
        if (i < chunks.length - 1) await delay(1000);
      }
      return;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // إنذار
    // ═════════════════════════════════════════════════════════════════════════
    if (['إنذار', 'warn'].includes(command)) {
      if (!isGroupAdmin && !isOwner) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      // التهدئة
      const now = Date.now();
      const lastWarn = group.lastWarnBy?.[sender] || 0;
      if (now - lastWarn < 10 * 60 * 1000 && !isOwner) {
        const remaining = Math.ceil((10 * 60 * 1000 - (now - lastWarn)) / 60000);
        return sock.sendMessage(from, { text: `⏰ انتظر ${remaining} دقيقة قبل إنذار جديد` });
      }

      const targetId = quoted?.mentionedJid?.[0];
      if (!targetId) {
        return sock.sendMessage(from, { text: '❌ أشر للشخص (رد على رسالته مع منشن)!' });
      }

      // التحقق من أن المستهدف عضو في المجموعة
      if (!groupMetadata.participants.some(p => p.id === targetId)) {
        return sock.sendMessage(from, { text: '❌ هذا العضو غير موجود في المجموعة!' });
      }

      // منع إنذار المشرفين (إلا إذا كان المالك)
      if (isUserAdmin(groupMetadata, targetId) && !isOwner) {
        return sock.sendMessage(from, { text: '❌ لا يمكن إنذار مشرف!' });
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
        const botAdmin = await isBotAdmin(sock, from);
        if (!botAdmin) {
          return sock.sendMessage(from, { text: '⚠️ البوت ليس مشرفاً، لا يمكن طرد العضو تلقائياً!' });
        }
        try {
          await sock.groupParticipantsUpdate(from, [targetId], 'remove');
          delete group.warnings[targetId];
          saveDatabase();
          return sock.sendMessage(from, {
            text: `🚨 تم طرد @${targetId.split('@')[0]} بسبب 3 إنذارات!`,
            mentions: [targetId]
          });
        } catch (e) {
          return sock.sendMessage(from, { text: '❌ فشل طرد العضو! تأكد من صلاحيات البوت.' });
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
    // الإنذارات (عرض)
    // ═════════════════════════════════════════════════════════════════════════
    if (['الإنذارات', 'warnings'].includes(command)) {
      const targetId = quoted?.mentionedJid?.[0] || sender;
      
      // فقط المشرفون يمكنهم رؤية إنذارات الآخرين
      if (targetId !== sender && !isGroupAdmin && !isOwner) {
        return sock.sendMessage(from, { text: '❌ فقط المشرفون يمكنهم رؤية إنذارات الآخرين!' });
      }

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
    // عفو (مسح الإنذارات)
    // ═════════════════════════════════════════════════════════════════════════
    if (['عفو', 'pardon'].includes(command)) {
      if (!isGroupAdmin && !isOwner) {
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
      if (!isGroupAdmin && !isOwner) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const targetId = quoted?.mentionedJid?.[0];
      if (!targetId) {
        return sock.sendMessage(from, { text: '❌ أشر للشخص!' });
      }

      // منع طرد البوت نفسه
      const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      if (targetId === botId) {
        return sock.sendMessage(from, { text: '❌ لا يمكنك طرد البوت!' });
      }

      // منع طرد المشرفين (إلا إذا كان المالك)
      if (isUserAdmin(groupMetadata, targetId) && !isOwner) {
        return sock.sendMessage(from, { text: '❌ لا يمكن طرد مشرف!' });
      }

      const botAdmin = await isBotAdmin(sock, from);
      if (!botAdmin) {
        return sock.sendMessage(from, { text: '❌ البوت ليس مشرفاً! لا يمكنه طرد الأعضاء.' });
      }

      try {
        await sock.groupParticipantsUpdate(from, [targetId], 'remove');
        return sock.sendMessage(from, {
          text: `✅ تم طرد @${targetId.split('@')[0]}`,
          mentions: [targetId]
        });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ فشل في الطرد! تأكد من صلاحيات البوت.' });
      }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // ترقية
    // ═════════════════════════════════════════════════════════════════════════
    if (['ترقية', 'promote'].includes(command)) {
      if (!isGroupAdmin && !isOwner) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const targetId = quoted?.mentionedJid?.[0];
      if (!targetId) {
        return sock.sendMessage(from, { text: '❌ أشر للشخص!' });
      }

      const botAdmin = await isBotAdmin(sock, from);
      if (!botAdmin) {
        return sock.sendMessage(from, { text: '❌ البوت ليس مشرفاً! لا يمكنه ترقية الأعضاء.' });
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
      if (!isGroupAdmin && !isOwner) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const targetId = quoted?.mentionedJid?.[0];
      if (!targetId) {
        return sock.sendMessage(from, { text: '❌ أشر للشخص!' });
      }

      const botAdmin = await isBotAdmin(sock, from);
      if (!botAdmin) {
        return sock.sendMessage(from, { text: '❌ البوت ليس مشرفاً! لا يمكنه تنزيل الأعضاء.' });
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
      if (!isGroupAdmin && !isOwner) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const quotedMsg = quoted?.stanzaId;
      const quotedParticipant = quoted?.participant;
      const quotedTimestamp = quoted?.messageTimestamp;

      if (!quotedMsg) {
        return sock.sendMessage(from, { text: '❌ رد على رسالة لحذفها!' });
      }

      // التحقق من عمر الرسالة (حد 24 ساعة)
      if (quotedTimestamp && (Date.now() / 1000 - quotedTimestamp) > 86400) {
        return sock.sendMessage(from, { text: '❌ لا يمكن حذف رسائل أقدم من 24 ساعة!' });
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
        return sock.sendMessage(from, { text: '❌ فشل في الحذف! قد لا أملك الصلاحية أو الرسالة قديمة جداً.' });
      }
      return;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // القواعد
    // ═════════════════════════════════════════════════════════════════════════
    if (['القواعد', 'rules'].includes(command)) {
      const rules = group.settings?.rules || '❌ لم يتم تعيين قواعد بعد!';
      return sock.sendMessage(from, {
        text: `📋 قواعد المجموعة:\n\n${rules}\n\n💡 ${prefix}وضع_قواعد <القواعد> لتعيينها`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // وضع قواعد
    // ═════════════════════════════════════════════════════════════════════════
    if (['وضع_قواعد', 'setrules'].includes(command)) {
      if (!isGroupAdmin && !isOwner) {
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
      if (!isGroupAdmin && !isOwner) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const botAdmin = await isBotAdmin(sock, from);
      if (!botAdmin) {
        return sock.sendMessage(from, { text: '❌ البوت ليس مشرفاً! لا يمكنه فتح المجموعة.' });
      }

      try {
        await sock.groupSettingUpdate(from, 'not_announcement');
        return sock.sendMessage(from, { text: '✅ تم فتح المجموعة!' });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ فشل في فتح المجموعة!' });
      }
    }

    if (['إغلاق', 'close'].includes(command)) {
      if (!isGroupAdmin && !isOwner) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const botAdmin = await isBotAdmin(sock, from);
      if (!botAdmin) {
        return sock.sendMessage(from, { text: '❌ البوت ليس مشرفاً! لا يمكنه إغلاق المجموعة.' });
      }

      try {
        await sock.groupSettingUpdate(from, 'announcement');
        return sock.sendMessage(from, { text: '✅ تم إغلاق المجموعة!' });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ فشل في إغلاق المجموعة!' });
      }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // تغيير اسم المجموعة
    // ═════════════════════════════════════════════════════════════════════════
    if (['تغيير_اسم', 'setname'].includes(command)) {
      if (!isGroupAdmin && !isOwner) {
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
        return sock.sendMessage(from, { text: '❌ فشل في تغيير الاسم!' });
      }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // تغيير وصف المجموعة
    // ═════════════════════════════════════════════════════════════════════════
    if (['تغيير_وصف', 'setdesc'].includes(command)) {
      if (!isGroupAdmin && !isOwner) {
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
        return sock.sendMessage(from, { text: '❌ فشل في تغيير الوصف!' });
      }
    }
  }
};
