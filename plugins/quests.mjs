// ═══════════════════════════════════════════════════════════════════════════════
// 📜 أوامر المهام والإنجازات - فاطمة بوت v13.0
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from '../lib/database.mjs';
import { 
  getPlayerQuests, updateQuestProgress, claimQuestReward,
  formatQuests, formatAchievements, getQuestStats, checkAchievements
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

    // ═══════════════════════════════════════════════════════════════════════════
    // عرض المهام (يتم إنشاء المهام تلقائياً إذا لم تكن موجودة عبر getPlayerQuests)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['مهام', 'quests', 'مهامي'].includes(command)) {
      // getPlayerQuests يقوم بتهيئة المهام وإعادة تعيين المنتهية تلقائياً
      const quests = getPlayerQuests(player);
      const display = formatQuests(player);
      saveDatabase(); // حفظ أي تغييرات حدثت أثناء التهيئة
      return sock.sendMessage(from, { text: display });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // عرض الإنجازات (مع التحقق من الإنجازات الجديدة أولاً)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['إنجازات', 'achievements'].includes(command)) {
      // التحقق من الإنجازات الجديدة قبل العرض
      const newAchievements = checkAchievements(player);
      if (newAchievements.length > 0) {
        // إرسال إشعار بالإنجازات الجديدة
        const achievementText = newAchievements.map(a => `${a.emoji} ${a.name}: ${a.description}`).join('\n');
        await sock.sendMessage(from, { text: `🏅 إنجازات جديدة!\n\n${achievementText}` });
      }
      const display = formatAchievements(player);
      saveDatabase();
      return sock.sendMessage(from, { text: display });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // المطالبة بمكافأة مهمة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['مطالبة', 'claim'].includes(command)) {
      const questId = args[0];

      if (!questId) {
        // عرض المهام المكتملة المتاحة للمطالبة
        let msg = `🎁 المهام المكتملة:\n\n`;
        
        // جلب المهام الحالية (يتم تحديثها تلقائياً)
        const quests = getPlayerQuests(player);
        
        const claimable = [
          ...(quests.daily || []).filter(q => q.completed && !q.claimed),
          ...(quests.weekly || []).filter(q => q.completed && !q.claimed),
          ...(quests.monthly || []).filter(q => q.completed && !q.claimed)
        ];

        if (claimable.length === 0) {
          msg += `❌ لا توجد مكافآت للمطالبة!\n\n💡 أكمل المهام للحصول على مكافآت.`;
        } else {
          for (const quest of claimable) {
            msg += `${quest.type.emoji} ${quest.type.name}\n`;
            msg += `   ${quest.type.category || 'مهمة'}\n`;
            msg += `   💰 ${quest.rewards.gold} | ⭐ ${quest.rewards.xp}\n`;
            msg += `   🆔 ${quest.id.slice(-8)}\n\n`;
          }
          msg += `💡 استخدم .مطالبة <الكود>`;
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
        return sock.sendMessage(from, { text: msg });
      } else {
        return sock.sendMessage(from, { text: result.message });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // عرض التقدم العام (إحصائيات المهام والإنجازات)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تقدم', 'progress'].includes(command)) {
      // التأكد من وجود المهام (لحساب الإحصائيات بشكل صحيح)
      getPlayerQuests(player);
      const stats = getQuestStats(player);
      saveDatabase();

      let msg = `📊 ═══════ تقدمك ═══════ 📊\n\n`;

      msg += `📅 المهام اليومية:\n`;
      msg += `   مكتملة: ${stats.dailyCompleted}/${stats.dailyTotal}\n`;
      msg += `   مطالب بها: ${stats.dailyClaimed}/${stats.dailyTotal}\n\n`;

      msg += `📆 المهام الأسبوعية:\n`;
      msg += `   مكتملة: ${stats.weeklyCompleted}/${stats.weeklyTotal}\n`;
      msg += `   مطالب بها: ${stats.weeklyClaimed}/${stats.weeklyTotal}\n\n`;

      if (stats.monthlyTotal > 0) {
        msg += `📅 المهام الشهرية:\n`;
        msg += `   مكتملة: ${stats.monthlyCompleted}/${stats.monthlyTotal}\n`;
        msg += `   مطالب بها: ${stats.monthlyClaimed}/${stats.monthlyTotal}\n\n`;
      }

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
