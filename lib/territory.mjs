// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ نظام استكشاف الأقاليم والصراع عليها - فاطمة بوت v12.0 (محدث بالكامل)
// يتضمن: استكشاف، سيطرة، ضرائب، حروب الأقاليم، حماية المناطق، انسحاب الجنود
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';
import { sendImage } from './utils/image.mjs';
import { isClanLeader } from './clan.mjs';

// الصورة الافتراضية للمناطق
const DEFAULT_REGION_IMAGE = 'https://files.catbox.moe/p4mtw3.jpg';

// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ تعريف المناطق المتاحة
// ═══════════════════════════════════════════════════════════════════════════════

export const REGIONS = [
  {
    id: 'gold_mine',
    name: 'منجم الذهب',
    emoji: '⛏️',
    type: 'منجم',
    baseResource: 'ذهب',
    baseProduction: 100,
    difficulty: 3,
    guardian: { name: 'حارس المنجم', hp: 500, atk: 30, def: 20 }
  },
  {
    id: 'crystal_forest',
    name: 'غابة الكريستال',
    emoji: '💎',
    type: 'غابة',
    baseResource: 'كريستال',
    baseProduction: 80,
    difficulty: 4,
    guardian: { name: 'وحش الكريستال', hp: 700, atk: 40, def: 25 }
  },
  {
    id: 'spirit_woods',
    name: 'غابة الأرواح',
    emoji: '🌲',
    type: 'غابة',
    baseResource: 'خشب روحي',
    baseProduction: 60,
    difficulty: 5,
    guardian: { name: 'شبح الغابة', hp: 900, atk: 50, def: 30 }
  },
  {
    id: 'iron_mountain',
    name: 'جبل الحديد',
    emoji: '🏔️',
    type: 'منجم',
    baseResource: 'حديد',
    baseProduction: 120,
    difficulty: 4,
    guardian: { name: 'عملاق الجبل', hp: 1200, atk: 60, def: 40 }
  },
  {
    id: 'mystic_lake',
    name: 'البحيرة السحرية',
    emoji: '🌊',
    type: 'مياه',
    baseResource: 'جوهر سحري',
    baseProduction: 90,
    difficulty: 6,
    guardian: { name: 'تنين البحيرة', hp: 1500, atk: 70, def: 35 }
  },
  {
    id: 'ancient_ruins',
    name: 'الأطلال القديمة',
    emoji: '🏛️',
    type: 'أطلال',
    baseResource: 'قطع أثرية',
    baseProduction: 150,
    difficulty: 7,
    guardian: { name: 'حارس الأطلال', hp: 2000, atk: 80, def: 50 }
  }
];

