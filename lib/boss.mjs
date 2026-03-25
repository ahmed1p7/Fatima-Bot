// ═══════════════════════════════════════════════════════════════════════════════
// 👹 نظام الزعماء - فاطمة بوت (Solo Leveling Style)
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';
import { sendBossImage } from './utils/image.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 تخزين الزعماء النشطين ومكافآت اللاعبين
// ═══════════════════════════════════════════════════════════════════════════════

const activeBosses = new Map();
const playerRewards = new Map();

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 قائمة الزعماء
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
// 📊 إحصائيات الزعماء
// ═══════════════════════════════════════════════════════════════════════════════

const bossStats = {};

// ═══════════════════════════════════════════════════════════════════════════════
// 👹 الحصول على زعيم
// ═══════════════════════════════════════════════════════════════════════════════

export function getBoss(bossId) {
  return BOSSES.find(b => b.id === bossId || b.name === bossId);
}

export function getAllBosses() {
  return BOSSES;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 الحصول على الزعيم النشط
// ═══════════════════════════════════════════════════════════════════════════════

export function getActiveBoss(groupId = null) {
  const data = getRpgData();
  
  if (!data.activeBoss) return null;
  
  if (groupId && data.activeBoss.group !== groupId) return null;
  
  return data.activeBoss;
}

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
  
  // خصم الطاقة
  player.stamina--;
  player.lastStaminaUpdate = Date.now();
  
  // التسجيل
  if (!data.activeBoss.registeredPlayers) {
    data.activeBoss.registeredPlayers = [];
  }
  data.activeBoss.registeredPlayers.push(player.id);
  
  if (!data.activeBoss.playerDamage) {
    data.activeBoss.playerDamage = {};
  }
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
  
  // حساب الضرر
  let damage = player.atk;
  
  // إضافة تأثير المعدات
  if (player.equippedWeapon) {
    damage += player.equippedWeapon.atk || 0;
  }
  
  // تأثير السحر للسحرة
  if (player.class === 'ساحر') {
    damage += player.mag * 0.5;
  }
  
  // ضربة حرجة
  if (Math.random() < (player.critRate || 0.05)) {
    damage *= 1.5;
  }
  
  // تطبيق ضرر الزعيم على اللاعب
  const bossDamage = Math.max(1, data.activeBoss.atk - player.def);
  player.hp = Math.max(0, player.hp - bossDamage);
  
  // تطبيق الضرر على الزعيم
  data.activeBoss.currentHp = Math.max(0, data.activeBoss.currentHp - damage);
  data.activeBoss.playerDamage[player.id] = (data.activeBoss.playerDamage[player.id] || 0) + damage;
  
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
    critical: damage > player.atk * 1.2
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 هزيمة الزعيم
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
    if (!player || player.hp <= 0) continue;
    
    // المكافآت الأساسية
    const goldReward = boss.rewards.gold + Math.floor(Math.random() * boss.rewards.gold * 0.5);
    const xpReward = boss.rewards.xp + Math.floor(Math.random() * boss.rewards.xp * 0.3);
    
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
      damage: boss.playerDamage[playerId] || 0
    });
  }
  
  // زيادة مستوى الزعيم للمرة القادمة
  if (!bossStats[boss.id]) {
    bossStats[boss.id] = { defeats: 0, evolutionLevel: 1 };
  }
  bossStats[boss.id].defeats++;
  bossStats[boss.id].evolutionLevel++;
  
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
// 💚 العلاج الجماعي (للشافي)
// ═══════════════════════════════════════════════════════════════════════════════

