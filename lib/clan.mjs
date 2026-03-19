// ═══════════════════════════════════════════════════════════════════════════════
// 🏰 نظام الكلانات والحروب
// ═════════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';

// قناة الحروب للإعلانات
export const WAR_CHANNEL = '0029VbCbgwIKgsNxh9vKb01n';

// ═════════════════════════════════════════════════════════════════════════════════
// 🏰 إدارة الكلانات
// ═════════════════════════════════════════════════════════════════════════════════

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
  const clan = data.clans?.[groupId]

  if (!clan) return { success: false, message: '❌ لا يوجد كلان!' };
  if (clan.members.includes(userId)) return { success: false, message: '❌ عضو بالفعل!' };

  clan.members.push(userId);
  clan.memberCount = clan.members.length;
  saveDatabase();

  return { success: true, message: `✅ انضممت لـ ${clan.name}!` };
};

export const donateToClan = (groupId, userId, amount, playerGold) => {
  const data = getRpgData();
  const clan = data.clans?.[groupId]

  if (!clan) return { success: false, message: '❌ لا يوجد كلان!' };
  if (!clan.members.includes(userId)) return { success: false, message: '❌ لست عضواً!' };
  if (playerGold < amount) return { success: false, message: '❌ ذهبك لا يكفي!' };
  if (amount < 100) return { success: false, message: '❌ الحد الأدنى 100!' };

  clan.gold += amount;
  clan.totalDonations += amount;
  clan.xp += Math.floor(amount / 100);
  clan.events = clan.events || []
  clan.events.push({ type: 'donation', userId, amount, time: Date.now() })

  let leveledUp = false
  while (clan.xp >= clanXpForLevel(clan.level) && clan.level < 50) {
    clan.xp -= clanXpForLevel(clan.level);
    clan.level++
    leveledUp = true
  }

  saveDatabase()
  return { success: true, message: `✅ تبرعت بـ ${amount}!`, leveledUp, newLevel: clan.level };
  };
}

export const clanXpForLevel = (lv) => Math.floor(500 * Math.pow(1.3, lv - 1))

export const progressClanBar = (xp, level) => {
  const need = clanXpForLevel(level)
  const pct = xp / need
  return '▰'.repeat(Math.floor(pct * 8)) + '▱'.repeat(8 - Math.floor(pct * 8))
}

