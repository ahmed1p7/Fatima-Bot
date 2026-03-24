// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 نظام RPG المتطور - فاطمة بوت v11.0
// يتضمن: نظام الطاقة، العلاج، الأصناف، القتال، المهارات
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';
import { calculatePassiveBuffs } from './skills.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 الثوابت الأساسية
// ═══════════════════════════════════════════════════════════════════════════════

export const MAX_STAMINA = 10;
export const STAMINA_REGEN_TIME = 24 * 60 * 60 * 1000; // 24 ساعة
export const CRITICAL_HP_PERCENT = 0.3; // 30% HP يعتبر حرج

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ تعريف الأصناف
// ═══════════════════════════════════════════════════════════════════════════════

export const RPG = {
  classes: {
    'محارب': { 
      hp: 150, atk: 25, def: 20, mag: 5, 
      emoji: '⚔️', 
      skills: ['ضربة قاضية'],
      description: 'مقاتل قوي في الهجوم والدفاع',
      buildingType: 'ثكنات' // مبنى الكلان المرتبط
    },
    'ساحر': { 
      hp: 80, atk: 10, def: 8, mag: 35, 
      emoji: '🧙', 
      skills: ['كرة نار'],
      description: 'سيد السحر والهجمات الخارقة',
      buildingType: 'برج السحر'
    },
    'رامي': { 
      hp: 100, atk: 30, def: 12, mag: 10, 
      emoji: '🏹', 
      skills: ['سهام سامة'],
      description: 'قناص دقيق من مسافة بعيدة',
      buildingType: 'برج المراقبة'
    },
    'شافي': { 
      hp: 90, atk: 8, def: 15, mag: 30, 
      emoji: '💚', 
      skills: ['علاج'],
      description: 'طبيب المجموعة يعالج الجرحى',
      buildingType: 'مشفى',
      isHealer: true // صنف شافي
    },
    'قاتل': { 
      hp: 70, atk: 40, def: 5, mag: 15, 
      emoji: '🗡️', 
      skills: ['اغتيال'],
      description: 'قاتل صامت يضرب ضربات حرجة',
      buildingType: 'برج المراقبة'
    },
    'فارس': { 
      hp: 130, atk: 20, def: 25, mag: 10, 
      emoji: '🛡️', 
      skills: ['صمود'],
      description: 'درع المجموعة يمتص الضربات',
      buildingType: 'ثكنات'
    }
  },

  // الوحوش
  monsters: [
    { name: 'سليمان', hp: 50, atk: 8, def: 2, xp: 20, gold: 10, emoji: '🐛' },
    { name: 'ذئب', hp: 80, atk: 15, def: 5, xp: 40, gold: 25, emoji: '🐺' },
    { name: 'عنكبوت', hp: 60, atk: 20, def: 3, xp: 35, gold: 20, emoji: '🕷️' },
    { name: 'غول', hp: 150, atk: 25, def: 15, xp: 80, gold: 60, emoji: '👹' },
    { name: 'تنين', hp: 200, atk: 35, def: 20, xp: 150, gold: 120, emoji: '🐲' }
  ],

  // الندرة
  rarities: {
    'شائع': { color: '⚪', chance: 70, mult: 1 },
    'نادر': { color: '🔵', chance: 20, mult: 1.5 },
    'ملحمي': { color: '🟣', chance: 8, mult: 2 },
    'أسطوري': { color: '🟡', chance: 2, mult: 3 }
  },

  // الصناديق
  boxes: {
    'خشبي': { price: 100, min: 'شائع', max: 'نادر', emoji: '📦' },
    'حديدي': { price: 300, min: 'نادر', max: 'ملحمي', emoji: '🧰' },
    'ذهبي': { price: 800, min: 'ملحمي', max: 'أسطوري', emoji: '🎁' }
  },

  // السمك
  fish: [
    { name: 'سمكة صغيرة', price: 10, chance: 40, emoji: '🐟' },
    { name: 'سمكة كبيرة', price: 50, chance: 15, emoji: '🐠' },
    { name: 'سمكة ذهبية', price: 200, chance: 5, emoji: '✨' },
    { name: 'حذاء قديم', price: 0, chance: 20, emoji: '🥾' }
  ],

  // المعادن
  minerals: [
    { name: 'حديد', price: 15, chance: 35, emoji: '⚙️' },
    { name: 'ذهب', price: 80, chance: 10, emoji: '🥇' },
    { name: 'ألماس', price: 200, chance: 5, emoji: '💎' }
  ],

  weapons: ['سيف', 'فأس', 'رمح', 'قوس', 'خنجر', 'مطرقة'],
  armors: ['درع جلدي', 'درع سلسلي', 'درع صفيحي', 'درع ملكي']
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🆕 إنشاء لاعب جديد
// ═══════════════════════════════════════════════════════════════════════════════

export const createPlayer = (id, name, cls) => {
  const c = RPG.classes[cls];
  if (!c) return null;
  
  return {
    id,
    name,
    class: cls,
    classData: c, // تخزين بيانات الصنف
    level: 1,
    xp: 0,
    gold: 100,
    
    // الإحصائيات
    hp: c.hp,
    maxHp: c.hp,
    atk: c.atk,
    def: c.def,
    mag: c.mag,
    
    // ⚡ نظام الطاقة (Stamina)
    stamina: MAX_STAMINA,
    maxStamina: MAX_STAMINA,
    lastStaminaRegen: Date.now(),
    
    // المهارات
    skills: [...c.skills],
    abilityPoints: 0,
    skillPoints: 0,
    allocatedStats: { hp: 0, atk: 0, def: 0, mag: 0 },
    unlockedSkills: { passive: [], active: [] },
    
    // المخزون
    inventory: [],
    weapons: [],
    armors: [],
    
    // الإحصائيات
    wins: 0,
    losses: 0,
    created: Date.now(),
    
    // التوقيتات
    lastDaily: 0,
    lastWork: 0,
    lastFish: 0,
    lastMine: 0,
    lastHeal: 0,
    lastPvP: 0,
    lastBossAttack: 0,
    
    // الكلان
    clanId: null,
    totalDonated: 0,
    
    // الإنجازات
    achievements: [],
    stats: {
      monstersKilled: 0,
      fishCaught: 0,
      mineralsMined: 0,
      boxesOpened: 0,
      weaponsUpgraded: 0,
      itemsSold: 0,
      itemsBought: 0,
      bossesDefeated: 0,
      totalBossDamage: 0,
      playersHealed: 0, // عدد اللاعبين الذين عالجهم
      healingDone: 0, // إجمالي العلاج
      villageAttacks: 0,
      villageDefenses: 0
    }
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ نظام الطاقة (Stamina)
// ═══════════════════════════════════════════════════════════════════════════════

export const getStamina = (player) => {
  const now = Date.now();
  const timeSinceLastRegen = now - (player.lastStaminaRegen || 0);
  
  // حساب عدد التجديدات
  const regens = Math.floor(timeSinceLastRegen / STAMINA_REGEN_TIME);
  
  if (regens > 0 && player.stamina < MAX_STAMINA) {
    player.stamina = Math.min(MAX_STAMINA, player.stamina + regens);
    player.lastStaminaRegen = now;
  }
  
  return {
    current: player.stamina,
    max: player.maxStamina || MAX_STAMINA,
    canFight: player.stamina > 0 && player.hp > 0,
    nextRegen: STAMINA_REGEN_TIME - (timeSinceLastRegen % STAMINA_REGEN_TIME)
  };
};

export const useStamina = (player, amount = 1) => {
  if (player.stamina < amount) {
    return { success: false, message: `❌ لا تملك طاقة كافية! لديك ${player.stamina}/${MAX_STAMINA}` };
  }
  
  player.stamina -= amount;
  return { success: true, remaining: player.stamina };
};

export const addStamina = (player, amount) => {
  player.stamina = Math.min(player.maxStamina || MAX_STAMINA, player.stamina + amount);
  return player.stamina;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 💚 نظام العلاج
// ═══════════════════════════════════════════════════════════════════════════════

// التحقق من وجود شافي في المجموعة
export const checkHealerInGroup = (groupId) => {
  const rpgData = getRpgData();
  const players = rpgData.players || {};
  
  for (const player of Object.values(players)) {
    if (player.clanId === groupId && RPG.classes[player.class]?.isHealer) {
      return { hasHealer: true, healer: player };
    }
  }
  
  return { hasHealer: false, healer: null };
};

// علاج لاعب (للشافي)
export const healPlayer = (healer, target) => {
  // التحقق من أن الشافي شافي
  if (!RPG.classes[healer.class]?.isHealer) {
    return { success: false, message: '❌ يجب أن تكون شافي لاستخدام هذا الأمر!' };
  }
  
  // التحقق من أن الهدف يحتاج علاج
  if (target.hp >= target.maxHp) {
    return { success: false, message: '✅ هذا اللاعب بصحة كاملة!' };
  }
  
  // حساب كمية العلاج
  const healAmount = Math.floor(healer.mag * 2 + target.maxHp * 0.3);
  const actualHeal = Math.min(healAmount, target.maxHp - target.hp);
  
  target.hp += actualHeal;
  healer.stats.playersHealed = (healer.stats.playersHealed || 0) + 1;
  healer.stats.healingDone = (healer.stats.healingDone || 0) + actualHeal;
  
  // مكافأة للشافي
  const goldReward = Math.floor(actualHeal * 0.5);
  const xpReward = Math.floor(actualHeal * 0.3);
  healer.gold = (healer.gold || 0) + goldReward;
  healer.xp = (healer.xp || 0) + xpReward;
  
  return {
    success: true,
    healAmount: actualHeal,
    goldReward,
    xpReward,
    message: `💚 تم علاج ${target.name} بـ ${actualHeal} HP!\n💰 ربحت ${goldReward} ذهب و ${xpReward} XP`
  };
};

// علاج ذاتي للشافي
export const selfHeal = (player) => {
  if (!RPG.classes[player.class]?.isHealer) {
    return { success: false, message: '❌ هذا الأمر للشافين فقط!' };
  }
  
  if (player.hp >= player.maxHp) {
    return { success: false, message: '✅ أنت بصحة كاملة!' };
  }
  
  const healAmount = Math.floor(player.mag * 1.5 + player.maxHp * 0.2);
  const actualHeal = Math.min(healAmount, player.maxHp - player.hp);
  player.hp += actualHeal;
  
  return {
    success: true,
    healAmount: actualHeal,
    message: `💚 تم علاج نفسك بـ ${actualHeal} HP!`
  };
};

// علاج تلقائي (بدون شافي - مكلف)
export const autoHeal = (player, groupId) => {
  const { hasHealer } = checkHealerInGroup(groupId);
  
  // تكلفة العلاج
  const baseCost = Math.floor((player.maxHp - player.hp) * 2);
  const cost = hasHealer ? baseCost : Math.floor(baseCost * 3); // 3x بدون شافي
  
  if (player.gold < cost) {
    return { 
      success: false, 
      message: `❌ تحتاج ${cost} ذهب للعلاج!${!hasHealer ? '\n⚠️ التكلفة مضاعفة لعدم وجود شافي في الكلان!' : ''}`
    };
  }
  
  player.gold -= cost;
  player.hp = player.maxHp;
  
  return {
    success: true,
    cost,
    message: `💚 تم علاجك بالكامل!\n💰 التكلفة: ${cost} ذهب${!hasHealer ? '\n⚠️ تكلفتك مضاعفة! طالب بإضافة شافي للكلان!' : ''}`
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ نظام القتال
// ═══════════════════════════════════════════════════════════════════════════════

// صيغة نمو أسي للخبرة
export const xpForLevel = (lv) => Math.floor(100 * Math.pow(lv, 1.8));

// قتال الوحوش
export const fightMonster = (p) => {
  // التحقق من الطاقة
  const staminaResult = useStamina(p);
  if (!staminaResult.success) {
    return staminaResult;
  }
  
  // التحقق من HP
  if (p.hp <= 0) {
    return { success: false, message: '❌ أنت ميت! يجب أن تعالج أولاً!' };
  }
  
  const idx = Math.min(Math.floor(p.level / 5), RPG.monsters.length - 1);
  const m = { ...RPG.monsters[idx] };
  
  // تطبيق بافات المهارات السلبية
  const passiveBuffs = calculatePassiveBuffs({ skills: p.unlockedSkills || { passive: [], active: [] } });
  let playerAtk = p.atk * (1 + (passiveBuffs.atk || 0));
  let playerDef = p.def * (1 + (passiveBuffs.def || 0));
  let playerHp = p.hp;
  
  // فرصة الضربة الحرجة
  const critChance = (passiveBuffs.critChance || 0) + 0.05;
  const critDamage = 1.5 + (passiveBuffs.critDamage || 0);
  
  let log = [], mhp = m.hp;
  
  while (playerHp > 0 && mhp > 0) {
    // هجوم اللاعب
    let pd = Math.max(1, playerAtk - m.def + Math.floor(Math.random() * 10));
    const isCrit = Math.random() < critChance;
    if (isCrit) pd = Math.floor(pd * critDamage);
    mhp -= pd;
    log.push(`⚔️ ${p.name}: ${pd}${isCrit ? ' 🔥' : ''}`);
    
    if (mhp <= 0) break;
    
    // هجوم الوحش
    const md = Math.max(1, m.atk - playerDef + Math.floor(Math.random() * 8));
    playerHp -= md;
    log.push(`${m.emoji} ${m.name}: ${md}`);
  }
  
  if (playerHp > 0) {
    const gold = m.gold + Math.floor(Math.random() * m.gold * 0.5);
    const xp = m.xp + Math.floor(Math.random() * m.xp * 0.3);
    p.hp = Math.max(1, playerHp);
    p.gold = (p.gold || 0) + gold;
    p.xp = (p.xp || 0) + xp;
    p.wins++;
    p.stats.monstersKilled = (p.stats.monstersKilled || 0) + 1;
    
    const levelUpResult = levelUp(p);
    return { 
      won: true, 
      log: log.slice(-6), 
      rewards: { gold, xp }, 
      monster: m,
      stamina: p.stamina,
      levelUp: levelUpResult.leveledUp ? levelUpResult : null
    };
  } else {
    p.hp = Math.floor(p.maxHp * 0.3);
    p.losses++;
    return { won: false, log: log.slice(-6), monster: m, stamina: p.stamina };
  }
};

// رفع المستوى
export const levelUp = (p) => {
  const need = xpForLevel(p.level);
  if (p.xp >= need && p.level < 100) {
    p.level++;
    p.xp -= need;
    
    const c = RPG.classes[p.class];
    
    // زيادة الإحصائيات
    p.maxHp += Math.floor(c.hp * 0.1);
    p.hp = p.maxHp;
    p.atk += Math.floor(c.atk * 0.08);
    p.def += Math.floor(c.def * 0.08);
    p.mag += Math.floor(c.mag * 0.1);
    
    // منح نقاط
    p.abilityPoints = (p.abilityPoints || 0) + 3;
    p.skillPoints = (p.skillPoints || 0) + 1;
    
    const rewards = {
      abilityPoints: 3,
      skillPoints: 1,
      bonusGold: 0
    };
    
    if (p.level % 10 === 0) {
      rewards.bonusGold = p.level * 100;
      p.gold = (p.gold || 0) + rewards.bonusGold;
    }
    
    return { leveledUp: true, newLevel: p.level, rewards };
  }
  return { leveledUp: false };
};

// قتال PvP
export const pvpBattle = (p1, p2) => {
  // التحقق من الطاقة
  if (p1.stamina < 1 || p2.stamina < 1) {
    return { success: false, message: '❌ أحد اللاعبين لا يملك طاقة كافية!' };
  }
  
  if (p1.hp <= 0 || p2.hp <= 0) {
    return { success: false, message: '❌ أحد اللاعبين ميت!' };
  }
  
  p1.stamina--;
  p2.stamina--;
  
  const buffs1 = calculatePassiveBuffs({ skills: p1.unlockedSkills || { passive: [], active: [] } });
  const buffs2 = calculatePassiveBuffs({ skills: p2.unlockedSkills || { passive: [], active: [] } });
  
  let atk1 = p1.atk * (1 + (buffs1.atk || 0));
  let def1 = p1.def * (1 + (buffs1.def || 0));
  let atk2 = p2.atk * (1 + (buffs2.atk || 0));
  let def2 = p2.def * (1 + (buffs2.def || 0));
  
  const crit1 = (buffs1.critChance || 0) + 0.05;
  const crit2 = (buffs2.critChance || 0) + 0.05;
  const critDmg1 = 1.5 + (buffs1.critDamage || 0);
  const critDmg2 = 1.5 + (buffs2.critDamage || 0);
  
  let log = [], h1 = p1.hp, h2 = p2.hp;
  let turn = atk1 >= atk2 ? 1 : 2;
  
  while (h1 > 0 && h2 > 0 && log.length < 20) {
    if (turn === 1) {
      let d = Math.max(1, atk1 - def2 + Math.floor(Math.random() * 15));
      if (Math.random() < crit1) d = Math.floor(d * critDmg1);
      h2 -= d;
      log.push(`⚔️ ${p1.name}: ${d}${Math.random() < crit1 ? ' 🔥' : ''}`);
    } else {
      let d = Math.max(1, atk2 - def1 + Math.floor(Math.random() * 15));
      if (Math.random() < crit2) d = Math.floor(d * critDmg2);
      h1 -= d;
      log.push(`🛡️ ${p2.name}: ${d}${Math.random() < crit2 ? ' 🔥' : ''}`);
    }
    turn = turn === 1 ? 2 : 1;
  }
  
  const winner = h1 > h2 ? p1 : p2;
  const loser = h1 > h2 ? p2 : p1;
  const gold = Math.floor((loser.gold || 0) * 0.1) + 50;
  
  winner.gold = (winner.gold || 0) + gold;
  winner.wins++;
  winner.hp = Math.max(1, h1 > h2 ? h1 : h2);
  
  loser.gold = Math.max(0, (loser.gold || 0) - Math.floor((loser.gold || 0) * 0.05));
  loser.losses++;
  loser.hp = Math.floor(loser.maxHp * 0.5);
  
  const levelUpResult = levelUp(winner);
  
  return { 
    winner, 
    loser, 
    log: log.slice(-8), 
    goldReward: gold,
    levelUp: levelUpResult.leveledUp ? levelUpResult : null
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 نظام الصناديق المتحركة
// ═══════════════════════════════════════════════════════════════════════════════

// توليد سلاح
export const generateWeapon = (box) => {
  const r = getRarity(box.min, box.max);
  const base = RPG.weapons[Math.floor(Math.random() * RPG.weapons.length)];
  const rd = RPG.rarities[r];
  return {
    id: 'W' + Date.now(),
    name: base,
    fullName: `${base} ${rd.color}`,
    rarity: r,
    atk: Math.floor(10 * rd.mult * (0.8 + Math.random() * 0.4)),
    level: 1
  };
};

// توليد درع
export const generateArmor = (box) => {
  const r = getRarity(box.min, box.max);
  const base = RPG.armors[Math.floor(Math.random() * RPG.armors.length)];
  const rd = RPG.rarities[r];
  return {
    id: 'A' + Date.now(),
    name: base,
    fullName: `${base} ${rd.color}`,
    rarity: r,
    def: Math.floor(5 * rd.mult * (0.8 + Math.random() * 0.4)),
    level: 1
  };
};

const getRarity = (min, max) => {
  const rs = Object.keys(RPG.rarities);
  const roll = Math.random() * 100;
  let cum = 0;
  for (let i = rs.indexOf(max); i >= rs.indexOf(min); i--) {
    cum += RPG.rarities[rs[i]].chance;
    if (roll < cum) return rs[i];
  }
  return min;
};

// فتح صندوق مع تأثير حركي
export const openBox = async (player, boxType, sock, jid) => {
  const box = RPG.boxes[boxType];
  if (!box) {
    return { success: false, message: '❌ نوع صندوق غير صحيح!' };
  }
  
  if (player.gold < box.price) {
    return { success: false, message: `❌ تحتاج ${box.price} ذهب!` };
  }
  
  player.gold -= box.price;
  
  // إرسال رسالة التحريك
  const animationFrames = ['📦', '📦.', '📦..', '📦...', '🎁', '✨'];
  let msg = await sock.sendMessage(jid, { text: `${box.emoji} جاري فتح الصندوق...` });
  
  for (let i = 0; i < animationFrames.length; i++) {
    await new Promise(r => setTimeout(r, 300));
    await sock.sendMessage(jid, { 
      text: `${animationFrames[i]} جاري فتح الصندوق...`,
      edit: msg.key 
    });
  }
  
  // توليد المحتويات
  const contents = {};
  const rand = Math.random();
  
  if (rand < 0.4) {
    contents.weapon = generateWeapon(box);
    player.weapons.push(contents.weapon);
  } else if (rand < 0.7) {
    contents.armor = generateArmor(box);
    player.armors.push(contents.armor);
  } else {
    const goldAmount = Math.floor(box.price * (1 + Math.random()));
    const xpAmount = Math.floor(box.price * 0.5);
    contents.gold = goldAmount;
    contents.xp = xpAmount;
    player.gold += goldAmount;
    player.xp += xpAmount;
  }
  
  player.stats.boxesOpened = (player.stats.boxesOpened || 0) + 1;
  
  // تحديث الرسالة النهائية
  let finalText = `${box.emoji} ═══════ صندوق ${boxType} ═══════ ${box.emoji}\n\n`;
  finalText += `📋 المحتويات:\n`;
  
  if (contents.weapon) {
    finalText += `⚔️ ${contents.weapon.fullName}\n`;
    finalText += `   ATK: +${contents.weapon.atk}\n`;
  }
  if (contents.armor) {
    finalText += `🛡️ ${contents.armor.fullName}\n`;
    finalText += `   DEF: +${contents.armor.def}\n`;
  }
  if (contents.gold) {
    finalText += `💰 ${contents.gold} ذهب\n`;
  }
  if (contents.xp) {
    finalText += `⭐ ${contents.xp} XP\n`;
  }
  
  await sock.sendMessage(jid, { text: finalText, edit: msg.key });
  
  return { success: true, contents };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎣 الصيد والتعدين
// ═══════════════════════════════════════════════════════════════════════════════

export const fish = () => {
  const roll = Math.random() * 100;
  let cum = 0;
  for (const f of RPG.fish) { 
    cum += f.chance; 
    if (roll < cum) return f; 
  }
  return RPG.fish[0];
};

export const mine = () => {
  const roll = Math.random() * 100;
  let cum = 0;
  for (const m of RPG.minerals) { 
    cum += m.chance; 
    if (roll < cum) return m; 
  }
  return RPG.minerals[0];
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 أدوات مساعدة
// ═══════════════════════════════════════════════════════════════════════════════

export const healthBar = (cur, max, len = 8) => {
  const pct = cur / max;
  return '▰'.repeat(Math.floor(pct * len)) + '▱'.repeat(len - Math.floor(pct * len));
};

export const upgradeWeapon = (w) => {
  if (Math.random() < 0.95) {
    w.level++; 
    w.atk = Math.floor(w.atk * 1.15);
    return { success: true };
  }
  return { success: false, broken: true };
};

export const getUpgradeCost = (w) => 
  Math.floor(100 * RPG.rarities[w.rarity].mult * Math.pow(1.5, w.level - 1));

export const getSellPrice = (item) => {
  const base = item.rarity === 'أسطوري' ? 1000 : item.rarity === 'ملحمي' ? 400 : item.rarity === 'نادر' ? 150 : 50;
  return Math.floor(base * (1 + (item.level - 1) * 0.3));
};

// التحقق من HP حرج
export const isCriticalHp = (player) => {
  return (player.hp / player.maxHp) <= CRITICAL_HP_PERCENT;
};

// تنسيق ملف اللاعب
export const formatPlayerProfile = (player, prefix = '.') => {
  const hpBar = healthBar(player.hp, player.maxHp);
  const stamina = getStamina(player);
  
  let text = `👤 ═══════ ${player.name} ═══════ 👤\n\n`;
  text += `${RPG.classes[player.class]?.emoji || '⚔️'} الصنف: ${player.class}\n`;
  text += `⭐ المستوى: ${player.level}\n`;
  text += `❤️ HP: [${hpBar}] ${player.hp}/${player.maxHp}\n`;
  text += `⚡ الطاقة: ${stamina.current}/${stamina.max}\n`;
  text += `⚔️ ATK: ${player.atk} | 🛡️ DEF: ${player.def}\n`;
  text += `✨ MAG: ${player.mag}\n`;
  text += `💰 الذهب: ${player.gold?.toLocaleString() || 0}\n`;
  text += `📊 XP: ${player.xp}/${xpForLevel(player.level)}\n\n`;
  
  text += `🏆 الإحصائيات:\n`;
  text += `   الانتصارات: ${player.wins || 0}\n`;
  text += `   الخسائر: ${player.losses || 0}\n`;
  text += `   الوحوش: ${player.stats?.monstersKilled || 0}\n`;
  
  if (player.clanId) {
    text += `\n🏰 الكلان: ${player.clanId}\n`;
  }
  
  // تحذير إذا HP حرج
  if (isCriticalHp(player)) {
    text += `\n⚠️ تحذير: صحتك حرجة! استخدم ${prefix}علاج`;
  }
  
  return text;
};
