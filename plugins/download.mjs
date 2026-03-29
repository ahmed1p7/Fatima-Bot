// ═══════════════════════════════════════════════════════════════════════════════
// 📥 أوامر التحميل (يوتيوب + إنستغرام فقط) - فاطمة بوت v13.0
// APIs المستخدمة: api.bk9.site (أساسي) | aemt.me (احتياطي)
// ═══════════════════════════════════════════════════════════════════════════════

import fetch from 'node-fetch';

// دالة مساعدة للتحميل مع fallback بين APIs
async function downloadWithFallback(primaryUrl, backupUrl, extractFn) {
  try {
    const res = await fetch(primaryUrl, { timeout: 15000 });
    const data = await res.json();
    const result = extractFn(data);
    if (result) return { success: true, data: result };
  } catch (e) {
    console.log('⚠️ Primary API failed:', e.message);
  }
  
  if (backupUrl) {
    try {
      const res = await fetch(backupUrl, { timeout: 15000 });
      const data = await res.json();
      const result = extractFn(data);
      if (result) return { success: true, data: result };
    } catch (e) {
      console.log('⚠️ Backup API also failed:', e.message);
    }
  }
  
  return { success: false, error: 'فشل جميع APIs' };
}

export default {
  name: 'Downloads',
  commands: [
    // أوامر يوتيوب صوت
    'تشغيل', 'play', 'song', 'صوت', 'audio', 'mp3',
    // أوامر يوتيوب فيديو
    'فيديو', 'video', 'yt',
    // أوامر إنستغرام
    'انستا', 'instagram', 'ig'
  ],
  
  async execute(sock, msg, ctx) {
    const { from, command, args, text, prefix, quoted } = ctx;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🎵 تحميل صوت من يوتيوب (YouTube Audio)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تشغيل', 'play', 'song', 'صوت', 'audio', 'mp3'].includes(command)) {
      if (!text) {
        return sock.sendMessage(from, { 
          text: `❌ اكتب اسم الأغنية!\n💡 ${prefix}تشغيل Shape of You` 
        });
      }
      
      await sock.sendMessage(from, { text: '🔍 جاري البحث عن الأغنية...' });
      
      try {
        // 1. البحث عن الفيديو
        const searchUrl = `https://api.bk9.site/api/search/youtube?query=${encodeURIComponent(text)}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        
        let video = null;
        let videoUrl = '';
        
        if (searchData.status && searchData.data?.[0]) {
          video = searchData.data[0];
          videoUrl = `https://www.youtube.com/watch?v=${video.videoId || video.id}`;
        } else {
          // إذا لم يجد البحث، نفترض أن النص هو رابط مباشر
          videoUrl = text;
          video = { title: 'مقطع يوتيوب' };
        }
        
        await sock.sendMessage(from, { text: `🎵 تم العثور: ${video.title}\n⏳ جاري التحميل...` });
        
        // 2. تحميل الصوت
        const primaryDlUrl = `https://api.bk9.site/api/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
        const backupDlUrl = `https://aemt.me/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
        
        const result = await downloadWithFallback(
          primaryDlUrl,
          backupDlUrl,
          (data) => {
            // تنسيق api.bk9.site
            if (data.status && data.data?.mp3) return data.data.mp3;
            // تنسيق aemt.me
            if (data.result?.url) return data.result.url;
            // تنسيق بديل
            if (data.url) return data.url;
            return null;
          }
        );
        
        if (!result.success || !result.data) {
          return sock.sendMessage(from, { text: '❌ فشل تحميل الأغنية! حاول لاحقاً.' });
        }
        
        return sock.sendMessage(from, {
          audio: { url: result.data },
          mimetype: 'audio/mpeg',
          fileName: `${video.title}.mp3`,
          contextInfo: {
            externalAdReply: {
              title: video.title,
              body: 'فاطمة بوت 🌙',
              thumbnailUrl: video.thumbnail || video.thumbnailUrl,
              sourceUrl: videoUrl,
              mediaType: 1
            }
          }
        });
        
      } catch (e) {
        console.error('Play error:', e);
        return sock.sendMessage(from, { text: `❌ خطأ: ${e.message}` });
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🎬 فيديو يوتيوب (YouTube Video)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['فيديو', 'video', 'yt'].includes(command)) {
      if (!text) {
        return sock.sendMessage(from, { text: `❌ اكتب اسم الفيديو!\n💡 ${prefix}فيديو Funny cats` });
      }
      
      await sock.sendMessage(from, { text: '🔍 جاري البحث...' });
      
      try {
        const searchUrl = `https://api.bk9.site/api/search/youtube?query=${encodeURIComponent(text)}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        
        let video = null;
        let videoUrl = '';
        
        if (searchData.status && searchData.data?.[0]) {
          video = searchData.data[0];
          videoUrl = `https://www.youtube.com/watch?v=${video.videoId || video.id}`;
        } else {
          videoUrl = text;
          video = { title: 'فيديو يوتيوب' };
        }
        
        await sock.sendMessage(from, { text: `🎬 تم العثور: ${video.title}\n⏳ جاري التحميل...` });
        
        const primaryDlUrl = `https://api.bk9.site/api/download/ytmp4?url=${encodeURIComponent(videoUrl)}`;
        const backupDlUrl = `https://aemt.me/download/ytmp4?url=${encodeURIComponent(videoUrl)}`;
        
        const result = await downloadWithFallback(
          primaryDlUrl,
          backupDlUrl,
          (data) => {
            if (data.status && data.data?.mp4) return data.data.mp4;
            if (data.result?.url) return data.result.url;
            if (data.url) return data.url;
            return null;
          }
        );
        
        if (!result.success || !result.data) {
          return sock.sendMessage(from, { text: '❌ فشل تحميل الفيديو! حاول لاحقاً.' });
        }
        
        return sock.sendMessage(from, {
          video: { url: result.data },
          caption: `✅ ${video.title}\n\n> فاطمة بوت 🌙`,
          mimetype: 'video/mp4'
        });
        
      } catch (e) {
        console.error('Video error:', e);
        return sock.sendMessage(from, { text: `❌ خطأ: ${e.message}` });
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 📸 انستغرام (Instagram)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['انستا', 'instagram', 'ig'].includes(command)) {
      if (!text) {
        return sock.sendMessage(from, { text: `❌ اكتب رابط انستغرام!\n💡 ${prefix}انستا https://www.instagram.com/p/xxx` });
      }
      
      // تحقق بسيط من أن النص هو رابط إنستغرام
      if (!text.includes('instagram.com') && !text.includes('instagr.am')) {
        return sock.sendMessage(from, { text: '❌ الرابط غير صحيح! يجب أن يكون رابط إنستغرام صالح.' });
      }
      
      await sock.sendMessage(from, { text: '⏳ جاري تحميل من انستغرام...' });
      
      try {
        const primaryUrl = `https://api.bk9.site/api/download/instagram?url=${encodeURIComponent(text)}`;
        const backupUrl = `https://aemt.me/download/instagram?url=${encodeURIComponent(text)}`;
        
        const result = await downloadWithFallback(
          primaryUrl,
          backupUrl,
          (data) => {
            // تنسيق api.bk9.site
            if (data.status && data.data && Array.isArray(data.data)) {
              return data.data[0]; // أول عنصر
            }
            // تنسيق aemt.me
            if (data.result && Array.isArray(data.result)) {
              return data.result[0];
            }
            // تنسيق بديل (مباشر)
            if (data.url) return { url: data.url, type: 'image' };
            return null;
          }
        );
        
        if (!result.success || !result.data) {
          return sock.sendMessage(from, { text: '❌ فشل تحميل من انستغرام! تأكد من الرابط وحاول مجدداً.' });
        }
        
        const media = result.data;
        const mediaUrl = media.url || media;
        const mediaType = media.type || (mediaUrl.includes('.mp4') ? 'video' : 'image');
        
        if (mediaType === 'video') {
          return sock.sendMessage(from, {
            video: { url: mediaUrl },
            caption: '✅ تم تحميل الفيديو!\n\n> فاطمة بوت 🌙'
          });
        } else {
          return sock.sendMessage(from, {
            image: { url: mediaUrl },
            caption: '✅ تم تحميل الصورة!\n\n> فاطمة بوت 🌙'
          });
        }
        
      } catch (e) {
        console.error('Instagram error:', e);
        return sock.sendMessage(from, { text: `❌ خطأ: ${e.message}` });
      }
    }
  }
};
