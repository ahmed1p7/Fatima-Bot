// ═══════════════════════════════════════════════════════════════════════════════
// 🖼️ نظام الصور المحسن - فاطمة بوت v13.0 (محدث)
// يدعم إرسال الصور من URL أو Buffer مع fallback للنص
// ═══════════════════════════════════════════════════════════════════════════════

import { fileTypeFromBuffer } from 'file-type'; // اختياري: يمكن إضافته لاحقاً
import { CLASS_IMAGES as DB_CLASS_IMAGES, BOSS_IMAGES as DB_BOSS_IMAGES } from '../database.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 🔗 روابط الصور الافتراضية (يمكن تغييرها)
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_IMAGE_URL = 'https://files.catbox.moe/p4mtw3.jpg';

// صور الأصناف (يمكن تخصيصها من قاعدة البيانات أو ثابتة)
const CLASS_IMAGES = {
  'محارب': DEFAULT_IMAGE_URL,
  'ساحر': DEFAULT_IMAGE_URL,
  'رامي': DEFAULT_IMAGE_URL,
  'شافي': DEFAULT_IMAGE_URL,
  'قاتل': DEFAULT_IMAGE_URL,
  'فارس': DEFAULT_IMAGE_URL,
  'default': DEFAULT_IMAGE_URL
};

// صور الزعماء
const BOSS_IMAGES = {
  'كاساكا': DEFAULT_IMAGE_URL,
  'ملك المستنقعات': DEFAULT_IMAGE_URL,
  'زعيم الأورك': DEFAULT_IMAGE_URL,
  'بيرو': DEFAULT_IMAGE_URL,
  'إيغريس': DEFAULT_IMAGE_URL,
  'أنتاريس': DEFAULT_IMAGE_URL,
  'default': DEFAULT_IMAGE_URL
};

