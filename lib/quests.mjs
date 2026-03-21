// ═══════════════════════════════════════════════════════════════════════════════
// 📜 نظام المهام (Quests)
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 تعريفات المهام
// ═══════════════════════════════════════════════════════════════════════════════

export const DAILY_QUESTS = [
  {
    id: 'daily_kill_5',
    name: 'صياد الوحوش',
    description: 'اقتل 5 وحوش',
    emoji: '🗡️',
    type: 'kill',
    target: 5,
    rewards: { xp: 100, gold: 200 },
    difficulty: 'easy'
  },
  {
    id: 'daily_kill_10',
    name: 'مطارد الوحوش',
    description: 'اقتل 10 وحوش',
    emoji: '⚔️',
    type: 'kill',
    target: 10,
    rewards: { xp: 250, gold: 500 },
    difficulty: 'medium'
  },
  {
    id: 'daily_fish_3',
    name: 'صياد السمك',
    description: 'اصطد 3 مرات',
    emoji: '🎣',
    type: 'fish',
    target: 3,
    rewards: { xp: 50, gold: 100 },
    difficulty: 'easy'
  },
  {
    id: 'daily_mine_3',
    name: 'عامل المنجم',
    description: 'اجمع المعادن 3 مرات',
    emoji: '⛏️',
    type: 'mine',
    target: 3,
    rewards: { xp: 50, gold: 150 },
    difficulty: 'easy'
  },
  {
    id: 'daily_work_3',
    name: 'العامل المجتهد',
    description: 'اعمل 3 مرات',
    emoji: '💼',
    type: 'work',
    target: 3,
    rewards: { xp: 30, gold: 100 },
    difficulty: 'easy'
  },
  {
    id: 'daily_pvp_2',
    name: 'المحارب',
    description: 'تحدي لاعبين 2 مرات',
    emoji: '⚔️',
    type: 'pvp',
    target: 2,
    rewards: { xp: 200, gold: 300 },
    difficulty: 'medium'
  },
  {
    id: 'daily_win_pvp',
    name: 'المنتصر',
    description: 'انتصر في قتال PvP',
    emoji: '🏆',
    type: 'pvp_win',
    target: 1,
    rewards: { xp: 300, gold: 500 },
    difficulty: 'hard'
  },
  {
    id: 'daily_open_box',
    name: 'فاتح الصناديق',
    description: 'افتح صندوق واحد',
    emoji: '📦',
    type: 'open_box',
    target: 1,
    rewards: { xp: 50, gold: 100 },
    difficulty: 'easy'
  },
  {
    id: 'daily_upgrade_weapon',
    name: 'الحداد',
    description: 'طوّر سلاح مرة واحدة',
    emoji: '🔨',
    type: 'upgrade',
    target: 1,
    rewards: { xp: 100, gold: 200 },
    difficulty: 'medium'
  },
  {
    id: 'daily_donate_clan',
    name: 'الداعم',
    description: 'تبرع 500 ذهب للكلان',
    emoji: '💰',
    type: 'donate',
    target: 500,
    rewards: { xp: 150, gold: 300 },
    difficulty: 'medium',
    requirement: 'clan'
  }
];

export const WEEKLY_QUESTS = [
  {
    id: 'weekly_kill_50',
    name: 'سفاح الوحوش',
    description: 'اقتل 50 وحشاً',
    emoji: '💀',
    type: 'kill',
    target: 50,
    rewards: { xp: 1000, gold: 2000 },
    difficulty: 'medium'
  },
  {
    id: 'weekly_kill_100',
    name: 'الصياد الأسطوري',
    description: 'اقتل 100 وحش',
    emoji: '🐉',
    type: 'kill',
    target: 100,
    rewards: { xp: 2500, gold: 5000, skillPoint: 1 },
    difficulty: 'hard'
  },
  {
    id: 'weekly_pvp_10',
    name: 'محارب الأسبوع',
    description: 'شارك في 10 تحديات PvP',
    emoji: '⚔️',
    type: 'pvp',
    target: 10,
    rewards: { xp: 1500, gold: 3000 },
    difficulty: 'medium'
  },
  {
    id: 'weekly_win_pvp_5',
    name: 'بطل الحلبة',
    description: 'انتصر في 5 معارك PvP',
    emoji: '🏆',
    type: 'pvp_win',
    target: 5,
    rewards: { xp: 3000, gold: 6000, skillPoint: 1 },
    difficulty: 'hard'
  },
  {
    id: 'weekly_boss_3',
    name: 'قاتل الزعماء',
    description: 'شارك في هزيمة 3 زعماء',
    emoji: '👹',
    type: 'boss_kill',
    target: 3,
    rewards: { xp: 2000, gold: 4000 },
    difficulty: 'hard'
  },
  {
    id: 'weekly_collect_resources',
    name: 'جامع الموارد',
    description: 'اجمع 5000 مورد',
    emoji: '📦',
    type: 'collect_resources',
    target: 5000,
    rewards: { xp: 800, gold: 1500 },
    difficulty: 'medium'
  },
  {
    id: 'weekly_clan_war',
    name: 'محارب الكلان',
    description: 'شارك في حرب كلان',
    emoji: '🏰',
    type: 'clan_war',
    target: 1,
    rewards: { xp: 2000, gold: 3000 },
    difficulty: 'hard',
    requirement: 'clan'
  }
];

