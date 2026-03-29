// ═══════════════════════════════════════════════════════════════════════════════
// 👹 نظام الزعماء المتقدم - فاطمة بوت v13.0
// ظهور تلقائي، إعلانات في القناة والمجموعات، دعم زعماء متعددين
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';
import { sendBossImage } from './utils/image.mjs';
import { hasSkill } from './skills.mjs';
import { getClan } from './clan.mjs';
import { healthBar, updateStamina, levelUp } from './rpg.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 قائمة الزعماء الأساسية
// ═══════════════════════════════════════════════════════════════════════════════

export const BOSSES = [
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

function getActiveBoss(groupId) {
  const data = getRpgData();
  if (!data.activeBosses) return null;
  return data.activeBosses[groupId] || null;
}

function setActiveBoss(groupId, boss) {
  const data = getRpgData();
  if (!data.activeBosses) data.activeBosses = {};
  data.activeBosses[groupId] = boss;
  saveDatabase();
}

function removeActiveBoss(groupId) {
  const data = getRpgData();
  if (data.activeBosses) delete data.activeBosses[groupId];
  saveDatabase();
}

/**
 * حساب الضرر مع مراعاة مهارات اللاعب والمعدات
 */
function calculateDamage(player, bossDef) {
  let damage = player.atk || 10;
  if (player.equippedWeapon) damage += player.equippedWeapon.atk || 0;
  
  if (player.class === 'ساحر') damage += (player.mag || 0) * 0.5;
  if (player.class === 'قاتل') damage *= 1.2;
  
  let armorPen = 0;
  if (hasSkill(player, 'armor_penetration')) armorPen = 0.25;
  const effectiveDef = bossDef * (1 - armorPen);
  damage = Math.max(1, damage - effectiveDef * 0.5);
  
  if (hasSkill(player, 'berserk_mode') && player.hp < player.maxHp * 0.3) {
    damage *= 1.5;
  }
  
  let crit = false;
  let critRate = (player.critRate || 0.05);
  if (hasSkill(player, 'eagle_eye')) critRate += 0.1;
  if (Math.random() < critRate) {
    damage *= (player.critDamage || 1.5);
    crit = true;
  }
  
  return { damage: Math.floor(damage), critical: crit };
}

function calculateBossDamage(boss, player) {
  let damage = boss.atk;
  if (player.equippedArmor) damage -= player.equippedArmor.def || 0;
  if (hasSkill(player, 'mana_shield')) damage *= 0.85;
  if (hasSkill(player, 'shield_mastery')) damage *= 0.75;
  damage = Math.max(1, Math.floor(damage));
  return damage;
}

function levelUpXP(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎲 استدعاء زعيم جديد لمجموعة (يدوياً أو تلقائياً)
// ═══════════════════════════════════════════════════════════════════════════════

export function spawnBossForGroup(groupId, sock = null) {
  const data = getRpgData();
  
  // التحقق من وجود كلان في المجموعة
  const clan = getClan(groupId);
  if (!clan) return null;
  
  // لا نستدعي زعيماً إذا كان هناك زعيم نشط
  if (getActiveBoss(groupId)) return null;
  
  // اختيار زعيم عشوائي
  const bossTemplate = BOSSES[Math.floor(Math.random() * BOSSES.length)];
  
  // حساب متوسط مستوى أعضاء الكلان
  let totalLevel = 0;
  let memberCount = 0;
  for (const memberId of clan.members) {
    const player = data.players?.[memberId];
    if (player) {
      totalLevel += player.level || 1;
      memberCount++;
    }
  }
  const avgLevel = memberCount > 0 ? Math.floor(totalLevel / memberCount) : 10;
  
  const boss = {
    instanceId: `boss_${Date.now()}_${groupId}`,
    id: bossTemplate.id,
    name: bossTemplate.name,
    emoji: bossTemplate.emoji,
    type: bossTemplate.type,
    description: bossTemplate.description,
    level: avgLevel,
    baseHp: Math.floor(bossTemplate.baseHp * (1 + avgLevel * 0.05)),
    currentHp: Math.floor(bossTemplate.baseHp * (1 + avgLevel * 0.05)),
    atk: Math.floor(bossTemplate.atk * (1 + avgLevel * 0.03)),
    def: Math.floor(bossTemplate.def * (1 + avgLevel * 0.02)),
    status: 'registration',
    group: groupId,
    registeredPlayers: [],
    playerDamage: {},
    spawnedAt: Date.now(),
    registrationEnds: Date.now() + 5 * 60 * 1000,
    battleEnds: null,
    rewards: {
      gold: Math.floor(bossTemplate.rewards.gold * (1 + avgLevel * 0.1)),
      xp: Math.floor(bossTemplate.rewards.xp * (1 + avgLevel * 0.1)),
      items: [...bossTemplate.rewards.items]
    },
    totalDamageDealt: 0,
    lastAttackTime: Date.now()
  };
  
  setActiveBoss(groupId, boss);
  
  // إرسال الإعلانات
  if (sock) {
    const announcement = formatBossAnnouncement(boss);
    const channelId = '120363408713799197@newsletter';
    sock.sendMessage(channelId, { text: announcement }).catch(e => console.error('فشل إرسال إعلان القناة:', e));
    sock.sendMessage(groupId, { text: announcement }).catch(e => console.error('فشل إرسال إعلان المجموعة:', e));
  }
  
  return boss;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 التسجيل في معركة الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

export function registerForBoss(player, groupId) {
  const boss = getActiveBoss(groupId);
  if (!boss) return { success: false, message: '❌ لا يوجد زعيم نشط في هذه المجموعة!' };
  if (boss.status !== 'registration') return { success: false, message: '❌ انتهت فترة التسجيل!' };
  if (boss.registeredPlayers.includes(player.id)) return { success: false, message: '❌ أنت مسجل بالفعل!' };
  
  updateStamina(player);
  if (player.stamina < 1) return { success: false, message: '❌ لا طاقة كافية!' };
  player.stamina--;
  
  boss.registeredPlayers.push(player.id);
  boss.playerDamage[player.id] = 0;
  saveDatabase();
  
  return { success: true, message: `✅ تم تسجيلك في معركة ${boss.emoji} ${boss.name}!` };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ الهجوم على الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

export function attackBoss(player, groupId, skillId = null) {
  const boss = getActiveBoss(groupId);
  if (!boss) return { success: false, message: '❌ لا توجد معركة زعيم!' };
  if (boss.status !== 'active') return { success: false, message: '❌ المعركة لم تبدأ بعد!' };
  if (!boss.registeredPlayers.includes(player.id)) return { success: false, message: '❌ غير مسجل في المعركة!' };
  if (player.hp <= 0) return { success: false, message: '💀 لقد مت! لا يمكنك القتال.' };
  
  const now = Date.now();
  if (player.lastBossAttack && now - player.lastBossAttack < 5000) {
    const remaining = Math.ceil((5000 - (now - player.lastBossAttack)) / 1000);
    return { success: false, message: `⏰ انتظر ${remaining} ثانية قبل الهجوم مجدداً.` };
  }
  player.lastBossAttack = now;
  
  const { damage, critical } = calculateDamage(player, boss.def);
  const bossDamage = calculateBossDamage(boss, player);
  
  player.hp = Math.max(0, player.hp - bossDamage);
  boss.currentHp = Math.max(0, boss.currentHp - damage);
  boss.playerDamage[player.id] = (boss.playerDamage[player.id] || 0) + damage;
  boss.totalDamageDealt += damage;
  boss.lastAttackTime = now;
  
  if (!player.stats) player.stats = {};
  player.stats.totalBossDamage = (player.stats.totalBossDamage || 0) + damage;
  
  saveDatabase();
  
  if (boss.currentHp <= 0) {
    return finalizeBossDefeat(boss, groupId);
  }
  
  return {
    success: true,
    defeated: false,
    damage,
    critical,
    bossDamage,
    playerHp: player.hp,
    bossHp: boss.currentHp,
    bossMaxHp: boss.baseHp
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 إنهاء هزيمة الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

function finalizeBossDefeat(boss, groupId) {
  const data = getRpgData();
  boss.status = 'defeated';
  
  let mvpId = null;
  let maxDamage = 0;
  for (const [pid, dmg] of Object.entries(boss.playerDamage)) {
    if (dmg > maxDamage) {
      maxDamage = dmg;
      mvpId = pid;
    }
  }
  
  const results = { boss, mvp: null, participants: [] };
  
  for (const playerId of boss.registeredPlayers) {
    const player = data.players[playerId];
    if (!player) continue;
    
    const damage = boss.playerDamage[playerId] || 0;
    const participation = damage / (boss.baseHp || 1);
    let goldReward = Math.floor(boss.rewards.gold * (0.5 + participation * 0.5));
    let xpReward = Math.floor(boss.rewards.xp * (0.5 + participation * 0.5));
    goldReward = Math.max(50, Math.min(goldReward, boss.rewards.gold));
    xpReward = Math.max(30, Math.min(xpReward, boss.rewards.xp));
    
    player.gold = (player.gold || 0) + goldReward;
    player.xp = (player.xp || 0) + xpReward;
    
    let leveled = false;
    while (player.xp >= levelUpXP(player.level)) {
      levelUp(player);
      leveled = true;
    }
    
    if (playerId === mvpId) {
      if (!player.boxes) player.boxes = { common: 0, rare: 0, epic: 0, legendary: 0 };
      player.boxes.epic++;
      if (!player.stats) player.stats = {};
      player.stats.bossesDefeated = (player.stats.bossesDefeated || 0) + 1;
      results.mvp = { id: playerId, name: player.name, damage: maxDamage };
    }
    
    results.participants.push({
      id: playerId,
      name: player.name,
      damage,
      gold: goldReward,
      xp: xpReward,
      leveled
    });
  }
  
  const bossStats = data.bossStats || {};
  bossStats[boss.id] = bossStats[boss.id] || { defeats: 0, evolutionLevel: 1 };
  bossStats[boss.id].defeats++;
  bossStats[boss.id].evolutionLevel = Math.min(10, bossStats[boss.id].evolutionLevel + 1);
  data.bossStats = bossStats;
  
  removeActiveBoss(groupId);
  saveDatabase();
  
  return { success: true, defeated: true, results };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💚 العلاج الجماعي (للشافي)
// ═══════════════════════════════════════════════════════════════════════════════

export function groupHeal(healer, groupId) {
  const boss = getActiveBoss(groupId);
  if (!boss || boss.status !== 'active') return { success: false, message: '❌ لا توجد معركة زعيم نشطة' };
  if (healer.class !== 'شافي') return { success: false, message: '❌ فقط الشافي يمكنه استخدام العلاج الجماعي!' };
  if (!hasSkill(healer, 'group_heal')) return { success: false, message: '❌ تحتاج إلى فتح مهارة "علاج جماعي" أولاً!' };
  
  const now = Date.now();
  if (healer.lastGroupHeal && now - healer.lastGroupHeal < 5 * 60 * 1000) {
    const remaining = Math.ceil((5 * 60 * 1000 - (now - healer.lastGroupHeal)) / 60000);
    return { success: false, message: `⏰ انتظر ${remaining} دقيقة` };
  }
  if (!boss.registeredPlayers.includes(healer.id)) return { success: false, message: '❌ غير مسجل في المعركة!' };
  
  const healAmount = healer.mag * 5;
  let healedCount = 0;
  const data = getRpgData();
  for (const playerId of boss.registeredPlayers) {
    const player = data.players[playerId];
    if (player && player.hp > 0 && player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + healAmount);
      healedCount++;
    }
  }
  
  healer.lastGroupHeal = now;
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
// 🔄 تحديث حالة جميع الزعماء (يُستدعى دورياً)
// ═══════════════════════════════════════════════════════════════════════════════

export function updateAllBossesStates(sock = null) {
  const data = getRpgData();
  if (!data.activeBosses) return;
  
  const now = Date.now();
  let changed = false;
  
  for (const [groupId, boss] of Object.entries(data.activeBosses)) {
    if (boss.status === 'registration' && now >= boss.registrationEnds) {
      boss.status = 'active';
      boss.battleEnds = now + 20 * 60 * 1000;
      const participantsCount = boss.registeredPlayers.length;
      if (participantsCount > 0) {
        boss.currentHp = boss.baseHp + (participantsCount * 500);
      }
      changed = true;
      
      if (sock) {
        const startMsg = `⚔️ بدأت معركة ${boss.emoji} ${boss.name}!\n👥 المشاركون: ${participantsCount}\n💥 اهجموا الآن!`;
        sock.sendMessage(groupId, { text: startMsg }).catch(()=>{});
        sock.sendMessage('120363408713799197@newsletter', { text: startMsg }).catch(()=>{});
      }
    }
    
    if (boss.status === 'active' && boss.battleEnds && now >= boss.battleEnds) {
      removeActiveBoss(groupId);
      if (sock) {
        sock.sendMessage(groupId, { text: `😔 انتهى الوقت! ${boss.emoji} ${boss.name} هرب.` }).catch(()=>{});
      }
      changed = true;
    }
  }
  
  if (changed) saveDatabase();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 دوال التنسيق والعرض
// ═══════════════════════════════════════════════════════════════════════════════

export function formatBossAnnouncement(boss) {
  return `@
━─━••❁⊰｢❀｣⊱❁••━─━

${boss.emoji} • • ✤ زعيم ظهر! ✤ • • ${boss.emoji}

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ 👹 الاسم: ${boss.name}
│ 📊 النوع: ${boss.type}
│ ⭐ المستوى: ${boss.level}
│ ❤️ HP: ${boss.baseHp.toLocaleString()}
│ ⚔️ ATK: ${boss.atk} | 🛡️ DEF: ${boss.def}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

🎁 المكافآت:
│ 💰 ${boss.rewards.gold.toLocaleString()} ذهب
│ ⭐ ${boss.rewards.xp.toLocaleString()} XP

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

⏰ التسجيل: 5 دقائق
💡 .مشاركة للتسجيل

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`;
}

export function formatBossStatus(boss) {
  const hpBar = healthBar(boss.currentHp, boss.baseHp, 15);
  const hpPercent = Math.floor((boss.currentHp / boss.baseHp) * 100);
  
  let text = `${boss.emoji} ═══════ ${boss.name} ═══════ ${boss.emoji}

❤️ HP: ${boss.currentHp.toLocaleString()}/${boss.baseHp.toLocaleString()}
📊 [${hpBar}] ${hpPercent}%

👥 المشاركين: ${boss.registeredPlayers.length}
📊 الحالة: ${boss.status === 'registration' ? '📝 تسجيل' : '⚔️ قتال'}
`;

  if (boss.status === 'registration') {
    const remaining = Math.max(0, boss.registrationEnds - Date.now());
    text += `⏱️ متبقي للتسجيل: ${Math.ceil(remaining / 60000)} دقيقة\n`;
  } else {
    const remaining = Math.max(0, boss.battleEnds - Date.now());
    text += `⏱️ متبقي للمعركة: ${Math.ceil(remaining / 60000)} دقيقة\n`;
  }

  if (Object.keys(boss.playerDamage).length > 0) {
    const sorted = Object.entries(boss.playerDamage).sort((a,b) => b[1] - a[1]).slice(0, 3);
    text += `\n📊 أعلى ضرر:\n`;
    const data = getRpgData();
    for (const [pid, dmg] of sorted) {
      const p = data.players[pid];
      text += `│ ${p?.name || 'مجهول'}: ${dmg.toLocaleString()}\n`;
    }
  }
  
  return text;
}

export function formatBattleResult(results) {
  let text = `@
━─━••❁⊰｢❀｣⊱❁••━─━

🏆 • • ✤ انتصار! ✤ • • 🏆

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ ${results.boss.emoji} ${results.boss.name} هُزم!
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

`;
  if (results.mvp) {
    text += `⭐ MVP: ${results.mvp.name}
💥 الضرر: ${results.mvp.damage.toLocaleString()}

`;
  }
  text += `👥 المشاركون:\n`;
  for (const p of results.participants) {
    text += `│ ${p.name}: ${p.damage.toLocaleString()} ضرر
│   💰 +${p.gold} | ⭐ +${p.xp}${p.leveled ? ' 🎉 مستوى جديد!' : ''}
`;
  }
  text += `
> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`;
  return text;
}

export function formatBossList() {
  let text = `@
━─━••❁⊰｢❀｣⊱❁••━─━

👹 • • ✤ قائمة الزعماء ✤ • • 👹

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
`;
  for (const b of BOSSES) {
    const difficulty = b.baseHp >= 15000 ? '⭐⭐⭐' : b.baseHp >= 8000 ? '⭐⭐' : '⭐';
    text += `${b.emoji} ${b.name} ${difficulty}
   │ ❤️ ${b.baseHp.toLocaleString()} | ⚔️ ${b.atk} | 🛡️ ${b.def}
   │ 💰 ${b.rewards.gold.toLocaleString()} | ⭐ ${b.rewards.xp}
   
`;
  }
  text += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`;
  return text;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 دوال للتوافق مع الكود القديم
// ═══════════════════════════════════════════════════════════════════════════════

export function getBoss(bossId) {
  return BOSSES.find(b => b.id === bossId || b.name === bossId);
}

export function getAllBosses() {
  return BOSSES;
}

// الحصول على الزعيم النشط القديم (للتوافق، لكن يفضل استخدام getActiveBoss الجديد)
export function getLegacyActiveBoss(groupId = null) {
  const data = getRpgData();
  if (!data.activeBoss) return null;
  if (groupId && data.activeBoss.group !== groupId) return null;
  return data.activeBoss;
}

// دالة التحديث القديمة (للتوافق)
export function updateBossState() {
  const data = getRpgData();
  if (!data.activeBoss) return false;
  // تحويل الزعيم القديم إلى النظام الجديد مؤقتاً
  const oldBoss = data.activeBoss;
  const groupId = oldBoss.group;
  if (groupId) {
    setActiveBoss(groupId, oldBoss);
    data.activeBoss = null;
    saveDatabase();
    updateAllBossesStates();
    return true;
  }
  return false;
}

export function getBossStatus() {
  const data = getRpgData();
  if (!data.activeBosses) return null;
  // إرجاع أول زعيم نشط (للتوافق)
  const firstGroup = Object.keys(data.activeBosses)[0];
  if (!firstGroup) return null;
  const boss = data.activeBosses[firstGroup];
  return {
    ...boss,
    participantsCount: boss.registeredPlayers?.length || 0,
    hpPercent: (boss.currentHp / boss.baseHp) * 100
  };
}

export { getActiveBoss, setActiveBoss, removeActiveBoss };
