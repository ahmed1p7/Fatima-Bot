// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 الذكاء الاصطناعي - فاطمة
// ═══════════════════════════════════════════════════════════════════════════════

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDatabase, getRpgData } from './database.mjs';

let genAI = null;
let model = null;
const aiContexts = new Map(); // تخزين سياق المحادثات لكل مجموعة
const memberProfiles = new Map(); // تخزين ملفات الأعضاء واهتماماتهم

// إعدادات الذكاء الاصطناعي لكل مجموعة
const groupAISettings = new Map();

export const initAI = async () => {
  try { 
    const apiKey = "AIzaSyCNJz0IYM8QvxHzvg7aviCXjvPbJhngKw8";
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-pro" });
    console.log('✅ AI جاهزة - فاطمة مستعدة!'); 
    return true; 
  }
  catch (e) { 
    console.log('⚠️ AI:', e.message); 
    return false; 
  }
};

// الحصول على إعدادات المجموعة
const getGroupSettings = (groupId) => {
  if (!groupAISettings.has(groupId)) {
    groupAISettings.set(groupId, { enabled: false, level: 1, xp: 0 });
  }
  return groupAISettings.get(groupId);
};

// حفظ إعدادات المجموعة
const saveGroupSettings = (groupId, settings) => {
  groupAISettings.set(groupId, settings);
};

// تعلم من رسالة العضو
export const learnFromMessage = (senderId, senderName, message, groupId) => {
  const lowerMsg = message.toLowerCase();
  
  // تحليل اهتمامات العضو
  let interests = [];
  if (lowerMsg.includes('قتال') || lowerMsg.includes('حرب') || lowerMsg.includes('pvp')) {
    interests.push('combat');
  }
  if (lowerMsg.includes('تجارة') || lowerMsg.includes('ذهب') || lowerMsg.includes('سوق')) {
    interests.push('trade');
  }
  if (lowerMsg.includes('كلان') || lowerMsg.includes('تحدي') || lowerMsg.includes('حلف')) {
    interests.push('clan');
  }
  if (lowerMsg.includes('مستوى') || lowerMsg.includes('xp') || lowerMsg.includes('ترقية')) {
    interests.push('progression');
  }
  if (lowerMsg.includes('معدات') || lowerMsg.includes('سلاح') || lowerMsg.includes('درع')) {
    interests.push('equipment');
  }

  // تحديث ملف العضو
  if (!memberProfiles.has(senderId)) {
    memberProfiles.set(senderId, {
      name: senderName,
      interests: {},
      messagesCount: 0,
      lastActive: Date.now()
    });
  }

  const profile = memberProfiles.get(senderId);
  profile.messagesCount++;
  profile.lastActive = Date.now();

  // زيادة الاهتمامات
  interests.forEach(interest => {
    profile.interests[interest] = (profile.interests[interest] || 0) + 1;
  });

  // تحديث السياق للمجموعة
  if (!aiContexts.has(groupId)) {
    aiContexts.set(groupId, []);
  }
  const context = aiContexts.get(groupId);
  context.push({ senderId, senderName, message, timestamp: Date.now() });
  
  // الاحتفاظ بآخر 10 رسائل فقط
  if (context.length > 10) {
    context.shift();
  }
};

// توليد رد ذكي بناءً على السياق
export const generateResponse = async (message, groupId, senderId, senderName, prefix = '.') => {
  const settings = getGroupSettings(groupId);
  
  // إذا كان الذكاء مغلقاً في هذه المجموعة
  if (!settings.enabled) return null;

  const msgBody = message.body || '';
  const isCommand = msgBody.startsWith(prefix) || msgBody.startsWith('.') || msgBody.startsWith('!');
  
  // عدم الرد على الأوامر مباشرة
  if (isCommand) return null;

  // فرصة عشوائية للرد (15% لزيادة التفاعل)
  const randomChance = Math.random();
  if (randomChance > 0.15) return null;

  // الحصول على السياق
  const context = aiContexts.get(groupId) || [];
  const contextText = context.map(c => `${c.senderName}: ${c.message}`).join('\n');

  // تحليل نوع الرسالة
  const lowerMsg = msgBody.toLowerCase();
  let prompt = '';

  if (lowerMsg.includes('مرحبا') || lowerMsg.includes('هلا') || lowerMsg.includes('سلام') || lowerMsg.includes('اهلين')) {
    prompt = `رد بسيط وودي على التحية باللهجة العربية العامية، اسم المرسل: ${senderName}`;
  } else if (lowerMsg.includes('شكرا') || lowerMsg.includes('thanks') || lowerMsg.includes('مشكور')) {
    prompt = `رد لطيف على الشكر باللهجة العربية`;
  } else if (lowerMsg.includes('فوز') || lowerMsg.includes('ربح') || lowerMsg.includes('win')) {
    prompt = `تهنئة حماسية للفوز في لعبة، استخدم إيموجيز 🎉🏆`;
  } else if (lowerMsg.includes('خسر') || lowerMsg.includes('انهزم')) {
    prompt = `رسالة تشجيعية للخاسر في لعبة، استخدم إيموجيز 💪😊`;
  } else if (lowerMsg.includes('كيف') || lowerMsg.includes('شنو') || lowerMsg.includes('واش') || lowerMsg.includes('ما هو') || lowerMsg.includes('ماذا')) {
    // سؤال عام - استخدم AI
    try {
      const r = await askAI(`${msgBody} - رد باختصار وباللهجة العربية الودية، اسم السائل: ${senderName}`);
      if (!r.error && r.res) return r.res;
    } catch {}
    return null;
  } else if (contextText) {
    // رد بناءً على سياق المحادثة
    prompt = `المحادثة:\n${contextText}\n\n${senderName} يقول: ${msgBody}\n\nرد رد طبيعي قصير باللهجة العربية`;
  } else {
    return null;
  }

  try {
    const r = await askAI(prompt);
    if (!r.error && r.res) {
      // زيادة خبرة فاطمة
      settings.xp = (settings.xp || 0) + 5;
      if (settings.xp >= settings.level * 100) {
        settings.level++;
        settings.xp = 0;
        console.log(`🎉 فاطمة وصلت المستوى ${settings.level} في مجموعة ${groupId}`);
      }
      saveGroupSettings(groupId, settings);
      return r.res;
    }
  } catch (e) {
    console.log('⚠️ خطأ في AI:', e.message);
  }
  
  return null;
};