export const ACHIEVEMENT_QUESTS = [
  {
    id: 'achievement_first_blood',
    name: 'أول دماء',
    description: 'اقتل أول وحش',
    emoji: '🩸',
    type: 'kill',
    target: 1,
    rewards: { xp: 50, gold: 100, achievement: 'first_blood' },
    oneTime: true
  },
  {
    id: 'achievement_level_10',
    name: 'المبتدئ المتطور',
    description: 'اوصل للمستوى 10',
    emoji: '📈',
    type: 'level',
    target: 10,
    rewards: { xp: 500, gold: 1000, achievement: 'apprentice' },
    oneTime: true
  },
  {
    id: 'achievement_level_25',
    name: 'المحارب المتمرس',
    description: 'اوصل للمستوى 25',
    emoji: '⚔️',
    type: 'level',
    target: 25,
    rewards: { xp: 2000, gold: 4000, skillPoint: 1, achievement: 'veteran' },
    oneTime: true
  },
  {
    id: 'achievement_level_50',
    name: 'الأسطورة',
    description: 'اوصل للمستوى 50',
    emoji: '👑',
    type: 'level',
    target: 50,
    rewards: { xp: 10000, gold: 25000, skillPoint: 3, achievement: 'legend' },
    oneTime: true
  },
  {
    id: 'achievement_gold_10k',
    name: 'التاجر',
    description: 'اجمع 10,000 ذهب',
    emoji: '💰',
    type: 'gold_total',
    target: 10000,
    rewards: { xp: 500, gold: 500, achievement: 'merchant' },
    oneTime: true
  },
  {
    id: 'achievement_gold_100k',
    name: 'الثري',
    description: 'اجمع 100,000 ذهب',
    emoji: '💎',
    type: 'gold_total',
    target: 100000,
    rewards: { xp: 5000, gold: 5000, achievement: 'wealthy' },
    oneTime: true
  },
  {
    id: 'achievement_kills_100',
    name: 'المبيد',
    description: 'اقتل 100 وحش',
    emoji: '💀',
    type: 'total_kills',
    target: 100,
    rewards: { xp: 1000, gold: 2000, achievement: 'slayer' },
    oneTime: true
  },
  {
    id: 'achievement_kills_500',
    name: 'صياد الكوابيس',
    description: 'اقتل 500 وحش',
    emoji: '🐉',
    type: 'total_kills',
    target: 500,
    rewards: { xp: 5000, gold: 10000, skillPoint: 1, achievement: 'nightmare_hunter' },
    oneTime: true
  },
  {
    id: 'achievement_pvp_10',
    name: 'المنافس',
    description: 'انتصر في 10 معارك PvP',
    emoji: '⚔️',
    type: 'pvp_wins_total',
    target: 10,
    rewards: { xp: 1500, gold: 3000, achievement: 'challenger' },
    oneTime: true
  },
  {
    id: 'achievement_pvp_50',
    name: 'بطل الحلبة',
    description: 'انتصر في 50 معركة PvP',
    emoji: '🏆',
    type: 'pvp_wins_total',
    target: 50,
    rewards: { xp: 7500, gold: 15000, skillPoint: 2, achievement: 'arena_champion' },
    oneTime: true
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 إنشاء مهام للاعب جديد
// ═══════════════════════════════════════════════════════════════════════════════

export const createPlayerQuests = () => {
  const now = Date.now();
  const dailyReset = now + 24 * 60 * 60 * 1000;
  const weeklyReset = now + 7 * 24 * 60 * 60 * 1000;

  // اختيار 3 مهام يومية عشوائية
  const shuffledDaily = [...DAILY_QUESTS].sort(() => Math.random() - 0.5);
  const selectedDaily = shuffledDaily.slice(0, 3);

  // اختيار مهمتين أسبوعيتين
  const shuffledWeekly = [...WEEKLY_QUESTS].sort(() => Math.random() - 0.5);
  const selectedWeekly = shuffledWeekly.slice(0, 2);

  return {
    daily: selectedDaily.map(q => ({
      ...q,
      progress: 0,
      completed: false,
      claimed: false,
      resetAt: dailyReset
    })),
    weekly: selectedWeekly.map(q => ({
      ...q,
      progress: 0,
      completed: false,
      claimed: false,
      resetAt: weeklyReset
    })),
    achievements: [...ACHIEVEMENT_QUESTS].map(q => ({
      ...q,
      progress: 0,
      completed: false,
      claimed: false
    }))
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 تحديث تقدم المهمة
// ═══════════════════════════════════════════════════════════════════════════════

export const updateQuestProgress = (player, questType, amount = 1) => {
  if (!player.quests) {
    player.quests = createPlayerQuests();
  }

  const now = Date.now();
  let updated = [];

  // تحديث المهام اليومية
  for (const quest of player.quests.daily) {
    if (quest.type === questType && !quest.completed && !quest.claimed) {
      quest.progress = (quest.progress || 0) + amount;
      if (quest.progress >= quest.target) {
        quest.completed = true;
        updated.push(quest);
      }
    }
  }

  // تحديث المهام الأسبوعية
  for (const quest of player.quests.weekly) {
    if (quest.type === questType && !quest.completed && !quest.claimed) {
      quest.progress = (quest.progress || 0) + amount;
      if (quest.progress >= quest.target) {
        quest.completed = true;
        updated.push(quest);
      }
    }
  }

  // تحديث الإنجازات
  for (const quest of player.quests.achievements) {
    if (quest.type === questType && !quest.completed && !quest.claimed) {
      quest.progress = (quest.progress || 0) + amount;
      if (quest.progress >= quest.target) {
        quest.completed = true;
        updated.push(quest);
      }
    }
  }

  return updated;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎁 المطالبة بمكافأة المهمة
// ═══════════════════════════════════════════════════════════════════════════════

export const claimQuestReward = (player, questId) => {
  if (!player.quests) {
    return { success: false, message: '❌ لا توجد مهام!' };
  }

  // البحث عن المهمة
  let quest = null;
  let questCategory = null;

  for (const category of ['daily', 'weekly', 'achievements']) {
    const found = player.quests[category]?.find(q => q.id === questId);
    if (found) {
      quest = found;
      questCategory = category;
      break;
    }
  }

  if (!quest) {
    return { success: false, message: '❌ المهمة غير موجودة!' };
  }

  if (!quest.completed) {
    return { success: false, message: '❌ المهمة غير مكتملة!' };
  }

  if (quest.claimed) {
    return { success: false, message: '❌ تم المطالبة بالمكافأة سابقاً!' };
  }

  // منح المكافآت
  const rewards = quest.rewards;
  
  if (rewards.xp) {
    player.xp = (player.xp || 0) + rewards.xp;
  }
  
  if (rewards.gold) {
    player.gold = (player.gold || 0) + rewards.gold;
  }
  
  if (rewards.skillPoint) {
    player.skillPoints = (player.skillPoints || 0) + rewards.skillPoint;
  }

  if (rewards.achievement) {
    player.achievements = player.achievements || [];
    if (!player.achievements.includes(rewards.achievement)) {
      player.achievements.push(rewards.achievement);
    }
  }

  quest.claimed = true;

  return {
    success: true,
    message: `✅ حصلت على مكافأة "${quest.name}"!`,
    rewards,
    quest
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 إعادة تعيين المهام اليومية/الأسبوعية
// ═══════════════════════════════════════════════════════════════════════════════

export const resetExpiredQuests = (player) => {
  if (!player.quests) {
    player.quests = createPlayerQuests();
    return;
  }

  const now = Date.now();

  // إعادة تعيين المهام اليومية
  let needsReset = false;
  for (const quest of player.quests.daily) {
    if (quest.resetAt < now) {
      needsReset = true;
      break;
    }
  }

  if (needsReset) {
    const newQuests = createPlayerQuests();
    player.quests.daily = newQuests.daily;
  }

  // إعادة تعيين المهام الأسبوعية
  needsReset = false;
  for (const quest of player.quests.weekly) {
    if (quest.resetAt < now) {
      needsReset = true;
      break;
    }
  }

  if (needsReset) {
    const newQuests = createPlayerQuests();
    player.quests.weekly = newQuests.weekly;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 عرض المهام
// ═══════════════════════════════════════════════════════════════════════════════

export const formatQuestsDisplay = (player) => {
  if (!player.quests) {
    player.quests = createPlayerQuests();
  }

  resetExpiredQuests(player);

  let text = `📜 ═══════ مهامي ═══════ 📜\n\n`;

  // المهام اليومية
  text += `📅 المهام اليومية:\n`;
  text += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;

  for (const quest of player.quests.daily) {
    const status = quest.claimed 
      ? '✅' 
      : quest.completed 
        ? '🎁' 
        : '⏳';
    const progress = `${quest.progress}/${quest.target}`;
    
    text += `${status} ${quest.emoji} ${quest.name}\n`;
    text += `   ${quest.description}\n`;
    text += `   التقدم: ${progress}`;
    
    if (quest.completed && !quest.claimed) {
      text += ` - .مطالبة ${quest.id}`;
    }
    text += `\n\n`;
  }

  // المهام الأسبوعية
  text += `\n📆 المهام الأسبوعية:\n`;
  text += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;

  for (const quest of player.quests.weekly) {
    const status = quest.claimed 
      ? '✅' 
      : quest.completed 
        ? '🎁' 
        : '⏳';
    const progress = `${quest.progress}/${quest.target}`;
    
    text += `${status} ${quest.emoji} ${quest.name}\n`;
    text += `   ${quest.description}\n`;
    text += `   التقدم: ${progress}`;
    
    if (quest.completed && !quest.claimed) {
      text += ` - .مطالبة ${quest.id}`;
    }
    text += `\n\n`;
  }

  // الإنجازات المكتملة
  const completedAchievements = player.quests.achievements.filter(a => a.completed);
  text += `\n🏅 الإنجازات: ${completedAchievements.length}/${player.quests.achievements.length}\n`;

  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 عرض الإنجازات
// ═══════════════════════════════════════════════════════════════════════════════

export const formatAchievementsDisplay = (player) => {
  if (!player.quests) {
    player.quests = createPlayerQuests();
  }

  let text = `🏅 ═══════ الإنجازات ═══════ 🏅\n\n`;

  const achievements = player.quests.achievements;

  // الإنجازات المكتملة
  text += `✅ مكتملة:\n`;
  const completed = achievements.filter(a => a.claimed);
  if (completed.length === 0) {
    text += `   لا توجد إنجازات مكتملة بعد\n`;
  } else {
    for (const ach of completed) {
      text += `   ${ach.emoji} ${ach.name}\n`;
    }
  }

  // الإنجازات المتاحة للمطالبة
  text += `\n🎁 متاحة للمطالبة:\n`;
  const claimable = achievements.filter(a => a.completed && !a.claimed);
  if (claimable.length === 0) {
    text += `   لا توجد إنجازات للمطالبة\n`;
  } else {
    for (const ach of claimable) {
      text += `   ${ach.emoji} ${ach.name} - .مطالبة ${ach.id}\n`;
    }
  }

  // الإنجازات قيد التقدم
  text += `\n⏳ قيد التقدم:\n`;
  const inProgress = achievements.filter(a => !a.completed);
  for (const ach of inProgress.slice(0, 5)) {
    text += `   ${ach.emoji} ${ach.name}: ${ach.progress}/${ach.target}\n`;
  }

  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 الحصول على إحصائيات المهمة
// ═══════════════════════════════════════════════════════════════════════════════

export const getQuestStats = (player) => {
  if (!player.quests) {
    player.quests = createPlayerQuests();
  }

  const daily = player.quests.daily;
  const weekly = player.quests.weekly;
  const achievements = player.quests.achievements;

  return {
    dailyCompleted: daily.filter(q => q.completed).length,
    dailyTotal: daily.length,
    dailyClaimed: daily.filter(q => q.claimed).length,
    weeklyCompleted: weekly.filter(q => q.completed).length,
    weeklyTotal: weekly.length,
    weeklyClaimed: weekly.filter(q => q.claimed).length,
    achievementsCompleted: achievements.filter(q => q.claimed).length,
    achievementsTotal: achievements.length
  };
};
