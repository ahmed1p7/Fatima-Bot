// ═══════════════════════════════════════════════════════════════════════════════
// 👹 أوامر الزعماء المحسنة - فاطمة بوت v13.0
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from '../lib/database.mjs';
import { healthBar } from '../lib/rpg.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 قائمة الزعماء
// ═══════════════════════════════════════════════════════════════════════════════

const BOSSES = [
  { id: 'kazaka', name: 'كاساكا', emoji: '🐍', type: 'هجمات برية', baseHp: 5000, atk: 300, def: 150, rewards: { gold: 1000, xp: 500 } },
  { id: 'swamp_king', name: 'ملك المستنقعات', emoji: '🐊', type: 'هجمات برية', baseHp: 8000, atk: 400, def: 300, rewards: { gold: 2000, xp: 800 } },
  { id: 'orc_leader', name: 'زعيم الأورك', emoji: '👹', type: 'هجمات برية', baseHp: 6000, atk: 350, def: 200, rewards: { gold: 1500, xp: 600 } },
  { id: 'beru', name: 'بيرو', emoji: '🐜', type: 'طائر', baseHp: 7000, atk: 450, def: 180, rewards: { gold: 2500, xp: 1000 } },
  { id: 'igrit', name: 'إيغريس', emoji: '⚔️', type: 'أسطوري', baseHp: 15000, atk: 600, def: 400, rewards: { gold: 5000, xp: 2000 } },
  { id: 'antares', name: 'أنتاريس', emoji: '🐉', type: 'أسطوري', baseHp: 30000, atk: 1000, def: 800, rewards: { gold: 15000, xp: 5000 } }
];

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════════════

function getActiveBoss(groupId = null) {
  const data = getRpgData();
  if (!data.activeBoss) return null;
  if (groupId && data.activeBoss.group !== groupId) return null;
  return data.activeBoss;
}

function spawnBossForGroup(groupId, participants = []) {
  const data = getRpgData();
  
  // اختيار زعيم عشوائي
  const boss = BOSSES[Math.floor(Math.random() * BOSSES.length)];
  
  // حساب المستوى بناءً على المشاركين
  let avgLevel = 10;
  if (participants.length > 0) {
    const totalLevel = participants.reduce((sum, p) => sum + (p.level || 1), 0);
    avgLevel = Math.floor(totalLevel / participants.length);
  }
  
  // إنشاء الزعيم
  const bossInstance = {
    id: `boss_${Date.now()}`,
    bossId: boss.id,
    name: boss.name,
    emoji: boss.emoji,
    type: boss.type,
    level: avgLevel,
    baseHp: Math.floor(boss.baseHp * (1 + avgLevel * 0.05)),
    currentHp: Math.floor(boss.baseHp * (1 + avgLevel * 0.05)),
    atk: Math.floor(boss.atk * (1 + avgLevel * 0.03)),
    def: Math.floor(boss.def * (1 + avgLevel * 0.02)),
    status: 'registration',
    group: groupId,
    registeredPlayers: [],
    playerDamage: {},
    rewards: boss.rewards,
    spawnedAt: Date.now(),
    registrationEnds: Date.now() + 5 * 60 * 1000 // 5 دقائق
  };
  
  data.activeBoss = bossInstance;
  saveDatabase();
  
  return bossInstance;
}

function registerPlayerForBoss(player, boss) {
  if (!boss || boss.status !== 'registration') {
    return { success: false, message: '❌ لا يوجد زعيم متاح للتسجيل!' };
  }
  
  if (boss.registeredPlayers.includes(player.id)) {
    return { success: false, message: '❅ أنت مسجل بالفعل!' };
  }
  
  if ((player.stamina || 0) < 1) {
    return { success: false, message: '❌ تحتاج نقطة طاقة واحدة!' };
  }
  
  player.stamina--;
  boss.registeredPlayers.push(player.id);
  boss.playerDamage[player.id] = 0;
  
  saveDatabase();
  
  return {
    success: true,
    message: `✅ تم تسجيلك في معركة ${boss.emoji} ${boss.name}!\n👥 المشاركين: ${boss.registeredPlayers.length}`
  };
}

