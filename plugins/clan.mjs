// ═══════════════════════════════════════════════════════════════════════════════
// 🏰 أوامر الكلانات والحروب
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from '../lib/database.mjs';
import { RPG } from '../lib/rpg.mjs';
import {
  createClan, getClan, joinClan, donateToClan,
  getClanBuff, clanXpForLevel, progressClanBar,
  challengeClan, acceptChallenge, rejectChallenge, getPendingChallenges,
  attackInWar, endWar, getActiveWar, getAvailableClans, getPlayerClan,
  getClanEventSummary, WAR_CHANNEL
} from '../lib/clan.mjs';
import { formatWarForChannel } from '../lib/market.mjs';

export default {
  name: 'Clan',
  commands: [
    'تفعيل_الكلان', 'createclan',
    'كلان', 'clan', 'كلانات',
    'تبرع', 'donate',
    'انضمام_الكلان', 'joinclan',
    'تحدي', 'challenge',
    'قبول_التحدي', 'accept',
    'رفض_التحدي', 'reject',
    'هجوم_حرب', 'attack', 'هجوم',
    'الحرب', 'war', 'حربي',
    'التحديات', 'challenges',
    'الكلانات', 'clanslist'
  ],

  async execute(sock, msg, ctx) {
    const { from, sender, pushName, command, args, text, prefix, isGroupAdmin, isGroup, groupMetadata } = ctx;
    const data = getRpgData();

    // ═══════════════════════════════════════════════════════════════════════════
    // تفعيل الكلان (للمشرفين فقط)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تفعيل_الكلان', 'createclan'].includes(command)) {
      if (!isGroup) return sock.sendMessage(from, { text: '❌ في مجموعة فقط!' });
      if (!isGroupAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين فقط!' });

      const clanName = args.join(' ');
      if (!clanName) return sock.sendMessage(from, { text: `❌ اكتب اسم الكلان!\n💡 ${prefix}تفعيل_الكلان صقور العرب` });

      const result = createClan(from, clanName, sender, pushName);
      if (!result.success) return sock.sendMessage(from, { text: result.message });

      return sock.sendMessage(from, { text: `╭═══════ 🏰 تفعيل الكلان 🏰 ═══════╮
   
   ✅ تم إنشاء كلان "${clanName}" [${result.clan.clanTag}]
   
   👑 القائد: ${pushName}
   👥 الأعضاء: 1
   ⭐ المستوى: 1
   
╰═══════════════════════════════❖` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // عرض معلومات الكلان
    // ═══════════════════════════════════════════════════════════════════════════
    if (['كلان', 'clan', 'كلانات'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ لا يوجد كلان!\n💡 مشرف المجموعة يستطيع تفعيل الكلان' });

      const buff = getClanBuff(clan.level);
      const progress = progressClanBar(clan.xp, clan.level);
      const xpNeeded = clanXpForLevel(clan.level);

      // الحصول على اسم القائد
      const leaderName = data.players?.[clan.leader]?.name || 'غير معروف';
      
      // الحصول على clanTag
      const clanTag = clan.clanTag || '####';

      return sock.sendMessage(from, { text: `╭═══════ 🏰 كلان الجروب 🏰 ═══════╮
   
   🛡️ الاسم: ${clan.name} [${clanTag}]
   ⭐ المستوى: ${clan.level}
   📊 التقدم: [${progress}] ${clan.xp}/${xpNeeded}
   
   ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
   
   💰 خزنة الكلان: ${clan.gold.toLocaleString()} ذهبة
   👥 الأعضاء: ${clan.memberCount} محارب
   ⚔️ الانتصارات: ${clan.wins} | 🛡️ الهزائم: ${clan.losses}
   
   ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
   
   📈 باف الكلان:
   ⚔️ +${buff.atk.toFixed(1)}% هجوم
   🛡️ +${buff.defense.toFixed(1)}% دفاع
   🏪 ${buff.discount.toFixed(1)}% خصم
   
   ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
   
   👑 القائد: ${leaderName}
   ${clan.announcement ? `📢 إعلان: "${clan.announcement}"` : ''}
   
╰═══════════════════════════════❖` });
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

      // خصم الذهب من اللاعب
      player.gold -= amount;
      saveDatabase();

      let response = `✅ تم التبرع بـ ${amount.toLocaleString()} ذهب!\n\n💰 خزنة الكلان: ${getClan(from).gold.toLocaleString()}`;
      if (result.leveledUp) {
        response += `\n\n🎉 الكلان ارتقى للمستوى ${result.newLevel}!`;
      }

      return sock.sendMessage(from, { text: response });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // الانضمام للكلان
    // ═══════════════════════════════════════════════════════════════════════════
    if (['انضمام_الكلان', 'joinclan'].includes(command)) {
      const result = joinClan(from, sender);
      return sock.sendMessage(from, { text: result.success ? result.message : result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // قائمة الكلانات
    // ═══════════════════════════════════════════════════════════════════════════
    if (['الكلانات', 'clanslist'].includes(command)) {
      const clans = getAvailableClans(''); // جلب الكل
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

      // إذا لم يحدد كلان، عرض القائمة
      if (!args[0]) {
        const clans = getAvailableClans(from);
        if (clans.length === 0) return sock.sendMessage(from, { text: '❌ لا توجد كلانات للتحدي!' });

        const list = clans.slice(0, 10).map((c, i) =>
          `${i + 1}. 🏰 ${c.name} (Lv.${c.level} | ${c.members} عضو)`
        ).join('\n');

        return sock.sendMessage(from, { text: `🏰 اختر كلان للتحدي:\n\n${list}\n\n💡 ${prefix}تحدي <اسم الكلان أو رقم>` });
      }

      // البحث عن الكلان
      const clans = getAvailableClans(from);
      let targetClan;
      const input = args.join(' ');

      // البحث بالرقم أو الاسم
      if (/^\d+$/.test(input)) {
        targetClan = clans[parseInt(input) - 1];
      } else {
        targetClan = clans.find(c => c.name.toLowerCase().includes(input.toLowerCase()));
      }

      if (!targetClan) return sock.sendMessage(from, { text: '❌ الكلان غير موجود!' });

      const result = await challengeClan(from, targetClan.id, sender, sock);
      if (!result.success) return sock.sendMessage(from, { text: result.message });

      return sock.sendMessage(from, { text: `⚔️ تم إرسال تحدي!

🏰 ${result.challengerName} VS 🏰 ${result.targetName}

💰 جائزة الفوز: ${result.prizePool.toLocaleString()} ذهب

⏰ ينتظر موافقة قائد ${result.targetName} (5 دقائق)` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // التحديات المعلقة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['التحديات', 'challenges'].includes(command)) {
      const challenges = getPendingChallenges(from);
      if (challenges.length === 0) return sock.sendMessage(from, { text: '✅ لا توجد تحديات معلقة!' });

      const list = challenges.map(c =>
        `⚔️ ${c.challengerName} يتحداك!\n💰 الجائزة: ${c.prizePool.toLocaleString()}\n🆔 ${c.id}`
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
      if (!challengeId) return sock.sendMessage(from, { text: '❌ حدد رقم التحدي!\n💡 استخدم: .قبول_التحدي war_XXXXXXXXXXX' });

      // معالجة معرف التحدي - قد يأتي بصيغ مختلفة
      let fullChallengeId = challengeId;
      if (!challengeId.startsWith('war_')) {
        // إذا كان المستخدم أدخل فقط الأرقام، نحاول البحث عن تحدي يطابقها
        const challenges = getPendingChallenges(from);
        const found = challenges.find(c => c.id.endsWith(challengeId) || c.id === challengeId);
        if (found) {
          fullChallengeId = found.id;
        } else {
          // محاولة إنشاء المعرف الكامل
          fullChallengeId = `war_${challengeId.replace('war_', '')}`;
        }
      }

      const result = await acceptChallenge(fullChallengeId, sender, sock);
      if (!result.success) return sock.sendMessage(from, { text: result.message });

      // إرسال إعلان للحرب
      const warMsg = formatWarForChannel(result.war);
      // يمكن إرسال للقناة هنا

      return sock.sendMessage(from, { text: `⚔️ بدأت الحرب!

🏰 ${result.war.challengerName} VS 🏰 ${result.war.targetName}

⏱️ المدة: 30 دقيقة
💰 جائزة الفوز: ${result.war.prizePool.toLocaleString()} ذهب

🎯 اهجم الآن: ${prefix}هجوم_حرب` });
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

      const rejected = await rejectChallenge(challengeId, sock);
      return sock.sendMessage(from, { text: rejected ? '✅ تم رفض التحدي!' : '❌ التحدي غير موجود!' });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // الهجوم في الحرب
    // ═══════════════════════════════════════════════════════════════════════════
    if (['هجوم_حرب', 'attack', 'هجوم'].includes(command)) {
      const player = data.players?.[sender];
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const war = getActiveWar(from);
      if (!war) return sock.sendMessage(from, { text: '❌ لا توجد حرب نشطة!' });

      // استخدام الرسائل القابلة للتحديث
      let message = await sock.sendMessage(from, { text: '🎯 جاري الهجوم...' });

      const result = attackInWar(war.id, from, sender, player.atk);
      if (!result.success) {
        return sock.sendMessage(from, { text: result.message });
      }

      // حساب الوقت المتبقي
      const remaining = Math.max(0, war.endsAt - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);

      // تحديث الرسالة
      await sock.sendMessage(from, {
        text: `⚔️ هجوم ناجح!

💥 ضررك: ${result.damage}
📊 ضرر فريقك: ${result.totalDamage.toLocaleString()}

⏱️ الوقت المتبقي: ${mins}:${secs.toString().padStart(2, '0')}`,
        edit: message.key
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // حالة الحرب
    // ═══════════════════════════════════════════════════════════════════════════
    if (['الحرب', 'war', 'حربي'].includes(command)) {
      const war = getActiveWar(from);
      if (!war) return sock.sendMessage(from, { text: '❌ لا توجد حرب نشطة!' });

      const remaining = Math.max(0, war.endsAt - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);

      // تحديد فريق المستخدم
      const isChallenger = war.challengerId === from;
      const myDamage = isChallenger ? war.challengerDamage : war.targetDamage;
      const enemyDamage = isChallenger ? war.targetDamage : war.challengerDamage;
      const myName = isChallenger ? war.challengerName : war.targetName;
      const enemyName = isChallenger ? war.targetName : war.challengerName;

      return sock.sendMessage(from, { text: `⚔️ حالة الحرب

🏰 ${myName}: ${myDamage.toLocaleString()} ضرر
🏰 ${enemyName}: ${enemyDamage.toLocaleString()} ضرر

⏱️ الوقت المتبقي: ${mins}:${secs.toString().padStart(2, '0')}
💰 الجائزة: ${war.prizePool.toLocaleString()} ذهب

🎯 ${prefix}هجوم_حرب` });
    }
  }
};
