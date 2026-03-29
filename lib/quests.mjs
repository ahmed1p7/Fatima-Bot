// ═══════════════════════════════════════════════════════════════════════════════
// 📜 نظام المهام والإنجازات - فاطمة بوت v11.0 (محدث)
// يتضمن: مهام يومية، أسبوعية، شهرية، إنجازات مع حفظ تلقائي
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 أنواع المهام
// ═══════════════════════════════════════════════════════════════════════════════

export const QUEST_TYPES = {
  // مهام موارد
  GATHER_GOLD: { id: 'gather_gold', name: 'جمع الذهب', emoji: '💰', category: 'موارد' },
  GATHER_WOOD: { id: 'gather_wood', name: 'جمع الخشب', emoji: '🪵', category: 'موارد' },
  GATHER_STONE: { id: 'gather_stone', name: 'جمع الحجر', emoji: '🪨', category: 'موارد' },
  
  // مهام قتال
  KILL_MONSTERS: { id: 'kill_monsters', name: 'قتال الوحوش', emoji: '⚔️', category: 'قتال' },
  DEFEAT_BOSSES: { id: 'defeat_bosses', name: 'هزيمة الزعماء', emoji: '👹', category: 'قتال' },
  WIN_PVP: { id: 'win_pvp', name: 'انتصارات PvP', emoji: '🏆', category: 'قتال' },
  
  // مهام اجتماعية
  DONATE_GOLD: { id: 'donate_gold', name: 'التبرع بالذهب', emoji: '🎁', category: 'اجتماعي' },
  DONATE_ELIXIR: { id: 'donate_elixir', name: 'التبرع بالإكسير', emoji: '⚗️', category: 'اجتماعي' },
  HEAL_PLAYERS: { id: 'heal_players', name: 'علاج اللاعبين', emoji: '💚', category: 'اجتماعي' },
  
  // مهام خاصة
  FISHING: { id: 'fishing', name: 'الصيد', emoji: '🎣', category: 'خاص' },
  MINING: { id: 'mining', name: 'التعدين', emoji: '⛏️', category: 'خاص' },
  OPEN_BOXES: { id: 'open_boxes', name: 'فتح الصناديق', emoji: '📦', category: 'خاص' }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 قوالب المهام
// ═══════════════════════════════════════════════════════════════════════════════

const DAILY_QUEST_TEMPLATES = [
  { type: QUEST_TYPES.KILL_MONSTERS, targets: [3, 5, 7], rewards: { gold: [50, 100, 150], xp: [30, 60, 100] } },
  { type: QUEST_TYPES.GATHER_GOLD, targets: [200, 500, 1000], rewards: { gold: [50, 100, 200], xp: [40, 80, 150] } },
  { type: QUEST_TYPES.FISHING, targets: [3, 5, 10], rewards: { gold: [30, 60, 100], xp: [20, 40, 70] } },
  { type: QUEST_TYPES.MINING, targets: [2, 4, 6], rewards: { gold: [40, 80, 120], xp: [25, 50, 80] } },
  { type: QUEST_TYPES.OPEN_BOXES, targets: [1, 2, 3], rewards: { gold: [100, 200, 300], xp: [50, 100, 150] } },
  { type: QUEST_TYPES.HEAL_PLAYERS, targets: [1, 2, 3], rewards: { gold: [80, 150, 250], xp: [60, 120, 200] } },
  { type: QUEST_TYPES.DONATE_GOLD, targets: [100, 250, 500], rewards: { gold: [50, 100, 200], xp: [80, 150, 250] } }
];

const WEEKLY_QUEST_TEMPLATES = [
  { type: QUEST_TYPES.KILL_MONSTERS, targets: [20, 35, 50], rewards: { gold: [300, 600, 1000], xp: [200, 400, 700] } },
  { type: QUEST_TYPES.DEFEAT_BOSSES, targets: [1, 2, 3], rewards: { gold: [500, 1000, 2000], xp: [300, 600, 1000] } },
  { type: QUEST_TYPES.WIN_PVP, targets: [3, 5, 10], rewards: { gold: [200, 400, 800], xp: [150, 300, 500] } },
  { type: QUEST_TYPES.GATHER_GOLD, targets: [2000, 5000, 10000], rewards: { gold: [500, 1000, 2000], xp: [300, 600, 1000] } }
];

const MONTHLY_QUEST_TEMPLATES = [
  { type: QUEST_TYPES.DEFEAT_BOSSES, targets: [5, 10, 15], rewards: { gold: [2000, 5000, 10000], xp: [1000, 2500, 5000] } },
  { type: QUEST_TYPES.KILL_MONSTERS, targets: [100, 200, 300], rewards: { gold: [1500, 3000, 6000], xp: [800, 1600, 3200] } },
  { type: QUEST_TYPES.WIN_PVP, targets: [20, 40, 60], rewards: { gold: [1000, 2500, 5000], xp: [600, 1200, 2400] } }
];

// ═══════════════════════════════════════════════════════════════════════════════
// 🏅 تعريفات الإنجازات
// ═══════════════════════════════════════════════════════════════════════════════

export const ACHIEVEMENTS = [
  // إنجازات القتال
  { id: 'first_kill', name: 'الدم الأول', emoji: '🩸', description: 'اقتل أول وحش', requirement: { type: 'monstersKilled', value: 1 }, reward: { gold: 100, xp: 50 } },
  { id: 'monster_hunter', name: 'صائد الوحوش', emoji: '⚔️', description: 'اقتل 50 وحش', requirement: { type: 'monstersKilled', value: 50 }, reward: { gold: 500, xp: 300 } },
  { id: 'monster_slayer', name: 'قاتل الوحوش', emoji: '💀', description: 'اقتل 200 وحش', requirement: { type: 'monstersKilled', value: 200 }, reward: { gold: 2000, xp: 1500 } },
  { id: 'monster_legend', name: 'أسطورة الصيد', emoji: '🏆', description: 'اقتل 1000 وحش', requirement: { type: 'monstersKilled', value: 1000 }, reward: { gold: 10000, xp: 8000 } },
  
  // إنجازات الزعماء
  { id: 'boss_slayer', name: 'قاتل الزعماء', emoji: '👹', description: 'اهزم زعيماً واحداً', requirement: { type: 'bossesDefeated', value: 1 }, reward: { gold: 1000, xp: 500 } },
  { id: 'boss_hunter', name: 'صائد الزعماء', emoji: '🎯', description: 'اهزم 10 زعماء', requirement: { type: 'bossesDefeated', value: 10 }, reward: { gold: 5000, xp: 3000 } },
  { id: 'boss_master', name: 'سيد الزعماء', emoji: '👑', description: 'اهزم 50 زعيماً', requirement: { type: 'bossesDefeated', value: 50 }, reward: { gold: 25000, xp: 15000 } },
  
  // إنجازات المستوى
  { id: 'level_10', name: 'المبتدئ', emoji: '🌟', description: 'اوصل مستوى 10', requirement: { type: 'level', value: 10 }, reward: { gold: 500, xp: 0 } },
  { id: 'level_25', name: 'المحارب', emoji: '⚔️', description: 'اوصل مستوى 25', requirement: { type: 'level', value: 25 }, reward: { gold: 2000, xp: 0 } },
  { id: 'level_50', name: 'البطل', emoji: '🏆', description: 'اوصل مستوى 50', requirement: { type: 'level', value: 50 }, reward: { gold: 10000, xp: 0 } },
  { id: 'level_100', name: 'الأسطورة', emoji: '👑', description: 'اوصل مستوى 100', requirement: { type: 'level', value: 100 }, reward: { gold: 100000, xp: 0 } },
  
  // إنجازات PvP
  { id: 'first_pvp', name: 'أول انتصار', emoji: '⚔️', description: 'انتصر في معركة PvP', requirement: { type: 'wins', value: 1 }, reward: { gold: 200, xp: 100 } },
  { id: 'pvp_warrior', name: 'محارب PvP', emoji: '🛡️', description: 'انتصر 10 مرات', requirement: { type: 'wins', value: 10 }, reward: { gold: 1000, xp: 500 } },
  { id: 'pvp_champion', name: 'بطل PvP', emoji: '🏆', description: 'انتصر 50 مرة', requirement: { type: 'wins', value: 50 }, reward: { gold: 5000, xp: 3000 } },
  
  // إنجازات الشافي
  { id: 'healer_novice', name: 'الشافي المبتدئ', emoji: '💚', description: 'عالج 10 لاعبين', requirement: { type: 'playersHealed', value: 10 }, reward: { gold: 500, xp: 300 } },
  { id: 'healer_master', name: 'سيد الشفاء', emoji: '💖', description: 'عالج 100 لاعب', requirement: { type: 'playersHealed', value: 100 }, reward: { gold: 5000, xp: 3000 } },
  
  // إنجازات الذهب
  { id: 'rich', name: 'الثري', emoji: '💰', description: 'اجمع 10000 ذهب', requirement: { type: 'totalGold', value: 10000 }, reward: { gold: 1000, xp: 500 } },
  { id: 'millionaire', name: 'المليونير', emoji: '💎', description: 'اجمع 100000 ذهب', requirement: { type: 'totalGold', value: 100000 }, reward: { gold: 10000, xp: 5000 } }
];

// ═══════════════════════════════════════════════════════════════════════════════
// 🎲 توليد مهام عشوائية
// ═══════════════════════════════════════════════════════════════════════════════

export const generateDailyQuests = (playerLevel) => {
  const quests = [];
  const numQuests = 3 + Math.floor(Math.random() * 3); // 3-5 مهام
  
  const shuffled = [...DAILY_QUEST_TEMPLATES].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < Math.min(numQuests, shuffled.length); i++) {
    const template = shuffled[i];
    const difficultyIndex = Math.min(Math.floor(playerLevel / 10), 2);
    
    quests.push({
      id: `daily_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
      type: template.type,
      target: template.targets[difficultyIndex],
      progress: 0,
      completed: false,
      claimed: false,
      rewards: {
        gold: template.rewards.gold[difficultyIndex],
        xp: template.rewards.xp[difficultyIndex]
      },
      expiresAt: getNextDailyReset()
    });
  }
  
  return quests;
};

export const generateWeeklyQuests = (playerLevel) => {
  const quests = [];
  const numQuests = 2 + Math.floor(Math.random() * 2); // 2-3 مهام
  
  const shuffled = [...WEEKLY_QUEST_TEMPLATES].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < Math.min(numQuests, shuffled.length); i++) {
    const template = shuffled[i];
    const difficultyIndex = Math.min(Math.floor(playerLevel / 20), 2);
    
    quests.push({
      id: `weekly_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
      type: template.type,
      target: template.targets[difficultyIndex],
      progress: 0,
      completed: false,
      claimed: false,
      rewards: {
        gold: template.rewards.gold[difficultyIndex],
        xp: template.rewards.xp[difficultyIndex]
      },
      expiresAt: getNextWeeklyReset()
    });
  }
  
  return quests;
};

