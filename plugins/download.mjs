// ═══════════════════════════════════════════════════════════════════════════════
// 📥 أوامر التحميل المحلية (بدون APIs خارجية) - فاطمة بوت v14.0
// يعتمد على: ytdl-core (يوتيوب) | yt-dlp-exec (إنستغرام)
// ═══════════════════════════════════════════════════════════════════════════════

import ytdl from 'ytdl-core';
import ytdlp from 'yt-dlp-exec';
import fs from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';

// مسار مؤقت لحفظ الملفات (يمكن تعديله حسب هيكل مشروعك)
const TEMP_DIR = './temp';

// التأكد من وجود المجلد المؤقت
await fs.mkdir(TEMP_DIR, { recursive: true });

// دالة لحذف الملف المؤقت بعد الإرسال
async function cleanup(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (e) {}
}

// دالة لتحميل ملف من رابط مباشر (لإنستغرام)
async function downloadToFile(url, outputPath) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(buffer));
  return outputPath;
}

export default {
  name: 'Downloads',
  commands: [
    // يوتيوب صوت
    'تشغيل', 'play', 'song', 'صوت', 'audio', 'mp3',
    // يوتيوب فيديو
    'فيديو', 'video', 'yt',
    // إنستغرام
    'انستا', 'instagram', 'ig'
  ],

  async execute(sock, msg, ctx) {
    const { from, command, text, prefix } = ctx;

    // ─────────────────────────────────────────────────────────────────────────
    // 🎵 تحميل صوت من يوتيوب (بدون API)
    // ─────────────────────────────────────────────────────────────────────────
    if (['تشغيل', 'play', 'song', 'صوت', 'audio', 'mp3'].includes(command)) {
      if (!text) {
        return sock.sendMessage(from, {
          text: `❌ اكتب اسم الأغنية أو رابط يوتيوب!\n💡 ${prefix}تشغيل Shape of You`
        });
      }

      await sock.sendMessage(from, { text: '🔍 جاري البحث والتحميل...' });

      try {
        // تحقق إذا كان النص رابطاً مباشراً
        let videoUrl = text;
        let videoInfo;

        if (ytdl.validateURL(text)) {
          videoInfo = await ytdl.getInfo(text);
          videoUrl = text;
        } else {
          // البحث: استخدم yt-search (سنضيفه لاحقاً إذا أردت) أو يمكن الاعتماد على المستخدم لإدخال الرابط
          // لكن للتبسيط، سنطلب رابطاً مباشراً
          return sock.sendMessage(from, {
            text: '❌ يرجى إرسال رابط يوتيوب مباشر لتحميل الصوت.\n💡 مثال: https://youtu.be/...'
          });
        }

        const title = videoInfo.videoDetails.title.replace(/[^\w\s]/g, '');
        const audioPath = path.join(TEMP_DIR, `${title}.mp3`);

        // تحميل الصوت باستخدام ytdl-core مع فلتر audio فقط
        const stream = ytdl(videoUrl, { filter: 'audioonly', quality: 'highestaudio' });
        const writeStream = createWriteStream(audioPath);
        await pipeline(stream, writeStream);

        // إرسال الملف
        await sock.sendMessage(from, {
          audio: { url: audioPath },
          mimetype: 'audio/mpeg',
          fileName: `${title}.mp3`,
          contextInfo: {
            externalAdReply: {
              title: videoInfo.videoDetails.title,
              body: 'فاطمة بوت 🌙',
              thumbnailUrl: videoInfo.videoDetails.thumbnails[0]?.url,
              sourceUrl: videoUrl,
              mediaType: 1
            }
          }
        });

        // تنظيف
        await cleanup(audioPath);

      } catch (e) {
        console.error('Play error:', e);
        return sock.sendMessage(from, { text: `❌ فشل التحميل: ${e.message}` });
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 🎬 فيديو يوتيوب (بدون API)
    // ─────────────────────────────────────────────────────────────────────────
    if (['فيديو', 'video', 'yt'].includes(command)) {
      if (!text) {
        return sock.sendMessage(from, {
          text: `❌ اكتب رابط فيديو يوتيوب!\n💡 ${prefix}فيديو https://youtu.be/...`
        });
      }

      if (!ytdl.validateURL(text)) {
        return sock.sendMessage(from, { text: '❌ الرابط غير صالح. يرجى إرسال رابط يوتيوب صحيح.' });
      }

      await sock.sendMessage(from, { text: '🎬 جاري تحميل الفيديو...' });

      try {
        const videoInfo = await ytdl.getInfo(text);
        const title = videoInfo.videoDetails.title.replace(/[^\w\s]/g, '');
        const videoPath = path.join(TEMP_DIR, `${title}.mp4`);

        // تحميل الفيديو (أعلى جودة)
        const stream = ytdl(text, { filter: 'videoandaudio', quality: 'highest' });
        const writeStream = createWriteStream(videoPath);
        await pipeline(stream, writeStream);

        await sock.sendMessage(from, {
          video: { url: videoPath },
          caption: `✅ ${videoInfo.videoDetails.title}\n\n> فاطمة بوت 🌙`,
          mimetype: 'video/mp4'
        });

        await cleanup(videoPath);

      } catch (e) {
        console.error('Video error:', e);
        return sock.sendMessage(from, { text: `❌ فشل تحميل الفيديو: ${e.message}` });
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 📸 انستغرام (باستخدام yt-dlp)
    // ─────────────────────────────────────────────────────────────────────────
    if (['انستا', 'instagram', 'ig'].includes(command)) {
      if (!text) {
        return sock.sendMessage(from, {
          text: `❌ اكتب رابط انستغرام!\n💡 ${prefix}انستا https://www.instagram.com/p/...`
        });
      }

      if (!text.includes('instagram.com')) {
        return sock.sendMessage(from, { text: '❌ الرابط غير صحيح. يرجى إرسال رابط إنستغرام صالح.' });
      }

      await sock.sendMessage(from, { text: '⏳ جاري تحميل من انستغرام (قد يستغرق قليلاً)...' });

      try {
        // استخدم yt-dlp للحصول على رابط مباشر
        const info = await ytdlp(text, {
          dumpJson: true,
          noWarnings: true,
          preferFreeFormats: true,
        });

        // استخراج أفضل صورة أو فيديو
        let mediaUrl = null;
        let isVideo = false;

        // تنسيقات الفيديو والصورة
        const formats = info.formats || [];
        const videos = formats.filter(f => f.vcodec !== 'none' && f.acodec !== 'none');
        const images = formats.filter(f => f.ext === 'jpg' || f.ext === 'png');

        if (videos.length) {
          // اختر أفضل جودة فيديو
          const bestVideo = videos.sort((a, b) => (b.height || 0) - (a.height || 0))[0];
          mediaUrl = bestVideo.url;
          isVideo = true;
        } else if (images.length) {
          const bestImage = images.sort((a, b) => (b.width || 0) - (a.width || 0))[0];
          mediaUrl = bestImage.url;
          isVideo = false;
        } else if (info.url) {
          mediaUrl = info.url;
          isVideo = info.ext === 'mp4';
        }

        if (!mediaUrl) {
          return sock.sendMessage(from, { text: '❌ لم أتمكن من العثور على وسائط قابلة للتحميل.' });
        }

        // تحميل الملف مؤقتاً
        const ext = isVideo ? 'mp4' : 'jpg';
        const fileName = `instagram_${Date.now()}.${ext}`;
        const filePath = path.join(TEMP_DIR, fileName);
        await downloadToFile(mediaUrl, filePath);

        // إرسال
        if (isVideo) {
          await sock.sendMessage(from, {
            video: { url: filePath },
            caption: '✅ تم تحميل الفيديو!\n\n> فاطمة بوت 🌙'
          });
        } else {
          await sock.sendMessage(from, {
            image: { url: filePath },
            caption: '✅ تم تحميل الصورة!\n\n> فاطمة بوت 🌙'
          });
        }

        await cleanup(filePath);

      } catch (e) {
        console.error('Instagram error:', e);
        return sock.sendMessage(from, {
          text: `❌ فشل تحميل من انستغرام. تأكد من الرابط وحاول مجدداً.\n${e.message}`
        });
      }
    }
  }
};
