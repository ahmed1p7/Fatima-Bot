// ═══════════════════════════════════════════════════════════════════════════════
// 🏰 أوامر الكلانات والحروب
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from '../lib/database.mjs';
import { RPG } from '../lib/rpg.mjs';
import {
  createClan, getClan, joinClan, donateToClan, getClanBuff,
  clanXpForLevel, progressClanBar,
  challengeClan, acceptChallenge, rejectChallenge, getPendingChallenges,
  getChallenge, attackInWar, endWar, getActiveWar, getAvailableClans,
  getPlayerClan, WAR_CHANNEL,
  formatChallengeForChannel, formatChallengeForGroup, formatChallengeForLeader,
  formatAcceptForChannel, formatRejectForChannel, formatWarResultForChannel
} from '../lib/clan.mjs';

export default {
  name: 'Clan',
  commands: [
    'تفعيل_الكلان', 'createclan',
    'كلان', 'clan', 'كلانات',
    'تبرع', 'donate', 'انضمام', 'joinclan',
    'تحدي', 'challenge', 'التحديات', 'challenges',
    'قبول_التحدي', 'accept', 'رفض_التحدي', 'reject',
    'هجوم_حرب', 'attack', 'هجوم', 'الحرب', 'war',
    'الكلانات', 'clanslist'
  ],

  async execute(sock, msg, ctx) {
    const { from, sender, pushName, command, args, text, prefix, isGroupAdmin, isGroup } = ctx;
    const data = getRpgData();

    // ═══════════════════════════════════════════════════════════════════════════
    // تفعيل الكلان
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تفعيل_الكلان', 'createclan'].includes(command)) {
      if (!isGroup) return sock.sendMessage(from, { text: '❌ في مجموعة فقط!' });
      if (!isGroupAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين فقط!' });

      const name = args.join(' ').trim();
      if (!name) return sock.sendMessage(from, { text: `❌ اكتب اسم الكلان!\n💡 ${prefix}تفعيل_الكلان صقور العرب` });

      const result = createClan(from, name, sender, pushName);
      return sock.sendMessage(from, { text: result.success ?
        `✅ تم إنشاء كلان "${name}"!\n\n👑 القائد: ${pushName}\n👥 الأعضاء: 1\n⭐ المستوى: 1` :
        result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // معلومات الكلان
    // ═══════════════════════════════════════════════════════════════════════════
    if (['كلان', 'clan'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ لا يوجد كلان! مشرف المجموعة يستطيع تفعيله.' });

      const buff = getClanBuff(clan.level);
      const progress = progressClanBar(clan.xp, clan.level);
      const need = clanXpForLevel(clan.level);
      const leader = data.players?.[clan.leader]?.name || 'غير معروف';

      return sock.sendMessage(from, { text: `╭═══════ 🏰 ${clan.name} 🏰 ═══════╮

   ⭐ المستوى: ${clan.level}
   📊 التقدم: [${progress}] ${clan.xp}/${need}

   ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

   💰 الخزنة: ${clan.gold.toLocaleString()} ذهب
   👥 الأعضاء: ${clan.memberCount} محارب
   ⚔️ الانتصارات: ${clan.wins} | 🛡️ الهزائم: ${clan.losses || 0}

   ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

   📈 باف الكلان:
   ⚔️ +${buff.atk}% هجوم | 🛡️ +${buff.defense}% دفاع

   ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

   👑 القائد: ${leader}

╰═══════════════════════════════❖` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // الانضمام للكلان
    // ═══════════════════════════════════════════════════════════════════════════
    if (['انضمام', 'joinclan'].includes(command)) {
      const result = joinClan(from, sender);
      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // التبرع للكلان
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تبرع', 'donate'].includes(command)) {
      const player = data.players?.[sender];
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const amount = parseInt(args[0]);
      if (!amount) return sock.sendMessage(from, { text: `❌ حدد المبلغ!\n💡 ${prefix}تبرع 500` });

      const result = donateToClan(from, sender, amount, player.gold);
      if (!result.success) return sock.sendMessage(from, { text: result.message });

      player.gold -= amount;
      saveDatabase();

      let response = result.message;
      if (result.leveledUp) response += `\n\n🎉 الكلان ارتقى للمستوى ${result.newLevel}!`;
      return sock.sendMessage(from, { text: response });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // قائمة الكلانات
    // ═══════════════════════════════════════════════════════════════════════════
    if (['الكلانات', 'clanslist'].includes(command)) {
      const clans = getAvailableClans('');
      if (clans.length === 0) return sock.sendMessage(from, { text: '❌ لا توجد كلانات!' });

      const list = clans.slice(0, 15).map((c, i) =>
        `${i + 1}. 🏰 ${c.name}\n   ⭐ Lv.${c.level} | 👥 ${c.members} | ⚔️ ${c.wins}`
      ).join('\n\n');

      return sock.sendMessage(from, { text: `🏰 قائمة الكلانات:\n\n${list}` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // تحدي كلان
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تحدي', 'challenge'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });
      if (clan.leader !== sender) return sock.sendMessage(from, { text: '❌ للقائد فقط!' });

      // عرض القائمة إذا لم يحدد
      if (!args[0]) {
        const clans = getAvailableClans(from);
        if (clans.length === 0) return sock.sendMessage(from, { text: '❌ لا توجد كلانات للتحدي!' });

        const list = clans.slice(0, 10).map((c, i) =>
          `${i + 1}. 🏰 ${c.name} (Lv.${c.level} | ${c.members} عضو)`
        ).join('\n');

        return sock.sendMessage(from, { text: `🏰 اختر كلان للتحدي:\n\n${list}\n\n💡 ${prefix}تحدي <اسم أو رقم>` });
      }

      // البحث عن الكلان
      const clans = getAvailableClans(from);
      let target;
      const input = args.join(' ');

      if (/^\d+$/.test(input)) {
        target = clans[parseInt(input) - 1];
      } else {
        target = clans.find(c => c.name.toLowerCase().includes(input.toLowerCase()));
      }

      if (!target) return sock.sendMessage(from, { text: '❌ الكلان غير موجود!' });

      // إنشاء التحدي
      const result = challengeClan(from, target.id, sender, pushName);
      if (!result.success) return sock.sendMessage(from, { text: result.message });

      // 1️⃣ إرسال للقناة
      try {
        await sock.sendMessage(WAR_CHANNEL, { text: formatChallengeForChannel(result) });
      } catch (e) { console.log('Channel error:', e.message); }

      // 2️⃣ إرسال لمجموعة الكلان المنافس
      try {
        const challengerClan = getClan(from);
        await sock.sendMessage(target.id, { text: formatChallengeForGroup(result, challengerClan) });
      } catch (e) { console.log('Group error:', e.message); }

      // 3️⃣ إرسال للقائد على الخاص
      try {
        const targetClan = getClan(target.id);
        if (targetClan?.leader) {
          const leaderJid = targetClan.leader.includes('@') ? targetClan.leader : targetClan.leader + '@s.whatsapp.net';
          await sock.sendMessage(leaderJid, { text: formatChallengeForLeader(result) });
        }
      } catch (e) { console.log('DM error:', e.message); }

      return sock.sendMessage(from, { text: `⚔️ تم إرسال التحدي!

🏰 ${result.challengerName} VS 🏰 ${result.targetName}

💰 جائزة الفوز: ${result.prizePool.toLocaleString()} ذهب

⏰ ينتظر موافقة قائد ${result.targetName} (10 دقائق)

📢 تم الإعلان في قناة الحروب!` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // التحديات المعلقة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['التحديات', 'challenges'].includes(command)) {
      const challenges = getPendingChallenges(from);
      if (challenges.length === 0) return sock.sendMessage(from, { text: '✅ لا توجد تحديات معلقة!' });

      const list = challenges.map(c =>
        `⚔️ ${c.challengerName} يتحداك!
⭐ Lv.${c.challengerLevel} | 👥 ${c.challengerMembers}
💰 ${c.prizePool.toLocaleString()} ذهب
🆔 ${c.challengeId}`
      ).join('\n\n');

      return sock.sendMessage(from, { text: `📜 التحديات المعلقة:\n\n${list}\n\n✅ ${prefix}قبول_التحدي <الرقم>\n❌ ${prefix}رفض_التحدي <الرقم>` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // قبول التحدي
    // ═══════════════════════════════════════════════════════════════════════════
    if (['قبول_التحدي', 'accept'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });
      if (clan.leader !== sender) return sock.sendMessage(from, { text: '❌ للقائد فقط!' });

      const challengeId = args[0];
      if (!challengeId) return sock.sendMessage(from, { text: '❌ حدد رقم التحدي!' });

      const result = acceptChallenge(challengeId, sender, pushName);
      if (!result.success) return sock.sendMessage(from, { text: result.message });

      // إرسال للقناة
      try {
        await sock.sendMessage(WAR_CHANNEL, { text: formatAcceptForChannel(result.challenge, result.war) });
      } catch (e) { console.log('Channel error:', e.message); }

      // إرسال لمجموعة المتحدي
      try {
        await sock.sendMessage(result.war.challengerId, { text: `⚔️ تم قبول تحديك!

🏰 ${result.war.challengerName} VS 🏰 ${result.war.targetName}

⏱️ 30 دقيقة | 💰 ${result.war.prizePool.toLocaleString()} ذهب

🎯 اهجم: ${prefix}هجوم_حرب` });
      } catch (e) {}

      return sock.sendMessage(from, { text: `⚔️ بدأت الحرب!

🏰 ${result.war.challengerName} VS 🏰 ${result.war.targetName}

⏱️ 30 دقيقة | 💰 ${result.war.prizePool.toLocaleString()} ذهب

🎯 اهجم: ${prefix}هجوم_حرب` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // رفض التحدي
    // ═══════════════════════════════════════════════════════════════════════════
    if (['رفض_التحدي', 'reject'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });
      if (clan.leader !== sender) return sock.sendMessage(from, { text: '❌ للقائد فقط!' });

      const challengeId = args[0];
      if (!challengeId) return sock.sendMessage(from, { text: '❌ حدد رقم التحدي!' });

      const result = rejectChallenge(challengeId, pushName);
      if (!result) return sock.sendMessage(from, { text: '❌ التحدي غير موجود!' });

      // إرسال للقناة
      try {
        await sock.sendMessage(WAR_CHANNEL, { text: formatRejectForChannel(result) });
      } catch (e) { console.log('Channel error:', e.message); }

      // إرسال لمجموعة المتحدي
      try {
        await sock.sendMessage(result.challengerId, { text: `❌ تم رفض تحديك!\n\n🏰 ${result.targetName} رفض التحدي` });
      } catch (e) {}

      return sock.sendMessage(from, { text: '✅ تم رفض التحدي!' });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // الهجوم في الحرب
    // ═══════════════════════════════════════════════════════════════════════════
    if (['هجوم_حرب', 'هجوم', 'attack'].includes(command)) {
      const player = data.players?.[sender];
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const war = getActiveWar(from);
      if (!war) return sock.sendMessage(from, { text: '❌ لا حرب نشطة!' });

      const msg = await sock.sendMessage(from, { text: '🎯 جاري الهجوم...' });

      const result = attackInWar(war.id, from, sender, player.atk);
      if (!result.success) return sock.sendMessage(from, { text: result.message });

      const rem = Math.max(0, war.endsAt - Date.now());
      const mins = Math.floor(rem / 60000);
      const secs = Math.floor((rem % 60000) / 1000);

      return sock.sendMessage(from, {
        text: `⚔️ هجوم ناجح!

💥 ضررك: ${result.damage}
📊 فريقك: ${result.totalDamage.toLocaleString()}

⏱️ ${mins}:${secs.toString().padStart(2, '0')}`,
        edit: msg.key
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // حالة الحرب
    // ═══════════════════════════════════════════════════════════════════════════
    if (['الحرب', 'war'].includes(command)) {
      const war = getActiveWar(from);
      if (!war) return sock.sendMessage(from, { text: '❌ لا حرب نشطة!' });

      const rem = Math.max(0, war.endsAt - Date.now());
      const mins = Math.floor(rem / 60000);
      const secs = Math.floor((rem % 60000) / 1000);

      const isAttacker = war.challengerId === from;
      const myDmg = isAttacker ? war.challengerDamage : war.targetDamage;
      const enemyDmg = isAttacker ? war.targetDamage : war.challengerDamage;
      const myName = isAttacker ? war.challengerName : war.targetName;
      const enemyName = isAttacker ? war.targetName : war.challengerName;

      return sock.sendMessage(from, { text: `⚔️ حالة الحرب

🏰 ${myName}: ${myDmg.toLocaleString()} ضرر
🏰 ${enemyName}: ${enemyDmg.toLocaleString()} ضرر

⏱️ ${mins}:${secs.toString().padStart(2, '0')}
💰 ${war.prizePool.toLocaleString()} ذهب

🎯 ${prefix}هجوم_حرب` });
    }
  }
};
