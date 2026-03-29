// ═══════════════════════════════════════════════════════════════════════════════
// 🏰 أوامر الكلانات والحروب المحسنة - فاطمة بوت v14.0 (محدث)
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from '../lib/database.mjs';
import { 
  WAR_PREP_TIME, WAR_DURATION, WAR_CHANNEL, setWarChannel,
  BUILDINGS, createClan, getClan, joinClan, donateToClan, 
  transferClanLeadership, deleteClan, isClanLeader,
  challengeClan, acceptChallenge, rejectChallenge, getActiveWar, registerWarParticipation,
  getRankedClansList, getClanBuff, progressClanBar, clanXpForLevel,
  trainSoldiers, getArmyCapacity, buyWarItem, getClanRankings
} from '../lib/clan.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 متغيرات خاصة بالحروب (مؤقتات التقارير)
// ═══════════════════════════════════════════════════════════════════════════════

const warReportTimers = new Map();

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ دوال بدء الحرب والتقارير اللحظية (تعتمد على sock)
// ═══════════════════════════════════════════════════════════════════════════════

async function sendWarReport(war, sock) {
  const now = Date.now();
  const totalDamage = (war.challengerDamage || 0) + (war.targetDamage || 0);
  let challengerPercent = 0, targetPercent = 0;
  if (totalDamage > 0) {
    challengerPercent = Math.floor((war.challengerDamage / totalDamage) * 100);
    targetPercent = Math.floor((war.targetDamage / totalDamage) * 100);
  }
  const leadingClan = war.challengerDamage > war.targetDamage ? war.challengerName : war.targetName;
  const leadingPercent = war.challengerDamage > war.targetDamage ? challengerPercent : targetPercent;
  const remaining = Math.max(0, war.endsAt - now);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const reportMsg = `⚔️ *تقرير معركة لحظي*

🏰 ${war.challengerName}: ${war.challengerDamage?.toLocaleString() || 0} ضرر (${challengerPercent}%)
🏰 ${war.targetName}: ${war.targetDamage?.toLocaleString() || 0} ضرر (${targetPercent}%)

📊 المتصدر: ${leadingClan} يدمر ${leadingPercent}% من العدو!

⏳ الوقت المتبقي: ${mins}:${secs.toString().padStart(2, '0')}

🎯 المعركة مستمرة...`;
  if (WAR_CHANNEL && sock) {
    try {
      await sock.sendMessage(WAR_CHANNEL, { text: reportMsg });
    } catch (err) {
      console.error('❌ خطأ في إرسال التقرير اللحظي:', err.message);
    }
  }
}

async function startWar(war, sock) {
  const data = getRpgData();
  war.status = 'active';
  // بناء قائمة المشاركين
  const challengerParticipants = war.participants?.challenger || [];
  const targetParticipants = war.participants?.target || [];
  let participantsList = '';
  if (challengerParticipants.length) {
    participantsList += `\n🏰 *${war.challengerName}:*\n`;
    for (const p of challengerParticipants) {
      const playerName = data.players?.[p.playerId]?.name || 'مجهول';
      participantsList += `   • ${playerName} (${p.soldiers || 0} جندي)\n`;
    }
  }
  if (targetParticipants.length) {
    participantsList += `\n🏰 *${war.targetName}:*\n`;
    for (const p of targetParticipants) {
      const playerName = data.players?.[p.playerId]?.name || 'مجهول';
      participantsList += `   • ${playerName} (${p.soldiers || 0} جندي)\n`;
    }
  }
  if (participantsList === '') participantsList = '\n⚠️ لم يسجل أي مشارك حتى الآن!';
  const warStartMsg = `⚔️ *بدأت الحرب!*\n\n🏰 *${war.challengerName}* (Lv.${war.challengerLevel})\n⚔️ ضد\n🏰 *${war.targetName}* (Lv.${war.targetLevel})\n\n📋 *المشاركون:*${participantsList}\n\n⏰ مدة الحرب: 30 دقيقة\n💰 جائزة الفوز: ${war.prizePool.toLocaleString()} ذهب\n\n🎯 المعركة جارية الآن!`;
  if (WAR_CHANNEL && sock) {
    try {
      await sock.sendMessage(WAR_CHANNEL, { text: warStartMsg });
    } catch (err) {
      console.error('❌ خطأ في إرسال رسالة بدء الحرب:', err.message);
    }
  }
  startWarReports(war, sock);
}

