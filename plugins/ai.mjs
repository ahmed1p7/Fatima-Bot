// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 أوامر الذكاء الاصطناعي - فاطمة
// ═══════════════════════════════════════════════════════════════════════════════

import { askAI, enableAIForGroup, disableAIForGroup, getAIStatus, learnFromMessage, generateResponse } from '../lib/ai.mjs';

export default {
  name: 'AI',
  commands: ['سؤال', 'ask', 'ai', 'ترجمة', 'translate', 'شرح', 'explain', 'لخص', 'summarize', 'صحح', 'correct', 'أفكار', 'ideas', 'تفعيل_ذكاء', 'اغلاق_ذكاء', 'إيقاف_ذكاء', 'حالة_ذكاء'],
  
  async execute(sock, msg, ctx) {
    const { from, command, args, text, prefix, isGroup, sender } = ctx;
    
    // أوامر التحكم بالذكاء الاصطناعي
    if (['تفعيل_ذكاء'].includes(command)) {
      if (!isGroup) return sock.sendMessage(from, { text: '❌ هذا الأمر يعمل فقط في المجموعات!' });
      enableAIForGroup(from);
      return sock.sendMessage(from, { 
        text: `✅ تم تفعيل الذكاء الاصطناعي "فاطمة" في هذه المجموعة!\n\n🎯 الآن يمكن لفاطمة:\n• التفاعل مع المحادثات\n• الرد على الأسئلة\n• التعلم من الأعضاء\n• تقديم نصائح مخصصة\n\n💡 استخدم ${prefix}اغلاق_ذكاء لإيقافها` 
      });
    }
    
    if (['اغلاق_ذكاء', 'إيقاف_ذكاء'].includes(command)) {
      if (!isGroup) return sock.sendMessage(from, { text: '❌ هذا الأمر يعمل فقط في المجموعات!' });
      disableAIForGroup(from);
      return sock.sendMessage(from, { text: '❌ تم إيقاف الذكاء الاصطناعي في هذه المجموعة.\n💡 استخدم تفعيل_ذكاء لإعادة تشغيلها' });
    }
    
    if (['حالة_ذكاء'].includes(command)) {
      if (!isGroup) return sock.sendMessage(from, { text: '❌ هذا الأمر يعمل فقط في المجموعات!' });
      const status = getAIStatus(from);
      const stateText = status.enabled ? '✅ مفعل' : '❌ مغلق';
      return sock.sendMessage(from, { 
        text: `📊 حالة الذكاء الاصطناعي:\n\nالحالة: ${stateText}\nمستوى فاطمة: ${status.level}\nخبرة فاطمة: ${status.xp} XP` 
      });
    }
    
    // أوامر الذكاء الاصطناعي التقليدية
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
