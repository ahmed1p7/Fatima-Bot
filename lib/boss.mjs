// ═══════════════════════════════════════════════════════════════════════════════
// 👹 نظام الزعماء - Solo Leveling Style
// فاطمة بوت v12.0
// يتضمن: زعماء ديناميكيين، نظام MVP، جوائز متدرجة
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';
import { calculatePassiveBuffs } from './skills.mjs';
import { sendImageFromUrl, generateBossImage } from './utils/image.mjs';

// الصورة الافتراضية للزعماء
const DEFAULT_BOSS_IMAGE = 'https://files.catbox.moe/p4mtw3.jpg';

// ═══════════════════════════════════════════════════════════════════════════════
// 👹 تعريفات الزعماء (Solo Leveling Style)
// ═══════════════════════════════════════════════════════════════════════════════

export const BOSSES = [
  // ═══════════════════════════════════════════════════════════════════════════
  // هجمات برية
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'kasaka',
    name: 'كاساكا',
    title: 'الثعبان السام',
    emoji: '🐍',
    category: 'بري',
    hp: 5000,
    atk: 50,
    def: 20,
    mag: 30,
    level: 5,
    xpReward: 500,
    goldReward: 1000,
    dropChance: { weapon: 0.3, armor: 0.2, material: 0.5 },
    drops: ['أنياب كاسaka', 'سم الثعبان', 'جلد الثعبان'],
    abilities: [
      { name: 'عضة سامة', effect: 'poison', damage: 1.2, duration: 3, description: 'يسمم الهدف لـ 3 جولات' },
      { name: 'التفاف قاتل', effect: 'bind', turns: 1, description: 'يثبت الهدف لجولة' },
      { name: 'سم قاتل', effect: 'aoe_poison', damage: 0.8, description: 'يسمم جميع المهاجمين' }
    ],
    spawnCondition: { minPlayers: 3, minTotalLevel: 20 },
    weakness: ['اختراق الدروع'], // ضعف ضد القتلة
    resistance: ['سحر'] // مقاومة ضد السحر
  },
  {
    id: 'swamp_king',
    name: 'ملك المستنقعات',
    title: 'سيد المستنقع',
    emoji: '🐸',
    category: 'بري',
    hp: 8000,
    atk: 40,
    def: 60,
    mag: 20,
    level: 10,
    xpReward: 800,
    goldReward: 1500,
    dropChance: { weapon: 0.25, armor: 0.35, material: 0.4 },
    drops: ['تاج المستنقع', 'درع الطين', 'جوهر المستنقع'],
    abilities: [
      { name: 'درع الطين', effect: 'defense_boost', amount: 1.5, description: 'يزيد دفاعه 50%' },
      { name: 'لعاب سام', effect: 'debuff', stat: 'atk', amount: 0.7, description: 'يضعف هجوم الهدف 30%' },
      { name: 'انغماس', effect: 'submerge', turns: 2, description: 'يختفي في المستنقع' }
    ],
    spawnCondition: { minPlayers: 5, minTotalLevel: 50 },
    weakness: ['نار', 'برق'],
    resistance: ['ماء', 'سم']
  },
  {
    id: 'orc_lord',
    name: 'زعيم الأورك',
    title: 'المدمر',
    emoji: '👹',
    category: 'بري',
    hp: 12000,
    atk: 80,
    def: 40,
    mag: 10,
    level: 15,
    xpReward: 1200,
    goldReward: 2000,
    dropChance: { weapon: 0.4, armor: 0.3, material: 0.5 },
    drops: ['فأس الأورك', 'خوذة القرن', 'قلادة القوة'],
    abilities: [
      { name: 'صراع الحرب', effect: 'war_cry', bonus: 1.3, description: 'يزيد هجومه 30%' },
      { name: 'ضربة ماحقة', effect: 'heavy_attack', damage: 2.5, description: 'ضربة قوية جداً' },
      { name: 'استدعاء الأورك', effect: 'summon', count: 2, description: 'يستدعي حراس أورك' }
    ],
    spawnCondition: { minPlayers: 6, minTotalLevel: 80 },
    weakness: ['سحر', 'سهام'],
    resistance: ['ضربات جسدية']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // طائرون
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'bero',
    name: 'بيرو',
    title: 'ملك النمل الطائر',
    emoji: '🦋',
    category: 'طائر',
    hp: 6000,
    atk: 60,
    def: 15,
    mag: 40,
    level: 12,
    xpReward: 1000,
    goldReward: 1800,
    dropChance: { weapon: 0.35, armor: 0.25, material: 0.6 },
    drops: ['أجنحة بيرو', 'سم النمل', 'عين الملكة'],
    abilities: [
      { name: 'مراوغة', effect: 'evasion', chance: 0.4, description: '40% فرصة تفادي' },
      { name: 'طلع سريع', effect: 'speed_attack', hits: 3, damage: 0.6, description: '3 ضربات سريعة' },
      { name: 'نداء النمل', effect: 'summon_ants', count: 5, description: 'يستدعي نمل عادي' }
    ],
    spawnCondition: { minPlayers: 5, minTotalLevel: 60 },
    weakness: ['نار', 'هجوم منطقة'],
    resistance: ['ضربات فردية']
  },
  {
    id: 'eagle_king',
    name: 'العقاب الملكي',
    title: 'سيد السماء',
    emoji: '🦅',
    category: 'طائر',
    hp: 10000,
    atk: 90,
    def: 25,
    mag: 50,
    level: 20,
    xpReward: 2000,
    goldReward: 3000,
    dropChance: { weapon: 0.45, armor: 0.35, material: 0.4 },
    drops: ['ريش ذهبي', 'مخلب العقاب', 'عين الصقر'],
    abilities: [
      { name: 'غطس من السماء', effect: 'dive_bomb', damage: 3, description: 'ضربة قاتلة من الأعلى' },
      { name: 'عاصفة ريش', effect: 'aoe_damage', damage: 1.2, description: 'ضرر للجميع' },
      { name: 'صرخة حارقة', effect: 'debuff_all', stat: 'def', amount: 0.8, description: 'يقلل دفاع الجميع' }
    ],
    spawnCondition: { minPlayers: 7, minTotalLevel: 120 },
    weakness: ['سهام', 'برق'],
    resistance: ['هجمات أرضية']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // أسطوريون
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'igrys',
    name: 'إيغريس',
    title: 'الفارس الأحمر',
    emoji: '⚔️',
    category: 'أسطوري',
    hp: 25000,
    atk: 150,
    def: 100,
    mag: 80,
    level: 30,
    xpReward: 5000,
    goldReward: 8000,
    dropChance: { weapon: 0.6, armor: 0.5, material: 0.7 },
    drops: ['سيف إيغريس', 'درع الفارس الأحمر', 'خوذة الظلام', 'جوهر القتال'],
    abilities: [
      { name: 'صد الأضواء', effect: 'reflect', percent: 0.2, description: 'يعكس 20% من الضرر' },
      { name: 'ضربة الفارس', effect: 'combo', hits: 5, damage: 0.5, description: '5 ضربات متتالية' },
      { name: 'درع الظلام', effect: 'shield', amount: 2000, description: 'درع يمتص 2000 ضرر' },
      { name: 'غضب المحارب', effect: 'berserk', bonus: 1.8, description: 'يصبح أقوى عند HP منخفض' }
    ],
    spawnCondition: { minPlayers: 10, minTotalLevel: 250 },
    weakness: ['سحر مضيء', 'سهام خارقة'],
    resistance: ['ضربات جسدية', 'سحر مظلم']
  },
  {
    id: 'antares',
    name: 'أنتاريس',
    title: 'ملك التنانين',
    emoji: '🐉',
    category: 'أسطوري',
    hp: 50000,
    atk: 250,
    def: 150,
    mag: 200,
    level: 50,
    xpReward: 15000,
    goldReward: 25000,
    dropChance: { weapon: 0.8, armor: 0.7, material: 0.9 },
    drops: ['قلب التنين', 'حراشف أنتاريس', 'سيف ملك التنانين', 'بيضة تنين', 'تراث الملك'],
    abilities: [
      { name: 'نفس التنين', effect: 'breath', damage: 3, description: 'ضرر هائل للجميع' },
      { name: 'مخالب الموت', effect: 'slash', damage: 2.5, description: 'ضربة قاتلة' },
      { name: 'غضب التنانين', effect: 'rage', bonus: 2, description: 'يضاعف قوته' },
      { name: 'تحليق', effect: 'fly', turns: 2, description: 'يطير ويتفادى الهجمات' },
      { name: 'استدعاء التنانين', effect: 'summon_dragons', count: 2, description: 'يستدعي تنينين صغيرين' }
    ],
    spawnCondition: { minPlayers: 15, minTotalLevel: 500 },
    weakness: ['ثلج', 'سحر مقدس'],
    resistance: ['نار', 'سم'],
    requiresHealers: 3 // يحتاج 3 شافيين على الأقل
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 تخزين الزعماء النشطين
// ═══════════════════════════════════════════════════════════════════════════════

const activeBosses = new Map();
const bossHistory = [];
const bossLevelScaling = new Map(); // تتبع مستوى الزعماء

// ═══════════════════════════════════════════════════════════════════════════════
// 🎲 توليد زعيم عشوائي
// ═══════════════════════════════════════════════════════════════════════════════

export const spawnRandomBoss = (groupId, participants = []) => {
  const totalLevel = participants.reduce((sum, p) => sum + (p.level || 1), 0);
  const playerCount = participants.length || 1;

  const eligibleBosses = BOSSES.filter(boss => {
    const cond = boss.spawnCondition;
    return playerCount >= cond.minPlayers && totalLevel >= cond.minTotalLevel;
  });

  if (eligibleBosses.length === 0) {
    const defaultBoss = BOSSES[0];
    return spawnBoss(defaultBoss.id, groupId, participants);
  }

  const boss = eligibleBosses[Math.floor(Math.random() * eligibleBosses.length)];
  return spawnBoss(boss.id, groupId, participants);
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎭 إنشاء زعيم جديد مع HP ديناميكي
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔢 حساب HP ديناميكي بناءً على المشاركين
  // ═══════════════════════════════════════════════════════════════════════════
  
  const baseHp = bossDef.hp;
  const participantCount = participants.length || 1;
  const averageLevel = participants.length > 0 
    ? participants.reduce((sum, p) => sum + (p.level || 1), 0) / participants.length 
    : 1;
  
  // HP = Base * (1 + 0.1 per player) * (1 + 0.05 per avg level above boss level)
  let dynamicHp = baseHp * (1 + 0.1 * participantCount);
  if (averageLevel > bossDef.level) {
    dynamicHp *= (1 + 0.05 * (averageLevel - bossDef.level));
  }
  
  // تطبيق scaling من الهزائم السابقة
  const scalingLevel = bossLevelScaling.get(bossId) || 0;
  dynamicHp *= (1 + scalingLevel * 0.15); // +15% لكل هزيمة
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🎯 إنشاء نسخة الزعيم
  // ═══════════════════════════════════════════════════════════════════════════
  
  const bossInstance = {
    instanceId,
    bossId,
    name: bossDef.name,
    title: bossDef.title,
    emoji: bossDef.emoji,
    category: bossDef.category,
    level: bossDef.level + scalingLevel, // مستوى متزايد
    
    // إحصائيات ديناميكية
    hp: Math.floor(dynamicHp),
    maxHp: Math.floor(dynamicHp),
    atk: Math.floor(bossDef.atk * (1 + scalingLevel * 0.1)),
    def: Math.floor(bossDef.def * (1 + scalingLevel * 0.05)),
    mag: Math.floor(bossDef.mag * (1 + scalingLevel * 0.1)),
    
    // القدرات
    abilities: bossDef.abilities,
    drops: bossDef.drops,
    dropChance: bossDef.dropChance,
    weakness: bossDef.weakness || [],
    resistance: bossDef.resistance || [],
    
    // المكافآت
    xpReward: Math.floor(bossDef.xpReward * (1 + scalingLevel * 0.2)),
    goldReward: Math.floor(bossDef.goldReward * (1 + scalingLevel * 0.2)),
    
    // الحالة
    groupId,
    spawnedAt: now,
    registrationEnds: now + 10 * 60 * 1000, // 10 دقائق للتسجيل
    battleEnds: now + 30 * 60 * 1000, // 30 دقيقة إجمالي
    status: 'registration', // registration, active, defeated, timeout
    
    // المشاركون
    participants: {},
    registeredPlayers: [],
    
    // التتبع
    totalDamage: 0,
    phase: 1,
    lastAbilityUse: 0,
    abilityCooldowns: {},
    buffs: [],
    debuffs: [],
    
    // التكتيك
    tactics: {
      mageCount: 0,
      healerCount: 0,
      warriorCount: 0,
      lastTacticChange: 0
    }
  };

  activeBosses.set(instanceId, bossInstance);

  return {
    success: true,
    boss: bossInstance,
    message: formatBossAnnouncement(bossInstance)
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 التسجيل في قتال الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

export const registerForBoss = (instanceId, player) => {
  const boss = activeBosses.get(instanceId);
  
  if (!boss) {
    return { success: false, message: '❌ الزعيم غير موجود!' };
  }
  
  if (boss.status !== 'registration') {
    return { success: false, message: '❌ التسجيل مغلق!' };
  }
  
  if (Date.now() > boss.registrationEnds) {
    boss.status = 'active';
    return { success: false, message: '❌ انتهى وقت التسجيل!' };
  }
  
  // التحقق من عدم التسجيل المسبق
  if (boss.registeredPlayers.includes(player.id)) {
    return { success: false, message: '❌ أنت مسجل بالفعل!' };
  }
  
  // تسجيل اللاعب
  boss.registeredPlayers.push(player.id);
  boss.participants[player.id] = {
    name: player.name,
    class: player.class,
    level: player.level,
    damage: 0,
    attacks: 0,
    healing: 0
  };
  
  // تحديث التكتيك
  const classType = getClassType(player.class);
  if (classType === 'mage') boss.tactics.mageCount++;
  if (classType === 'healer') boss.tactics.healerCount++;
  if (classType === 'warrior') boss.tactics.warriorCount++;
  
  return {
    success: true,
    message: `✅ تم تسجيلك! المشاركين: ${boss.registeredPlayers.length}`,
    participantCount: boss.registeredPlayers.length
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ الهجوم على الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

export const attackBoss = (instanceId, playerId, playerName, playerAtk, playerMag, playerDef, playerClass, playerSkills) => {
  const boss = activeBosses.get(instanceId);
  
  if (!boss) {
    return { success: false, message: '❌ الزعيم غير موجود!' };
  }

  // التحقق من الحالة
  if (boss.status === 'registration') {
    // تحويل للوضع النشط إذا انتهى التسجيل
    if (Date.now() > boss.registrationEnds) {
      boss.status = 'active';
    } else {
      return { success: false, message: '⏰ لا يزال التسجيل جارياً!' };
    }
  }
  
  if (boss.status !== 'active') {
    return { success: false, message: '❌ القتال انتهى!' };
  }

  if (Date.now() > boss.battleEnds) {
    boss.status = 'timeout';
    activeBosses.delete(instanceId);
    return { success: false, message: '⏰ انتهى الوقت! هرب الزعيم!' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔢 حساب الضرر مع التكتيك
  // ═══════════════════════════════════════════════════════════════════════════
  
  const buffs = calculatePassiveBuffs({ skills: playerSkills });
  const classType = getClassType(playerClass);
  
  let baseDamage = Math.max(playerAtk, playerMag);
  baseDamage = baseDamage * (1 + (buffs.atk || 0) + (buffs.magicDamage || 0));
  
  // تعديل بناءً على نقاط ضعف/مقاومة الزعيم
  if (classType === 'mage' && boss.resistance.includes('سحر')) {
    baseDamage *= 0.7;
  } else if (classType === 'assassin' && boss.weakness.includes('اختراق الدروع')) {
    baseDamage *= 1.3;
  }
  
  // تعديل التكتيك - الزعيم يغير سلوكه حسب المهاجمين
  adaptBossTactics(boss);
  
  // خصم الدفاع
  const defenseReduction = boss.def * 0.5;
  let damage = Math.max(1, baseDamage - defenseReduction + Math.floor(Math.random() * 20));

  // الضربة الحرجة
  const critChance = (buffs.critChance || 0) + 0.05;
  const isCrit = Math.random() < critChance;
  if (isCrit) {
    damage = Math.floor(damage * (1.5 + (buffs.critDamage || 0)));
  }

  // تطبيق الضرر
  boss.hp -= damage;
  boss.totalDamage += damage;

  // تسجيل المشاركة
  if (!boss.participants[playerId]) {
    boss.participants[playerId] = { name: playerName, class: playerClass, damage: 0, attacks: 0 };
  }
  boss.participants[playerId].damage += damage;
  boss.participants[playerId].attacks++;

  // التحقق من الهزيمة
  if (boss.hp <= 0) {
    return defeatBoss(instanceId, playerId);
  }

  // تغيير المرحلة
  const hpPercent = boss.hp / boss.maxHp;
  updateBossPhase(boss, hpPercent);

  // هجوم مضاد
  let counterAttack = null;
  if (Math.random() < 0.3) {
    const counterDamage = Math.floor(boss.atk * (0.5 + Math.random() * 0.5));
    counterAttack = { damage: counterDamage };
  }

  // استخدام قدرة الزعيم
  const abilityResult = tryUseBossAbility(boss);

  return {
    success: true,
    damage,
    isCrit,
    bossHp: boss.hp,
    bossMaxHp: boss.maxHp,
    phase: boss.phase,
    counterAttack,
    abilityUsed: abilityResult,
    hpPercent: Math.floor(hpPercent * 100)
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 التكتيك الديناميكي للزعيم
// ═══════════════════════════════════════════════════════════════════════════════

const adaptBossTactics = (boss) => {
  const now = Date.now();
  if (now - boss.tactics.lastTacticChange < 60000) return; // كل دقيقة
  
  boss.tactics.lastTacticChange = now;
  
  // إذا أغلب المهاجمين سحرة، يرفع دفاعه السحري
  if (boss.tactics.mageCount > boss.tactics.warriorCount) {
    boss.mag = Math.floor(boss.mag * 1.1);
  }
  
  // إذا يوجد شافيين كثيرين، يزيد هجومه
  if (boss.tactics.healerCount >= 2) {
    boss.atk = Math.floor(boss.atk * 1.05);
  }
};

const updateBossPhase = (boss, hpPercent) => {
  if (hpPercent < 0.3 && boss.phase < 3) {
    boss.phase = 3;
    boss.atk = Math.floor(boss.atk * 1.5);
  } else if (hpPercent < 0.6 && boss.phase < 2) {
    boss.phase = 2;
    boss.atk = Math.floor(boss.atk * 1.2);
  }
};

const tryUseBossAbility = (boss) => {
  const now = Date.now();
  if (now - boss.lastAbilityUse < 30000) return null;
  
  const ability = boss.abilities[Math.floor(Math.random() * boss.abilities.length)];
  boss.lastAbilityUse = now;
  
  return ability;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 هزيمة الزعيم مع نظام MVP
// ═══════════════════════════════════════════════════════════════════════════════

const defeatBoss = (instanceId, lastAttackerId) => {
  const boss = activeBosses.get(instanceId);
  if (!boss) return { success: false, message: '❌ خطأ!' };

  boss.status = 'defeated';
  boss.defeatedAt = Date.now();
  boss.defeatedBy = lastAttackerId;

  // حساب المكافآت
  const rewards = {};
  const participants = Object.entries(boss.participants)
    .sort((a, b) => b[1].damage - a[1].damage);

  const totalDamage = boss.totalDamage;
  const mvpId = participants[0]?.[0]; // MVP

  for (const [playerId, data] of participants) {
    const contribution = data.damage / totalDamage;
    
    // XP وذهب
    const xpGain = Math.floor(boss.xpReward * contribution * (1 + Math.random() * 0.5));
    const goldGain = Math.floor(boss.goldReward * contribution * (1 + Math.random() * 0.3));

    // غنيمة
    let loot = null;
    const isMvp = playerId === mvpId;
    
    if (isMvp) {
      // MVP يضمن سلاح نادر + 15% سلاح أسطوري
      loot = boss.drops[Math.floor(Math.random() * boss.drops.length)];
      if (Math.random() < 0.15) {
        loot = '🌟 ' + loot + ' (أسطوري)';
      }
    } else if (Math.random() < boss.dropChance.weapon * contribution * 2) {
      loot = boss.drops[Math.floor(Math.random() * boss.drops.length)];
    }

    rewards[playerId] = {
      name: data.name,
      damage: data.damage,
      contribution: Math.floor(contribution * 100),
      xp: xpGain,
      gold: goldGain,
      loot,
      isMvp
    };
  }

  // زيادة مستوى الزعيم للمرة القادمة
  const currentScaling = bossLevelScaling.get(boss.bossId) || 0;
  bossLevelScaling.set(boss.bossId, currentScaling + 1);

  // حفظ في السجل
  bossHistory.push({ ...boss, rewards });

  activeBosses.delete(instanceId);

  return {
    success: true,
    defeated: true,
    boss: {
      name: boss.name,
      emoji: boss.emoji,
      title: boss.title,
      level: boss.level
    },
    rewards,
    mvpId,
    topDamage: participants.slice(0, 3).map(([id, data]) => ({
      id,
      name: data.name,
      damage: data.damage
    }))
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 أدوات مساعدة
// ═══════════════════════════════════════════════════════════════════════════════

const getClassType = (playerClass) => {
  const types = {
    'محارب': 'warrior',
    'ساحر': 'mage',
    'رامي': 'ranger',
    'شافي': 'healer',
    'قاتل': 'assassin',
    'فارس': 'warrior'
  };
  return types[playerClass] || 'warrior';
};

export const getActiveBoss = (groupId) => {
  for (const [id, boss] of activeBosses) {
    if (boss.groupId === groupId && (boss.status === 'active' || boss.status === 'registration')) {
      return { instanceId: id, ...boss };
    }
  }
  return null;
};

export const formatBossAnnouncement = async (boss, sock, groupId) => {
  let text = `⚔️ ═══════ زعيم ظهر! ═══════ ⚔️\n\n`;
  text += `${boss.emoji} ${boss.name}\n`;
  text += `📜 ${boss.title}\n`;
  text += `📍 التصنيف: ${boss.category}\n`;
  text += `⭐ المستوى: ${boss.level}\n\n`;
  
  text += `📊 الإحصائيات:\n`;
  text += `❤️ HP: ${boss.maxHp.toLocaleString()}\n`;
  text += `⚔️ ATK: ${boss.atk} | 🛡️ DEF: ${boss.def}\n`;
  text += `✨ MAG: ${boss.mag}\n\n`;
  
  text += `🎁 المكافآت:\n`;
  text += `⭐ XP: ${boss.xpReward.toLocaleString()}\n`;
  text += `💰 ذهب: ${boss.goldReward.toLocaleString()}\n\n`;
  
  text += `⏰ التسجيل: 10 دقائق\n`;
  text += `⏱️ القتال: 20 دقيقة\n\n`;
  
  text += `📝 .مشاركة للتسجيل\n`;
  text += `⚔️ .هجوم_زعيم للهجوم`;
  
  // إرسال الصورة مع النص إذا كان sock متاح
  if (sock && groupId) {
    await sendImageFromUrl(sock, groupId, DEFAULT_BOSS_IMAGE, text);
    return ''; // نرجع نص فارغ لأننا أرسلنا الصورة بالفعل
  }
  
  return text;
};

export const formatBossStatus = (boss) => {
  const hpPercent = boss.hp / boss.maxHp;
  const hpBar = '█'.repeat(Math.floor(hpPercent * 10)) + '░'.repeat(10 - Math.floor(hpPercent * 10));
  const remaining = Math.max(0, boss.battleEnds - Date.now());
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  const topParticipants = Object.entries(boss.participants)
    .sort((a, b) => b[1].damage - a[1].damage)
    .slice(0, 5);

  let text = `${boss.emoji} ${boss.name} [مرحلة ${boss.phase}]\n`;
  text += `📜 ${boss.title}\n\n`;
  text += `❤️ [${hpBar}] ${Math.floor(hpPercent * 100)}%\n`;
  text += `⚔️ HP: ${boss.hp.toLocaleString()}/${boss.maxHp.toLocaleString()}\n\n`;
  text += `⏱️ الوقت: ${mins}:${secs.toString().padStart(2, '0')}\n`;
  text += `👥 المشاركين: ${boss.registeredPlayers?.length || Object.keys(boss.participants).length}\n\n`;
  text += `📊 أعلى الضرر:`;

  for (let i = 0; i < topParticipants.length; i++) {
    const [_, data] = topParticipants[i];
    text += `\n${i + 1}. ${data.name}: ${data.damage.toLocaleString()}`;
  }

  text += `\n\n🎯 .هجوم_زعيم للهجوم!`;

  return text;
};

export const formatBattleResult = (result) => {
  if (!result.defeated) {
    return `⚔️ الهجوم على ${result.boss.name}!\n\n💥 ضررك: ${result.damage.toLocaleString()}${result.isCrit ? ' 🔥 حرجة!' : ''}\n📊 HP الزعيم: ${result.hpPercent}%\n\n${result.counterAttack ? `⚠️ هجوم مضاد: -${result.counterAttack.damage} HP!` : ''}`;
  }

  let text = `🏆 ═══════ انتصار! ═══════ 🏆\n\n`;
  text += `${result.boss.emoji} ${result.boss.name} هُزم!\n`;
  text += `📜 ${result.boss.title}\n\n`;
  text += `🏅 أعلى المساهمين:`;

  for (let i = 0; i < result.topDamage.length; i++) {
    const mvp = result.topDamage[i].id === result.mvpId ? ' 👑' : '';
    text += `\n${i + 1}. ${result.topDamage[i].name}: ${result.topDamage[i].damage.toLocaleString()}${mvp}`;
  }

  text += `\n\n🎁 المكافآت توزعت على ${Object.keys(result.rewards).length} لاعب!`;
  text += `\n👑 MVP: ${result.rewards[result.mvpId]?.name || 'غير محدد'}`;

  return text;
};

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

  return playerRewards.slice(-10);
};

export const cleanupExpiredBosses = () => {
  const now = Date.now();
  for (const [id, boss] of activeBosses) {
    if (boss.battleEnds < now) {
      activeBosses.delete(id);
    }
  }
};

// تنظيف كل دقيقة
setInterval(cleanupExpiredBosses, 60000);
