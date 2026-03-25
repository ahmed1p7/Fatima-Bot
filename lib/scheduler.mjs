// ═══════════════════════════════════════════════════════════════════════════════
// ⏰ نظام المهام المجدولة - فاطمة بوت
// ═══════════════════════════════════════════════════════════════════════════════

import cron from 'node-cron';
import { getRpgData, saveDatabase } from './database.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 حالة النظام
// ═══════════════════════════════════════════════════════════════════════════════

let botSocket = null;
let schedulerInitialized = false;

// الزعماء المتاحين
const BOSSES = [
  { id: 'kazaka', name: 'كاساكا', emoji: '🐍', type: 'هجمات برية', hp: 5000, atk: 300, def: 150 },
  { id: 'swamp_king', name: 'ملك المستنقعات', emoji: '🐊', type: 'هجمات برية', hp: 8000, atk: 400, def: 300 },
  { id: 'orc_leader', name: 'زعيم الأورك', emoji: '👹', type: 'هجمات برية', hp: 6000, atk: 350, def: 200 },
  { id: 'beru', name: 'بيرو', emoji: '🐜', type: 'طائر', hp: 7000, atk: 450, def: 180 },
  { id: 'igrit', name: 'إيغريس', emoji: '⚔️', type: 'أسطوري', hp: 15000, atk: 600, def: 400 },
  { id: 'antares', name: 'أنتاريس', emoji: '🐉', type: 'أسطوري', hp: 30000, atk: 1000, def: 800 }
];

const MONSTERS = [
  { name: 'ذئب بري', emoji: '🐺', hp: 100, atk: 15, def: 5, xp: 20, gold: 30 },
  { name: 'عنكبوت سام', emoji: '🕷️', hp: 80, atk: 20, def: 3, xp: 25, gold: 40 },
  { name: 'غول', emoji: '👹', hp: 200, atk: 30, def: 20, xp: 50, gold: 80 },
  { name: 'تنين صغير', emoji: '🐲', hp: 300, atk: 50, def: 30, xp: 100, gold: 150 },
  { name: 'ساحر مظلم', emoji: '🧙', hp: 150, atk: 60, def: 10, xp: 70, gold: 120 }
];

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 المهام المجدولة
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * إعادة تعيين الطاقة اليومية
 */
export function resetDailyStamina(sock) {
  const data = getRpgData();
  if (!data.players) return;

  let count = 0;
  for (const [id, player] of Object.entries(data.players)) {
    if (player) {
      // إعادة تعيين الطاقة إلى 10
      player.stamina = 10;
      player.lastStaminaUpdate = Date.now();
      
      // إعادة تعيين المهام اليومية
      if (player.quests && player.quests.daily) {
        for (const quest of player.quests.daily) {
          quest.completed = false;
          quest.progress = 0;
        }
      }
      
      count++;
    }
  }

  saveDatabase();
  console.log(`🔄 [Scheduler] تم إعادة تعيين طاقة ${count} لاعب`);
  
  return count;
}

/**
 * إعادة تعيين المهام الأسبوعية
 */
export function resetWeeklyQuests(sock) {
  const data = getRpgData();
  if (!data.players) return;

  let count = 0;
  for (const [id, player] of Object.entries(data.players)) {
    if (player && player.quests && player.quests.weekly) {
      for (const quest of player.quests.weekly) {
        quest.completed = false;
        quest.progress = 0;
      }
      count++;
    }
  }

  saveDatabase();
  console.log(`🔄 [Scheduler] تم إعادة تعيين مهام ${count} لاعب أسبوعياً`);
  
  return count;
}

/**
 * ظهور وحش عشوائي
 */
export async function spawnRandomMonster(sock) {
  if (!sock) return null;
  
  const data = getRpgData();
  const groups = Object.keys(data.groups || {});
  
  if (groups.length === 0) return null;

  const randomGroup = groups[Math.floor(Math.random() * groups.length)];
  const monster = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];

  // حفظ الوحش في بيانات المجموعة
  if (!data.activeMonsters) data.activeMonsters = {};
  data.activeMonsters[randomGroup] = {
    ...monster,
    spawnedAt: Date.now(),
    currentHp: monster.hp
  };
  saveDatabase();

  // إرسال إشعار للمجموعة
  const message = `👹 *وحش عشوائي ظهر!*

${monster.emoji} **${monster.name}**
❤️ HP: ${monster.hp}
⚔️ ATK: ${monster.atk}
🛡️ DEF: ${monster.def}

⏰ سيختفي بعد 30 دقيقة!
💡 استخدم .هجوم_وحش ${monster.name} للقتال!`;

  try {
    await sock.sendMessage(randomGroup, { text: message });
    console.log(`👹 [Scheduler] ظهر ${monster.name} في ${randomGroup}`);
    return { monster, group: randomGroup };
  } catch (e) {
    console.error('❌ خطأ في إرسال رسالة الوحش:', e.message);
    return null;
  }
}

