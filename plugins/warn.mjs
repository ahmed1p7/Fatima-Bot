// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ نظام الإنذارات والإدارة - فاطمة بوت v12.0
// ═══════════════════════════════════════════════════════════════════════════════

import { getDatabase, saveDatabase } from '../lib/database.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 تخزين الإنذارات (في الذاكرة للتتبع السريع)
// ═══════════════════════════════════════════════════════════════════════════════

const warningCooldowns = new Map(); // منع إساءة استخدام الإنذارات

// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 تصدير جميع الأوامر
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  name: 'Warning System',
  commands: ['إنذار', 'انذار', 'warn', 'تحذير', 'إنذارات', 'انذارات', 'warnings', 'الإنذارات', 'عفو', 'pardon', 'مسح_إنذار', 'صفح', 'منشن', 'mention', 'الجميع', 'everyone', 'هيت', 'مخفي', 'hidden', 'منشن_مخفي', 'هيدن'],

  async execute(sock, msg, ctx) {
    const { from, sender, isGroup, isGroupAdmin, isOwner, args, text, quoted } = ctx;
    const command = ctx.command;

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
      let targetId = null;
      let targetName = '';

      if (quoted?.mentionedJid?.length > 0) {
        targetId = quoted.mentionedJid[0];
      } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        targetId = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (args[0]?.startsWith('@')) {
        const num = args[0].replace('@', '').replace(/\D/g, '');
        if (num) targetId = num + '@s.whatsapp.net';
      }

      if (!targetId) {
        return await sock.sendMessage(from, { text: '❌ يجب أن تمنشن الشخص!\nمثال: .إنذار @شخص سبب' });
      }

      // التحقق من عدم إنذار المشرفين
      const groupMetadata = await sock.groupMetadata(from);
      const isTargetAdmin = groupMetadata.participants?.some(p => p.id === targetId && (p.admin === 'admin' || p.admin === 'superadmin'));
      
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
      const db = getDatabase();
      db.warnings = db.warnings || {};
      db.warnings[from] = db.warnings[from] || {};
      db.warnings[from][targetId] = db.warnings[from][targetId] || { count: 0, history: [] };

      db.warnings[from][targetId].count++;
      db.warnings[from][targetId].history.push({
        reason,
        by: sender,
        byName: ctx.pushName,
        date: now
      });

      // تحديث الـ cooldown
      warningCooldowns.set(cooldownKey, now);
      saveDatabase();

      const warningCount = db.warnings[from][targetId].count;

      let message = `⚠️ ═══════ إنذار ═══════ ⚠️\n\n`;
      message += `👤 العضو: @${targetId.split('@')[0]}\n`;
      message += `📝 السبب: ${reason}\n`;
      message += `📊 عدد الإنذارات: ${warningCount}/3\n`;
      message += `👮 بواسطة: ${ctx.pushName}\n`;

      // إجراءات تلقائية
      if (warningCount >= 3) {
        // طرد تلقائي
        try {
          await sock.groupParticipantsUpdate(from, [targetId], 'remove');
          message += `\n🚪 تم طرد العضو لبلوغ 3 إنذارات!`;
          db.warnings[from][targetId].count = 0; // إعادة تعيين
        } catch (e) {
          message += `\n⚠️ يجب طرد العضو يدوياً!`;
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

      const db = getDatabase();
      const groupWarnings = db.warnings?.[from];

      if (!groupWarnings || Object.keys(groupWarnings).length === 0) {
        return await sock.sendMessage(from, { text: '✅ لا توجد إنذارات في هذه المجموعة!' });
      }

      let text = `📋 ═══════ إنذارات المجموعة ═══════ 📋\n\n`;

      const mentions = [];
      for (const [userId, data] of Object.entries(groupWarnings)) {
        if (data.count > 0) {
          text += `👤 @${userId.split('@')[0]}: ${data.count}/3 إنذارات\n`;
          text += `   آخر سبب: ${data.history[data.history.length - 1]?.reason || '-'}\n\n`;
          mentions.push(userId);
        }
      }

      await sock.sendMessage(from, { text, mentions });
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // أمر العفو
    // ═══════════════════════════════════════════════════════════════════════════
    if (['عفو', 'pardon', 'مسح_إنذار', 'صفح'].includes(command)) {
      if (!isGroup) {
        return await sock.sendMessage(from, { text: '❌ هذا الأمر يعمل في المجموعات فقط!' });
      }

      if (!isGroupAdmin && !isOwner) {
        return await sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      // الحصول على المستهدف
      let targetId = null;
      if (quoted?.mentionedJid?.length > 0) {
        targetId = quoted.mentionedJid[0];
      } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        targetId = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (args[0]?.startsWith('@')) {
        const num = args[0].replace('@', '').replace(/\D/g, '');
        if (num) targetId = num + '@s.whatsapp.net';
      }

      if (!targetId) {
        return await sock.sendMessage(from, { text: '❌ يجب أن تمنشن الشخص!' });
      }

      const db = getDatabase();
      if (!db.warnings?.[from]?.[targetId]) {
        return await sock.sendMessage(from, { text: '✅ هذا العضو لا يملك إنذارات!' });
      }

      const count = db.warnings[from][targetId].count;
      db.warnings[from][targetId] = { count: 0, history: [] };
      saveDatabase();

      await sock.sendMessage(from, { 
        text: `✅ تم العفو عن @${targetId.split('@')[0]} ومسح ${count} إنذارات!`,
        mentions: [targetId]
      });
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // أمر المنشن
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

      // النص المراد إرساله
      const customText = args.length > 0 ? args.join(' ') : '📢 تم منشن الجميع!';

      // تقسيم المشاركين إلى مجموعات (واتساب يحدد 100 منشن كحد أقصى)
      const mentions = participants.map(p => p.id);

      let message = `📢 ═══════ إعلان ═══════ 📢\n\n`;
      message += customText + '\n\n';
      message += `👥 عدد الأعضاء: ${participants.length}`;

      await sock.sendMessage(from, { text: message, mentions });
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // أمر المنشن المخفي
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
      const mentions = participants.map(p => p.id);

      const customText = args.length > 0 ? args.join(' ') : '👋';

      // منشن مخفي - النص لا يحتوي على أسماء لكن الجميع يُمنشن
      await sock.sendMessage(from, { 
        text: customText, 
        mentions 
      });
      return;
    }
  }
};
