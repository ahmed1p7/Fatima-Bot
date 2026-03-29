// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ نظام شجرة المهارات - فاطمة بوت (محدث)
// يتضمن: فتح المهارات، عرض الشجرة، توزيع نقاط القدرة
// ═══════════════════════════════════════════════════════════════════════════════

import { SKILL_TREES, CLASSES } from './database.mjs';

// الحد الأقصى لنقاط القدرة لكل إحصائية
const MAX_STAT_POINTS = 50;

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 مهارات الأصناف (مُعرّفة محلياً للتحكم الكامل)
// ═══════════════════════════════════════════════════════════════════════════════

const CLASS_SKILLS = {
  'محارب': {
    passive: [
      { id: 'warrior_endurance', name: 'تحمل المحارب', description: '+10% HP', cost: 2, effect: { hpBonus: 0.1 } },
      { id: 'lifesteal', name: 'الاستنزاف', description: 'استعادة 15% من ضرر كل ضربة', cost: 3, effect: { lifesteal: 0.15 } },
      { id: 'berserk_mode', name: 'التحمل المتفجر', description: '+50% ضرر عند HP < 30%', cost: 4, effect: { berserk: 0.5 } }
    ],
    active: [
      { id: 'double_strike', name: 'الضربة المزدوجة', description: 'ضربتان متتاليتان', cost: 2, cooldown: 30, effect: { multiStrike: 2 } },
      { id: 'war_cry', name: 'صيحة الحرب', description: '+20% هجوم للفريق', cost: 3, cooldown: 60, effect: { teamAtkBoost: 0.2 } }
    ]
  },
  'ساحر': {
    passive: [
      { id: 'mana_shield', name: 'درع المانا', description: '-15% ضرر متلقى', cost: 2, effect: { damageReduction: 0.15 } },
      { id: 'cursed_luck', name: 'الحظ الملعون', description: 'الخصم يفشل 15%', cost: 3, effect: { enemyFailChance: 0.15 } },
      { id: 'bounty_aura', name: 'سحر البركة', description: '+20% فرصة صندوق', cost: 4, effect: { boxDropBonus: 0.2 } }
    ],
    active: [
      { id: 'mana_burn', name: 'سرقة المانا', description: '-3 طاقة للخصم', cost: 2, cooldown: 60, effect: { staminaDrain: 3 } },
      { id: 'frozen_spell', name: 'تعويذة التجميد', description: 'تجميد الخصم 5 ثواني', cost: 3, cooldown: 90, effect: { freeze: 5 } }
    ]
  },
  'رامي': {
    passive: [
      { id: 'eagle_eye', name: 'عين النسر', description: '+10% ضربة حرجة', cost: 2, effect: { critBonus: 0.1 } },
      { id: 'armor_penetration', name: 'الاختراق', description: 'تجاهل 25% دفاع', cost: 3, effect: { armorPen: 0.25 } },
      { id: 'poison_arrow', name: 'السهم المسموم', description: 'ضرر مستمر', cost: 4, effect: { poison: true } }
    ],
    active: [
      { id: 'precise_shot', name: 'الرصد الدقيق', description: 'ضربة حرجة مضمونة', cost: 2, cooldown: 45, effect: { guaranteedCrit: true } },
      { id: 'multi_shot', name: 'الرمي المتعدد', description: '3 أسهم', cost: 3, cooldown: 60, effect: { multiStrike: 3 } }
    ]
  },
  'شافي': {
    passive: [
      { id: 'healing_aura', name: 'هالة الشفاء', description: '+20% فعالية العلاج', cost: 2, effect: { healBonus: 0.2 } },
      { id: 'time_rewind', name: 'التجدد الزمني', description: 'إحياء عند الموت', cost: 5, effect: { revive: true } }
    ],
    active: [
      { id: 'heal', name: 'علاج', description: 'علاج زميل', cost: 1, cooldown: 10, effect: { heal: true } },
      { id: 'group_heal', name: 'علاج جماعي', description: 'علاج الفريق', cost: 3, cooldown: 300, effect: { groupHeal: true } },
      { id: 'resurrection', name: 'إحياء', description: 'إحياء زميل ميت', cost: 5, cooldown: 600, effect: { resurrection: true } }
    ]
  },
  'قاتل': {
    passive: [
      { id: 'stealth', name: 'التخفي', description: 'تجنب 20% من الضربات', cost: 2, effect: { dodge: 0.2 } },
      { id: 'backstab', name: 'الطعن الخلفي', description: '+50% ضرر من الخلف', cost: 3, effect: { backstab: 0.5 } },
      { id: 'poison_blade', name: 'النصل المسموم', description: 'ضرر مستمر', cost: 3, effect: { poison: true } }
    ],
    active: [
      { id: 'assassinate', name: 'الاغتيال', description: 'ضرر ×3', cost: 3, cooldown: 90, effect: { damageMultiplier: 3 } },
      { id: 'smoke_bomb', name: 'قنبلة دخان', description: 'هروب مضمون', cost: 2, cooldown: 60, effect: { escape: true } }
    ]
  },
  'فارس': {
    passive: [
      { id: 'iron_will', name: 'الإرادة الحديدية', description: '+20% دفاع', cost: 2, effect: { defBonus: 0.2 } },
      { id: 'shield_mastery', name: 'إتقان الدروع', description: '-25% ضرر', cost: 3, effect: { damageReduction: 0.25 } }
    ],
    active: [
      { id: 'shield_wall', name: 'جدار الدروع', description: 'حماية الفريق', cost: 2, cooldown: 45, effect: { teamShield: true } },
      { id: 'taunt', name: 'الاستفزاز', description: 'جذب الأعداء', cost: 2, cooldown: 30, effect: { taunt: true } },
      { id: 'auto_shield', name: 'الدرع التلقائي', description: '-40% ضرر 3 ثواني', cost: 2, cooldown: 45, effect: { autoShield: 3 } }
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔓 فتح مهارة
// ═══════════════════════════════════════════════════════════════════════════════

export function unlockSkill(player, skillId) {
  const classSkills = CLASS_SKILLS[player.class];
  if (!classSkills) {
    return { success: false, message: '❌ صنف غير معروف' };
  }
  
  // البحث عن المهارة
  let skill = null;
  let skillType = null;
  
  for (const type of ['passive', 'active']) {
    const found = classSkills[type]?.find(s => s.id === skillId || s.name === skillId);
    if (found) {
      skill = found;
      skillType = type;
      break;
    }
  }
  
  if (!skill) {
    return { success: false, message: '❌ مهارة غير موجودة لصنفك' };
  }
  
  // التحقق من النقاط
  if ((player.skillPoints || 0) < skill.cost) {
    return { success: false, message: `❌ تحتاج ${skill.cost} نقاط مهارة` };
  }
  
  // التحقق من عدم فتحها مسبقاً
  if (player.unlockedSkills?.[skillType]?.includes(skill.id)) {
    return { success: false, message: '❌ لديك هذه المهارة بالفعل' };
  }
  
  // فتح المهارة
  player.skillPoints -= skill.cost;
  
  if (!player.unlockedSkills) {
    player.unlockedSkills = { passive: [], active: [] };
  }
  if (!player.unlockedSkills[skillType]) {
    player.unlockedSkills[skillType] = [];
  }
  
  player.unlockedSkills[skillType].push(skill.id);
  
  // إضافة إلى قائمة المهارات الرئيسية (لتسهيل الوصول)
  if (!player.skills) player.skills = [];
  if (!player.skills.includes(skill.id)) {
    player.skills.push(skill.id);
  }
  
  return {
    success: true,
    message: `✅ تم فتح مهارة "${skill.name}"!\n📝 ${skill.description}`,
    skill
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 تنسيق شجرة المهارات (عرض جميع المهارات المتاحة للصنف)
// ═══════════════════════════════════════════════════════════════════════════════

export function formatSkillTree(player) {
  const classSkills = CLASS_SKILLS[player.class];
  if (!classSkills) {
    return '❌ صنف غير معروف';
  }
  
  const classData = CLASSES[player.class];
  let msg = `@
━─━••❁⊰｢❀｣⊱❁••━─━

${classData.emoji} • • ✤ شجرة مهارات ${player.class} ✤ • • ${classData.emoji}

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ ⚡ نقاط المهارة: ${player.skillPoints || 0}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

🌙 • • ✤ المهارات السلبية ✤ • • 🌙
`;
  
  if (classSkills.passive?.length > 0) {
    for (const skill of classSkills.passive) {
      const unlocked = player.unlockedSkills?.passive?.includes(skill.id);
      const status = unlocked ? '✅' : '🔒';
      msg += `\n${status} ${skill.name} (${skill.cost}⭐)\n   📝 ${skill.description}`;
    }
  }
  
  msg += `\n
⚔️ • • ✤ المهارات النشطة ✤ • • ⚔️
`;
  
  if (classSkills.active?.length > 0) {
    for (const skill of classSkills.active) {
      const unlocked = player.unlockedSkills?.active?.includes(skill.id);
      const status = unlocked ? '✅' : '🔒';
      const cooldownInfo = skill.cooldown ? ` | ⏰ ${skill.cooldown}s` : '';
      msg += `\n${status} ${skill.name} (${skill.cost}⭐${cooldownInfo})\n   📝 ${skill.description}`;
    }
  }
  
  msg += `

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
💡 استخدم .مهارة <اسم_المهارة> للفتح

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`;
  
  return msg;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 تنسيق مهاراتي (عرض المهارات المفتوحة فقط)
// ═══════════════════════════════════════════════════════════════════════════════

export function formatPlayerSkills(player) {
  const classSkills = CLASS_SKILLS[player.class];
  if (!classSkills) {
    return '❌ صنف غير معروف';
  }
  
  const classData = CLASSES[player.class];
  let msg = `@
━─━••❁⊰｢❀｣⊱❁••━─━

${classData.emoji} • • ✤ مهارات ${player.name} ✤ • • ${classData.emoji}

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ ⚡ نقاط المهارة: ${player.skillPoints || 0}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
`;

  const passiveSkills = player.unlockedSkills?.passive || [];
  const activeSkills = player.unlockedSkills?.active || [];
  
  if (passiveSkills.length === 0 && activeSkills.length === 0) {
    msg += `\n❌ لم تفتح أي مهارة بعد!\n💡 استخدم .شجرة لعرض المهارات المتاحة`;
  } else {
    if (passiveSkills.length > 0) {
      msg += `\n🌙 المهارات السلبية:\n`;
      for (const skillId of passiveSkills) {
        const skill = classSkills.passive?.find(s => s.id === skillId);
        if (skill) {
          msg += `│ ✅ ${skill.name}\n│    ${skill.description}\n`;
        }
      }
    }
    
    if (activeSkills.length > 0) {
      msg += `\n⚔️ المهارات النشطة:\n`;
      for (const skillId of activeSkills) {
        const skill = classSkills.active?.find(s => s.id === skillId);
        if (skill) {
          const cooldownInfo = skill.cooldown ? ` ⏰${skill.cooldown}s` : '';
          msg += `│ ✅ ${skill.name}${cooldownInfo}\n│    ${skill.description}\n`;
        }
      }
    }
  }
  
  msg += `
> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`;
  
  return msg;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 توزيع نقاط القدرة
// ═══════════════════════════════════════════════════════════════════════════════

export function allocateAbilityPoint(player, stat, amount = 1) {
  const validStats = ['hp', 'atk', 'def', 'mag'];
  
  if (!validStats.includes(stat)) {
    return {
      success: false,
      message: `❌ إحصائية غير صحيحة!\n💡 استخدم: hp, atk, def, mag`
    };
  }
  
  // التحقق من وجود نقاط كافية
  if ((player.abilityPoints || 0) < amount) {
    return {
      success: false,
      message: `❌ تحتاج ${amount} نقاط قدرة!\n⚡ نقاطك: ${player.abilityPoints || 0}`
    };
  }
  
  // التأكد من عدم تجاوز الحد الأقصى
  const currentAllocated = player.allocatedStats?.[stat] || 0;
  if (currentAllocated + amount > MAX_STAT_POINTS) {
    return {
      success: false,
      message: `❌ لا يمكن توزيع أكثر من ${MAX_STAT_POINTS} نقطة على ${stat}. لديك حالياً ${currentAllocated}.`
    };
  }
  
  // توزيع النقاط
  player.abilityPoints -= amount;
  if (!player.allocatedStats) player.allocatedStats = { hp: 0, atk: 0, def: 0, mag: 0 };
  player.allocatedStats[stat] = (player.allocatedStats[stat] || 0) + amount;
  
  // تطبيق التأثير
  switch (stat) {
    case 'hp':
      player.maxHp += amount * 10;
      player.hp += amount * 10;
      break;
    case 'atk':
      player.atk += amount * 2;
      break;
    case 'def':
      player.def += amount * 2;
      break;
    case 'mag':
      player.mag += amount * 3;
      break;
  }
  
  const statNames = { hp: '❤️ الصحة', atk: '⚔️ الهجوم', def: '🛡️ الدفاع', mag: '✨ السحر' };
  
  return {
    success: true,
    message: `✅ تم توزيع ${amount} نقطة على ${statNames[stat]}!\n📊 المجموع: ${player.allocatedStats[stat]}/${MAX_STAT_POINTS}`,
    newTotal: player.allocatedStats[stat]
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 دوال مساعدة للوصول إلى المهارات
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * الحصول على تفاصيل مهارة معينة
 * @param {string} className - اسم الصنف
 * @param {string} skillId - معرف المهارة
 * @returns {Object|null}
 */
export function getSkillDetails(className, skillId) {
  const classSkills = CLASS_SKILLS[className];
  if (!classSkills) return null;
  for (const type of ['passive', 'active']) {
    const skill = classSkills[type]?.find(s => s.id === skillId);
    if (skill) return { ...skill, type };
  }
  return null;
}

/**
 * التحقق مما إذا كان اللاعب يملك مهارة معينة
 * @param {Object} player
 * @param {string} skillId
 * @returns {boolean}
 */
export function hasSkill(player, skillId) {
  return player.unlockedSkills?.passive?.includes(skillId) || player.unlockedSkills?.active?.includes(skillId) || false;
}

// تصدير البيانات للاستخدام في ملفات أخرى
export { CLASS_SKILLS, MAX_STAT_POINTS };