function playerAttackBoss(player, boss) {
  if (!boss || boss.status !== 'active') {
    return { success: false, message: '❌ لا توجد معركة نشطة!' };
  }
  
  if (!boss.registeredPlayers.includes(player.id)) {
    return { success: false, message: '❌ غير مسجل في المعركة!' };
  }
  
  if (player.hp <= 0) {
    return { success: false, message: '💀 لقد مت! لا يمكنك القتال!' };
  }
  
  // التهدئة 10 ثواني
  const now = Date.now();
  const lastAttack = player.lastBossAttack || 0;
  if (now - lastAttack < 10000) {
    const remaining = Math.ceil((10000 - (now - lastAttack)) / 1000);
    return { success: false, message: `⏰ انتظر ${remaining} ثانية!` };
  }
  
  player.lastBossAttack = now;
  
  // حساب الضرر
  let damage = player.atk;
  if (player.equippedWeapon) damage += player.equippedWeapon.atk || 0;
  if (player.class === 'ساحر') damage += player.mag * 0.5;
  
  // ضربة حرجة
  const isCrit = Math.random() < (player.critRate || 0.05);
  if (isCrit) damage *= 1.5;
  
  // عشوائية
  damage = Math.floor(damage * (0.8 + Math.random() * 0.4));
  
  // تطبيق الضرر
  boss.currentHp = Math.max(0, boss.currentHp - damage);
  boss.playerDamage[player.id] = (boss.playerDamage[player.id] || 0) + damage;
  
  // ضرر الزعيم
  const bossDamage = Math.max(1, boss.atk - player.def);
  player.hp = Math.max(0, player.hp - bossDamage);
  
  // تحديث الإحصائيات
  if (!player.stats) player.stats = {};
  player.stats.totalBossDamage = (player.stats.totalBossDamage || 0) + damage;
  
  // التحقق من الهزيمة
  if (boss.currentHp <= 0) {
    return handleBossDefeat(boss);
  }
  
  saveDatabase();
  
  return {
    success: true,
    damage,
    isCrit,
    bossDamage,
    playerHp: player.hp,
    bossHp: boss.currentHp,
    bossMaxHp: boss.baseHp
  };
}

function handleBossDefeat(boss) {
  const data = getRpgData();
  
  boss.status = 'defeated';
  
  // تحديد MVP
  let mvpId = null;
  let maxDamage = 0;
  for (const [id, dmg] of Object.entries(boss.playerDamage || {})) {
    if (dmg > maxDamage) {
      maxDamage = dmg;
      mvpId = id;
    }
  }
  
  // توزيع الجوائز
  const results = {
    boss,
    mvp: null,
    participants: []
  };
  
  for (const playerId of boss.registeredPlayers || []) {
    const player = data.players[playerId];
    if (!player || player.hp <= 0) continue;
    
    const damage = boss.playerDamage[playerId] || 0;
    const goldReward = Math.floor(boss.rewards.gold * (0.5 + (damage / boss.baseHp) * 0.5));
    const xpReward = Math.floor(boss.rewards.xp * (0.5 + (damage / boss.baseHp) * 0.5));
    
    player.gold = (player.gold || 0) + goldReward;
    player.xp = (player.xp || 0) + xpReward;
    
    if (playerId === mvpId) {
      player.boxes = player.boxes || { common: 0, rare: 0, epic: 0, legendary: 0 };
      player.boxes.epic++;
      results.mvp = { id: playerId, name: player.name, damage: maxDamage };
    }
    
    results.participants.push({
      id: playerId,
      name: player.name,
      damage,
      gold: goldReward,
      xp: xpReward
    });
  }
  
  data.activeBoss = null;
  saveDatabase();
  
  return {
    success: true,
    defeated: true,
    results
  };
}