/**
 * ظهور زعيم ديناميكي
 */
export async function spawnRandomBossEvent(sock) {
  if (!sock) return null;
  
  const data = getRpgData();
  
  // التحقق من وجود زعيم نشط
  if (data.activeBoss && data.activeBoss.status === 'active') {
    console.log('👹 [Scheduler] يوجد زعيم نشط بالفعل');
    return null;
  }

  // احتمالية 30% للظهور
  if (Math.random() > 0.3) {
    return null;
  }

  const groups = Object.keys(data.groups || {});
  if (groups.length === 0) return null;

  const randomGroup = groups[Math.floor(Math.random() * groups.length)];
  const boss = BOSSES[Math.floor(Math.random() * BOSSES.length)];

  // إنشاء الزعيم مع HP متوسع
  const bossData = {
    ...boss,
    baseHp: boss.hp,
    currentHp: boss.hp,
    status: 'registration', // registration, active, defeated
    registeredPlayers: [],
    totalDamageDealt: 0,
    spawnedAt: Date.now(),
    registrationEnds: Date.now() + (10 * 60 * 1000), // 10 دقائق للتسجيل
    group: randomGroup
  };

  data.activeBoss = bossData;
  saveDatabase();

  // إرسال رسالة تحذيرية
  const message = `🚨 *تحذير! طاقة مرعبة تقترب!*

${boss.emoji} **${boss.name}** ${boss.type}
⚡ يكسر الختم ويقترب من المجموعة!

⏰ **التسجيل مفتوح لمدة 10 دقائق!**
📝 اكتب *.قتال_الزعيم* للمشاركة
💰 رسوم الدخول: 1 نقطة طاقة

⚠️ استعدوا للمعركة!`;

  try {
    await sock.sendMessage(randomGroup, { text: message });
    console.log(`👹 [Scheduler] ظهر الزعيم ${boss.name} في ${randomGroup}`);
    return { boss: bossData, group: randomGroup };
  } catch (e) {
    console.error('❌ خطأ في إرسال رسالة الزعيم:', e.message);
    return null;
  }
}

/**
 * إنتاج موارد القرية
 */
export function produceVillageResources() {
  const data = getRpgData();
  if (!data.players) return;

  let count = 0;
  for (const [id, player] of Object.entries(data.players)) {
    if (player && player.village) {
      const village = player.village;
      
      // إنتاج الذهب
      if (village.goldMine && village.goldMine > 0) {
        village.resources = village.resources || {};
        village.resources.gold = (village.resources.gold || 0) + (village.goldMine * 10);
      }
      
      // إنتاج الإكسير
      if (village.elixirCollector && village.elixirCollector > 0) {
        village.resources = village.resources || {};
        village.resources.elixir = (village.resources.elixir || 0) + (village.elixirCollector * 5);
      }
      
      // إنتاج الخشب
      if (village.lumberCamp && village.lumberCamp > 0) {
        village.resources = village.resources || {};
        village.resources.wood = (village.resources.wood || 0) + (village.lumberCamp * 8);
      }
      
      count++;
    }
  }

  if (count > 0) {
    saveDatabase();
    console.log(`🏭 [Scheduler] إنتاج موارد لـ ${count} قرية`);
  }
  
  return count;
}

/**
 * إنهاء الترقيات والتدريب
 */
export function completeUpgrades() {
  const data = getRpgData();
  if (!data.players) return;

  const now = Date.now();
  let count = 0;

  for (const [id, player] of Object.entries(data.players)) {
    if (player && player.upgrades) {
      for (const [upgradeId, upgrade] of Object.entries(player.upgrades)) {
        if (upgrade.endTime && upgrade.endTime <= now && !upgrade.completed) {
          upgrade.completed = true;
          upgrade.level = (upgrade.level || 1) + 1;
          count++;
        }
      }
    }
    
    // إنهاء تدريب الوحدات
    if (player && player.trainingQueue) {
      player.trainingQueue = player.trainingQueue.filter(unit => {
        if (unit.endTime <= now) {
          player.units = player.units || [];
          player.units.push({ ...unit, trained: true });
          count++;
          return false;
        }
        return true;
      });
    }
  }

  if (count > 0) {
    saveDatabase();
    console.log(`🏗️ [Scheduler] إكمال ${count} ترقية/تدريب`);
  }
  
  return count;
}

/**
 * فحص وإدارة الزعيم النشط
 */
