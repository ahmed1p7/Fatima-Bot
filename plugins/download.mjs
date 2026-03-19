// ═══════════════════════════════════════════════════════════════════════════════
// 📥 التحميلات
// ═══════════════════════════════════════════════════════════════════════════════

import fetch from 'node-fetch';

export default {
  name: 'Downloads',
  commands: ['تشغيل', 'play', 'فيديو', 'video', 'تيكتوك', 'tiktok', 'انستا', 'instagram', 'فيسبوك', 'facebook'],
  
  async execute(sock, msg, ctx) {
    const { from, command, args, text, prefix } = ctx;
    
    // يوتيوب صوت
    if (['تشغيل', 'play'].includes(command)) {
      if (!text) return sock.sendMessage(from, { text: `❌ اكتب اسم الأغنية!\n💡 ${prefix}تشغيل Shape of You` });
      await sock.sendMessage(from, { text: '🔍 جاري البحث...' });
      try {
        const search = await fetch('https://api.popcat.xyz/youtube?q=' + encodeURIComponent(text));
        const data = await search.json();
        if (!data.results?.[0]) return sock.sendMessage(from, { text: '❌ لم أجد!' });
        const v = data.results[0];
        const dl = await fetch('https://api.popcat.xyz/youtube-dl?url=' + encodeURIComponent(v.url));
        const d = await dl.json();
        if (!d.audio) return sock.sendMessage(from, { text: '❌ فشل!' });
        return sock.sendMessage(from, { audio: { url: d.audio }, mimetype: 'audio/mpeg', fileName: v.title + '.mp3', contextInfo: { externalAdReply: { title: v.title, thumbnailUrl: v.thumbnail }}});
      } catch { return sock.sendMessage(from, { text: '❌ خطأ!' }); }
    }
    
    // يوتيوب فيديو
    if (['فيديو', 'video'].includes(command)) {
      if (!text) return sock.sendMessage(from, { text: '❌ اكتب اسم الفيديو!' });
      await sock.sendMessage(from, { text: '🔍 جاري البحث...' });
      try {
        const search = await fetch('https://api.popcat.xyz/youtube?q=' + encodeURIComponent(text));
        const data = await search.json();
        if (!data.results?.[0]) return sock.sendMessage(from, { text: '❌ لم أجد!' });
        const v = data.results[0];
        const dl = await fetch('https://api.popcat.xyz/youtube-dl?url=' + encodeURIComponent(v.url));
        const d = await dl.json();
        if (!d.video) return sock.sendMessage(from, { text: '❌ فشل!' });
        return sock.sendMessage(from, { video: { url: d.video }, caption: '✅ ' + v.title });
      } catch { return sock.sendMessage(from, { text: '❌ خطأ!' }); }
    }
    
    // تيكتوك
    if (['تيكتوك', 'tiktok'].includes(command)) {
      if (!text) return sock.sendMessage(from, { text: '❌ اكتب رابط تيكتوك!' });
      await sock.sendMessage(from, { text: '⏳ تحميل...' });
      try {
        const r = await fetch('https://api.popcat.xyz/tiktok?url=' + encodeURIComponent(text));
        const d = await r.json();
        if (!d.video) return sock.sendMessage(from, { text: '❌ فشل!' });
        return sock.sendMessage(from, { video: { url: d.video }, caption: '✅ تم!' });
      } catch { return sock.sendMessage(from, { text: '❌ خطأ!' }); }
    }
    
    // انستغرام
    if (['انستا', 'instagram'].includes(command)) {
      if (!text) return sock.sendMessage(from, { text: '❌ اكتب رابط انستغرام!' });
      await sock.sendMessage(from, { text: '⏳ تحميل...' });
      try {
        const r = await fetch('https://api.popcat.xyz/instagram?url=' + encodeURIComponent(text));
        const d = await r.json();
        if (!d.url) return sock.sendMessage(from, { text: '❌ فشل!' });
        return sock.sendMessage(from, { video: { url: d.url }, caption: '✅ تم!' });
      } catch { return sock.sendMessage(from, { text: '❌ خطأ!' }); }
    }
    
    // فيسبوك
    if (['فيسبوك', 'facebook'].includes(command)) {
      if (!text) return sock.sendMessage(from, { text: '❌ اكتب رابط فيسبوك!' });
      await sock.sendMessage(from, { text: '⏳ تحميل...' });
      try {
        const r = await fetch('https://api.popcat.xyz/facebook?url=' + encodeURIComponent(text));
        const d = await r.json();
        if (!d.url) return sock.sendMessage(from, { text: '❌ فشل!' });
        return sock.sendMessage(from, { video: { url: d.url }, caption: '✅ تم!' });
      } catch { return sock.sendMessage(from, { text: '❌ خطأ!' }); }
    }
  }
};
