// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 أوامر الذكاء الاصطناعي
// ═══════════════════════════════════════════════════════════════════════════════

import { askAI } from '../lib/ai.mjs';

export default {
  name: 'AI',
  commands: ['سؤال', 'ask', 'ai', 'ترجمة', 'translate', 'شرح', 'explain', 'لخص', 'summarize', 'صحح', 'correct', 'أفكار', 'ideas'],
  
  async execute(sock, msg, ctx) {
    const { from, command, args, text, prefix } = ctx;
    
    if (['سؤال', 'ask', 'ai'].includes(command)) {
      if (!text) return sock.sendMessage(from, { text: `❌ اكتب سؤالك!\n💡 ${prefix}سؤال ما هو الذكاء؟` });
      await sock.sendMessage(from, { text: '🤔 جاري التفكير...' });
      const r = await askAI(text);
      return sock.sendMessage(from, { text: r.error ? '❌ ' + r.msg : '🤖 ' + r.res });
    }
    
    if (['ترجمة', 'translate'].includes(command)) {
      if (!text) return sock.sendMessage(from, { text: '❌ اكتب النص!' });
      const r = await askAI(`ترجم: ${text}`);
      return sock.sendMessage(from, { text: r.error ? '❌ خطأ' : '📝 ' + r.res });
    }
    
    if (['شرح', 'explain'].includes(command)) {
      if (!text) return sock.sendMessage(from, { text: '❌ اكتب الموضوع!' });
      await sock.sendMessage(from, { text: '📚 جاري الشرح...' });
      const r = await askAI(`اشرح بالتفصيل: ${text}`);
      return sock.sendMessage(from, { text: r.error ? '❌ خطأ' : '📚 ' + r.res });
    }
    
    if (['لخص', 'summarize'].includes(command)) {
      if (!text) return sock.sendMessage(from, { text: '❌ اكتب النص!' });
      const r = await askAI(`لخص: ${text}`);
      return sock.sendMessage(from, { text: r.error ? '❌ خطأ' : '📋 ' + r.res });
    }
    
    if (['صحح', 'correct'].includes(command)) {
      if (!text) return sock.sendMessage(from, { text: '❌ اكتب النص!' });
      const r = await askAI(`صحح الأخطاء: ${text}`);
      return sock.sendMessage(from, { text: r.error ? '❌ خطأ' : '✏️ ' + r.res });
    }
    
    if (['أفكار', 'ideas'].includes(command)) {
      if (!text) return sock.sendMessage(from, { text: '❌ اكتب الموضوع!' });
      const r = await askAI(`أعطني 5 أفكار إبداعية عن: ${text}`);
      return sock.sendMessage(from, { text: r.error ? '❌ خطأ' : '💡 ' + r.res });
    }
  }
};
