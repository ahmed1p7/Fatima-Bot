// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 الملصقات - باستخدام FFmpeg
// ═══════════════════════════════════════════════════════════════════════════════

import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export default {
  name: 'Stickers',
  commands: ['ملصق', 's', 'sticker', 'سرقة_ملصق', 'steal', 'لصورة', 'toimg'],

  async execute(sock, msg, ctx) {
    const { from, sender, command, args, text, prefix } = ctx;

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

    // دالة لإنشاء ملصق باستخدام FFmpeg
    async function createSticker(buffer, isVideo = false) {
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const inputPath = path.join(tempDir, `input_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`);
      const outputPath = path.join(tempDir, `sticker_${Date.now()}.webp`);

      try {
        fs.writeFileSync(inputPath, buffer);

        if (isVideo) {
          // تحويل فيديو إلى ملصق متحرك
          await execAsync(`ffmpeg -i "${inputPath}" -vf "scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 50 "${outputPath}"`);
        } else {
          // تحويل صورة إلى ملصق
          await execAsync(`ffmpeg -i "${inputPath}" -vf "scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -lossless 0 -qscale 50 -pix_fmt yuva420p "${outputPath}"`);
        }

        const stickerBuffer = fs.readFileSync(outputPath);

        // تنظيف الملفات المؤقتة
        try {
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        } catch (e) {
          // تجاهل أخطاء الحذف
        }

        return stickerBuffer;
      } catch (error) {
        // تنظيف الملفات المؤقتة في حالة الخطأ
        try {
          if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (e) {}
        throw error;
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
        return sock.sendMessage(from, { text: `❌ رد على صورة أو فيديو!\\n💡 ${prefix}ملصق` });
      }

      try {
        const buf = await downloadMedia(media, mediaType);
        const isVideo = mediaType === 'video';

        const stickerBuffer = await createSticker(buf, isVideo);
        await sock.sendMessage(from, { sticker: stickerBuffer });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ فشل إنشاء الملصق!\\n' + e.message });
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

        // إعادة إرسال الملصق كما هو (بدون تغيير البيانات الوصفية لأن WebP لا يدعم ذلك بسهولة)
        await sock.sendMessage(from, { sticker: buf });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ فشل!\\n' + e.message });
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

        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const inputPath = path.join(tempDir, `sticker_input_${Date.now()}.webp`);
        const outputPath = path.join(tempDir, `image_output_${Date.now()}.png`);

        fs.writeFileSync(inputPath, buf);

        await execAsync(`ffmpeg -i "${inputPath}" "${outputPath}"`);

        const imageBuffer = fs.readFileSync(outputPath);

        // تنظيف الملفات المؤقتة
        try {
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        } catch (e) {}

        await sock.sendMessage(from, { image: imageBuffer, caption: '✅ تم تحويل الملصق إلى صورة!' });
      } catch (e) {
        return sock.sendMessage(from, { text: '❌ فشل!\\n' + e.message });
      }
    }
  }
};
