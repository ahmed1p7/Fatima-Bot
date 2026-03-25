// ═══════════════════════════════════════════════════════════════════════════════
// 📥 أوامر التحميل المحسنة - فاطمة بوت v13.0
// ═══════════════════════════════════════════════════════════════════════════════

import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export default {
  name: 'Downloads',
  commands: [
    'تشغيل', 'play', ' song',
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
        // البحث عن الفيديو
        const searchUrl = `https://api.siputzx.my.id/api/d/youtube-search?query=${encodeURIComponent(text)}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        
        if (!searchData.status || !searchData.data?.[0]) {
          return sock.sendMessage(from, { text: '❌ لم أجد الأغنية!' });
        }
        
        const video = searchData.data[0];
        const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
        
        await sock.sendMessage(from, { text: `🎵 تم العثور: ${video.title}\n⏳ جاري التحميل...` });
        
        // تحميل الصوت
        const dlUrl = `https://api.siputzx.my.id/api/d/youtube?url=${encodeURIComponent(videoUrl)}`;
        const dlRes = await fetch(dlUrl);
        const dlData = await dlRes.json();
        
        if (!dlData.status || !dlData.data?.mp3) {
          // محاولة بـ API بديل
          const altUrl = `https://api.fabdl.com/spotify/get?url=${encodeURIComponent(videoUrl)}`;
          try {
            const altRes = await fetch(altUrl);
            const altData = await altRes.json();
            
            if (altData.result?.url) {
              return sock.sendMessage(from, {
                audio: { url: altData.result.url },
                mimetype: 'audio/mpeg',
                fileName: `${video.title}.mp3`,
                contextInfo: {
                  externalAdReply: {
                    title: video.title || 'أغنية',
                    body: 'فاطمة بوت',
                    thumbnailUrl: video.thumbnail || video.thumbnailUrl,
                    sourceUrl: videoUrl,
                    mediaType: 1
                  }
                }
              });
            }
          } catch {}
          
          return sock.sendMessage(from, { text: '❌ فشل تحميل الأغنية!' });
        }
        
        return sock.sendMessage(from, {
          audio: { url: dlData.data.mp3 },
          mimetype: 'audio/mpeg',
          fileName: `${video.title}.mp3`,
          contextInfo: {
            externalAdReply: {
              title: video.title || 'أغنية',
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
        const searchUrl = `https://api.siputzx.my.id/api/d/youtube-search?query=${encodeURIComponent(text)}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        
        if (!searchData.status || !searchData.data?.[0]) {
          return sock.sendMessage(from, { text: '❌ لم أجد الفيديو!' });
        }
        
        const video = searchData.data[0];
        const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
        
        await sock.sendMessage(from, { text: `🎬 تم العثور: ${video.title}\n⏳ جاري التحميل...` });
        
        // تحميل الفيديو
        const dlUrl = `https://api.siputzx.my.id/api/d/youtube?url=${encodeURIComponent(videoUrl)}`;
        const dlRes = await fetch(dlUrl);
        const dlData = await dlRes.json();
        
        if (!dlData.status || !dlData.data?.mp4) {
          return sock.sendMessage(from, { text: '❌ فشل تحميل الفيديو!' });
        }
        
        return sock.sendMessage(from, {
          video: { url: dlData.data.mp4 },
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
        const apiUrl = `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(text)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        
        if (!data.status || !data.data) {
          // محاولة بـ API بديل
          const altUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(text)}`;
          const altRes = await fetch(altUrl);
          const altData = await altRes.json();
          
          if (altData.video) {
            return sock.sendMessage(from, {
              video: { url: altData.video },
              caption: `✅ تم التحميل!\n\n> فاطمة بوت 🌙`
            });
          }
          
          return sock.sendMessage(from, { text: '❌ فشل تحميل التيكتوك!' });
        }
        
        const videoUrl = data.data.play || data.data.video?.play;
        if (!videoUrl) {
          return sock.sendMessage(from, { text: '❌ لم أجد الفيديو!' });
        }
        
        return sock.sendMessage(from, {
          video: { url: videoUrl },
          caption: `✅ تم تحميل التيكتوك!\n\n👤 ${data.data.author?.nickname || ''}\n📝 ${data.data.title || ''}\n\n> فاطمة بوت 🌙`
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
        const apiUrl = `https://api.siputzx.my.id/api/d/instagram?url=${encodeURIComponent(text)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        
        if (!data.status || !data.data?.[0]) {
          // محاولة بديلة
          const altUrl = `https://api.fabdl.com/instagram/get?url=${encodeURIComponent(text)}`;
          const altRes = await fetch(altUrl);
          const altData = await altRes.json();
          
          if (altData.result?.[0]?.url) {
            const media = altData.result[0];
            if (media.type === 'video') {
              return sock.sendMessage(from, {
                video: { url: media.url },
                caption: '✅ تم التحميل!\n\n> فاطمة بوت 🌙'
              });
            } else {
              return sock.sendMessage(from, {
                image: { url: media.url },
                caption: '✅ تم التحميل!\n\n> فاطمة بوت 🌙'
              });
            }
          }
          
          return sock.sendMessage(from, { text: '❌ فشل تحميل من انستغرام!' });
        }
        
        const media = data.data[0];
        
        if (media.type === 'video') {
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
        const apiUrl = `https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(text)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        
        if (!data.status || !data.data) {
          return sock.sendMessage(from, { text: '❌ فشل تحميل من فيسبوك!' });
        }
        
        const videoUrl = data.data.hd || data.data.sd || data.data.url;
        
        if (!videoUrl) {
          return sock.sendMessage(from, { text: '❌ لم أجد الفيديو!' });
        }
        
        return sock.sendMessage(from, {
          video: { url: videoUrl },
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
        const apiUrl = `https://api.siputzx.my.id/api/d/twitter?url=${encodeURIComponent(text)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        
        if (!data.status || !data.data) {
          return sock.sendMessage(from, { text: '❌ فشل تحميل من تويتر!' });
        }
        
        const videoUrl = data.data.video || data.data.url;
        
        if (!videoUrl) {
          return sock.sendMessage(from, { text: '❌ لم أجد الفيديو!' });
        }
        
        return sock.sendMessage(from, {
          video: { url: videoUrl },
          caption: `✅ تم تحميل فيديو تويتر!\n\n> فاطمة بوت 🌙`
        });
        
      } catch (e) {
        console.error('Twitter error:', e);
        return sock.sendMessage(from, { text: `❌ خطأ: ${e.message}` });
      }
    }
  }
};