export async function checkActiveBoss(sock) {
  const data = getRpgData();
  
  if (!data.activeBoss) return;
  
  const boss = data.activeBoss;
  const now = Date.now();

  // فحص انتهاء وقت التسجيل
  if (boss.status === 'registration' && now >= boss.registrationEnds) {
    boss.status = 'active';
    boss.battleEnds = now + (20 * 60 * 1000); // 20 دقيقة للمعركة
    
    // حساب HP الزعيم بناءً على عدد المشاركين ومستوياتهم
    const participants = boss.registeredPlayers || [];
    if (participants.length > 0) {
      let totalLevel = 0;
      for (const pId of participants) {
        const player = data.players[pId];
        if (player) totalLevel += player.level || 1;
      }
      
      // زيادة HP بناءً على المشاركين
      boss.currentHp = boss.baseHp + (participants.length * 1000) + (totalLevel * 50);
    }
    
    saveDatabase();
    
    // إرسال إشعار بدء المعركة
    if (boss.group) {
      await sock.sendMessage(boss.group, {
        text: `⚔️ *بدأت معركة الزعيم!*

${boss.emoji} **${boss.name}**
❤️ HP: ${boss.currentHp.toLocaleString()}
👥 المشاركين: ${(boss.registeredPlayers || []).length}

⏰ المدة: 20 دقيقة
💡 استخدم .هجوم للهجوم!`
      });
    }
    
    console.log(`⚔️ [Scheduler] بدأت معركة ${boss.name}`);
  }
  
  // فحص انتهاء المعركة
  if (boss.status === 'active' && boss.battleEnds && now >= boss.battleEnds) {
    // الزعيم انتصر
    if (boss.group) {
      await sock.sendMessage(boss.group, {
        text: `💀 *هروب الزعيم!*

${boss.emoji} **${boss.name}** هرب!
❤️ HP المتبقي: ${boss.currentHp.toLocaleString()}

😔 فشل المشاركون في هزيمته...
💡 حاولوا مرة أخرى في المرة القادمة!`
      });
    }
    
    data.activeBoss = null;
    saveDatabase();
    console.log(`💀 [Scheduler] هرب الزعيم ${boss.name}`);
  }
}

/**
 * تنظيف الوحوش المنتهية
 */
export function cleanupExpiredMonsters() {
  const data = getRpgData();
  
  if (!data.activeMonsters) return 0;
  
  const now = Date.now();
  const expireTime = 30 * 60 * 1000; // 30 دقيقة
  let cleaned = 0;

  for (const [groupId, monster] of Object.entries(data.activeMonsters)) {
    if (monster.spawnedAt && (now - monster.spawnedAt) > expireTime) {
      delete data.activeMonsters[groupId];
      cleaned++;
    }
  }

  if (cleaned > 0) {
    saveDatabase();
    console.log(`🧹 [Scheduler] تنظيف ${cleaned} وحش منتهي`);
  }
  
  return cleaned;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 تهيئة المجدول
// ═══════════════════════════════════════════════════════════════════════════════

export function initScheduler(sock) {
  if (schedulerInitialized) {
    console.log('⚠️ المجدول уже يعمل');
    return;
  }
  
  botSocket = sock;
  
  // إعادة تعيين الطاقة يومياً (منتصف الليل)
  cron.schedule('0 0 * * *', () => {
    console.log('🔄 [Cron] إعادة تعيين الطاقة اليومية...');
    resetDailyStamina(botSocket);
  });
  
  // إعادة تعيين المهام الأسبوعية (الأحد منتصف الليل)
  cron.schedule('0 0 * * 0', () => {
    console.log('🔄 [Cron] إعادة تعيين المهام الأسبوعية...');
    resetWeeklyQuests(botSocket);
  });
  
  // ظهور وحش عشوائي (كل 4-6 ساعات)
  cron.schedule('0 */4 * * *', () => {
    console.log('👹 [Cron] فحص ظهور الوحوش...');
    if (Math.random() > 0.5) {
      spawnRandomMonster(botSocket);
    }
  });
  
  // ظهور زعيم عشوائي (كل 6-12 ساعة)
  cron.schedule('0 */6 * * *', () => {
    console.log('👹 [Cron] فحص ظهور الزعماء...');
    spawnRandomBossEvent(botSocket);
  });
  
  // إنتاج موارد القرية (كل ساعة)
  cron.schedule('0 * * * *', () => {
    produceVillageResources();
  });
  
  // إنهاء الترقيات (كل 5 دقائق)
  cron.schedule('*/5 * * * *', () => {
    completeUpgrades();
  });
  
  // فحص الزعيم النشط (كل دقيقة)
  cron.schedule('* * * * *', () => {
    if (botSocket) {
      checkActiveBoss(botSocket);
    }
  });
  
  // تنظيف الوحوش المنتهية (كل 10 دقائق)
  cron.schedule('*/10 * * * *', () => {
    cleanupExpiredMonsters();
  });
  
  schedulerInitialized = true;
  console.log('✅ [Scheduler] تم تفعيل المهام المجدولة');
}

// تصدير البيانات
export { BOSSES, MONSTERS };
