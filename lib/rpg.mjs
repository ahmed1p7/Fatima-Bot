// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 نظام RPG الأساسي - فاطمة بوت
// ═══════════════════════════════════════════════════════════════════════════════

import { CLASSES, BOXES, SKILL_TREES } from './database.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 حساب XP للمستوى
// ═══════════════════════════════════════════════════════════════════════════════

export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function clanXpForLevel(level) {
  return Math.floor(500 * Math.pow(1.3, level - 1));
}

// ═══════════════════════════════════════════════════════════════════════════════
// ❤️ شريط الصحة
// ═══════════════════════════════════════════════════════════════════════════════

export function healthBar(current, max, length = 10) {
  const percent = Math.max(0, Math.min(1, current / max));
  const filled = Math.floor(percent * length);
  const empty = length - filled;
  
  // تلوين حسب النسبة
  let bar = '';
  if (percent > 0.6) {
    bar = '▓'.repeat(filled) + '░'.repeat(empty);
  } else if (percent > 0.3) {
    bar = '▓'.repeat(filled) + '░'.repeat(empty);
  } else {
    bar = '▓'.repeat(filled) + '░'.repeat(empty);
  }
  
  return bar;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⬆️ نظام المستويات
// ═══════════════════════════════════════════════════════════════════════════════

export function levelUp(player) {
  const xpNeeded = xpForLevel(player.level);
  
  if (player.xp >= xpNeeded) {
    player.xp -= xpNeeded;
    player.level++;
    
    // زيادة الإحصائيات
    const classData = CLASSES[player.class];
    player.maxHp += Math.floor(classData.hp * 0.1);
    player.hp = player.maxHp;
    player.atk += Math.floor(classData.atk * 0.05);
    player.def += Math.floor(classData.def * 0.05);
    player.mag += Math.floor(classData.mag * 0.05);
    
    // نقاط القدرة والمهارات
    player.abilityPoints = (player.abilityPoints || 0) + 3;
    player.skillPoints = (player.skillPoints || 0) + 1;
    
    return {
      leveledUp: true,
      newLevel: player.level,
      rewards: {
        maxHp: Math.floor(classData.hp * 0.1),
        atk: Math.floor(classData.atk * 0.05),
        def: Math.floor(classData.def * 0.05),
        mag: Math.floor(classData.mag * 0.05),
        abilityPoints: 3,
        skillPoints: 1
      }
    };
  }
  
  return { leveledUp: false };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ نظام القتال
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

export function getRandomMonster(playerLevel) {
  // اختيار وحش مناسب لمستوى اللاعب
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

export function fightMonster(player) {
  const monster = getRandomMonster(player.level);
  
  // حساب القوة الكلية
  let playerAtk = player.atk;
  let playerDef = player.def;
  
  // إضافة المعدات
  if (player.equippedWeapon) {
    playerAtk += player.equippedWeapon.atk || 0;
  }
  if (player.equippedArmor) {
    playerDef += player.equippedArmor.def || 0;
  }
  
  // تطبيق المهارات السلبية
  const hasLifesteal = player.unlockedSkills?.passive?.includes('lifesteal');
  const hasBerserk = player.unlockedSkills?.passive?.includes('berserk_mode');
  const hasArmorPen = player.unlockedSkills?.passive?.includes('armor_penetration');
  
  // نظام القتال
  let monsterHp = monster.hp;
  let playerHp = player.hp;
  let rounds = 0;
  const maxRounds = 20;
  
  while (monsterHp > 0 && playerHp > 0 && rounds < maxRounds) {
    rounds++;
    
    // ضربة اللاعب
    let damage = Math.max(1, playerAtk - monster.def * (hasArmorPen ? 0.75 : 1));
    
    // Berserk mode
    if (hasBerserk && playerHp < player.maxHp * 0.3) {
      damage *= 1.5;
    }
    
    // ضربة حرجة
    if (Math.random() < (player.critRate || 0.05)) {
      damage *= (player.critDamage || 1.5);
    }
    
    monsterHp -= damage;
    
    // Lifesteal
    if (hasLifesteal && damage > 0) {
      playerHp = Math.min(player.maxHp, playerHp + damage * 0.15);
    }
    
    if (monsterHp <= 0) break;
    
    // ضربة الوحش
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
    
    // تحديث الإحصائيات
    if (!player.stats) player.stats = {};
    player.stats.monstersKilled = (player.stats.monstersKilled || 0) + 1;
    
    // محاولة رفع المستوى
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
          player.boxes[boxDrop] = (player.boxes[boxDrop] || 0) + 1;
          break;
        }
      }
    }
    
    return {
      won: true,
      monster,
      playerHp: player.hp,
      rewards: {
        xp: xpGained,
        gold: goldGained
      },
      levelUp: levelUpResult.leveledUp ? levelUpResult : null,
      boxDrop
    };
  } else {
    player.losses = (player.losses || 0) + 1;
    
    return {
      won: false,
      monster,
      playerHp: player.hp,
      rounds
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🗡️ نظام PvP
// ═══════════════════════════════════════════════════════════════════════════════

export function pvpBattle(player1, player2) {
  let p1Hp = player1.hp;
  let p2Hp = player2.hp;
  
  // حساب القوة
  let p1Atk = player1.atk + (player1.equippedWeapon?.atk || 0);
  let p1Def = player1.def + (player1.equippedArmor?.def || 0);
  let p2Atk = player2.atk + (player2.equippedWeapon?.atk || 0);
  let p2Def = player2.def + (player2.equippedArmor?.def || 0);
  
  const rounds = [];
  let round = 0;
  const maxRounds = 15;
  
  while (p1Hp > 0 && p2Hp > 0 && round < maxRounds) {
    round++;
    
    // اللاعب 1 يهاجم
    const p1Damage = Math.max(1, p1Atk - p2Def * 0.5);
    if (Math.random() < (player1.critRate || 0.05)) {
      p2Hp -= p1Damage * 1.5;
      rounds.push({ attacker: 1, damage: p1Damage * 1.5, crit: true });
    } else {
      p2Hp -= p1Damage;
      rounds.push({ attacker: 1, damage: p1Damage, crit: false });
    }
    
    if (p2Hp <= 0) break;
    
    // اللاعب 2 يهاجم
    const p2Damage = Math.max(1, p2Atk - p1Def * 0.5);
    if (Math.random() < (player2.critRate || 0.05)) {
      p1Hp -= p2Damage * 1.5;
      rounds.push({ attacker: 2, damage: p2Damage * 1.5, crit: true });
    } else {
      p1Hp -= p2Damage;
      rounds.push({ attacker: 2, damage: p2Damage, crit: false });
    }
  }
  
  const p1Won = p2Hp <= 0;
  const winner = p1Won ? player1 : player2;
  const loser = p1Won ? player2 : player1;
  
  // تحديث HP
  player1.hp = Math.max(1, Math.floor(p1Hp));
  player2.hp = Math.max(1, Math.floor(p2Hp));
  
  // المكافآت
  const goldReward = Math.min(loser.gold, Math.floor(50 + winner.level * 10));
  winner.gold = (winner.gold || 0) + goldReward;
  loser.gold = Math.max(0, (loser.gold || 0) - goldReward);
  
  winner.wins = (winner.wins || 0) + 1;
  loser.losses = (loser.losses || 0) + 1;
  
  // XP
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

export function openBox(player, boxType) {
  const box = BOXES[boxType];
  if (!box) return null;
  
  if (!player.boxes || player.boxes[boxType] <= 0) {
    return { error: 'لا تملك هذا الصندوق' };
  }
  
  player.boxes[boxType]--;
  
  // تحديد المكافآت
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
    player.inventory = player.inventory || [];
    player.inventory.push(item);
  }
  
  player.gold = (player.gold || 0) + rewards.gold;
  player.xp = (player.xp || 0) + rewards.xp;
  
  // تحديث الإحصائيات
  if (!player.stats) player.stats = {};
  player.stats.boxesOpened = (player.stats.boxesOpened || 0) + 1;
  
  // محاولة رفع المستوى
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

export function healPlayer(player, target, healerMag) {
  if (target.hp >= target.maxHp) {
    return { error: 'الصحة كاملة' };
  }
  
  const healAmount = Math.min(target.maxHp - target.hp, healerMag * 5);
  target.hp += healAmount;
  
  // مكافأة للشافي
  player.xp = (player.xp || 0) + 20;
  player.gold = (player.gold || 0) + 10;
  
  // تحديث الإحصائيات
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
// 📊 تنسيق الملف الشخصي
// ═══════════════════════════════════════════════════════════════════════════════

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

// تصدير البيانات
export { MONSTERS, FISH, MINERALS, JOBS };