// صور الصناديق
const BOX_IMAGES = {
  'common': DEFAULT_IMAGE_URL,
  'rare': DEFAULT_IMAGE_URL,
  'epic': DEFAULT_IMAGE_URL,
  'legendary': DEFAULT_IMAGE_URL,
  'default': DEFAULT_IMAGE_URL
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * التحقق من صحة الرابط
 * @param {string} url
 * @returns {boolean}
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

/**
 * إرسال صورة مع fallback للنص
 * @param {Object} sock - كائن الـ socket
 * @param {string} jid - معرف المحادثة
 * @param {string|Buffer|null} image - رابط الصورة أو Buffer أو null
 * @param {string} caption - النص أسفل الصورة
 * @param {Object} options - خيارات إضافية (مثل contextInfo, quoted)
 * @returns {Promise<boolean>} نجاح الإرسال
 */
export async function sendImage(sock, jid, image, caption = '', options = {}) {
  try {
    // إذا كان null أو undefined، أرسل النص فقط
    if (!image) {
      if (caption) await sock.sendMessage(jid, { text: caption, ...options });
      return true;
    }

    // إذا كان Buffer
    if (Buffer.isBuffer(image)) {
      await sock.sendMessage(jid, {
        image: image,
        caption: caption,
        mimetype: 'image/jpeg',
        ...options
      });
      return true;
    }

    // إذا كان رابط
    if (typeof image === 'string' && isValidUrl(image)) {
      await sock.sendMessage(jid, {
        image: { url: image },
        caption: caption,
        mimetype: 'image/jpeg',
        ...options
      });
      return true;
    }

    // إذا كان كائن له خاصية url
    if (typeof image === 'object' && image?.url && isValidUrl(image.url)) {
      await sock.sendMessage(jid, {
        image: { url: image.url },
        caption: caption,
        mimetype: 'image/jpeg',
        ...options
      });
      return true;
    }

    // أي شيء آخر - إرسال النص فقط
    if (caption) {
      await sock.sendMessage(jid, { text: caption, ...options });
    }
    return true;

  } catch (error) {
    console.error('❌ خطأ في إرسال الصورة:', error.message);
    // محاولة إرسال النص فقط في حالة الفشل
    if (caption) {
      try {
        await sock.sendMessage(jid, { text: caption, ...options });
      } catch (e) {}
    }
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🖼️ دوال إرسال الصور المتخصصة (للتسهيل)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * إرسال صورة الملف الشخصي للاعب
 * @param {Object} sock
 * @param {string} jid
 * @param {Object} playerData - كائن اللاعب (يحتوي على class)
 * @param {string} caption - النص
 * @returns {Promise<boolean>}
 */
export async function sendProfileImage(sock, jid, playerData, caption) {
  const imageUrl = CLASS_IMAGES[playerData?.class] || CLASS_IMAGES.default;
  return sendImage(sock, jid, imageUrl, caption);
}

/**
 * إرسال صورة الزعيم
 * @param {Object} sock
 * @param {string} jid
 * @param {string} bossName - اسم الزعيم
 * @param {string} caption - النص
 * @returns {Promise<boolean>}
 */
export async function sendBossImage(sock, jid, bossName, caption) {
  const imageUrl = BOSS_IMAGES[bossName] || BOSS_IMAGES.default;
  return sendImage(sock, jid, imageUrl, caption);
}

/**
 * إرسال صورة الصندوق
 * @param {Object} sock
 * @param {string} jid
 * @param {string} boxType - نوع الصندوق (common, rare, epic, legendary)
 * @param {string} caption - النص
 * @returns {Promise<boolean>}
 */
export async function sendBoxImage(sock, jid, boxType, caption) {
  const imageUrl = BOX_IMAGES[boxType] || BOX_IMAGES.default;
  return sendImage(sock, jid, imageUrl, caption);
}

/**
 * إرسال صورة الانتصار
 * @param {Object} sock
 * @param {string} jid
 * @param {string} caption - النص
 * @returns {Promise<boolean>}
 */
export async function sendVictoryImage(sock, jid, caption) {
  return sendImage(sock, jid, DEFAULT_IMAGE_URL, caption);
}

/**
 * إرسال صورة الهزيمة
 * @param {Object} sock
 * @param {string} jid
 * @param {string} caption - النص
 * @returns {Promise<boolean>}
 */
export async function sendDefeatImage(sock, jid, caption) {
  return sendImage(sock, jid, DEFAULT_IMAGE_URL, caption);
}

/**
 * إرسال صورة تحذير
 * @param {Object} sock
 * @param {string} jid
 * @param {string} caption - النص
 * @returns {Promise<boolean>}
 */
export async function sendWarningImage(sock, jid, caption) {
  return sendImage(sock, jid, DEFAULT_IMAGE_URL, caption);
}

/**
 * إرسال صورة الإقليم
 * @param {Object} sock
 * @param {string} jid
 * @param {string} caption - النص
 * @returns {Promise<boolean>}
 */
export async function sendTerritoryImage(sock, jid, caption) {
  return sendImage(sock, jid, DEFAULT_IMAGE_URL, caption);
}

/**
 * إرسال صورة الكلان
 * @param {Object} sock
 * @param {string} jid
 * @param {string} caption - النص
 * @returns {Promise<boolean>}
 */
export async function sendClanImage(sock, jid, caption) {
  return sendImage(sock, jid, DEFAULT_IMAGE_URL, caption);
}

/**
 * إرسال صورة من رابط (اختصار)
 */
export async function sendImageFromUrl(sock, jid, imageUrl, caption = '') {
  return sendImage(sock, jid, imageUrl, caption);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 إرسال مع صورة مصغرة (Thumbnail) – تستخدم externalAdReply
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * إرسال رسالة نصية مع صورة مصغرة كـ externalAdReply
 * @param {Object} sock
 * @param {string} jid
 * @param {string} text - النص الأساسي
 * @param {string} imageUrl - رابط الصورة المصغرة
 * @param {string} title - العنوان
 * @param {string} body - النص الفرعي
 * @returns {Promise<Object>}
 */
export async function sendWithThumbnail(sock, jid, text, imageUrl, title, body) {
  return await sock.sendMessage(jid, {
    text,
    contextInfo: {
      externalAdReply: {
        title: title || 'فاطمة بوت',
        body: body || '',
        thumbnailUrl: isValidUrl(imageUrl) ? imageUrl : DEFAULT_IMAGE_URL,
        sourceUrl: 'https://whatsapp.com/channel/0029VbCbgwIKgsNxh9vKb01n',
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 تصدير الثوابت والكائنات
// ═══════════════════════════════════════════════════════════════════════════════

export { DEFAULT_IMAGE_URL, CLASS_IMAGES, BOSS_IMAGES, BOX_IMAGES };

export default {
  sendImage,
  sendImageFromUrl,
  sendProfileImage,
  sendBossImage,
  sendBoxImage,
  sendVictoryImage,
  sendDefeatImage,
  sendWarningImage,
  sendTerritoryImage,
  sendClanImage,
  sendWithThumbnail,
  DEFAULT_IMAGE_URL,
  CLASS_IMAGES,
  BOSS_IMAGES,
  BOX_IMAGES
};
