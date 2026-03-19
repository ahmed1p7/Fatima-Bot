// ═══════════════════════════════════════════════════════════════════════════════
// 🏰 نظام الكلانات والحروب
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';

// قناة الحروب للإعلانات
export const WAR_CHANNEL = '0029VbCbgwIKgsNxh9vKb01n';

// ═══════════════════════════════════════════════════════════════════════════════
// 🏰 إدارة الكلانات
// ═══════════════════════════════════════════════════════════════════════════════

export const createClan = (groupId, name, creatorId, creatorName) => {
  const data = getRpgData();
  if (!data.clans) data.clans = {};

  if (data.clans[groupId]) return { success: false, message: '❌ الجروب لديه كلان!' };

  const existing = Object.values(data.clans).find(c => c.name.toLowerCase() === name.toLowerCase());
  if (existing) return { success: false, message: '❌ الاسم مستخدم!' };

  data.clans[groupId] = {
    id: groupId, name, level: 1, xp: 0, gold: 0,
    leader: creatorId, deputies: [], members: [creatorId], memberCount: 1,
    wins: 0, losses: 0, announcement: '',
    created: Date.now(), lastWar: 0, totalDonations: 0, events: []
  };

  saveDatabase();
  return { success: true, clan: data.clans[groupId] };
};

export const getClan = (groupId) => getRpgData().clans?.[groupId] || null;

export const joinClan = (groupId, userId) => {
  const data = getRpgData();
  const clan = data.clans?.[groupId];
  if (!clan) return { success: false, message: '❌ لا يوجد كلان!' };
  if (clan.members.includes(userId)) return { success: false, message: '❌ عضو بالفعل!' };
  clan.members.push(userId);
  clan.memberCount = clan.members.length;
  saveDatabase();
  return { success: true, message: `✅ انضممت لـ ${clan.name}!` };
};

export const donateToClan = (groupId, userId, amount, playerGold) => {
  const data = getRpgData();
  const clan = data.clans?.[groupId];
  if (!clan) return { success: false, message: '❌ لا يوجد كلان!' };
  if (!clan.members.includes(userId)) return { success: false, message: '❌ لست عضواً!' };
  if (playerGold < amount) return { success: false, message: '❌ ذهبك لا يكفي!' };
  if (amount < 100) return { success: false, message: '❌ الحد الأدنى 100!' };

  clan.gold += amount;
  clan.totalDonations += amount;
  clan.xp += Math.floor(amount / 100);
  clan.events = clan.events || [];
  clan.events.push({ type: 'donation', userId, amount, time: Date.now() });

  let leveledUp = false;
  while (clan.xp >= clanXpForLevel(clan.level) && clan.level < 50) {
    clan.xp -= clanXpForLevel(clan.level);
    clan.level++;
    leveledUp = true;
  }

  saveDatabase();
  return { success: true, message: `✅ تبرعت بـ ${amount}!`, leveledUp, newLevel: clan.level };
};

export const clanXpForLevel = (lv) => Math.floor(500 * Math.pow(1.3, lv - 1));

export const progressClanBar = (xp, level) => {
  const pct = xp / clanXpForLevel(level);
  return '▰'.repeat(Math.floor(pct * 8)) + '▱'.repeat(8 - Math.floor(pct * 8));
};

export const getClanBuff = (level) => ({
  atk: level * 0.5,
  discount: Math.min(level * 0.5, 20),
  defense: level * 0.3
});

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ نظام الحروب
// ═══════════════════════════════════════════════════════════════════════════════

const activeWars = new Map();
const pendingChallenges = new Map();

export const challengeClan = (challengerId, targetId, challengerLeader, challengerLeaderName) => {
  const data = getRpgData();
  if (!data.clans[challengerId] || !data.clans[targetId]) {
    return { success: false, message: '❌ كلان غير موجود!' };
  }
  if (challengerId === targetId) return { success: false, message: '❌ لا نفسك!' };

  const challenger = data.clans[challengerId];
  const target = data.clans[targetId];

  if (Date.now() - challenger.lastWar < 3 * 60 * 60 * 1000) {
    const rem = Math.ceil((3 * 60 * 60 * 1000 - (Date.now() - challenger.lastWar)) / 60000);
    return { success: false, message: `⏰ انتظر ${rem} دقيقة!` };
  }

  const challengeId = `war_${Date.now()}`;
  const challenge = {
    challengeId, challengerId, targetId,
    challengerName: challenger.name, targetName: target.name,
    challengerLeader, challengerLeaderName,
    targetLeader: target.leader,
    challengerLevel: challenger.level,
    challengerMembers: challenger.memberCount,
    challengerWins: challenger.wins,
    targetLevel: target.level,
    createdAt: Date.now(),
    prizePool: Math.floor((challenger.gold + target.gold) * 0.1) + 1000
  };

  pendingChallenges.set(challengeId, challenge);
  setTimeout(() => pendingChallenges.delete(challengeId), 10 * 60 * 1000);

  return { success: true, ...challenge };
};

