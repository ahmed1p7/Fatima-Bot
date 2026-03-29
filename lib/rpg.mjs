// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 نظام RPG الأساسي - فاطمة بوت v13.0 (محدث)
// يتضمن: المستويات، القتال، PvP، الصناديق، العلاج، المهن، وغيرها
// ═══════════════════════════════════════════════════════════════════════════════

import { CLASSES, BOXES, SKILL_TREES } from './database.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 دوال حساب XP والمستويات
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * حساب XP المطلوب للوصول إلى مستوى معين (للاعب)
 * @param {number} level - المستوى الحالي
 * @returns {number} XP المطلوب
 */
export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * حساب XP المطلوب لمستوى الكلان
 * @param {number} level - مستوى الكلان الحالي
 * @returns {number} XP المطلوب
 */
export function clanXpForLevel(level) {
  return Math.floor(500 * Math.pow(1.3, level - 1));
}

/**
 * شريط تقدم الكلان
 * @param {number} xp - XP الحالي للكلان
 * @param {number} level - مستوى الكلان
 * @returns {string} شريط تقدم (10 خانات)
 */
export function progressClanBar(xp, level) {
  const xpNeeded = clanXpForLevel(level);
  const percent = Math.max(0, Math.min(1, xp / xpNeeded));
  const length = 10;
  const filled = Math.floor(percent * length);
  const empty = length - filled;
  return '▓'.repeat(filled) + '░'.repeat(empty);
}

/**
 * شريط الصحة أو XP
 * @param {number} current - القيمة الحالية
 * @param {number} max - القيمة القصوى
 * @param {number} length - طول الشريط (افتراضي 10)
 * @returns {string} شريط تقدم
 */
