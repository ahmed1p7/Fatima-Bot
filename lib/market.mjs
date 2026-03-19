// ═══════════════════════════════════════════════════════════════════════════════
// 🛒 نظام السوق المفتوح
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';

// قناة السوق للإعلانات
export const MARKET_CHANNEL = '0029Vb7kjd9L2AU7rXPRrz1h';

// مخزن البوت للوساطة
let botStorage = {};

// العروض النشطة
let activeOffers = new Map();

// توليد كود شراء فريد
export const generatePurchaseCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'B-';
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ═══════════════════════════════════════════════════════════════════════════════
// إنشاء عرض جديد
// ═══════════════════════════════════════════════════════════════════════════════
export const createOffer = (userId, userName, item, price) => {
  const data = getRpgData();
  const player = data.players?.[userId];
  
  if (!player) {
    return { success: false, message: '❌ لست مسجلاً!' };
  }
  
  // البحث عن العنصر
  let foundItem = null;
  let itemType = null;
  let itemIndex = -1;
  
  // البحث في الأسلحة
  if (player.weapons) {
    itemIndex = player.weapons.findIndex(w => w.id === item.id || w.fullName === item.name);
    if (itemIndex !== -1) {
      foundItem = player.weapons[itemIndex];
      itemType = 'weapon';
    }
  }
  
  // البحث في الدروع
  if (!foundItem && player.armors) {
    itemIndex = player.armors.findIndex(a => a.id === item.id || a.fullName === item.name);
    if (itemIndex !== -1) {
      foundItem = player.armors[itemIndex];
      itemType = 'armor';
    }
  }
  
  if (!foundItem) {
    return { success: false, message: '❌ العنصر غير موجود في مخزونك!' };
  }
  
  if (price < 50) {
    return { success: false, message: '❌ الحد الأدنى للسعر 50 ذهب!' };
  }
  
  // نقل العنصر لمخزن البوت (نظام الوسيط)
  const code = generatePurchaseCode();
  const offer = {
    code,
    sellerId: userId,
    sellerName: userName,
    item: { ...foundItem, type: itemType },
    price,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 ساعة
    status: 'active'
  };
  
  // إزالة من مخزن اللاعب
  if (itemType === 'weapon') {
    player.weapons.splice(itemIndex, 1);
  } else {
    player.armors.splice(itemIndex, 1);
  }
  
  // حفظ في مخزن البوت
  if (!data.market) data.market = {};
  data.market.storage = data.market.storage || {};
  data.market.storage[code] = offer;
  
  // إضافة للعروض النشطة
  if (!data.market.offers) data.market.offers = [];
  data.market.offers.push(offer);
  
  saveDatabase();
  
  return {
    success: true,
    offer,
    message: `✅ تم إنشاء العرض!\n\n📦 كود الشراء: ${code}`
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// شراء من السوق
// ═══════════════════════════════════════════════════════════════════════════════
export const buyFromMarket = (buyerId, buyerName, code) => {
  const data = getRpgData();
  const buyer = data.players?.[buyerId];
  
  if (!buyer) {
    return { success: false, message: '❌ لست مسجلاً!' };
  }
  
  if (!data.market?.storage?.[code]) {
    return { success: false, message: '❌ العرض غير موجود!' };
  }
  
  const offer = data.market.storage[code];
  
  if (offer.status !== 'active') {
    return { success: false, message: '❌ العرض غير متاح!' };
  }
  
  if (Date.now() > offer.expiresAt) {
    return { success: false, message: '❌ العرض منتهي!' };
  }
  
  if (buyerId === offer.sellerId) {
    return { success: false, message: '❌ لا يمكنك شراء عرضك!' };
  }
  
  if (buyer.gold < offer.price) {
    return { success: false, message: `❌ تحتاج ${offer.price} ذهب!` };
  }
  
  // خصم الذهب من المشتري
  buyer.gold -= offer.price;
  
  // إضافة الذهب للبائع
  const seller = data.players?.[offer.sellerId];
  if (seller) {
    seller.gold += offer.price;
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
  
  // تحديث العروض النشطة
  data.market.offers = data.market.offers.filter(o => o.code !== code);
  
  saveDatabase();
  
  return {
    success: true,
    item: offer.item,
    price: offer.price,
    sellerId: offer.sellerId,
    sellerName: offer.sellerName
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// إلغاء عرض
// ═══════════════════════════════════════════════════════════════════════════════
export const cancelOffer = (userId, code) => {
  const data = getRpgData();
  
  if (!data.market?.storage?.[code]) {
    return { success: false, message: '❌ العرض غير موجود!' };
  }
  
  const offer = data.market.storage[code];
  
  if (offer.sellerId !== userId) {
    return { success: false, message: '❌ لست صاحب العرض!' };
  }
  
  const player = data.players?.[userId];
  if (!player) {
    return { success: false, message: '❌ خطأ!' };
  }
  
  // إرجاع العنصر لصاحبه
  if (offer.item.type === 'weapon') {
    player.weapons = player.weapons || [];
    player.weapons.push(offer.item);
  } else {
    player.armors = player.armors || [];
    player.armors.push(offer.item);
  }
  
  // إزالة العرض
  delete data.market.storage[code];
  data.market.offers = data.market.offers.filter(o => o.code !== code);
  
  saveDatabase();
  
  return { success: true, message: '✅ تم إلغاء العرض وإرجاع العنصر!' };
};

// ═══════════════════════════════════════════════════════════════════════════════
// عرض السوق
// ═══════════════════════════════════════════════════════════════════════════════
export const getMarketOffers = (limit = 10) => {
  const data = getRpgData();
  const offers = data.market?.offers?.filter(o => o.status === 'active' && Date.now() < o.expiresAt) || [];
  
  return offers
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
};

// عروضي
export const getMyOffers = (userId) => {
  const data = getRpgData();
  const offers = data.market?.offers?.filter(o => o.sellerId === userId && o.status === 'active') || [];
  return offers;
};

// ═══════════════════════════════════════════════════════════════════════════════
// تنسيق عرض للعرض
// ═══════════════════════════════════════════════════════════════════════════════
export const formatOfferForChannel = (offer) => {
  const item = offer.item;
  const rarityEmoji = item.rarity === 'أسطوري' ? '🟡' : item.rarity === 'ملحمي' ? '🟣' : item.rarity === 'نادر' ? '🔵' : '⚪';
  const typeEmoji = item.type === 'weapon' ? '⚔️' : '🛡️';
  const stat = item.atk ? `⚔️ ${item.atk}` : `🛡️ ${item.def}`;
  
  return `📦 عرض جديد في السوق!

${typeEmoji} العنصر: ${item.fullName} [${rarityEmoji}]
📊 القوة: ${stat}
💰 السعر: ${offer.price.toLocaleString()} ذهبة
👤 البائع: @${offer.sellerName}
🆔 كود الشراء: ${offer.code}

⏰ ينتهي خلال 24 ساعة`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// رسالة الحرب للقناة
// ═══════════════════════════════════════════════════════════════════════════════
export const formatWarForChannel = (war, result = null) => {
  if (result) {
    // نتيجة الحرب
    return `⚔️ انتهت الحرب!

🏰 ${result.winner.name} 🏆
💥 الضرر: ${result.winner.damage.toLocaleString()}

VS

🏰 ${result.loser.name}
💥 الضرر: ${result.loser.damage.toLocaleString()}

💰 الجائزة: ${result.prize.toLocaleString()} ذهبة`;
  }
  
  // بدء الحرب
  return `⚔️ حرب كلانات! ⚔️

🏰 ${war.challengerName}
VS
🏰 ${war.targetName}

⏱️ المدة: 30 دقيقة
💰 جائزة الفوز: ${war.prizePool.toLocaleString()} ذهبة

🎯 اهجم الآن!`;
};
