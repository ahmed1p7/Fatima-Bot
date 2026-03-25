// ═══════════════════════════════════════════════════════════════════════════════
// 🖼️ نظام عرض الصور المباشر - فاطمة بوت v12.0
// يتضمن: إرسال الصور كـ image بدلاً من document
// ═══════════════════════════════════════════════════════════════════════════════

import { setTimeout as sleep } from 'timers/promises';

// ═══════════════════════════════════════════════════════════════════════════════
// 🔗 روابط الصور الافتراضية
// ═══════════════════════════════════════════════════════════════════════════════

export const IMAGE_URLS = {
  // صور الأصناف
  classes: {
    'محارب': 'https://files.catbox.moe/p4mtw3.jpg',
    'ساحر': 'https://files.catbox.moe/p4mtw3.jpg',
    'رامي': 'https://files.catbox.moe/p4mtw3.jpg',
    'شافي': 'https://files.catbox.moe/p4mtw3.jpg',
    'قاتل': 'https://files.catbox.moe/p4mtw3.jpg',
    'فارس': 'https://files.catbox.moe/p4mtw3.jpg'
  },
  
  // صور الزعماء
  bosses: {
    'kaska': 'https://files.catbox.moe/p4mtw3.jpg',
    'orc_king': 'https://files.catbox.moe/p4mtw3.jpg',
    'ant_king': 'https://files.catbox.moe/p4mtw3.jpg',
    'igrys': 'https://files.catbox.moe/p4mtw3.jpg',
    'dragon': 'https://files.catbox.moe/p4mtw3.jpg',
    'swamp_king': 'https://files.catbox.moe/p4mtw3.jpg',
    'default': 'https://files.catbox.moe/p4mtw3.jpg'
  },
  
  // صور الملف الشخصي
  profile: {
    default: 'https://files.catbox.moe/p4mtw3.jpg',
    warrior: 'https://files.catbox.moe/p4mtw3.jpg',
    mage: 'https://files.catbox.moe/p4mtw3.jpg'
  },
  
  // صور الكلانات
  clan: {
    default: 'https://files.catbox.moe/p4mtw3.jpg',
    war: 'https://files.catbox.moe/p4mtw3.jpg'
  },
  
  // صور الأقاليم
  territory: {
    gold_mine: 'https://files.catbox.moe/p4mtw3.jpg',
    crystal_cave: 'https://files.catbox.moe/p4mtw3.jpg',
    dark_forest: 'https://files.catbox.moe/p4mtw3.jpg',
    dragon_peak: 'https://files.catbox.moe/p4mtw3.jpg',
    ancient_ruins: 'https://files.catbox.moe/p4mtw3.jpg',
    default: 'https://files.catbox.moe/p4mtw3.jpg'
  },
  
  // صور الصناديق
  boxes: {
    'خشبي': 'https://files.catbox.moe/p4mtw3.jpg',
    'حديدي': 'https://files.catbox.moe/p4mtw3.jpg',
    'ذهبي': 'https://files.catbox.moe/p4mtw3.jpg'
  },
  
  // صور عامة
  general: {
    logo: 'https://files.catbox.moe/p4mtw3.jpg',
    banner: 'https://files.catbox.moe/p4mtw3.jpg'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 دالة إرسال الصورة كـ image (ليس document)
// ═══════════════════════════════════════════════════════════════════════════════

export const sendImage = async (sock, jid, options) => {
  const {
    url,           // رابط الصورة
    buffer,        // أو Buffer للصورة
    caption = '',  // النص أسفل الصورة
    quoted = null, // الرد على رسالة
    contextInfo = null // معلومات إضافية للعرض
  } = options;

  try {
    // إرسال الصورة من URL
    if (url) {
      const message = {
        image: { url },
        caption,
        mimetype: 'image/jpeg',
        ...(contextInfo && { contextInfo })
      };

      return await sock.sendMessage(jid, message, { quoted });
    }

    // إرسال الصورة من Buffer
    if (buffer) {
      const message = {
        image: buffer,
        caption,
        mimetype: 'image/jpeg',
        ...(contextInfo && { contextInfo })
      };

      return await sock.sendMessage(jid, message, { quoted });
    }

    throw new Error('يجب توفير url أو buffer');

  } catch (error) {
    console.error('❌ خطأ في إرسال الصورة:', error.message);
    
    // إرسال النص فقط في حالة الفشل
    if (caption) {
      return await sock.sendMessage(jid, { text: caption }, { quoted });
    }
    
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🖼️ إرسال صورة الملف الشخصي
// ═══════════════════════════════════════════════════════════════════════════════

export const sendProfileImage = async (sock, jid, player, options = {}) => {
  const { RPG } = await import('./rpg.mjs');
  const classEmoji = RPG.classes[player.class]?.emoji || '🎮';
  const classData = RPG.classes[player.class];
  
  // الحصول على رابط الصورة المناسب
  const imageUrl = IMAGE_URLS.classes[player.class] || IMAGE_URLS.profile.default;
  
  // تنسيق النص
  const caption = formatPlayerCaption(player, classData, classEmoji);
  
  // معلومات السياق
  const contextInfo = {
    externalAdReply: {
      title: `${classEmoji} ${player.name} - Lv.${player.level}`,
      body: `${player.class} | ⚔️${player.atk} 🛡️${player.def}`,
      thumbnailUrl: imageUrl,
      sourceUrl: 'https://whatsapp.com/channel/0029VbCbgwIKgsNxh9vKb01n',
      mediaType: 1,
      renderLargerThumbnail: true
    }
  };
  
  return await sendImage(sock, jid, {
    url: imageUrl,
    caption,
    contextInfo,
    quoted: options.quoted
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 👹 إرسال صورة الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

export const sendBossImage = async (sock, jid, boss, options = {}) => {
  const imageUrl = IMAGE_URLS.bosses[boss.id] || IMAGE_URLS.bosses.default;
  
  const caption = `@
━─━••❁⊰｢❀｣⊱❁••━─━

👹 • • ✤ ${boss.name} ✤ • • 👹

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ 🏷️ النوع: ${boss.type}
│ ⭐ المستوى: ${boss.level}
│ ❤️ HP: ${boss.hp?.toLocaleString() || '???'}
│ ⚔️ ATK: ${boss.atk || '???'}
│ 🛡️ DEF: ${boss.def || '???'}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

${options.additionalText || ''}

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`;

  const contextInfo = {
    externalAdReply: {
      title: `${boss.emoji} ${boss.name}`,
      body: `زعيم ${boss.type} - المستوى ${boss.level}`,
      thumbnailUrl: imageUrl,
      sourceUrl: 'https://whatsapp.com/channel/0029VbCbgwIKgsNxh9vKb01n',
      mediaType: 1,
      renderLargerThumbnail: true
    }
  };
  
  return await sendImage(sock, jid, {
    url: imageUrl,
    caption,
    contextInfo,
    quoted: options.quoted
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🏰 إرسال صورة الكلان
// ═══════════════════════════════════════════════════════════════════════════════

export const sendClanImage = async (sock, jid, clan, options = {}) => {
  const imageUrl = options.isWar ? IMAGE_URLS.clan.war : IMAGE_URLS.clan.default;
  
  const caption = `@
━─━••❁⊰｢❀｣⊱❁••━─━

🏰 • • ✤ ${clan.name} ✤ • • 🏰

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ 🏷️ Tag: #${clan.clanTag}
│ ⭐ المستوى: ${clan.level || 1}
│ 👥 الأعضاء: ${clan.members?.length || 1}
│ 🏆 الانتصارات: ${clan.wins || 0}
│ ❌ الخسائر: ${clan.losses || 0}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

💰 الموارد:
│ الذهب: ${(clan.resources?.gold || clan.gold || 0).toLocaleString()}
│ الإكسير: ${(clan.resources?.elixir || 0).toLocaleString()}

${options.additionalText || ''}

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`;

  const contextInfo = {
    externalAdReply: {
      title: `🏰 ${clan.name} #${clan.clanTag}`,
      body: `Lv.${clan.level || 1} | ${clan.members?.length || 1} عضو`,
      thumbnailUrl: imageUrl,
      sourceUrl: 'https://whatsapp.com/channel/0029VbCbgwIKgsNxh9vKb01n',
      mediaType: 1
    }
  };
  
  return await sendImage(sock, jid, {
    url: imageUrl,
    caption,
    contextInfo,
    quoted: options.quoted
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ إرسال صورة الإقليم
// ═══════════════════════════════════════════════════════════════════════════════

export const sendTerritoryImage = async (sock, jid, territory, options = {}) => {
  const imageUrl = IMAGE_URLS.territory[territory.type] || IMAGE_URLS.territory.default;
  
  const ownerText = territory.ownerClan 
    ? `🏰 المالك: ${options.clanName || 'كلان غير معروف'}`
    : '🏳️ غير محتل';
  
  const guardianText = territory.guardian
    ? `\n👹 الحارس: ${territory.guardian.name} (Lv.${territory.guardian.level})`
    : '';
  
  const caption = `@
━─━••❁⊰｢❀｣⊱❁••━─━

🗺️ • • ✤ ${territory.name} ✤ • • 🗺️

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ 📍 النوع: ${territory.typeName || territory.type}
│ ${ownerText}${guardianText}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

📦 الإنتاج اليومي:
│ 💰 ${(territory.production?.gold || 0).toLocaleString()} ذهب
│ ⚗️ ${(territory.production?.elixir || 0).toLocaleString()} إكسير
│ 🪵 ${(territory.production?.wood || 0).toLocaleString()} خشب

🛡️ الحامية: ${territory.garrison?.total || 0} جندي

${options.additionalText || ''}

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`;

  const contextInfo = {
    externalAdReply: {
      title: `🗺️ ${territory.name}`,
      body: territory.ownerClan ? `محتول من كلان` : 'متاح للاحتلال',
      thumbnailUrl: imageUrl,
      sourceUrl: 'https://whatsapp.com/channel/0029VbCbgwIKgsNxh9vKb01n',
      mediaType: 1
    }
  };
  
  return await sendImage(sock, jid, {
    url: imageUrl,
    caption,
    contextInfo,
    quoted: options.quoted
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 إرسال صورة الصندوق
// ═══════════════════════════════════════════════════════════════════════════════

export const sendBoxImage = async (sock, jid, boxType, contents, options = {}) => {
  const imageUrl = IMAGE_URLS.boxes[boxType] || IMAGE_URLS.general.banner;
  
  let contentsText = '📋 المحتويات:\n';
  
  if (contents.weapon) {
    contentsText += `⚔️ ${contents.weapon.fullName}\n`;
    contentsText += `   ATK: +${contents.weapon.atk}\n`;
  }
  if (contents.armor) {
    contentsText += `🛡️ ${contents.armor.fullName}\n`;
    contentsText += `   DEF: +${contents.armor.def}\n`;
  }
  if (contents.gold) {
    contentsText += `💰 ${contents.gold} ذهب\n`;
  }
  if (contents.xp) {
    contentsText += `⭐ ${contents.xp} XP\n`;
  }
  
  const caption = `@
━─━••❁⊰｢❀｣⊱❁••━─━

📦 • • ✤ صندوق ${boxType} ✤ • • 📦

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
${contentsText}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`;

  return await sendImage(sock, jid, {
    url: imageUrl,
    caption,
    quoted: options.quoted
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════════════

const formatPlayerCaption = (player, classData, classEmoji) => {
  const { healthBar, xpForLevel } = await import('./rpg.mjs');
  
  const hpBar = healthBar(player.hp, player.maxHp);
  const xpBar = healthBar(player.xp, xpForLevel(player.level), 10);
  
  return `@
━─━••❁⊰｢❀｣⊱❁••━─━

${classEmoji} • • ✤ ${player.name} ✤ • • ${classEmoji}

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ 🎖️ المستوى: ${player.level}
│ ⭐ XP: [${xpBar}] ${player.xp}/${xpForLevel(player.level)}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

❤️ الصحة: ${player.hp}/${player.maxHp}
│ [${hpBar}]

⚡ الطاقة: ${player.stamina}/${player.maxStamina || 10}

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

📊 الإحصائيات:
│ ⚔️ هجوم: ${player.atk}
│ 🛡️ دفاع: ${player.def}
│ ✨ سحر: ${player.mag}

💰 الذهب: ${(player.gold || 0).toLocaleString()}
🏆 الانتصارات: ${player.wins || 0}

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 إرسال مع صورة مصغرة (Thumbnail)
// ═══════════════════════════════════════════════════════════════════════════════

export const sendWithThumbnail = async (sock, jid, text, imageUrl, title, body) => {
  return await sock.sendMessage(jid, {
    text,
    contextInfo: {
      externalAdReply: {
        title,
        body,
        thumbnailUrl: imageUrl,
        sourceUrl: 'https://whatsapp.com/channel/0029VbCbgwIKgsNxh9vKb01n',
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  });
};

export default {
  sendImage,
  sendProfileImage,
  sendBossImage,
  sendClanImage,
  sendTerritoryImage,
  sendBoxImage,
  sendWithThumbnail,
  IMAGE_URLS
};
