// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 نظام الملصقات المتقدم - فاطمة بوت v13.0
// يتضمن: تحويل الصور/الفيديو إلى ملصقات، سرقة ملصق مع حقوق، تحويل ملصق إلى صورة
// ═══════════════════════════════════════════════════════════════════════════════

import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

// إعدادات
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_DURATION = 10; // ثواني
const FFMPEG_TIMEOUT = 15000; // 15 ثانية

// مجلد مؤقت آمن
const TEMP_DIR = path.join(os.tmpdir(), 'fatima_stickers');

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * التحقق من وجود FFmpeg في النظام
 */
async function checkFFmpeg() {
  try {
    await execAsync('ffmpeg -version', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * إنشاء المجلد المؤقت إذا لم يكن موجوداً
 */
async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (err) {
    console.error('❌ فشل إنشاء المجلد المؤقت:', err.message);
  }
}

/**
 * تنزيل الوسائط من الرسالة
 * @param {Object} mediaMessage - كائن الوسائط
 * @param {string} messageType - نوع الوسائط (image, video, sticker)
 * @returns {Promise<Buffer>}
 */
async function downloadMedia(mediaMessage, messageType) {
  const stream = await downloadContentFromMessage(mediaMessage, messageType);
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * الحصول على مدة الفيديو (بالثواني)
 */
async function getVideoDuration(filePath) {
  try {
    const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, { timeout: 5000 });
    return parseFloat(stdout.trim()) || 0;
  } catch {
    return 0;
  }
}

/**
 * تنظيف الملفات المؤقتة (قائمة مسارات)
 */
async function cleanupFiles(paths) {
  for (const p of paths) {
    try {
      await fs.unlink(p);
    } catch (e) {
      // تجاهل أخطاء الحذف
    }
  }
}

/**
 * تحويل صورة أو فيديو إلى ملصق (WebP)
 */
async function createSticker(buffer, isVideo = false) {
  await ensureTempDir();
  const timestamp = Date.now();
  const inputExt = isVideo ? 'mp4' : 'jpg';
  const inputPath = path.join(TEMP_DIR, `input_${timestamp}.${inputExt}`);
  const outputPath = path.join(TEMP_DIR, `sticker_${timestamp}.webp`);

  try {
    await fs.writeFile(inputPath, buffer);

    // التحقق من حجم الفيديو ومدته
    if (isVideo) {
      const duration = await getVideoDuration(inputPath);
      if (duration > MAX_VIDEO_DURATION) {
        throw new Error(`مدة الفيديو طويلة جداً (${duration.toFixed(1)} ثانية). الحد الأقصى ${MAX_VIDEO_DURATION} ثانية.`);
      }
    }

    // بناء أمر FFmpeg
    let ffmpegCmd;
    if (isVideo) {
      ffmpegCmd = `ffmpeg -i "${inputPath}" -vf "fps=15,scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 50 "${outputPath}"`;
    } else {
      ffmpegCmd = `ffmpeg -i "${inputPath}" -vf "scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -q:v 70 -lossless 0 -pix_fmt yuva420p "${outputPath}"`;
    }

    await execAsync(ffmpegCmd, { timeout: FFMPEG_TIMEOUT });

    const stickerBuffer = await fs.readFile(outputPath);
    await cleanupFiles([inputPath, outputPath]);
    return stickerBuffer;
  } catch (err) {
    await cleanupFiles([inputPath, outputPath]);
    throw new Error(`فشل تحويل ${isVideo ? 'الفيديو' : 'الصورة'} إلى ملصق: ${err.message}`);
  }
}

/**
 * تحويل ملصق إلى صورة PNG
 */
async function stickerToImage(stickerBuffer) {
  await ensureTempDir();
  const timestamp = Date.now();
  const inputPath = path.join(TEMP_DIR, `sticker_input_${timestamp}.webp`);
  const outputPath = path.join(TEMP_DIR, `image_output_${timestamp}.png`);

  try {
    await fs.writeFile(inputPath, stickerBuffer);
    await execAsync(`ffmpeg -i "${inputPath}" -pix_fmt rgba -vcodec png "${outputPath}"`, { timeout: FFMPEG_TIMEOUT });
    const imageBuffer = await fs.readFile(outputPath);
    await cleanupFiles([inputPath, outputPath]);
    return imageBuffer;
  } catch (err) {
    await cleanupFiles([inputPath, outputPath]);
    throw new Error(`فشل تحويل الملصق إلى صورة: ${err.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 الأمر الرئيسي
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  name: 'Stickers',
  commands: ['ملصق', 's', 'sticker', 'سرقة_ملصق', 'steal', 'لصورة', 'toimg'],

  async execute(sock, msg, ctx) {
    const { from, command, prefix } = ctx;
    const quoted = ctx.quoted;

    // التحقق من وجود FFmpeg مرة واحدة (يمكن تخزين النتيجة في ذاكرة مؤقتة)
    const ffmpegExists = await checkFFmpeg();
    if (!ffmpegExists) {
      return sock.sendMessage(from, { text: '❌ البوت غير مهيأ لإنشاء الملصقات (FFmpeg غير موجود). يرجى التواصل مع المطور.' });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // أمر إنشاء ملصق (صورة / فيديو)
    // ─────────────────────────────────────────────────────────────────────────────
    if (['ملصق', 's', 'sticker'].includes(command)) {
      let media = null;
      let mediaType = null;

      // محاولة استخراج الوسائط من الرد
      if (quoted?.imageMessage) {
        media = quoted.imageMessage;
        mediaType = 'image';
      } else if (quoted?.videoMessage) {
        media = quoted.videoMessage;
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

      // التحقق من الحجم
      const fileSize = media.fileLength ? parseInt(media.fileLength) : 0;
      if (mediaType === 'image' && fileSize > MAX_IMAGE_SIZE) {
        return sock.sendMessage(from, { text: `❌ حجم الصورة كبير جداً (${(fileSize / 1024 / 1024).toFixed(1)}MB). الحد الأقصى 5MB.` });
      }
      if (mediaType === 'video' && fileSize > MAX_VIDEO_SIZE) {
        return sock.sendMessage(from, { text: `❌ حجم الفيديو كبير جداً (${(fileSize / 1024 / 1024).toFixed(1)}MB). الحد الأقصى 10MB.` });
      }

      try {
        const buffer = await downloadMedia(media, mediaType);
        const isVideo = mediaType === 'video';
        const stickerBuffer = await createSticker(buffer, isVideo);
        await sock.sendMessage(from, { sticker: stickerBuffer });
      } catch (err) {
        console.error('خطأ في إنشاء الملصق:', err.message);
        return sock.sendMessage(from, { text: `❌ ${err.message}` });
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // أمر سرقة ملصق مع إضافة حقوق
    // ─────────────────────────────────────────────────────────────────────────────
    if (['سرقة_ملصق', 'steal'].includes(command)) {
      if (!quoted?.stickerMessage) {
        return sock.sendMessage(from, { text: '❌ رد على ملصق لسرقته!' });
      }

      try {
        const stickerBuffer = await downloadMedia(quoted.stickerMessage, 'sticker');

        // إرسال الملصق الأصلي مع رسالة حقوق
        await sock.sendMessage(from, { sticker: stickerBuffer });
        // إضافة رسالة منفصلة بالحقوق (يمكن تعديل النص حسب رغبتك)
        await sock.sendMessage(from, { text: '🔒 **تمت سرقة هذا الملصق بواسطة فاطمة بوت**\n`حقوق الاستخدام محفوظة`' });
      } catch (err) {
        console.error('خطأ في سرقة الملصق:', err.message);
        return sock.sendMessage(from, { text: '❌ فشل سرقة الملصق!' });
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // أمر تحويل ملصق إلى صورة
    // ─────────────────────────────────────────────────────────────────────────────
    if (['لصورة', 'toimg'].includes(command)) {
      if (!quoted?.stickerMessage) {
        return sock.sendMessage(from, { text: '❌ رد على ملصق لتحويله إلى صورة!' });
      }

      try {
        const stickerBuffer = await downloadMedia(quoted.stickerMessage, 'sticker');
        const imageBuffer = await stickerToImage(stickerBuffer);
        await sock.sendMessage(from, { image: imageBuffer, caption: '✅ تم تحويل الملصق إلى صورة PNG' });
      } catch (err) {
        console.error('خطأ في تحويل الملصق:', err.message);
        return sock.sendMessage(from, { text: `❌ ${err.message}` });
      }
    }
  }
};
