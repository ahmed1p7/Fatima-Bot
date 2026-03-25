// ═══════════════════════════════════════════════════════════════════════════════
// 👹 نظام الزعماء الديناميكي - فاطمة بوت v12.0
// مستوحى من Solo Leveling مع نظام التطور والهجمات الجماعية
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';
import { calculatePassiveBuffs } from './skills.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 👹 قائمة الزعماء
// ═══════════════════════════════════════════════════════════════════════════════

export const BOSSES = {
  // ═══════════════════════════════════════════════════════════════════════════
  // الزعماء البريون (هجمات برية)
  // ═══════════════════════════════════════════════════════════════════════════
  kaska: {
    id: 'kaska',
    name: 'كاساكا',
    emoji: '🐍',
    type: 'بري',
    description: 'ثعبان عملاق سام من كهوف الظلام',
    baseHp: 50000,
    baseAtk: 800,
    baseDef: 300,
    level: 50,
    abilities: ['سم قاتل', 'تعرض للعض'],
    drops: ['ناب كاساكا', 'سم الثعبان', 'جلد الأفعى'],
    xpReward: 10000,
    goldReward: 50000
  },
  
  orc_king: {
    id: 'orc_king',
    name: 'ملك الأورك',
    emoji: '👹',
    type: 'بري',
    description: 'زعيم قبيلة الأورك الضخمة',
    baseHp: 80000,
    baseAtk: 1200,
    baseDef: 600,
    level: 65,
    abilities: ['هجوم جماعي', 'تخفيض الهجوم', 'صمود'],
    drops: ['تاج الأورك', 'فأس العملاق', 'درع العظام'],
    xpReward: 20000,
    goldReward: 100000
  },
  
  swamp_king: {
    id: 'swamp_king',
    name: 'ملك المستنقعات',
    emoji: '🐸',
    type: 'بري',
    description: 'وحش ضخم يحمي المستنقعات المهجورة',
    baseHp: 60000,
    baseAtk: 900,
    baseDef: 800,
    level: 55,
    abilities: ['دفاع جسدي هائل', 'هجوم طيني'],
    drops: ['تاج المستنقع', 'سلاح المستنقعات'],
    xpReward: 15000,
    goldReward: 75000
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // الزعماء الطائرون
  // ═══════════════════════════════════════════════════════════════════════════
  ant_king: {
    id: 'ant_king',
    name: 'بيرو - ملك النمل',
    emoji: '🐜',
    type: 'طائر',
    description: 'ملك النمل العملاق سريع الحركة',
    baseHp: 70000,
    baseAtk: 1500,
    baseDef: 400,
    level: 75,
    abilities: ['مراوغة عالية', 'هجوم سريع', 'استدعاء جنود'],
    drops: ['قرن الملك', 'أجنحة النمل', 'سيف النمل الملكي'],
    xpReward: 30000,
    goldReward: 150000
  },
  
  griffon: {
    id: 'griffon',
    name: 'العقاب الأسطوري',
    emoji: '🦅',
    type: 'طائر',
    description: 'عقاب ضخم يهاجم باللهب',
    baseHp: 90000,
    baseAtk: 1800,
    baseDef: 500,
    level: 80,
    abilities: ['هجوم جماعي حارق', 'قصف جوي'],
    drops: ['ريش العقاب', 'مخلب الأسطورة'],
    xpReward: 35000,
    goldReward: 180000
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // الزعماء الأسطوريون
  // ═══════════════════════════════════════════════════════════════════════════
  igrys: {
    id: 'igrys',
    name: 'إيغريس',
    emoji: '⚔️',
    type: 'أسطوري',
    description: 'الفارس الأسطوري الذي يصد 20% من الهجمات',
    baseHp: 150000,
    baseAtk: 2500,
    baseDef: 1200,
    level: 90,
    abilities: ['صد الهجمات 20%', 'ضربة الفارس', 'درع النور'],
    drops: ['سيف إيغريس', 'درع الفارس', 'خوذة الأسطورة'],
    xpReward: 75000,
    goldReward: 500000
  },
  
  antares: {
    id: 'antares',
    name: 'أنتاريس',
    emoji: '🐲',
    type: 'أسطوري',
    description: 'ملك التنانين الأقوى على الإطلاق',
    baseHp: 300000,
    baseAtk: 4000,
    baseDef: 2000,
    level: 100,
    abilities: ['نفس التنين', 'تدمير شامل', 'قشرة التنين'],
    drops: ['قلب التنين', 'مقياس التنين الأسود', 'سيف ملك التنانين'],
    xpReward: 150000,
    goldReward: 1000000
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🆕 إنشاء زعيم نشط
// ═══════════════════════════════════════════════════════════════════════════════

export const spawnBoss = (bossId, groupId, participantCount = 1, avgLevel = 1) => {
  const bossTemplate = BOSSES[bossId];
  if (!bossTemplate) return null;
  
  // حساب إحصائيات الزعيم بناءً على المشاركين
  const scalingFactor = Math.max(1, participantCount * 0.5);
  const levelScaling = Math.max(1, avgLevel / 50);
  
  return {
    id: bossId,
    name: bossTemplate.name,
    emoji: bossTemplate.emoji,
    type: bossTemplate.type,
    description: bossTemplate.description,
    
    // إحصائيات متغيرة
    hp: Math.floor(bossTemplate.baseHp * scalingFactor * levelScaling),
    maxHp: Math.floor(bossTemplate.baseHp * scalingFactor * levelScaling),
    atk: Math.floor(bossTemplate.baseAtk * levelScaling),
    def: Math.floor(bossTemplate.baseDef * levelScaling),
    level: bossTemplate.level,
    
    // القدرات
    abilities: bossTemplate.abilities,
    drops: bossTemplate.drops,
    
    // المكافآت
    xpReward: Math.floor(bossTemplate.xpReward * scalingFactor),
    goldReward: Math.floor(bossTemplate.goldReward * scalingFactor),
    
    // معلومات المعركة
    groupId: groupId,
    participants: [],
    damageDealt: {},
    healingDone: {},
    
    // التوقيت
    spawnedAt: Date.now(),
    registrationEnds: Date.now() + 600000, // 10 دقائق للتسجيل
    battleEnds: Date.now() + 1800000, // 30 دقيقة للمعركة
    phase: 'registration', // registration, battle, ended
    
    // التطور
    evolutionCount: 0
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 التسجيل في معركة الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

export const registerForBoss = (player, boss) => {
  // التحقق من مرحلة التسجيل
  if (boss.phase !== 'registration') {
    return { success: false, message: '❌ انتهت مرحلة التسجيل!' };
  }
  
  if (Date.now() > boss.registrationEnds) {
    boss.phase = 'battle';
    return { success: false, message: '❌ انتهى وقت التسجيل!' };
  }
  
  // التحقق من الطاقة
  if ((player.stamina || 0) < 1) {
    return { success: false, message: '❌ تحتاج نقطة طاقة واحدة للتسجيل!' };
  }
  
  // التحقق من عدم التسجيل المسبق
  if (boss.participants.find(p => p.id === player.id)) {
    return { success: false, message: '❌ أنت مسجل بالفعل!' };
  }
  
  // استهلاك الطاقة
  player.stamina--;
  
  // التسجيل
  boss.participants.push({
    id: player.id,
    name: player.name,
    class: player.class,
    level: player.level,
    hp: player.hp,
    maxHp: player.maxHp,
    atk: player.atk,
    def: player.def,
    mag: player.mag,
    alive: true
  });
  
  boss.damageDealt[player.id] = 0;
  
  return {
    success: true,
    message: `✅ تم تسجيلك في معركة ${boss.name}!\n⚔️ عدد المشاركين: ${boss.participants.length}`
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ الهجوم على الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

export const attackBoss = (player, boss) => {
  // التحقق من مرحلة المعركة
  if (boss.phase === 'registration' && Date.now() > boss.registrationEnds) {
    boss.phase = 'battle';
  }
  
  if (boss.phase !== 'battle' && boss.phase !== 'registration') {
    return { success: false, message: '❌ المعركة غير نشطة!' };
  }
  
  if (boss.hp <= 0) {
    return { success: false, message: '❌ الزعيم مهزوم بالفعل!' };
  }
  
  // البحث عن المشارك
  const participant = boss.participants.find(p => p.id === player.id);
  if (!participant) {
    return { success: false, message: '❌ أنت غير مسجل في هذه المعركة!' };
  }
  
  if (!participant.alive) {
    return { success: false, message: '❌ أنت ميت! انتظر العلاج من شافي.' };
  }
  
  // حساب البافات
  const buffs = calculatePassiveBuffs(player);
  let playerAtk = player.atk * (1 + (buffs.atk || 0));
  
  // تطبيق Armor Penetration
  const armorPen = buffs.armorPen || 0;
  const effectiveDef = boss.def * (1 - armorPen);
  
  // حساب الضرر
  let damage = Math.max(1, playerAtk - effectiveDef + Math.floor(Math.random() * 500));
  
  // الضربة الحرجة
  const critChance = (buffs.critChance || 0) + 0.05;
  const critDamage = 1.5 + (buffs.critDamage || 0);
  const isCrit = Math.random() < critChance;
  
  if (isCrit) {
    damage = Math.floor(damage * critDamage);
  }
  
  // Lifesteal
  const lifesteal = buffs.lifesteal || 0;
  if (lifesteal > 0) {
    const healAmount = Math.floor(damage * lifesteal);
    participant.hp = Math.min(participant.maxHp, participant.hp + healAmount);
  }
  
  // Berserk (ضرر إضافي عند HP منخفض)
  if (buffs.berserk > 0 && participant.hp < participant.maxHp * 0.3) {
    damage = Math.floor(damage * (1 + buffs.berserk));
  }
  
  // تطبيق الضرر للزعيم
  boss.hp -= damage;
  boss.damageDealt[player.id] = (boss.damageDealt[player.id] || 0) + damage;
  
  // هجوم الزعيم المضاد
  let bossDamage = 0;
  if (Math.random() < 0.7) { // 70% فرصة للهجوم المضاد
    bossDamage = Math.max(1, boss.atk - player.def + Math.floor(Math.random() * 300));
    
    // تطبيق الدفاع والصد
    if (buffs.block > 0 && Math.random() < buffs.block) {
      bossDamage = 0;
    }
    
    // Evasion
    if (buffs.evasion > 0 && Math.random() < buffs.evasion) {
      bossDamage = 0;
    }
    
    participant.hp -= bossDamage;
    
    if (participant.hp <= 0) {
      // Time Rewind (إحياء)
      if (buffs.timeRewind > 0 && !participant.usedRewind) {
        participant.hp = Math.floor(participant.maxHp * buffs.timeRewind);
        participant.usedRewind = true;
      } else {
        participant.alive = false;
        participant.hp = 0;
      }
    }
  }
  
  // التحقق من هزيمة الزعيم
  if (boss.hp <= 0) {
    boss.phase = 'ended';
    boss.hp = 0;
    
    return {
      success: true,
      damage,
      isCrit,
      bossDamage,
      defeated: true,
      message: `🏆 تم هزيمة ${boss.name}!\n⚔️ ضررك: ${damage.toLocaleString()}${isCrit ? ' 🔥' : ''}`
    };
  }
  
  return {
    success: true,
    damage,
    isCrit,
    bossDamage,
    remainingHp: boss.hp,
    totalDamage: boss.damageDealt[player.id],
    message: `⚔️ ضررك: ${damage.toLocaleString()}${isCrit ? ' 🔥' : ''}\n👹 HP الزعيم: ${(boss.hp / boss.maxHp * 100).toFixed(1)}%`
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 💚 علاج جماعي (للشافي)
// ═══════════════════════════════════════════════════════════════════════════════

export const healParticipants = (healer, boss, healAmount) => {
  // التحقق من أن اللاعب شافي
  if (healer.class !== 'شافي') {
    return { success: false, message: '❌ هذا الأمر للشافي فقط!' };
  }
  
  // البحث عن المشارك
  const participant = boss.participants.find(p => p.id === healer.id);
  if (!participant || !participant.alive) {
    return { success: false, message: '❌ أنت غير موجود في المعركة أو ميت!' };
  }
  
  // حساب كمية العلاج
  const healPower = Math.floor(healer.mag * 2 + healAmount);
  
  // علاج جميع المشاركين الأحياء
  let healedCount = 0;
  for (const p of boss.participants) {
    if (p.alive && p.hp < p.maxHp) {
      const actualHeal = Math.min(healPower, p.maxHp - p.hp);
      p.hp += actualHeal;
      healedCount++;
      boss.healingDone[healer.id] = (boss.healingDone[healer.id] || 0) + actualHeal;
    }
  }
  
  // مكافأة للشافي
  healer.xp = (healer.xp || 0) + healedCount * 50;
  healer.gold = (healer.gold || 0) + healedCount * 100;
  
  return {
    success: true,
    healPower,
    healedCount,
    message: `💚 تم علاج ${healedCount} مشارك بـ ${healPower} HP!`
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 حساب نتائج المعركة
// ═══════════════════════════════════════════════════════════════════════════════

export const calculateBossResults = (boss) => {
  if (boss.hp > 0) {
    // الزعيم نجا
    return {
      defeated: false,
      message: `👹 ${boss.name} نجا!\n💀 جميع المشاركين فشلوا في هزيمته.`
    };
  }
  
  // حساب MVP
  let mvp = null;
  let maxDamage = 0;
  for (const [playerId, damage] of Object.entries(boss.damageDealt)) {
    if (damage > maxDamage) {
      maxDamage = damage;
      mvp = boss.participants.find(p => p.id === playerId);
    }
  }
  
  // حساب أفضل شافي
  let topHealer = null;
  let maxHealing = 0;
  for (const [playerId, healing] of Object.entries(boss.healingDone || {})) {
    if (healing > maxHealing) {
      maxHealing = healing;
      topHealer = boss.participants.find(p => p.id === playerId);
    }
  }
  
  // توزيع الجوائز
  const survivors = boss.participants.filter(p => p.alive);
  const survivorCount = survivors.length;
  
  return {
    defeated: true,
    mvp,
    topHealer,
    survivors: survivorCount,
    totalParticipants: boss.participants.length,
    
    rewards: {
      xp: Math.floor(boss.xpReward / Math.max(1, survivorCount)),
      gold: Math.floor(boss.goldReward / Math.max(1, survivorCount))
    },
    
    mvpBonus: {
      dropChance: 0.30, // 30% فرصة لسلاح فريد
      extraGold: Math.floor(boss.goldReward * 0.2)
    },
    
    message: `🏆 تم هزيمة ${boss.name}!\n\n🥇 MVP: ${mvp?.name || 'لا أحد'} (${maxDamage.toLocaleString()} ضرر)\n💚 أفضل شافي: ${topHealer?.name || 'لا أحد'} (${maxHealing.toLocaleString()} علاج)\n\n👥 الناجين: ${survivorCount}/${boss.participants.length}`
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 تطور الزعيم (عند الهزيمة)
// ═══════════════════════════════════════════════════════════════════════════════

export const evolveBoss = (boss) => {
  boss.evolutionCount = (boss.evolutionCount || 0) + 1;
  
  // زيادة 15% HP و 10% ضرر
  boss.maxHp = Math.floor(boss.maxHp * 1.15);
  boss.hp = boss.maxHp;
  boss.atk = Math.floor(boss.atk * 1.10);
  boss.def = Math.floor(boss.def * 1.05);
  
  return {
    evolutionCount: boss.evolutionCount,
    message: `🔄 ${boss.name} تطور!\n📊 المستوى الجديد: +${boss.evolutionCount}`
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 عرض حالة الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

export const formatBossStatus = (boss) => {
  const hpPercent = (boss.hp / boss.maxHp * 100).toFixed(1);
  const hpBar = '▓'.repeat(Math.floor(hpPercent / 10)) + '░'.repeat(10 - Math.floor(hpPercent / 10));
  
  const remainingTime = Math.max(0, boss.battleEnds - Date.now());
  const mins = Math.floor(remainingTime / 60000);
  const secs = Math.floor((remainingTime % 60000) / 1000);
  
  let text = `👹 ═══════ ${boss.name} ═══════ 👹\n\n`;
  text += `${boss.emoji} النوع: ${boss.type}\n`;
  text += `⭐ المستوى: ${boss.level}\n\n`;
  
  text += `❤️ HP: [${hpBar}] ${hpPercent}%\n`;
  text += `   ${boss.hp.toLocaleString()} / ${boss.maxHp.toLocaleString()}\n\n`;
  
  text += `⚔️ ATK: ${boss.atk.toLocaleString()}\n`;
  text += `🛡️ DEF: ${boss.def.toLocaleString()}\n\n`;
  
  text += `👥 المشاركين: ${boss.participants.length}\n`;
  text += `💚 الأحياء: ${boss.participants.filter(p => p.alive).length}\n\n`;
  
  text += `⏰ الوقت المتبقي: ${mins}:${secs.toString().padStart(2, '0')}`;
  
  if (boss.evolutionCount > 0) {
    text += `\n\n🔄 التطورات: ${boss.evolutionCount}`;
  }
  
  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 قائمة الزعماء
// ═══════════════════════════════════════════════════════════════════════════════

export const formatBossList = () => {
  let text = `👹 ═══════ قائمة الزعماء ═══════ 👹\n\n`;
  
  text += `🌿 الزعماء البريون:\n`;
  text += `   🐍 كاساكا (Lv.50)\n`;
  text += `   👹 ملك الأورك (Lv.65)\n`;
  text += `   🐸 ملك المستنقعات (Lv.55)\n\n`;
  
  text += `🦅 الزعماء الطائرون:\n`;
  text += `   🐜 بيرو - ملك النمل (Lv.75)\n`;
  text += `   🦅 العقاب الأسطوري (Lv.80)\n\n`;
  
  text += `⭐ الزعماء الأسطوريون:\n`;
  text += `   ⚔️ إيغريس (Lv.90)\n`;
  text += `   🐲 أنتاريس (Lv.100)\n\n`;
  
  text += `💡 يظهرون عشوائياً كل 6-12 ساعة`;
  
  return text;
};

export default {
  BOSSES,
  spawnBoss,
  registerForBoss,
  attackBoss,
  healParticipants,
  calculateBossResults,
  evolveBoss,
  formatBossStatus,
  formatBossList
};
