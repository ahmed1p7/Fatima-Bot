// ═══════════════════════════════════════════════════════════════════════════════
// 🛒 نظام السوق المفتوح - فاطمة بوت v1.0 (محدث)
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';

// قناة السوق للإعلانات (يمكن تغييرها)
export const MARKET_CHANNEL = '120363408713799197@newsletter';

// نسبة العمولة (5%)
export const MARKET_FEE = 0.05;

// الحد الأقصى للمخزون (سلاح + درع)
export const MAX_INVENTORY_ITEMS = 50;

// ═══════════════════════════════════════════════════════════════════════════════
// توليد كود شراء فريد (مع التحقق من عدم التكرار)
// ═══════════════════════════════════════════════════════════════════════════════
export const generatePurchaseCode = () => {
  const data = getRpgData();
  const existingCodes = new Set(Object.keys(data.market?.storage || {}));
  
  let code;
  do {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    code = 'B-';
    for (let i = 0; i < 6; i++) { // 6 أحرف بدلاً من 3
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (existingCodes.has(code));
  
  return code;
};

// ═══════════════════════════════════════════════════════════════════════════════
// تنظيف العروض المنتهية (تُستدعى دورياً)
// ═══════════════════════════════════════════════════════════════════════════════
export const cleanExpiredOffers = () => {
  const data = getRpgData();
  if (!data.market?.storage) return 0;
  
  const now = Date.now();
  let cleaned = 0;
  
  for (const [code, offer] of Object.entries(data.market.storage)) {
    if (offer.expiresAt < now) {
      // إعادة العنصر للبائع
      const seller = data.players?.[offer.sellerId];
      if (seller) {
        if (offer.item.type === 'weapon') {
          seller.weapons = seller.weapons || [];
          seller.weapons.push(offer.item);
        } else {
          seller.armors = seller.armors || [];
          seller.armors.push(offer.item);
        }
      }
      delete data.market.storage[code];
      cleaned++;
    }
  }
  
  // تحديث قائمة العروض النشطة
  data.market.offers = Object.values(data.market.storage).filter(o => o.status === 'active');
  
  if (cleaned > 0) saveDatabase();
  return cleaned;
};

// ═══════════════════════════════════════════════════════════════════════════════
// إنشاء عرض جديد
// ═══════════════════════════════════════════════════════════════════════════════
export const createOffer = (userId, userName, item, price) => {
  const data = getRpgData();
  const player = data.players?.[userId];
  
  if (!player) return { success: false, message: '❌ لست مسجلاً!' };
  
  // التحقق من أن العنصر ليس مجهزاً
  if (player.equippedWeapon?.id === item.id || player.equippedArmor?.id === item.id) {
    return { success: false, message: '❌ لا يمكنك بيع عنصر مجهز! استخدم .نزع أولاً.' };
  }
  
  // البحث عن العنصر
  let foundItem = null;
  let itemType = null;
  let itemIndex = -1;
  
  if (player.weapons) {
    itemIndex = player.weapons.findIndex(w => w.id === item.id || w.fullName === item.name);
    if (itemIndex !== -1) {
      foundItem = player.weapons[itemIndex];
      itemType = 'weapon';
    }
  }
  
  if (!foundItem && player.armors) {
    itemIndex = player.armors.findIndex(a => a.id === item.id || a.fullName === item.name);
    if (itemIndex !== -1) {
      foundItem = player.armors[itemIndex];
      itemType = 'armor';
    }
  }
  
  if (!foundItem) return { success: false, message: '❌ العنصر غير موجود في مخزونك!' };
  if (price < 50) return { success: false, message: '❌ الحد الأدنى للسعر 50 ذهب!' };
  
  // نقل العنصر لمخزن البوت
  const code = generatePurchaseCode();
  const offer = {
    code,
    sellerId: userId,
    sellerName: userName,
    item: { ...foundItem, type: itemType },
    price,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    status: 'active'
  };
  
  // إزالة من مخزن اللاعب
  if (itemType === 'weapon') player.weapons.splice(itemIndex, 1);
  else player.armors.splice(itemIndex, 1);
  
  // حفظ في قاعدة البيانات
  if (!data.market) data.market = {};
  if (!data.market.storage) data.market.storage = {};
  data.market.storage[code] = offer;
  
  if (!data.market.offers) data.market.offers = [];
  data.market.offers.push(offer);
  
  saveDatabase();
  
  return { success: true, offer, message: `✅ تم إنشاء العرض!\n📦 كود الشراء: ${code}` };
};

// ═══════════════════════════════════════════════════════════════════════════════
// شراء من السوق
// ═══════════════════════════════════════════════════════════════════════════════
export const buyFromMarket = (buyerId, buyerName, code) => {
  const data = getRpgData();
  const buyer = data.players?.[buyerId];
  if (!buyer) return { success: false, message: '❌ لست مسجلاً!' };
  
  if (!data.market?.storage?.[code]) return { success: false, message: '❌ العرض غير موجود!' };
  const offer = data.market.storage[code];
  
  if (offer.status !== 'active') return { success: false, message: '❌ العرض غير متاح!' };
  if (Date.now() > offer.expiresAt) return { success: false, message: '❌ العرض منتهي!' };
  if (buyerId === offer.sellerId) return { success: false, message: '❌ لا يمكنك شراء عرضك!' };
  if (buyer.gold < offer.price) return { success: false, message: `❌ تحتاج ${offer.price} ذهب!` };
  
  // التحقق من وجود البائع (قد يكون محذوفاً)
  const seller = data.players?.[offer.sellerId];
  if (!seller) {
    // إلغاء العرض وإعادة العنصر للبوت (أو حذفه)
    delete data.market.storage[code];
    data.market.offers = data.market.offers.filter(o => o.code !== code);
    saveDatabase();
    return { success: false, message: '❌ البائع غير موجود، تم إلغاء العرض.' };
  }
  
  // حساب العمولة
  const fee = Math.floor(offer.price * MARKET_FEE);
  const sellerGain = offer.price - fee;
  
  // خصم الذهب من المشتري
  buyer.gold -= offer.price;
  
  // إضافة الذهب للبائع (بعد خصم العمولة)
  seller.gold += sellerGain;
  
  // إضافة العمولة إلى البوت (يمكن تخزينها في إحصائيات)
  if (!data.market.feesCollected) data.market.feesCollected = 0;
  data.market.feesCollected += fee;
  
  // التحقق من سعة مخزون المشتري
  const currentItems = (buyer.weapons?.length || 0) + (buyer.armors?.length || 0);
  if (currentItems >= MAX_INVENTORY_ITEMS) {
    // إعادة الأموال للجميع
    buyer.gold += offer.price;
    seller.gold -= sellerGain;
    data.market.feesCollected -= fee;
    return { success: false, message: `❌ مخزونك ممتلئ! الحد الأقصى ${MAX_INVENTORY_ITEMS} عنصر.` };
  }
  
  // نقل العنصر للمشتري
  if (offer.item.type === 'weapon') {
    buyer.weapons = buyer.weapons || [];
    buyer.weapons.push(offer.item);
  } else {
    buyer.armors = buyer.armors || [];
    buyer.armors.push(offer.item);
  }
  
  // تحديث حالة العرض
  offer.status = 'sold';
  offer.buyerId = buyerId;
  offer.buyerName = buyerName;
  offer.soldAt = Date.now();
  
  // إزالة من مخزن البوت
  delete data.market.storage[code];
  data.market.offers = data.market.offers.filter(o => o.code !== code);
  
  saveDatabase();
  
  return {
    success: true,
    item: offer.item,
    price: offer.price,
    fee,
    sellerId: offer.sellerId,
    sellerName: offer.sellerName
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// إلغاء عرض
// ═══════════════════════════════════════════════════════════════════════════════
export const cancelOffer = (userId, code) => {
  const data = getRpgData();
  if (!data.market?.storage?.[code]) return { success: false, message: '❌ العرض غير موجود!' };
  
  const offer = data.market.storage[code];
  if (offer.sellerId !== userId) return { success: false, message: '❌ لست صاحب العرض!' };
  
  const player = data.players?.[userId];
  if (!player) return { success: false, message: '❌ حسابك غير موجود!' };
  
  // إرجاع العنصر
  if (offer.item.type === 'weapon') {
    player.weapons = player.weapons || [];
    player.weapons.push(offer.item);
  } else {
    player.armors = player.armors || [];
    player.armors.push(offer.item);
  }
  
  // حذف العرض
  delete data.market.storage[code];
  data.market.offers = data.market.offers.filter(o => o.code !== code);
  saveDatabase();
  
  return { success: true, message: '✅ تم إلغاء العرض وإرجاع العنصر!' };
};

// ═══════════════════════════════════════════════════════════════════════════════
// عرض السوق
// ═══════════════════════════════════════════════════════════════════════════════
export const getMarketOffers = (limit = 15) => {
  const data = getRpgData();
  const offers = data.market?.offers?.filter(o => o.status === 'active' && Date.now() < o.expiresAt) || [];
  return offers.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
};

// عروضي
export const getMyOffers = (userId) => {
  const data = getRpgData();
  return data.market?.offers?.filter(o => o.sellerId === userId && o.status === 'active') || [];
};

// ═══════════════════════════════════════════════════════════════════════════════
// تنسيق عرض للعرض (للإعلان في القناة)
// ═══════════════════════════════════════════════════════════════════════════════
export const formatOfferForChannel = (offer) => {
  const item = offer.item;
  const rarityEmoji = item.rarity === 'أسطوري' ? '🟡' : item.rarity === 'ملحمي' ? '🟣' : item.rarity === 'نادر' ? '🔵' : '⚪';
  const typeEmoji = item.type === 'weapon' ? '⚔️' : '🛡️';
  const stat = item.atk ? `⚔️ ${item.atk}` : `🛡️ ${item.def}`;
  
  return `📦 عرض جديد في السوق!

${typeEmoji} العنصر: ${item.fullName} [${rarityEmoji}]
📊 القوة: ${stat}
💰 السعر: ${offer.price.toLocaleString()} ذهب
👤 البائع: ${offer.sellerName}
🆔 كود الشراء: ${offer.code}

⏰ ينتهي خلال 24 ساعة`;
};
