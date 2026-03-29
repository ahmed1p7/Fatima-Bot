// ═══════════════════════════════════════════════════════════════════════════════
// 🏰 نظام الكلانات والمستوطنات - فاطمة بوت v12.0 (محدث)
// يتضمن: إنشاء الكلان، المستوطنة، الحروب، التحديات
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 📢 رابط قناة الواتساب للحروب (يمكن تغييره من الإعدادات)
// ═══════════════════════════════════════════════════════════════════════════════

export let WAR_CHANNEL = "120363408713799197@newsletter"; // جيد القناة الثابت
export const setWarChannel = (jid) => { WAR_CHANNEL = jid; };

// ═══════════════════════════════════════════════════════════════════════════════
// 🏗️ تعريفات المباني - نظام المستوطنة
// ═══════════════════════════════════════════════════════════════════════════════

export const BUILDINGS = {
  castle: {
    id: 'castle', name: 'القلعة المركزية', emoji: '🏰',
    description: 'مركز المستوطنة - ترقيتها تزيد سعة الأعضاء والتخزين والدم',
    category: 'main', maxLevel: 10,
    baseCost: { gold: 1000, elixir: 500 }, costMultiplier: 2,
    effects: {
      memberCapacity: [20, 25, 30, 35, 40, 45, 50, 55, 60, 70],
      storageBonus: [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000],
      hpBonus: [0, 50, 100, 150, 200, 250, 300, 400, 500, 600]
    },
    requirements: {}
  },
  barracks: {
    id: 'barracks', name: 'الثكنات', emoji: '⚔️',
    description: 'مبنى المحاربين والفرسان - يزيد سعة الجيش وقوته',
    category: 'class', classType: ['محارب', 'فارس'], maxLevel: 10,
    baseCost: { gold: 500, elixir: 300 }, costMultiplier: 1.8,
    effects: {
      armyCapacity: [20, 40, 60, 80, 100, 120, 140, 160, 180, 200],
      atkBonus: [0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.2],
      clanAtkBonus: [0, 0.005, 0.01, 0.015, 0.02, 0.025, 0.03, 0.035, 0.04, 0.05]
    },
    requirements: { castle: 1 }
  },
  mageTower: {
    id: 'mageTower', name: 'برج السحر', emoji: '🔮',
    description: 'مبنى السحرة - يزيد الدفاع السحري للمستوطنة',
    category: 'class', classType: ['ساحر'], maxLevel: 10,
    baseCost: { gold: 500, elixir: 400 }, costMultiplier: 1.8,
    effects: {
      magBonus: [0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.3],
      magicalDefense: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5],
      clanMagDef: [0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.2]
    },
    requirements: { castle: 1 }
  },
  hospital: {
    id: 'hospital', name: 'المشفى', emoji: '🏥',
    description: 'مبنى الشافين - يسرع استعادة الطاقة ويقلل الخسائر',
    category: 'class', classType: ['شافي'], maxLevel: 10,
    baseCost: { gold: 600, elixir: 350 }, costMultiplier: 1.8,
    effects: {
      staminaRegenBonus: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5],
      healBonus: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5],
      warLossReduction: [0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.3]
    },
    requirements: { castle: 1 }
  },
  watchtower: {
    id: 'watchtower', name: 'برج المراقبة', emoji: '🗼',
    description: 'مبنى الرماة والقتلة - يكشف دفاعات العدو ويزيد الدقة',
    category: 'class', classType: ['رامي', 'قاتل'], maxLevel: 10,
    baseCost: { gold: 450, elixir: 300 }, costMultiplier: 1.8,
    effects: {
      critBonus: [0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.2],
      enemyDefReveal: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1],
      clanScoutBonus: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5]
    },
    requirements: { castle: 1 }
  },
  goldMine: {
    id: 'goldMine', name: 'منجم الذهب', emoji: '⛏️',
    description: 'ينتج ذهباً يومياً للمستوطنة',
    category: 'resource', maxLevel: 10, maxCount: 3,
    baseCost: { gold: 200, elixir: 100 }, costMultiplier: 1.5,
    effects: { production: [50, 100, 150, 200, 300, 400, 500, 700, 900, 1200] },
    requirements: {}
  },
  elixirCollector: {
    id: 'elixirCollector', name: 'جامع الإكسير', emoji: '⚗️',
    description: 'ينتج إكسيراً يومياً للمستوطنة',
    category: 'resource', maxLevel: 10, maxCount: 3,
    baseCost: { gold: 150, elixir: 50 }, costMultiplier: 1.5,
    effects: { production: [30, 60, 90, 120, 180, 240, 300, 420, 540, 720] },
    requirements: {}
  },
  wall: {
    id: 'wall', name: 'الأسوار', emoji: '🧱',
    description: 'يزيد دفاع المستوطنة في الحروب',
    category: 'defense', maxLevel: 10, maxCount: 5,
    baseCost: { gold: 300, elixir: 100 }, costMultiplier: 1.4,
    effects: { defenseBonus: [20, 40, 60, 80, 100, 130, 160, 200, 250, 300] },
    requirements: { castle: 1 }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🆕 إنشاء كلان جديد (باستخدام معرف المجموعة كمفتاح)
// ═══════════════════════════════════════════════════════════════════════════════

export const createClan = (groupId, name, leaderId, leaderName) => {
  const rpgData = getRpgData();
  if (rpgData.clans?.[groupId]) {
    return { success: false, message: '❌ يوجد كلان بالفعل في هذه المجموعة!' };
  }
  const clanTag = String(Math.floor(1000 + Math.random() * 9000));
  const newClan = {
    id: groupId,
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
    settlement: {
      buildings: {
        castle: { level: 1 },
        goldMine: [{ level: 1, lastCollected: Date.now() }],
        elixirCollector: [{ level: 1, lastCollected: Date.now() }]
      },
      resources: { gold: 500, elixir: 250 },
      lastCollection: Date.now()
    },
    wars: { wins: 0, losses: 0, currentWar: null, pendingChallenges: [], warHistory: [] },
    wins: 0, losses: 0, totalDonations: 0, announcement: '', created: Date.now()
  };
  rpgData.clans = rpgData.clans || {};
  rpgData.clans[groupId] = newClan;
  saveDatabase();
  return { success: true, clan: newClan, message: `✅ تم إنشاء كلان "${name}"!\n🏷️ Tag: #${clanTag}` };
};

// الحصول على كلان من معرف المجموعة
export const getClan = (groupId) => {
  const data = getRpgData();
  return data.clans?.[groupId] || null;
};

// الانضمام للكلان
export const joinClan = (clanId, playerId) => {
  const clan = getClan(clanId);
  if (!clan) return { success: false, message: '❌ الكلان غير موجود!' };
  if (clan.members.includes(playerId)) return { success: false, message: '❅ أنت عضو بالفعل!' };
  const maxMembers = BUILDINGS.castle.effects.memberCapacity[clan.settlement?.buildings?.castle?.level - 1] || 20;
  if (clan.members.length >= maxMembers) return { success: false, message: '❅ الكلان ممتلئ!' };
  clan.members.push(playerId);
  clan.memberCount = clan.members.length;
  saveDatabase();
  return { success: true, message: `✅ انضممت لكلان ${clan.name}!` };
};

// التبرع للكلان
export const donateToClan = (clan, player, amount) => {
  if (!clan) return { success: false, message: '❌ لا يوجد كلان!' };
  if (amount <= 0) return { success: false, message: '❌ أدخل مبلغاً صحيحاً!' };
  if ((player.gold || 0) < amount) return { success: false, message: '❌ لا تملك ذهب كافٍ!' };
  player.gold -= amount;
  clan.gold = (clan.gold || 0) + amount;
  clan.totalDonations = (clan.totalDonations || 0) + amount;
  player.totalDonated = (player.totalDonated || 0) + amount;
  const clanXp = Math.floor(amount / 10);
  clan.xp = (clan.xp || 0) + clanXp;
  let leveledUp = false, newLevel = clan.level;
  const needed = clanXpForLevel(clan.level);
  if (clan.xp >= needed) {
    clan.level++;
    clan.xp -= needed;
    leveledUp = true;
    newLevel = clan.level;
  }
  saveDatabase();
  return { success: true, leveledUp, newLevel, message: `💰 تبرعت بـ ${amount.toLocaleString()} ذهب!\n🏆 الكلان حصل على ${clanXp} XP` };
};

// نقل القيادة
export const transferClanLeadership = (clan, newLeaderId, currentLeaderId) => {
  if (!isClanLeader(clan, currentLeaderId)) return { success: false, message: '❌ فقط قائد الكلان يستطيع نقل القيادة!' };
  if (!clan.members.includes(newLeaderId)) return { success: false, message: '❌ العضو الجديد ليس في الكلان!' };
  const data = getRpgData();
  const newLeaderName = data.players?.[newLeaderId]?.name || 'غير معروف';
  const oldLeaderName = clan.leaderName;
  clan.leader = newLeaderId;
  clan.leaderName = newLeaderName;
  saveDatabase();
  return { success: true, message: `✅ تم نقل قيادة الكلان!\n👑 من: ${oldLeaderName}\n👑 إلى: ${newLeaderName}` };
};

// حذف الكلان
export const deleteClan = (clan, leaderId) => {
  if (!isClanLeader(clan, leaderId)) return { success: false, message: '❌ فقط قائد الكلان يستطيع حذف الكلان!' };
  const data = getRpgData();
  const clanName = clan.name;
  const leaderName = clan.leaderName;
  if (data.clans && data.clans[clan.id]) delete data.clans[clan.id];
  if (clan.members) {
    clan.members.forEach(memberId => {
      if (data.players && data.players[memberId]) data.players[memberId].clanId = null;
    });
  }
  saveDatabase();
  return { success: true, message: leaderName };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ نظام الحروب (الدوال الأساسية)
// ═══════════════════════════════════════════════════════════════════════════════

export const WAR_PREP_TIME = 15 * 60 * 1000; // 15 دقيقة
export const WAR_DURATION = 30 * 60 * 1000;   // 30 دقيقة

export const challengeClan = (challengerClan, targetClanId, challengerId) => {
  const data = getRpgData();
  const targetClan = data.clans?.[targetClanId];
  if (!targetClan) return { success: false, message: '❌ الكلان غير موجود!' };
  if (challengerClan.id === targetClanId) return { success: false, message: '❌ لا يمكنك تحدي كلانك!' };
  if (challengerClan.wars?.currentWar) return { success: false, message: '❅ كلانك في حرب بالفعل!' };
  if (targetClan.wars?.currentWar) return { success: false, message: '❅ الكلان المستهدف في حرب!' };
  if (!isClanLeader(challengerClan, challengerId)) return { success: false, message: '❌ للقائد فقط!' };

  const warId = `war_${Date.now()}`;
  const prepEndTime = Date.now() + WAR_PREP_TIME;
  const warEndTime = prepEndTime + WAR_DURATION;
  const prizePool = Math.floor((challengerClan.gold || 0) * 0.1) + 500;

  const challenge = {
    id: warId,
    challengerId: challengerClan.id,
    challengerName: challengerClan.name,
    challengerTag: challengerClan.clanTag,
    challengerLevel: challengerClan.level || 1,
    targetId: targetClanId,
    targetName: targetClan.name,
    targetTag: targetClan.clanTag,
    targetLevel: targetClan.level || 1,
    prizePool,
    createdAt: Date.now(),
    prepEndTime,
    warEndTime,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 دقائق للقبول
    status: 'pending'
  };
  targetClan.wars = targetClan.wars || {};
  targetClan.wars.pendingChallenges = targetClan.wars.pendingChallenges || [];
  targetClan.wars.pendingChallenges.push(challenge);
  saveDatabase();
  return { success: true, challenge, challengerName: challengerClan.name, targetName: targetClan.name, prizePool, prepTime: WAR_PREP_TIME / 60000 };
};

export const acceptChallenge = (clan, challengeId, senderId) => {
  if (!isClanLeader(clan, senderId)) return { success: false, message: '❌ للقائد فقط!' };
  const challenges = clan.wars?.pendingChallenges || [];
  const challenge = challenges.find(c => c.id === challengeId);
  if (!challenge) return { success: false, message: '❌ التحدي غير موجود!' };
  if (Date.now() > challenge.expiresAt) return { success: false, message: '❅ انتهت صلاحية التحدي!' };
  const data = getRpgData();
  const challengerClan = data.clans?.[challenge.challengerId];
  if (!challengerClan) return { success: false, message: '❌ الكلان المتحدي غير موجود!' };

  const war = {
    id: challenge.id,
    challengerId: challenge.challengerId,
    challengerName: challenge.challengerName,
    challengerTag: challenge.challengerTag,
    challengerLevel: challenge.challengerLevel || 1,
    targetId: clan.id,
    targetName: clan.name,
    targetTag: clan.clanTag,
    targetLevel: challenge.targetLevel || 1,
    challengerDamage: 0,
    targetDamage: 0,
    prizePool: challenge.prizePool,
    createdAt: Date.now(),
    prepEndTime: challenge.prepEndTime,
    startedAt: challenge.prepEndTime,
    endsAt: challenge.warEndTime,
    status: 'preparing',
    challengerAttacks: [],
    targetAttacks: [],
    participants: { challenger: [], target: [] },
    events: [],
    buffs: { challenger: [], target: [] }
  };

  challengerClan.wars = challengerClan.wars || {};
  challengerClan.wars.currentWar = war;
  clan.wars = clan.wars || {};
  clan.wars.currentWar = war;
  clan.wars.pendingChallenges = challenges.filter(c => c.id !== challengeId);
  saveDatabase();
  return { success: true, war, prepTime: WAR_PREP_TIME / 60000 };
};

export const rejectChallenge = (clan, challengeId, senderId) => {
  if (!isClanLeader(clan, senderId)) return false;
  const challenges = clan.wars?.pendingChallenges || [];
  const index = challenges.findIndex(c => c.id === challengeId);
  if (index === -1) return false;
  clan.wars.pendingChallenges.splice(index, 1);
  saveDatabase();
  return true;
};

// تسجيل مشاركة في الحرب (فترة التجهيز)
export const registerWarParticipation = (clan, war, playerId, soldierCount) => {
  if (!war || war.status !== 'preparing') return { success: false, message: '❌ الحرب ليست في مرحلة التجهيز!' };
  const isChallenger = war.challengerId === clan.id;
  const list = isChallenger ? war.participants.challenger : war.participants.target;
  const existing = list.find(p => p.playerId === playerId);
  if (existing) existing.soldiers = soldierCount;
  else list.push({ playerId, soldiers: soldierCount, time: Date.now() });
  saveDatabase();
  return { success: true, message: `✅ تم تسجيل ${soldierCount} جندي للمشاركة في الحرب!` };
};

// الحصول على الحرب النشطة
export const getActiveWar = (clanId) => {
  const clan = getClan(clanId);
  return clan?.wars?.currentWar || null;
};

// الحصول على قائمة الكلانات مرتبة
export const getRankedClansList = (excludeId) => {
  const data = getRpgData();
  return Object.entries(data.clans || {})
    .filter(([id]) => id !== excludeId)
    .sort((a, b) => b[1].level - a[1].level || (b[1].wins || 0) - (a[1].wins || 0))
    .map(([id, clan]) => ({
      id, name: clan.name, level: clan.level || 1, members: clan.members?.length || 0,
      wins: clan.wins || 0, losses: clan.losses || 0, clanTag: clan.clanTag
    }));
};

// دوال مساعدة
export const getClanBuff = (level) => ({ atk: level * 0.5, defense: level * 0.3, discount: level * 0.2 });
export const clanXpForLevel = (level) => Math.floor(100 * Math.pow(level, 1.5));
export const progressClanBar = (xp, level) => {
  const needed = clanXpForLevel(level);
  const progress = Math.min(xp / needed, 1);
  return '▓'.repeat(Math.floor(progress * 8)) + '░'.repeat(8 - Math.floor(progress * 8));
};

// أنواع الجنود
export const SOLDIER_TYPES = { "محارب": "infantry", "رامي": "archer", "فارس": "cavalry", "ساحر": "mage", "شافي": "healer" };
export const SOLDIER_NAMES = { infantry: "مشاة ثقيل", archer: "رماة سهام", cavalry: "فرسان مدرعون", mage: "دعم سحري", healer: "كاهن شفاء" };
export const CLASS_EFFECTS = { "محارب": { type: "attack", bonus: 1.2 }, "رامي": { type: "range", bonus: 1.3 }, "فارس": { type: "tank", bonus: 0.8 }, "ساحر": { type: "magic", bonus: 1.5 }, "شافي": { type: "support", bonus: 0.7 } };

export const getArmyCapacity = (buildingLevel) => buildingLevel * 20;

// تدريب الجنود
export const trainSoldiers = (player, clan, amount) => {
  const playerClass = player.class || "محارب";
  const soldierType = SOLDIER_TYPES[playerClass] || "infantry";
  let buildingLevel = 1;
  if (soldierType === "infantry" || soldierType === "cavalry") buildingLevel = clan.settlement?.buildings?.barracks?.level || 1;
  else if (soldierType === "archer") buildingLevel = clan.settlement?.buildings?.watchtower?.level || 1;
  else if (soldierType === "mage") buildingLevel = clan.settlement?.buildings?.mageTower?.level || 1;
  else if (soldierType === "healer") buildingLevel = clan.settlement?.buildings?.hospital?.level || 1;
  const maxCapacity = getArmyCapacity(buildingLevel);
  const currentSoldiers = player.soldiers || 0;
  if (currentSoldiers + amount > maxCapacity) return { success: false, message: `❌ سعة الجيش ممتلئة!\n📊 الحالي: ${currentSoldiers}/${maxCapacity}` };
  player.soldiers = currentSoldiers + amount;
  player.soldierType = soldierType;
  saveDatabase();
  return { success: true, message: `✅ تم تدريب ${amount} من وحدة [${SOLDIER_NAMES[soldierType]}]!\n📊 السعة: ${player.soldiers}/${maxCapacity}` };
};

// عناصر المتجر الحربي
export const WAR_ITEMS = {
  "تعويذة حماية": { type: "defense_buff", value: 1.5, cost: 1000, duration: 300000 },
  "جرعة هجومية": { type: "attack_buff", value: 1.5, cost: 1000, duration: 300000 },
  "تعويذة تجميد": { type: "freeze", duration: 300000, cost: 2000 }
};
export const buyWarItem = (player, itemName) => {
  if (!WAR_ITEMS[itemName]) return { success: false, message: '❌ العنصر غير موجود في المتجر الحربي!' };
  const item = WAR_ITEMS[itemName];
  if ((player.gold || 0) < item.cost) return { success: false, message: `❌ لا تملك ذهب كافٍ!\n💰 المطلوب: ${item.cost}` };
  player.gold -= item.cost;
  player.warBuffs = player.warBuffs || [];
  player.warBuffs.push({ type: item.type, value: item.value, duration: item.duration, expiresAt: Date.now() + (item.duration || 0), purchasedAt: Date.now() });
  saveDatabase();
  return { success: true, message: `✅ تم شراء [${itemName}] بنجاح!\n🎯 سيُفعّل تلقائياً عند دخول الحرب` };
};

// ترتيب الكلانات
export const getClanRankings = () => {
  const data = getRpgData();
  const clans = Object.values(data.clans || {});
  clans.sort((a, b) => (b.wins || 0) - (a.wins || 0));
  const topClans = clans.slice(0, 10);
  let rankingText = "🏆 **ترتيب الكلانات الأسطوري** 🏆\n\n";
  for (let i = 0; i < topClans.length; i++) {
    const clan = topClans[i];
    rankingText += `${i + 1}. 🛡️ **${clan.name}** #${clan.clanTag}\n`;
    rankingText += `   ✅ انتصارات: ${clan.wins || 0} | ❌ هزائم: ${clan.losses || 0}\n`;
    rankingText += `   👥 أعضاء: ${clan.members?.length || 0} | ⭐ مستوى: ${clan.level || 1}\n\n`;
  }
  return rankingText;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ✅ دالة التحقق من قائد الكلان (مقارنة بالأرقام فقط)
// ═══════════════════════════════════════════════════════════════════════════════

export const isClanLeader = (clan, senderId) => {
  if (!clan || !senderId) return false;
  const getNumericId = (id) => String(id).split('@')[0].trim();
  return getNumericId(senderId) === getNumericId(clan.leader);
};
