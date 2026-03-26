// ═══════════════════════════════════════════════════════════════════════════════
// 🏰 نظام الكلانات والمستوطنات - فاطمة بوت v12.0
// يتضمن: إنشاء الكلان، المستوطنة، الحروب، التحديات
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 📢 رابط قناة الواتساب للحروب
// ═══════════════════════════════════════════════════════════════════════════════

export const WAR_CHANNEL = "https://whatsapp.com/channel/0029VbCbgwIKgsNxh9vKb01n";

// ═══════════════════════════════════════════════════════════════════════════════
// 🏗️ تعريفات المباني - نظام المستوطنة
// ═══════════════════════════════════════════════════════════════════════════════

export const BUILDINGS = {
  // القلعة المركزية
  castle: {
    id: 'castle',
    name: 'القلعة المركزية',
    emoji: '🏰',
    description: 'مركز المستوطنة - ترقيتها تزيد سعة الأعضاء والتخزين والدم',
    category: 'main',
    maxLevel: 10,
    baseCost: { gold: 1000, elixir: 500 },
    costMultiplier: 2,
    effects: {
      memberCapacity: [20, 25, 30, 35, 40, 45, 50, 55, 60, 70],
      storageBonus: [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000],
      hpBonus: [0, 50, 100, 150, 200, 250, 300, 400, 500, 600]
    },
    requirements: {}
  },
  
  // مباني الأصناف
  barracks: {
    id: 'barracks',
    name: 'الثكنات',
    emoji: '⚔️',
    description: 'مبنى المحاربين والفرسان - يزيد سعة الجيش وقوته',
    category: 'class',
    classType: ['محارب', 'فارس'],
    maxLevel: 10,
    baseCost: { gold: 500, elixir: 300 },
    costMultiplier: 1.8,
    effects: {
      armyCapacity: [20, 40, 60, 80, 100, 120, 140, 160, 180, 200],
      atkBonus: [0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.2],
      clanAtkBonus: [0, 0.005, 0.01, 0.015, 0.02, 0.025, 0.03, 0.035, 0.04, 0.05]
    },
    requirements: { castle: 1 }
  },
  
  mageTower: {
    id: 'mageTower',
    name: 'برج السحر',
    emoji: '🔮',
    description: 'مبنى السحرة - يزيد الدفاع السحري للمستوطنة',
    category: 'class',
    classType: ['ساحر'],
    maxLevel: 10,
    baseCost: { gold: 500, elixir: 400 },
    costMultiplier: 1.8,
    effects: {
      magBonus: [0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.3],
      magicalDefense: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5],
      clanMagDef: [0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.2]
    },
    requirements: { castle: 1 }
  },
  
  hospital: {
    id: 'hospital',
    name: 'المشفى',
    emoji: '🏥',
    description: 'مبنى الشافين - يسرع استعادة الطاقة ويقلل الخسائر',
    category: 'class',
    classType: ['شافي'],
    maxLevel: 10,
    baseCost: { gold: 600, elixir: 350 },
    costMultiplier: 1.8,
    effects: {
      staminaRegenBonus: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5],
      healBonus: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5],
      warLossReduction: [0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.3]
    },
    requirements: { castle: 1 }
  },
  
  watchtower: {
    id: 'watchtower',
    name: 'برج المراقبة',
    emoji: '🗼',
    description: 'مبنى الرماة والقتلة - يكشف دفاعات العدو ويزيد الدقة',
    category: 'class',
    classType: ['رامي', 'قاتل'],
    maxLevel: 10,
    baseCost: { gold: 450, elixir: 300 },
    costMultiplier: 1.8,
    effects: {
      critBonus: [0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.2],
      enemyDefReveal: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1],
      clanScoutBonus: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5]
    },
    requirements: { castle: 1 }
  },
  
  // مباني الموارد
  goldMine: {
    id: 'goldMine',
    name: 'منجم الذهب',
    emoji: '⛏️',
    description: 'ينتج ذهباً يومياً للمستوطنة',
    category: 'resource',
    maxLevel: 10,
    maxCount: 3,
    baseCost: { gold: 200, elixir: 100 },
    costMultiplier: 1.5,
    effects: {
      production: [50, 100, 150, 200, 300, 400, 500, 700, 900, 1200]
    },
    requirements: {}
  },
  
  elixirCollector: {
    id: 'elixirCollector',
    name: 'جامع الإكسير',
    emoji: '⚗️',
    description: 'ينتج إكسيراً يومياً للمستوطنة',
    category: 'resource',
    maxLevel: 10,
    maxCount: 3,
    baseCost: { gold: 150, elixir: 50 },
    costMultiplier: 1.5,
    effects: {
      production: [30, 60, 90, 120, 180, 240, 300, 420, 540, 720]
    },
    requirements: {}
  },
  
  // مباني الدفاع
  wall: {
    id: 'wall',
    name: 'الأسوار',
    emoji: '🧱',
    description: 'يزيد دفاع المستوطنة في الحروب',
    category: 'defense',
    maxLevel: 10,
    maxCount: 5,
    baseCost: { gold: 300, elixir: 100 },
    costMultiplier: 1.4,
    effects: {
      defenseBonus: [20, 40, 60, 80, 100, 130, 160, 200, 250, 300]
    },
    requirements: { castle: 1 }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🆕 إنشاء كلان جديد
// ═══════════════════════════════════════════════════════════════════════════════

export const createClan = (name, leaderId, leaderName) => {
  const rpgData = getRpgData();
  
  // التحقق من عدم وجود كلان بنفس الاسم
  for (const clan of Object.values(rpgData.clans || {})) {
    if (clan.name.toLowerCase() === name.toLowerCase()) {
      return { success: false, message: '❌ يوجد كلان بهذا الاسم بالفعل!' };
    }
  }
  
  const clanId = `clan_${Date.now()}`;
  const clanTag = String(Math.floor(1000 + Math.random() * 9000));
  
  const newClan = {
    id: clanId,
    name: name,
    clanTag: clanTag,
    level: 1,
    xp: 0,
    gold: 0,
    elixir: 0,
    
    leader: leaderId,
    leaderName: leaderName,
    deputies: [],
    members: [leaderId],
    memberCount: 1,
    
    // المستوطنة
    settlement: {
      buildings: {
        castle: { level: 1 },
        goldMine: [{ level: 1, lastCollected: Date.now() }],
        elixirCollector: [{ level: 1, lastCollected: Date.now() }]
      },
      resources: {
        gold: 500,
        elixir: 250
      },
      lastCollection: Date.now()
    },
    
    // الحروب
    wars: {
      wins: 0,
      losses: 0,
      currentWar: null,
      pendingChallenges: [],
      warHistory: []
    },
    
    wins: 0,
    losses: 0,
    totalDonations: 0,
    announcement: '',
    created: Date.now()
  };
  
  rpgData.clans = rpgData.clans || {};
  rpgData.clans[clanId] = newClan;
  
  return {
    success: true,
    clan: newClan,
    message: `🏰 تم إنشاء كلان "${name}"!\n🏷️ Tag: #${clanTag}\n👥 ابدأ بدعوة الأعضاء!`
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🏗️ نظام المباني
// ═══════════════════════════════════════════════════════════════════════════════

export const upgradeBuilding = (clan, buildingId, buildingIndex = 0) => {
  const buildingDef = BUILDINGS[buildingId];
  if (!buildingDef) {
    return { success: false, message: '❌ مبنى غير موجود!' };
  }
  
  // التحقق من المتطلبات
  if (buildingDef.requirements) {
    for (const [reqBuilding, reqLevel] of Object.entries(buildingDef.requirements)) {
      const currentLevel = clan.settlement?.buildings?.[reqBuilding]?.level || 0;
      if (currentLevel < reqLevel) {
        return { success: false, message: `❌ يتطلب ${BUILDINGS[reqBuilding]?.name || reqBuilding} مستوى ${reqLevel}!` };
      }
    }
  }
  
  // الحصول على المبنى
  let building;
  if (buildingDef.maxCount && buildingDef.maxCount > 1) {
    // مباني متعددة
    clan.settlement.buildings[buildingId] = clan.settlement.buildings[buildingId] || [];
    building = clan.settlement.buildings[buildingId][buildingIndex];
    
    if (!building && clan.settlement.buildings[buildingId].length >= buildingDef.maxCount) {
      return { success: false, message: `❌ وصلت للحد الأقصى من هذا المبنى (${buildingDef.maxCount})!` };
    }
  } else {
    // مبنى فردي
    building = clan.settlement?.buildings?.[buildingId] || { level: 0 };
    clan.settlement.buildings[buildingId] = building;
  }
  
  const currentLevel = building?.level || 0;
  if (currentLevel >= buildingDef.maxLevel) {
    return { success: false, message: `❅ هذا المبنى في أعلى مستوى!` };
  }
  
  // حساب التكلفة
  const cost = {};
  for (const [resource, amount] of Object.entries(buildingDef.baseCost)) {
    cost[resource] = Math.floor(amount * Math.pow(buildingDef.costMultiplier, currentLevel));
  }
  
  // التحقق من الموارد
  for (const [resource, amount] of Object.entries(cost)) {
    if ((clan.settlement?.resources?.[resource] || 0) < amount) {
      return { success: false, message: `❌ تحتاج ${amount} ${resource}!` };
    }
  }
  
  // خصم الموارد
  for (const [resource, amount] of Object.entries(cost)) {
    clan.settlement.resources[resource] -= amount;
  }
  
  // ترقية المبنى
  if (building) {
    building.level++;
  } else {
    building = { level: 1, lastCollected: Date.now() };
    clan.settlement.buildings[buildingId].push(building);
  }
  
  return {
    success: true,
    message: `✅ تم ترقية ${buildingDef.name} للمستوى ${building.level}!`,
    building: building,
    cost: cost
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 جمع الموارد
// ═══════════════════════════════════════════════════════════════════════════════

export const collectResources = (clan) => {
  const now = Date.now();
  const lastCollection = clan.settlement?.lastCollection || now;
  const hoursPassed = Math.min(24, (now - lastCollection) / (60 * 60 * 1000));
  
  const collected = { gold: 0, elixir: 0 };
  
  // جمع من مناجم الذهب
  const goldMines = clan.settlement?.buildings?.goldMine || [];
  for (const mine of goldMines) {
    const production = BUILDINGS.goldMine.effects.production[mine.level - 1] || 0;
    collected.gold += Math.floor(production * hoursPassed / 24);
    mine.lastCollected = now;
  }
  
  // جمع من جامعات الإكسير
  const elixirCollectors = clan.settlement?.buildings?.elixirCollector || [];
  for (const collector of elixirCollectors) {
    const production = BUILDINGS.elixirCollector.effects.production[collector.level - 1] || 0;
    collected.elixir += Math.floor(production * hoursPassed / 24);
    collector.lastCollected = now;
  }
  
  // إضافة للموارد
  clan.settlement.resources.gold = (clan.settlement.resources.gold || 0) + collected.gold;
  clan.settlement.resources.elixir = (clan.settlement.resources.elixir || 0) + collected.elixir;
  clan.settlement.lastCollection = now;
  
  return {
    success: true,
    collected,
    message: `📦 تم جمع:\n💰 ${collected.gold} ذهب\n⚗️ ${collected.elixir} إكسير`
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ نظام الحروب
// ═══════════════════════════════════════════════════════════════════════════════

export const challengeClan = (challengerClan, targetClanId) => {
  const rpgData = getRpgData();
  const targetClan = rpgData.clans[targetClanId];
  
  if (!targetClan) {
    return { success: false, message: '❌ الكلان غير موجود!' };
  }
  
  if (challengerClan.id === targetClanId) {
    return { success: false, message: '❌ لا يمكنك تحدي كلانك!' };
  }
  
  // التحقق من عدم وجود حرب جارية
  if (challengerClan.wars?.currentWar) {
    return { success: false, message: '❅ كلانك في حرب بالفعل!' };
  }
  
  if (targetClan.wars?.currentWar) {
    return { success: false, message: '❅ الكلان المستهدف في حرب!' };
  }
  
  // إنشاء التحدي
  const challenge = {
    id: `challenge_${Date.now()}`,
    challengerId: challengerClan.id,
    challengerName: challengerClan.name,
    challengerTag: challengerClan.clanTag,
    targetId: targetClanId,
    targetName: targetClan.name,
    targetTag: targetClan.clanTag,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 ساعة للقبول
    status: 'pending'
  };
  
  targetClan.wars = targetClan.wars || {};
  targetClan.wars.pendingChallenges = targetClan.wars.pendingChallenges || [];
  targetClan.wars.pendingChallenges.push(challenge);
  
  return {
    success: true,
    challenge,
    message: `⚔️ تم إرسال تحدي إلى ${targetClan.name} #${targetClan.clanTag}!\n⏰ لديهم 24 ساعة للقبول`
  };
};

export const acceptChallenge = (clan, challengeId) => {
  const challenge = clan.wars?.pendingChallenges?.find(c => c.id === challengeId);
  
  if (!challenge) {
    return { success: false, message: '❌ التحدي غير موجود!' };
  }
  
  if (Date.now() > challenge.expiresAt) {
    return { success: false, message: '❅ انتهت صلاحية التحدي!' };
  }
  
  const rpgData = getRpgData();
  const challengerClan = rpgData.clans[challenge.challengerId];
  
  if (!challengerClan) {
    return { success: false, message: '❌ الكلان المتحدي غير موجود!' };
  }
  
  // إنشاء الحرب
  const war = {
    id: `war_${Date.now()}`,
    clan1: {
      id: challenge.challengerId,
      name: challenge.challengerName,
      tag: challenge.challengerTag,
      attacks: [],
      totalDamage: 0,
      destruction: 0
    },
    clan2: {
      id: clan.id,
      name: clan.name,
      tag: clan.clanTag,
      attacks: [],
      totalDamage: 0,
      destruction: 0
    },
    startedAt: Date.now(),
    preparationEnds: Date.now() + 15 * 60 * 1000, // 15 دقيقة تحضير
    warEnds: Date.now() + 24 * 60 * 60 * 1000, // 24 ساعة حرب
    status: 'preparation',
    phase: 1
  };
  
  // تحديث الحالة
  clan.wars.currentWar = war;
  challengerClan.wars.currentWar = war;
  
  // إزالة التحدي
  clan.wars.pendingChallenges = clan.wars.pendingChallenges.filter(c => c.id !== challengeId);
  
  return {
    success: true,
    war,
    message: `⚔️ بدأت الحرب!\n🏰 ${challenge.challengerName} vs ${clan.name}\n⏰ 15 دقيقة تحضير`
  };
};

export const attackInWar = (clan, attackerId, attackerName, attackPower) => {
  if (!clan.wars?.currentWar) {
    return { success: false, message: '❅ لا توجد حرب جارية!' };
  }
  
  const war = clan.wars.currentWar;
  
  if (war.status === 'preparation' && Date.now() < war.preparationEnds) {
    const remaining = Math.ceil((war.preparationEnds - Date.now()) / 60000);
    return { success: false, message: `⏰ فترة التحضير! متبقي ${remaining} دقيقة` };
  }
  
  war.status = 'active';
  
  // تحديد الفريق المهاجم والهدف
  const isClan1 = war.clan1.id === clan.id;
  const attacker = isClan1 ? war.clan1 : war.clan2;
  const target = isClan1 ? war.clan2 : war.clan1;
  
  // حساب الضرر والتدمير
  const defense = calculateWarDefense(target);
  let damage = Math.max(1, attackPower - defense);
  
  // إضافة هجوم عشوائي
  damage += Math.floor(Math.random() * attackPower * 0.3);
  
  const destruction = Math.min(100, (damage / 10000) * 100);
  
  attacker.attacks.push({
    playerId: attackerId,
    playerName: attackerName,
    damage,
    destruction,
    timestamp: Date.now()
  });
  
  attacker.totalDamage += damage;
  attacker.destruction = Math.min(100, attacker.destruction + destruction);
  
  return {
    success: true,
    damage,
    destruction: attacker.destruction,
    enemyDestruction: target.destruction,
    message: `⚔️ هجوم ناجح!\n💥 الضرر: ${damage.toLocaleString()}\n📊 التدمير: ${attacker.destruction.toFixed(1)}%`
  };
};

const calculateWarDefense = (clanWarSide) => {
  const rpgData = getRpgData();
  const clan = rpgData.clans[clanWarSide.id];
  
  let defense = 0;
  
  // من الأسوار
  const walls = clan?.settlement?.buildings?.wall || [];
  for (const wall of walls) {
    defense += BUILDINGS.wall.effects.defenseBonus[wall.level - 1] || 0;
  }
  
  // من القلعة
  const castleLevel = clan?.settlement?.buildings?.castle?.level || 1;
  defense += castleLevel * 50;
  
  return defense;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 التبرع للكلان
// ═══════════════════════════════════════════════════════════════════════════════

export const donateToClan = (player, clan, amount) => {
  if (amount <= 0) {
    return { success: false, message: '❌ أدخل مبلغاً صحيحاً!' };
  }
  
  if ((player.gold || 0) < amount) {
    return { success: false, message: '❌ لا تملك ذهب كافٍ!' };
  }
  
  player.gold -= amount;
  clan.gold = (clan.gold || 0) + amount;
  clan.totalDonations = (clan.totalDonations || 0) + amount;
  player.totalDonated = (player.totalDonated || 0) + amount;
  
  // XP للكلان
  const clanXp = Math.floor(amount / 10);
  clan.xp = (clan.xp || 0) + clanXp;
  
  return {
    success: true,
    message: `💰 تبرعت بـ ${amount} ذهب!\n🏆 الكلان حصل على ${clanXp} XP`
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 تنسيق عرض الكلان
// ═══════════════════════════════════════════════════════════════════════════════

export const formatClanInfo = (clan) => {
  let text = `🏰 ═══════ ${clan.name} ═══════ 🏰\n\n`;
  text += `🏷️ Tag: #${clan.clanTag}\n`;
  text += `⭐ المستوى: ${clan.level || 1}\n`;
  text += `👥 الأعضاء: ${clan.members?.length || 1}/${BUILDINGS.castle.effects.memberCapacity[clan.settlement?.buildings?.castle?.level - 1 || 0]}\n`;
  text += `🏆 الانتصارات: ${clan.wins || 0} | ❌ الخسائر: ${clan.losses || 0}\n\n`;
  
  text += `📊 الموارد:\n`;
  text += `   💰 الذهب: ${(clan.settlement?.resources?.gold || clan.gold || 0).toLocaleString()}\n`;
  text += `   ⚗️ الإكسير: ${(clan.settlement?.resources?.elixir || 0).toLocaleString()}\n\n`;
  
  text += `🏗️ المباني:\n`;
  const buildings = clan.settlement?.buildings || {};
  
  if (buildings.castle) {
    text += `   🏰 القلعة: مستوى ${buildings.castle.level}\n`;
  }
  if (buildings.barracks) {
    text += `   ⚔️ الثكنات: مستوى ${buildings.barracks.level}\n`;
  }
  if (buildings.mageTower) {
    text += `   🔮 برج السحر: مستوى ${buildings.mageTower.level}\n`;
  }
  if (buildings.hospital) {
    text += `   🏥 المشفى: مستوى ${buildings.hospital.level}\n`;
  }
  
  const goldMines = buildings.goldMine || [];
  const elixirCollectors = buildings.elixirCollector || [];
  text += `\n   ⛏️ مناجم الذهب: ${goldMines.length}\n`;
  text += `   ⚗️ جامعات الإكسير: ${elixirCollectors.length}\n`;
  
  if (clan.announcement) {
    text += `\n📢 الإعلان: ${clan.announcement}\n`;
  }
  
  // حالة الحرب
  if (clan.wars?.currentWar) {
    const war = clan.wars.currentWar;
    text += `\n⚔️ حرب جارية!\n`;
    text += `   ${war.clan1.name} vs ${war.clan2.name}\n`;
  }
  
  return text;
};

export const formatBuildingsList = (clan) => {
  let text = `🏗️ ═══════ مباني المستوطنة ═══════ 🏗️\n\n`;
  
  for (const [id, buildingDef] of Object.entries(BUILDINGS)) {
    const building = clan.settlement?.buildings?.[id];
    let level = 0;
    
    if (Array.isArray(building)) {
      level = building.reduce((sum, b) => sum + (b.level || 0), 0);
    } else if (building) {
      level = building.level || 0;
    }
    
    const status = level > 0 ? `✅ Lv.${level}` : '⚪';
    text += `${buildingDef.emoji} ${buildingDef.name} ${status}\n`;
    text += `   ${buildingDef.description}\n`;
    text += `   📊 الحد الأقصى: ${buildingDef.maxLevel}\n\n`;
  }
  
  text += `\n💡 استخدم .بناء <اسم> للترقية`;
  
  return text;
};

export const formatWarStatus = (clan) => {
  if (!clan.wars?.currentWar) {
    return '❌ لا توجد حرب جارية!';
  }
  
  const war = clan.wars.currentWar;
  
  let text = `⚔️ ═══════ حالة الحرب ═══════ ⚔️\n\n`;
  text += `🏰 ${war.clan1.name} #${war.clan1.tag}\n`;
  text += `   📊 التدمير: ${war.clan1.destruction.toFixed(1)}%\n`;
  text += `   ⚔️ الهجمات: ${war.clan1.attacks.length}\n\n`;
  
  text += `⚔️ VS\n\n`;
  
  text += `🏰 ${war.clan2.name} #${war.clan2.tag}\n`;
  text += `   📊 التدمير: ${war.clan2.destruction.toFixed(1)}%\n`;
  text += `   ⚔️ الهجمات: ${war.clan2.attacks.length}\n\n`;
  
  const remaining = Math.max(0, war.warEnds - Date.now());
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  
  text += `⏰ الوقت المتبقي: ${hours}س ${mins}د`;
  
  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 دوال إضافية للتوافق مع plugins/clan.mjs
// ═══════════════════════════════════════════════════════════════════════════════

// إنشاء كلان (للتوافق مع plugin)
export const createClanForGroup = (groupId, clanName, leaderId, leaderName) => {
  const result = createClan(clanName, leaderId, leaderName);
  if (result.success) {
    // تخزين الكلان بمفتاح groupId
    const rpgData = getRpgData();
    rpgData.clans[groupId] = result.clan;
  }
  return result;
};

// التبرع للكلان (للتوافق مع plugin)
export const donateToClanForGroup = (groupId, playerId, amount, playerGold) => {
  const clan = getClan(groupId);
  if (!clan) {
    return { success: false, message: '❌ لا يوجد كلان!' };
  }
  
  if (playerGold < amount) {
    return { success: false, message: '❌ لا تملك ذهب كافٍ!' };
  }
  
  const prevLevel = clan.level;
  
  clan.gold = (clan.gold || 0) + amount;
  clan.totalDonations = (clan.totalDonations || 0) + amount;
  
  // XP للكلان
  const clanXp = Math.floor(amount / 10);
  clan.xp = (clan.xp || 0) + clanXp;
  
  // التحقق من رفع المستوى
  let leveledUp = false;
  let newLevel = clan.level;
  const needed = clanXpForLevel(clan.level);
  if (clan.xp >= needed) {
    clan.level++;
    clan.xp -= needed;
    leveledUp = true;
    newLevel = clan.level;
  }
  
  return {
    success: true,
    leveledUp,
    newLevel
  };
};

// تحدي كلان (للتوافق مع plugin)
export const challengeClanForGroup = async (challengerId, targetId, senderId, sock) => {
  const rpgData = getRpgData();
  const challengerClan = rpgData.clans?.[challengerId];
  const targetClan = rpgData.clans?.[targetId];
  
  if (!challengerClan) {
    return { success: false, message: '❌ جروبك بدون كلان!' };
  }
  
  if (!targetClan) {
    return { success: false, message: '❌ الكلان المستهدف غير موجود!' };
  }
  
  if (challengerId === targetId) {
    return { success: false, message: '❌ لا يمكنك تحدي كلانك!' };
  }
  
  if (challengerClan.wars?.currentWar) {
    return { success: false, message: '❅ كلانك في حرب بالفعل!' };
  }
  
  if (targetClan.wars?.currentWar) {
    return { success: false, message: '❅ الكلان المستهدف في حرب!' };
  }
  
  // إنشاء الحرب مباشرة
  const war = {
    id: `war_${Date.now()}`,
    challengerId,
    challengerName: challengerClan.name,
    targetId,
    targetName: targetClan.name,
    challengerDamage: 0,
    targetDamage: 0,
    prizePool: Math.floor((challengerClan.gold || 0) * 0.1) + 500,
    startedAt: Date.now(),
    endsAt: Date.now() + 30 * 60 * 1000, // 30 دقيقة
    status: 'active'
  };
  
  challengerClan.wars = challengerClan.wars || {};
  challengerClan.wars.currentWar = war;
  
  targetClan.wars = targetClan.wars || {};
  targetClan.wars.currentWar = war;
  
  return {
    success: true,
    challengerName: challengerClan.name,
    targetName: targetClan.name,
    prizePool: war.prizePool
  };
};

// قبول التحدي (للتوافق مع plugin)
export const acceptChallengeForGroup = async (challengeId, playerId, sock) => {
  // البحث عن التحدي
  const rpgData = getRpgData();
  
  for (const [groupId, clan] of Object.entries(rpgData.clans || {})) {
    if (clan.wars?.pendingChallenges) {
      const challenge = clan.wars.pendingChallenges.find(c => c.id === challengeId);
      if (challenge) {
        // إنشاء الحرب
        const war = {
          id: `war_${Date.now()}`,
          challengerId: challenge.challengerId,
          challengerName: challenge.challengerName,
          targetId: groupId,
          targetName: clan.name,
          challengerDamage: 0,
          targetDamage: 0,
          prizePool: challenge.prizePool || 1000,
          startedAt: Date.now(),
          endsAt: Date.now() + 30 * 60 * 1000,
          status: 'active'
        };
        
        clan.wars.currentWar = war;
        clan.wars.pendingChallenges = clan.wars.pendingChallenges.filter(c => c.id !== challengeId);
        
        return {
          success: true,
          war
        };
      }
    }
  }
  
  return { success: false, message: '❌ التحدي غير موجود!' };
};

// الحصول على كلان بالمعرف
export const getClan = (clanId) => {
  const rpgData = getRpgData();
  return rpgData.clans?.[clanId] || null;
};

// الهجوم في الحرب (للتوافق مع plugin)
export const attackInWarForGroup = (warId, groupId, playerId, attackPower) => {
  const clan = getClan(groupId);
  if (!clan || !clan.wars?.currentWar || clan.wars.currentWar.id !== warId) {
    return { success: false, message: '❌ لا توجد حرب نشطة!' };
  }
  
  const war = clan.wars.currentWar;
  
  // تحديد الفريق
  const isChallenger = war.challengerId === groupId;
  
  // حساب الضرر
  let damage = Math.floor(attackPower * (0.8 + Math.random() * 0.4));
  
  if (isChallenger) {
    war.challengerDamage = (war.challengerDamage || 0) + damage;
  } else {
    war.targetDamage = (war.targetDamage || 0) + damage;
  }
  
  return {
    success: true,
    damage,
    totalDamage: isChallenger ? war.challengerDamage : war.targetDamage
  };
};

// الانضمام للكلان
export const joinClan = (clanId, playerId) => {
  const rpgData = getRpgData();
  const clan = rpgData.clans?.[clanId];
  
  if (!clan) {
    return { success: false, message: '❌ الكلان غير موجود!' };
  }
  
  if (clan.members.includes(playerId)) {
    return { success: false, message: '❅ أنت عضو بالفعل!' };
  }
  
  const maxMembers = BUILDINGS.castle.effects.memberCapacity[clan.settlement?.buildings?.castle?.level - 1] || 20;
  
  if (clan.members.length >= maxMembers) {
    return { success: false, message: '❅ الكلان ممتلئ!' };
  }
  
  clan.members.push(playerId);
  clan.memberCount = clan.members.length;
  
  return { success: true, message: `✅ انضممت لكلان ${clan.name}!` };
};

// الحصول على باف الكلان حسب المستوى
export const getClanBuff = (level) => {
  return {
    atk: level * 0.5,
    defense: level * 0.3,
    discount: level * 0.2
  };
};

// XP المطلوب لمستوى الكلان
export const clanXpForLevel = (level) => {
  return Math.floor(100 * Math.pow(level, 1.5));
};

// شريط تقدم الكلان
export const progressClanBar = (xp, level) => {
  const needed = clanXpForLevel(level);
  const progress = Math.min(xp / needed, 1);
  return '▓'.repeat(Math.floor(progress * 8)) + '░'.repeat(8 - Math.floor(progress * 8));
};

// رفض التحدي
export const rejectChallenge = async (challengeId, sock) => {
  const rpgData = getRpgData();
  
  for (const clan of Object.values(rpgData.clans || {})) {
    if (clan.wars?.pendingChallenges) {
      const index = clan.wars.pendingChallenges.findIndex(c => c.id === challengeId);
      if (index !== -1) {
        clan.wars.pendingChallenges.splice(index, 1);
        return true;
      }
    }
  }
  return false;
};

// الحصول على التحديات المعلقة
export const getPendingChallenges = (clanId) => {
  const clan = getClan(clanId);
  return clan?.wars?.pendingChallenges || [];
};

// إنهاء الحرب
export const endWar = (warId) => {
  const rpgData = getRpgData();
  
  for (const clan of Object.values(rpgData.clans || {})) {
    if (clan.wars?.currentWar?.id === warId) {
      clan.wars.warHistory = clan.wars.warHistory || [];
      clan.wars.warHistory.push(clan.wars.currentWar);
      clan.wars.currentWar = null;
    }
  }
};

// الحصول على الحرب النشطة
export const getActiveWar = (clanId) => {
  const clan = getClan(clanId);
  return clan?.wars?.currentWar || null;
};

// الحصول على الكلانات المتاحة
export const getAvailableClans = (excludeClanId) => {
  const rpgData = getRpgData();
  const clans = [];
  
  for (const [id, clan] of Object.entries(rpgData.clans || {})) {
    if (id !== excludeClanId) {
      clans.push({
        id,
        name: clan.name,
        level: clan.level,
        members: clan.members?.length || 0,
        wins: clan.wins || 0
      });
    }
  }
  
  return clans;
};

// الحصول على كلان اللاعب
export const getPlayerClan = (playerId) => {
  const rpgData = getRpgData();
  
  for (const clan of Object.values(rpgData.clans || {})) {
    if (clan.members?.includes(playerId)) {
      return clan;
    }
  }
  return null;
};

// ملخص أحداث الكلان
export const getClanEventSummary = (clanId) => {
  const clan = getClan(clanId);
  if (!clan) return null;
  
  return {
    totalWars: (clan.wins || 0) + (clan.losses || 0),
    wins: clan.wins || 0,
    losses: clan.losses || 0,
    totalDonations: clan.totalDonations || 0
  };
};
