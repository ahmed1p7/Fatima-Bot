// ═══════════════════════════════════════════════════════════════════════════════
// 🖼️ نظام إرسال الصور المباشر - فاطمة بوت
// ═══════════════════════════════════════════════════════════════════════════════

// الرابط الافتراضي للصور
const DEFAULT_IMAGE_URL = 'https://files.catbox.moe/p4mtw3.jpg';

// صور الزعماء (سيتم استبدالها لاحقاً)
const BOSS_IMAGES = {
  'كاساكا': DEFAULT_IMAGE_URL,
  'ملك_المستنقعات': DEFAULT_IMAGE_URL,
  'زعيم_الأورك': DEFAULT_IMAGE_URL,
  'بيرو': DEFAULT_IMAGE_URL,
  'إيغريس': DEFAULT_IMAGE_URL,
  'أنتاريس': DEFAULT_IMAGE_URL,
  'default': DEFAULT_IMAGE_URL
};

// صور أخرى
const IMAGES = {
  profile: DEFAULT_IMAGE_URL,
  clan: DEFAULT_IMAGE_URL,
  territory: DEFAULT_IMAGE_URL,
  box: {
    common: DEFAULT_IMAGE_URL,
    rare: DEFAULT_IMAGE_URL,
    epic: DEFAULT_IMAGE_URL,
    legendary: DEFAULT_IMAGE_URL
  },
  victory: DEFAULT_IMAGE_URL,
  defeat: DEFAULT_IMAGE_URL,
  warning: DEFAULT_IMAGE_URL
};

/**
 * إرسال صورة مباشرة (ليس كمستند)
 * @param {Object} sock - اتصال واتساب
 * @param {String} jid - معرف المستلم
 * @param {String} imageUrl - رابط الصورة أو Buffer
 * @param {String} caption - النص التعريفي
 * @param {Object} options - خيارات إضافية
 */
export async function sendImage(sock, jid, imageUrl, caption = '', options = {}) {
  try {
    const image = imageUrl || DEFAULT_IMAGE_URL;
    
    // إذا كان رابط
    if (typeof image === 'string' && image.startsWith('http')) {
      await sock.sendMessage(jid, {
        image: { url: image },
        caption: caption,
        mimetype: 'image/jpeg',
        ...options
      });
    } 
    // إذا كان Buffer
    else if (Buffer.isBuffer(image)) {
      await sock.sendMessage(jid, {
        image: image,
        caption: caption,
        mimetype: 'image/jpeg',
        ...options
      });
    }
    // إذا كان كائن (URL)
    else if (typeof image === 'object' && image.url) {
      await sock.sendMessage(jid, {
        image: { url: image.url },
        caption: caption,
        mimetype: 'image/jpeg',
        ...options
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ خطأ في إرسال الصورة:', error.message);
    // في حالة الفشل، إرسال النص فقط
    if (caption) {
      await sock.sendMessage(jid, { text: caption });
    }
    return false;
  }
}

/**
 * إرسال صورة من رابط URL
 */
export async function sendImageFromUrl(sock, jid, imageUrl, caption = '') {
  return sendImage(sock, jid, imageUrl, caption);
}

/**
 * إرسال صورة الملف الشخصي
 */
export async function sendProfileImage(sock, jid, playerData, caption) {
  return sendImage(sock, jid, IMAGES.profile, caption);
}

/**
 * إرسال صورة الزعيم
 */
export async function sendBossImage(sock, jid, bossName, caption) {
  const image = BOSS_IMAGES[bossName] || BOSS_IMAGES.default;
  return sendImage(sock, jid, image, caption);
}

/**
 * إرسال صورة الصندوق
 */
export async function sendBoxImage(sock, jid, boxType, caption) {
  const image = IMAGES.box[boxType] || IMAGES.box.common;
  return sendImage(sock, jid, image, caption);
}

/**
 * إرسال صورة النصر
 */
export async function sendVictoryImage(sock, jid, caption) {
  return sendImage(sock, jid, IMAGES.victory, caption);
}

/**
 * إرسال صورة الهزيمة
 */
export async function sendDefeatImage(sock, jid, caption) {
  return sendImage(sock, jid, IMAGES.defeat, caption);
}

/**
 * إرسال صورة تحذيرية
 */
export async function sendWarningImage(sock, jid, caption) {
  return sendImage(sock, jid, IMAGES.warning, caption);
}

/**
 * إرسال صورة الإقليم
 */
export async function sendTerritoryImage(sock, jid, caption) {
  return sendImage(sock, jid, IMAGES.territory, caption);
}

/**
 * إرسال صورة الكلان
 */
export async function sendClanImage(sock, jid, caption) {
  return sendImage(sock, jid, IMAGES.clan, caption);
}

// تصدير الصور للاستخدام
export { DEFAULT_IMAGE_URL, BOSS_IMAGES, IMAGES };
