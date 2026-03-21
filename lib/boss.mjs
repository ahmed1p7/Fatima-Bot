// ═══════════════════════════════════════════════════════════════════════════════
// 👹 نظام الزعماء والقتال الجماعي
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';
import { calculatePassiveBuffs } from './skills.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 👹 تعريفات الزعماء
// ═══════════════════════════════════════════════════════════════════════════════

export const BOSSES = [
  {
    id: 'goblin_king',
    name: 'ملك الغيلان',
    emoji: '👹',
    hp: 5000,
    atk: 50,
    def: 20,
    level: 5,
    xpReward: 500,
    goldReward: 1000,
    dropChance: { weapon: 0.3, armor: 0.2, material: 0.5 },
    drops: ['سيف الغيلان', 'درع الجلد الخشن', 'تاج الملك الصغير'],
    abilities: [
      { name: 'نداء الغيلان', effect: 'summon', cooldown: 5 },
      { name: 'ضربة قاضية', effect: 'heavy_attack', damage: 2 }
    ],
    spawnCondition: { minPlayers: 3, minTotalLevel: 20 }
  },
  {
    id: 'dark_wizard',
    name: 'الساحر المظلم',
    emoji: '🧙‍♂️',
    hp: 4000,
    atk: 80,
    def: 10,
    mag: 100,
    level: 10,
    xpReward: 800,
    goldReward: 1500,
    dropChance: { weapon: 0.4, armor: 0.2, material: 0.4 },
    drops: ['عصا الظلام', 'رداء الساحر', 'كتاب التعاويذ المحرم'],
    abilities: [
      { name: 'كرة النار العظمى', effect: 'aoe_magic', damage: 1.5 },
      { name: 'شفاء الظلام', effect: 'heal', amount: 0.2 },
      { name: 'درع سحري', effect: 'shield', amount: 500 }
    ],
    spawnCondition: { minPlayers: 5, minTotalLevel: 50 }
  },
  {
    id: 'ancient_dragon',
    name: 'التنين القديم',
    emoji: '🐉',
    hp: 15000,
    atk: 150,
    def: 80,
    mag: 120,
    level: 25,
    xpReward: 2000,
    goldReward: 5000,
    dropChance: { weapon: 0.5, armor: 0.4, material: 0.6 },
    drops: ['سيف التنين', 'درع حراشف التنين', 'قلب التنين', 'بيضة تنين'],
    abilities: [
      { name: 'نفس النار', effect: 'aoe_fire', damage: 2 },
      { name: 'الضربة المخلبية', effect: 'heavy_attack', damage: 2.5 },
      { name: 'تحليق', effect: 'evasion', turns: 2 },
      { name: 'غضب التنين', effect: 'berserk', bonus: 1.5 }
    ],
    spawnCondition: { minPlayers: 8, minTotalLevel: 150 }
  },
  {
    id: 'demon_lord',
    name: 'سيد الشياطين',
    emoji: '😈',
    hp: 25000,
    atk: 200,
    def: 100,
    mag: 180,
    level: 40,
    xpReward: 4000,
    goldReward: 10000,
    dropChance: { weapon: 0.6, armor: 0.5, material: 0.7 },
    drops: ['سيف الجحيم', 'درع الشياطين', 'قرن الشيطان', 'قلادة الظلام'],
    abilities: [
      { name: 'باب الجحيم', effect: 'summon_demons', count: 3 },
      { name: 'عقدة الظلام', effect: 'bind', turns: 2 },
      { name: 'امتصاص الروح', effect: 'lifesteal', percent: 0.3 },
      { name: 'انفجار شيطاني', effect: 'aoe_explosion', damage: 3 }
    ],
    spawnCondition: { minPlayers: 10, minTotalLevel: 300 }
  },
  {
    id: 'world_boss',
    name: 'الحارس الأسطوري',
    emoji: '🗿',
    hp: 100000,
    atk: 300,
    def: 200,
    mag: 250,
    level: 60,
    xpReward: 10000,
    goldReward: 50000,
    dropChance: { weapon: 0.8, armor: 0.7, material: 0.9 },
    drops: ['السيف الأسطوري', 'درج الآلهة', 'جوهر الخلود', 'تراث الأجداد'],
    abilities: [
      { name: 'زلزال', effect: 'aoe_massive', damage: 2 },
      { name: 'درع الآلهة', effect: 'invincibility', turns: 1 },
      { name: 'القضاء', effect: 'execute', threshold: 0.1 },
      { name: 'استدعاء الأرواح', effect: 'summon_spirits', count: 5 }
    ],
    spawnCondition: { minPlayers: 20, minTotalLevel: 800 },
    isWorldBoss: true
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 تخزين الزعماء النشطين
// ═══════════════════════════════════════════════════════════════════════════════

const activeBosses = new Map(); // bossId -> bossData
const bossHistory = []; // سجل الزعماء المهزومين

// ═══════════════════════════════════════════════════════════════════════════════
// 🎲 توليد زعيم عشوائي
// ═══════════════════════════════════════════════════════════════════════════════

export const spawnRandomBoss = (groupId, participants = []) => {
  // حساب المستوى الإجمالي للمشاركين
  const totalLevel = participants.reduce((sum, p) => sum + (p.level || 1), 0);
  const playerCount = participants.length || 1;

  // اختيار زعيم مناسب
  const eligibleBosses = BOSSES.filter(boss => {
    const cond = boss.spawnCondition;
    return playerCount >= cond.minPlayers && totalLevel >= cond.minTotalLevel;
  });

  if (eligibleBosses.length === 0) {
    // زعيم افتراضي للمجموعات الصغيرة
    const defaultBoss = BOSSES[0];
    return spawnBoss(defaultBoss.id, groupId, participants);
  }

  // اختيار زعيم عشوائي
  const boss = eligibleBosses[Math.floor(Math.random() * eligibleBosses.length)];
  return spawnBoss(boss.id, groupId, participants);
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎭 إنشاء زعيم جديد
// ═══════════════════════════════════════════════════════════════════════════════

export const spawnBoss = (bossId, groupId, participants = []) => {
  const bossDef = BOSSES.find(b => b.id === bossId);
  if (!bossDef) {
    return { success: false, message: '❌ زعيم غير موجود!' };
  }

  // التحقق من وجود زعيم نشط
  for (const [id, boss] of activeBosses) {
    if (boss.groupId === groupId && boss.status === 'active') {
      return { success: false, message: '❌ هناك زعيم نشط بالفعل!' };
    }
  }

  const now = Date.now();
  const instanceId = `boss_${bossId}_${now}`;

  // إنشاء نسخة الزعيم
  const bossInstance = {
    instanceId,
    bossId,
    name: bossDef.name,
    emoji: bossDef.emoji,
    level: bossDef.level,
    hp: bossDef.hp,
    maxHp: bossDef.hp,
    atk: bossDef.atk,
    def: bossDef.def,
    mag: bossDef.mag || 0,
    abilities: bossDef.abilities,
    drops: bossDef.drops,
    dropChance: bossDef.dropChance,
    xpReward: bossDef.xpReward,
    goldReward: bossDef.goldReward,
    isWorldBoss: bossDef.isWorldBoss || false,
    groupId,
    spawnedAt: now,
    endsAt: now + 30 * 60 * 1000, // 30 دقيقة
    status: 'active',
    participants: {},
    totalDamage: 0,
    phase: 1,
    lastAbilityUse: 0
  };

  activeBosses.set(instanceId, bossInstance);

  return {
    success: true,
    boss: bossInstance,
    message: formatBossAnnouncement(bossInstance)
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ الهجوم على الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

export const attackBoss = (instanceId, playerId, playerName, playerAtk, playerMag, playerSkills) => {
  const boss = activeBosses.get(instanceId);
  
  if (!boss) {
    return { success: false, message: '❌ الزعيم غير موجود!' };
  }

  if (boss.status !== 'active') {
    return { success: false, message: '❌ القتال انتهى!' };
  }

  if (Date.now() > boss.endsAt) {
    boss.status = 'timeout';
    activeBosses.delete(instanceId);
    return { success: false, message: '⏰ انتهى الوقت! هرب الزعيم!' };
  }

  // حساب الضرر
  const buffs = calculatePassiveBuffs({ skills: playerSkills });
  let baseDamage = Math.max(playerAtk, playerMag);
  baseDamage = baseDamage * (1 + (buffs.atk || 0) + (buffs.magicDamage || 0));

  // خصم الدفاع
  const defenseReduction = boss.def * 0.5;
  let damage = Math.max(1, baseDamage - defenseReduction + Math.floor(Math.random() * 20));

  // تطبيق ضربة حرجة
  const critChance = (buffs.critChance || 0) + 0.05;
  const isCrit = Math.random() < critChance;
  if (isCrit) {
    damage = Math.floor(damage * (1.5 + (buffs.critDamage || 0)));
  }

  // تطبيق الضرر
  boss.hp -= damage;
  boss.totalDamage += damage;

  // تسجيل مشاركة اللاعب
  if (!boss.participants[playerId]) {
    boss.participants[playerId] = { name: playerName, damage: 0, attacks: 0 };
  }
  boss.participants[playerId].damage += damage;
  boss.participants[playerId].attacks++;

  // التحقق من هزيمة الزعيم
  if (boss.hp <= 0) {
    return defeatBoss(instanceId, playerId);
  }

  // التحقق من تغيير المرحلة
  const hpPercent = boss.hp / boss.maxHp;
  if (hpPercent < 0.3 && boss.phase < 3) {
    boss.phase = 3;
    // الزعيم يصبح أقوى
    boss.atk = Math.floor(boss.atk * 1.5);
  } else if (hpPercent < 0.6 && boss.phase < 2) {
    boss.phase = 2;
    boss.atk = Math.floor(boss.atk * 1.2);
  }

  // هجوم مضاد من الزعيم (فرصة 30%)
  let counterAttack = null;
  if (Math.random() < 0.3) {
    const counterDamage = Math.floor(boss.atk * (0.5 + Math.random() * 0.5));
    counterAttack = { damage: counterDamage };
  }

  return {
    success: true,
    damage,
    isCrit,
    bossHp: boss.hp,
    bossMaxHp: boss.maxHp,
    phase: boss.phase,
    counterAttack,
    hpPercent: Math.floor(hpPercent * 100)
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 هزيمة الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

const defeatBoss = (instanceId, lastAttackerId) => {
  const boss = activeBosses.get(instanceId);
  if (!boss) return { success: false, message: '❌ خطأ!' };

  boss.status = 'defeated';
  boss.defeatedAt = Date.now();
  boss.defeatedBy = lastAttackerId;

  // حساب المكافآت لكل مشارك
  const rewards = {};
  const participants = Object.entries(boss.participants)
    .sort((a, b) => b[1].damage - a[1].damage);

  const totalDamage = boss.totalDamage;

  for (const [playerId, data] of participants) {
    const contribution = data.damage / totalDamage;
    
    // XP وذهب بناءً على المساهمة
    const xpGain = Math.floor(boss.xpReward * contribution * (1 + Math.random() * 0.5));
    const goldGain = Math.floor(boss.goldReward * contribution * (1 + Math.random() * 0.3));

    // فرصة الحصول على غنيمة
    let loot = null;
    if (Math.random() < boss.dropChance.weapon * contribution * 2) {
      loot = boss.drops[Math.floor(Math.random() * boss.drops.length)];
    }

    rewards[playerId] = {
      name: data.name,
      damage: data.damage,
      contribution: Math.floor(contribution * 100),
      xp: xpGain,
      gold: goldGain,
      loot
    };
  }

  // حفظ في السجل
  bossHistory.push({
    ...boss,
    rewards
  });

  activeBosses.delete(instanceId);

  return {
    success: true,
    defeated: true,
    boss: {
      name: boss.name,
      emoji: boss.emoji,
      level: boss.level
    },
    rewards,
    topDamage: participants.slice(0, 3).map(([id, data]) => ({
      name: data.name,
      damage: data.damage
    }))
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 تنسيق إعلان الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

export const formatBossAnnouncement = (boss) => {
  return `⚔️ ═══════ زعيم ظهر! ═══════ ⚔️

${boss.emoji} ${boss.name}
⭐ المستوى: ${boss.level}

📊 الإحصائيات:
❤️ HP: ${boss.maxHp.toLocaleString()}
⚔️ ATK: ${boss.atk} | 🛡️ DEF: ${boss.def}
${boss.mag ? `✨ MAG: ${boss.mag}` : ''}

🎁 المكافآت:
⭐ XP: ${boss.xpReward.toLocaleString()}
💰 ذهب: ${boss.goldReward.toLocaleString()}
🎁 غنائم: ${boss.drops.length > 0 ? 'نعم' : 'لا'}

⏰ الوقت: 30 دقيقة

🎯 اهجم الآن: .هجوم_زعيم`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 تنسيق حالة الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

export const formatBossStatus = (boss) => {
  const hpPercent = boss.hp / boss.maxHp;
  const hpBar = '█'.repeat(Math.floor(hpPercent * 10)) + '░'.repeat(10 - Math.floor(hpPercent * 10));
  const remaining = Math.max(0, boss.endsAt - Date.now());
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  const topParticipants = Object.entries(boss.participants)
    .sort((a, b) => b[1].damage - a[1].damage)
    .slice(0, 5);

  let text = `${boss.emoji} ${boss.name} [مرحلة ${boss.phase}]

❤️ [${hpBar}] ${Math.floor(hpPercent * 100)}%
⚔️ HP: ${boss.hp.toLocaleString()}/${boss.maxHp.toLocaleString()}

⏱️ الوقت: ${mins}:${secs.toString().padStart(2, '0')}

📊 أعلى الضرر:`;

  for (let i = 0; i < topParticipants.length; i++) {
    const [_, data] = topParticipants[i];
    text += `\n${i + 1}. ${data.name}: ${data.damage.toLocaleString()}`;
  }

  text += `\n\n🎯 .هجوم_زعيم للهجوم!`;

  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 تنسيق نتيجة القتال
// ═══════════════════════════════════════════════════════════════════════════════

export const formatBattleResult = (result) => {
  if (!result.defeated) {
    return `⚔️ الهجوم على ${result.boss.name}!

💥 ضررك: ${result.damage.toLocaleString()}${result.isCrit ? ' 🔥 حرجة!' : ''}
📊 HP الزعيم: ${result.hpPercent}%

${result.counterAttack ? `⚠️ هجوم مضاد: -${result.counterAttack.damage} HP!` : ''}`;
  }

  let text = `🏆 ═══════ انتصار! ═══════ 🏆

${result.boss.emoji} ${result.boss.name} هُزم!

🏅 أعلى المساهمين:`;

  for (let i = 0; i < result.topDamage.length; i++) {
    text += `\n${i + 1}. ${result.topDamage[i].name}: ${result.topDamage[i].damage.toLocaleString()}`;
  }

  text += `\n\n🎁 المكافآت توزعت على ${Object.keys(result.rewards).length} لاعب!`;

  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 الحصول على زعيم نشط
// ═══════════════════════════════════════════════════════════════════════════════

export const getActiveBoss = (groupId) => {
  for (const [id, boss] of activeBosses) {
    if (boss.groupId === groupId && boss.status === 'active') {
      return { instanceId: id, ...boss };
    }
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎲 استخدام قدرة الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

export const useBossAbility = (boss) => {
  if (!boss.abilities || boss.abilities.length === 0) return null;

  const now = Date.now();
  if (now - boss.lastAbilityUse < 30000) return null; // كل 30 ثانية

  const ability = boss.abilities[Math.floor(Math.random() * boss.abilities.length)];
  boss.lastAbilityUse = now;

  let effect = null;
  switch (ability.effect) {
    case 'heavy_attack':
      effect = { type: 'damage', value: boss.atk * ability.damage, targets: 'all' };
      break;
    case 'aoe_magic':
    case 'aoe_fire':
    case 'aoe_explosion':
      effect = { type: 'aoe_damage', value: boss.mag * ability.damage };
      break;
    case 'heal':
      const healAmount = Math.floor(boss.maxHp * ability.amount);
      boss.hp = Math.min(boss.maxHp, boss.hp + healAmount);
      effect = { type: 'heal', value: healAmount };
      break;
    case 'shield':
      effect = { type: 'shield', value: ability.amount };
      break;
    case 'summon':
    case 'summon_demons':
    case 'summon_spirits':
      effect = { type: 'summon', count: ability.count || 2 };
      break;
    case 'berserk':
      boss.atk = Math.floor(boss.atk * ability.bonus);
      effect = { type: 'berserk' };
      break;
    default:
      effect = { type: ability.effect };
  }

  return {
    name: ability.name,
    effect
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 الحصول على مكافآت اللاعب
// ═══════════════════════════════════════════════════════════════════════════════

export const getPlayerBossRewards = (playerId) => {
  const playerRewards = [];

  for (const record of bossHistory) {
    if (record.rewards && record.rewards[playerId]) {
      playerRewards.push({
        bossName: record.name,
        bossEmoji: record.emoji,
        ...record.rewards[playerId],
        date: record.defeatedAt
      });
    }
  }

  return playerRewards.slice(-10); // آخر 10 مكافآت
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🧹 تنظيف الزعماء المنتهية صلاحيتهم
// ═══════════════════════════════════════════════════════════════════════════════

export const cleanupExpiredBosses = () => {
  const now = Date.now();
  for (const [id, boss] of activeBosses) {
    if (boss.endsAt < now) {
      activeBosses.delete(id);
    }
  }
};

// تشغيل التنظيف كل دقيقة
setInterval(cleanupExpiredBosses, 60000);
