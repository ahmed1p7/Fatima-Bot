// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ نظام استكشاف الأقاليم والصراع عليها - فاطمة بوت v12.0
// يتضمن: استكشاف، سيطرة، ضرائب، حروب الأقاليم، حماية المناطق
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from '../lib/database.mjs';
import { sendImageFromUrl } from '../lib/utils/image.mjs';

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

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 تخزين حالة المناطق
// ═══════════════════════════════════════════════════════════════════════════════

const regionStates = new Map();

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 الحصول على حالة منطقة
// ═══════════════════════════════════════════════════════════════════════════════

export const getRegionState = (regionId) => {
  if (!regionStates.has(regionId)) {
    // إنشاء حالة افتراضية للمنطقة
    regionStates.set(regionId, {
      regionId,
      controlledBy: null, // معرف الكلان المسيطر
      controlledByName: null,
      garrison: [], // الجنود المدافعين
      lastProduction: Date.now(),
      taxRate: 0.1, // 10% ضريبة
      totalDefense: 0
    });
  }
  return regionStates.get(regionId);
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 استكشاف منطقة
// ═══════════════════════════════════════════════════════════════════════════════

export const exploreRegion = async (sock, groupId, player) => {
  // اختيار منطقة عشوائية
  const availableRegions = REGIONS.filter(r => {
    const state = getRegionState(r.id);
    // يمكن استكشاف أي منطقة غير محمية بكلان آخر
    return !state.controlledBy || state.controlledBy === player.clanId;
  });

  if (availableRegions.length === 0) {
    return {
      success: false,
      message: '❌ لا توجد مناطق متاحة للاستكشاف!'
    };
  }

  const region = availableRegions[Math.floor(Math.random() * availableRegions.length)];
  const state = getRegionState(region.id);

  // التحقق من الطاقة
  const staminaCost = 2;
  const staminaMax = 100 + (player.level * 5);
  const currentStamina = Math.min(staminaMax, player.stamina + Math.floor((Date.now() - (player.lastStaminaUpdate || Date.now())) / 60000));

  if (currentStamina < staminaCost) {
    return {
      success: false,
      message: '❌ طاقة غير كافية! تحتاج نقطتي طاقة للاستكشاف.'
    };
  }

  player.stamina = currentStamina - staminaCost;
  player.lastStaminaUpdate = Date.now();

  let text = `🗺️ ═══════ استكشاف ═══════ 🗺️\n\n`;
  text += `${region.emoji} ${region.name}\n`;
  text += `📍 النوع: ${region.type}\n`;
  text += `💰 الإنتاج: ${region.baseProduction} ${region.baseResource}/ساعة\n`;
  text += `⚔️ الصعوبة: ${'⭐'.repeat(region.difficulty)}\n\n`;

  // إذا كانت المنطقة محتلة
  if (state.controlledBy) {
    text += `🚩 المسيطر: ${state.controlledByName}\n`;
    text += `🛡️ الحامية: ${state.garrison.length} جندي\n`;
    text += `💰 الضريبة: ${state.taxRate * 100}%\n\n`;
  }

  // إذا كان هناك حارس
  if (!state.controlledBy && region.guardian) {
    text += `⚠️ ${region.guardian.name} يحمي هذه المنطقة!\n`;
    text += `❤️ HP: ${region.guardian.hp} | ⚔️ ATK: ${region.guardian.atk}\n\n`;
    text += `الخيارات:\n`;
    text += `⚔️ .قتال_الحارس - لمحاربة الحارس والسيطرة على المنطقة\n`;
    text += `🕵️ .تسلل - محاولة السرقة بدون قتال (نسبة نجاح 50%)\n`;
    text += `🏳️ .انسحاب - الخروج من المنطقة\n`;
  } else if (state.controlledBy) {
    text += `✅ المنطقة تحت حماية كلانك\n`;
    text += `.حماية <عدد> - إرسال جنود للحامية\n`;
  }

  // إرسال الصورة مع النص
  if (sock && groupId) {
    await sendImageFromUrl(sock, groupId, DEFAULT_REGION_IMAGE, text);
    return { success: true, region, state };
  }

  return { success: true, region, state, message: text };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ قتال حارس المنطقة
// ═══════════════════════════════════════════════════════════════════════════════

export const fightGuardian = (regionId, player) => {
  const region = REGIONS.find(r => r.id === regionId);
  if (!region) {
    return { success: false, message: '❌ منطقة غير موجودة!' };
  }

  const state = getRegionState(regionId);
  const guardian = region.guardian;

  if (!guardian) {
    return { success: false, message: '❌ لا يوجد حارس في هذه المنطقة!' };
  }

  // حساب الضرر بناءً على إحصائيات اللاعب
  const playerDamage = player.atk * (1 + player.level * 0.1);
  const guardianDamage = guardian.atk * (1 + region.difficulty * 0.05);

  // محاكاة المعركة
  let guardianHp = guardian.hp;
  let playerHp = player.hp;
  let rounds = 0;

  while (guardianHp > 0 && playerHp > 0 && rounds < 20) {
    // دور اللاعب
    guardianHp -= playerDamage;
    rounds++;

    if (guardianHp <= 0) break;

    // دور الحارس
    const damageTaken = Math.max(1, guardianDamage - player.def * 0.5);
    playerHp -= damageTaken;
    rounds++;
  }

  if (playerHp <= 0) {
    // هزيمة اللاعب
    player.hp = 1;
    return {
      success: false,
      victory: false,
      message: `💀 هُزمت أمام ${guardian.name}!\n\nحاول مرة أخرى بعد العلاج.`
    };
  }

  // انتصار اللاعب
  player.hp = Math.floor(playerHp);
  
  // السيطرة على المنطقة إذا لم تكن محتلة
  if (!state.controlledBy && player.clanId) {
    state.controlledBy = player.clanId;
    state.controlledByName = player.clanName;
    state.garrison = [];
    state.lastProduction = Date.now();
    
    return {
      success: true,
      victory: true,
      conquered: true,
      message: `🎉 انتصرت على ${guardian.name}!\n\n🚩 تم رفع راية كلان ${player.clanName} على ${region.name}!\n\n💰 ستحصل على ${region.baseProduction} ${region.baseResource} كل ساعة`
    };
  }

  // مكافأة الانتصار
  const rewardGold = region.baseProduction * 2;
  const rewardXp = region.difficulty * 100;
  player.gold = (player.gold || 0) + rewardGold;
  player.xp = (player.xp || 0) + rewardXp;

  return {
    success: true,
    victory: true,
    conquered: false,
    rewards: { gold: rewardGold, xp: rewardXp },
    message: `⚔️ انتصرت على ${guardian.name}!\n\n🎁 المكافآت:\n💰 +${rewardGold} ذهب\n⭐ +${rewardXp} XP`
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🕵️ التسلل (سرقة موارد بدون قتال)
// ═══════════════════════════════════════════════════════════════════════════════

export const sneakIntoRegion = (regionId, player) => {
  const region = REGIONS.find(r => r.id === regionId);
  if (!region) {
    return { success: false, message: '❌ منطقة غير موجودة!' };
  }

  // خاص بالقتال والرامي فقط
  if (!['قاتل', 'رامي'].includes(player.class)) {
    return { success: false, message: '❌ التسلل متاح فقط للقتلة والرماة!' };
  }

  const state = getRegionState(regionId);
  
  // نسبة النجاح 50%
  const successChance = 0.5;
  const isSuccessful = Math.random() < successChance;

  if (!isSuccessful) {
    // خصم قليل من HP
    const damage = Math.floor(player.maxHp * 0.2);
    player.hp = Math.max(1, player.hp - damage);
    
    return {
      success: true,
      stolen: false,
      message: `🚨 فشل التسلل! تم اكتشافك!\n\n💔 خسرت ${damage} HP أثناء الهروب.`
    };
  }

  // نجاح السرقة
  const stolenAmount = Math.floor(region.baseProduction * 0.5);
  player.gold = (player.gold || 0) + stolenAmount;

  return {
    success: true,
    stolen: true,
    amount: stolenAmount,
    message: `🕵️ نجح التسلل!\n\n💰 سرقت ${stolenAmount} ذهب من ${region.name}`
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ إضافة جنود للحامية
// ═══════════════════════════════════════════════════════════════════════════════

export const addGarrison = (regionId, playerId, playerName, soldierCount, soldierType) => {
  const region = REGIONS.find(r => r.id === regionId);
  if (!region) {
    return { success: false, message: '❌ منطقة غير موجودة!' };
  }

  const state = getRegionState(regionId);

  // التحقق من أن اللاعب ينتمي للكلان المسيطر
  const data = getRpgData();
  const player = data.players[playerId];
  
  if (!player || !player.clanId) {
    return { success: false, message: '❌ يجب أن تكون عضوًا في كلان!' };
  }

  if (state.controlledBy !== player.clanId) {
    return { success: false, message: '❌ منطقتك لا تسيطر على هذه المنطقة!' };
  }

  // التحقق من أن اللاعب لديه جنود كافية
  if (!player.army || player.army.total < soldierCount) {
    return { success: false, message: `❌ ليس لديك عدد كافٍ من الجنود! لديك ${player.army?.total || 0}` };
  }

  // إضافة الجنود للحامية
  const garrisonEntry = {
    playerId,
    playerName,
    soldierType,
    count: soldierCount,
    deployedAt: Date.now()
  };

  state.garrison.push(garrisonEntry);
  
  // تحديث قوة الدفاع الإجمالية
  const typePower = {
    'فارس': 15,
    'محارب': 10,
    'رامي': 12,
    'ساحر': 18,
    'شافي': 8
  };
  
  state.totalDefense += soldierCount * (typePower[soldierType] || 10);

  // خصم الجنود من اللاعب
  player.army.total -= soldierCount;
  player.army[soldierType] = (player.army[soldierType] || 0) - soldierCount;

  saveDatabase();

  return {
    success: true,
    message: `🛡️ تم إرسال ${soldierCount} ${soldierType} إلى ${region.name}!\n\n📊 قوة الدفاع الجديدة: ${state.totalDefense}`
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 عرض حالة الحامية
// ═══════════════════════════════════════════════════════════════════════════════

export const getGarrisonInfo = (regionId) => {
  const region = REGIONS.find(r => r.id === regionId);
  if (!region) {
    return { success: false, message: '❌ منطقة غير موجودة!' };
  }

  const state = getRegionState(regionId);

  if (state.garrison.length === 0) {
    return {
      success: true,
      empty: true,
      message: `🏰 حامية ${region.name}: فارغة\n\n.حماية <عدد> لإرسال جنود`
    };
  }

  let text = `🏰 ═══════ حامية ${region.name} ═══════ 🏰\n\n`;
  
  // تجميع الجنود حسب النوع
  const byType = {};
  const byPlayer = {};

  for (const g of state.garrison) {
    if (!byType[g.soldierType]) byType[g.soldierType] = 0;
    byType[g.soldierType] += g.count;

    if (!byPlayer[g.playerName]) byPlayer[g.playerName] = {};
    if (!byPlayer[g.playerName][g.soldierType]) byPlayer[g.playerName][g.soldierType] = 0;
    byPlayer[g.playerName][g.soldierType] += g.count;
  }

  text += `📊 إجمالي قوة الدفاع: ${state.totalDefense}\n\n`;
  text += `👥 المساهمون:\n`;

  for (const [playerName, types] of Object.entries(byPlayer)) {
    text += `\n• ${playerName}:\n`;
    for (const [type, count] of Object.entries(types)) {
      const emoji = type === 'فارس' ? '🛡️' : type === 'رامي' ? '🏹' : type === 'ساحر' ? '✨' : '⚔️';
      text += `  ${emoji} ${type}: ${count}\n`;
    }
  }

  return { success: true, message: text };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 جمع الإنتاج اليومي
// ═══════════════════════════════════════════════════════════════════════════════

export const collectRegionProduction = () => {
  const now = Date.now();
  const hourlyProduction = {};

  for (const [regionId, state] of regionStates) {
    if (!state.controlledBy) continue;

    const region = REGIONS.find(r => r.id === regionId);
    if (!region) continue;

    const hoursPassed = Math.floor((now - state.lastProduction) / 3600000);
    if (hoursPassed < 1) continue;

    const production = region.baseProduction * hoursPassed;
    
    if (!hourlyProduction[state.controlledBy]) {
      hourlyProduction[state.controlledBy] = {};
    }
    
    if (!hourlyProduction[state.controlledBy][region.baseResource]) {
      hourlyProduction[state.controlledBy][region.baseResource] = 0;
    }
    
    hourlyProduction[state.controlledBy][region.baseResource] += production;
  }

  return hourlyProduction;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ غزو منطقة (حرب أقاليم)
// ═══════════════════════════════════════════════════════════════════════════════

export const invadeRegion = (regionId, attackingClanId, attackers) => {
  const region = REGIONS.find(r => r.id === regionId);
  if (!region) {
    return { success: false, message: '❌ منطقة غير موجودة!' };
  }

  const state = getRegionState(regionId);

  if (!state.controlledBy) {
    return { success: false, message: '❌ هذه المنطقة غير محتلة! يمكنك استكشافها بدلاً من ذلك.' };
  }

  if (state.controlledBy === attackingClanId) {
    return { success: false, message: '❌ منطقتك تسيطر بالفعل على هذه المنطقة!' };
  }

  // حساب قوة المهاجمين
  const attackPower = attackers.reduce((sum, a) => sum + (a.attackPower || 100), 0);
  
  // حساب قوة المدافعين
  const defensePower = state.totalDefense;

  // محاكاة المعركة
  const battleResult = attackPower > defensePower ? 'victory' : 'defeat';

  if (battleResult === 'victory') {
    // تغيير السيطرة
    const oldClanId = state.controlledBy;
    state.controlledBy = attackingClanId;
    state.controlledByName = attackers[0]?.clanName;
    
    // خسارة بعض الجنود
    const casualties = Math.floor(state.garrison.length * 0.7);
    state.garrison = state.garrison.slice(casualties);
    state.totalDefense = state.garrison.reduce((sum, g) => {
      const typePower = { 'فارس': 15, 'محارب': 10, 'رامي': 12, 'ساحر': 18, 'شافي': 8 };
      return sum + g.count * (typePower[g.soldierType] || 10);
    }, 0);

    // نهب الموارد
    const lootedResources = {};
    // TODO: تنفيذ نهب الموارد من مخازن الكلان الخاسر

    return {
      success: true,
      victory: true,
      oldClanId,
      casualties,
      message: `🎉 انتصر كلان ${attackers[0]?.clanName} في غزو ${region.name}!\n\n🚩 تم رفع رايتكم على المنطقة!\n💀 قُتل ${casualties} من جنود الحامية`
    };
  } else {
    // فشل الغزو
    return {
      success: true,
      victory: false,
      message: `💀 فشل غزو ${region.name}!\n\n🛡️ صمدت الحامية وصدت الهجوم.\n\nحاول مرة أخرى بقوة أكبر.`
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 تصدير الدوال
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  REGIONS,
  getRegionState,
  exploreRegion,
  fightGuardian,
  sneakIntoRegion,
  addGarrison,
  getGarrisonInfo,
  collectRegionProduction,
  invadeRegion
};