function startWarReports(war, sock) {
  if (warReportTimers.has(war.id)) clearInterval(warReportTimers.get(war.id));
  sendWarReport(war, sock);
  const reportInterval = setInterval(async () => {
    sendWarReport(war, sock);
    if (Date.now() >= war.endsAt || war.status === 'ended') {
      clearInterval(reportInterval);
      warReportTimers.delete(war.id);
      if (war.status !== 'ended' && sock) await endWar(war, sock);
    }
  }, 5 * 60 * 1000);
  warReportTimers.set(war.id, reportInterval);
}

async function endWar(war, sock) {
  const data = getRpgData();
  const challengerClan = data.clans?.[war.challengerId];
  const targetClan = data.clans?.[war.targetId];
  const totalDamage = (war.challengerDamage || 0) + (war.targetDamage || 0);
  let challengerDestruction = 0, targetDestruction = 0;
  if (totalDamage > 0) {
    challengerDestruction = Math.min(100, Math.floor((war.challengerDamage / totalDamage) * 100));
    targetDestruction = Math.min(100, Math.floor((war.targetDamage / totalDamage) * 100));
  }
  const challengerWon = war.challengerDamage > war.targetDamage;
  const lootGold = challengerWon ? Math.floor((targetClan?.gold || 0) * 0.1) : Math.floor((challengerClan?.gold || 0) * 0.1);
  const lootElixir = challengerWon ? Math.floor((targetClan?.elixir || 0) * 0.1) : Math.floor((challengerClan?.elixir || 0) * 0.1);
  const allAttacks = [...(war.challengerAttacks || []), ...(war.targetAttacks || [])];
  let mvp = null, maxDamage = 0;
  for (const attack of allAttacks) {
    if (attack.damage > maxDamage) { maxDamage = attack.damage; mvp = attack; }
  }
  if (challengerWon) {
    if (challengerClan) {
      challengerClan.wins = (challengerClan.wins || 0) + 1;
      challengerClan.gold = (challengerClan.gold || 0) + war.prizePool + lootGold;
      if (targetClan) {
        targetClan.gold = Math.max(0, (targetClan.gold || 0) - lootGold);
        targetClan.elixir = Math.max(0, (targetClan.elixir || 0) - lootElixir);
      }
    }
    if (targetClan) targetClan.losses = (targetClan.losses || 0) + 1;
  } else {
    if (targetClan) {
      targetClan.wins = (targetClan.wins || 0) + 1;
      targetClan.gold = (targetClan.gold || 0) + war.prizePool + lootGold;
      if (challengerClan) {
        challengerClan.gold = Math.max(0, (challengerClan.gold || 0) - lootGold);
        challengerClan.elixir = Math.max(0, (challengerClan.elixir || 0) - lootElixir);
      }
    }
    if (challengerClan) challengerClan.losses = (challengerClan.losses || 0) + 1;
  }
  if (challengerClan) {
    challengerClan.wars.warHistory = challengerClan.wars.warHistory || [];
    challengerClan.wars.warHistory.push({ ...war, endedAt: Date.now() });
    challengerClan.wars.currentWar = null;
  }
  if (targetClan) {
    targetClan.wars.warHistory = targetClan.wars.warHistory || [];
    targetClan.wars.warHistory.push({ ...war, endedAt: Date.now() });
    targetClan.wars.currentWar = null;
  }
  saveDatabase();
  if (WAR_CHANNEL && sock) {
    const warReport = `🏆 *وثيقة النصر* 🏆\n\n⚔️ الحرب: ${war.challengerName} VS ${war.targetName}\n\n🥇 الفائز: ${challengerWon ? war.challengerName : war.targetName}\n💀 نسبة التدمير:\n   • ${war.challengerName}: ${challengerDestruction}%\n   • ${war.targetName}: ${targetDestruction}%\n\n💰 الغنائم:\n   • ذهب: ${lootGold.toLocaleString()}\n   • إكسير: ${lootElixir.toLocaleString()}\n\n⭐ MVP: ${mvp ? `@${mvp.playerId.split('@')[0]} (${mvp.damage.toLocaleString()} ضرر)` : 'غير محدد'}\n\n${"https://whatsapp.com/channel/0029VbCbgwIKgsNxh9vKb01n"}`;
    try {
      await sock.sendMessage(WAR_CHANNEL, { text: warReport, mentions: mvp ? [mvp.playerId] : [] });
    } catch (err) { console.error('❌ خطأ في إرسال تقرير الحرب للقناة:', err.message); }
  }
  return { winner: challengerWon ? war.challengerName : war.targetName, winnerId: challengerWon ? war.challengerId : war.targetId, loserId: challengerWon ? war.targetId : war.challengerId, prize: war.prizePool + lootGold, lootGold, lootElixir, challengerDestruction, targetDestruction, mvp: mvp ? { playerId: mvp.playerId, damage: mvp.damage, class: mvp.class } : null };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 تصدير الأوامر
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  name: 'Clan',
  getChannelJid: () => WAR_CHANNEL,
  setChannelJid: (jid) => setWarChannel(jid),
  commands: [
    'تفعيل_الكلان', 'createclan', 'إنشاء_كلان',
    'كلان', 'clan', 'كلانات',
    'تبرع', 'donate',
    'انضمام_الكلان', 'joinclan',
    'تحدي', 'challenge',
    'قبول_التحدي', 'accept',
    'رفض_التحدي', 'reject',
    'مشاركة_الحرب', 'مشاركة', 'participate',
    'الحرب', 'war', 'حربي',
    'التحديات', 'challenges',
    'الكلانات', 'clanslist',
    'نقل_كلان', 'transferclan',
    'حذف_كلان', 'deleteclan',
    'تدريب', 'train',
    'جيشي', 'myarmy',
    'مبناي', 'mybuildings',
    'شراء_حرب', 'buywar',
    'ترتيب_كلان', 'clanrank'
  ],
  async execute(sock, msg, ctx) {
    const { from, sender, pushName, command, args, text, prefix, isGroupAdmin, isGroup, groupMetadata } = ctx;
    const data = getRpgData();

    // ─────────────────────────────────────────────────────────────────────────────
    // تفعيل الكلان (createclan)
    // ─────────────────────────────────────────────────────────────────────────────
    if (['تفعيل_الكلان', 'createclan', 'إنشاء_كلان'].includes(command)) {
      if (!isGroup) return sock.sendMessage(from, { text: '❌ في مجموعة فقط!' });
      if (!isGroupAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين فقط!' });
      const clanName = args.join(' ');
      if (!clanName) return sock.sendMessage(from, { text: `❌ اكتب اسم الكلان!\n💡 ${prefix}تفعيل_الكلان صقور العرب` });
      const result = createClan(from, clanName, sender, pushName);
      if (!result.success) return sock.sendMessage(from, { text: result.message });
      return sock.sendMessage(from, { text: `🏰 تم إنشاء الكلان!\nالاسم: ${result.clan.name}\nTag: #${result.clan.clanTag}\n👑 القائد: ${pushName}` });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // معلومات الكلان
    // ─────────────────────────────────────────────────────────────────────────────
    if (['كلان', 'clan', 'كلانات'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ لا يوجد كلان!\n💡 مشرف المجموعة يستطيع تفعيل الكلان' });
      const buff = getClanBuff(clan.level);
      const progress = progressClanBar(clan.xp, clan.level);
      const xpNeeded = clanXpForLevel(clan.level);
      const leaderName = clan.leaderName || data.players?.[clan.leader]?.name || 'غير معروف';
      return sock.sendMessage(from, { text: `🏰 ${clan.name} #${clan.clanTag}\n⭐ المستوى: ${clan.level}\n📊 التقدم: [${progress}] ${clan.xp}/${xpNeeded}\n💰 الخزنة: ${(clan.gold || 0).toLocaleString()} ذهب\n👥 الأعضاء: ${clan.members?.length || 1}\n⚔️ الانتصارات: ${clan.wins || 0} | 🛡️ الهزائم: ${clan.losses || 0}\n📈 باف الكلان: +${buff.atk.toFixed(1)}% هجوم, +${buff.defense.toFixed(1)}% دفاع\n👑 القائد: ${leaderName}` });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // التبرع للكلان
    // ─────────────────────────────────────────────────────────────────────────────
    if (['تبرع', 'donate'].includes(command)) {
      const player = data.players?.[sender];
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      const amount = parseInt(args[0]);
      if (!amount) return sock.sendMessage(from, { text: `❌ حدد المبلغ!\n💡 ${prefix}تبرع 500` });
      const clan = getClan(from);
      const result = donateToClan(clan, player, amount);
      let response = result.message;
      if (result.leveledUp) response += `\n\n🎉 الكلان ارتقى للمستوى ${result.newLevel}!`;
      return sock.sendMessage(from, { text: response });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // الانضمام للكلان
    // ─────────────────────────────────────────────────────────────────────────────
    if (['انضمام_الكلان', 'joinclan'].includes(command)) {
      const result = joinClan(from, sender);
      return sock.sendMessage(from, { text: result.message });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // قائمة الكلانات
    // ─────────────────────────────────────────────────────────────────────────────
    if (['الكلانات', 'clanslist'].includes(command)) {
      const clans = getRankedClansList('');
      if (!clans.length) return sock.sendMessage(from, { text: '❌ لا توجد كلانات!' });
      const list = clans.slice(0, 15).map((c, i) => `${i + 1}. 🏰 ${c.name} #${c.clanTag}\n   ⭐ Lv.${c.level} | 👥 ${c.members} | ⚔️ ${c.wins}`).join('\n\n');
      return sock.sendMessage(from, { text: `🏰 قائمة الكلانات:\n\n${list}` });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // تحدي كلان
    // ─────────────────────────────────────────────────────────────────────────────
    if (['تحدي', 'challenge'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });
      if (!args[0]) {
        const clans = getRankedClansList(from);
        if (!clans.length) return sock.sendMessage(from, { text: '❌ لا توجد كلانات للتحدي!' });
        const list = clans.slice(0, 10).map((c, i) => `${i + 1}. 🏰 ${c.name} #${c.clanTag} (Lv.${c.level} | ${c.members} عضو)`).join('\n');
        return sock.sendMessage(from, { text: `🏰 اختر كلان للتحدي:\n\n${list}\n\n💡 ${prefix}تحدي <اسم الكلان أو رقم>` });
      }
      let targetClan;
      const input = args.join(' ');
      const clans = getRankedClansList(from);
      if (/^\d+$/.test(input)) targetClan = clans[parseInt(input) - 1];
      else targetClan = clans.find(c => c.name.toLowerCase().includes(input.toLowerCase()) || c.clanTag === input);
      if (!targetClan) return sock.sendMessage(from, { text: '❌ الكلان غير موجود!' });
      const result = await challengeClan(clan, targetClan.id, sender, sock);
      if (!result.success) return sock.sendMessage(from, { text: result.message });
      try { await sock.sendMessage(targetClan.id, { text: `⚔️ *تحدي حرب!*\n\n🏰 ${result.challengerName} يتحدى كلانكم!\n💰 الجائزة: ${result.prizePool.toLocaleString()} ذهب\n⏰ المدة: 30 دقيقة\n\n💡 استخدم ${prefix}التحديات لعرض التحديات\n💡 ${prefix}قبول_التحدي <رقم> للقبول` }); } catch (e) {}
      return sock.sendMessage(from, { text: `⚔️ تم إرسال تحدي!\n\n🏰 ${result.challengerName} VS 🏰 ${result.targetName}\n💰 الجائزة: ${result.prizePool.toLocaleString()} ذهب\n⏳ ينتظر موافقة قائد ${result.targetName}` });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // التحديات المعلقة
    // ─────────────────────────────────────────────────────────────────────────────
    if (['التحديات', 'challenges'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });
      const challenges = clan.wars?.pendingChallenges || [];
      if (!challenges.length) return sock.sendMessage(from, { text: '✅ لا توجد تحديات معلقة!' });
      const list = challenges.map((c, i) => `${i + 1}. ⚔️ ${c.challengerName} يتحداك!\n💰 الجائزة: ${c.prizePool.toLocaleString()}`).join('\n\n');
      return sock.sendMessage(from, { text: `📜 التحديات المعلقة:\n\n${list}\n\n✅ ${prefix}قبول_التحدي <الرقم>\n❌ ${prefix}رفض_التحدي <الرقم>` });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // قبول التحدي
    // ─────────────────────────────────────────────────────────────────────────────
    if (['قبول_التحدي', 'accept'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });
      if (!isClanLeader(clan, sender)) return sock.sendMessage(from, { text: '❌ للقائد فقط!' });
      const challengeIndex = parseInt(args[0]) - 1;
      const challenges = clan.wars?.pendingChallenges || [];
      if (isNaN(challengeIndex) || challengeIndex < 0 || challengeIndex >= challenges.length) return sock.sendMessage(from, { text: '❌ رقم التحدي غير صحيح!' });
      const result = await acceptChallenge(clan, challenges[challengeIndex].id, sender);
      if (!result.success) return sock.sendMessage(from, { text: result.message });
      const war = result.war;
      setTimeout(async () => { try { await startWar(war, sock); } catch (err) { console.error('❌ خطأ في بدء الحرب:', err.message); } }, WAR_PREP_TIME);
      return sock.sendMessage(from, { text: `⚔️ قبلت التحدي!\n\n🏰 ${war.challengerName} VS 🏰 ${war.targetName}\n💰 الجائزة: ${war.prizePool.toLocaleString()} ذهب\n⏰ ستبدأ المعركة خلال 15 دقيقة!\n🎯 استخدم: ${prefix}مشاركة_الحرب <عدد الجنود>` });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // رفض التحدي
    // ─────────────────────────────────────────────────────────────────────────────
    if (['رفض_التحدي', 'reject'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });
      if (!isClanLeader(clan, sender)) return sock.sendMessage(from, { text: '❌ للقائد فقط!' });
      const challengeIndex = parseInt(args[0]) - 1;
      const challenges = clan.wars?.pendingChallenges || [];
      if (isNaN(challengeIndex) || challengeIndex < 0 || challengeIndex >= challenges.length) return sock.sendMessage(from, { text: '❌ رقم التحدي غير صحيح!' });
      const success = rejectChallenge(clan, challenges[challengeIndex].id, sender);
      if (!success) return sock.sendMessage(from, { text: '❌ فشل في رفض التحدي!' });
      return sock.sendMessage(from, { text: `❌ تم رفض تحدي من ${challenges[challengeIndex].challengerName}` });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // المشاركة في الحرب (تسجيل الجنود فقط)
    // ─────────────────────────────────────────────────────────────────────────────
    if (['مشاركة_الحرب', 'مشاركة', 'participate'].includes(command)) {
      const player = data.players?.[sender];
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });
      const war = getActiveWar(from);
      if (!war) return sock.sendMessage(from, { text: '❌ لا توجد حرب نشطة!' });
      if (Date.now() >= war.prepEndTime) return sock.sendMessage(from, { text: '❌ انتهت فترة التجهيز! الحرب بدأت.' });
      const soldierCount = parseInt(args[0]);
      if (!soldierCount || soldierCount <= 0) return sock.sendMessage(from, { text: `❌ حدد عدد الجنود!\n💡 ${prefix}مشاركة_الحرب 50` });
      const maxCapacity = getArmyCapacity(clan.settlement?.buildings?.barracks?.level || 1);
      if (soldierCount > maxCapacity) return sock.sendMessage(from, { text: `❌ عدد الجنود (${soldierCount}) يتجاوز سعة الثكنات (${maxCapacity})!` });
      if (soldierCount > (player.soldiers || 0)) return sock.sendMessage(from, { text: `❌ ليس لديك جنود كافيين!\n🪖 جنودك: ${player.soldiers || 0}` });
      const result = registerWarParticipation(clan, war, sender, soldierCount);
      if (!result.success) return sock.sendMessage(from, { text: result.message });
      const remaining = Math.ceil((war.prepEndTime - Date.now()) / 60000);
      return sock.sendMessage(from, { text: `✅ تم تسجيل مشاركتك!\n⚔️ الجنود: ${soldierCount}\n⏰ متبقي للتجهيز: ${remaining} دقيقة` });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // حالة الحرب
    // ─────────────────────────────────────────────────────────────────────────────
    if (['الحرب', 'war', 'حربي'].includes(command)) {
      const war = getActiveWar(from);
      if (!war) return sock.sendMessage(from, { text: '❌ لا توجد حرب نشطة!' });
      const remaining = Math.max(0, war.endsAt - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      const isChallenger = war.challengerId === from;
      const myDamage = isChallenger ? war.challengerDamage : war.targetDamage;
      const enemyDamage = isChallenger ? war.targetDamage : war.challengerDamage;
      const myName = isChallenger ? war.challengerName : war.targetName;
      const enemyName = isChallenger ? war.targetName : war.challengerName;
      return sock.sendMessage(from, { text: `⚔️ حالة الحرب\n\n🏰 ${myName}: ${myDamage?.toLocaleString() || 0} ضرر\n🏰 ${enemyName}: ${enemyDamage?.toLocaleString() || 0} ضرر\n\n⏱️ الوقت المتبقي: ${mins}:${secs.toString().padStart(2, '0')}\n💰 الجائزة: ${war.prizePool?.toLocaleString() || 0} ذهب` });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // نقل قيادة الكلان
    // ─────────────────────────────────────────────────────────────────────────────
    if (['نقل_كلان', 'transferclan'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });
      if (!isClanLeader(clan, sender)) return sock.sendMessage(from, { text: '❌ فقط قائد الكلان يستطيع هذا الأمر!' });
      const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!mentioned) return sock.sendMessage(from, { text: `❌ اذكر الشخص!\n💡 ${prefix}نقل_كلان @الشخص` });
      const result = transferClanLeadership(clan, mentioned, sender);
      if (!result.success) return sock.sendMessage(from, { text: result.message });
      return sock.sendMessage(from, { text: result.message });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // حذف الكلان
    // ─────────────────────────────────────────────────────────────────────────────
    if (['حذف_كلان', 'deleteclan'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });
      if (!isClanLeader(clan, sender)) return sock.sendMessage(from, { text: '❌ فقط قائد الكلان يستطيع حذف الكلان!' });
      const result = deleteClan(clan, sender);
      if (!result.success) return sock.sendMessage(from, { text: result.message });
      return sock.sendMessage(from, { text: `💀 تم حذف الكلان بواسطة القائد ${result.message}` });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // تدريب الجنود
    // ─────────────────────────────────────────────────────────────────────────────
    if (['تدريب', 'train'].includes(command)) {
      const player = data.players?.[sender];
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });
      const amount = parseInt(args[0]) || 10;
      const result = trainSoldiers(player, clan, amount);
      return sock.sendMessage(from, { text: result.message });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // عرض جيشي
    // ─────────────────────────────────────────────────────────────────────────────
    if (['جيشي', 'myarmy'].includes(command)) {
      const player = data.players?.[sender];
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });
      const playerClass = player.class || "محارب";
      const soldierType = (SOLDIER_TYPES[playerClass] || "infantry");
      const soldierName = SOLDIER_NAMES[soldierType];
      let buildingLevel = 1;
      if (soldierType === "infantry" || soldierType === "cavalry") buildingLevel = clan.settlement?.buildings?.barracks?.level || 1;
      else if (soldierType === "archer") buildingLevel = clan.settlement?.buildings?.watchtower?.level || 1;
      else if (soldierType === "mage") buildingLevel = clan.settlement?.buildings?.mageTower?.level || 1;
      else if (soldierType === "healer") buildingLevel = clan.settlement?.buildings?.hospital?.level || 1;
      const maxCapacity = getArmyCapacity(buildingLevel);
      const current = player.soldiers || 0;
      return sock.sendMessage(from, { text: `🪖 *جيشك*\n🎯 الصنف: ${playerClass}\n⚔️ نوع الجنود: ${soldierName}\n📊 العدد: ${current}/${maxCapacity}\n🏰 مستوى المبنى: ${buildingLevel}\n💡 ${prefix}تدريب <عدد> لزيادة الجيش` });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // عرض مباني المستوطنة
    // ─────────────────────────────────────────────────────────────────────────────
    if (['مبناي', 'mybuildings'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });
      const buildings = clan.settlement?.buildings || {};
      let text = `🏰 *مباني مستوطنتك*\n\n`;
      const castleLevel = buildings.castle?.level || 1;
      text += `🏰 القلعة المركزية: مستوى ${castleLevel}\n   👥 سعة الأعضاء: ${BUILDINGS.castle.effects.memberCapacity[castleLevel - 1]}\n\n`;
      if (buildings.barracks) text += `⚔️ الثكنات: مستوى ${buildings.barracks.level}\n   📊 سعة الجيش: +${BUILDINGS.barracks.effects.armyCapacity[buildings.barracks.level - 1]}\n\n`;
      if (buildings.mageTower) text += `🔮 برج السحر: مستوى ${buildings.mageTower.level}\n   🛡️ الدفاع السحري: +${(BUILDINGS.mageTower.effects.magicalDefense[buildings.mageTower.level - 1] * 100).toFixed(0)}%\n\n`;
      if (buildings.hospital) text += `🏥 المشفى: مستوى ${buildings.hospital.level}\n   💚 تقليل الخسائر: ${(BUILDINGS.hospital.effects.warLossReduction[buildings.hospital.level - 1] * 100).toFixed(0)}%\n\n`;
      if (buildings.watchtower) text += `🗼 برج المراقبة: مستوى ${buildings.watchtower.level}\n   🎯 كشف العدو: ${(BUILDINGS.watchtower.effects.enemyDefReveal[buildings.watchtower.level - 1] * 100).toFixed(0)}%\n\n`;
      const walls = buildings.wall || [];
      if (walls.length) {
        const totalDefense = walls.reduce((sum, w) => sum + (BUILDINGS.wall.effects.defenseBonus[(w.level || 1) - 1] || 0), 0);
        text += `🧱 الأسوار (${walls.length}): دفاع إجمالي ${totalDefense}\n\n`;
      }
      text += `⛏️ مناجم الذهب: ${buildings.goldMine?.length || 0}\n⚗️ جامعات الإكسير: ${buildings.elixirCollector?.length || 0}`;
      return sock.sendMessage(from, { text });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // شراء عناصر حرب
    // ─────────────────────────────────────────────────────────────────────────────
    if (['شراء_حرب', 'buywar'].includes(command)) {
      const player = data.players?.[sender];
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      const itemName = args.join(' ');
      if (!itemName) {
        const items = Object.keys(WAR_ITEMS).join(' | ');
        return sock.sendMessage(from, { text: `🛒 المتجر الحربي:\n\n${items}\n\n💡 ${prefix}شراء_حرب <اسم العنصر>` });
      }
      const result = buyWarItem(player, itemName);
      return sock.sendMessage(from, { text: result.message });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // ترتيب الكلانات
    // ─────────────────────────────────────────────────────────────────────────────
    if (['ترتيب_كلان', 'clanrank'].includes(command)) {
      const ranking = getClanRankings();
      return sock.sendMessage(from, { text: ranking });
    }

    // نهاية execute
  }
};