export const generateMonthlyQuests = (playerLevel) => {
  const quests = [];
  const numQuests = 1 + Math.floor(Math.random() * 2); // 1-2 مهام
  
  const shuffled = [...MONTHLY_QUEST_TEMPLATES].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < Math.min(numQuests, shuffled.length); i++) {
    const template = shuffled[i];
    const difficultyIndex = Math.min(Math.floor(playerLevel / 30), 2);
    
    quests.push({
      id: `monthly_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
      type: template.type,
      target: template.targets[difficultyIndex],
      progress: 0,
      completed: false,
      claimed: false,
      rewards: {
        gold: template.rewards.gold[difficultyIndex],
        xp: template.rewards.xp[difficultyIndex]
      },
      expiresAt: getNextMonthlyReset()
    });
  }
  
  return quests;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⏰ أوقات إعادة التعيين
// ═══════════════════════════════════════════════════════════════════════════════

const getNextDailyReset = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
};

const getNextWeeklyReset = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
  const sunday = new Date(now);
  sunday.setDate(sunday.getDate() + daysUntilSunday);
  sunday.setHours(0, 0, 0, 0);
  return sunday.getTime();
};

const getNextMonthlyReset = () => {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  nextMonth.setHours(0, 0, 0, 0);
  return nextMonth.getTime();
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 الحصول على مهام اللاعب (مع إعادة تعيين تلقائي وحفظ)
// ═══════════════════════════════════════════════════════════════════════════════

export const getPlayerQuests = (player, autoSave = true) => {
  const now = Date.now();
  let changed = false;
  
  // تهيئة المهام إذا لم تكن موجودة
  if (!player.quests) {
    player.quests = {
      daily: generateDailyQuests(player.level),
      weekly: generateWeeklyQuests(player.level),
      monthly: generateMonthlyQuests(player.level),
      lastDailyReset: now,
      lastWeeklyReset: now,
      lastMonthlyReset: now
    };
    changed = true;
  } else {
    // إزالة المهام المنتهية (غير المطالب بها)
    const oldDailyCount = player.quests.daily?.length || 0;
    const oldWeeklyCount = player.quests.weekly?.length || 0;
    const oldMonthlyCount = player.quests.monthly?.length || 0;
    
    if (player.quests.daily) player.quests.daily = player.quests.daily.filter(q => q.expiresAt > now);
    if (player.quests.weekly) player.quests.weekly = player.quests.weekly.filter(q => q.expiresAt > now);
    if (player.quests.monthly) player.quests.monthly = player.quests.monthly.filter(q => q.expiresAt > now);
    
    if ((player.quests.daily?.length || 0) !== oldDailyCount) changed = true;
    if ((player.quests.weekly?.length || 0) !== oldWeeklyCount) changed = true;
    if ((player.quests.monthly?.length || 0) !== oldMonthlyCount) changed = true;
    
    // إعادة التعيين اليومي
    if (!player.quests.lastDailyReset || now > player.quests.lastDailyReset + 24 * 60 * 60 * 1000) {
      player.quests.daily = generateDailyQuests(player.level);
      player.quests.lastDailyReset = now;
      changed = true;
    }
    
    // إعادة التعيين الأسبوعي
    if (!player.quests.lastWeeklyReset || now > player.quests.lastWeeklyReset + 7 * 24 * 60 * 60 * 1000) {
      player.quests.weekly = generateWeeklyQuests(player.level);
      player.quests.lastWeeklyReset = now;
      changed = true;
    }
    
    // إعادة التعيين الشهري
    if (!player.quests.lastMonthlyReset || now > player.quests.lastMonthlyReset + 30 * 24 * 60 * 60 * 1000) {
      player.quests.monthly = generateMonthlyQuests(player.level);
      player.quests.lastMonthlyReset = now;
      changed = true;
    }
  }
  
  // التأكد من وجود المهام (fallback)
  if (!player.quests.daily) player.quests.daily = [];
  if (!player.quests.weekly) player.quests.weekly = [];
  if (!player.quests.monthly) player.quests.monthly = [];
  
  if (changed && autoSave) {
    saveDatabase();
  }
  
  return player.quests;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 تحديث تقدم المهام
// ═══════════════════════════════════════════════════════════════════════════════

export const updateQuestProgress = (player, questType, amount = 1, autoSave = true) => {
  const quests = getPlayerQuests(player, false); // لا نحفظ هنا لتجنب الحفظ المزدوج
  let updated = false;
  
  // تحديث المهام اليومية
  for (const quest of quests.daily) {
    if (quest.type.id === questType && !quest.completed) {
      const newProgress = Math.min(quest.progress + amount, quest.target);
      if (newProgress !== quest.progress) {
        quest.progress = newProgress;
        if (quest.progress >= quest.target) {
          quest.completed = true;
        }
        updated = true;
      }
    }
  }
  
  // تحديث المهام الأسبوعية
  for (const quest of quests.weekly) {
    if (quest.type.id === questType && !quest.completed) {
      const newProgress = Math.min(quest.progress + amount, quest.target);
      if (newProgress !== quest.progress) {
        quest.progress = newProgress;
        if (quest.progress >= quest.target) {
          quest.completed = true;
        }
        updated = true;
      }
    }
  }
  
  // تحديث المهام الشهرية
  for (const quest of quests.monthly) {
    if (quest.type.id === questType && !quest.completed) {
      const newProgress = Math.min(quest.progress + amount, quest.target);
      if (newProgress !== quest.progress) {
        quest.progress = newProgress;
        if (quest.progress >= quest.target) {
          quest.completed = true;
        }
        updated = true;
      }
    }
  }
  
  if (updated && autoSave) {
    saveDatabase();
  }
  
  return updated;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎁 المطالبة بمكافأة مهمة
// ═══════════════════════════════════════════════════════════════════════════════

export const claimQuestReward = (player, questId, autoSave = true) => {
  const quests = getPlayerQuests(player, false);
  
  // البحث في اليومية
  let quest = quests.daily.find(q => q.id === questId);
  let questType = 'daily';
  
  if (!quest) {
    quest = quests.weekly.find(q => q.id === questId);
    questType = 'weekly';
  }
  
  if (!quest) {
    quest = quests.monthly.find(q => q.id === questId);
    questType = 'monthly';
  }
  
  if (!quest) {
    return { success: false, message: '❌ المهمة غير موجودة!' };
  }
  
  if (!quest.completed) {
    return { success: false, message: '❌ المهمة لم تكتمل بعد!' };
  }
  
  if (quest.claimed) {
    return { success: false, message: '❌ تم المطالبة بهذه المكافأة بالفعل!' };
  }
  
  // منح المكافأة
  quest.claimed = true;
  player.gold = (player.gold || 0) + quest.rewards.gold;
  player.xp = (player.xp || 0) + quest.rewards.xp;
  
  if (autoSave) {
    saveDatabase();
  }
  
  return {
    success: true,
    message: `🎁 تم المطالبة بمكافأة "${quest.type.name}"!`,
    rewards: quest.rewards
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🏅 التحقق من الإنجازات
// ═══════════════════════════════════════════════════════════════════════════════

export const checkAchievements = (player, autoSave = true) => {
  const newAchievements = [];
  const now = Date.now();
  
  // تهيئة قائمة الإنجازات إذا لم تكن موجودة
  if (!player.achievements) {
    player.achievements = [];
  }
  
  for (const achievement of ACHIEVEMENTS) {
    // التحقق إذا كان اللاعب يملك الإنجاز بالفعل
    if (player.achievements.some(a => a.id === achievement.id)) {
      continue;
    }
    
    // التحقق من المتطلبات
    let currentValue = 0;
    
    switch (achievement.requirement.type) {
      case 'monstersKilled':
        currentValue = player.stats?.monstersKilled || 0;
        break;
      case 'bossesDefeated':
        currentValue = player.stats?.bossesDefeated || 0;
        break;
      case 'level':
        currentValue = player.level || 1;
        break;
      case 'wins':
        currentValue = player.wins || 0;
        break;
      case 'playersHealed':
        currentValue = player.stats?.playersHealed || 0;
        break;
      case 'totalGold':
        currentValue = player.gold || 0;
        break;
    }
    
    // إذا تحقق الإنجاز
    if (currentValue >= achievement.requirement.value) {
      player.achievements.push({
        id: achievement.id,
        unlockedAt: now
      });
      
      // منح المكافأة
      player.gold = (player.gold || 0) + achievement.reward.gold;
      player.xp = (player.xp || 0) + achievement.reward.xp;
      
      newAchievements.push(achievement);
    }
  }
  
  if (newAchievements.length && autoSave) {
    saveDatabase();
  }
  
  return newAchievements;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 تنسيق عرض المهام (للاستخدام في plugins)
// ═══════════════════════════════════════════════════════════════════════════════

export const formatQuests = (player) => {
  const quests = getPlayerQuests(player, false); // لا نحفظ هنا فقط نعرض
  
  let text = `📜 ═══════ المهام ═══════ 📜\n\n`;
  
  // المهام اليومية
  text += `📅 المهام اليومية:\n`;
  text += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
  
  if (quests.daily.length === 0) {
    text += `   ✅ جميع المهام مكتملة!\n`;
  } else {
    for (const quest of quests.daily) {
      const status = quest.completed ? '✅' : '⏳';
      const filled = Math.floor((quest.progress / quest.target) * 5);
      const progressBar = '▓'.repeat(filled) + '░'.repeat(5 - filled);
      
      text += `${status} ${quest.type.emoji} ${quest.type.name}\n`;
      text += `   [${progressBar}] ${quest.progress}/${quest.target}\n`;
      text += `   💰 ${quest.rewards.gold} | ⭐ ${quest.rewards.xp}\n`;
      
      if (quest.completed && !quest.claimed) {
        const shortId = quest.id.slice(-8);
        text += `   🎁 استخدم .مطالبة ${shortId}\n`;
      }
      text += `\n`;
    }
  }
  
  // المهام الأسبوعية
  text += `\n📆 المهام الأسبوعية:\n`;
  text += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
  
  if (quests.weekly.length === 0) {
    text += `   ✅ جميع المهام مكتملة!\n`;
  } else {
    for (const quest of quests.weekly) {
      const status = quest.completed ? '✅' : '⏳';
      const filled = Math.floor((quest.progress / quest.target) * 5);
      const progressBar = '▓'.repeat(filled) + '░'.repeat(5 - filled);
      
      text += `${status} ${quest.type.emoji} ${quest.type.name}\n`;
      text += `   [${progressBar}] ${quest.progress}/${quest.target}\n`;
      text += `   💰 ${quest.rewards.gold} | ⭐ ${quest.rewards.xp}\n`;
      
      if (quest.completed && !quest.claimed) {
        const shortId = quest.id.slice(-8);
        text += `   🎁 استخدم .مطالبة ${shortId}\n`;
      }
      text += `\n`;
    }
  }
  
  // المهام الشهرية
  if (quests.monthly && quests.monthly.length > 0) {
    text += `\n📅 المهام الشهرية:\n`;
    text += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
    
    for (const quest of quests.monthly) {
      const status = quest.completed ? '✅' : '⏳';
      const filled = Math.floor((quest.progress / quest.target) * 5);
      const progressBar = '▓'.repeat(filled) + '░'.repeat(5 - filled);
      
      text += `${status} ${quest.type.emoji} ${quest.type.name}\n`;
      text += `   [${progressBar}] ${quest.progress}/${quest.target}\n`;
      text += `   💰 ${quest.rewards.gold} | ⭐ ${quest.rewards.xp}\n`;
      
      if (quest.completed && !quest.claimed) {
        const shortId = quest.id.slice(-8);
        text += `   🎁 استخدم .مطالبة ${shortId}\n`;
      }
      text += `\n`;
    }
  }
  
  // الوقت المتبقي
  const now = Date.now();
  const dailyRemaining = (quests.lastDailyReset || now) + 24 * 60 * 60 * 1000 - now;
  const weeklyRemaining = (quests.lastWeeklyReset || now) + 7 * 24 * 60 * 60 * 1000 - now;
  const monthlyRemaining = (quests.lastMonthlyReset || now) + 30 * 24 * 60 * 60 * 1000 - now;
  
  const formatTime = (ms) => {
    if (ms <= 0) return 'منتهية';
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}س ${mins}د`;
  };
  
  text += `\n⏰ إعادة التعيين اليومي: ${formatTime(dailyRemaining)}`;
  text += `\n⏰ إعادة التعيين الأسبوعي: ${formatTime(weeklyRemaining)}`;
  text += `\n⏰ إعادة التعيين الشهري: ${formatTime(monthlyRemaining)}`;
  
  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🏅 تنسيق عرض الإنجازات
// ═══════════════════════════════════════════════════════════════════════════════

export const formatAchievements = (player) => {
  const unlockedIds = player.achievements?.map(a => a.id) || [];
  
  let text = `🏅 ═══════ الإنجازات ═══════ 🏅\n\n`;
  text += `📊 مكتمل: ${unlockedIds.length}/${ACHIEVEMENTS.length}\n\n`;
  
  // الإنجازات المكتملة
  text += `✅ مكتملة:\n`;
  text += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
  
  const completed = ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id));
  if (completed.length === 0) {
    text += `   لا توجد إنجازات مكتملة بعد\n`;
  } else {
    for (const achievement of completed) {
      text += `${achievement.emoji} ${achievement.name}\n`;
      text += `   ${achievement.description}\n\n`;
    }
  }
  
  // الإنجازات غير المكتملة (أقرب 5)
  text += `\n🔒 غير مكتملة (أقرب 5):\n`;
  text += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
  
  const notCompleted = ACHIEVEMENTS.filter(a => !unlockedIds.includes(a.id)).slice(0, 5);
  for (const achievement of notCompleted) {
    text += `${achievement.emoji} ${achievement.name}\n`;
    text += `   ${achievement.description}\n\n`;
  }
  
  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 تنسيق التقدم العام
// ═══════════════════════════════════════════════════════════════════════════════

export const formatProgress = (player) => {
  const unlockedIds = player.achievements?.map(a => a.id) || [];
  
  let text = `📊 ═══════ التقدم ═══════ 📊\n\n`;
  
  text += `👤 ${player.name}\n`;
  text += `⭐ المستوى: ${player.level}\n\n`;
  
  text += `📈 الإحصائيات:\n`;
  text += `   ⚔️ وحوش مقتولة: ${player.stats?.monstersKilled || 0}\n`;
  text += `   👹 زعماء مهزومين: ${player.stats?.bossesDefeated || 0}\n`;
  text += `   🏆 انتصارات: ${player.wins || 0}\n`;
  text += `   ❌ خسائر: ${player.losses || 0}\n`;
  text += `   🎣 سمك: ${player.stats?.fishCaught || 0}\n`;
  text += `   ⛏️ تعدين: ${player.stats?.mineralsMined || 0}\n`;
  text += `   📦 صناديق: ${player.stats?.boxesOpened || 0}\n`;
  
  if (player.stats?.playersHealed > 0) {
    text += `   💚 لاعبين تم علاجهم: ${player.stats.playersHealed}\n`;
  }
  
  text += `\n🏅 الإنجازات: ${unlockedIds.length}/${ACHIEVEMENTS.length}`;
  
  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 دوال إضافية للتوافق مع plugins/quests.mjs
// ═══════════════════════════════════════════════════════════════════════════════

// إنشاء مهام اللاعب (تهيئة أولية)
export const createPlayerQuests = (playerLevel = 1) => {
  return {
    daily: generateDailyQuests(playerLevel),
    weekly: generateWeeklyQuests(playerLevel),
    monthly: generateMonthlyQuests(playerLevel),
    lastDailyReset: Date.now(),
    lastWeeklyReset: Date.now(),
    lastMonthlyReset: Date.now()
  };
};

// إعادة تعيين المهام المنتهية (مع حفظ)
export const resetExpiredQuests = (player, autoSave = true) => {
  if (!player.quests) return;
  
  const now = Date.now();
  let changed = false;
  
  // إزالة المهام المنتهية
  const oldDaily = player.quests.daily?.length || 0;
  const oldWeekly = player.quests.weekly?.length || 0;
  const oldMonthly = player.quests.monthly?.length || 0;
  
  if (player.quests.daily) player.quests.daily = player.quests.daily.filter(q => q.expiresAt > now);
  if (player.quests.weekly) player.quests.weekly = player.quests.weekly.filter(q => q.expiresAt > now);
  if (player.quests.monthly) player.quests.monthly = player.quests.monthly.filter(q => q.expiresAt > now);
  
  if ((player.quests.daily?.length || 0) !== oldDaily) changed = true;
  if ((player.quests.weekly?.length || 0) !== oldWeekly) changed = true;
  if ((player.quests.monthly?.length || 0) !== oldMonthly) changed = true;
  
  // إعادة التعيين اليومي
  if (now > (player.quests.lastDailyReset || 0) + 24 * 60 * 60 * 1000) {
    player.quests.daily = generateDailyQuests(player.level);
    player.quests.lastDailyReset = now;
    changed = true;
  }
  
  // إعادة التعيين الأسبوعي
  if (now > (player.quests.lastWeeklyReset || 0) + 7 * 24 * 60 * 60 * 1000) {
    player.quests.weekly = generateWeeklyQuests(player.level);
    player.quests.lastWeeklyReset = now;
    changed = true;
  }
  
  // إعادة التعيين الشهري
  if (now > (player.quests.lastMonthlyReset || 0) + 30 * 24 * 60 * 60 * 1000) {
    player.quests.monthly = generateMonthlyQuests(player.level);
    player.quests.lastMonthlyReset = now;
    changed = true;
  }
  
  if (changed && autoSave) {
    saveDatabase();
  }
};

// تنسيق عرض المهام (alias للـ plugins)
export const formatQuestsDisplay = formatQuests;

// تنسيق عرض الإنجازات (alias)
export const formatAchievementsDisplay = formatAchievements;

// الحصول على إحصائيات المهام
export const getQuestStats = (player) => {
  const quests = player.quests || { daily: [], weekly: [], monthly: [], achievements: [] };
  
  return {
    dailyTotal: quests.daily?.length || 0,
    dailyCompleted: quests.daily?.filter(q => q.completed).length || 0,
    dailyClaimed: quests.daily?.filter(q => q.claimed).length || 0,
    weeklyTotal: quests.weekly?.length || 0,
    weeklyCompleted: quests.weekly?.filter(q => q.completed).length || 0,
    weeklyClaimed: quests.weekly?.filter(q => q.claimed).length || 0,
    monthlyTotal: quests.monthly?.length || 0,
    monthlyCompleted: quests.monthly?.filter(q => q.completed).length || 0,
    monthlyClaimed: quests.monthly?.filter(q => q.claimed).length || 0,
    achievementsTotal: ACHIEVEMENTS.length,
    achievementsCompleted: (player.achievements || []).length
  };
};

// تصدير الثوابت للاستخدام في أماكن أخرى
export { DAILY_QUEST_TEMPLATES, WEEKLY_QUEST_TEMPLATES, MONTHLY_QUEST_TEMPLATES };
