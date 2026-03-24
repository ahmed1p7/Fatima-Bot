// ═══════════════════════════════════════════════════════════════════════════════
// 📢 معلومات البوت - فاطمة بوت v12.0
// ═══════════════════════════════════════════════════════════════════════════════

import { getDatabase, getRpgData } from '../lib/database.mjs';

const CHANNEL_LINK = 'https://whatsapp.com/channel/0029VbCbgwIKgsNxh9vKb01n';

export default {
  name: 'BotInfo',
  commands: ['بوت', 'bot', 'معلومات', 'info', 'البوت', 'قناة', 'القناة'],

  async execute(sock, msg, ctx) {
    const { from, prefix } = ctx;
    const db = getDatabase();
    const rpgData = getRpgData();
    const up = process.uptime();
    
    const days = Math.floor(up / 86400);
    const hours = Math.floor((up % 86400) / 3600);
    const minutes = Math.floor((up % 3600) / 60);
    const uptime = `${days}d ${hours}h ${minutes}m`;

    const playersCount = Object.keys(rpgData.players || {}).length;
    const clansCount = Object.keys(rpgData.clans || {}).length;
    const messagesCount = db.stats?.messages || 0;
    const commandsCount = db.stats?.commands || 0;

    let text = `🌙 ═══════ فَــاطِــمَــة بَــوت ═══════ 🌙\n\n`;
    
    text += `📊 *معلومات البوت:*\n`;
    text += `   ⭐ الإصدار: 12.0\n`;
    text += `   ⏱️ النشاط: ${uptime}\n`;
    text += `   📊 الأوامر: +200\n\n`;
    
    text += `👥 *الإحصائيات:*\n`;
    text += `   👤 اللاعبين: ${playersCount}\n`;
    text += `   🏰 الكلانات: ${clansCount}\n`;
    text += `   📨 الرسائل: ${messagesCount.toLocaleString()}\n`;
    text += `   ⚡ الأوامر المنفذة: ${commandsCount.toLocaleString()}\n\n`;
    
    text += `🎮 *الأنظمة المتاحة:*\n`;
    text += `   ⚔️ نظام RPG متطور\n`;
    text += `   ⚡ نظام المهارات والقدرات\n`;
    text += `   👹 نظام الزعماء (Solo Leveling)\n`;
    text += `   🏘️ نظام القرية\n`;
    text += `   📜 نظام المهام والإنجازات\n`;
    text += `   🏰 نظام الكلانات والمستوطنات\n`;
    text += `   ⚔️ حروب الكلانات\n`;
    text += `   🛒 السوق المفتوح\n`;
    text += `   🤖 الذكاء الاصطناعي\n\n`;
    
    text += `📢 ═══════ القناة الرسمية ═══════ 📢\n\n`;
    text += `🔗 ${CHANNEL_LINK}\n\n`;
    text += `✨ تابع القناة للحصول على:\n`;
    text += `   • آخر التحديثات\n`;
    text += `   • أخبار البوت\n`;
    text += `   • نصائح وحيل\n`;
    text += `   • إعلانات مهمة\n\n`;
    
    text += `👑 *المطور: zaza*\n`;
    text += `═════════════════════════════════`;

    await sock.sendMessage(from, { 
      text,
      footer: 'فاطمة بوت v12.0 | بواسطة: zaza'
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📢 أمر القناة المختصر
// ═══════════════════════════════════════════════════════════════════════════════

export const channel = {
  name: 'Channel',
  commands: ['قناه', 'channel', 'تابع', 'follow'],

  async execute(sock, msg, ctx) {
    const { from } = ctx;

    let text = `📢 ═══════ القناة الرسمية ═══════ 📢\n\n`;
    text += `🌙 *قناة فاطمة بوت*\n\n`;
    text += `🔗 الرابط:\n${CHANNEL_LINK}\n\n`;
    text += `✨ *مميزات المتابعة:*\n`;
    text += `   ✓ آخر التحديثات والإصدارات\n`;
    text += `   ✓ أخبار البوت الجديدة\n`;
    text += `   ✓ نصائح وإرشادات\n`;
    text += `   ✓ إعلانات الأحداث الخاصة\n\n`;
    text += `🔔 تابع القناة الآن!`;

    await sock.sendMessage(from, { text });
  }
};
