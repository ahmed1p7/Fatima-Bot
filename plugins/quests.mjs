// ═══════════════════════════════════════════════════════════════════════════════
// 📜 أوامر المهام والإنجازات
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from '../lib/database.mjs';
import { 
  createPlayerQuests, updateQuestProgress, claimQuestReward, resetExpiredQuests,
  formatQuestsDisplay, formatAchievementsDisplay, getQuestStats
} from '../lib/quests.mjs';

export default {
  name: 'Quests',
  commands: [
    'مهام', 'quests', 'مهامي',
    'إنجازات', 'achievements',
    'مطالبة', 'claim',
    'تقدم', 'progress'
  ],

  async execute(sock, msg, ctx) {
    const { from, sender, pushName, command, args, text, prefix } = ctx;
    const data = getRpgData();
    let player = data.players?.[sender];

    // ═══════════════════════════════════════════════════════════════════════════
    // التحقق من التسجيل
    // ═══════════════════════════════════════════════════════════════════════════
    if (!player) {
      return sock.sendMessage(from, { text: '❌ سجل أولاً! استخدم .تسجيل <صنف>' });
    }

    // التأكد من وجود المهام
    if (!player.quests) {
      player.quests = createPlayerQuests();
      saveDatabase();
    }

    // إعادة تعيين المهام المنتهية
    resetExpiredQuests(player);

    // ═══════════════════════════════════════════════════════════════════════════
    // عرض المهام
    // ═══════════════════════════════════════════════════════════════════════════
    if (['مهام', 'quests', 'مهامي'].includes(command)) {
      const display = formatQuestsDisplay(player);
      return sock.sendMessage(from, { text: display });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // عرض الإنجازات
    // ═══════════════════════════════════════════════════════════════════════════
    if (['إنجازات', 'achievements'].includes(command)) {
      const display = formatAchievementsDisplay(player);
      return sock.sendMessage(from, { text: display });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // المطالبة بمكافأة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['مطالبة', 'claim'].includes(command)) {
      const questId = args[0];

      if (!questId) {
        // عرض المهام المكتملة المتاحة للمطالبة
        let msg = `🎁 المهام المكتملة:\n\n`;

        const claimable = [
          ...player.quests.daily.filter(q => q.completed && !q.claimed),
          ...player.quests.weekly.filter(q => q.completed && !q.claimed),
          ...player.quests.achievements.filter(q => q.completed && !q.claimed)
        ];

        if (claimable.length === 0) {
          msg += `❌ لا توجد مكافآت للمطالبة!\n\n`;
          msg += `💡 أكمل المهام للحصول على مكافآت.`;
        } else {
          for (const quest of claimable) {
            msg += `${quest.emoji} ${quest.name}\n`;
            msg += `   ${quest.description}\n`;
            msg += `   .مطالبة ${quest.id}\n\n`;
          }
        }

        return sock.sendMessage(from, { text: msg });
      }

      const result = claimQuestReward(player, questId);
      saveDatabase();

      if (result.success) {
        let msg = result.message + '\n\n📊 المكافآت:\n';
        if (result.rewards.xp) msg += `⭐ +${result.rewards.xp} XP\n`;
        if (result.rewards.gold) msg += `💰 +${result.rewards.gold} ذهب\n`;
        if (result.rewards.skillPoint) msg += `⚡ +${result.rewards.skillPoint} نقطة مهارة\n`;
        if (result.rewards.achievement) msg += `🏅 إنجاز جديد!\n`;

        return sock.sendMessage(from, { text: msg });
      } else {
        return sock.sendMessage(from, { text: result.message });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // عرض التقدم
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تقدم', 'progress'].includes(command)) {
      const stats = getQuestStats(player);

      let msg = `📊 ═══════ تقدمك ═══════ 📊\n\n`;

      msg += `📅 المهام اليومية:\n`;
      msg += `   مكتملة: ${stats.dailyCompleted}/${stats.dailyTotal}\n`;
      msg += `   مطالب بها: ${stats.dailyClaimed}/${stats.dailyTotal}\n\n`;

      msg += `📆 المهام الأسبوعية:\n`;
      msg += `   مكتملة: ${stats.weeklyCompleted}/${stats.weeklyTotal}\n`;
      msg += `   مطالب بها: ${stats.weeklyClaimed}/${stats.weeklyTotal}\n\n`;

      msg += `🏅 الإنجازات:\n`;
      msg += `   مكتملة: ${stats.achievementsCompleted}/${stats.achievementsTotal}\n\n`;

      // إحصائيات عامة
      msg += `📈 إحصائيات عامة:\n`;
      msg += `   الوحوش المقتولة: ${player.stats?.monstersKilled || 0}\n`;
      msg += `   انتصارات PvP: ${player.wins || 0}\n`;
      msg += `   هزائم PvP: ${player.losses || 0}\n`;
      msg += `   الزعماء المهزومين: ${player.stats?.bossesDefeated || 0}\n`;

      return sock.sendMessage(from, { text: msg });
    }
  }
};