export const getClanBuff = (level) => ({
  atk: level * 0.5,
  discount: Math.min(level * 0.5, 20),
  defense: level * 0.3
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ نظام الحروب
// ═══════════════════════════════════════════════════════════════════════════════

const activeWars = new Map()
const pendingChallenges = new Map()

// بدء تحدي
export const challengeClan = (challengerId, targetId, challengerLeader, challengerLeaderName) => {
  const data = getRpgData()

  if (!data.clans[challengerId] || !data.clans[targetId]) {
    return { success: false, message: '❌ كلان غير موجود!' }
  }
  if (challengerId === targetId) {
    return { success: false, message: '❌ لا نفسك!' }
  }
  const challenger = data.clans[challengerId]
  const target = data.clans[targetId]

  // التحقق من cooldown
  const now = Date.now()
  if (now - challenger.lastWar < 3 * 60 * 60 * 1000) {
    const remaining = Math.ceil((3 * 60 * 60 * 1000 - (now - challenger.lastWar)) / 60000)
    return { success: false, message: `⏰ انتظر ${remaining} دقيقة!` }
  }
  // إنشاء تحدي معلق
  const challengeId = `war_${Date.now()}`
  const prizePool = Math.floor((challenger.gold + target.gold) * 0.1) + 1000
  const challenge = {
    challengeId,
    challengerId,
    targetId
    challengerName: challenger.name
    targetName: target.name
    challengerLeader
    challengerLeaderName
    targetLeader: target.leader
    challengerLevel: challenger.level
    challengerMembers: challenger.memberCount
    challengerWins: challenger.wins
    targetLevel: target.level
    createdAt: now
    prizePool
  }
  pendingChallenges.set(challengeId, challenge)
  // إلغاء التحدي بعد 10 دقائق
  setTimeout(() => {
    if (pendingChallenges.has(challengeId)) {
      pendingChallenges.delete(challengeId)
    }
  }, 10 * 60 * 1000)
  return {
    success: true,
    ...challenge
  }
}

// قبول التحدي
export const acceptChallenge = (challengeId, accepterId, accepterName) => {
  const challenge = pendingChallenges.get(challengeId)
  if (!challenge) {
    return { success: false, message: '❌ التحدي غير موجود أو منتهي!' }
  }
  pendingChallenges.delete(challengeId)
  // بدء الحرب
  const war = {
    id: challengeId,
    challengerId: challenge.challengerId
    targetId: challenge.targetId
    challengerName: challenge.challengerName
    targetName: challenge.targetName
    challengerDamage: 0
    targetDamage: 0
    attackerContributions: {}
    defenderContributions: {}
    prizePool: challenge.prizePool
    startedAt: Date.now()
    endsAt: Date.now() + 30 * 60 * 1000,
    status: 'active'
    acceptedBy: accepterId
    acceptedByName: accepterName
  }
  activeWars.set(challengeId, war)
  // إنهاء الحرب بعد 30 دقيقة
  setTimeout(() => endWar(challengeId), 30 * 60 * 1000)
  return { success: true, war, challenge }
}
// رفض التحدي
export const rejectChallenge = (challengeId, rejecterName) => {
  const challenge = pendingChallenges.get(challengeId)
  if (!challenge) return null
  pendingChallenges.delete(challengeId)
  return { ...challenge, rejectedBy: rejecterName }
}
// الحصول على التحديات المعلقة
export const getPendingChallenges = (groupId) => {
  const challenges = []
  for (const [id, c] of pendingChallenges) {
    if (c.targetId === groupId) {
      challenges.push({ id, ...c })
    }
  }
  return challenges
}
// الحصول على تحدي محدد
export const getChallenge = (challengeId) => pendingChallenges.get(challengeId)
// الهجوم في الحرب
export const attackInWar = (warId, groupId, userId, playerAtk) => {
  const war = activeWars.get(warId)
  if (!war) {
    return { success: false, message: '❌ لا حرب!' }
  }
  if (Date.now() > war.endsAt) {
    return { success: false, message: '❌ انتهت!' }
  }
  const now = Date.now()
  const data = getRpgData()
  const clan = data.clans[groupId]
  if (!clan || !clan.members.includes(userId)) {
    return { success: false, message: '❌ لست عضواً!' }
  }
  // حساب الضرر مع باف الكلان
  const buff = getClanBuff(clan.level)
  const baseDamage = playerAtk + Math.floor(Math.random() * 50)
  const damage = Math.floor(baseDamage * (1 + buff.atk / 100))
  // إضافة الضرر
  if (groupId === war.challengerId) {
    war.challengerDamage += damage
    war.attackerContributions[userId] = (war.attackerContributions[userId] || 0) + damage
  } else if (groupId === war.targetId) {
    war.targetDamage += damage
    war.defenderContributions[userId] = (war.defenderContributions[userId] || 0) + damage
  } else {
    return { success: false, message: '❌ لست في هذه الحرب!' }
  }
  // تحديث وقت آخر هجوم للاعب
  const player = data.players?.[userId]
  if (player) {
    player.lastWarAttack = now
  }
  saveDatabase()
  return {
    success: true
    damage
    totalDamage: groupId === war.challengerId ? war.challengerDamage : war.targetDamage
  }
}
// إنهاء الحرب
export const endWar = (warId) => {
  const war = activeWars.get(warId)
  if (!war) return null
  const data = getRpgData()
  const challenger = data.clans[war.challengerId]
  const target = data.clans[war.targetId]
  if (!challenger || !target) {
    activeWars.delete(warId)
    return null
  }
  // تحديد الفائز
  let winner, loser, winnerId, loserId
  if (war.challengerDamage > war.targetDamage) {
    winner = challenger
    loser = target
    winnerId = war.challengerId
    loserId = war.targetId
  } else if (war.targetDamage > war.challengerDamage) {
    winner = target
    loser = challenger
    winnerId = war.targetId
    loserId = war.challengerId
  } else {
    // تعادل
    activeWars.delete(warId)
    return { tie: true, war }
  }
  // نقل الذهب
  const prize = Math.min(war.prizePool, Math.floor(loser.gold * 0.15))
  loser.gold -= prize
  winner.gold += prize
  winner.wins++
  loser.losses++
  winner.lastWar = Date.now()
  loser.lastWar = Date.now()
  // تحديث ليفل الكلان
  winner.xp += 100
  const need = clanXpForLevel(winner.level)
  if (winner.xp >= need && winner.level < 50) {
    winner.level++
    winner.xp -= need
  }
  }
  saveDatabase()
  activeWars.delete(warId)
  return {
    winner: { id: winnerId, name: winner.name, damage: winnerId === war.challengerId ? war.challengerDamage : war.targetDamage }
    loser: { id: loserId, name: loser.name, damage: loserId === war.challengerId ? war.challengerDamage : war.targetDamage }
    prize
    war
  }
}
// الحصول على الحرب النشطة
export const getActiveWar = (groupId) => {
  for (const [id, war] of activeWars) {
    if (war.challengerId === groupId || war.targetId === groupId) {
      return { id, ...war }
    }
  }
  return null
}
// قائمة الكلانات المتاحة للتحدي
export const getAvailableClans = (excludeId) => {
  const data = getRpgData()
  const clans = []
  for (const [id, clan] of Object.entries(data.clans || {})) {
    if (id !== excludeId) {
      clans.push({
        id,
        name: clan.name,
        level: clan.level
        members: clan.memberCount
        wins: clan.wins
      })
    }
  }
  return clans.sort((a, b) => b.level - a.level)
}
// الحصول على كلانات اللاعب
export const getPlayerClan = (userId) => {
  const data = getRpgData()
  for (const [id, clan] of Object.entries(data.clans || {})) {
    if (clan.members.includes(userId)) {
      return { groupId: id, ...clan }
    }
  }
  return null
}
// ═════════════════════════════════════════════════════════════════════════════════
// 📢 تنسيق الرسائل للقناة والمجموعات
// ═════════════════════════════════════════════════════════════════════════════════

// رسالة للقناة عند إنشاء تحدي
export const formatChallengeForChannel = (c) => `⚔️ تحدي كلان جديد! ⚔️

🏰 ${c.challengerName}
⭐ Lv.${c.challengerLevel} | 👥 ${c.challengerMembers} | 🏆 ${c.challengerWins}

        ⚔️ يتحدى ⚔️

🏰 ${c.targetName}
⭐ Lv.${c.targetLevel}

💰 جائزة: ${c.prizePool.toLocaleString()} ذهب
⏳ بانتظار موافقة ${c.targetName}...

#حروب_الكلانات`

// رسالة للمجموعة المنافسة
export const formatChallengeForGroup = (c, clan) => {
  const data = getRpgData();
  const leaderName = data.players?.[c.challengerLeader]?.name || c.challengerLeaderName || 'القائد';

  return `⚔️⚔️⚔️ تحدي جديد! ⚔️⚔️⚔️

🏰 كلان "${c.challengerName}" يتحدونكم!

━━━━━━━━━━━━━━━━━━━━
📊 معلومات المتحدي:
🛡️ الاسم: ${c.challengerName}
⭐ المستوى: ${c.challengerLevel}
👥 الأعضاء: ${c.challengerMembers} محارب
🏆 الانتصارات: ${c.challengerWins}
💰 الخزنة: ${clan?.gold?.toLocaleString() || 'غير معروفة'} ذهب

━━━━━━━━━━━━━━━━━━━━
💰 جائزة الفوز: ${c.prizePool.toLocaleString()} ذهب
👤 المتحدي: ${c.challengerLeaderName || leaderName}
━━━━━━━━━━━━━━━━━━━━
⏰ لديكم 10 دقائق للرد!
✅ للقبول: .قبول_التحدي ${c.challengeId}
❌ للرفض: .رفض_التحدي ${c.challengeId}
👑 فقط قائد الكلان يستطيع الرد!`;
}
// رسالة للقائد على الخاص
export const formatChallengeForLeader = (c) => `⚔️ تحدي جديد!

🏰 كلان "${c.challengerName}" يتحدى كلانك "${c.targetName}"!

━━━━━━━━━━━━━━━━━━━━
📊 معلومات المتحدي:
⭐ المستوى: ${c.challengerLevel}
👥 الأعضاء: ${c.challengerMembers}
🏆 الانتصارات: ${c.challengerWins}
💰 جائزة الفوز: ${c.prizePool.toLocaleString()} ذهب
━━━━━━━━━━━━━━━━━━━━
✅ للقبول: .قبول_التحدي ${c.challengeId}
❌ للرفض: .رفض_التحدي ${c.challengeId}
⏰ لديك 10 دقائق للرد!
💡 يجب الرد من داخل مجموعة الكلان!`;
}
// رسالة القبول للقناة
export const formatAcceptForChannel = (c, w) => `✅ تم قبول التحدي!

⚔️ ${w.challengerName} VS ${w.targetName} ⚔️
⏱️ 30 دقيقة | 💰 ${w.prizePool.toLocaleString()} ذهب
🎯 بدأت الحرب!
#حروب_الكلانات`
// رسالة الرفض للقناة
export const formatRejectForChannel = (c) => `❌ تم رفض التحدي!

🏰 ${c.challengerName} → ${c.targetName}
👤 رفض بواسطة: ${c.rejectedBy}
#حروب_الكلانات`
// رسالة نتيجة الحرب للقناة
export const formatWarResultForChannel = (r) => {
  if (r.tie) return `🤝 تعادل!
⚔️ ${r.war.challengerName} VS ${r.war.targetName}
💥 ضرر متساوي!
#حروب_الكلانات`
  return `🏆 انتهت الحرب! 🏆
🥇 الفائز: ${r.winner.name}
💥 الضرر: ${r.winner.damage.toLocaleString()}
VS
🥈 الخاسر: ${r.loser.name}
💥 الضرر: ${r.loser.damage.toLocaleString()}
💰 الجائزة: ${r.prize.toLocaleString()} ذهب
#حروب_الكلانات`;
