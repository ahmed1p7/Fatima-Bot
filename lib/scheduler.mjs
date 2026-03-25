// ═══════════════════════════════════════════════════════════════════════════════
// ⏰ نظام المهام المجدولة - فاطمة بوت v12.0
// يتضمن: إعادة تعيين يومي، ظهور وحوش، زعماء، موارد
// ═══════════════════════════════════════════════════════════════════════════════

import cron from 'node-cron';
import { getRpgData, saveDatabase, getDatabase } from './database.mjs';

let sockInstance = null;

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 تهيئة النظام
// ═══════════════════════════════════════════════════════════════════════════════

export const initScheduler = (sock) => {
  sockInstance = sock;
  console.log('⏰ تم تفعيل نظام المهام المجدولة');
  
  // بدء جميع المهام
  startDailyReset();
  startWeeklyReset();
  startMonsterSpawner();
  startBossSpawner();
  startResourceProduction();
  startStaminaRegen();
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📅 إعادة التعيين اليومي (12:00 صباحاً)
// ═══════════════════════════════════════════════════════════════════════════════

const startDailyReset = () => {
  // كل يوم في الساعة 00:00
  cron.schedule('0 0 * * *', async () => {
    console.log('🌅 إعادة تعيين يومية...');
    
    const rpgData = getRpgData();
    
    // إعادة تعيين طاقة جميع اللاعبين
    for (const player of Object.values(rpgData.players || {})) {
      player.stamina = player.maxStamina || 10;
      player.lastStaminaRegen = Date.now();
      
      // إعادة تعيين التوقيتات اليومية
      player.lastDaily = 0;
      player.lastWork = 0;
    }
    
    // إعادة تعيين المهام اليومية
    const { generateDailyQuests } = await import('./quests.mjs');
    for (const player of Object.values(rpgData.players || {})) {
      if (player.quests) {
        player.quests.daily = generateDailyQuests(player.level);
        player.quests.lastDailyReset = Date.now();
      }
    }
    
    saveDatabase();
    console.log('✅ تم إعادة التعيين اليومي');
    
    // إرسال إشعار للقناة
    if (sockInstance) {
      const db = getDatabase();
      const playersCount = Object.keys(rpgData.players || {}).length;
      
      // يمكن إرسال رسالة للمجموعات النشطة هنا
    }
  }, { timezone: 'Asia/Baghdad' });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📅 إعادة التعيين الأسبوعي (الأحد 12:00 صباحاً)
// ═══════════════════════════════════════════════════════════════════════════════

const startWeeklyReset = () => {
  // كل يوم أحد الساعة 00:00
  cron.schedule('0 0 * * 0', async () => {
    console.log('📅 إعادة تعيين أسبوعية...');
    
    const rpgData = getRpgData();
    
    // إعادة تعيين المهام الأسبوعية
    const { generateWeeklyQuests } = await import('./quests.mjs');
    for (const player of Object.values(rpgData.players || {})) {
      if (player.quests) {
        player.quests.weekly = generateWeeklyQuests(player.level);
        player.quests.lastWeeklyReset = Date.now();
      }
      
      // إعادة تعيين streak إذا فاته يوم
      if (player.dailyStreak) {
        player.dailyStreak = Math.max(0, player.dailyStreak - 1);
      }
    }
    
    // إعادة تعيين حروب الكلانات المنتهية
    for (const clan of Object.values(rpgData.clans || {})) {
      if (clan.wars?.currentWar?.endsAt < Date.now()) {
        clan.wars.currentWar = null;
      }
    }
    
    saveDatabase();
    console.log('✅ تم إعادة التعيين الأسبوعي');
  }, { timezone: 'Asia/Baghdad' });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 👹 ظهور الوحوش العشوائية (كل 4-6 ساعات)
// ═══════════════════════════════════════════════════════════════════════════════

const startMonsterSpawner = () => {
  // كل 4 ساعات
  cron.schedule('0 */4 * * *', async () => {
    if (!sockInstance) return;
    
    const rpgData = getRpgData();
    const db = getDatabase();
    
    // اختيار مجموعة عشوائية نشطة
    const activeGroups = Object.keys(db.groups || {});
    if (activeGroups.length === 0) return;
    
    const randomGroup = activeGroups[Math.floor(Math.random() * activeGroups.length)];
    
    // قائمة الوحوش النادرة
    const rareMonsters = [
      { name: 'ذئب أبيض', emoji: '🐺', level: 15, bonus: 2 },
      { name: 'عنكبوت عملاق', emoji: '🕷️', level: 20, bonus: 3 },
      { name: 'غول الكهف', emoji: '👹', level: 25, bonus: 4 },
      { name: 'تنين صغير', emoji: '🐲', level: 30, bonus: 5 }
    ];
    
    const monster = rareMonsters[Math.floor(Math.random() * rareMonsters.length)];
    
    // تخزين الوحش في بيانات المجموعة
    if (!rpgData.activeMonsters) rpgData.activeMonsters = {};
    rpgData.activeMonsters[randomGroup] = {
      ...monster,
      spawnedAt: Date.now(),
      expiresAt: Date.now() + 3600000 // ساعة واحدة
    };
    
    saveDatabase();
    
    // إرسال إشعار
    try {
      await sockInstance.sendMessage(randomGroup, {
        text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

👹 • • ✤ وحش نادر ظهر! ✤ • • 👹

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ ${monster.emoji} ${monster.name}
│ ⭐ المستوى: ${monster.level}
│ 💰 مكافأة إضافية: ${monster.bonus}x
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

⚔️ استخدم .هجوم لمحاربته!
⏰ سيختفي بعد ساعة واحدة

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`
      });
    } catch (e) {
      console.log('⚠️ لم نتمكن من إرسال إشعار الوحش');
    }
  }, { timezone: 'Asia/Baghdad' });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 👹 ظهور الزعماء الديناميكي (كل 6-12 ساعة)
// ═══════════════════════════════════════════════════════════════════════════════

const startBossSpawner = () => {
  // كل 6 ساعات
  cron.schedule('0 */6 * * *', async () => {
    if (!sockInstance) return;
    
    const rpgData = getRpgData();
    const db = getDatabase();
    
    // التحقق من عدم وجود زعيم نشط
    if (rpgData.activeBoss) return;
    
    // اختيار مجموعة عشوائية
    const activeGroups = Object.keys(db.groups || {});
    if (activeGroups.length === 0) return;
    
    const randomGroup = activeGroups[Math.floor(Math.random() * activeGroups.length)];
    
    // قائمة الزعماء
    const bosses = [
      { id: 'kaska', name: 'كاساكا', emoji: '🐍', type: 'بري', level: 50 },
      { id: 'orc_king', name: 'ملك الأورك', emoji: '👹', type: 'بري', level: 65 },
      { id: 'ant_king', name: 'بيرو - ملك النمل', emoji: '🐜', type: 'طائر', level: 75 },
      { id: 'igrys', name: 'إيغريس', emoji: '⚔️', type: 'أسطوري', level: 90 },
      { id: 'dragon', name: 'التنين الأحمر', emoji: '🐲', type: 'أسطوري', level: 100 }
    ];
    
    const boss = bosses[Math.floor(Math.random() * bosses.length)];
    
    // إنشاء الزعيم النشط
    rpgData.activeBoss = {
      ...boss,
      groupId: randomGroup,
      hp: boss.level * 1000,
      maxHp: boss.level * 1000,
      atk: Math.floor(boss.level * 5),
      def: Math.floor(boss.level * 3),
      participants: [],
      totalDamage: {},
      spawnedAt: Date.now(),
      registrationEnds: Date.now() + 600000, // 10 دقائق للتسجيل
      battleEnds: Date.now() + 1800000, // 30 دقيقة للمعركة
      phase: 'registration' // registration, battle, ended
    };
    
    saveDatabase();
    
    // إرسال إعلان التحذير
    try {
      await sockInstance.sendMessage(randomGroup, {
        text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

🚨 • • ✤ تحذير! زعيم يقترب! ✤ • • 🚨

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ ${boss.emoji} ${boss.name}
│ 🏷️ النوع: ${boss.type}
│ ⭐ المستوى: ${boss.level}
│ ❤️ HP: ${(boss.level * 1000).toLocaleString()}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

⚡ للتسجيل في المعركة:
اكتب .قتال_الزعيم

⏰ وقت التسجيل: 10 دقائق
⚔️ يستهلك 1 نقطة طاقة

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`,
        contextInfo: {
          externalAdReply: {
            title: `${boss.emoji} زعيم ظهر!`,
            body: `${boss.name} - المستوى ${boss.level}`,
            thumbnailUrl: 'https://files.catbox.moe/p4mtw3.jpg',
            sourceUrl: 'https://whatsapp.com/channel/0029VbCbgwIKgsNxh9vKb01n',
            mediaType: 1
          }
        }
      });
    } catch (e) {
      console.log('⚠️ لم نتمكن من إرسال إشعار الزعيم');
    }
  }, { timezone: 'Asia/Baghdad' });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🏭 إنتاج الموارد (كل ساعة)
// ═══════════════════════════════════════════════════════════════════════════════

const startResourceProduction = () => {
  // كل ساعة
  cron.schedule('0 * * * *', async () => {
    const rpgData = getRpgData();
    
    // إنتاج موارد الأقاليم
    if (rpgData.territories) {
      for (const [territoryId, territory] of Object.entries(rpgData.territories)) {
        if (territory.ownerClan && territory.production) {
          // إضافة الموارد لخزينة الكلان المالك
          const clan = rpgData.clans?.[territory.ownerClan];
          if (clan) {
            clan.resources = clan.resources || {};
            for (const [resource, amount] of Object.entries(territory.production)) {
              clan.resources[resource] = (clan.resources[resource] || 0) + amount;
            }
          }
        }
      }
    }
    
    // إنتاج موارد القرى الشخصية
    for (const player of Object.values(rpgData.players || {})) {
      if (player.village?.buildings) {
        const buildings = player.village.buildings;
        
        // إنتاج الذهب
        for (const mine of (buildings.goldMine || [])) {
          const production = getBuildingProduction('goldMine', mine.level);
          player.village.resources.gold = (player.village.resources.gold || 0) + production;
        }
        
        // إنتاج الإكسير
        for (const collector of (buildings.elixirCollector || [])) {
          const production = getBuildingProduction('elixirCollector', collector.level);
          player.village.resources.elixir = (player.village.resources.elixir || 0) + production;
        }
      }
    }
    
    saveDatabase();
  }, { timezone: 'Asia/Baghdad' });
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ تجديد الطاقة التدريجي (كل ساعة)
// ═══════════════════════════════════════════════════════════════════════════════

const startStaminaRegen = () => {
  // كل ساعة
  cron.schedule('0 * * * *', async () => {
    const rpgData = getRpgData();
    
    for (const player of Object.values(rpgData.players || {})) {
      // تجديد 1 نقطة طاقة كل ساعة (بدلاً من كل 24 ساعة)
      if (player.stamina < (player.maxStamina || 10)) {
        player.stamina = Math.min(player.maxStamina || 10, player.stamina + 1);
      }
      
      // تجديد HP تدريجياً
      if (player.hp < player.maxHp) {
        const regen = Math.floor(player.maxHp * 0.05); // 5% كل ساعة
        player.hp = Math.min(player.maxHp, player.hp + regen);
      }
    }
    
    saveDatabase();
  }, { timezone: 'Asia/Baghdad' });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════════════

const getBuildingProduction = (type, level) => {
  const baseProduction = {
    goldMine: 50,
    elixirCollector: 30,
    lumberCamp: 20,
    stoneQuarry: 15
  };
  
  return Math.floor((baseProduction[type] || 10) * (1 + (level - 1) * 0.5));
};

// التحقق من انتهاء المعارك والأحداث
export const checkExpiredEvents = () => {
  const rpgData = getRpgData();
  const now = Date.now();
  
  // التحقق من الزعماء المنتهين
  if (rpgData.activeBoss && rpgData.activeBoss.battleEnds < now) {
    // حساب النتائج
    const boss = rpgData.activeBoss;
    
    if (boss.hp > 0) {
      // الزعيم نجا
      console.log(`👹 الزعيم ${boss.name} نجا!`);
    } else {
      // الزعيم هُزم - توزيع الجوائز
      console.log(`🏆 الزعيم ${boss.name} هُزم!`);
    }
    
    rpgData.activeBoss = null;
  }
  
  // التحقق من الوحوش المنتهية
  if (rpgData.activeMonsters) {
    for (const [groupId, monster] of Object.entries(rpgData.activeMonsters)) {
      if (monster.expiresAt < now) {
        delete rpgData.activeMonsters[groupId];
      }
    }
  }
  
  // التحقق من الحروب المنتهية
  for (const clan of Object.values(rpgData.clans || {})) {
    if (clan.wars?.currentWar?.endsAt < now) {
      // حساب نتائج الحرب
      const war = clan.wars.currentWar;
      // ... منطق إنهاء الحرب
      clan.wars.currentWar = null;
    }
  }
  
  saveDatabase();
};

export default {
  initScheduler,
  checkExpiredEvents
};
