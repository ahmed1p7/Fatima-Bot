// ═══════════════════════════════════════════════════════════════════════════════
// 🖼️ نظام إرسال الصور - فاطمة بوت v12.0
// يدعم Image Buffer و URL مع ضبط mimetype لعرض الصور مباشرة في الشات
// ═══════════════════════════════════════════════════════════════════════════════

import fetch from 'node-fetch';

// الصورة الافتراضية
const DEFAULT_IMAGE_URL = 'https://files.catbox.moe/p4mtw3.jpg';

// ═══════════════════════════════════════════════════════════════════════════════
// 🖼️ إرسال صورة من URL (تظهر مباشرة في الشات مع معاينة)
// ═══════════════════════════════════════════════════════════════════════════════

export const sendImageFromUrl = async (sock, jid, imageUrl, caption = '', options = {}) => {
  try {
    // استخدام الصورة الافتراضية إذا لم يتم تحديد صورة
    const url = imageUrl || DEFAULT_IMAGE_URL;
    
    // تحميل الصورة
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('فشل تحميل الصورة');
    }
    
    const buffer = await response.buffer();
    
    // إرسال الصورة كـ Image Message مع caption
    // هذا يجعل الصورة تظهر مباشرة في الشات مع معاينة (Preview)
    const message = {
      image: buffer,
      caption: caption,
      jpegThumbnail: await generateThumbnail(buffer), // صورة مصغرة للمعاينة السريعة
      mimetype: 'image/jpeg', // مهم جداً لعرضها كصورة وليس كملف
      contextInfo: {
        forwardingScore: 0,
        isForwarded: false
      },
      ...options
    };
    
    return await sock.sendMessage(jid, message);
  } catch (error) {
    console.error('❌ خطأ في إرسال الصورة:', error.message);
    
    // إرسال الصورة الافتراضية كـ fallback
    try {
      const response = await fetch(DEFAULT_IMAGE_URL);
      const buffer = await response.buffer();
      
      return await sock.sendMessage(jid, {
        image: buffer,
        caption: caption,
        jpegThumbnail: await generateThumbnail(buffer),
        mimetype: 'image/jpeg'
      });
    } catch {
      // إذا فشل كل شيء، أرسل النص فقط
      return await sock.sendMessage(jid, { text: caption || '📷 صورة' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🖼️ إنشاء صورة مصغرة للمعاينة
// ═══════════════════════════════════════════════════════════════════════════════

const generateThumbnail = async (buffer) => {
  try {
    // يمكن استخدام sharp هنا لإنشاء thumbnail
    // لكن للتبسيط نرجع نفس buffer كبداية
    return buffer;
  } catch {
    return buffer;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🖼️ إرسال صورة من Buffer (تظهر مباشرة في الشات مع معاينة)
// ═══════════════════════════════════════════════════════════════════════════════

export const sendImageFromBuffer = async (sock, jid, buffer, caption = '', options = {}) => {
  try {
    const message = {
      image: buffer,
      caption: caption,
      jpegThumbnail: await generateThumbnail(buffer), // صورة مصغرة للمعاينة
      mimetype: 'image/jpeg', // مهم جداً لعرضها كصورة وليس كملف
      contextInfo: {
        forwardingScore: 0,
        isForwarded: false
      },
      ...options
    };
    
    return await sock.sendMessage(jid, message);
  } catch (error) {
    console.error('❌ خطأ في إرسال الصورة:', error.message);
    return await sock.sendMessage(jid, { text: caption || '📷 صورة' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🖼️ إنشاء صورة بروفايل للاعب (ترجع URL للصورة)
// ═══════════════════════════════════════════════════════════════════════════════

export const generateProfileImage = async (player, options = {}) => {
  // حالياً نستخدم الصورة الافتراضية
  // يمكن لاحقاً استخدام canvas لإنشاء صور مخصصة
  return {
    url: DEFAULT_IMAGE_URL,
    caption: formatProfileCaption(player)
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 تنسيق نص البروفايل
// ═══════════════════════════════════════════════════════════════════════════════

const formatProfileCaption = (player) => {
  const hpBar = '▓'.repeat(Math.floor((player.hp / player.maxHp) * 10)) + 
                '░'.repeat(10 - Math.floor((player.hp / player.maxHp) * 10));
  
  let text = `👤 ═══════ ${player.name} ═══════ 👤\n\n`;
  text += `${player.class?.emoji || '⚔️'} الصنف: ${player.class || '-'}\n`;
  text += `⭐ المستوى: ${player.level}\n`;
  text += `❤️ HP: [${hpBar}] ${player.hp}/${player.maxHp}\n`;
  text += `⚔️ ATK: ${player.atk} | 🛡️ DEF: ${player.def}\n`;
  text += `✨ MAG: ${player.mag}\n`;
  text += `💰 الذهب: ${player.gold?.toLocaleString() || 0}\n`;
  text += `🏆 الانتصارات: ${player.wins || 0} | ❌ الخسائر: ${player.losses || 0}\n`;
  
  if (player.clanId) {
    text += `🏰 الكلان: ${player.clanId}\n`;
  }
  
  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 👹 إنشاء صورة زعيم (ترجع URL للصورة)
// ═══════════════════════════════════════════════════════════════════════════════

export const generateBossImage = async (boss, options = {}) => {
  return {
    url: DEFAULT_IMAGE_URL,
    caption: formatBossCaption(boss)
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 تنسيق نص الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

const formatBossCaption = (boss) => {
  const hpPercent = boss.hp / boss.maxHp;
  const hpBar = '█'.repeat(Math.floor(hpPercent * 10)) + 
                '░'.repeat(10 - Math.floor(hpPercent * 10));
  
  let text = `👹 ═══════ ${boss.name} ═══════ 👹\n\n`;
  text += `${boss.emoji} المستوى: ${boss.level}\n`;
  text += `❤️ HP: [${hpBar}] ${Math.floor(hpPercent * 100)}%\n`;
  text += `⚔️ ATK: ${boss.atk} | 🛡️ DEF: ${boss.def}\n`;
  
  if (boss.mag) {
    text += `✨ MAG: ${boss.mag}\n`;
  }
  
  text += `\n🎁 المكافآت:\n`;
  text += `⭐ XP: ${boss.xpReward?.toLocaleString() || 0}\n`;
  text += `💰 ذهب: ${boss.goldReward?.toLocaleString() || 0}\n`;
  
  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 إنشاء صورة صندوق (ترجع URL للصورة)
// ═══════════════════════════════════════════════════════════════════════════════

export const generateBoxImage = async (boxType, contents = null) => {
  return {
    url: DEFAULT_IMAGE_URL,
    caption: formatBoxCaption(boxType, contents)
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 تنسيق نص الصندوق
// ═══════════════════════════════════════════════════════════════════════════════

const formatBoxCaption = (boxType, contents) => {
  const boxEmojis = {
    'خشبي': '📦',
    'حديدي': '🧰',
    'ذهبي': '🎁',
    'أسطوري': '👑'
  };
  
  let text = `${boxEmojis[boxType] || '📦'} ═══════ صندوق ${boxType} ═══════ ${boxEmojis[boxType] || '📦'}\n\n`;
  
  if (contents) {
    text += `📋 المحتويات:\n`;
    if (contents.weapon) {
      text += `⚔️ ${contents.weapon.fullName}\n`;
      text += `   ATK: +${contents.weapon.atk}\n`;
    }
    if (contents.armor) {
      text += `🛡️ ${contents.armor.fullName}\n`;
      text += `   DEF: +${contents.armor.def}\n`;
    }
    if (contents.gold) {
      text += `💰 ${contents.gold} ذهب\n`;
    }
    if (contents.xp) {
      text += `⭐ ${contents.xp} XP\n`;
    }
    if (contents.items) {
      for (const item of contents.items) {
        text += `• ${item}\n`;
      }
    }
  } else {
    text += `🔓 افتح الصندوق لمعرفة المحتويات!\n`;
  }
  
  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🏰 إنشاء صورة كلان (ترجع URL للصورة)
// ═══════════════════════════════════════════════════════════════════════════════

export const generateClanImage = async (clan) => {
  return {
    url: DEFAULT_IMAGE_URL,
    caption: formatClanCaption(clan)
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 تنسيق نص الكلان
// ═══════════════════════════════════════════════════════════════════════════════

const formatClanCaption = (clan) => {
  let text = `🏰 ═══════ ${clan.name} ═══════ 🏰\n\n`;
  text += `🏷️ Tag: #${clan.clanTag || '----'}\n`;
  text += `⭐ المستوى: ${clan.level || 1}\n`;
  text += `👥 الأعضاء: ${clan.members?.length || 0}/50\n`;
  text += `🏆 الانتصارات: ${clan.wins || 0}\n`;
  text += `💰 الخزينة: ${(clan.gold || 0).toLocaleString()}\n`;
  
  if (clan.announcement) {
    text += `\n📢 الإعلان: ${clan.announcement}\n`;
  }
  
  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 تصدير الدوال الرئيسية
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  sendImageFromUrl,
  sendImageFromBuffer,
  generateProfileImage,
  generateBossImage,
  generateBoxImage,
  generateClanImage
};