export function healthBar(current, max, length = 10) {
  const percent = Math.max(0, Math.min(1, current / max));
  const filled = Math.floor(percent * length);
  const empty = length - filled;
  return '▓'.repeat(filled) + '░'.repeat(empty);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⬆️ نظام رفع المستوى
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ترقية مستوى اللاعب إذا توفر XP كافٍ
 * @param {Object} player - كائن اللاعب (سيتم تعديله مباشرة)
 * @returns {Object} نتيجة الترقية { leveledUp, newLevel, rewards }
 */
export function levelUp(player) {
  const xpNeeded = xpForLevel(player.level);
  
  if (player.xp >= xpNeeded) {
    player.xp -= xpNeeded;
    player.level++;
    
    const classData = CLASSES[player.class];
    if (!classData) {
      console.warn(`صنف غير معروف: ${player.class}`);
      return { leveledUp: false };
    }
    
    // زيادة الإحصائيات الأساسية
    const hpBonus = Math.floor(classData.hp * 0.1);
    const atkBonus = Math.floor(classData.atk * 0.05);
    const defBonus = Math.floor(classData.def * 0.05);
    const magBonus = Math.floor(classData.mag * 0.05);
    
    player.maxHp += hpBonus;
    player.hp = player.maxHp;
    player.atk += atkBonus;
    player.def += defBonus;
    player.mag += magBonus;
    
    // نقاط القدرة والمهارات
    player.abilityPoints = (player.abilityPoints || 0) + 3;
    player.skillPoints = (player.skillPoints || 0) + 1;
    
    return {
      leveledUp: true,
      newLevel: player.level,
      rewards: {
        maxHp: hpBonus,
        atk: atkBonus,
        def: defBonus,
        mag: magBonus,
        abilityPoints: 3,
        skillPoints: 1
      }
    };
  }
  
  return { leveledUp: false };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ نظام قتال الوحوش
// ═══════════════════════════════════════════════════════════════════════════════

const MONSTERS = [
  { name: 'ذئب بري', emoji: '🐺', hp: 50, atk: 12, def: 5, xp: 15, gold: 20 },
  { name: 'عنكبوت سام', emoji: '🕷️', hp: 40, atk: 15, def: 3, xp: 18, gold: 25 },
  { name: 'غول', emoji: '👹', hp: 100, atk: 25, def: 15, xp: 40, gold: 60 },
  { name: 'تنين صغير', emoji: '🐲', hp: 150, atk: 35, def: 20, xp: 70, gold: 100 },
  { name: 'ساحر مظلم', emoji: '🧙', hp: 80, atk: 40, def: 8, xp: 55, gold: 80 },
  { name: 'عملاق', emoji: '🦍', hp: 200, atk: 30, def: 25, xp: 90, gold: 120 },
  { name: 'عقرب عملاق', emoji: '🦂', hp: 70, atk: 28, def: 12, xp: 45, gold: 65 }
];

/**
 * الحصول على وحش عشوائي مناسب لمستوى اللاعب
 * @param {number} playerLevel - مستوى اللاعب
 * @returns {Object} كائن الوحش (بإحصائيات مكبرة حسب المستوى)
 */
export function getRandomMonster(playerLevel) {
  const levelMod = Math.max(0, playerLevel - 1);
  const scaledMonsters = MONSTERS.map(m => ({
    ...m,
    hp: Math.floor(m.hp * (1 + levelMod * 0.1)),
    atk: Math.floor(m.atk * (1 + levelMod * 0.05)),
    def: Math.floor(m.def * (1 + levelMod * 0.05)),
    xp: Math.floor(m.xp * (1 + levelMod * 0.1)),
    gold: Math.floor(m.gold * (1 + levelMod * 0.1))
  }));
  
  return scaledMonsters[Math.floor(Math.random() * scaledMonsters.length)];
}

/**
 * معركة مع وحش عشوائي
 * @param {Object} player - كائن اللاعب
 * @returns {Object} نتيجة المعركة (فوز/هزيمة، مكافآت، إلخ)
 */
export function fightMonster(player) {
  const monster = getRandomMonster(player.level);
  
  // حساب قوة اللاعب (مع المعدات)
  let playerAtk = player.atk;
  let playerDef = player.def;
  if (player.equippedWeapon) playerAtk += player.equippedWeapon.atk || 0;
  if (player.equippedArmor) playerDef += player.equippedArmor.def || 0;
  
  // التحقق من المهارات السلبية
  const hasLifesteal = player.unlockedSkills?.passive?.includes('lifesteal');
  const hasBerserk = player.unlockedSkills?.passive?.includes('berserk_mode');
  const hasArmorPen = player.unlockedSkills?.passive?.includes('armor_penetration');
  
  let monsterHp = monster.hp;
  let playerHp = player.hp;
  let rounds = 0;
  const maxRounds = 20;
  
  while (monsterHp > 0 && playerHp > 0 && rounds < maxRounds) {
    rounds++;
    
    // هجوم اللاعب
    let damage = Math.max(1, playerAtk - monster.def * (hasArmorPen ? 0.75 : 1));
    if (hasBerserk && playerHp < player.maxHp * 0.3) damage *= 1.5;
    if (Math.random() < (player.critRate || 0.05)) damage *= (player.critDamage || 1.5);
    
    monsterHp -= damage;
    
    // استنزاف الحياة
    if (hasLifesteal && damage > 0) {
      playerHp = Math.min(player.maxHp, playerHp + damage * 0.15);
    }
    
    if (monsterHp <= 0) break;
    
    // هجوم الوحش
    const monsterDamage = Math.max(1, monster.atk - playerDef);
    playerHp -= monsterDamage;
  }
  
  player.hp = Math.max(0, playerHp);
  const won = monsterHp <= 0;
  
  if (won) {
    const xpGained = monster.xp + Math.floor(Math.random() * monster.xp * 0.5);
    const goldGained = monster.gold + Math.floor(Math.random() * monster.gold * 0.3);
    
    player.xp = (player.xp || 0) + xpGained;
    player.gold = (player.gold || 0) + goldGained;
    player.wins = (player.wins || 0) + 1;
    
    if (!player.stats) player.stats = {};
    player.stats.monstersKilled = (player.stats.monstersKilled || 0) + 1;
    
    // رفع المستوى
    const levelUpResult = levelUp(player);
    
    // فرصة سقوط صندوق
    let boxDrop = null;
    if (Math.random() < 0.1) {
      const boxTypes = ['common', 'rare', 'epic', 'legendary'];
      const weights = [0.7, 0.2, 0.08, 0.02];
      let rand = Math.random();
      let cumulative = 0;
      for (let i = 0; i < boxTypes.length; i++) {
        cumulative += weights[i];
        if (rand < cumulative) {
          boxDrop = boxTypes[i];
          if (!player.boxes) player.boxes = {};
          player.boxes[boxDrop] = (player.boxes[boxDrop] || 0) + 1;
          break;
        }
      }
    }
    
    return {
      won: true,
      monster,
      playerHp: player.hp,
      rewards: { xp: xpGained, gold: goldGained },
      levelUp: levelUpResult.leveledUp ? levelUpResult : null,
      boxDrop
    };
  } else {
    player.losses = (player.losses || 0) + 1;
    return { won: false, monster, playerHp: player.hp, rounds };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🗡️ نظام PvP
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * معركة بين لاعبين (PvP)
 * @param {Object} player1 - اللاعب المهاجم
 * @param {Object} player2 - اللاعب المدافع
 * @returns {Object} نتيجة المعركة (الفائز، الخاسر، المكافآت)
 */
export function pvpBattle(player1, player2) {
  let p1Hp = player1.hp;
  let p2Hp = player2.hp;
  
  const p1Atk = player1.atk + (player1.equippedWeapon?.atk || 0);
  const p1Def = player1.def + (player1.equippedArmor?.def || 0);
  const p2Atk = player2.atk + (player2.equippedWeapon?.atk || 0);
  const p2Def = player2.def + (player2.equippedArmor?.def || 0);
  
  const rounds = [];
  let round = 0;
  const maxRounds = 15;
  
  while (p1Hp > 0 && p2Hp > 0 && round < maxRounds) {
    round++;
    
    // هجوم اللاعب 1
    let p1Damage = Math.max(1, p1Atk - p2Def * 0.5);
    let crit1 = Math.random() < (player1.critRate || 0.05);
    if (crit1) p1Damage *= (player1.critDamage || 1.5);
    p2Hp -= p1Damage;
    rounds.push({ attacker: 1, damage: p1Damage, crit: crit1 });
    if (p2Hp <= 0) break;
    
    // هجوم اللاعب 2
    let p2Damage = Math.max(1, p2Atk - p1Def * 0.5);
    let crit2 = Math.random() < (player2.critRate || 0.05);
    if (crit2) p2Damage *= (player2.critDamage || 1.5);
    p1Hp -= p2Damage;
    rounds.push({ attacker: 2, damage: p2Damage, crit: crit2 });
  }
  
  const p1Won = p2Hp <= 0;
  const winner = p1Won ? player1 : player2;
  const loser = p1Won ? player2 : player1;
  
  // تحديث HP
  player1.hp = Math.max(1, Math.floor(p1Hp));
  player2.hp = Math.max(1, Math.floor(p2Hp));
  
  // مكافآت
  const goldReward = Math.min(loser.gold, Math.floor(50 + winner.level * 10));
  winner.gold = (winner.gold || 0) + goldReward;
  loser.gold = Math.max(0, (loser.gold || 0) - goldReward);
  winner.wins = (winner.wins || 0) + 1;
  loser.losses = (loser.losses || 0) + 1;
  winner.xp = (winner.xp || 0) + 30 + loser.level * 5;
  
  return {
    winner,
    loser,
    goldReward,
    rounds: rounds.length,
    winnerHp: p1Won ? p1Hp : p2Hp
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎁 نظام الصناديق
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * فتح صندوق
 * @param {Object} player - كائن اللاعب
 * @param {string} boxType - نوع الصندوق (common, rare, epic, legendary)
 * @returns {Object} نتيجة الفتح (المكافآت، الترقية)
 */
export function openBox(player, boxType) {
  const box = BOXES[boxType];
  if (!box) return { error: 'نوع صندوق غير صحيح' };
  if (!player.boxes || player.boxes[boxType] <= 0) {
    return { error: 'لا تملك هذا الصندوق' };
  }
  
  player.boxes[boxType]--;
  
  const rewards = {
    gold: 0,
    xp: 0,
    items: []
  };
  
  // ذهب
  const [minGold, maxGold] = box.rewards.gold;
  rewards.gold = minGold + Math.floor(Math.random() * (maxGold - minGold));
  
  // XP
  rewards.xp = Math.floor(rewards.gold * 0.5);
  
  // عناصر عشوائية
  const itemCount = Math.random() < 0.5 ? 1 : (Math.random() < 0.3 ? 2 : 0);
  for (let i = 0; i < itemCount; i++) {
    const item = box.rewards.items[Math.floor(Math.random() * box.rewards.items.length)];
    rewards.items.push(item);
    if (!player.inventory) player.inventory = [];
    player.inventory.push(item);
  }
  
  player.gold = (player.gold || 0) + rewards.gold;
  player.xp = (player.xp || 0) + rewards.xp;
  
  if (!player.stats) player.stats = {};
  player.stats.boxesOpened = (player.stats.boxesOpened || 0) + 1;
  
  const levelUpResult = levelUp(player);
  
  return {
    box,
    rewards,
    levelUp: levelUpResult.leveledUp ? levelUpResult : null
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💚 نظام العلاج
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * علاج لاعب آخر (لصنف الشافي)
 * @param {Object} player - اللاعب المعالج
 * @param {Object} target - اللاعب المستهدف
 * @param {number} healerMag - قوة سحر المعالج (عادة player.mag)
 * @returns {Object} نتيجة العلاج
 */
export function healPlayer(player, target, healerMag) {
  if (target.hp >= target.maxHp) {
    return { error: 'الصحة كاملة' };
  }
  
  const healAmount = Math.min(target.maxHp - target.hp, healerMag * 5);
  target.hp += healAmount;
  
  player.xp = (player.xp || 0) + 20;
  player.gold = (player.gold || 0) + 10;
  
  if (!player.stats) player.stats = {};
  player.stats.playersHealed = (player.stats.playersHealed || 0) + 1;
  player.stats.healingDone = (player.stats.healingDone || 0) + healAmount;
  
  return {
    healed: true,
    healAmount,
    targetName: target.name
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎣 الصيد والتعدين
// ═══════════════════════════════════════════════════════════════════════════════

const FISH = [
  { name: 'سمكة صغيرة', emoji: '🐟', price: 10 },
  { name: 'سمكة متوسطة', emoji: '🐠', price: 25 },
  { name: 'سمكة كبيرة', emoji: '🐡', price: 50 },
  { name: 'حبار', emoji: '🦑', price: 80 },
  { name: 'أخطبوط', emoji: '🐙', price: 100 },
  { name: 'سلحفاة', emoji: '🐢', price: 60 },
  { name: 'حوت صغير', emoji: '🐳', price: 200 }
];

const MINERALS = [
  { name: 'حجر عادي', emoji: '🪨', price: 5 },
  { name: 'حديد', emoji: '🔩', price: 20 },
  { name: 'نحاس', emoji: '🥉', price: 30 },
  { name: 'فضة', emoji: '⚪', price: 50 },
  { name: 'ذهب', emoji: '🟡', price: 100 },
  { name: 'ماسة', emoji: '💎', price: 250 },
  { name: 'ياقوت', emoji: '🔴', price: 300 }
];

export function fish() {
  return FISH[Math.floor(Math.random() * FISH.length)];
}

export function mine() {
  return MINERALS[Math.floor(Math.random() * MINERALS.length)];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💼 نظام العمل
// ═══════════════════════════════════════════════════════════════════════════════

const JOBS = [
  { name: 'مزارع', emoji: '🌾', basePay: 20 },
  { name: 'صياد', emoji: '🎣', basePay: 25 },
  { name: 'حداد', emoji: '⚒️', basePay: 30 },
  { name: 'تاجر', emoji: '🛒', basePay: 35 },
  { name: 'حارس', emoji: '🛡️', basePay: 40 },
  { name: 'مرتزق', emoji: '⚔️', basePay: 50 }
];

export function work(player) {
  const job = JOBS[Math.floor(Math.random() * JOBS.length)];
  const earnings = job.basePay + Math.floor(Math.random() * player.level * 5);
  player.gold = (player.gold || 0) + earnings;
  player.lastWork = Date.now();
  return { job, earnings };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 تنسيق الملف الشخصي (Profile)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * تنسيق عرض الملف الشخصي للاعب
 * @param {Object} player - كائن اللاعب
 * @param {string} classEmoji - الإيموجي الخاص بالصنف
 * @returns {string} النص المنسق
 */
export function formatProfile(player, classEmoji) {
  const xpNeeded = xpForLevel(player.level);
  const xpBar = healthBar(player.xp, xpNeeded);
  const hpBar = healthBar(player.hp, player.maxHp);
  const staminaBar = healthBar(player.stamina || 10, player.maxStamina || 10);
  
  return `@
━─━••❁⊰｢❀｣⊱❁••━─━

${classEmoji} • • ✤ ${player.name} ✤ • • ${classEmoji}

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ 🎭 الصنف: ${player.class}
│ 🎖️ المستوى: ${player.level}
│ ⭐ XP: ${player.xp}/${xpNeeded}
│ 📊 [${xpBar}]
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

❤️ الصحة: ${player.hp}/${player.maxHp}
│ [${hpBar}]

⚡ الطاقة: ${player.stamina || 10}/${player.maxStamina || 10}
│ [${staminaBar}]

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

📊 الإحصائيات:
│ ⚔️ هجوم: ${player.atk}
│ 🛡️ دفاع: ${player.def}
│ ✨ سحر: ${player.mag}
│ 💰 ذهب: ${(player.gold || 0).toLocaleString()}

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

🏆 الانتصارات: ${player.wins || 0}
💔 الخسائر: ${player.losses || 0}
📦 الصناديق: ⚪${player.boxes?.common || 0} 🔵${player.boxes?.rare || 0} 🟣${player.boxes?.epic || 0} 🟡${player.boxes?.legendary || 0}

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 حساب سعر البيع
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * حساب سعر بيع عنصر (سلاح، درع، إلخ)
 * @param {Object} item - العنصر المراد بيعه
 * @returns {number} السعر المقدر
 */
export function getSellPrice(item) {
  if (!item) return 0;
  
  let basePrice = 50;
  if (item.atk) basePrice += item.atk * 5;
  if (item.def) basePrice += item.def * 5;
  if (item.mag) basePrice += item.mag * 3;
  if (item.type === 'weapon') basePrice *= 1.2;
  if (item.type === 'armor') basePrice *= 1.1;
  
  const rarityMultipliers = {
    'أسطوري': 5,
    'ملحمي': 3,
    'نادر': 2,
    'شائع': 1
  };
  basePrice *= rarityMultipliers[item.rarity] || 1;
  basePrice *= (1 + (item.level || 1) * 0.1);
  
  return Math.floor(basePrice);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 كائن RPG الرئيسي (للتصدير الموحد)
// ═══════════════════════════════════════════════════════════════════════════════

export const RPG = {
  xpForLevel,
  clanXpForLevel,
  progressClanBar,
  healthBar,
  levelUp,
  getRandomMonster,
  fightMonster,
  pvpBattle,
  openBox,
  healPlayer,
  fish,
  mine,
  work,
  formatProfile,
  getSellPrice,
  MONSTERS,
  FISH,
  MINERALS,
  JOBS
};

// تصدير البيانات بشكل منفصل (للراحة)
export { MONSTERS, FISH, MINERALS, JOBS };
