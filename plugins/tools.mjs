// ═══════════════════════════════════════════════════════════════════════════════
// 🛠️ أدوات
// ═══════════════════════════════════════════════════════════════════════════════

import fetch from 'node-fetch';

const DUAS = [
  '🤲 رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً',
  '🤲 اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَاهْدِنِي',
  '🤲 سُبْحَانَ اللهِ وَبِحَمْدِهِ، سُبْحَانَ اللهِ الْعَظِيمِ',
  '🤲 لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ'
];
const activeDuas = {};

export default {
  name: 'Tools',
  commands: ['دعاء', 'dua', 'إيقاف_دعاء', 'stopdua', 'رابط', 'url', 'اختصار', 'short'],
  
  async execute(sock, msg, ctx) {
    const { from, command, args, text, prefix } = ctx;
    
    if (['دعاء', 'dua'].includes(command)) {
      const mins = parseInt(args[0]);
      if (!mins) return sock.sendMessage(from, { text: `🤲 ${DUAS.join('\n')}\n\n💡 ${prefix}دعاء 30` });
      if (activeDuas[from]) clearInterval(activeDuas[from].int);
      const dua = DUAS[Math.floor(Math.random() * DUAS.length)];
      activeDuas[from] = {
        int: setInterval(() => sock.sendMessage(from, { text: DUAS[Math.floor(Math.random() * DUAS.length)] + `\n📢 كل ${mins} دقيقة` }).catch(() => {}), mins * 60000),
        start: Date.now()
      };
      return sock.sendMessage(from, { text: `${dua}\n\n✅ كل ${mins} دقيقة\n🛑 ${prefix}إيقاف_دعاء` });
    }
    
    if (['إيقاف_دعاء', 'stopdua'].includes(command)) {
      if (!activeDuas[from]) return sock.sendMessage(from, { text: '❌ لا يوجد!' });
      clearInterval(activeDuas[from].int);
      delete activeDuas[from];
      return sock.sendMessage(from, { text: '✅ تم الإيقاف!' });
    }
    
    if (['رابط', 'url'].includes(command)) {
      const q = msg.message?.extendedTextMessage?.contextInfo;
      if (!q) return sock.sendMessage(from, { text: '❌ رد على صورة/ملف!' });
      return sock.sendMessage(from, { text: '⏳ قريباً...' });
    }
    
    if (['اختصار', 'short'].includes(command)) {
      if (!text) return sock.sendMessage(from, { text: '❌ اكتب الرابط!' });
      try {
        const r = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(text)}`);
        return sock.sendMessage(from, { text: `✅ تم!\n\n🔗 ${await r.text()}` });
      } catch { return sock.sendMessage(from, { text: '❌ فشل!' }); }
    }
  }
};
