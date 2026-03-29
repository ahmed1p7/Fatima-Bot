// ═══════════════════════════════════════════════════════════════════════════════
// 📥 أوامر التحميل المحسنة - فاطمة بوت v13.0
// APIs المستخدمة: api.bk9.site (أساسي) | aemt.me (احتياطي)
// ═══════════════════════════════════════════════════════════════════════════════

import fetch from 'node-fetch';

// دالة مساعدة للتحميل مع fallback بين APIs
async function downloadWithFallback(primaryUrl, backupUrl, extractFn) {
  try {
    const res = await fetch(primaryUrl);
    const data = await res.json();
    const result = extractFn(data);
    if (result) return { success: true, data: result };
  } catch (e) {
    console.log('Primary API failed, trying backup...');
  }
  
  if (backupUrl) {
    try {
      const res = await fetch(backupUrl);
      const data = await res.json();
      const result = extractFn(data);
      if (result) return { success: true, data: result };
    } catch (e) {
      console.log('Backup API also failed');
    }
  }
  
  return { success: false, error: 'فشل جميع APIs' };
}

export default {
  name: 'Downloads',
  commands: [
    'تشغيل', 'play', 'song',
    'فيديو', 'video', 'yt',
    'تيكتوك', 'tiktok', 'tt',
    'انستا', 'instagram', 'ig',
    'فيسبوك', 'facebook', 'fb',
    'تويتر', 'twitter', 'tw',
    'صوت', 'audio', 'mp3'
  ],
  
  async execute(sock, msg, ctx) {
    const { from, command, args, text, prefix, quoted } = ctx;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🎵 تشغيل أغنية (YouTube Audio)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تشغيل', 'play', 'song', 'صوت', 'audio', 'mp3'].includes(command)) {
      if (!text) {
        return sock.sendMessage(from, { 
          text: `❌ اكتب اسم الأغنية!\n💡 ${prefix}تشغيل Shape of You` 
        });
      }
      
      await sock.sendMessage(from, { text: '🔍 جاري البحث عن الأغنية...' });
      
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
          video = { title: text };
          videoUrl = text;
        }
        
        if (!video) {
          return sock.sendMessage(from, { text: '❌ لم أجد الأغنية!' });
        }
        
        await sock.sendMessage(from, { text: `🎵 تم العثور: ${video.title}\n⏳ جاري التحميل...` });
        
        const primaryDlUrl = `https://api.bk9.site/api/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
        const backupDlUrl = `https://aemt.me/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
        
        const result = await downloadWithFallback(
          primaryDlUrl,
          backupDlUrl,
          (data) => {
            if (data.status && data.data?.mp3) return data.data.mp3;
            if (data.result?.url) return data.result.url;
            return null;
          }
        );
        
        if (!result.success || !result.data) {
          return sock.sendMessage(from, { text: '❌ فشل تحميل الأغنية!' });
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
    // 🎬 فيديو يوتيوب
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
          video = { title: text };
          videoUrl = text;
        }
        
        if (!video) {
          return sock.sendMessage(from, { text: '❌ لم أجد الفيديو!' });
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
            return null;
          }
        );
        
        if (!result.success || !result.data) {
          return sock.sendMessage(from, { text: '❌ فشل تحميل الفيديو!' });
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
    // 🎵 تيكتوك
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تيكتوك', 'tiktok', 'tt'].includes(command)) {
      if (!text) {
        return sock.sendMessage(from, { text: `❌ اكتب رابط تيكتوك!\n💡 ${prefix}تيكتوك https://vm.tiktok.com/xxx` });
      }
      
      await sock.sendMessage(from, { text: '⏳ جاري تحميل تيكتوك...' });
      
      try {
        const primaryUrl = `https://api.bk9.site/api/download/tiktok?url=${encodeURIComponent(text)}`;
        const backupUrl = `https://aemt.me/download/tiktok?url=${encodeURIComponent(text)}`;
        
        const result = await downloadWithFallback(
          primaryUrl,
          backupUrl,
          (data) => {
            if (data.status && data.data?.play) return data.data.play;
            if (data.status && data.data?.video?.play) return data.data.video.play;
            if (data.result?.url) return data.result.url;
            return null;
          }
        );
        
        if (!result.success || !result.data) {
          return sock.sendMessage(from, { text: '❌ فشل تحميل التيكتوك!' });
        }
        
        return sock.sendMessage(from, {
          video: { url: result.data },
          caption: `✅ تم تحميل التيكتوك!\n\n> فاطمة بوت 🌙`
        });
        
      } catch (e) {
        console.error('TikTok error:', e);
        return sock.sendMessage(from, { text: `❌ خطأ: ${e.message}` });
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 📸 انستغرام
    // ═══════════════════════════════════════════════════════════════════════════
    if (['انستا', 'instagram', 'ig'].includes(command)) {
      if (!text) {
        return sock.sendMessage(from, { text: `❌ اكتب رابط انستغرام!\n💡 ${prefix}انستا https://www.instagram.com/xxx` });
      }
      
      await sock.sendMessage(from, { text: '⏳ جاري تحميل من انستغرام...' });
      
      try {
        const primaryUrl = `https://api.bk9.site/api/download/instagram?url=${encodeURIComponent(text)}`;
        const backupUrl = `https://aemt.me/download/instagram?url=${encodeURIComponent(text)}`;
        
        const result = await downloadWithFallback(
          primaryUrl,
          backupUrl,
          (data) => {
            if (data.status && data.data?.[0]?.url) return data.data[0];
            if (data.result?.[0]?.url) return data.result[0];
            return null;
          }
        );
        
        if (!result.success || !result.data) {
          return sock.sendMessage(from, { text: '❌ فشل تحميل من انستغرام!' });
        }
        
        const media = result.data;
        
        if (media.type === 'video' || media.media_type === 'video') {
          return sock.sendMessage(from, {
            video: { url: media.url },
            caption: '✅ تم تحميل الفيديو!\n\n> فاطمة بوت 🌙'
          });
        } else {
          return sock.sendMessage(from, {
            image: { url: media.url },
            caption: '✅ تم تحميل الصورة!\n\n> فاطمة بوت 🌙'
          });
        }
        
      } catch (e) {
        console.error('Instagram error:', e);
        return sock.sendMessage(from, { text: `❌ خطأ: ${e.message}` });
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 📘 فيسبوك
    // ═══════════════════════════════════════════════════════════════════════════
    if (['فيسبوك', 'facebook', 'fb'].includes(command)) {
      if (!text) {
        return sock.sendMessage(from, { text: `❌ اكتب رابط فيسبوك!\n💡 ${prefix}فيسبوك https://www.facebook.com/xxx` });
      }
      
      await sock.sendMessage(from, { text: '⏳ جاري تحميل من فيسبوك...' });
      
      try {
        const primaryUrl = `https://api.bk9.site/api/download/facebook?url=${encodeURIComponent(text)}`;
        const backupUrl = `https://aemt.me/download/facebook?url=${encodeURIComponent(text)}`;
        
        const result = await downloadWithFallback(
          primaryUrl,
          backupUrl,
          (data) => {
            if (data.status && data.data?.hd) return data.data.hd;
            if (data.status && data.data?.sd) return data.data.sd;
            if (data.status && data.data?.url) return data.data.url;
            if (data.result?.url) return data.result.url;
            return null;
          }
        );
        
        if (!result.success || !result.data) {
          return sock.sendMessage(from, { text: '❌ فشل تحميل من فيسبوك!' });
        }
        
        return sock.sendMessage(from, {
          video: { url: result.data },
          caption: `✅ تم تحميل فيديو فيسبوك!\n\n> فاطمة بوت 🌙`
        });
        
      } catch (e) {
        console.error('Facebook error:', e);
        return sock.sendMessage(from, { text: `❌ خطأ: ${e.message}` });
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🐦 تويتر
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تويتر', 'twitter', 'tw'].includes(command)) {
      if (!text) {
        return sock.sendMessage(from, { text: `❌ اكتب رابط تويتر!\n💡 ${prefix}تويتر https://twitter.com/xxx` });
      }
      
      await sock.sendMessage(from, { text: '⏳ جاري تحميل من تويتر...' });
      
      try {
        const primaryUrl = `https://api.bk9.site/api/download/twitter?url=${encodeURIComponent(text)}`;
        const backupUrl = `https://aemt.me/download/twitter?url=${encodeURIComponent(text)}`;
        
        const result = await downloadWithFallback(
          primaryUrl,
          backupUrl,
          (data) => {
            if (data.status && data.data?.video) return data.data.video;
            if (data.status && data.data?.url) return data.data.url;
            if (data.result?.url) return data.result.url;
            return null;
          }
        );
        
        if (!result.success || !result.data) {
          return sock.sendMessage(from, { text: '❌ فشل تحميل من تويتر!' });
        }
        
        return sock.sendMessage(from, {
          video: { url: result.data },
          caption: `✅ تم تحميل فيديو تويتر!\n\n> فاطمة بوت 🌙`
        });
        
      } catch (e) {
        console.error('Twitter error:', e);
        return sock.sendMessage(from, { text: `❌ خطأ: ${e.message}` });
      }
    }
  }
};