export const acceptChallenge = (challengeId, accepterId, accepterName) => {
  const challenge = pendingChallenges.get(challengeId);
  if (!challenge) return { success: false, message: '❌ التحدي منتهي!' };

  pendingChallenges.delete(challengeId);

  const war = {
    id: challengeId,
    challengerId: challenge.challengerId,
    targetId: challenge.targetId,
    challengerName: challenge.challengerName,
    targetName: challenge.targetName,
    challengerDamage: 0, targetDamage: 0,
    attackerContributions: {}, defenderContributions: {},
    prizePool: challenge.prizePool,
    startedAt: Date.now(),
    endsAt: Date.now() + 30 * 60 * 1000,
    status: 'active',
    acceptedBy: accepterId, acceptedByName: accepterName
  };

  activeWars.set(challengeId, war);
  setTimeout(() => endWar(challengeId), 30 * 60 * 1000);

  return { success: true, war, challenge };
};

export const rejectChallenge = (challengeId, rejecterName) => {
  const challenge = pendingChallenges.get(challengeId);
  if (!challenge) return null;
  pendingChallenges.delete(challengeId);
  return { ...challenge, rejectedBy: rejecterName };
};

export const getPendingChallenges = (groupId) => {
  const result = [];
  for (const [id, c] of pendingChallenges) {
    if (c.targetId === groupId) result.push({ id, ...c });
  }
  return result;
};

export const getChallenge = (id) => pendingChallenges.get(id);

export const attackInWar = (warId, groupId, userId, playerAtk) => {
  const war = activeWars.get(warId);
  if (!war) return { success: false, message: '❌ لا حرب!' };
  if (Date.now() > war.endsAt) return { success: false, message: '❌ انتهت!' };

  const data = getRpgData();
  const clan = data.clans[groupId];
  if (!clan || !clan.members.includes(userId)) return { success: false, message: '❌ لست عضواً!' };

  const buff = getClanBuff(clan.level);
  const damage = Math.floor((playerAtk + Math.random() * 50) * (1 + buff.atk / 100));

  if (groupId === war.challengerId) {
    war.challengerDamage += damage;
    war.attackerContributions[userId] = (war.attackerContributions[userId] || 0) + damage;
  } else if (groupId === war.targetId) {
    war.targetDamage += damage;
    war.defenderContributions[userId] = (war.defenderContributions[userId] || 0) + damage;
  } else {
    return { success: false, message: '❌ لست في الحرب!' };
  }

  saveDatabase();
  return { success: true, damage, totalDamage: groupId === war.challengerId ? war.challengerDamage : war.targetDamage };
};

export const endWar = (warId) => {
  const war = activeWars.get(warId);
  if (!war) return null;

  const data = getRpgData();
  const challenger = data.clans[war.challengerId];
  const target = data.clans[war.targetId];
  if (!challenger || !target) { activeWars.delete(warId); return null; }

  let winner, loser, winnerId, loserId;
  if (war.challengerDamage > war.targetDamage) {
    winner = challenger; loser = target;
    winnerId = war.challengerId; loserId = war.targetId;
  } else if (war.targetDamage > war.challengerDamage) {
    winner = target; loser = challenger;
    winnerId = war.targetId; loserId = war.challengerId;
  } else {
    activeWars.delete(warId);
    return { tie: true, war };
  }

  const prize = Math.min(war.prizePool, Math.floor(loser.gold * 0.15));
  loser.gold -= prize;
  winner.gold += prize;
  winner.wins++;
  loser.losses++;
  winner.lastWar = Date.now();
  loser.lastWar = Date.now();
  winner.xp += 100;
  if (winner.xp >= clanXpForLevel(winner.level) && winner.level < 50) {
    winner.level++;
    winner.xp -= clanXpForLevel(winner.level - 1);
  }

  saveDatabase();
  activeWars.delete(warId);

  return {
    winner: { id: winnerId, name: winner.name, damage: winnerId === war.challengerId ? war.challengerDamage : war.targetDamage },
    loser: { id: loserId, name: loser.name, damage: loserId === war.challengerId ? war.challengerDamage : war.targetDamage },
    prize, war
  };
};