// قوة الجنود حسب النوع
export const SOLDIER_POWER = {
  'فارس': 15,
  'محارب': 10,
  'رامي': 12,
  'ساحر': 18,
  'شافي': 8
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 تخزين حالة المناطق (في قاعدة البيانات)
// ═══════════════════════════════════════════════════════════════════════════════

// تحميل حالة المناطق من قاعدة البيانات
export const loadTerritoryState = () => {
  const data = getRpgData();
  if (!data.territory) {
    data.territory = {};
  }
  return data.territory;
};

// الحصول على حالة منطقة معينة
export const getRegionState = (regionId) => {
  const data = getRpgData();
  if (!data.territory) data.territory = {};
  if (!data.territory[regionId]) {
    data.territory[regionId] = {
      regionId,
      controlledBy: null,
      controlledByName: null,
      garrison: [], // [{ playerId, playerName, soldierType, count, deployedAt }]
      lastProduction: Date.now(),
      taxRate: 0.1,
      totalDefense: 0
    };
    saveDatabase();
  }
  return data.territory[regionId];
};

// حفظ الحالة بعد التعديل
const saveRegionState = (regionId, state) => {
  const data = getRpgData();
  data.territory = data.territory || {};
  data.territory[regionId] = state;
  saveDatabase();
};

// تحديث قوة الدفاع الإجمالية بناءً على الحامية
const updateTotalDefense = (state) => {
  let total = 0;
  for (const g of state.garrison) {
    total += g.count * (SOLDIER_POWER[g.soldierType] || 10);
  }
  state.totalDefense = total;
  saveRegionState(state.regionId, state);
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🧩 دوال مساعدة للاعبين والكلانات
// ═══════════════════════════════════════════════════════════════════════════════

const updatePlayerStamina = (player) => {
  const now = Date.now();
  const maxStamina = 100 + (player.level || 1) * 5;
  const lastUpdate = player.lastStaminaUpdate || now;
  const elapsed = now - lastUpdate;
  const regen = Math.floor(elapsed / 60000); // نقطة كل دقيقة
  if (regen > 0) {
    player.stamina = Math.min(maxStamina, (player.stamina || 0) + regen);
    player.lastStaminaUpdate = now;
  }
  return player.stamina;
};

const getClanById = (clanId) => {
  const data = getRpgData();
  return data.clans?.[clanId] || null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 استكشاف منطقة (مع إمكانية اختيار المنطقة)
// ═══════════════════════════════════════════════════════════════════════════════

export const exploreRegion = async (sock, groupId, player, regionId = null) => {
  let region;
  let state;

  if (regionId) {
    region = REGIONS.find(r => r.id === regionId);
    if (!region) {
      return { success: false, message: '❌ منطقة غير موجودة!' };
    }
    state = getRegionState(regionId);
    // يمكن استكشاف أي منطقة غير محمية بكلان آخر
    if (state.controlledBy && state.controlledBy !== player.clanId) {
      return { success: false, message: '❌ هذه المنطقة تحت سيطرة كلان آخر! لا يمكن استكشافها.' };
    }
  } else {
    // اختيار منطقة عشوائية متاحة
    const available = REGIONS.filter(r => {
      const s = getRegionState(r.id);
      return !s.controlledBy || s.controlledBy === player.clanId;
    });
    if (available.length === 0) {
      return { success: false, message: '❌ لا توجد مناطق متاحة للاستكشاف!' };
    }
    region = available[Math.floor(Math.random() * available.length)];
    state = getRegionState(region.id);
  }

  // الطاقة
  const staminaCost = 2;
  const stamina = updatePlayerStamina(player);
  if (stamina < staminaCost) {
    return { success: false, message: `❌ طاقة غير كافية! تحتاج ${staminaCost} نقطة. (لديك ${stamina})` };
  }
  player.stamina = stamina - staminaCost;
  saveDatabase();

  let text = `🗺️ ═══════ استكشاف ═══════ 🗺️\n\n`;
  text += `${region.emoji} ${region.name}\n`;
  text += `📍 النوع: ${region.type}\n`;
  text += `💰 الإنتاج: ${region.baseProduction} ${region.baseResource}/ساعة\n`;
  text += `⚔️ الصعوبة: ${'⭐'.repeat(region.difficulty)}\n\n`;

  if (state.controlledBy) {
    text += `🚩 المسيطر: ${state.controlledByName}\n`;
    text += `🛡️ الحامية: ${state.garrison.length} جندي\n`;
    text += `💰 الضريبة: ${state.taxRate * 100}%\n\n`;
  }

  if (!state.controlledBy && region.guardian) {
    text += `⚠️ ${region.guardian.name} يحمي هذه المنطقة!\n`;
    text += `❤️ HP: ${region.guardian.hp} | ⚔️ ATK: ${region.guardian.atk}\n\n`;
    text += `الخيارات:\n`;
    text += `⚔️ .قتال_الحارس ${region.name} - لمحاربة الحارس والسيطرة\n`;
    text += `🕵️ .تسلل ${region.name} - محاولة السرقة بدون قتال (نسبة نجاح 50%)\n`;
  } else if (state.controlledBy === player.clanId) {
    text += `✅ المنطقة تحت حماية كلانك\n`;
    text += `🛡️ .حماية ${region.name} <عدد> <نوع> - إرسال جنود للحامية\n`;
    text += `📊 .الحامية ${region.name} - عرض تفاصيل الحامية\n`;
    text += `🏃 .انسحاب_الجنود ${region.name} - سحب جنودك من الحامية\n`;
  }

  await sendImage(sock, groupId, DEFAULT_REGION_IMAGE, text);
  return { success: true, region, state };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ قتال حارس المنطقة
// ═══════════════════════════════════════════════════════════════════════════════

export const fightGuardian = (regionId, player) => {
  const region = REGIONS.find(r => r.id === regionId);
  if (!region) return { success: false, message: '❌ منطقة غير موجودة!' };
  const guardian = region.guardian;
  if (!guardian) return { success: false, message: '❌ لا يوجد حارس في هذه المنطقة!' };

  // حساب قوة اللاعب
  const playerDamage = (player.atk || 10) * (1 + (player.level || 1) * 0.1);
  const guardianDamage = guardian.atk * (1 + region.difficulty * 0.05);
  let guardianHp = guardian.hp;
  let playerHp = player.hp || 100;

  let rounds = 0;
  while (guardianHp > 0 && playerHp > 0 && rounds < 20) {
    guardianHp -= playerDamage;
    rounds++;
    if (guardianHp <= 0) break;
    playerHp -= Math.max(1, guardianDamage - (player.def || 0) * 0.5);
    rounds++;
  }

  if (playerHp <= 0) {
    player.hp = 1;
    saveDatabase();
    return { success: false, message: `💀 هُزمت أمام ${guardian.name}!\n\nحاول مرة أخرى بعد العلاج.` };
  }

  // انتصار
  player.hp = Math.floor(playerHp);
  const state = getRegionState(regionId);
  let conquered = false;

  if (!state.controlledBy && player.clanId) {
    // السيطرة على المنطقة
    const clan = getClanById(player.clanId);
    state.controlledBy = player.clanId;
    state.controlledByName = clan?.name || player.clanName || 'كلان';
    state.garrison = [];
    state.lastProduction = Date.now();
    updateTotalDefense(state);
    conquered = true;
    saveRegionState(regionId, state);
  }

  const rewardGold = region.baseProduction * 2;
  const rewardXp = region.difficulty * 100;
  player.gold = (player.gold || 0) + rewardGold;
  player.xp = (player.xp || 0) + rewardXp;
  saveDatabase();

  let message = `⚔️ انتصرت على ${guardian.name}!\n\n`;
  if (conquered) {
    message += `🎉 تم رفع راية كلان ${state.controlledByName} على ${region.name}!\n💰 ستحصل على ${region.baseProduction} ${region.baseResource} كل ساعة\n`;
  }
  message += `🎁 المكافآت:\n💰 +${rewardGold} ذهب\n⭐ +${rewardXp} XP`;
  return { success: true, message };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🕵️ التسلل (سرقة موارد بدون قتال)
// ═══════════════════════════════════════════════════════════════════════════════

export const sneakIntoRegion = (regionId, player) => {
  const region = REGIONS.find(r => r.id === regionId);
  if (!region) return { success: false, message: '❌ منطقة غير موجودة!' };

  if (!['قاتل', 'رامي'].includes(player.class)) {
    return { success: false, message: '❌ التسلل متاح فقط للقتلة والرماة!' };
  }

  const state = getRegionState(regionId);
  if (!state.controlledBy) {
    return { success: false, message: '❌ المنطقة غير محتلة، ليس هناك موارد لسرقتها!' };
  }

  const successChance = 0.5;
  if (Math.random() >= successChance) {
    const damage = Math.floor((player.hp || 100) * 0.2);
    player.hp = Math.max(1, (player.hp || 100) - damage);
    saveDatabase();
    return { success: true, stolen: false, message: `🚨 فشل التسلل! خسرت ${damage} HP أثناء الهروب.` };
  }

  const stolen = Math.floor(region.baseProduction * 0.5);
  player.gold = (player.gold || 0) + stolen;
  saveDatabase();
  return { success: true, stolen: true, amount: stolen, message: `🕵️ نجح التسلل!\n💰 سرقت ${stolen} ذهب من ${region.name}` };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ إضافة جنود للحامية
// ═══════════════════════════════════════════════════════════════════════════════

export const addGarrison = (regionId, playerId, playerName, soldierCount, soldierType) => {
  const region = REGIONS.find(r => r.id === regionId);
  if (!region) return { success: false, message: '❌ منطقة غير موجودة!' };
  const state = getRegionState(regionId);

  if (state.controlledBy !== player.clanId) {
    return { success: false, message: '❌ منطقتك لا تسيطر على هذه المنطقة!' };
  }

  const data = getRpgData();
  const player = data.players?.[playerId];
  if (!player) return { success: false, message: '❌ لاعب غير موجود!' };
  if (!player.soldiers || player.soldiers < soldierCount) {
    return { success: false, message: `❌ ليس لديك جنود كاف! (لديك ${player.soldiers || 0})` };
  }

  // إضافة للحامية
  const entry = { playerId, playerName, soldierType, count: soldierCount, deployedAt: Date.now() };
  state.garrison.push(entry);
  updateTotalDefense(state);

  // خصم الجنود من اللاعب
  player.soldiers -= soldierCount;
  saveDatabase();
  saveRegionState(regionId, state);

  return { success: true, message: `🛡️ تم إرسال ${soldierCount} ${soldierType} إلى ${region.name}!\n📊 قوة الدفاع الجديدة: ${state.totalDefense}` };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 عرض حالة الحامية
// ═══════════════════════════════════════════════════════════════════════════════

export const getGarrisonInfo = (regionId) => {
  const region = REGIONS.find(r => r.id === regionId);
  if (!region) return { success: false, message: '❌ منطقة غير موجودة!' };
  const state = getRegionState(regionId);

  if (state.garrison.length === 0) {
    return { success: true, empty: true, message: `🏰 حامية ${region.name}: فارغة\n\n🛡️ .حماية ${region.name} <عدد> <نوع> لإرسال جنود` };
  }

  // تجميع حسب النوع واللاعب
  const byPlayer = {};
  for (const g of state.garrison) {
    if (!byPlayer[g.playerName]) byPlayer[g.playerName] = {};
    byPlayer[g.playerName][g.soldierType] = (byPlayer[g.playerName][g.soldierType] || 0) + g.count;
  }

  let text = `🏰 ═══════ حامية ${region.name} ═══════ 🏰\n\n`;
  text += `📊 إجمالي قوة الدفاع: ${state.totalDefense}\n\n👥 المساهمون:\n`;
  for (const [playerName, types] of Object.entries(byPlayer)) {
    text += `\n• ${playerName}:\n`;
    for (const [type, count] of Object.entries(types)) {
      const emoji = { 'فارس': '🛡️', 'رامي': '🏹', 'ساحر': '✨', 'شافي': '💚', 'محارب': '⚔️' }[type] || '⚔️';
      text += `  ${emoji} ${type}: ${count}\n`;
    }
  }
  return { success: true, message: text };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🏃 انسحاب الجنود من الحامية
// ═══════════════════════════════════════════════════════════════════════════════

export const withdrawGarrison = (regionId, playerId, playerName, soldierType = null) => {
  const region = REGIONS.find(r => r.id === regionId);
  if (!region) return { success: false, message: '❌ منطقة غير موجودة!' };
  const state = getRegionState(regionId);
  
  if (state.controlledBy !== player.clanId) {
    return { success: false, message: '❌ أنت لا تسيطر على هذه المنطقة!' };
  }
  
  // البحث عن جنود هذا اللاعب في الحامية
  let toRemove = [];
  let removedCount = 0;
  let removedTypeCounts = {};
  
  for (let i = state.garrison.length - 1; i >= 0; i--) {
    const g = state.garrison[i];
    if (g.playerId === playerId) {
      if (soldierType && g.soldierType !== soldierType) continue;
      toRemove.push(g);
      removedCount += g.count;
      removedTypeCounts[g.soldierType] = (removedTypeCounts[g.soldierType] || 0) + g.count;
      state.garrison.splice(i, 1);
    }
  }
  
  if (toRemove.length === 0) {
    return { success: false, message: `❌ لم تجد جنوداً لك في هذه الحامية${soldierType ? ` من نوع ${soldierType}` : ''}!` };
  }
  
  // إعادة الجنود للاعب (إضافة إلى soldiers)
  const data = getRpgData();
  const player = data.players?.[playerId];
  if (player) {
    player.soldiers = (player.soldiers || 0) + removedCount;
    saveDatabase();
  }
  
  // تحديث قوة الدفاع
  updateTotalDefense(state);
  saveRegionState(regionId, state);
  
  let msg = `✅ تم انسحاب جنودك من ${region.name}!\n👥 إجمالي الجنود المسحوبة: ${removedCount}\n`;
  for (const [type, count] of Object.entries(removedTypeCounts)) {
    msg += `   ${type}: ${count}\n`;
  }
  msg += `\n🪖 عادوا إلى جيشك الشخصي.`;
  
  return { success: true, message: msg };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 جمع الإنتاج اليومي
// ═══════════════════════════════════════════════════════════════════════════════

export const collectRegionProduction = (clanId) => {
  const data = getRpgData();
  const now = Date.now();
  let collected = { gold: 0, elixir: 0, crystal: 0, iron: 0, wood: 0 }; // توسيع حسب الحاجة

  for (const region of REGIONS) {
    const state = getRegionState(region.id);
    if (state.controlledBy !== clanId) continue;

    const hours = Math.floor((now - state.lastProduction) / 3600000);
    if (hours <= 0) continue;

    const production = region.baseProduction * hours;
    const resource = region.baseResource;
    if (resource === 'ذهب') collected.gold += production;
    else if (resource === 'كريستال') collected.crystal += production;
    else if (resource === 'حديد') collected.iron += production;
    else if (resource === 'خشب روحي') collected.wood += production;
    else collected[resource] = (collected[resource] || 0) + production;

    state.lastProduction = now;
    saveRegionState(region.id, state);
  }

  // إضافة للموارد الجماعية للكلان (يمكنك تخصيص المخازن)
  const clan = getClanById(clanId);
  if (clan) {
    clan.resources = clan.resources || {};
    for (const [res, amount] of Object.entries(collected)) {
      if (amount > 0) clan.resources[res] = (clan.resources[res] || 0) + amount;
    }
    saveDatabase();
  }

  return collected;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ بدء غزو منطقة (متعدد المشاركين)
// ═══════════════════════════════════════════════════════════════════════════════

// تخزين الغزوات النشطة (في الذاكرة مؤقتًا، يمكن تخزينها بقاعدة)
const activeInvasions = new Map();

export const startInvasion = (regionId, clanId, leaderId) => {
  const region = REGIONS.find(r => r.id === regionId);
  if (!region) return { success: false, message: '❌ منطقة غير موجودة!' };
  const state = getRegionState(regionId);
  if (!state.controlledBy) return { success: false, message: '❌ المنطقة غير محتلة، استكشفها أولاً!' };
  if (state.controlledBy === clanId) return { success: false, message: '❌ أنت تسيطر بالفعل!' };

  const clan = getClanById(clanId);
  if (!clan) return { success: false, message: '❌ كلان غير موجود!' };
  if (!isClanLeader(clan, leaderId)) return { success: false, message: '❌ فقط قائد الكلان يمكنه بدء الغزو!' };

  // التحقق من وجود غزو نشط بالفعل
  const existing = activeInvasions.get(regionId);
  if (existing && existing.clanId === clanId) return { success: false, message: '❌ لديك غزو نشط بالفعل لهذه المنطقة!' };
  if (existing) return { success: false, message: '❌ هناك غزو جارٍ لهذه المنطقة من كلان آخر!' };

  const invasion = {
    regionId,
    regionName: region.name,
    clanId,
    clanName: clan.name,
    startTime: Date.now(),
    endTime: Date.now() + 30 * 60 * 1000, // 30 دقيقة للتجهيز
    participants: [], // { playerId, playerName, soldiers, attackPower }
    status: 'preparing'
  };
  activeInvasions.set(regionId, invasion);
  return { success: true, invasion };
};

export const joinInvasion = (regionId, playerId, playerName, soldierCount, playerPower) => {
  const invasion = activeInvasions.get(regionId);
  if (!invasion) return { success: false, message: '❌ لا يوجد غزو نشط لهذه المنطقة!' };
  if (invasion.status !== 'preparing') return { success: false, message: '❌ انتهت فترة التجهيز!' };
  if (Date.now() > invasion.endTime) {
    invasion.status = 'expired';
    activeInvasions.delete(regionId);
    return { success: false, message: '❌ انتهت فترة التجهيز!' };
  }

  // التحقق من أن اللاعب في نفس الكلان
  const data = getRpgData();
  const player = data.players?.[playerId];
  if (!player || player.clanId !== invasion.clanId) return { success: false, message: '❌ ليس لديك الصلاحية!' };

  if (!player.soldiers || player.soldiers < soldierCount) {
    return { success: false, message: `❌ ليس لديك جنود كاف! (لديك ${player.soldiers || 0})` };
  }

  // حساب قوة الهجوم
  const attackPower = soldierCount * (playerPower || 10);
  invasion.participants.push({ playerId, playerName, soldiers: soldierCount, attackPower });
  player.soldiers -= soldierCount;
  saveDatabase();

  return { success: true, message: `✅ انضممت إلى غزو ${invasion.regionName} بـ ${soldierCount} جندي!` };
};

export const executeInvasion = (regionId) => {
  const invasion = activeInvasions.get(regionId);
  if (!invasion) return { success: false, message: '❌ لا يوجد غزو نشط!' };
  if (invasion.status !== 'preparing') return { success: false, message: '❌ الغزو تم تنفيذه بالفعل!' };

  const state = getRegionState(regionId);
  const totalAttack = invasion.participants.reduce((sum, p) => sum + p.attackPower, 0);
  const defense = state.totalDefense;
  const victory = totalAttack > defense;

  if (victory) {
    // نقل السيطرة
    const oldClan = state.controlledBy;
    state.controlledBy = invasion.clanId;
    state.controlledByName = invasion.clanName;
    state.garrison = [];
    updateTotalDefense(state);
    saveRegionState(regionId, state);
  }

  // خسائر المهاجمين (يمكن تطبيقها على الجنود الفعليين للاعبين)
  // هنا نكتفي بإزالة الغزو
  invasion.status = victory ? 'victory' : 'defeat';
  activeInvasions.delete(regionId);

  return {
    success: true,
    victory,
    message: victory ? `🎉 انتصر كلان ${invasion.clanName} واستولى على ${invasion.regionName}!` : `💀 فشل الغزو ضد ${invasion.regionName}!`
  };
};

export const getActiveInvasion = (regionId) => activeInvasions.get(regionId);
