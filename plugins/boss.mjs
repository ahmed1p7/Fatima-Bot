// ═══════════════════════════════════════════════════════════════════════════════
// 👹 أوامر الزعماء والقتال الجماعي
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from '../lib/database.mjs';
import { updateQuestProgress } from '../lib/quests.mjs';
import { 
  BOSSES, spawnRandomBoss, spawnBoss, attackBoss, 
  getActiveBoss, formatBossAnnouncement, formatBossStatus, formatBattleResult,
  getPlayerBossRewards
} from '../lib/boss.mjs';

export default {
  name: 'Boss',
  commands: [
    'زعيم', 'boss', 'استدعاء_زعيم',
    'هجوم_زعيم', 'attack_boss', 'هجوم',
    'حالة_زعيم', 'boss_status',
    'زعماء', 'bosses', 'قائمة_زعماء',
    'مكافآتي', 'my_rewards'
  ],

  async execute(sock, msg, ctx) {
    const { from, sender, pushName, command, args, text, prefix, isGroupAdmin, isGroup } = ctx;
    const data = getRpgData();
    const player = data.players?.[sender];

    // ═══════════════════════════════════════════════════════════════════════════
    // استدعاء زعيم (للمشرفين أو عشوائي)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['زعيم', 'boss', 'استدعاء_زعيم'].includes(command)) {
      // التحقق من وجود زعيم نشط
      const existingBoss = getActiveBoss(from);
      if (existingBoss) {
        return sock.sendMessage(from, { 
          text: `❌ هناك زعيم نشط بالفعل!\n\n${formatBossStatus(existingBoss)}` 
        });
      }

      // جمع المشاركين المحتملين (اللاعبين في المجموعة)
      const participants = Object.values(data.players || {})
        .filter(p => p && p.level);

      // استدعاء زعيم عشوائي
      const result = spawnRandomBoss(from, participants);

      if (!result.success) {
        return sock.sendMessage(from, { text: result.message });
      }

      // إرسال إعلان
      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // الهجوم على الزعيم
    // ═══════════════════════════════════════════════════════════════════════════
    if (['هجوم_زعيم', 'attack_boss', 'هجوم'].includes(command)) {
      if (!player) {
        return sock.sendMessage(from, { text: '❌ سجل أولاً! استخدم .تسجيل <صنف>' });
      }

      // التحقق من وجود زعيم نشط
      const boss = getActiveBoss(from);
      if (!boss) {
        return sock.sendMessage(from, { text: '❌ لا يوجد زعيم نشط! استخدم .زعيم لاستدعاء واحد.' });
      }

      // التحقق من HP اللاعب
      if (player.hp < player.maxHp * 0.1) {
        return sock.sendMessage(from, { text: '❌ صحتك ضعيفة جداً! استخدم .علاج أولاً.' });
      }

      // التحقق من وقت التهدئة
      const now = Date.now();
      const lastAttack = player.lastBossAttack || 0;
      const cooldown = 10000; // 10 ثواني

      if (now - lastAttack < cooldown) {
        const remaining = Math.ceil((cooldown - (now - lastAttack)) / 1000);
        return sock.sendMessage(from, { text: `⏰ انتظر ${remaining} ثانية!` });
      }

      player.lastBossAttack = now;

      // تنفيذ الهجوم
      const result = attackBoss(
        boss.instanceId,
        sender,
        pushName,
        player.atk,
        player.mag,
        player.skills
      );

      if (!result.success) {
        return sock.sendMessage(from, { text: result.message });
      }

      // خصم HP من اللاعب إذا كان هناك هجوم مضاد
      if (result.counterAttack) {
        player.hp = Math.max(1, player.hp - result.counterAttack.damage);
      }

      // تحديث المهام
      updateQuestProgress(player, 'boss_damage', result.damage);

      // إذا تمت هزيمة الزعيم
      if (result.defeated) {
        // تحديث إحصائيات اللاعبين
        for (const [pid, reward] of Object.entries(result.rewards)) {
          const p = data.players[pid];
          if (p) {
            p.xp = (p.xp || 0) + reward.xp;
            p.gold = (p.gold || 0) + reward.gold;
            p.stats = p.stats || {};
            p.stats.bossesDefeated = (p.stats.bossesDefeated || 0) + 1;
            p.stats.totalBossDamage = (p.stats.totalBossDamage || 0) + reward.damage;

            // تحديث المهام
            updateQuestProgress(p, 'boss_kill', 1);
          }
        }

        saveDatabase();

        // إرسال نتيجة المعركة
        return sock.sendMessage(from, { text: formatBattleResult(result) });
      }

      saveDatabase();

      // إرسال نتيجة الهجوم
      let response = `⚔️ هجوم على ${boss.emoji} ${boss.name}!\n\n`;
      response += `💥 ضررك: ${result.damage.toLocaleString()}`;
      if (result.isCrit) response += ` 🔥 حرجة!`;
      response += `\n📊 HP الزعيم: ${result.hpPercent}%`;

      if (result.counterAttack) {
        response += `\n\n⚠️ هجوم مضاد: -${result.counterAttack.damage} HP!`;
      }

      return sock.sendMessage(from, { text: response });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // حالة الزعيم
    // ═══════════════════════════════════════════════════════════════════════════
    if (['حالة_زعيم', 'boss_status'].includes(command)) {
      const boss = getActiveBoss(from);

      if (!boss) {
        return sock.sendMessage(from, { text: '❌ لا يوجد زعيم نشط حالياً!' });
      }

      return sock.sendMessage(from, { text: formatBossStatus(boss) });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // قائمة الزعماء
    // ═══════════════════════════════════════════════════════════════════════════
    if (['زعماء', 'bosses', 'قائمة_زعماء'].includes(command)) {
      let msg = `👹 ═══════ قائمة الزعماء ═══════ 👹\n\n`;

      for (const boss of BOSSES) {
        const diffStars = '⭐'.repeat(
          boss.level <= 10 ? 1 : boss.level <= 25 ? 2 : boss.level <= 40 ? 3 : 4
        );

        msg += `${boss.emoji} ${boss.name} ${diffStars}\n`;
        msg += `   المستوى: ${boss.level} | HP: ${boss.hp.toLocaleString()}\n`;
        msg += `   مكافأة: ${boss.goldReward.toLocaleString()}💰 ${boss.xpReward.toLocaleString()}XP\n`;
        msg += `   يتطلب: ${boss.spawnCondition.minPlayers} لاعبين | Lv.${boss.spawnCondition.minTotalLevel} إجمالي\n\n`;
      }

      msg += `💡 .زعيم - استدعاء زعيم عشوائي`;

      return sock.sendMessage(from, { text: msg });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // مكافآت الزعماء
    // ═══════════════════════════════════════════════════════════════════════════
    if (['مكافآتي', 'my_rewards'].includes(command)) {
      if (!player) {
        return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      }

      const rewards = getPlayerBossRewards(sender);

      if (rewards.length === 0) {
        return sock.sendMessage(from, { text: '❌ لم تشارك في أي هزيمة لزعماء بعد!' });
      }

      let msg = `🎁 ═══════ مكافآت الزعماء ═══════ 🎁\n\n`;

      for (const reward of rewards) {
        const date = new Date(reward.date);
        msg += `${reward.bossEmoji} ${reward.bossName}\n`;
        msg += `   ضررك: ${reward.damage.toLocaleString()} (${reward.contribution}%)\n`;
        msg += `   المكافأة: ${reward.gold}💰 ${reward.xp}XP\n`;
        if (reward.loot) {
          msg += `   الغنيمة: ${reward.loot}\n`;
        }
        msg += `\n`;
      }

      return sock.sendMessage(from, { text: msg });
    }
  }
};