export function groupHeal(healer) {
  const data = getRpgData();
  
  if (!data.activeBoss || data.activeBoss.status !== 'active') {
    return { success: false, message: '❌ لا توجد معركة زعيم نشطة' };
  }
  
  if (healer.class !== 'شافي') {
    return { success: false, message: '❌ فقط الشافي يمكنه استخدام العلاج الجماعي!' };
  }
  
  // التحقق من التهدئة (5 دقائق)
  const now = Date.now();
  if (healer.lastHealAll && (now - healer.lastHealAll) < 5 * 60 * 1000) {
    const remaining = Math.ceil((5 * 60 * 1000 - (now - healer.lastHealAll)) / 60000);
    return { success: false, message: `⏰ انتظر ${remaining} دقيقة` };
  }
  
  // التحقق من التسجيل
  if (!data.activeBoss.registeredPlayers?.includes(healer.id)) {
    return { success: false, message: '❌ غير مسجل في هذه المعركة!' };
  }
  
  // علاج جميع المشاركين
  const healAmount = healer.mag * 5;
  let healedCount = 0;
  
  for (const playerId of data.activeBoss.registeredPlayers) {
    const player = data.players[playerId];
    if (player && player.hp > 0 && player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + healAmount);
      healedCount++;
    }
  }
  
  healer.lastHealAll = now;
  
  // مكافأة للشافي
  healer.xp = (healer.xp || 0) + healedCount * 30;
  healer.gold = (healer.gold || 0) + healedCount * 20;
  
  if (!healer.stats) healer.stats = {};
  healer.stats.groupHeals = (healer.stats.groupHeals || 0) + 1;
  
  saveDatabase();
  
  return {
    success: true,
    message: `💚 تم علاج ${healedCount} لاعب!`,
    healAmount,
    healedCount
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 حالة الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

export function getBossStatus() {
  const data = getRpgData();
  
  if (!data.activeBoss) {
    return null;
  }
  
  return {
    ...data.activeBoss,
    participantsCount: data.activeBoss.registeredPlayers?.length || 0,
    hpPercent: (data.activeBoss.currentHp / data.activeBoss.baseHp) * 100
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎲 استدعاء زعيم عشوائي
// ═══════════════════════════════════════════════════════════════════════════════

export const spawnRandomBoss = (groupId, participants = []) => {
  const data = getRpgData();
  
  // اختيار زعيم عشوائي
  const boss = BOSSES[Math.floor(Math.random() * BOSSES.length)];
  
  // حساب المستوى بناءً على المشاركين
  let totalLevel = 0;
  for (const p of participants) {
    totalLevel += p.level || 1;
  }
  const avgLevel = participants.length > 0 ? Math.floor(totalLevel / participants.length) : 10;
  
  // إنشاء instance للزعيم
  const instanceId = `boss_${Date.now()}`;
  const bossInstance = {
    instanceId,
    id: boss.id,
    name: boss.name,
    emoji: boss.emoji,
    type: boss.type,
    
    // إحصائيات مُقاسة
    baseHp: Math.floor(boss.baseHp * (1 + avgLevel * 0.05)),
    currentHp: Math.floor(boss.baseHp * (1 + avgLevel * 0.05)),
    atk: Math.floor(boss.atk * (1 + avgLevel * 0.03)),
    def: Math.floor(boss.def * (1 + avgLevel * 0.02)),
    level: avgLevel,
    
    // الحالة
    status: 'registration',
    group: groupId,
    
    // المشاركة
    registeredPlayers: [],
    playerDamage: {},
    
    // التوقيت
    spawnedAt: Date.now(),
    registrationEnds: Date.now() + 5 * 60 * 1000, // 5 دقائق للتسجيل
    battleEnds: null,
    
    // المكافآت
    rewards: {
      gold: boss.rewards.gold * (1 + avgLevel * 0.1),
      xp: boss.rewards.xp * (1 + avgLevel * 0.1),
      items: boss.rewards.items
    }
  };
  
  // تخزين الزعيم النشط
  activeBosses.set(instanceId, bossInstance);
  data.activeBoss = bossInstance;
  
  return {
    success: true,
    boss: bossInstance,
    message: `${boss.emoji} ظهر ${boss.name}!`
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📢 تنسيق إعلان الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

export const formatBossAnnouncement = async (boss, sock = null, jid = null) => {
  let text = `@
━─━••❁⊰｢❀｣⊱❁••━─━

${boss.emoji} • • ✤ زعيم ظهر! ✤ • • ${boss.emoji}

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ 👹 الاسم: ${boss.name}
│ 📊 المستوى: ${boss.level}
│ ❤️ HP: ${boss.baseHp.toLocaleString()}
│ ⚔️ ATK: ${boss.atk} | 🛡️ DEF: ${boss.def}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

🎁 المكافآت:
│ 💰 ${Math.floor(boss.rewards.gold).toLocaleString()} ذهب
│ ⭐ ${Math.floor(boss.rewards.xp).toLocaleString()} XP
│ 📦 عناصر نادرة

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

⏰ التسجيل: 5 دقائق
💡 .مشاركة للتسجيل

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`;

  // إرسال الصورة إذا توفر الاتصال
  if (sock && jid) {
    await sendBossImage(sock, jid, boss.name, text);
    return ''; // النص أُرسل مع الصورة
  }
  
  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 تنسيق حالة الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

export const formatBossStatus = (boss) => {
  const hpPercent = Math.floor((boss.currentHp / boss.baseHp) * 100);
  const hpBar = '▓'.repeat(Math.floor(hpPercent / 10)) + '░'.repeat(10 - Math.floor(hpPercent / 10));
  
  let text = `${boss.emoji} ═══════ ${boss.name} ═══════ ${boss.emoji}\n\n`;
  text += `❤️ HP: [${hpBar}] ${hpPercent}%\n`;
  text += `📊 ${boss.currentHp.toLocaleString()} / ${boss.baseHp.toLocaleString()}\n\n`;
  text += `👥 المشاركين: ${boss.registeredPlayers?.length || 0}\n`;
  text += `⏰ الحالة: ${boss.status === 'registration' ? '📝 تسجيل' : '⚔️ قتال'}\n`;
  
  if (boss.status === 'registration') {
    const remaining = Math.max(0, boss.registrationEnds - Date.now());
    text += `⏱️ متبقي: ${Math.ceil(remaining / 60000)} دقيقة\n`;
  }
  
  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 تنسيق نتيجة المعركة
// ═══════════════════════════════════════════════════════════════════════════════

export const formatBattleResult = (result) => {
  let text = `@
━─━••❁⊰｢❀｣⊱❁••━─━

🏆 • • ✤ انتصار! ✤ • • 🏆

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ ${result.boss?.emoji || '👹'} ${result.boss?.name || 'الزعيم'} هُزم!
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

`;

  if (result.mvp) {
    text += `⭐ MVP: ${result.mvp.name}\n`;
    text += `💥 الضرر: ${result.mvp.damage?.toLocaleString() || 0}\n\n`;
  }

  text += `👥 المشاركين:\n`;
  for (const p of result.participants || []) {
    text += `│ ${p.name}: ${p.damage?.toLocaleString() || 0} ضرر\n`;
    text += `│   💰 +${p.gold || 0} | ⭐ +${p.xp || 0}\n`;
  }

  text += `\n> \`بــوت :\`\n> _*『 FATIMA 』*_\n━─━••❁⊰｢ ❀｣⊱❁••━─━`;

  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎁 الحصول على مكافآت اللاعب
// ═══════════════════════════════════════════════════════════════════════════════

export const getPlayerBossRewards = (playerId) => {
  return playerRewards.get(playerId) || [];
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ استدعاء زعيم محدد
// ═══════════════════════════════════════════════════════════════════════════════

export const spawnBoss = (bossId, groupId, level = 10) => {
  const boss = BOSSES.find(b => b.id === bossId);
  if (!boss) {
    return { success: false, message: '❌ زعيم غير موجود!' };
  }
  
  return spawnRandomBoss(groupId, [{ level }]);
};

// تصدير
export { BOSSES, bossStats };
