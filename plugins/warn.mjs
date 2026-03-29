// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ نظام الإنذارات والإدارة - فاطمة بوت v12.0 (محدث)
// ═══════════════════════════════════════════════════════════════════════════════

import { getDatabase, saveDatabase } from '../lib/database.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 تخزين الإنذارات (في الذاكرة للتتبع السريع)
// ═══════════════════════════════════════════════════════════════════════════════

const warningCooldowns = new Map(); // منع إساءة استخدام الإنذارات

// ═══════════════════════════════════════════════════════════════════════════════
// 🧩 دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * استخراج معرف المستهدف من الرسالة (منشن أو رد)
 * @param {Object} ctx - سياق الأمر
 * @param {Object} msg - رسالة واتساب
 * @param {Object} quoted - الرسالة المقتبسة (إن وجدت)
 * @param {Array} args - وسائط الأمر
 * @returns {string|null} معرف المستهدف أو null
 */
function getTargetFromContext(ctx, msg, quoted, args) {
  // 1. من الرسالة المقتبسة
  if (quoted?.mentionedJid?.length > 0) {
    return quoted.mentionedJid[0];
  }
  // 2. من منشن مباشر في الرسالة الحالية
  if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
    return msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
  }
  // 3. من @ في النص (أول وسيط)
  if (args[0]?.startsWith('@')) {
    const num = args[0].replace('@', '').replace(/\D/g, '');
    if (num) return num + '@s.whatsapp.net';
  }
  return null;
}

/**
 * التحقق من أن المستخدم هو مشرف في المجموعة
 * @param {Object} sock - كائن الـ socket
 * @param {string} groupId - معرف المجموعة
 * @param {string} userId - معرف المستخدم
 * @returns {Promise<boolean>}
 */
async function isAdminInGroup(sock, groupId, userId) {
  try {
    const groupMetadata = await sock.groupMetadata(groupId);
    const participant = groupMetadata.participants?.find(p => p.id === userId);
    return participant?.admin === 'admin' || participant?.admin === 'superadmin';
  } catch {
    return false;
  }
}

/**
 * تقسيم قائمة المستخدمين إلى أجزاء بحجم محدد (للتغلب على حد 100 منشن)
 * @param {Array} mentions - قائمة المعرفات
 * @param {number} chunkSize - حجم الجزء (الافتراضي 100)
 * @returns {Array<Array>}
 */
