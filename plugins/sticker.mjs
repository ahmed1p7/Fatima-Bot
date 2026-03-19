// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 الملصقات
// ═══════════════════════════════════════════════════════════════════════════════

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

    // ملصق
    if (['ملصق', 's', 'sticker'].includes(command)) {
      const q = msg.message?.extendedTextMessage?.contextInfo;
      const hasMedia = q?.quotedMessage?.imageMessage || q?.quotedMessage?.videoMessage || msg.message?.imageMessage || msg.message?.videoMessage;

      if (!hasMedia) {
        return sock.sendMessage(from, { text: `❌ رد على صورة أو فيديو!\n💡 ${prefix}ملصق` });
      }

      try {
        const media = q?.quotedMessage?.imageMessage || q?.quotedMessage?.videoMessage || msg.message?.imageMessage || msg.message?.videoMessage;
        const stream = await sock.downloadMediaContent(media);
        const chunks = [];
        for await (const c of stream) chunks.push(c);
        const buf = Buffer.concat(chunks);

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
        const stream = await sock.downloadMediaContent(q.quotedMessage.stickerMessage);
        const chunks = [];
        for await (const c of stream) chunks.push(c);
        const buf = Buffer.concat(chunks);

        const sticker = new Sticker(buf, {
          pack: 'فاطمة بوت',
          author: text || sender.split('@')[0],
          type: StickerTypes.FULL,
          quality: 50
        });

        await sock.sendMessage(from, { sticker: await sticker.toBuffer() });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ فشل!' });
      }
    }

    // لصورة
    if (['لصورة', 'toimg'].includes(command)) {
      const q = msg.message?.extendedTextMessage?.contextInfo;
      if (!q?.quotedMessage?.stickerMessage) {
        return sock.sendMessage(from, { text: '❌ رد على ملصق!' });
      }

      try {
        const stream = await sock.downloadMediaContent(q.quotedMessage.stickerMessage);
        const chunks = [];
        for await (const c of stream) chunks.push(c);
        await sock.sendMessage(from, { image: Buffer.concat(chunks), caption: '✅ تم!' });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ فشل!' });
      }
    }
  }
};
