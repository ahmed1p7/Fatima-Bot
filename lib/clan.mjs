// ═══════════════════════════════════════════════════════════════════════════════
// 🏰 نظام الكلانات
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';

// قناة الحروب للإعلانات
export const WAR_CHANNEL = '0029VbCbgwIKgsNxh9vKb01n';

// إنشاء كلان جديد
export const createClan = (groupId, name, creatorId, creatorName) => {
  const data = getRpgData();
  if (!data.clans) data.clans = {};
  
  if (data.clans[groupId]) {
    return { success: false, message: '❌ الجروب لديه كلان بالفعل!' };
  }
  
  // التحقق من عدم وجود كلان بنفس الاسم
  const existingClan = Object.values(data.clans).find(c => c.name.toLowerCase() === name.toLowerCase());
  if (existingClan) {
    return { success: false, message: '❌ اسم الكلان مستخدم!' };
  }
  
  // توليد clanTag فريد من 4 أرقام
  let clanTag;
  do {
    clanTag = String(Math.floor(1000 + Math.random() * 9000));
  } while (Object.values(data.clans).some(c => c.clanTag === clanTag));
  
  data.clans[groupId] = {
    id: groupId,
    name: name,
    clanTag: clanTag,
    level: 1,
    xp: 0,
    gold: 0,
    leader: creatorId,
    deputies: [],
    members: [creatorId],
    memberCount: 1,
    wins: 0,
    losses: 0,
    announcement: '',
    created: Date.now(),
    lastWar: 0,
    totalDonations: 0,
    events: []
  };
  
  saveDatabase();
  return { success: true, clan: data.clans[groupId] };
};

// الحصول على كلان
export const getClan = (groupId) => {
  const data = getRpgData();
  return data.clans?.[groupId] || null;
};

// الانضمام لكلان
export const joinClan = (groupId, userId) => {
  const data = getRpgData();
  const clan = data.clans?.[groupId];
  
  if (!clan) return { success: false, message: '❌ لا يوجد كلان!' };
  if (clan.members.includes(userId)) return { success: false, message: '❌ أنت عضو بالفعل!' };
  
  clan.members.push(userId);
  clan.memberCount = clan.members.length;
  saveDatabase();
  
  return { success: true, message: `✅ انضممت لكلان ${clan.name}!` };
};

// التبرع للكلان
export const donateToClan = (groupId, userId, amount, playerGold) => {
  const data = getRpgData();
  const clan = data.clans?.[groupId];
  
  if (!clan) return { success: false, message: '❌ لا يوجد كلان!' };
  if (!clan.members.includes(userId)) return { success: false, message: '❌ لست عضواً!' };
  if (playerGold < amount) return { success: false, message: '❌ ذهبك لا يكفي!' };
  if (amount < 100) return { success: false, message: '❌ الحد الأدنى 100 ذهب!' };
  
  clan.gold += amount;
  clan.totalDonations += amount;
  clan.xp += Math.floor(amount / 100);
  
  // تسجيل الحدث
  if (!clan.events) clan.events = [];
  clan.events.push({ type: 'donation', userId, amount, time: Date.now() });
  
  // التحقق من رفع المستوى
  const xpNeeded = clanXpForLevel(clan.level);
  let leveledUp = false;
  while (clan.xp >= xpNeeded && clan.level < 50) {
    clan.xp -= xpNeeded;
    clan.level++;
    leveledUp = true;
  }
  
  saveDatabase();
  return { 
    success: true, 
    message: `✅ تبرعت بـ ${amount} ذهب!`,
    leveledUp,
    newLevel: clan.level
  };
};

// XP المطلوب لليفل
export const clanXpForLevel = (level) => Math.floor(500 * Math.pow(1.3, level - 1));

// شريط التقدم
export const progressClanBar = (xp, level) => {
  const need = clanXpForLevel(level);
  const pct = xp / need;
  return '▰'.repeat(Math.floor(pct * 8)) + '▱'.repeat(8 - Math.floor(pct * 8));
};