function checkBossStatus(boss) {
  if (!boss) return null;
  
  const now = Date.now();
  
  // تحويل من تسجيل لقتال
  if (boss.status === 'registration' && now >= boss.registrationEnds) {
    boss.status = 'active';
    boss.battleEnds = now + 20 * 60 * 1000;
    
    // زيادة HP حسب المشاركين
    const participants = boss.registeredPlayers.length;
    if (participants > 0) {
      boss.currentHp = boss.baseHp + (participants * 1000);
    }
    
    saveDatabase();
    return boss;
  }
  
  // انتهاء المعركة
  if (boss.status === 'active' && boss.battleEnds && now >= boss.battleEnds) {
    const data = getRpgData();
    data.activeBoss = null;
    saveDatabase();
    return null;
  }
  
  return boss;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 تصدير الأوامر
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  name: 'Boss',
  commands: [
    'زعيم', 'boss', 'استدعاء_زعيم',
    'هجوم_زعيم', 'attackboss', 'هجوم',
    'مشاركة', 'قتال_الزعيم',
    'حالة_زعيم', 'bossstatus',
    'زعماء', 'bosses'
  ],

  async execute(sock, msg, ctx) {
    const { from, sender, pushName, command, args, text, prefix, isGroupAdmin, isGroup } = ctx;
    const data = getRpgData();
    const player = data.players?.[sender];

    // ═════════════════════════════════════════════════════════════════════════
    // استدعاء زعيم
    // ═════════════════════════════════════════════════════════════════════════
    if (['زعيم', 'boss', 'استدعاء_زعيم'].includes(command)) {
      const existingBoss = getActiveBoss(from);
      if (existingBoss) {
        return sock.sendMessage(from, { 
          text: `❌ هناك زعيم نشط بالفعل!\n\n${formatBossStatus(existingBoss)}` 
        });
      }

      const participants = Object.values(data.players || {}).filter(p => p && p.level);
      const boss = spawnBossForGroup(from, participants);

      return sock.sendMessage(from, {
        text: formatBossAnnouncement(boss, prefix)
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // التسجيل في المعركة
    // ═════════════════════════════════════════════════════════════════════════
    if (['مشاركة', 'قتال_الزعيم'].includes(command)) {
      if (!player) {
        return sock.sendMessage(from, { text: '❌ سجل أولاً! استخدم .تسجيل <صنف>' });
      }

      let boss = getActiveBoss(from);
      boss = checkBossStatus(boss);
      
      if (!boss) {
        return sock.sendMessage(from, { text: '❌ لا يوجد زعيم نشط! استخدم .زعيم' });
      }

      if (boss.status !== 'registration') {
        return sock.sendMessage(from, { text: '❌ انتهى وقت التسجيل! المعركة جارية.' });
      }

      player.id = sender;
      const result = registerPlayerForBoss(player, boss);
      return sock.sendMessage(from, { text: result.message });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // الهجوم على الزعيم
    // ═════════════════════════════════════════════════════════════════════════
    if (['هجوم_زعيم', 'attackboss', 'هجوم'].includes(command)) {
      if (!player) {
        return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      }

      let boss = getActiveBoss(from);
      boss = checkBossStatus(boss);
      
      if (!boss) {
        return sock.sendMessage(from, { text: '❌ لا توجد معركة نشطة!' });
      }

      if (boss.status === 'registration') {
        const remaining = Math.ceil((boss.registrationEnds - Date.now()) / 60000);
        return sock.sendMessage(from, { text: `⏰ المعركة تبدأ بعد ${remaining} دقيقة!` });
      }

      player.id = sender;
      const result = playerAttackBoss(player, boss);

      if (!result.success) {
        return sock.sendMessage(from, { text: result.message });
      }

      if (result.defeated) {
        return sock.sendMessage(from, { text: formatBattleResult(result.results) });
      }

      const hpBar = healthBar(result.bossHp, result.bossMaxHp, 15);
      let response = `⚔️ هجوم على ${boss.emoji} ${boss.name}!

💥 ضررك: ${result.damage.toLocaleString()}${result.isCrit ? ' 🔥 حرجة!' : ''}
💔 ضرر الزعيم: ${result.bossDamage}

❤️ HP الزعيم: ${result.bossHp.toLocaleString()}/${result.bossMaxHp.toLocaleString()}
[${hpBar}]

❤️ صحتك: ${result.playerHp}`;

      return sock.sendMessage(from, { text: response });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // حالة الزعيم
    // ═════════════════════════════════════════════════════════════════════════
    if (['حالة_زعيم', 'bossstatus'].includes(command)) {
      let boss = getActiveBoss(from);
      boss = checkBossStatus(boss);

      if (!boss) {
        return sock.sendMessage(from, { text: '❌ لا يوجد زعيم نشط حالياً!' });
      }

      return sock.sendMessage(from, { text: formatBossStatus(boss) });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // قائمة الزعماء
    // ═════════════════════════════════════════════════════════════════════════
    if (['زعماء', 'bosses'].includes(command)) {
      let msg = `@
━─━••❁⊰｢❀｣⊱❁••━─━

👹 • • ✤ قائمة الزعماء ✤ • • 👹

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
`;

      for (const boss of BOSSES) {
        const difficulty = boss.baseHp >= 15000 ? '⭐⭐⭐' : boss.baseHp >= 8000 ? '⭐⭐' : '⭐';
        msg += `${boss.emoji} ${boss.name} ${difficulty}
   │ ❤️ ${boss.baseHp.toLocaleString()} | ⚔️ ${boss.atk} | 🛡️ ${boss.def}
   │ 💰 ${boss.rewards.gold.toLocaleString()} | ⭐ ${boss.rewards.xp}
   
`;
      }

      msg += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
💡 ${prefix}زعيم - استدعاء زعيم

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`;

      return sock.sendMessage(from, { text: msg });
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 دوال التنسيق
// ═══════════════════════════════════════════════════════════════════════════════

function formatBossAnnouncement(boss, prefix) {
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
💡 ${prefix}مشاركة للتسجيل

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`;
}

function formatBossStatus(boss) {
  const hpPercent = Math.floor((boss.currentHp / boss.baseHp) * 100);
  const hpBar = healthBar(boss.currentHp, boss.baseHp, 15);
  
  let text = `${boss.emoji} ═══════ ${boss.name} ═══════ ${boss.emoji}

❤️ HP: ${boss.currentHp.toLocaleString()}/${boss.baseHp.toLocaleString()}
📊 [${hpBar}] ${hpPercent}%

👥 المشاركين: ${boss.registeredPlayers?.length || 0}
📊 الحالة: ${boss.status === 'registration' ? '📝 تسجيل' : '⚔️ قتال'}
`;

  if (boss.status === 'registration') {
    const remaining = Math.max(0, boss.registrationEnds - Date.now());
    text += `⏱️ متبقي: ${Math.ceil(remaining / 60000)} دقيقة\n`;
  }

  // أفضل الضرار
  if (boss.playerDamage && Object.keys(boss.playerDamage).length > 0) {
    const sorted = Object.entries(boss.playerDamage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    text += `\n📊 أعلى ضرر:\n`;
    const data = getRpgData();
    for (const [id, dmg] of sorted) {
      const p = data.players?.[id];
      text += `│ ${p?.name || 'غير معروف'}: ${dmg.toLocaleString()}\n`;
    }
  }

  return text;
}

function formatBattleResult(results) {
  let text = `@
━─━••❁⊰｢❀｣⊱❁••━─━

🏆 • • ✤ انتصار! ✤ • • 🏆

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ ${results.boss?.emoji || '👹'} ${results.boss?.name || 'الزعيم'} هُزم!
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

`;

  if (results.mvp) {
    text += `⭐ MVP: ${results.mvp.name}
💥 الضرر: ${results.mvp.damage?.toLocaleString() || 0}

`;
  }

  text += `👥 المشاركين:
`;
  for (const p of results.participants || []) {
    text += `│ ${p.name}: ${p.damage?.toLocaleString() || 0} ضرر
│   💰 +${p.gold || 0} | ⭐ +${p.xp || 0}
`;
  }

  text += `
> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`;

  return text;
}

// تصدير البيانات
export { BOSSES };
