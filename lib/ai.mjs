// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 الذكاء الاصطناعي
// ═══════════════════════════════════════════════════════════════════════════════

import ZAI from 'z-ai-web-dev-sdk';

let zai = null;

export const initAI = async () => {
  try { zai = await ZAI.create(); console.log('✅ AI جاهزة'); return true; }
  catch (e) { console.log('⚠️ AI:', e.message); return false; }
};

export const askAI = async (q, ctx = '') => {
  if (!zai) return { error: true, msg: 'AI غير متاحة' };
  try {
    const res = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'أنتِ فاطمة، مساعدة ذكية عربية. تجيبين باختصار وذكاء.' },
        { role: 'user', content: ctx ? ctx + '\n' + q : q }
      ],
      temperature: 0.7, max_tokens: 300
    });
    return { error: false, res: res.choices?.[0]?.message?.content };
  } catch (e) { return { error: true, msg: e.message }; }
};