export const getActiveWar = (groupId) => {
  for (const [id, war] of activeWars) {
    if (war.challengerId === groupId || war.targetId === groupId) return { id, ...war };
  }
  return null;
};

export const getAvailableClans = (excludeId) => {
  const data = getRpgData();
  return Object.entries(data.clans || {})
    .filter(([id]) => id !== excludeId)
    .map(([id, c]) => ({ id, name: c.name, level: c.level, members: c.memberCount, wins: c.wins }))
    .sort((a, b) => b.level - a.level);
};

export const getPlayerClan = (userId) => {
  const data = getRpgData();
  for (const [id, clan] of Object.entries(data.clans || {})) {
    if (clan.members.includes(userId)) return { groupId: id, ...clan };
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📢 تنسيق الرسائل
// ═══════════════════════════════════════════════════════════════════════════════

export const formatChallengeForChannel = (c) => `⚔️ تحدي كلان جديد! ⚔️

🏰 ${c.challengerName}
⭐ Lv.${c.challengerLevel} | 👥 ${c.challengerMembers} | 🏆 ${c.challengerWins}

        ⚔️ يتحدى ⚔️

🏰 ${c.targetName}
⭐ Lv.${c.targetLevel}

💰 جائزة: ${c.prizePool.toLocaleString()} ذهب
⏳ بانتظار موافقة ${c.targetName}...

#حروب_الكلانات`;

export const formatChallengeForGroup = (c, clan) => `⚔️⚔️⚔️ تحدي جديد! ⚔️⚔️⚔️

🏰 "${c.challengerName}" يتحدونكم!

━━━━━━━━━━━━━━━━━━━━
📊 المتحدي:
⭐ Lv.${c.challengerLevel}
👥 ${c.challengerMembers} محارب
🏆 ${c.challengerWins} انتصار
💰 ${clan?.gold?.toLocaleString() || '?'} ذهب
━━━━━━━━━━━━━━━━━━━━

💰 الجائزة: ${c.prizePool.toLocaleString()} ذهب
👤 المتحدي: ${c.challengerLeaderName || 'القائد'}

⏰ 10 دقائق للرد!

✅ .قبول_التحدي ${c.challengeId}
❌ .رفض_التحدي ${c.challengeId}

👑 للقائد فقط!`;

export const formatChallengeForLeader = (c) => `⚔️ تحدي جديد!

🏰 "${c.challengerName}" يتحدى "${c.targetName}"!

━━━━━━━━━━━━━━━━━━━━
⭐ Lv.${c.challengerLevel} | 👥 ${c.challengerMembers} | 🏆 ${c.challengerWins}
💰 الجائزة: ${c.prizePool.toLocaleString()} ذهب
━━━━━━━━━━━━━━━━━━━━

✅ .قبول_التحدي ${c.challengeId}
❌ .رفض_التحدي ${c.challengeId}

⏰ 10 دقائق للرد!`;

export const formatAcceptForChannel = (c, w) => `✅ تم قبول التحدي!

⚔️ ${w.challengerName} VS ${w.targetName} ⚔️

⏱️ 30 دقيقة | 💰 ${w.prizePool.toLocaleString()} ذهب

🎯 بدأت الحرب!
#حروب_الكلانات`;

export const formatRejectForChannel = (c) => `❌ تم رفض التحدي!

🏰 ${c.challengerName} → ${c.targetName}
👤 بواسطة: ${c.rejectedBy}

#حروب_الكلانات`;

export const formatWarResultForChannel = (r) => {
  if (r.tie) return `🤝 تعادل!

⚔️ ${r.war.challengerName} VS ${r.war.targetName}
💥 ضرر متساوي!
#حروب_الكلانات`;

  return `🏆 انتهت الحرب! 🏆

🥇 ${r.winner.name}
💥 ${r.winner.damage.toLocaleString()} ضرر

VS

🥈 ${r.loser.name}
💥 ${r.loser.damage.toLocaleString()} ضرر

💰 +${r.prize.toLocaleString()} ذهب
#حروب_الكلانات`;
};
