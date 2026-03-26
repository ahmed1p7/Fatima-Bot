// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 الملصقات
// ═══════════════════════════════════════════════════════════════════════════════

import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
  name: 'Stickers',
  commands: ['ملصق', 's', 'sticker', 'سرقة_ملصق', 'steal', 'لصورة', 'toimg'],

  async execute(sock, msg, ctx) {
    const { from, sender, command, args, text, prefix } = ctx;

    // استيراد ديناميكي لتجنب أخطاء sharp
    let Sticker, StickerTypes;
    try {
      const mod = await import('wa-sticker-formatter');
      Sticker = mod.Sticker;
      StickerTypes = mod.StickerTypes;
    } catch (e) {
      return sock.sendMessage(from, { text: '❌ وحدة الملصقات غير متاحة!\n💡 جرب: npm install wa-sticker-formatter' });
    }

    // دالة مساعدة لتنزيل المحتوى
    async function downloadMedia(mediaMessage, messageType) {
      try {
        const stream = await downloadContentFromMessage(mediaMessage, messageType);
        const chunks = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      } catch (error) {
        throw new Error('فشل تنزيل المحتوى: ' + error.message);
      }
    }

    // ملصق
    if (['ملصق', 's', 'sticker'].includes(command)) {
      const q = msg.message?.extendedTextMessage?.contextInfo;
      const quotedMsg = q?.quotedMessage;
      
      let media = null;
      let mediaType = null;

      if (quotedMsg?.imageMessage) {
        media = quotedMsg.imageMessage;
        mediaType = 'image';
      } else if (quotedMsg?.videoMessage) {
        media = quotedMsg.videoMessage;
        mediaType = 'video';
      } else if (msg.message?.imageMessage) {
        media = msg.message.imageMessage;
        mediaType = 'image';
      } else if (msg.message?.videoMessage) {
        media = msg.message.videoMessage;
        mediaType = 'video';
      }

      if (!media) {
        return sock.sendMessage(from, { text: `❌ رد على صورة أو فيديو!\n💡 ${prefix}ملصق` });
      }

      try {
        const buf = await downloadMedia(media, mediaType);

        const sticker = new Sticker(buf, {
          pack: 'فاطمة بوت',
          author: args[0] || '',
          type: StickerTypes.FULL,
          quality: 50
        });

        await sock.sendMessage(from, { sticker: await sticker.toBuffer() });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ فشل إنشاء الملصق!\n' + e.message });
      }
    }

    // سرقة ملصق
    if (['سرقة_ملصق', 'steal'].includes(command)) {
      const q = msg.message?.extendedTextMessage?.contextInfo;
      if (!q?.quotedMessage?.stickerMessage) {
        return sock.sendMessage(from, { text: '❌ رد على ملصق!' });
      }

      try {
        const media = q.quotedMessage.stickerMessage;
        const buf = await downloadMedia(media, 'sticker');

        const sticker = new Sticker(buf, {
          pack: 'فاطمة بوت',
          author: text || sender.split('@')[0],
          type: StickerTypes.FULL,
          quality: 50
        });

        await sock.sendMessage(from, { sticker: await sticker.toBuffer() });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ فشل!\n' + e.message });
      }
    }

    // لصورة
    if (['لصورة', 'toimg'].includes(command)) {
      const q = msg.message?.extendedTextMessage?.contextInfo;
      if (!q?.quotedMessage?.stickerMessage) {
        return sock.sendMessage(from, { text: '❌ رد على ملصق!' });
      }

      try {
        const media = q.quotedMessage.stickerMessage;
        const buf = await downloadMedia(media, 'sticker');
        
        await sock.sendMessage(from, { image: buf, caption: '✅ تم تحويل الملصق إلى صورة!' });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ فشل!\n' + e.message });
      }
    }
  }
};
