// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ نظام المهارات وشجرة المهارات
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 🌳 شجرة المهارات لكل صنف
// ═══════════════════════════════════════════════════════════════════════════════

export const SKILL_TREES = {
  'محارب': {
    passive: [
      { id: 'warrior_endurance', name: 'التحمل', emoji: '💪', description: '+10% صحة قصوى', effect: { maxHp: 0.1 }, unlockLevel: 5, maxLevel: 5 },
      { id: 'warrior_strength', name: 'القوة', emoji: '💪', description: '+8% هجوم', effect: { atk: 0.08 }, unlockLevel: 10, maxLevel: 5 },
      { id: 'warrior_armor', name: 'الدروع الثقيلة', emoji: '🛡️', description: '+12% دفاع', effect: { def: 0.12 }, unlockLevel: 15, maxLevel: 5 },
      { id: 'warrior_rage', name: 'الغضب', emoji: '😤', description: '+15% ضرر عند صحة منخفضة', effect: { lowHpDamage: 0.15 }, unlockLevel: 25, maxLevel: 3 },
      { id: 'warrior_last_stand', name: 'الموقف الأخير', emoji: '⚔️', description: 'فرصة للبقاء بـ 1 HP عند الموت', effect: { surviveChance: 0.1 }, unlockLevel: 40, maxLevel: 3 }
    ],
    active: [
      { id: 'warrior_slam', name: 'الضربة القاضية', emoji: '💥', description: 'ضرر 150% + يضعف العدو', effect: { damage: 1.5, debuff: 'weaken' }, unlockLevel: 5, cooldown: 3, maxLevel: 5 },
      { id: 'warrior_shield', name: 'الدرع الحديدي', emoji: '🛡️', description: 'يمنح درع يمتص 50% ضرر', effect: { shield: 0.5 }, unlockLevel: 15, cooldown: 5, maxLevel: 3 },
      { id: 'warrior_whirlwind', name: 'الدوامة', emoji: '🌪️', description: 'هجوم منطقة يصيب جميع الأعداء', effect: { aoeDamage: 0.8 }, unlockLevel: 30, cooldown: 4, maxLevel: 3 },
      { id: 'warrior_execute', name: 'الإعدام', emoji: '⚰️', description: 'ضرر 300% للأعداء أقل من 20% HP', effect: { executeDamage: 3, executeThreshold: 0.2 }, unlockLevel: 50, cooldown: 6, maxLevel: 1 }
    ]
  },

  'ساحر': {
    passive: [
      { id: 'mage_mana', name: 'المانا اللانهائية', emoji: '✨', description: '+15% سحر', effect: { mag: 0.15 }, unlockLevel: 5, maxLevel: 5 },
      { id: 'mage_intelligence', name: 'الذكاء السحري', emoji: '🧠', description: '+10% ضرر السحر', effect: { magicDamage: 0.1 }, unlockLevel: 10, maxLevel: 5 },
      { id: 'mage_meditation', name: 'التأمل', emoji: '🧘', description: 'استعادة 5% HP كل جولة', effect: { hpRegen: 0.05 }, unlockLevel: 20, maxLevel: 3 },
      { id: 'mage_arcane', name: 'السحر الخفي', emoji: '🔮', description: 'تجاهل 20% دفاع العدو', effect: { armorPen: 0.2 }, unlockLevel: 35, maxLevel: 3 }
    ],
    active: [
      { id: 'mage_fireball', name: 'كرة النار', emoji: '🔥', description: 'ضرر سحري 180%', effect: { magicDamage: 1.8 }, unlockLevel: 5, cooldown: 2, maxLevel: 5 },
      { id: 'mage_frost', name: 'الصقيع', emoji: '❄️', description: 'يجمّد العدو لجولة', effect: { freeze: 1 }, unlockLevel: 15, cooldown: 4, maxLevel: 3 },
      { id: 'mage_lightning', name: 'البرق', emoji: '⚡', description: 'ضرر 120% لعدة أهداف', effect: { chainLightning: 1.2 }, unlockLevel: 25, cooldown: 3, maxLevel: 3 },
      { id: 'mage_meteor', name: 'النيزك', emoji: '☄️', description: 'ضرر هائل 400% لجميع الأعداء', effect: { aoeDamage: 4 }, unlockLevel: 50, cooldown: 8, maxLevel: 1 }
    ]
  },

  'رامي': {
    passive: [
      { id: 'archer_precision', name: 'الدقة', emoji: '🎯', description: '+12% هجوم', effect: { atk: 0.12 }, unlockLevel: 5, maxLevel: 5 },
      { id: 'archer_speed', name: 'السرعة', emoji: '💨', description: 'فرصة 15% للهجوم مرتين', effect: { doubleStrike: 0.15 }, unlockLevel: 10, maxLevel: 5 },
      { id: 'archer_critical', name: 'الضربة الحرجة', emoji: '💥', description: '+20% ضرر حرج', effect: { critDamage: 0.2 }, unlockLevel: 20, maxLevel: 5 },
      { id: 'archer_evasion', name: 'المراوغة', emoji: '🌀', description: 'فرصة 10% لتفادي الهجوم', effect: { evasion: 0.1 }, unlockLevel: 30, maxLevel: 3 }
    ],
    active: [
      { id: 'archer_poison', name: 'السهام السامة', emoji: '☠️', description: 'ضرر + سم لـ 3 جولات', effect: { poison: 0.3, poisonDuration: 3 }, unlockLevel: 5, cooldown: 3, maxLevel: 5 },
      { id: 'archer_volley', name: 'وابل السهام', emoji: '🏹', description: '3-5 سهام على العدو', effect: { multiShot: { min: 3, max: 5 } }, unlockLevel: 15, cooldown: 4, maxLevel: 3 },
      { id: 'archer_snipe', name: 'القنص', emoji: '🎯', description: 'ضرر 250% + تجاهل الدفاع', effect: { damage: 2.5, ignoreDefense: true }, unlockLevel: 35, cooldown: 5, maxLevel: 3 },
      { id: 'archer_rain', name: 'مطر الموت', emoji: '🌧️', description: 'ضرر 200% لجميع الأعداء', effect: { aoeDamage: 2 }, unlockLevel: 50, cooldown: 6, maxLevel: 1 }
    ]
  },

  'شافي': {
    passive: [
      { id: 'healer_faith', name: 'الإيمان', emoji: '🙏', description: '+15% سحر', effect: { mag: 0.15 }, unlockLevel: 5, maxLevel: 5 },
      { id: 'healer_blessing', name: 'البركة', emoji: '✨', description: '+10% لعلاج الحلفاء', effect: { healBonus: 0.1 }, unlockLevel: 10, maxLevel: 5 },
      { id: 'healer_resilience', name: 'المرونة', emoji: '💚', description: '+20% صحة قصوى', effect: { maxHp: 0.2 }, unlockLevel: 20, maxLevel: 3 },
      { id: 'healer_revive', name: 'الإحياء', emoji: '💫', description: 'فرصة 10% لإحياء حليف', effect: { reviveChance: 0.1 }, unlockLevel: 40, maxLevel: 3 }
    ],
    active: [
      { id: 'healer_heal', name: 'العلاج', emoji: '💚', description: 'علاج 40% HP لنفسك أو حليف', effect: { heal: 0.4 }, unlockLevel: 5, cooldown: 2, maxLevel: 5 },
      { id: 'healer_shield', name: 'درع الحماية', emoji: '🛡️', description: 'درع يمتص 100% ضرر لجولة', effect: { shield: 1, duration: 1 }, unlockLevel: 15, cooldown: 4, maxLevel: 3 },
      { id: 'healer_group_heal', name: 'علاج جماعي', emoji: '💖', description: 'علاج 25% HP لجميع الحلفاء', effect: { groupHeal: 0.25 }, unlockLevel: 30, cooldown: 5, maxLevel: 3 },
      { id: 'healer_resurrection', name: 'البعث', emoji: '✨', description: 'إحياء حليف ميت بـ 50% HP', effect: { resurrect: 0.5 }, unlockLevel: 50, cooldown: 10, maxLevel: 1 }
    ]
  },

  'قاتل': {
    passive: [
      { id: 'assassin_stealth', name: 'التخفي', emoji: '👤', description: 'فرصة 20% للهجوم الأول', effect: { firstStrike: 0.2 }, unlockLevel: 5, maxLevel: 5 },
      { id: 'assassin_crit', name: 'الضربة القاتلة', emoji: '💀', description: '+25% فرصة ضربة حرجة', effect: { critChance: 0.25 }, unlockLevel: 10, maxLevel: 5 },
      { id: 'assassin_backstab', name: 'الطعن من الخلف', emoji: '🗡️', description: '+30% ضرر من الخلف', effect: { backstabDamage: 0.3 }, unlockLevel: 20, maxLevel: 3 },
      { id: 'assassin_evasion', name: 'الاختفاء', emoji: '🌀', description: 'فرصة 25% لتفادي الهجوم', effect: { evasion: 0.25 }, unlockLevel: 35, maxLevel: 3 }
    ],
    active: [
      { id: 'assassin_stab', name: 'الاغتيال', emoji: '🗡️', description: 'ضرر 200% + نزيف', effect: { damage: 2, bleed: 0.1 }, unlockLevel: 5, cooldown: 2, maxLevel: 5 },
      { id: 'assassin_vanish', name: 'الاختفاء', emoji: '💨', description: 'تختفي لجولة + شفاء 20%', effect: { vanish: 1, heal: 0.2 }, unlockLevel: 15, cooldown: 5, maxLevel: 3 },
      { id: 'assassin_mark', name: 'وسم الهدف', emoji: '🎯', description: 'الهدف التالي يأخذ ضرر مضاعف', effect: { mark: 2 }, unlockLevel: 25, cooldown: 4, maxLevel: 3 },
      { id: 'assassin_execute', name: 'الإعدام الصامت', emoji: '⚰️', description: 'قتل فوري إذا العدو <15% HP', effect: { execute: 0.15 }, unlockLevel: 50, cooldown: 8, maxLevel: 1 }
    ]
  },

  'فارس': {
    passive: [
      { id: 'knight_armor', name: 'الدروع الثقيلة', emoji: '🛡️', description: '+20% دفاع', effect: { def: 0.2 }, unlockLevel: 5, maxLevel: 5 },
      { id: 'knight_vitality', name: 'الحصانة', emoji: '💪', description: '+15% صحة قصوى', effect: { maxHp: 0.15 }, unlockLevel: 10, maxLevel: 5 },
      { id: 'knight_taunt', name: 'الاستفزاز', emoji: '😤', description: 'الأعداء يهاجمونك أولاً', effect: { taunt: true }, unlockLevel: 20, maxLevel: 1 },
      { id: 'knight_block', name: 'الصد', emoji: '🛡️', description: 'فرصة 20% لصد هجوم كامل', effect: { block: 0.2 }, unlockLevel: 35, maxLevel: 3 }
    ],
    active: [
      { id: 'knight_charge', name: 'الهجوم', emoji: '🐴', description: 'ضرر 180% + يضعف العدو', effect: { damage: 1.8, debuff: 'weaken' }, unlockLevel: 5, cooldown: 3, maxLevel: 5 },
      { id: 'knight_shield_wall', name: 'جدار الدروع', emoji: '🏰', description: 'يحمي الحلفاء لجولة', effect: { protectAll: 1 }, unlockLevel: 15, cooldown: 5, maxLevel: 3 },
      { id: 'knight_holy_strike', name: 'الضربة المقدسة', emoji: '⚔️', description: 'ضرر 250% مقدس', effect: { holyDamage: 2.5 }, unlockLevel: 30, cooldown: 4, maxLevel: 3 },
      { id: 'knight_last_stand', name: 'الموقف الأخير', emoji: '🛡️', description: 'مناعة 3 جولات + ضرر مضاعف', effect: { immunity: 3, damageBonus: 2 }, unlockLevel: 50, cooldown: 10, maxLevel: 1 }
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 نقاط القدرة
// ═══════════════════════════════════════════════════════════════════════════════

export const ABILITY_POINTS_PER_LEVEL = 3;

// تأثير توزيع نقاط القدرة
export const STAT_INCREASE = {
  hp: 10,     // كل نقطة = +10 HP
  atk: 2,     // كل نقطة = +2 ATK
  def: 2,     // كل نقطة = +2 DEF
  mag: 3      // كل نقطة = +3 MAG
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 توزيع نقاط القدرة
// ═══════════════════════════════════════════════════════════════════════════════

export const allocateAbilityPoint = (player, stat, amount = 1) => {
  if (!STAT_INCREASE[stat]) {
    return { success: false, message: '❌ إحصائية غير صحيحة! (hp, atk, def, mag)' };
  }

  const availablePoints = player.abilityPoints || 0;
  if (availablePoints < amount) {
    return { success: false, message: `❌ لا تملك نقاط كافية! لديك ${availablePoints} نقطة.` };
  }

  // توزيع النقاط
  player.abilityPoints = availablePoints - amount;
  player.allocatedStats = player.allocatedStats || { hp: 0, atk: 0, def: 0, mag: 0 };
  player.allocatedStats[stat] += amount;

  // تطبيق التأثير
  for (let i = 0; i < amount; i++) {
    switch (stat) {
      case 'hp':
        player.maxHp += STAT_INCREASE.hp;
        player.hp += STAT_INCREASE.hp;
        break;
      case 'atk':
        player.atk += STAT_INCREASE.atk;
        break;
      case 'def':
        player.def += STAT_INCREASE.def;
        break;
      case 'mag':
        player.mag += STAT_INCREASE.mag;
        break;
    }
  }

  return { 
    success: true, 
    message: `✅ تم توزيع ${amount} نقطة على ${stat}!\n📊 المتبقي: ${player.abilityPoints} نقطة`,
    remaining: player.abilityPoints,
    stat,
    increase: STAT_INCREASE[stat] * amount
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔓 فتح مهارة جديدة
// ═══════════════════════════════════════════════════════════════════════════════

export const unlockSkill = (player, skillId) => {
  const classTree = SKILL_TREES[player.class];
  if (!classTree) {
    return { success: false, message: '❌ صنف غير موجود!' };
  }

  // البحث عن المهارة
  let skill = null;
  let skillType = null;

  for (const type of ['passive', 'active']) {
    const found = classTree[type]?.find(s => s.id === skillId);
    if (found) {
      skill = found;
      skillType = type;
      break;
    }
  }

  if (!skill) {
    return { success: false, message: '❌ مهارة غير موجودة!' };
  }

  // التحقق من المستوى
  if (player.level < skill.unlockLevel) {
    return { success: false, message: `❌ يتطلب مستوى ${skill.unlockLevel}!` };
  }

  // التحقق إذا كانت مفتوحة بالفعل
  player.skills = player.skills || { passive: [], active: [] };
  const existingSkill = player.skills[skillType]?.find(s => s.id === skillId);

  if (existingSkill && existingSkill.level >= skill.maxLevel) {
    return { success: false, message: '❌ المهارة في أعلى مستوى!' };
  }

  // التحقق من نقاط المهارة
  const skillPoints = player.skillPoints || 0;
  if (skillPoints <= 0) {
    return { success: false, message: '❌ لا تملك نقاط مهارة! ارفع مستواك للحصول على المزيد.' };
  }

  // فتح أو ترقية المهارة
  if (existingSkill) {
    existingSkill.level++;
  } else {
    player.skills[skillType].push({
      id: skill.id,
      name: skill.name,
      emoji: skill.emoji,
      level: 1,
      maxLevel: skill.maxLevel,
      effect: skill.effect,
      cooldown: skill.cooldown || 0,
      currentCooldown: 0
    });
  }

  player.skillPoints = skillPoints - 1;

  return { 
    success: true, 
    message: existingSkill 
      ? `✅ تم ترقية ${skill.name} للمستوى ${existingSkill.level}!`
      : `✅ تم فتح مهارة ${skill.name}!`,
    skill: skill,
    type: skillType
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 استخدام مهارة نشطة
// ═══════════════════════════════════════════════════════════════════════════════

export const useActiveSkill = (player, skillId, target = null) => {
  const skill = player.skills?.active?.find(s => s.id === skillId);
  
  if (!skill) {
    return { success: false, message: '❌ لا تملك هذه المهارة!' };
  }

  if (skill.currentCooldown > 0) {
    return { success: false, message: `⏰ المهارة في وضع التهدئة! انتظر ${skill.currentCooldown} جولة.` };
  }

  // تطبيق تأثير المهارة
  const effect = { ...skill.effect };
  const level = skill.level;

  // تعديل التأثير حسب المستوى
  for (const [key, value] of Object.entries(effect)) {
    if (typeof value === 'number' && !['duration', 'executeThreshold'].includes(key)) {
      effect[key] = value * (1 + (level - 1) * 0.15);
    }
  }

  // تعيين وقت التهدئة
  skill.currentCooldown = skill.cooldown || 2;

  return {
    success: true,
    message: `✨ استخدام ${skill.emoji} ${skill.name}!`,
    effect,
    skill
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 تقليل وقت التهدئة
// ═══════════════════════════════════════════════════════════════════════════════

export const reduceCooldowns = (player) => {
  if (!player.skills?.active) return;

  for (const skill of player.skills.active) {
    if (skill.currentCooldown > 0) {
      skill.currentCooldown--;
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 حساب البافات السلبية
// ═══════════════════════════════════════════════════════════════════════════════

export const calculatePassiveBuffs = (player) => {
  const buffs = {
    maxHp: 0,
    atk: 0,
    def: 0,
    mag: 0,
    critChance: 0,
    critDamage: 0,
    evasion: 0,
    armorPen: 0,
    magicDamage: 0,
    healBonus: 0,
    firstStrike: 0
  };

  if (!player.skills?.passive) return buffs;

  for (const skill of player.skills.passive) {
    const level = skill.level || 1;
    for (const [key, value] of Object.entries(skill.effect || {})) {
      if (buffs[key] !== undefined) {
        buffs[key] += value * level;
      }
    }
  }

  return buffs;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 عرض شجرة المهارات
// ═══════════════════════════════════════════════════════════════════════════════

export const formatSkillTree = (player) => {
  const classTree = SKILL_TREES[player.class];
  if (!classTree) return '❌ لا توجد مهارات لهذا الصنف!';

  let text = `🌳 ═══════ شجرة مهارات ${player.class} ═══════ 🌳\n\n`;

  // المهارات السلبية
  text += `📊 المهارات السلبية:\n`;
  text += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;

  for (const skill of classTree.passive) {
    const owned = player.skills?.passive?.find(s => s.id === skill.id);
    const canUnlock = player.level >= skill.unlockLevel;
    const status = owned 
      ? `✅ Lv.${owned.level}/${skill.maxLevel}`
      : canUnlock 
        ? `🔓 متاح` 
        : `🔒 Lv.${skill.unlockLevel}`;

    text += `${skill.emoji} ${skill.name} ${status}\n`;
    text += `   ${skill.description}\n`;

    if (owned) {
      text += `   المستوى: ${owned.level}/${skill.maxLevel}\n`;
    } else if (!canUnlock) {
      text += `   يتطلب: مستوى ${skill.unlockLevel}\n`;
    }
    text += `\n`;
  }

  // المهارات النشطة
  text += `\n⚔️ المهارات النشطة:\n`;
  text += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;

  for (const skill of classTree.active) {
    const owned = player.skills?.active?.find(s => s.id === skill.id);
    const canUnlock = player.level >= skill.unlockLevel;
    const status = owned 
      ? `✅ Lv.${owned.level}/${skill.maxLevel}`
      : canUnlock 
        ? `🔓 متاح` 
        : `🔒 Lv.${skill.unlockLevel}`;

    text += `${skill.emoji} ${skill.name} ${status}\n`;
    text += `   ${skill.description}\n`;

    if (owned) {
      text += `   المستوى: ${owned.level}/${skill.maxLevel} | تهديئة: ${skill.cooldown} جولات\n`;
    } else if (!canUnlock) {
      text += `   يتطلب: مستوى ${skill.unlockLevel}\n`;
    }
    text += `\n`;
  }

  text += `\n📊 نقاط المهارة: ${player.skillPoints || 0}`;
  text += `\n💡 استخدم .مهارة <اسم> لفتح مهارة`;

  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 عرض مهارات اللاعب
// ═══════════════════════════════════════════════════════════════════════════════

export const formatPlayerSkills = (player) => {
  let text = `⚡ ═══════ مهارات ${player.name} ═══════ ⚡\n\n`;

  // المهارات السلبية
  const passives = player.skills?.passive || [];
  text += `📊 السلبية (${passives.length}):\n`;
  
  if (passives.length === 0) {
    text += `   ❌ لا تملك مهارات سلبية\n`;
  } else {
    for (const skill of passives) {
      text += `   ${skill.emoji} ${skill.name} Lv.${skill.level}\n`;
    }
  }

  // المهارات النشطة
  const actives = player.skills?.active || [];
  text += `\n⚔️ النشطة (${actives.length}):\n`;
  
  if (actives.length === 0) {
    text += `   ❌ لا تملك مهارات نشطة\n`;
  } else {
    for (const skill of actives) {
      const cooldown = skill.currentCooldown > 0 ? ` ⏰${skill.currentCooldown}` : '';
      text += `   ${skill.emoji} ${skill.name} Lv.${skill.level}${cooldown}\n`;
    }
  }

  // نقاط القدرة
  text += `\n📊 نقاط المهارة: ${player.skillPoints || 0}`;
  text += `\n📊 نقاط القدرة: ${player.abilityPoints || 0}`;

  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎖️ منح نقاط عند رفع المستوى
// ═══════════════════════════════════════════════════════════════════════════════

export const grantLevelUpRewards = (player, newLevel) => {
  const rewards = {
    abilityPoints: ABILITY_POINTS_PER_LEVEL,
    skillPoints: 1, // نقطة مهارة واحدة لكل مستوى
    hpIncrease: Math.floor(player.maxHp * 0.05),
    atkIncrease: Math.floor(player.atk * 0.03),
    defIncrease: Math.floor(player.def * 0.03),
    magIncrease: Math.floor(player.mag * 0.03)
  };

  // إضافة النقاط
  player.abilityPoints = (player.abilityPoints || 0) + rewards.abilityPoints;
  player.skillPoints = (player.skillPoints || 0) + rewards.skillPoints;

  // زيادة الإحصائيات تلقائياً
  player.maxHp += rewards.hpIncrease;
  player.hp = player.maxHp;
  player.atk += rewards.atkIncrease;
  player.def += rewards.defIncrease;
  player.mag += rewards.magIncrease;

  // مكافآت خاصة لمستويات معينة
  if (newLevel % 10 === 0) {
    rewards.bonusGold = newLevel * 100;
    player.gold = (player.gold || 0) + rewards.bonusGold;
  }

  return rewards;
};
