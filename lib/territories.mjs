// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ نظام الأقاليم والاستكشاف - فاطمة بوت v12.0
// بديل نظام القرية مع صراع الأقاليم والحروب
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ تعريف الأقاليم
// ═══════════════════════════════════════════════════════════════════════════════

export const TERRITORY_TYPES = {
  gold_mine: {
    id: 'gold_mine',
    name: 'منجم الذهب',
    emoji: '⛏️',
    typeName: 'إنتاج ذهب',
    production: { gold: 500 },
    guardianLevel: [10, 20, 30, 40, 50],
    guardianNames: ['غول المنجم', 'عفريت الذهب', 'تنين الكهف', 'حارس الكنز', 'ملك المناجم']
  },
  crystal_cave: {
    id: 'crystal_cave',
    name: 'كهف الكريستال',
    emoji: '💎',
    typeName: 'إنتاج إكسير',
    production: { elixir: 300 },
    guardianLevel: [15, 25, 35, 45, 55],
    guardianNames: ['عنكبوت كريستالي', 'غول البلور', 'حارس الأحجار', 'ساحر الكهف', 'ملك الكريستال']
  },
  dark_forest: {
    id: 'dark_forest',
    name: 'الغابة المظلمة',
    emoji: '🌲',
    typeName: 'إنتاج خشب',
    production: { wood: 400 },
    guardianLevel: [8, 18, 28, 38, 48],
    guardianNames: ['ذئب ضخم', 'دب الغابة', 'شجرة حية', 'ساحر الغابة', 'روح الغابة']
  },
  dragon_peak: {
    id: 'dragon_peak',
    name: 'قمة التنين',
    emoji: '🏔️',
    typeName: 'إنتاج متعدد',
    production: { gold: 300, elixir: 200, wood: 100 },
    guardianLevel: [30, 40, 50, 60, 70],
    guardianNames: ['تنين صغير', 'تنين أزرق', 'تنين أحمر', 'تنين أسود', 'ملك التنانين']
  },
  ancient_ruins: {
    id: 'ancient_ruins',
    name: 'الأطلال القديمة',
    emoji: '🏛️',
    typeName: 'إنتاج نادر',
    production: { gold: 200, elixir: 400 },
    guardianLevel: [25, 35, 45, 55, 65],
    guardianNames: ['محارب قديم', 'فرعون ملعون', 'مومياء', 'حارس المقبرة', 'ملك الأطلال']
  },
  swamp_lands: {
    id: 'swamp_lands',
    name: 'أراضي المستنقعات',
    emoji: '🐸',
    typeName: 'إنتاج حجري',
    production: { stone: 350 },
    guardianLevel: [12, 22, 32, 42, 52],
    guardianNames: ['ضفدع عملاق', 'تمساح المستنقع', 'وحل حي', 'ساحرة المستنقع', 'ملك المستنقعات']
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🆕 إنشاء إقليم جديد
// ═══════════════════════════════════════════════════════════════════════════════

export const createTerritory = (typeId, name = null) => {
  const type = TERRITORY_TYPES[typeId];
  if (!type) return null;
  
  const territoryId = `territory_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  
  // تحديد مستوى الحارس عشوائياً
  const guardianTier = Math.floor(Math.random() * type.guardianLevel.length);
  
  return {
    id: territoryId,
    type: typeId,
    name: name || type.name,
    emoji: type.emoji,
    typeName: type.typeName,
    production: { ...type.production },
    
    // الحارس
    guardian: {
      name: type.guardianNames[guardianTier],
      level: type.guardianLevel[guardianTier],
      tier: guardianTier,
      hp: type.guardianLevel[guardianTier] * 100,
      atk: Math.floor(type.guardianLevel[guardianTier] * 4),
      def: Math.floor(type.guardianLevel[guardianTier] * 2)
    },
    
    // الملكية
    ownerClan: null,
    capturedAt: null,
    
    // الحامية
    garrison: {
      soldiers: [], // [{ playerId, count, type }]
      total: 0,
      defense: 0
    },
    
    // الضرائب
    taxRate: 0.10, // 10%
    totalCollected: { gold: 0, elixir: 0, wood: 0, stone: 0 },
    
    created: Date.now()
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ استكشاف إقليم
// ═══════════════════════════════════════════════════════════════════════════════

export const exploreTerritory = (player) => {
  const rpgData = getRpgData();
  
  // التحقق من الطاقة
  if ((player.stamina || 0) < 1) {
    return { success: false, message: '❌ لا تملك طاقة كافية!' };
  }
  
  // استهلاك الطاقة
  player.stamina--;
  
  // اختيار نوع الإقليم عشوائياً
  const types = Object.keys(TERRITORY_TYPES);
  const randomType = types[Math.floor(Math.random() * types.length)];
  
  // إنشاء الإقليم
  const territory = createTerritory(randomType);
  
  // تخزين الإقليم المكتشف
  if (!rpgData.territories) rpgData.territories = {};
  rpgData.territories[territory.id] = territory;
  
  saveDatabase();
  
  return {
    success: true,
    territory,
    message: `🗺️ اكتشفت ${territory.emoji} ${territory.name}!\n👹 يحرسه: ${territory.guardian.name} (Lv.${territory.guardian.level})`
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ قتال الحارس
// ═══════════════════════════════════════════════════════════════════════════════

export const fightGuardian = (player, territoryId, clanId) => {
  const rpgData = getRpgData();
  const territory = rpgData.territories?.[territoryId];
  
  if (!territory) {
    return { success: false, message: '❌ الإقليم غير موجود!' };
  }
  
  // التحقق من الكلان
  if (!clanId) {
    return { success: false, message: '❌ يجب أن تكون في كلان للاحتلال!' };
  }
  
  // التحقق من الطاقة
  if ((player.stamina || 0) < 1) {
    return { success: false, message: '❌ لا تملك طاقة كافية!' };
  }
  
  // التحقق من HP
  if (player.hp <= player.maxHp * 0.2) {
    return { success: false, message: '❌ صحتك ضعيفة! استخدم .علاج أولاً' };
  }
  
  player.stamina--;
  
  const guardian = territory.guardian;
  
  // محاكاة المعركة
  let playerHp = player.hp;
  let guardianHp = guardian.hp;
  const log = [];
  
  while (playerHp > 0 && guardianHp > 0) {
    // هجوم اللاعب
    const playerDmg = Math.max(1, player.atk - guardian.def + Math.floor(Math.random() * 20));
    guardianHp -= playerDmg;
    log.push(`⚔️ ${player.name}: ${playerDmg}`);
    
    if (guardianHp <= 0) break;
    
    // هجوم الحارس
    const guardianDmg = Math.max(1, guardian.atk - player.def + Math.floor(Math.random() * 15));
    playerHp -= guardianDmg;
    log.push(`${territory.emoji} ${guardian.name}: ${guardianDmg}`);
  }
  
  if (playerHp > 0) {
    // انتصار!
    player.hp = playerHp;
    player.xp = (player.xp || 0) + guardian.level * 10;
    player.gold = (player.gold || 0) + guardian.level * 50;
    
    // احتلال الإقليم
    territory.ownerClan = clanId;
    territory.capturedAt = Date.now();
    territory.guardian = null; // الحارس هُزم
    
    saveDatabase();
    
    return {
      success: true,
      won: true,
      log: log.slice(-8),
      message: `🏆 انتصرت على ${guardian.name}!\n🏰 تم احتلال ${territory.name} لصالح كلانك!`,
      rewards: {
        xp: guardian.level * 10,
        gold: guardian.level * 50
      }
    };
  } else {
    // هزيمة
    player.hp = Math.floor(player.maxHp * 0.3);
    player.losses = (player.losses || 0) + 1;
    
    saveDatabase();
    
    return {
      success: true,
      won: false,
      log: log.slice(-8),
      message: `💔 هُزمت بواسطة ${guardian.name}!`
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🕵️ التسلل (للقاتل والرامي فقط)
// ═══════════════════════════════════════════════════════════════════════════════

export const stealthRaid = (player, territoryId) => {
  const rpgData = getRpgData();
  const territory = rpgData.territories?.[territoryId];
  
  if (!territory) {
    return { success: false, message: '❌ الإقليم غير موجود!' };
  }
  
  // التحقق من الصنف
  if (!['قاتل', 'رامي'].includes(player.class)) {
    return { success: false, message: '❌ هذا الأمر للقاتل والرامي فقط!' };
  }
  
  // التحقق من الطاقة
  if ((player.stamina || 0) < 1) {
    return { success: false, message: '❌ لا تملك طاقة كافية!' };
  }
  
  player.stamina--;
  
  // فرصة النجاح 50%
  const success = Math.random() < 0.5;
  
  if (success) {
    // سرقة موارد
    const stolen = {};
    for (const [resource, amount] of Object.entries(territory.production)) {
      stolen[resource] = Math.floor(amount * 0.5);
    }
    
    // إضافة للمخزون
    for (const [resource, amount] of Object.entries(stolen)) {
      if (resource === 'gold') {
        player.gold = (player.gold || 0) + amount;
      }
    }
    
    saveDatabase();
    
    return {
      success: true,
      stolen,
      message: `🕵️ نجحت في التسلل!\n💰 سرقت:\n${Object.entries(stolen).map(([r, a]) => `${r}: ${a}`).join('\n')}`
    };
  } else {
    // فشل - الحارس يهاجم
    const damage = Math.floor(territory.guardian?.atk || 20);
    player.hp = Math.max(1, player.hp - damage);
    
    saveDatabase();
    
    return {
      success: true,
      failed: true,
      message: `🚨 اكتشفك الحارس!\n💔 خسرت ${damage} HP`
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ نظام الحامية
// ═══════════════════════════════════════════════════════════════════════════════

export const deployGarrison = (player, territoryId, soldierCount) => {
  const rpgData = getRpgData();
  const territory = rpgData.territories?.[territoryId];
  
  if (!territory) {
    return { success: false, message: '❌ الإقليم غير موجود!' };
  }
  
  // التحقق من الملكية
  if (territory.ownerClan !== player.clanId) {
    return { success: false, message: '❌ هذا الإقليم لا يتبع لكلانك!' };
  }
  
  // التحقق من الجنود المتاحين
  const availableSoldiers = player.village?.units?.trained || [];
  if (availableSoldiers.length < soldierCount) {
    return { success: false, message: `❌ لا تملك ${soldierCount} جندي! لديك ${availableSoldiers.length}` };
  }
  
  // سحب الجنود
  const deployedSoldiers = availableSoldiers.splice(0, soldierCount);
  
  // إضافة للحامية
  if (!territory.garrison) {
    territory.garrison = { soldiers: [], total: 0, defense: 0 };
  }
  
  territory.garrison.soldiers.push({
    playerId: player.id,
    playerName: player.name,
    playerClass: player.class,
    count: soldierCount,
    deployedAt: Date.now()
  });
  
  territory.garrison.total += soldierCount;
  territory.garrison.defense += soldierCount * (player.def || 10);
  
  // تحديث مخزون اللاعب
  player.village.units.trained = availableSoldiers;
  
  saveDatabase();
  
  return {
    success: true,
    message: `🛡️ تم نشر ${soldierCount} جندي في ${territory.name}!\n📊 إجمالي الحامية: ${territory.garrison.total} جندي`
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ غزو الإقليم
// ═══════════════════════════════════════════════════════════════════════════════

export const invadeTerritory = (attackers, territoryId, attackerClanId) => {
  const rpgData = getRpgData();
  const territory = rpgData.territories?.[territoryId];
  
  if (!territory) {
    return { success: false, message: '❌ الإقليم غير موجود!' };
  }
  
  // التحقق من الملكية
  if (territory.ownerClan === attackerClanId) {
    return { success: false, message: '❌ لا يمكنك غزو إقليم كلانك!' };
  }
  
  if (!territory.ownerClan) {
    return { success: false, message: '❌ هذا الإقليم غير محتل! استخدم .استكشاف أولاً' };
  }
  
  // حساب قوة الهجوم
  let totalAttack = 0;
  for (const attacker of attackers) {
    totalAttack += (attacker.atk || 10) + Math.floor(Math.random() * 10);
  }
  
  // حساب قوة الدفاع
  const totalDefense = territory.garrison?.defense || 0;
  const defenderClan = rpgData.clans?.[territory.ownerClan];
  
  // محاكاة المعركة
  const attackerPower = totalAttack * (1 + Math.random() * 0.3);
  const defenderPower = totalDefense * (1 + Math.random() * 0.3);
  
  const log = [];
  log.push(`⚔️ قوة الهجوم: ${Math.floor(attackerPower)}`);
  log.push(`🛡️ قوة الدفاع: ${Math.floor(defenderPower)}`);
  
  // الخسائر
  const attackerLosses = Math.floor(defenderPower * 0.1);
  const defenderLosses = Math.floor(attackerPower * 0.1);
  
  if (attackerPower > defenderPower) {
    // انتصار المهاجمين
    const previousOwner = territory.ownerClan;
    
    // نقل الملكية
    territory.ownerClan = attackerClanId;
    territory.capturedAt = Date.now();
    
    // إعادة حساب الحامية
    const survivingSoldiers = Math.max(0, (territory.garrison?.total || 0) - defenderLosses);
    territory.garrison = {
      soldiers: [],
      total: 0,
      defense: 0
    };
    
    // نهب الموارد
    const looted = {};
    for (const [resource, amount] of Object.entries(territory.production)) {
      looted[resource] = Math.floor(amount * 2);
    }
    
    // توزيع الغنائم
    for (const attacker of attackers) {
      attacker.gold = (attacker.gold || 0) + (looted.gold || 0) / attackers.length;
      attacker.xp = (attacker.xp || 0) + 50;
    }
    
    // تحديث إحصائيات الكلانات
    if (defenderClan) {
      defenderClan.losses = (defenderClan.losses || 0) + 1;
    }
    const attackerClan = rpgData.clans?.[attackerClanId];
    if (attackerClan) {
      attackerClan.wins = (attackerClan.wins || 0) + 1;
    }
    
    saveDatabase();
    
    return {
      success: true,
      won: true,
      log,
      looted,
      message: `🏆 انتصار!\n🏰 تم احتلال ${territory.name}!\n💰 الغنائم:\n${Object.entries(looted).map(([r, a]) => `${r}: ${a}`).join('\n')}`
    };
  } else {
    // انتصار المدافعين
    // خسائر المهاجمين
    for (const attacker of attackers) {
      attacker.hp = Math.max(1, attacker.hp - Math.floor(attackerLosses / attackers.length));
    }
    
    // تحديث الحامية
    if (territory.garrison) {
      territory.garrison.total = Math.max(0, (territory.garrison.total || 0) - defenderLosses);
    }
    
    saveDatabase();
    
    return {
      success: true,
      won: false,
      log,
      message: `🛡️ صمدت الدفاعات!\n💔 خسرتم المعركة`
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 عرض معلومات الإقليم
// ═══════════════════════════════════════════════════════════════════════════════

export const formatTerritoryInfo = (territory, clanName = null) => {
  let text = `🗺️ ═══════ ${territory.name} ═══════ 🗺️\n\n`;
  text += `${territory.emoji} النوع: ${territory.typeName}\n`;
  
  if (territory.ownerClan) {
    text += `🏰 المالك: ${clanName || 'كلان غير معروف'}\n`;
  } else {
    text += `🏳️ غير محتول\n`;
  }
  
  text += `\n📦 الإنتاج اليومي:\n`;
  for (const [resource, amount] of Object.entries(territory.production || {})) {
    text += `   ${resource}: ${amount}\n`;
  }
  
  if (territory.guardian) {
    text += `\n👹 الحارس:\n`;
    text += `   ${territory.guardian.name} (Lv.${territory.guardian.level})\n`;
    text += `   ❤️ HP: ${territory.guardian.hp}\n`;
  }
  
  if (territory.garrison?.total > 0) {
    text += `\n🛡️ الحامية:\n`;
    text += `   إجمالي الجنود: ${territory.garrison.total}\n`;
    text += `   قوة الدفاع: ${territory.garrison.defense}\n`;
  }
  
  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 عرض الحامية
// ═══════════════════════════════════════════════════════════════════════════════

export const formatGarrisonInfo = (territory) => {
  if (!territory.garrison || territory.garrison.soldiers.length === 0) {
    return '🛡️ لا توجد حامية في هذا الإقليم!';
  }
  
  let text = `🛡️ ═══════ حامية ${territory.name} ═══════ 🛡️\n\n`;
  
  for (const soldier of territory.garrison.soldiers) {
    const classEmoji = { 'محارب': '⚔️', 'فارس': '🛡️', 'رامي': '🏹', 'ساحر': '🧙', 'شافي': '💚', 'قاتل': '🗡️' };
    text += `${classEmoji[soldier.playerClass] || '👤'} ${soldier.playerName}\n`;
    text += `   👥 ${soldier.count} جندي\n\n`;
  }
  
  text += `📊 الإجمالي: ${territory.garrison.total} جندي\n`;
  text += `🛡️ قوة الدفاع: ${territory.garrison.defense}`;
  
  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 سحب الجنود
// ═══════════════════════════════════════════════════════════════════════════════

export const withdrawGarrison = (player, territoryId) => {
  const rpgData = getRpgData();
  const territory = rpgData.territories?.[territoryId];
  
  if (!territory) {
    return { success: false, message: '❌ الإقليم غير موجود!' };
  }
  
  // البحث عن جنود اللاعب
  const soldierIndex = territory.garrison?.soldiers?.findIndex(s => s.playerId === player.id);
  
  if (soldierIndex === -1 || soldierIndex === undefined) {
    return { success: false, message: '❌ ليس لديك جنود في هذا الإقليم!' };
  }
  
  const soldier = territory.garrison.soldiers[soldierIndex];
  
  // إعادة الجنود للاعب
  player.village = player.village || {};
  player.village.units = player.village.units || {};
  player.village.units.trained = player.village.units.trained || [];
  
  for (let i = 0; i < soldier.count; i++) {
    player.village.units.trained.push({ type: soldier.playerClass });
  }
  
  // إزالة من الحامية
  territory.garrison.soldiers.splice(soldierIndex, 1);
  territory.garrison.total -= soldier.count;
  territory.garrison.defense -= soldier.count * (player.def || 10);
  
  saveDatabase();
  
  return {
    success: true,
    count: soldier.count,
    message: `✅ تم سحب ${soldier.count} جندي من الحامية!`
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 قائمة أقاليم الكلان
// ═══════════════════════════════════════════════════════════════════════════════

export const getClanTerritories = (clanId) => {
  const rpgData = getRpgData();
  const territories = [];
  
  for (const [id, territory] of Object.entries(rpgData.territories || {})) {
    if (territory.ownerClan === clanId) {
      territories.push(territory);
    }
  }
  
  return territories;
};

export default {
  TERRITORY_TYPES,
  createTerritory,
  exploreTerritory,
  fightGuardian,
  stealthRaid,
  deployGarrison,
  invadeTerritory,
  formatTerritoryInfo,
  formatGarrisonInfo,
  withdrawGarrison,
  getClanTerritories
};