// الحصول على نصيحة مخصصة للاعب
export const getPersonalizedAdvice = async (playerId, playerName) => {
  const profile = memberProfiles.get(playerId);
  if (!profile) return null;

  // تحديد الاهتمام الرئيسي
  const topInterest = Object.entries(profile.interests)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  let adviceTopic = '';
  switch (topInterest) {
    case 'combat': adviceTopic = 'نصائح قتالية وتحسين الأداء في المعارك'; break;
    case 'trade': adviceTopic = 'نصائح تجارية وكسب الذهب'; break;
    case 'clan': adviceTopic = 'نصائح لإدارة الكلانات والتحالفات'; break;
    case 'progression': adviceTopic = 'طرق رفع المستوى بسرعة'; break;
    case 'equipment': adviceTopic = 'أفضل المعدات والترقيات'; break;
    default: adviceTopic = 'نصائح عامة للعبة';
  }

  const r = await askAI(`أعطي نصيحة قصيرة ومفيدة لـ ${playerName} عن: ${adviceTopic}`);
  return r.error ? null : r.res;
};

// حدث حرب الكلان
export const onWarEvent = async (eventType, clanName, data) => {
  const settings = getGroupSettings(data.groupId);
  if (!settings.enabled) return;

  let message = '';
  if (eventType === 'war_win') {
    message = `🎉 مبروك يا ${clanName}! فوز رائع في الحرب! أنتم أساطير! 🏆⚔️`;
  } else if (eventType === 'war_loss') {
    message = `💪 لا بأس يا ${clanName}! الحرب جاية وراية، المرة الجاية بتنصروا! حاولوا تركزوا أكثر!`;
  } else if (eventType === 'war_draw') {
    message = `⚖️ تعادل قوي يا ${clanName}! المعركة كانت نار! 🔥`;
  }

  if (message) {
    try {
      const { makeWASocket } = await import('@whiskeysockets/baileys');
      // سيتم إرسال الرسالة من خلال البوت الرئيسي
      return message;
    } catch {}
  }
};

export const askAI = async (q, ctx = '') => {
  if (!model) return { error: true, msg: 'AI غير متاحة' };
  try {
    const systemPrompt = 'أنتِ فاطمة، مساعدة ذكية عربية ودودة. تتحدثين باللهجة العربية العامية أحياناً. تجيبين باختصار وذكاء. تحبين الألعاب والكلانات وتساعد اللاعبين.';
    const fullPrompt = ctx ? `${systemPrompt}\n\n${ctx}\n${q}` : `${systemPrompt}\n\n${q}`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    return { error: false, res: text };
  } catch (e) { 
    return { error: true, msg: e.message }; 
  }
};

// تصدير دوال الإدارة
export const enableAIForGroup = (groupId) => {
  const settings = getGroupSettings(groupId);
  settings.enabled = true;
  saveGroupSettings(groupId, settings);
  console.log(`✅ تم تفعيل الذكاء الاصطناعي في المجموعة: ${groupId}`);
};

export const disableAIForGroup = (groupId) => {
  const settings = getGroupSettings(groupId);
  settings.enabled = false;
  saveGroupSettings(groupId, settings);
  console.log(`❌ تم إيقاف الذكاء الاصطناعي في المجموعة: ${groupId}`);
};

export const getAIStatus = (groupId) => {
  const settings = getGroupSettings(groupId);
  return {
    enabled: settings.enabled,
    level: settings.level,
    xp: settings.xp
  };
};
