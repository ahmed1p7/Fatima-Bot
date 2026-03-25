// ═══════════════════════════════════════════════════════════════════════════════
// 🖼️ نظام الصور المحسن - فاطمة بوت v13.0
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// 🔗 روابط الصور الافتراضية
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_IMAGE_URL = 'https://files.catbox.moe/p4mtw3.jpg';

const BOSS_IMAGES = {
  'كاساكا': DEFAULT_IMAGE_URL,
  'ملك المستنقعات': DEFAULT_IMAGE_URL,
  'زعيم الأورك': DEFAULT_IMAGE_URL,
  'بيرو': DEFAULT_IMAGE_URL,
  'إيغريس': DEFAULT_IMAGE_URL,
  'أنتاريس': DEFAULT_IMAGE_URL,
  'default': DEFAULT_IMAGE_URL
};

const CLASS_IMAGES = {
  'محارب': DEFAULT_IMAGE_URL,
  'ساحر': DEFAULT_IMAGE_URL,
  'رامي': DEFAULT_IMAGE_URL,
  'شافي': DEFAULT_IMAGE_URL,
  'قاتل': DEFAULT_IMAGE_URL,
  'فارس': DEFAULT_IMAGE_URL,
  'default': DEFAULT_IMAGE_URL
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 دالة إرسال الصورة
// ═══════════════════════════════════════════════════════════════════════════════

export async function sendImage(sock, jid, imageUrl, caption = '', options = {}) {
  try {
    const image = imageUrl || DEFAULT_IMAGE_URL;
    
    // إذا كان رابط
    if (typeof image === 'string' && (image.startsWith('http') || image.startsWith('https'))) {
      await sock.sendMessage(jid, {
        image: { url: image },
        caption: caption,
        mimetype: 'image/jpeg',
        ...options
      });
    }
    // إذا كان Buffer
    else if (Buffer?.isBuffer?.(image)) {
      await sock.sendMessage(jid, {
        image: image,
        caption: caption,
        mimetype: 'image/jpeg',
        ...options
      });
    }
    // إذا كان كائن
    else if (typeof image === 'object' && image?.url) {
      await sock.sendMessage(jid, {
        image: { url: image.url },
        caption: caption,
        mimetype: 'image/jpeg',
        ...options
      });
    }
    // إذا لم يكن شيء، أرسل النص فقط
    else {
      if (caption) {
        await sock.sendMessage(jid, { text: caption });
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ خطأ في إرسال الصورة:', error.message);
    // في حالة الفشل، إرسال النص فقط
    if (caption) {
      try {
        await sock.sendMessage(jid, { text: caption });
      } catch {}
    }
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🖼️ دوال إرسال الصور المتخصصة
// ═══════════════════════════════════════════════════════════════════════════════

export async function sendImageFromUrl(sock, jid, imageUrl, caption = '') {
  return sendImage(sock, jid, imageUrl, caption);
}

export async function sendProfileImage(sock, jid, playerData, caption) {
  const imageUrl = CLASS_IMAGES[playerData?.class] || CLASS_IMAGES.default;
  return sendImage(sock, jid, imageUrl, caption);
}

export async function sendBossImage(sock, jid, bossName, caption) {
  const image = BOSS_IMAGES[bossName] || BOSS_IMAGES.default;
  return sendImage(sock, jid, image, caption);
}

export async function sendBoxImage(sock, jid, boxType, caption) {
  const boxImages = {
    common: DEFAULT_IMAGE_URL,
    rare: DEFAULT_IMAGE_URL,
    epic: DEFAULT_IMAGE_URL,
    legendary: DEFAULT_IMAGE_URL
  };
  const image = boxImages[boxType] || DEFAULT_IMAGE_URL;
  return sendImage(sock, jid, image, caption);
}

export async function sendVictoryImage(sock, jid, caption) {
  return sendImage(sock, jid, DEFAULT_IMAGE_URL, caption);
}

export async function sendDefeatImage(sock, jid, caption) {
  return sendImage(sock, jid, DEFAULT_IMAGE_URL, caption);
}

export async function sendWarningImage(sock, jid, caption) {
  return sendImage(sock, jid, DEFAULT_IMAGE_URL, caption);
}

export async function sendTerritoryImage(sock, jid, caption) {
  return sendImage(sock, jid, DEFAULT_IMAGE_URL, caption);
}

export async function sendClanImage(sock, jid, caption) {
  return sendImage(sock, jid, DEFAULT_IMAGE_URL, caption);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 إرسال مع صورة مصغرة (Thumbnail)
// ═══════════════════════════════════════════════════════════════════════════════

export async function sendWithThumbnail(sock, jid, text, imageUrl, title, body) {
  return await sock.sendMessage(jid, {
    text,
    contextInfo: {
      externalAdReply: {
        title: title || 'فاطمة بوت',
        body: body || '',
        thumbnailUrl: imageUrl || DEFAULT_IMAGE_URL,
        sourceUrl: 'https://whatsapp.com/channel/0029VbCbgwIKgsNxh9vKb01n',
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 تصدير الصور للاستخدام
// ═══════════════════════════════════════════════════════════════════════════════

export { DEFAULT_IMAGE_URL, BOSS_IMAGES, CLASS_IMAGES };

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
  BOSS_IMAGES,
  CLASS_IMAGES
};