function chunkArray(mentions, chunkSize = 100) {
  const chunks = [];
  for (let i = 0; i < mentions.length; i += chunkSize) {
    chunks.push(mentions.slice(i, i + chunkSize));
  }
  return chunks;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 تصدير جميع الأوامر
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  name: 'Warning System',
  commands: [
    'إنذار', 'انذار', 'warn', 'تحذير',
    'إنذارات', 'انذارات', 'warnings', 'الإنذارات',
    'عفو', 'pardon', 'مسح_إنذار', 'صفح',
    'منشن', 'mention', 'الجميع', 'everyone', 'هيت',
    'مخفي', 'hidden', 'منشن_مخفي', 'هيدن'
  ],

  async execute(sock, msg, ctx) {
    const { from, sender, isGroup, isGroupAdmin, isOwner, args, text, quoted } = ctx;
    const command = ctx.command;
    const db = getDatabase();

    // ═══════════════════════════════════════════════════════════════════════════
    // أمر الإنذار
    // ═══════════════════════════════════════════════════════════════════════════
    if (['إنذار', 'انذار', 'warn', 'تحذير'].includes(command)) {
      if (!isGroup) {
        return await sock.sendMessage(from, { text: '❌ هذا الأمر يعمل في المجموعات فقط!' });
      }

      if (!isGroupAdmin && !isOwner) {
        return await sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      // الحصول على المستهدف
      const targetId = getTargetFromContext(ctx, msg, quoted, args);
      if (!targetId) {
        return await sock.sendMessage(from, { text: '❌ يجب أن تمنشن الشخص!\nمثال: .إنذار @شخص سبب' });
      }

      // جلب بيانات المجموعة للتحقق من العضوية والصلاحيات
      const groupMetadata = await sock.groupMetadata(from);
      const targetParticipant = groupMetadata.participants?.find(p => p.id === targetId);
      
      // التحقق من أن المستهدف عضو في المجموعة
      if (!targetParticipant) {
        return await sock.sendMessage(from, { text: '❌ هذا العضو غير موجود في المجموعة!' });
      }

      // التحقق من أن المستهدف ليس مشرفًا (إلا للمطور)
      const isTargetAdmin = targetParticipant.admin === 'admin' || targetParticipant.admin === 'superadmin';
      if (isTargetAdmin && !isOwner) {
        return await sock.sendMessage(from, { text: '❌ لا يمكنك إنذار المشرفين!' });
      }

      // التحقق من cooldown (10 دقائق)
      const cooldownKey = `${sender}_${targetId}_${from}`;
      const lastWarning = warningCooldowns.get(cooldownKey);
      const now = Date.now();
      
      if (lastWarning && (now - lastWarning) < 10 * 60 * 1000) {
        const remaining = Math.ceil((10 * 60 * 1000 - (now - lastWarning)) / 60000);
        return await sock.sendMessage(from, { text: `⏰ انتظر ${remaining} دقيقة قبل إعطاء إنذار آخر لهذا الشخص!` });
      }

      // السبب
      const reason = args.slice(1).join(' ') || 'لم يُذكر';

      // تسجيل الإنذار
      db.warnings = db.warnings || {};
      db.warnings[from] = db.warnings[from] || {};
      db.warnings[from][targetId] = db.warnings[from][targetId] || { count: 0, history: [], bannedAt: null };

      const warningData = db.warnings[from][targetId];
      warningData.count++;
      warningData.history.push({
        reason,
        by: sender,
        byName: ctx.pushName,
        date: now
      });

      // تحديث الـ cooldown
      warningCooldowns.set(cooldownKey, now);
      saveDatabase();

      const warningCount = warningData.count;
      let message = `⚠️ ═══════ إنذار ═══════ ⚠️\n\n`;
      message += `👤 العضو: @${targetId.split('@')[0]}\n`;
      message += `📝 السبب: ${reason}\n`;
      message += `📊 عدد الإنذارات: ${warningCount}/3\n`;
      message += `👮 بواسطة: ${ctx.pushName}\n`;

      // إجراءات تلقائية
      if (warningCount >= 3) {
        // محاولة الطرد
        try {
          await sock.groupParticipantsUpdate(from, [targetId], 'remove');
          message += `\n🚪 تم طرد العضو لبلوغ 3 إنذارات!`;
          // إعادة تعيين الإنذارات فقط بعد الطرد الناجح
          warningData.count = 0;
          warningData.bannedAt = Date.now(); // تسجيل تاريخ الطرد
          saveDatabase();
        } catch (e) {
          message += `\n⚠️ فشل طرد العضو! تأكد من صلاحيات البوت (مشرف).`;
          // لا نعيد التعيين حتى لا يفقد السجل
        }
      } else if (warningCount === 2) {
        message += `\n⚠️ تحذير أخير! إنذار واحد ويُطرد!`;
      }

      await sock.sendMessage(from, { 
        text: message, 
        mentions: [targetId] 
      });
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // أمر عرض الإنذارات
    // ═══════════════════════════════════════════════════════════════════════════
    if (['إنذارات', 'انذارات', 'warnings', 'الإنذارات'].includes(command)) {
      if (!isGroup) {
        return await sock.sendMessage(from, { text: '❌ هذا الأمر يعمل في المجموعات فقط!' });
      }

      if (!isGroupAdmin && !isOwner) {
        return await sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const groupWarnings = db.warnings?.[from];

      if (!groupWarnings || Object.keys(groupWarnings).length === 0) {
        return await sock.sendMessage(from, { text: '✅ لا توجد إنذارات في هذه المجموعة!' });
      }

      let text = `📋 ═══════ إنذارات المجموعة ═══════ 📋\n\n`;
      const mentions = [];
      for (const [userId, data] of Object.entries(groupWarnings)) {
        if (data.count > 0) {
          text += `👤 @${userId.split('@')[0]}: ${data.count}/3 إنذارات\n`;
          if (data.history.length) {
            const last = data.history[data.history.length - 1];
            text += `   آخر سبب: ${last.reason} (بواسطة ${last.byName || last.by.split('@')[0]})\n`;
          }
          if (data.bannedAt) {
            text += `   🚫 طرد سابق في ${new Date(data.bannedAt).toLocaleDateString()}\n`;
          }
          text += `\n`;
          mentions.push(userId);
        }
      }

      await sock.sendMessage(from, { text, mentions });
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // أمر العفو (مسح الإنذارات)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['عفو', 'pardon', 'مسح_إنذار', 'صفح'].includes(command)) {
      if (!isGroup) {
        return await sock.sendMessage(from, { text: '❌ هذا الأمر يعمل في المجموعات فقط!' });
      }

      if (!isGroupAdmin && !isOwner) {
        return await sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const targetId = getTargetFromContext(ctx, msg, quoted, args);
      if (!targetId) {
        return await sock.sendMessage(from, { text: '❌ يجب أن تمنشن الشخص!' });
      }

      // التحقق من وجود الإنذارات
      if (!db.warnings?.[from]?.[targetId]) {
        return await sock.sendMessage(from, { text: '✅ هذا العضو لا يملك إنذارات!' });
      }

      const warningData = db.warnings[from][targetId];
      const count = warningData.count;
      
      // مسح الإنذارات مع الاحتفاظ بسجل الطرد إن وجد (اختياري)
      db.warnings[from][targetId] = { count: 0, history: [], bannedAt: warningData.bannedAt };
      saveDatabase();

      await sock.sendMessage(from, { 
        text: `✅ تم العفو عن @${targetId.split('@')[0]} ومسح ${count} إنذارات!`,
        mentions: [targetId]
      });
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // أمر المنشن العادي
    // ═══════════════════════════════════════════════════════════════════════════
    if (['منشن', 'mention', 'الجميع', 'everyone', 'هيت'].includes(command)) {
      if (!isGroup) {
        return await sock.sendMessage(from, { text: '❌ هذا الأمر يعمل في المجموعات فقط!' });
      }

      if (!isGroupAdmin && !isOwner) {
        return await sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants || [];
      if (!participants.length) {
        return await sock.sendMessage(from, { text: '❌ لا يمكن جلب أعضاء المجموعة!' });
      }

      const customText = args.length > 0 ? args.join(' ') : '📢 تم منشن الجميع!';
      const allMentions = participants.map(p => p.id);

      // تقسيم المنشن بسبب حد 100 منشن
      const chunks = chunkArray(allMentions, 100);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        let message = `📢 ═══════ إعلان ═══════ 📢\n\n`;
        message += customText + '\n\n';
        if (chunks.length > 1) {
          message += `(الجزء ${i+1}/${chunks.length})\n`;
        }
        message += `👥 عدد الأعضاء المُنشَن: ${chunk.length}`;
        
        await sock.sendMessage(from, { text: message, mentions: chunk });
        // تأخير بسيط بين الأجزاء لتجنب الحظر
        if (chunks.length > 1 && i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // أمر المنشن المخفي (لا يظهر النص مع الأسماء)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['مخفي', 'hidden', 'منشن_مخفي', 'هيدن'].includes(command)) {
      if (!isGroup) {
        return await sock.sendMessage(from, { text: '❌ هذا الأمر يعمل في المجموعات فقط!' });
      }

      if (!isGroupAdmin && !isOwner) {
        return await sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants || [];
      if (!participants.length) {
        return await sock.sendMessage(from, { text: '❌ لا يمكن جلب أعضاء المجموعة!' });
      }

      const customText = args.length > 0 ? args.join(' ') : '👋';
      const allMentions = participants.map(p => p.id);

      const chunks = chunkArray(allMentions, 100);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        let text = customText;
        if (chunks.length > 1) {
          text += ` (${i+1}/${chunks.length})`;
        }
        await sock.sendMessage(from, { text, mentions: chunk });
        if (chunks.length > 1 && i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      return;
    }
  }
};