// باف الكلان
export const getClanBuff = (level) => {
  return {
    atk: level * 0.5,  // زيادة 0.5% لكل ليفل
    discount: Math.min(level * 0.5, 20), // خصم حتى 20%
    defense: level * 0.3
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ نظام الحروب
// ═══════════════════════════════════════════════════════════════════════════════

const activeWars = new Map();
const pendingChallenges = new Map();

// بدء تحدي
export const challengeClan = async (challengerId, targetId, challengerLeader, sock) => {
  const data = getRpgData();
  
  if (!data.clans[challengerId] || !data.clans[targetId]) {
    return { success: false, message: '❌ أحد الكلانات غير موجود!' };
  }
  
  if (challengerId === targetId) {
    return { success: false, message: '❌ لا يمكنك تحدي نفسك!' };
  }
  
  const challenger = data.clans[challengerId];
  const target = data.clans[targetId];
  
  // التحقق من cooldown
  const now = Date.now();
  if (now - challenger.lastWar < 3 * 60 * 60 * 1000) {
    const remaining = Math.ceil((3 * 60 * 60 * 1000 - (now - challenger.lastWar)) / 60000);
    return { success: false, message: `⏰ انتظر ${remaining} دقيقة!` };
  }
  
  // إنشاء تحدي معلق
  const challengeId = `war_${Date.now()}`;
  const prizePool = Math.floor((challenger.gold + target.gold) * 0.1) + 1000;
  
  pendingChallenges.set(challengeId, {
    challengerId,
    targetId,
    challengerName: challenger.name,
    targetName: target.name,
    challengerLeader,
    createdAt: now,
    prizePool
  });
  
  // إلغاء التحدي بعد 5 دقائق
  setTimeout(() => {
    if (pendingChallenges.has(challengeId)) {
      pendingChallenges.delete(challengeId);
    }
  }, 5 * 60 * 1000);
  
  // 1. إرسال رسالة لمجموعة الكلان المنافس
  if (sock) {
    try {
      await sock.sendMessage(targetId, {
        text: `⚔️ تحدي كلان جديد! ⚔️

🏰 الكلان المتحدي: ${challenger.name} [${challenger.clanTag || '####'}]
⭐ المستوى: ${challenger.level}
👥 الأعضاء: ${challenger.memberCount}
⚔️ الانتصارات: ${challenger.wins}

💰 جائزة الفوز: ${prizePool.toLocaleString()} ذهب

⏳ ينتظر موافقة القائد (5 دقائق)

✅ للقبول: .قبول_التحدي ${challengeId}
❌ للرفض: .رفض_التحدي ${challengeId}`
      });
    } catch (e) {
      console.error('❌ خطأ في إرسال رسالة للمجموعة:', e.message);
    }
    
  // 2. إرسال رسالة خاصة لقائد الكلان المنافس
    try {
      const targetLeaderName = data.players?.[target.leader]?.name || 'القائد';
      await sock.sendMessage(target.leader, {
        text: `👑 أيها القائد ${targetLeaderName}!

🏰 كلانك "${target.name}" تلقى تحدياً!

⚔️ الكلان المتحدي: ${challenger.name} [${challenger.clanTag || '####'}]
⭐ المستوى: ${challenger.level}
👥 الأعضاء: ${challenger.memberCount}
⚔️ الانتصارات: ${challenger.wins}

💰 جائزة الفوز: ${prizePool.toLocaleString()} ذهب

⏳ لديك 5 دقائق للرد!
اذهب إلى مجموعة الكلان واكتب:
✅ للقبول: .قبول_التحدي ${challengeId}`
      });
    } catch (e) {
      console.error('❌ خطأ في إرسال رسالة للقائد:', e.message);
    }
    
    // 3. إرسال إعلان في قناة الواتساب
    try {
      const channelJid = `${WAR_CHANNEL}@newsletter`;
      await sock.sendMessage(channelJid, {
        text: `⚔️ تحدي كلان جديد! ⚔️

🏰 ${challenger.name} [${challenger.clanTag || '####'}] يتحدى 🏰 ${target.name} [${target.clanTag || '####'}]

⭐ مستويات: ${challenger.level} VS ${target.level}
💰 الجائزة: ${prizePool.toLocaleString()} ذهب

⏳ بانتظار الموافقة...`
      });
    } catch (e) {
      console.error('❌ خطأ في إرسال إعلان للقناة:', e.message);
    }
  }
  
  return {
    success: true,
    challengeId,
    challengerName: challenger.name,
    targetName: target.name,
    prizePool,
    targetLeader: target.leader
  };
};

// قبول التحدي
export const acceptChallenge = async (challengeId, targetLeader, sock) => {
  const challenge = pendingChallenges.get(challengeId);
  
  if (!challenge) {
    return { success: false, message: '❌ التحدي غير موجود أو منتهي!' };
  }
  
  // التحقق من أن المستخدم هو قائد الكلان المستهدف
  const data = getRpgData();
  const targetClan = data.clans?.[challenge.targetId];
  
  // التحقق من أن المستخدم هو قائد الكلان المستهدف (يمكنه القبول في مجموعة الكلان أو خاص)
  if (!targetClan || targetClan.leader !== targetLeader) {
    // التحقق مما إذا كان المستخدم عضواً في الكلان المستهدف وقائده هو من قبل التحدي
    const playerClan = getPlayerClan(targetLeader);
    if (!playerClan || playerClan.id !== challenge.targetId || playerClan.leader !== targetLeader) {
      return { success: false, message: '❌ فقط قائد الكلان يمكنه قبول التحدي!' };
    }
  }
  
  pendingChallenges.delete(challengeId);
  
  // بدء الحرب
  const war = {
    id: challengeId,
    challengerId: challenge.challengerId,
    targetId: challenge.targetId,
    challengerName: challenge.challengerName,
    targetName: challenge.targetName,
    challengerDamage: 0,
    targetDamage: 0,
    attackerContributions: {},  // { userId: damage }
    defenderContributions: {},
    prizePool: challenge.prizePool,
    startedAt: Date.now(),
    endsAt: Date.now() + 30 * 60 * 1000, // 30 دقيقة
    status: 'active'
  };
  
  activeWars.set(challengeId, war);
  
  // إنهاء الحرب بعد 30 دقيقة
  setTimeout(() => endWar(challengeId, sock), 30 * 60 * 1000);
  

  // إرسال إعلان في قناة الواتساب عند بدء الحرب
  if (sock) {
    try {
      const channelJid = `${WAR_CHANNEL}@newsletter`;
      await sock.sendMessage(channelJid, {
        text: `⚔️ بدأت الحرب! ⚔️

🏰 ${war.challengerName} VS 🏰 ${war.targetName}

⏱️ المدة: 30 دقيقة
💰 جائزة الفوز: ${war.prizePool.toLocaleString()} ذهب

🎯 المعركة الآن!`
      });
    } catch (e) {
      console.error('❌ خطأ في إرسال إعلان الحرب للقناة:', e.message);
    }
  }
  return { success: true, war };
};

// رفض التحدي
export const rejectChallenge = async (challengeId, sock) => {
  const challenge = pendingChallenges.get(challengeId);
  const deleted = pendingChallenges.delete(challengeId);


  // إرسال إعلان في قناة الواتساب عند رفض التحدي
  if (sock && challenge) {
    try {
      const channelJid = `${WAR_CHANNEL}@newsletter`;
      await sock.sendMessage(channelJid, {
        text: `❌ تم رفض التحدي!

🏰 ${challenge.targetName} رفض تحدي 🏰 ${challenge.challengerName}

💰 الجائزة الملغاة: ${challenge.prizePool.toLocaleString()} ذهب`
      });
    } catch (e) {
      console.error('❌ خطأ في إرسال إعلان الرفض للقناة:', e.message);
    }
  }

  return deleted;
};
// الحصول على التحديات المعلقة
export const getPendingChallenges = (groupId) => {
  const challenges = [];
  for (const [id, c] of pendingChallenges) {
    if (c.targetId === groupId) {
      challenges.push({ id, ...c });
    }
  }
  return challenges;
};

// الهجوم في الحرب
export const attackInWar = (warId, groupId, userId, playerAtk) => {
  const war = activeWars.get(warId);
  
  if (!war) {
    return { success: false, message: '❌ لا توجد حرب!' };
  }
  
  if (Date.now() > war.endsAt) {
    return { success: false, message: '❌ الحرب انتهت!' };
  }
  
  const now = Date.now();
  const data = getRpgData();
  const clan = data.clans[groupId];
  
  if (!clan || !clan.members.includes(userId)) {
    return { success: false, message: '❌ لست عضواً في هذا الكلان!' };
  }
  
  // حساب الضرر مع باف الكلان
  const buff = getClanBuff(clan.level);
  const baseDamage = playerAtk + Math.floor(Math.random() * 50);
  const damage = Math.floor(baseDamage * (1 + buff.atk / 100));
  
  // إضافة الضرر
  if (groupId === war.challengerId) {
    war.challengerDamage += damage;
    war.attackerContributions[userId] = (war.attackerContributions[userId] || 0) + damage;
  } else if (groupId === war.targetId) {
    war.targetDamage += damage;
    war.defenderContributions[userId] = (war.defenderContributions[userId] || 0) + damage;
  } else {
    return { success: false, message: '❌ لست في هذه الحرب!' };
  }
  
  // تحديث وقت آخر هجوم للاعب
  const player = data.players?.[userId];
  if (player) {
    player.lastWarAttack = now;
  }
  
  saveDatabase();
  
  return {
    success: true,
    damage,
    totalDamage: groupId === war.challengerId ? war.challengerDamage : war.targetDamage
  };
};

// إنهاء الحرب
export const endWar = async (warId, sock) => {
  const war = activeWars.get(warId);
  if (!war) return null;
  
  const data = getRpgData();
  const challenger = data.clans[war.challengerId];
  const target = data.clans[war.targetId];
  
  if (!challenger || !target) {
    activeWars.delete(warId);
    return null;
  }
  
  // تحديد الفائز
  let winner, loser, winnerId, loserId;
  if (war.challengerDamage > war.targetDamage) {
    winner = challenger;
    loser = target;
    winnerId = war.challengerId;
    loserId = war.targetId;
  } else if (war.targetDamage > war.challengerDamage) {
    winner = target;
    loser = challenger;
    winnerId = war.targetId;
    loserId = war.challengerId;
  } else {
    // تعادل
    activeWars.delete(warId);
    return { tie: true, war };
  }
  
  // نقل الذهب
  const prize = Math.min(war.prizePool, Math.floor(loser.gold * 0.15));
  loser.gold -= prize;
  winner.gold += prize;
  winner.wins++;
  loser.losses++;
  winner.lastWar = Date.now();
  loser.lastWar = Date.now();
  
  // تحديث ليفل الكلان
  winner.xp += 100;
  const need = clanXpForLevel(winner.level);
  if (winner.xp >= need && winner.level < 50) {
    winner.level++;
    winner.xp -= need;
  }
  
  saveDatabase();
  activeWars.delete(warId);
  
  const result = {
    winner: { id: winnerId, name: winner.name, damage: winnerId === war.challengerId ? war.challengerDamage : war.targetDamage },
    loser: { id: loserId, name: loser.name, damage: loserId === war.challengerId ? war.challengerDamage : war.targetDamage },
    prize,
    war
  };
  
  // إرسال إعلان في قناة الواتساب عند انتهاء الحرب
  if (sock) {
    try {
      const channelJid = `${WAR_CHANNEL}@newsletter`;
      await sock.sendMessage(channelJid, {
        text: `🏆 انتهت الحرب! 🏆

🥇 الفائز: ${winner.name}
💥 الضرر: ${result.winner.damage.toLocaleString()}

🥈 الخاسر: ${loser.name}
💥 الضرر: ${result.loser.damage.toLocaleString()}

💰 الجائزة: ${prize.toLocaleString()} ذهب`
      });
    } catch (e) {
      console.error('❌ خطأ في إرسال إعلان نهاية الحرب للقناة:', e.message);
    }
  }
  
  return result;
};

// الحصول على الحرب النشطة
export const getActiveWar = (groupId) => {
  for (const [id, war] of activeWars) {
    if (war.challengerId === groupId || war.targetId === groupId) {
      return { id, ...war };
    }
  }
  return null;
};

// قائمة الكلانات المتاحة للتحدي
export const getAvailableClans = (excludeId) => {
  const data = getRpgData();
  const clans = [];
  
  for (const [id, clan] of Object.entries(data.clans || {})) {
    if (id !== excludeId) {
      clans.push({
        id,
        name: clan.name,
        level: clan.level,
        members: clan.memberCount,
        wins: clan.wins
      });
    }
  }
  
  return clans.sort((a, b) => b.level - a.level);
};

// الحصول على كلانات اللاعب
export const getPlayerClan = (userId) => {
  const data = getRpgData();
  for (const [id, clan] of Object.entries(data.clans || {})) {
    if (clan.members.includes(userId)) {
      return { groupId: id, ...clan };
    }
  }
  return null;
};

// سجل الأحداث المختصر
export const getClanEventSummary = (clan) => {
  if (!clan.events || clan.events.length === 0) return null;
  
  const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
  const recentEvents = clan.events.filter(e => e.time > sixHoursAgo);
  
  if (recentEvents.length === 0) return null;
  
  const donations = recentEvents.filter(e => e.type === 'donation');
  const totalGold = donations.reduce((sum, e) => sum + e.amount, 0);
  const uniqueDonors = new Set(donations.map(e => e.userId)).size;
  
  return { totalGold, donorCount: uniqueDonors, eventCount: recentEvents.length };
};
