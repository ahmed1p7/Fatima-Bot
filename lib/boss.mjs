// ═══════════════════════════════════════════════════════════════════════════════
// 👹 نظام الزعماء - فاطمة بوت (Solo Leveling Style) - معدل
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';
import { sendBossImage } from './utils/image.mjs';
import { hasSkill } from './skills.mjs'; // للتحقق من مهارات الشافي

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 قائمة الزعماء الأساسية
// ═══════════════════════════════════════════════════════════════════════════════

const BOSSES = [
  {
    id: 'kazaka',
    name: 'كاساكا',
    emoji: '🐍',
    type: 'هجمات برية',
    description: 'ثعبان سام يهاجم بالسم',
    baseHp: 5000,
    atk: 300,
    def: 150,
    rewards: { gold: 1000, xp: 500, items: ['سم الثعبان', 'جلد الأفعى'] },
    strategy: 'استخدم اختراق الدروع وعلاج مستمر من التسمم'
  },
  {
    id: 'swamp_king',
    name: 'ملك المستنقعات',
    emoji: '🐊',
    type: 'هجمات برية',
    description: 'وحش المستنقعات الضخم',
    baseHp: 8000,
    atk: 400,
    def: 300,
    rewards: { gold: 2000, xp: 800, items: ['جلد التمساح', 'سيف المستنقعات'] },
    strategy: 'استخدم الهجمات السحرية لاختراق دفاعه الجسدي'
  },
  {
    id: 'orc_leader',
    name: 'زعيم الأورك',
    emoji: '👹',
    type: 'هجمات برية',
    description: 'قائد قبيلة الأورك',
    baseHp: 6000,
    atk: 350,
    def: 200,
    rewards: { gold: 1500, xp: 600, items: ['فأس الأورك', 'خوذة الحرب'] },
    strategy: 'استخدم السحرة والشافيين لتعزيز الهجوم'
  },
  {
    id: 'beru',
    name: 'بيرو',
    emoji: '🐜',
    type: 'طائر',
    description: 'ملك النمل الطائر',
    baseHp: 7000,
    atk: 450,
    def: 180,
    rewards: { gold: 2500, xp: 1000, items: ['أجنحة النمل', 'قوس ملك النمل'] },
    strategy: 'ضرورة وجود رماة وسحرة للإصابة في الهواء'
  },
  {
    id: 'igrit',
    name: 'إيغريس',
    emoji: '⚔️',
    type: 'أسطوري',
    description: 'الفارس الأسطوري',
    baseHp: 15000,
    atk: 600,
    def: 400,
    rewards: { gold: 5000, xp: 2000, items: ['سيف إيغريس', 'درع الفارس'] },
    strategy: 'استخدم مهارات الاختراق والهجمات المتكررة'
  },
  {
    id: 'antares',
    name: 'أنتاريس',
    emoji: '🐉',
    type: 'أسطوري',
    description: 'ملك التنانين',
    baseHp: 30000,
    atk: 1000,
    def: 800,
    rewards: { gold: 15000, xp: 5000, items: ['سيف التنين', 'درع التنين', 'بيضة تنين'] },
    strategy: 'تنسيق كامل ووجود 3 شافيين على الأقل'
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 دوال مساعدة داخلية
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * حساب الضرر مع مراعاة مهارات اللاعب والمعدات
 */
function calculateDamage(player, bossDef) {
  let damage = player.atk || 10;
  if (player.equippedWeapon) damage += player.equippedWeapon.atk || 0;
  
  // تأثير الصنف
  if (player.class === 'ساحر') damage += (player.mag || 0) * 0.5;
  if (player.class === 'قاتل') damage *= 1.2; // زيادة الضرر النقدي
  
  // اختراق الدروع (مهارة)
  let armorPen = 0;
  if (hasSkill(player, 'armor_penetration')) armorPen = 0.25;
  const effectiveDef = bossDef * (1 - armorPen);
  damage = Math.max(1, damage - effectiveDef * 0.5);
  
  // Berserk mode (مهارة)
  if (hasSkill(player, 'berserk_mode') && player.hp < player.maxHp * 0.3) {
    damage *= 1.5;
  }
  
  // ضربة حرجة
  let crit = false;
  let critRate = (player.critRate || 0.05);
  if (hasSkill(player, 'eagle_eye')) critRate += 0.1;
  if (Math.random() < critRate) {
    damage *= (player.critDamage || 1.5);
    crit = true;
  }
  
  // المهارات النشطة (يمكن إضافتها لاحقاً)
  // if (activeSkill) { ... }
  
  return { damage: Math.floor(damage), critical: crit };
}

/**
 * حساب ضرر الزعيم على اللاعب
 */
function calculateBossDamage(boss, player) {
  let damage = boss.atk;
  if (player.equippedArmor) damage -= player.equippedArmor.def || 0;
  if (hasSkill(player, 'mana_shield')) damage *= 0.85;
  if (hasSkill(player, 'shield_mastery')) damage *= 0.75;
  damage = Math.max(1, Math.floor(damage));
  return damage;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 الحصول على الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

export function getBoss(bossId) {
  return BOSSES.find(b => b.id === bossId || b.name === bossId);
}

export function getAllBosses() {
  return BOSSES;
}

/**
 * الحصول على الزعيم النشط في مجموعة معينة
 */
export function getActiveBoss(groupId = null) {
  const data = getRpgData();
  if (!data.activeBoss) return null;
  if (groupId && data.activeBoss.group !== groupId) return null;
  return data.activeBoss;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎲 استدعاء زعيم عشوائي
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * استدعاء زعيم جديد للمجموعة (يمكن استدعاؤه يدوياً أو تلقائياً)
 * @param {string} groupId - معرف المجموعة
 * @param {Array} participants - قائمة المشاركين المحتملين (اختياري)
 * @returns {Object} نتيجة الاستدعاء
 */
export const spawnRandomBoss = (groupId, participants = []) => {
  const data = getRpgData();
  
  // لا نستدعي زعيماً إذا كان هناك زعيم نشط في نفس المجموعة
  if (data.activeBoss && data.activeBoss.group === groupId) {
    return { success: false, message: '❌ هناك زعيم نشط بالفعل في هذه المجموعة!' };
  }
  
  // اختيار زعيم عشوائي
  const boss = BOSSES[Math.floor(Math.random() * BOSSES.length)];
  
  // حساب المستوى المتوسط للمشاركين لتعديل الصعوبة
  let totalLevel = 0;
  for (const p of participants) {
    totalLevel += p.level || 1;
  }
  const avgLevel = participants.length > 0 ? Math.floor(totalLevel / participants.length) : 10;
  
  // إنشاء instance للزعيم
  const bossInstance = {
    instanceId: `boss_${Date.now()}`,
    id: boss.id,
    name: boss.name,
    emoji: boss.emoji,
    type: boss.type,
    description: boss.description,
    
    // إحصائيات مُقاسة
    baseHp: Math.floor(boss.baseHp * (1 + avgLevel * 0.05)),
    currentHp: Math.floor(boss.baseHp * (1 + avgLevel * 0.05)),
    atk: Math.floor(boss.atk * (1 + avgLevel * 0.03)),
    def: Math.floor(boss.def * (1 + avgLevel * 0.02)),
    level: avgLevel,
    
    // الحالة
    status: 'registration', // registration, active, defeated
    group: groupId,
    
    // المشاركة
    registeredPlayers: [],
    playerDamage: {},
    
    // التوقيت
    spawnedAt: Date.now(),
    registrationEnds: Date.now() + 5 * 60 * 1000, // 5 دقائق للتسجيل
    battleEnds: null,
    
    // المكافآت (مُعدلة حسب المستوى)
    rewards: {
      gold: Math.floor(boss.rewards.gold * (1 + avgLevel * 0.1)),
      xp: Math.floor(boss.rewards.xp * (1 + avgLevel * 0.1)),
      items: [...boss.rewards.items]
    },
    
    // إحصائيات إضافية
    totalDamageDealt: 0,
    lastAttackTime: Date.now()
  };
  
  // تخزين الزعيم في قاعدة البيانات
  data.activeBoss = bossInstance;
  saveDatabase();
  
  return {
    success: true,
    boss: bossInstance,
    message: `${boss.emoji} ظهر الزعيم ${boss.name} (مستوى ${avgLevel})!\n⏰ فترة التسجيل: 5 دقائق`
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 التسجيل في معركة الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

export function registerForBoss(player) {
  const data = getRpgData();
  
  if (!data.activeBoss || data.activeBoss.status !== 'registration') {
    return { success: false, message: '❌ لا يوجد زعيم متاح للتسجيل حالياً' };
  }
  
  // التحقق من الطاقة
  if ((player.stamina || 0) < 1) {
    return { success: false, message: '❌ تحتاج نقطة طاقة واحدة على الأقل' };
  }
  
  // التحقق من عدم التسجيل المسبق
  if (data.activeBoss.registeredPlayers?.includes(player.id)) {
    return { success: false, message: '❌ أنت مسجل بالفعل!' };
  }
  
  // الحد الأقصى للمشاركين (50)
  if ((data.activeBoss.registeredPlayers?.length || 0) >= 50) {
    return { success: false, message: '❌ اكتمل العدد الأقصى للمشاركين (50)' };
  }
  
  // خصم الطاقة
  player.stamina--;
  player.lastStaminaUpdate = Date.now();
  
  // التسجيل
  if (!data.activeBoss.registeredPlayers) data.activeBoss.registeredPlayers = [];
  data.activeBoss.registeredPlayers.push(player.id);
  
  if (!data.activeBoss.playerDamage) data.activeBoss.playerDamage = {};
  data.activeBoss.playerDamage[player.id] = 0;
  
  saveDatabase();
  
  return {
    success: true,
    message: `✅ تم تسجيلك في معركة ${data.activeBoss.emoji} ${data.activeBoss.name}!\n⏰ انتظر بدء المعركة`,
    boss: data.activeBoss
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ الهجوم على الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

export function attackBoss(player, skillId = null) {
  const data = getRpgData();
  
  if (!data.activeBoss || data.activeBoss.status !== 'active') {
    return { success: false, message: '❌ لا توجد معركة زعيم نشطة' };
  }
  
  // التحقق من التسجيل
  if (!data.activeBoss.registeredPlayers?.includes(player.id)) {
    return { success: false, message: '❌ غير مسجل في هذه المعركة!' };
  }
  
  // التحقق من HP
  if (player.hp <= 0) {
    return { success: false, message: '💀 لقد مت! لا يمكنك القتال' };
  }
  
  // التحقق من التهدئة (5 ثوانٍ بين الهجمات)
  const now = Date.now();
  const lastAttack = player.lastBossAttack || 0;
  if (now - lastAttack < 5000) {
    const remaining = Math.ceil((5000 - (now - lastAttack)) / 1000);
    return { success: false, message: `⏰ انتظر ${remaining} ثوانٍ قبل الهجوم مجدداً.` };
  }
  player.lastBossAttack = now;
  
  // حساب الضرر الذي يسببه اللاعب
  const { damage, critical } = calculateDamage(player, data.activeBoss.def);
  
  // ضرر الزعيم على اللاعب
  const bossDamage = calculateBossDamage(data.activeBoss, player);
  
  // تطبيق الضرر
  player.hp = Math.max(0, player.hp - bossDamage);
  data.activeBoss.currentHp = Math.max(0, data.activeBoss.currentHp - damage);
  data.activeBoss.playerDamage[player.id] = (data.activeBoss.playerDamage[player.id] || 0) + damage;
  data.activeBoss.totalDamageDealt = (data.activeBoss.totalDamageDealt || 0) + damage;
  data.activeBoss.lastAttackTime = now;
  
  // تحديث الإحصائيات
  if (!player.stats) player.stats = {};
  player.stats.totalBossDamage = (player.stats.totalBossDamage || 0) + damage;
  
  saveDatabase();
  
  // التحقق من هزيمة الزعيم
  if (data.activeBoss.currentHp <= 0) {
    return handleBossDefeat(data.activeBoss);
  }
  
  return {
    success: true,
    damage,
    bossDamage,
    playerHp: player.hp,
    bossHp: data.activeBoss.currentHp,
    bossMaxHp: data.activeBoss.baseHp,
    critical
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 هزيمة الزعيم (داخلية)
// ═══════════════════════════════════════════════════════════════════════════════

function handleBossDefeat(boss) {
  const data = getRpgData();
  
  boss.status = 'defeated';
  
  // تحديد MVP
  let mvpId = null;
  let maxDamage = 0;
  for (const [playerId, damage] of Object.entries(boss.playerDamage || {})) {
    if (damage > maxDamage) {
      maxDamage = damage;
      mvpId = playerId;
    }
  }
  
  // توزيع الجوائز
  const participants = boss.registeredPlayers || [];
  const results = {
    boss,
    mvp: null,
    participants: [],
    totalDamage: boss.playerDamage
  };
  
  for (const playerId of participants) {
    const player = data.players[playerId];
    if (!player) continue;
    
    // المكافآت الأساسية (حتى لو مات اللاعب)
    const damageShare = boss.playerDamage[playerId] || 0;
    const participationBonus = 1; // عامل أساسي
    let goldReward = Math.floor(boss.rewards.gold * (damageShare / (boss.totalDamageDealt || 1)) * 0.7 + 50);
    let xpReward = Math.floor(boss.rewards.xp * (damageShare / (boss.totalDamageDealt || 1)) * 0.7 + 30);
    
    // الحد الأدنى للمكافآت
    goldReward = Math.max(50, Math.min(goldReward, boss.rewards.gold));
    xpReward = Math.max(30, Math.min(xpReward, boss.rewards.xp));
    
    player.gold = (player.gold || 0) + goldReward;
    player.xp = (player.xp || 0) + xpReward;
    
    // MVP يحصل على صندوق ملحمي
    if (playerId === mvpId) {
      player.boxes = player.boxes || { common: 0, rare: 0, epic: 0, legendary: 0 };
      player.boxes.epic++;
      results.mvp = {
        id: playerId,
        name: player.name,
        damage: maxDamage
      };
      
      if (!player.stats) player.stats = {};
      player.stats.bossesDefeated = (player.stats.bossesDefeated || 0) + 1;
    }
    
    results.participants.push({
      id: playerId,
      name: player.name,
      gold: goldReward,
      xp: xpReward,
      damage: damageShare
    });
  }
  
  // تحديث إحصائيات الزعيم (للمرة القادمة)
  const bossStats = data.bossStats || {};
  bossStats[boss.id] = bossStats[boss.id] || { defeats: 0, evolutionLevel: 1 };
  bossStats[boss.id].defeats++;
  bossStats[boss.id].evolutionLevel = Math.min(10, bossStats[boss.id].evolutionLevel + 1);
  data.bossStats = bossStats;
  
  // مسح الزعيم النشط
  data.activeBoss = null;
  saveDatabase();
  
  return {
    success: true,
    defeated: true,
    results
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💚 العلاج الجماعي (للشافي) - مدمج مع مهارة الشافي
// ═══════════════════════════════════════════════════════════════════════════════

export function groupHeal(healer) {
  const data = getRpgData();
  
  if (!data.activeBoss || data.activeBoss.status !== 'active') {
    return { success: false, message: '❌ لا توجد معركة زعيم نشطة' };
  }
  
  if (healer.class !== 'شافي') {
    return { success: false, message: '❌ فقط الشافي يمكنه استخدام العلاج الجماعي!' };
  }
  
  // التحقق من فتح مهارة العلاج الجماعي
  if (!hasSkill(healer, 'group_heal')) {
    return { success: false, message: '❌ تحتاج إلى فتح مهارة "علاج جماعي" أولاً!' };
  }
  
  // التحقق من التهدئة (5 دقائق)
  const now = Date.now();
  if (healer.lastGroupHeal && (now - healer.lastGroupHeal) < 5 * 60 * 1000) {
    const remaining = Math.ceil((5 * 60 * 1000 - (now - healer.lastGroupHeal)) / 60000);
    return { success: false, message: `⏰ انتظر ${remaining} دقيقة` };
  }
  
  // التحقق من التسجيل
  if (!data.activeBoss.registeredPlayers?.includes(healer.id)) {
    return { success: false, message: '❌ غير مسجل في هذه المعركة!' };
  }
  
  // علاج جميع المشاركين (باستثناء الموتى)
  const healAmount = healer.mag * 5;
  let healedCount = 0;
  
  for (const playerId of data.activeBoss.registeredPlayers) {
    const player = data.players[playerId];
    if (player && player.hp > 0 && player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + healAmount);
      healedCount++;
    }
  }
  
  healer.lastGroupHeal = now;
  
  // مكافأة للشافي
  healer.xp = (healer.xp || 0) + healedCount * 30;
  healer.gold = (healer.gold || 0) + healedCount * 20;
  
  if (!healer.stats) healer.stats = {};
  healer.stats.groupHeals = (healer.stats.groupHeals || 0) + 1;
  
  saveDatabase();
  
  return {
    success: true,
    message: `💚 تم علاج ${healedCount} لاعب!\n🩺 كل لاعب حصل على ${healAmount} HP`,
    healAmount,
    healedCount
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 حالة الزعيم (معلومات للمستخدم)
// ═══════════════════════════════════════════════════════════════════════════════

export function getBossStatus() {
  const data = getRpgData();
  if (!data.activeBoss) return null;
  
  return {
    ...data.activeBoss,
    participantsCount: data.activeBoss.registeredPlayers?.length || 0,
    hpPercent: (data.activeBoss.currentHp / data.activeBoss.baseHp) * 100
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🕒 تحديث تلقائي لحالة الزعيم (لتغيير الحالة من registration إلى active)
// ═══════════════════════════════════════════════════════════════════════════════

export function updateBossState() {
  const data = getRpgData();
  if (!data.activeBoss) return false;
  
  const now = Date.now();
  let changed = false;
  
  // من registration إلى active
  if (data.activeBoss.status === 'registration' && now >= data.activeBoss.registrationEnds) {
    data.activeBoss.status = 'active';
    data.activeBoss.battleEnds = now + 30 * 60 * 1000; // 30 دقيقة قتال
    changed = true;
  }
  
  // من active إلى منتهي (إذا انتهى الوقت)
  if (data.activeBoss.status === 'active' && now >= data.activeBoss.battleEnds) {
    // الزعيم يهرب إذا لم يُهزم
    data.activeBoss.status = 'defeated';
    data.activeBoss = null;
    changed = true;
  }
  
  if (changed) saveDatabase();
  return changed;
}

// تصدير BOSSES للاستخدام الخارجي
export { BOSSES };
