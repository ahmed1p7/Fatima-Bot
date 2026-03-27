// ═══════════════════════════════════════════════════════════════════════════════
// 🏰 أوامر الكلانات والحروب المحسنة - فاطمة بوت v14.0
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from '../lib/database.mjs';
import { clanXpForLevel, progressClanBar } from '../lib/rpg.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 ثوابت النظام
// ═══════════════════════════════════════════════════════════════════════════════

const WAR_PREP_TIME = 15 * 60 * 1000; // 15 دقيقة تجهيز
const WAR_DURATION = 30 * 60 * 1000;   // 30 دقيقة حرب
const CHANNEL_URL = "https://whatsapp.com/channel/0029VbCbgwIKgsNxh9vKb01n";
let CHANNEL_JID = "120363408713799197@newsletter"; // جيد القناة الثابت - قنا الحروب

// مصفوفة لتخزين المشاركين في الحرب
const warParticipants = new Map();

// مؤقتات التقارير اللحظية للحروب
const warReportTimers = new Map();

// قائمة مرتبة للكلانات المتاحة للتحدي - تعرض الاسم، ID، المستوى
function getRankedClansList(excludeId) {
  const data = getRpgData();
  return Object.entries(data.clans || {})
    .filter(([id]) => id !== excludeId)
    .sort((a, b) => {
      // الترتيب حسب المستوى (تنازلي)
      if (b[1].level !== a[1].level) return b[1].level - a[1].level;
      // ثم حسب عدد الانتصارات
      return (b[1].wins || 0) - (a[1].wins || 0);
    })
    .map(([id, clan]) => ({
      id,
      name: clan.name,
      level: clan.level || 1,
      members: clan.members?.length || 0,
      wins: clan.wins || 0,
      losses: clan.losses || 0,
      clanTag: clan.clanTag
    }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ دوال بدء الحرب والتقارير اللحظية
// ═══════════════════════════════════════════════════════════════════════════════

// دالة بدء الحرب - تُستدعى عند انتهاء فترة التجهيز
async function startWar(war, sock) {
  const data = getRpgData();
  
  // تحديث حالة الحرب إلى نشطة
  war.status = 'active';
  
  // جمع المشاركين من الفريقين - استخدام قائمة المشاركين المسجلة
  const challengerParticipants = war.participants?.challenger || [];
  const targetParticipants = war.participants?.target || [];
  
  // بناء قائمة المشاركين
  let participantsList = '';
  
  if (challengerParticipants.length > 0) {
    participantsList += `\n🏰 *${war.challengerName}:*\n`;
    for (const p of challengerParticipants) {
      const playerName = data.players?.[p.playerId]?.name || 'مجهول';
      participantsList += `   • ${playerName} (${p.soldiers || 0} جندي)\n`;
    }
  }
  
  if (targetParticipants.length > 0) {
    participantsList += `\n🏰 *${war.targetName}:*\n`;
    for (const p of targetParticipants) {
      const playerName = data.players?.[p.playerId]?.name || 'مجهول';
      participantsList += `   • ${playerName} (${p.soldiers || 0} جندي)\n`;
    }
  }
  
  if (participantsList === '') {
    participantsList = '\n⚠️ لم يسجل أي مشارك حتى الآن!';
  }
  
  // رسالة بدء الحرب
  const warStartMsg = `⚔️ *بدأت الحرب!*\n\n🏰 *${war.challengerName}* (Lv.${war.challengerLevel})\n⚔️ ضد\n🏰 *${war.targetName}* (Lv.${war.targetLevel})\n\n📋 *المشاركون:*${participantsList}\n\n⏰ مدة الحرب: 30 دقيقة\n💰 جائزة الفوز: ${war.prizePool.toLocaleString()} ذهب\n\n🎯 المعركة جارية الآن!`;

  // إرسال الرسالة للقناة
  if (CHANNEL_JID && sock) {
    try {
      await sock.sendMessage(CHANNEL_JID, { text: warStartMsg });
    } catch (err) {
      console.error('❌ خطأ في إرسال رسالة بدء الحرب:', err.message);
    }
  }
  
  // بدء التقارير اللحظية كل 5 دقائق
  startWarReports(war, sock);
}

// دالة التقارير اللحظية للحرب
function startWarReports(war, sock) {
  // إلغاء أي مؤقت سابق لهذه الحرب
  if (warReportTimers.has(war.id)) {
    clearInterval(warReportTimers.get(war.id));
  }

  // إرسال تقرير فوري عند بدء الحرب
  sendWarReport(war, sock);

  // ثم إرسال تقارير كل 5 دقائق
  const reportInterval = setInterval(async () => {
    sendWarReport(war, sock);

    const now = Date.now();

    // التحقق من انتهاء الحرب وإنهائها تلقائياً
    if (now >= war.endsAt || war.status === 'ended') {
      clearInterval(reportInterval);
      warReportTimers.delete(war.id);
      
      // إنهاء الحرب إذا انتهت المدة
      if (war.status !== 'ended' && sock) {
        await endWar(war, sock);
      }
      return;
    }
  }, 5 * 60 * 1000); // كل 5 دقائق

  warReportTimers.set(war.id, reportInterval);
}


// دالة مساعدة لإرسال تقرير الحرب
async function sendWarReport(war, sock) {
  const now = Date.now();

  // حساب نسبة التدمير الحالية
  const totalDamage = (war.challengerDamage || 0) + (war.targetDamage || 0);
  let challengerPercent = 0;
  let targetPercent = 0;

  if (totalDamage > 0) {
    challengerPercent = Math.floor((war.challengerDamage / totalDamage) * 100);
    targetPercent = Math.floor((war.targetDamage / totalDamage) * 100);
  }

  // تحديد المتصدر
  const leadingClan = war.challengerDamage > war.targetDamage ? war.challengerName : war.targetName;
  const leadingPercent = war.challengerDamage > war.targetDamage ? challengerPercent : targetPercent;

  // الوقت المتبقي
  const remaining = Math.max(0, war.endsAt - now);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  // رسالة التقرير
  const reportMsg = `⚔️ *تقرير معركة لحظي*

🏰 ${war.challengerName}: ${war.challengerDamage?.toLocaleString() || 0} ضرر (${challengerPercent}%)
🏰 ${war.targetName}: ${war.targetDamage?.toLocaleString() || 0} ضرر (${targetPercent}%)

📊 المتصدر: ${leadingClan} يدمر ${leadingPercent}% من العدو!

⏳ الوقت المتبقي: ${mins}:${secs.toString().padStart(2, '0')}

🎯 المعركة مستمرة...`;

  if (CHANNEL_JID && sock) {
    try {
      await sock.sendMessage(CHANNEL_JID, { text: reportMsg });
    } catch (err) {
      console.error('❌ خطأ في إرسال التقرير اللحظي:', err.message);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏗️ تعريفات المباني - نظام المستوطنة
// ═══════════════════════════════════════════════════════════════════════════════

const BUILDINGS = {
  // القلعة المركزية
  castle: {
    id: 'castle',
    name: 'القلعة المركزية',
    emoji: '🏰',
    description: 'مركز المستوطنة - ترقيتها تزيد سعة الأعضاء والتخزين والدم',
    category: 'main',
    maxLevel: 10,
    baseCost: { gold: 1000, elixir: 500 },
    costMultiplier: 2,
    effects: {
      memberCapacity: [20, 25, 30, 35, 40, 45, 50, 55, 60, 70],
      storageBonus: [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000],
      hpBonus: [0, 50, 100, 150, 200, 250, 300, 400, 500, 600]
    },
    requirements: {}
  },
  
  // مباني الأصناف
  barracks: {
    id: 'barracks',
    name: 'الثكنات',
    emoji: '⚔️',
    description: 'مبنى المحاربين والفرسان - يزيد سعة الجيش وقوته',
    category: 'class',
    classType: ['محارب', 'فارس'],
    maxLevel: 10,
    baseCost: { gold: 500, elixir: 300 },
    costMultiplier: 1.8,
    effects: {
      armyCapacity: [20, 40, 60, 80, 100, 120, 140, 160, 180, 200],
      atkBonus: [0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.2],
      clanAtkBonus: [0, 0.005, 0.01, 0.015, 0.02, 0.025, 0.03, 0.035, 0.04, 0.05]
    },
    requirements: { castle: 1 }
  },
  
  mageTower: {
    id: 'mageTower',
    name: 'برج السحر',
    emoji: '🔮',
    description: 'مبنى السحرة - يزيد الدفاع السحري للمستوطنة',
    category: 'class',
    classType: ['ساحر'],
    maxLevel: 10,
    baseCost: { gold: 500, elixir: 400 },
    costMultiplier: 1.8,
    effects: {
      magBonus: [0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.3],
      magicalDefense: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5],
      clanMagDef: [0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.2]
    },
    requirements: { castle: 1 }
  },
  
  hospital: {
    id: 'hospital',
    name: 'المشفى',
    emoji: '🏥',
    description: 'مبنى الشافين - يسرع استعادة الطاقة ويقلل الخسائر',
    category: 'class',
    classType: ['شافي'],
    maxLevel: 10,
    baseCost: { gold: 600, elixir: 350 },
    costMultiplier: 1.8,
    effects: {
      staminaRegenBonus: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5],
      healBonus: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5],
      warLossReduction: [0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.3]
    },
    requirements: { castle: 1 }
  },
  
  watchtower: {
    id: 'watchtower',
    name: 'برج المراقبة',
    emoji: '🗼',
    description: 'مبنى الرماة والقتلة - يكشف دفاعات العدو ويزيد الدقة',
    category: 'class',
    classType: ['رامي', 'قاتل'],
    maxLevel: 10,
    baseCost: { gold: 450, elixir: 300 },
    costMultiplier: 1.8,
    effects: {
      critBonus: [0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.2],
      enemyDefReveal: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1],
      clanScoutBonus: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5]
    },
    requirements: { castle: 1 }
  },
  
  // مباني الموارد
  goldMine: {
    id: 'goldMine',
    name: 'منجم الذهب',
    emoji: '⛏️',
    description: 'ينتج ذهباً يومياً للمستوطنة',
    category: 'resource',
    maxLevel: 10,
    maxCount: 3,
    baseCost: { gold: 200, elixir: 100 },
    costMultiplier: 1.5,
    effects: {
      production: [50, 100, 150, 200, 300, 400, 500, 700, 900, 1200]
    },
    requirements: {}
  },
  
  elixirCollector: {
    id: 'elixirCollector',
    name: 'جامع الإكسير',
    emoji: '⚗️',
    description: 'ينتج إكسيراً يومياً للمستوطنة',
    category: 'resource',
    maxLevel: 10,
    maxCount: 3,
    baseCost: { gold: 150, elixir: 50 },
    costMultiplier: 1.5,
    effects: {
      production: [30, 60, 90, 120, 180, 240, 300, 420, 540, 720]
    },
    requirements: {}
  },
  
  // مباني الدفاع
  wall: {
    id: 'wall',
    name: 'الأسوار',
    emoji: '🧱',
    description: 'يزيد دفاع المستوطنة في الحروب',
    category: 'defense',
    maxLevel: 10,
    maxCount: 5,
    baseCost: { gold: 300, elixir: 100 },
    costMultiplier: 1.4,
    effects: {
      defenseBonus: [20, 40, 60, 80, 100, 130, 160, 200, 250, 300]
    },
    requirements: { castle: 1 }
  }
}

// أنواع الجنود حسب الأصناف
const SOLDIER_TYPES = {
  "محارب": "infantry",
  "رامي": "archer",
  "فارس": "cavalry",
  "ساحر": "mage",
  "شافي": "healer"
}

// أسماء الجنود
const SOLDIER_NAMES = {
  infantry: "مشاة ثقيل",
  archer: "رماة سهام",
  cavalry: "فرسان مدرعون",
  mage: "دعم سحري",
  healer: "كاهن شفاء"
}

// تأثيرات الأصناف في الحرب
const CLASS_EFFECTS = {
  "محارب": { type: "attack", bonus: 1.2 },
  "رامي": { type: "range", bonus: 1.3 },
  "فارس": { type: "tank", bonus: 0.8 },
  "ساحر": { type: "magic", bonus: 1.5 },
  "شافي": { type: "support", bonus: 0.7 }
}

// عناصر المتجر الحربي
const WAR_ITEMS = {
  "تعويذة حماية": { type: "defense_buff", value: 1.5, cost: 1000 },
  "جرعة هجومية": { type: "attack_buff", value: 1.5, cost: 1000 },
  "تعويذة تجميد": { type: "freeze", duration: 300000, cost: 2000 }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════════════

function getClan(groupId) {
  if (!groupId) return null;
  const data = getRpgData();
  return data.clans?.[groupId] || null;
}

function getClanBuff(level) {
  return {
    atk: level * 0.5,
    defense: level * 0.3,
    discount: level * 0.2
  };
}

function isClanLeader(clan, senderId) {
  if (!clan || !senderId) return false;
  const senderNum = String(senderId).split('@')[0];
  const leaderNum = String(clan.leader || '').split('@')[0];
  return senderNum === leaderNum;
}

function createClan(groupId, name, leaderId, leaderName) {
  const data = getRpgData();
  
  // التحقق من وجود كلان في المجموعة
  if (data.clans?.[groupId]) {
    return { success: false, message: '❌ يوجد كلان بالفعل في هذه المجموعة!' };
  }
  
  const clanTag = String(Math.floor(1000 + Math.random() * 9000));
  
  const newClan = {
    id: groupId,
    name: name,
    clanTag: clanTag,
    level: 1,
    xp: 0,
    gold: 0,
    elixir: 0,
    
    leader: leaderId,
    leaderName: leaderName,
    deputies: [],
    members: [leaderId],
    memberCount: 1,
    
    settlement: {
      buildings: {
        castle: { level: 1 },
        barracks: { level: 1 }, // ثكنات المحارب/فارس
        mageTower: { level: 1 }, // برج السحر
        hospital: { level: 1 }, // المشفى
        watchtower: { level: 1 }, // برج المراقبة للرامي/قاتل
        goldMine: [{ level: 1 }],
        elixirCollector: [{ level: 1 }]
      },
      resources: { gold: 500, elixir: 250 }
    },
    
    wars: { wins: 0, losses: 0, currentWar: null, pendingChallenges: [] },
    
    wins: 0,
    losses: 0,
    totalDonations: 0,
    created: Date.now()
  };
  
  data.clans = data.clans || {};
  data.clans[groupId] = newClan;
  saveDatabase();
  
  return {
    success: true,
    clan: newClan,
    message: `✅ تم إنشاء كلان "${name}"!\n🏷️ Tag: #${clanTag}`
  };
}

function donateToClan(clan, player, amount) {
  if (!clan) return { success: false, message: '❌ لا يوجد كلان!' };
  if (amount <= 0) return { success: false, message: '❌ أدخل مبلغاً صحيحاً!' };
  if ((player.gold || 0) < amount) return { success: false, message: '❌ لا تملك ذهب كافٍ!' };
  
  player.gold -= amount;
  clan.gold = (clan.gold || 0) + amount;
  clan.totalDonations = (clan.totalDonations || 0) + amount;
  player.totalDonated = (player.totalDonated || 0) + amount;
  
  // XP للكلان
  const clanXp = Math.floor(amount / 10);
  clan.xp = (clan.xp || 0) + clanXp;
  
  // التحقق من رفع المستوى
  let leveledUp = false;
  let newLevel = clan.level;
  const needed = clanXpForLevel(clan.level);
  if (clan.xp >= needed) {
    clan.level++;
    clan.xp -= needed;
    leveledUp = true;
    newLevel = clan.level;
  }
  
  saveDatabase();
  
  return {
    success: true,
    leveledUp,
    newLevel,
    message: `💰 تبرعت بـ ${amount.toLocaleString()} ذهب!\n🏆 الكلان حصل على ${clanXp} XP`
  };
}

function joinClan(clan, playerId) {
  if (!clan) return { success: false, message: '❌ الكلان غير موجود!' };
  if (clan.members.includes(playerId)) return { success: false, message: '❅ أنت عضو بالفعل!' };
  if (clan.members.length >= 30) return { success: false, message: '❅ الكلان ممتلئ!' };
  
  clan.members.push(playerId);
  clan.memberCount = clan.members.length;
  saveDatabase();
  
  return { success: true, message: `✅ انضممت لكلان ${clan.name}!` };
}

function transferClanLeadership(clan, newLeaderId, currentLeaderId) {
  if (!isClanLeader(clan, currentLeaderId)) {
    return { success: false, message: '❌ فقط قائد الكلان يستطيع نقل القيادة!' };
  }
  
  if (!clan.members.includes(newLeaderId)) {
    return { success: false, message: '❌ العضو الجديد ليس في الكلان!' };
  }
  
  const oldLeaderId = clan.leader;
  const oldLeaderName = clan.leaderName;
  
  // جلب اسم القائد الجديد
  const data = getRpgData();
  const newLeaderName = data.players?.[newLeaderId]?.name || 'غير معروف';
  
  // نقل القيادة
  clan.leader = newLeaderId;
  clan.leaderName = newLeaderName;
  
  saveDatabase();
  
  return {
    success: true,
    message: `✅ تم نقل قيادة الكلان!\n👑 من: ${oldLeaderName}\n👑 إلى: ${newLeaderName}`
  };
}

function deleteClan(clan, leaderId) {
  if (!isClanLeader(clan, leaderId)) {
    return { success: false, message: '❌ فقط قائد الكلان يستطيع حذف الكلان!' };
  }
  
  const data = getRpgData();
  const clanName = clan.name;
  const leaderName = clan.leaderName;
  
  // حذف الكلان من قاعدة البيانات
  if (data.clans && data.clans[clan.id]) {
    delete data.clans[clan.id];
  }
  
  // إزالة مرجع الكلان من جميع الأعضاء
  if (clan.members) {
    clan.members.forEach(memberId => {
      if (data.players && data.players[memberId]) {
        data.players[memberId].clanId = null;
      }
    });
  }
  
  saveDatabase();
  
  return {
    success: true,
    message: `${leaderName}`
  };
}

function getAvailableClans(excludeId) {
  const data = getRpgData();
  return Object.entries(data.clans || {})
    .filter(([id]) => id !== excludeId)
    .map(([id, clan]) => ({
      id,
      name: clan.name,
      level: clan.level || 1,
      members: clan.members?.length || 0,
      wins: clan.wins || 0,
      clanTag: clan.clanTag
    }));
}


// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ نظام الحروب
// ═══════════════════════════════════════════════════════════════════════════════

async function challengeClan(challengerClan, targetClanId, challengerId, sock) {
  const data = getRpgData();
  const targetClan = data.clans?.[targetClanId];
  
  if (!targetClan) return { success: false, message: '❌ الكلان غير موجود!' };
  if (challengerClan.id === targetClanId) return { success: false, message: '❌ لا يمكنك تحدي كلانك!' };
  if (challengerClan.wars?.currentWar) return { success: false, message: '❅ كلانك في حرب بالفعل!' };
  if (targetClan.wars?.currentWar) return { success: false, message: '❅ الكلان المستهدف في حرب!' };
  
  // التحقق من كون المستخدم قائد
  if (!isClanLeader(challengerClan, challengerId)) {
    return { success: false, message: '❌ للقائد فقط!' };
  }
  
  const warId = `war_${Date.now()}`;
  const prepEndTime = Date.now() + WAR_PREP_TIME;
  const warEndTime = prepEndTime + WAR_DURATION;
  
  // إنشاء التحدي
  const challenge = {
    id: warId,
    challengerId: challengerClan.id,
    challengerName: challengerClan.name,
    challengerTag: challengerClan.clanTag,
    challengerLevel: challengerClan.level || 1,
    targetId: targetClanId,
    targetName: targetClan.name,
    targetTag: targetClan.clanTag,
    targetLevel: targetClan.level || 1,
    prizePool: Math.floor((challengerClan.gold || 0) * 0.1) + 500,
    createdAt: Date.now(),
    prepEndTime: prepEndTime,
    warEndTime: warEndTime,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 دقائق للقبول
    status: 'pending'
  };
  
  // إضافة التحدي للكلان المستهدف
  targetClan.wars = targetClan.wars || {};
  targetClan.wars.pendingChallenges = targetClan.wars.pendingChallenges || [];
  targetClan.wars.pendingChallenges.push(challenge);
  
  saveDatabase();
  
  // إرسال رسالة للقناة عند بداية التحدي - عرض مفصل مع ID والمستوى
  if (CHANNEL_JID && sock) {
    try {
      const challengeMsg = `⚔️ *تحدي جديد!*

🏰 *الكلان المتحدي:*
   • الاسم: ${challengerClan.name}
   • ID: \`${challengerClan.id}\`
   • المستوى: ${challengerClan.level || 1}

⚔️ *يتحدى:*
   • الاسم: ${targetClan.name}
   • ID: \`${targetClanId}\`
   • المستوى: ${targetClan.level || 1}

💰 جائزة الفوز: ${challenge.prizePool.toLocaleString()} ذهب
⏳ ينتظر الموافقة...`;
      
      await sock.sendMessage(CHANNEL_JID, { text: challengeMsg });
    } catch (err) {
      console.error('❌ خطأ في إرسال رسالة التحدي للقناة:', err.message);
    }
  }

  return {
    success: true,
    challenge,
    challengerName: challengerClan.name,
    targetName: targetClan.name,
    prizePool: challenge.prizePool,
    prepTime: WAR_PREP_TIME / 60000 // بالدقائق
  };
}

async function acceptChallenge(clan, challengeId, senderId, sock) {
  if (!isClanLeader(clan, senderId)) {
    return { success: false, message: '❌ للقائد فقط!' };
  }
  
  const challenges = clan.wars?.pendingChallenges || [];
  const challenge = challenges.find(c => c.id === challengeId);
  
  if (!challenge) {
    return { success: false, message: '❌ التحدي غير موجود!' };
  }
  
  if (Date.now() > challenge.expiresAt) {
    return { success: false, message: '❅ انتهت صلاحية التحدي!' };
  }
  
  const data = getRpgData();
  const challengerClan = data.clans?.[challenge.challengerId];
  
  if (!challengerClan) {
    return { success: false, message: '❌ الكلان المتحدي غير موجود!' };
  }
  
  // إنشاء الحرب مع فترة التجهيز
  const war = {
    id: challenge.id,
    challengerId: challenge.challengerId,
    challengerName: challenge.challengerName,
    challengerTag: challenge.challengerTag,
    challengerLevel: challenge.challengerLevel || 1,
    targetId: clan.id,
    targetName: clan.name,
    targetTag: clan.clanTag,
    targetLevel: challenge.targetLevel || 1,
    challengerDamage: 0,
    targetDamage: 0,
    prizePool: challenge.prizePool,
    createdAt: Date.now(),
    prepEndTime: challenge.prepEndTime,
    startedAt: challenge.prepEndTime, // تبدأ بعد التجهيز
    endsAt: challenge.warEndTime,
    status: 'preparing', // حالة التجهيز
    challengerAttacks: [],
    targetAttacks: [],
    participants: {
      challenger: [],
      target: []
    },
    events: [],
    buffs: {
      challenger: [],
      target: []
    }
  };
  
  // تحديث الحالة
  challengerClan.wars = challengerClan.wars || {};
  challengerClan.wars.currentWar = war;
  
  clan.wars = clan.wars || {};
  clan.wars.currentWar = war;
  clan.wars.pendingChallenges = challenges.filter(c => c.id !== challengeId);
  
  saveDatabase();
  
  // إرسال إشعار قبول التحدي للقناة
  if (CHANNEL_JID && sock) {
    try {
      const acceptMsg = `✅ *تم قبول التحدي!*

🏰 *${challenge.challengerName}*
   • ID: \`${challenge.challengerId}\`
   • المستوى: ${challenge.challengerLevel || 1}

⚔️ *ضد*

🏰 *${clan.name}*
   • ID: \`${clan.id}\`
   • المستوى: ${clan.level || 1}

⏰ ستبدأ المعركة خلال 15 دقيقة!
💰 جائزة الفوز: ${challenge.prizePool.toLocaleString()} ذهب`;
      
      await sock.sendMessage(CHANNEL_JID, { text: acceptMsg });
    } catch (err) {
      console.error('❌ خطأ في إرسال إشعار القبول للقناة:', err.message);
    }
  }
  
  return { success: true, war, prepTime: WAR_PREP_TIME / 60000 };
}

function attackInWar(clan, playerId, attackPower) {
  if (!clan.wars?.currentWar) {
    return { success: false, message: '❅ لا توجد حرب جارية!' };
  }
  
  const war = clan.wars.currentWar;
  const now = Date.now();
  
  // التحقق من فترة التجهيز
  if (now < war.prepEndTime) {
    const remaining = Math.ceil((war.prepEndTime - now) / 60000);
    return { success: false, message: `⏳ الحرب في مرحلة التجهيز! تبقى ${remaining} دقيقة` };
  }
  
  // تحديث حالة الحرب إلى نشطة إذا لزم الأمر
  if (war.status === 'preparing' && now >= war.startedAt) {
    war.status = 'active';
  }
  
  if (now >= war.endsAt) {
    return { success: false, message: '❅ الحرب انتهت!' };
  }
  
  // تحديد الفريق
  const isChallenger = war.challengerId === clan.id;
  
  // جلب بيانات اللاعب وصنفه
  const data = getRpgData();
  const player = data.players?.[playerId];
  const playerClass = player?.class || "محارب";
  
  // تطبيق تأثير الصنف
  let damageMultiplier = 1.0;
  if (CLASS_EFFECTS[playerClass]) {
    damageMultiplier = CLASS_EFFECTS[playerClass].bonus;
  }
  
  // حساب الضرر مع التعزيزات
  let damage = Math.floor(attackPower * damageMultiplier * (0.8 + Math.random() * 0.4));
  
  // تطبيق buffs المؤقتة
  const teamBuffs = isChallenger ? war.buffs.challenger : war.buffs.target;
  for (const buff of teamBuffs) {
    if (buff.type === 'attack_buff') {
      damage = Math.floor(damage * buff.value);
    }
  }
  
  // تحديث الضرر
  if (isChallenger) {
    war.challengerDamage = (war.challengerDamage || 0) + damage;
    war.challengerAttacks = war.challengerAttacks || [];
    war.challengerAttacks.push({ playerId, damage, time: now, class: playerClass });
  } else {
    war.targetDamage = (war.targetDamage || 0) + damage;
    war.targetAttacks = war.targetAttacks || [];
    war.targetAttacks.push({ playerId, damage, time: now, class: playerClass });
  }
  
  saveDatabase();
  
  return {
    success: true,
    damage,
    totalDamage: isChallenger ? war.challengerDamage : war.targetDamage,
    classEffect: damageMultiplier > 1 ? `🎯 تأثير الصنف: x${damageMultiplier}` : ''
  };
}

function getActiveWar(clanId) {
  const clan = getClan(clanId);
  return clan?.wars?.currentWar || null;
}

async function endWar(war, sock) {
  const data = getRpgData();
  
  const challengerClan = data.clans?.[war.challengerId];
  const targetClan = data.clans?.[war.targetId];
  
  // حساب نسبة التدمير
  const totalDamage = (war.challengerDamage || 0) + (war.targetDamage || 0);
  let challengerDestruction = 0;
  let targetDestruction = 0;
  
  if (totalDamage > 0) {
    challengerDestruction = Math.min(100, Math.floor((war.challengerDamage / totalDamage) * 100));
    targetDestruction = Math.min(100, Math.floor((war.targetDamage / totalDamage) * 100));
  }
  
  // تحديد الفائز
  const challengerWon = war.challengerDamage > war.targetDamage;
  
  // حساب الغنائم (نسبة من ذهب وإكسير الخاسر)
  const lootGold = challengerWon 
    ? Math.floor((targetClan?.gold || 0) * 0.1) 
    : Math.floor((challengerClan?.gold || 0) * 0.1);
  const lootElixir = challengerWon 
    ? Math.floor((targetClan?.elixir || 0) * 0.1) 
    : Math.floor((challengerClan?.elixir || 0) * 0.1);
  
  // تحديد MVP (أعلى ضرر)
  const allAttacks = [...(war.challengerAttacks || []), ...(war.targetAttacks || [])];
  let mvp = null;
  let maxDamage = 0;
  
  for (const attack of allAttacks) {
    if (attack.damage > maxDamage) {
      maxDamage = attack.damage;
      mvp = attack;
    }
  }
  
  if (challengerWon) {
    if (challengerClan) {
      challengerClan.wins = (challengerClan.wins || 0) + 1;
      challengerClan.gold = (challengerClan.gold || 0) + war.prizePool + lootGold;
      // نهب الموارد
      if (targetClan) {
        targetClan.gold = Math.max(0, (targetClan.gold || 0) - lootGold);
        targetClan.elixir = Math.max(0, (targetClan.elixir || 0) - lootElixir);
      }
    }
    if (targetClan) {
      targetClan.losses = (targetClan.losses || 0) + 1;
    }
  } else {
    if (targetClan) {
      targetClan.wins = (targetClan.wins || 0) + 1;
      targetClan.gold = (targetClan.gold || 0) + war.prizePool + lootGold;
      // نهب الموارد
      if (challengerClan) {
        challengerClan.gold = Math.max(0, (challengerClan.gold || 0) - lootGold);
        challengerClan.elixir = Math.max(0, (challengerClan.elixir || 0) - lootElixir);
      }
    }
    if (challengerClan) {
      challengerClan.losses = (challengerClan.losses || 0) + 1;
    }
  }
  
  // إنهاء الحرب
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
  
  // إرسال تقرير الحرب إلى القناة
  if (CHANNEL_JID && sock) {
    const warReport = `🏆 *وثيقة النصر* 🏆\n\n⚔️ الحرب: ${war.challengerName} VS ${war.targetName}\n\n🥇 الفائز: ${challengerWon ? war.challengerName : war.targetName}\n💀 نسبة التدمير:\n   • ${war.challengerName}: ${challengerDestruction}%\n   • ${war.targetName}: ${targetDestruction}%\n\n💰 الغنائم:\n   • ذهب: ${lootGold.toLocaleString()}\n   • إكسير: ${lootElixir.toLocaleString()}\n\n⭐ MVP: ${mvp ? `@${mvp.playerId.split('@')[0]} (${mvp.damage.toLocaleString()} ضرر)` : 'غير محدد'}\n\n${CHANNEL_URL}`;
    
    try {
      await sock.sendMessage(CHANNEL_JID, { 
        text: warReport,
        mentions: mvp ? [mvp.playerId] : []
      });
      console.log(`✅ تم إرسال تقرير الحرب إلى القناة: ${CHANNEL_JID}`);
    } catch (err) {
      console.error('❌ خطأ في إرسال تقرير الحرب للقناة:', err.message);
    }
  }
  
  return {
    winner: challengerWon ? war.challengerName : war.targetName,
    winnerId: challengerWon ? war.challengerId : war.targetId,
    loserId: challengerWon ? war.targetId : war.challengerId,
    prize: war.prizePool + lootGold,
    lootGold,
    lootElixir,
    challengerDestruction,
    targetDestruction,
    mvp: mvp ? { playerId: mvp.playerId, damage: mvp.damage, class: mvp.class } : null
  };
}

function formatWarMessage(war, prefix) {
  const now = Date.now();
  const isPreparing = now < war.prepEndTime;
  
  if (isPreparing) {
    const remaining = Math.ceil((war.prepEndTime - now) / 60000);
    return `⚔️ *مرحلة التجهيز!*\n\n🏰 ${war.challengerName} VS ${war.targetName}\n\n⏳ الوقت المتبقي للتجهيز: ${remaining} دقيقة\n💰 جائزة الفوز: ${war.prizePool.toLocaleString()} ذهب\n⏰ مدة الحرب: 30 دقيقة\n\n📚 استعدوا وادعوا أعضاء الكلان!\n🎯 ستبدأ المعركة تلقائياً بعد انتهاء التجهيز`;
  }
  
  const remaining = Math.max(0, war.endsAt - now);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  
  return `⚔️ *بدأت الحرب!*\n\n🏰 ${war.challengerName} VS ${war.targetName}\n\n💰 جائزة الفوز: ${war.prizePool.toLocaleString()} ذهب\n⏱️ الوقت المتبقي: ${mins}:${secs.toString().padStart(2, '0')}\n\n🎯 استخدموا:\n${prefix}مشاركة_الحرب <عدد الجنود> لتسجيل مشاركتك!`;
}

// دالة لحساب سعة الجيش بناءً على مستوى المبنى
function getArmyCapacity(buildingLevel) {
  return buildingLevel * 20;
}

// دالة لتدريب الجنود
function trainSoldiers(player, clan, amount) {
  const playerClass = player.class || "محارب";
  const soldierType = SOLDIER_TYPES[playerClass] || "infantry";
  const soldierName = SOLDIER_NAMES[soldierType];
  
  let buildingLevel = 1;
  if (soldierType === "infantry") {
    buildingLevel = clan.settlement?.buildings?.barracks?.level || 1;
  } else if (soldierType === "archer") {
    buildingLevel = clan.settlement?.buildings?.archeryRange?.level || 1;
  } else if (soldierType === "cavalry") {
    buildingLevel = clan.settlement?.buildings?.stable?.level || 1;
  }
  
  const maxCapacity = getArmyCapacity(buildingLevel);
  const currentSoldiers = player.soldiers || 0;
  
  if (currentSoldiers + amount > maxCapacity) {
    return {
      success: false,
      message: `❌ سعة الجيش ممتلئة!\n📊 الحالي: ${currentSoldiers}/${maxCapacity}\n💡 قم بترقية المبنى لزيادة السعة`
    };
  }
  
  player.soldiers = (player.soldiers || 0) + amount;
  player.soldierType = soldierType;
  saveDatabase();
  
  return {
    success: true,
    message: `✅ تم تدريب ${amount} من وحدة [${soldierName}]!\n📊 السعة: ${player.soldiers}/${maxCapacity}`
  };
}

// دالة لشراء عناصر المتجر الحربي
function buyWarItem(player, itemName) {
  if (!WAR_ITEMS[itemName]) {
    return { success: false, message: '❌ العنصر غير موجود في المتجر الحربي!' };
  }
  
  const item = WAR_ITEMS[itemName];
  
  if ((player.gold || 0) < item.cost) {
    return { success: false, message: `❌ لا تملك ذهب كافٍ!\n💰 المطلوب: ${item.cost}` };
  }
  
  player.gold -= item.cost;
  player.warBuffs = player.warBuffs || [];
  player.warBuffs.push({
    type: item.type,
    value: item.value,
    duration: item.duration,
    expiresAt: Date.now() + (item.duration || 0),
    purchasedAt: Date.now()
  });
  
  saveDatabase();
  
  return {
    success: true,
    message: `✅ تم شراء [${itemName}] بنجاح!\n🎯 سيُفعّل تلقائياً عند دخول الحرب`
  };
}

// دالة لعرض ترتيب الكلانات
function getClanRankings() {
  const data = getRpgData();
  const clans = Object.values(data.clans || {});
  
  clans.sort((a, b) => (b.wins || 0) - (a.wins || 0));
  
  const topClans = clans.slice(0, 10);
  
  let rankingText = "🏆 **ترتيب الكلانات الأسطوري** 🏆\n\n";
  
  for (let i = 0; i < topClans.length; i++) {
    const clan = topClans[i];
    rankingText += `${i + 1}. 🛡️ **${clan.name}** #${clan.clanTag}\n`;
    rankingText += `   ✅ انتصارات: ${clan.wins || 0} | ❌ هزائم: ${clan.losses || 0}\n`;
    rankingText += `   👥 أعضاء: ${clan.members?.length || 0} | ⭐ مستوى: ${clan.level || 1}\n\n`;
  }
  
  return rankingText;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 تصدير الأوامر
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  name: 'Clan',

  getChannelJid: () => CHANNEL_JID,
  setChannelJid: (jid) => { CHANNEL_JID = jid; },
  main,
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

    // ═════════════════════════════════════════════════════════════════════════
    // تفعيل الكلان
    // ═════════════════════════════════════════════════════════════════════════
    if (['تفعيل_الكلان', 'createclan', 'إنشاء_كلان'].includes(command)) {
      if (!isGroup) return sock.sendMessage(from, { text: '❌ في مجموعة فقط!' });
      if (!isGroupAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين فقط!' });

      const clanName = args.join(' ');
      if (!clanName) {
        return sock.sendMessage(from, { text: `❌ اكتب اسم الكلان!\n💡 ${prefix}تفعيل_الكلان صقور العرب` });
      }

      const result = createClan(from, clanName, sender, pushName);
      if (!result.success) {
        return sock.sendMessage(from, { text: result.message });
      }

      return sock.sendMessage(from, {
        text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

🏰 • • ✤ تم إنشاء الكلان! ✤ • • 🏰

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ 🏷️ الاسم: ${result.clan.name}
│ 🏷️ Tag: #${result.clan.clanTag}
│ 👑 القائد: ${pushName}
│ 👥 الأعضاء: 1
│ ⭐ المستوى: 1
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

💡 ${prefix}انضمام_الكلان - للانضمام
💡 ${prefix}تبرع <مبلغ> - للتبرع

> \`بــوت :\`
> _*『 FATIMA 』*__
━─━••❁⊰｢ ❀｣⊱❁••━─━`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // معلومات الكلان
    // ═════════════════════════════════════════════════════════════════════════
    if (['كلان', 'clan', 'كلانات'].includes(command)) {
      const clan = getClan(from);
      if (!clan) {
        return sock.sendMessage(from, { text: '❌ لا يوجد كلان!\n💡 مشرف المجموعة يستطيع تفعيل الكلان' });
      }

      const buff = getClanBuff(clan.level);
      const progress = progressClanBar(clan.xp, clan.level);
      const xpNeeded = clanXpForLevel(clan.level);
      const leaderName = clan.leaderName || data.players?.[clan.leader]?.name || 'غير معروف';

      return sock.sendMessage(from, {
        text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

🏰 • • ✤ ${clan.name} ✤ • • 🏰

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ 🏷️ Tag: #${clan.clanTag}
│ ⭐ المستوى: ${clan.level}
│ 📊 التقدم: [${progress}] ${clan.xp}/${xpNeeded}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

💰 خزنة الكلان: ${(clan.gold || 0).toLocaleString()} ذهبة
👥 الأعضاء: ${clan.members?.length || 1} محارب
⚔️ الانتصارات: ${clan.wins || 0} | 🛡️ الهزائم: ${clan.losses || 0}

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

📈 باف الكلان:
│ ⚔️ +${buff.atk.toFixed(1)}% هجوم
│ 🛡️ +${buff.defense.toFixed(1)}% دفاع
│ 🏪 ${buff.discount.toFixed(1)}% خصم

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

👑 القائد: ${leaderName}

> \`بــوت :\`
> _*『 FATIMA 』*__
━─━••❁⊰｢ ❀｣⊱❁••━─━`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // التبرع للكلان
    // ═════════════════════════════════════════════════════════════════════════
    if (['تبرع', 'donate'].includes(command)) {
      const player = data.players?.[sender];
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const amount = parseInt(args[0]);
      if (!amount) {
        return sock.sendMessage(from, { text: `❌ حدد المبلغ!\n💡 ${prefix}تبرع 500` });
      }

      const clan = getClan(from);
      const result = donateToClan(clan, player, amount);
      
      let response = result.message;
      if (result.leveledUp) {
        response += `\n\n🎉 الكلان ارتقى للمستوى ${result.newLevel}!`;
      }

      return sock.sendMessage(from, { text: response });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // الانضمام للكلان
    // ═════════════════════════════════════════════════════════════════════════
    if (['انضمام_الكلان', 'joinclan'].includes(command)) {
      const clan = getClan(from);
      const result = joinClan(clan, sender);
      return sock.sendMessage(from, { text: result.success ? result.message : result.message });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // قائمة الكلانات
    // ═════════════════════════════════════════════════════════════════════════
    if (['الكلانات', 'clanslist'].includes(command)) {
      const clans = getRankedClansList('');
      if (clans.length === 0) return sock.sendMessage(from, { text: '❌ لا توجد كلانات!' });

      const list = clans.slice(0, 15).map((c, i) =>
        `${i + 1}. 🏰 ${c.name} #${c.clanTag}\n   ⭐ Lv.${c.level} | 👥 ${c.members} | ⚔️ ${c.wins}`
      ).join('\n\n');

      return sock.sendMessage(from, { text: `🏰 قائمة الكلانات:\n\n${list}` });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // تحدي كلان
    // ═════════════════════════════════════════════════════════════════════════
    if (['تحدي', 'حارب'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });

      // طباعة للتصحيح
      console.log(`[DEBUG] تحدي - sender: ${sender}, clan.leader: ${clan.leader}`);
      
      // التحقق من أن المستخدم هو القائد
      if (!isClanLeader(clan, sender)) {
        console.log(`[DEBUG] فشل التحقق: ليس قائد`);
        return sock.sendMessage(from, { text: '❌ للقائد فقط!' });
      }
      console.log(`[DEBUG] نجح التحقق: المستخدم قائد`);

      // إذا لم يحدد كلان، عرض القائمة
      if (!args[0]) {
        const clans = getRankedClansList(from);
        if (clans.length === 0) return sock.sendMessage(from, { text: '❌ لا توجد كلانات للتحدي!' });

        const list = clans.slice(0, 10).map((c, i) =>
          `${i + 1}. 🏰 ${c.name} #${c.clanTag} (Lv.${c.level} | ${c.members} عضو)`
        ).join('\n');

        return sock.sendMessage(from, { 
          text: `🏰 اختر كلان للتحدي:\n\n${list}\n\n💡 ${prefix}تحدي <اسم الكلان أو رقم>` 
        });
      }

      // البحث عن الكلان
      const clans = getRankedClansList(from);
      let targetClan;
      const input = args.join(' ');

      // البحث بالرقم أو الاسم
      if (/^\d+$/.test(input)) {
        targetClan = clans[parseInt(input) - 1];
      } else {
        targetClan = clans.find(c => 
          c.name.toLowerCase().includes(input.toLowerCase()) ||
          c.clanTag === input
        );
      }

      if (!targetClan) return sock.sendMessage(from, { text: '❌ الكلان غير موجود!' });

      const result = await challengeClan(clan, targetClan.id, sender, sock);
      if (!result.success) return sock.sendMessage(from, { text: result.message });


      // إرسال إعلان للكلان المستهدف
      try {
        await sock.sendMessage(targetClan.id, {
          text: `⚔️ *تحدي حرب!*\n\n🏰 ${result.challengerName} يتحدى كلانكم!\n\n💰 جائزة الفوز: ${result.prizePool.toLocaleString()} ذهب\n⏰ المدة: 30 دقيقة\n\n💡 استخدم ${prefix}التحديات لعرض التحديات\n💡 ${prefix}قبول_التحدي <رقم> للقبول`
        });
      } catch (e) {}

      return sock.sendMessage(from, {
        text: `⚔️ تم إرسال تحدي!\n\n🏰 ${result.challengerName} VS 🏰 ${result.targetName}\n\n💰 جائزة الفوز: ${result.prizePool.toLocaleString()} ذهب\n⏰ المدة: 30 دقيقة\n\n⏳ ينتظر موافقة قائد ${result.targetName}`
      });
    }

    // التحديات المعلقة
    if (['التحديات', 'challenges'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });
      
      const challenges = clan.wars?.pendingChallenges || [];
      if (challenges.length === 0) return sock.sendMessage(from, { text: '✅ لا توجد تحديات معلقة!' });

      const list = challenges.map((c, i) =>
        `${i + 1}. ⚔️ ${c.challengerName} يتحداك!\n💰 الجائزة: ${c.prizePool.toLocaleString()}`
      ).join('\n\n');

      return sock.sendMessage(from, { text: `📜 التحديات المعلقة:\n\n${list}\n\n✅ ${prefix}قبول_التحدي <الرقم>\n❌ ${prefix}رفض_التحدي <الرقم>` });
    }

    // قبول التحدي
    if (['قبول_التحدي', 'accept'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });

      if (!isClanLeader(clan, sender)) {
        return sock.sendMessage(from, { text: '❌ للقائد فقط!' });
      }

      const challengeId = args[0];
      if (!challengeId) {
        return sock.sendMessage(from, { text: `❌ حدد رقم التحدي!\n💡 استخدم: ${prefix}قبول_التحدي <الرقم>` });
      }

      const challenges = clan.wars?.pendingChallenges || [];
      let challengeIndex = parseInt(challengeId) - 1;
      
      if (isNaN(challengeIndex) || challengeIndex < 0 || challengeIndex >= challenges.length) {
        return sock.sendMessage(from, { text: '❌ رقم التحدي غير صحيح!' });
      }

      const challenge = challenges[challengeIndex];
      const result = await acceptChallenge(clan, challenge.id, sender, sock);
      
      if (!result.success) return sock.sendMessage(from, { text: result.message });
      // جدولة بدء الحرب بعد 15 دقيقة (فترة التجهيز)
      const war = result.war;
      const prepTimeMs = WAR_PREP_TIME; // 15 دقيقة
      
      setTimeout(async () => {
        try {
          await startWar(war, sock);
        } catch (err) {
          console.error('❌ خطأ في بدء الحرب:', err.message);
        }
      }, prepTimeMs);

      return sock.sendMessage(from, {
        text: `⚔️ قبلت التحدي!\n\n🏰 ${war.challengerName} VS 🏰 ${war.targetName}\n\n💰 جائزة الفوز: ${war.prizePool.toLocaleString()} ذهب\n⏰ المدة: 30 دقيقة\n⏳ ستبدأ المعركة خلال 15 دقيقة!\n\n🎯 استخدم: ${prefix}مشاركة_الحرب <عدد الجنود>` });
    if (['رفض_التحدي', 'reject'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });

      if (!isClanLeader(clan, sender)) {
        return sock.sendMessage(from, { text: '❌ للقائد فقط!' });
      }

      const challengeId = args[0];
      if (!challengeId) {
        return sock.sendMessage(from, { text: `❌ حدد رقم التحدي!\n💡 استخدم: ${prefix}رفض_التحدي <الرقم>` });
      }

      const challenges = clan.wars?.pendingChallenges || [];
      let challengeIndex = parseInt(challengeId) - 1;
      
      if (isNaN(challengeIndex) || challengeIndex < 0 || challengeIndex >= challenges.length) {
        return sock.sendMessage(from, { text: '❌ رقم التحدي غير صحيح!' });
      }

      const challenge = challenges[challengeIndex];
      
      clan.wars.pendingChallenges = challenges.filter(c => c.id !== challenge.id);
      saveDatabase();

      return sock.sendMessage(from, {
        text: `❌ تم رفض تحدي من ${challenge.challengerName}`
      });
    }

    // المشاركة في الحرب (تسجيل الجنود)
    if (['مشاركة_الحرب', 'مشاركة', 'participate'].includes(command)) {
      const player = data.players?.[sender];
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });

      const war = getActiveWar(from);
      if (!war) return sock.sendMessage(from, { text: '❌ لا توجد حرب نشطة!' });

      // التحقق من فترة التجهيز
      if (Date.now() < war.prepEndTime) {
        const soldierCount = parseInt(args[0]) || 10;
        const maxCapacity = getArmyCapacity(clan.settlement?.buildings?.barracks?.level || 1);
        
        if (soldierCount > (player.soldiers || 0)) {
          return sock.sendMessage(from, { 
            text: `❌ ليس لديك جنود كافية!\\n📊 جيشك: ${player.soldiers || 0}/${maxCapacity}\\n💡 استخدم ${prefix}تدريب <عدد> لزيادة الجيش` 
          });
        }

        // تسجيل المشاركة - استخدام war.participants
        const isChallenger = war.challengerId === from;
        const participationList = isChallenger ? (war.participants.challenger || []) : (war.participants.target || []);
        
        const existingParticipation = participationList.find(p => p.playerId === sender);
        if (existingParticipation) {
          existingParticipation.soldiers = soldierCount;
        } else {
          if (isChallenger) {
            if (!war.participants) war.participants = {};
            if (!war.participants.challenger) war.participants.challenger = [];
            war.participants.challenger.push({ playerId: sender, soldiers: soldierCount, time: Date.now() });
          } else {
            if (!war.participants) war.participants = {};
            if (!war.participants.target) war.participants.target = [];
            war.participants.target.push({ playerId: sender, soldiers: soldierCount, time: Date.now() });
          }
        }

        saveDatabase();

        return sock.sendMessage(from, {
          text: `✅ تم تسجيل مشاركتك في الحرب!\\n⚔️ عدد الجنود: ${soldierCount}\\n⏰ تبدأ الحرب بعد انتهاء فترة التجهيز`
        });
      } else {
        return sock.sendMessage(from, { 
          text: `❌ انتهت فترة التجهيز!\\n💡 انتهت فترة التجهيز، سيتم حساب الضرر تلقائياً!` 
        });
      }
    }

    // الهجوم في الحرب - تم حذفه، الآن المشاركة فقط
    // ملاحظة: الهجوم يتم تلقائياً عند انتهاء الحرب بناءً على مشاركة الأعضاء

    if (['مشاركة_الحرب', 'مشاركة', 'participate'].includes(command)) {
      const player = data.players?.[sender];
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const clan = getClan(from);
      const war = getActiveWar(from);

      if (!war) {
        return sock.sendMessage(from, { text: '❌ لا توجد حرب نشطة!' });
      }

      // التحقق من أن الحرب في فترة التجهيز
      if (Date.now() >= war.prepEndTime) {
        return sock.sendMessage(from, { 
          text: `❌ انتهت فترة التجهيز!\\n💡 الحرب بدأت، سيتم حساب الضرر تلقائياً عند الانتهاء.` 
        });
      }

      // استخراج عدد الجنود من الرسالة
      const soldierCount = parseInt(text.split(' ')[1] || '0');
      if (!soldierCount || soldierCount <= 0) {
        return sock.sendMessage(from, { 
          text: `❌ يجب تحديد عدد الجنود!\\n💡 استخدم: ${prefix}مشاركة_الحرب 50` 
        });
      }

      // التحقق من سعة الثكنات
      const buildingLevel = player.buildings?.barracks?.level || player.buildings?.tower?.level || 1;
      const maxCapacity = buildingLevel * 20;
      
      if (soldierCount > maxCapacity) {
        return sock.sendMessage(from, { 
          text: `❌ عدد الجنود (${soldierCount}) يتجاوز سعة الثكنات (${maxCapacity})!\\n💡 قم بترقية مبنى صنفك لزيادة السعة.` 
        });
      }

      // التحقق من عدد الجنود المتاح
      const availableSoldiers = player.army?.total || 0;
      if (soldierCount > availableSoldiers) {
        return sock.sendMessage(from, { 
          text: `❌ ليس لديك جنود كافيين!\\n🪖 جنودك المتاحين: ${availableSoldiers}\\n💡 استخدم ${prefix}تدريب لتدريب المزيد.` 
        });
      }

      // حساب قوة الهجوم بناءً على الصنف والجنود
      let attackPower = 0;
      const classType = player.class;
      
      if (classType === 'محارب' || classType === 'فارس') {
        attackPower = soldierCount * (player.atk || 10) * 1.2;
      } else if (classType === 'رامي' || classType === 'قاتل') {
        attackPower = soldierCount * (player.atk || 10) * 1.3;
      } else if (classType === 'ساحر') {
        attackPower = soldierCount * (player.magic || 10) * 1.5;
      } else if (classType === 'شافي') {
        attackPower = soldierCount * (player.atk || 10) * 0.8;
      } else {
        attackPower = soldierCount * (player.atk || 10);
      }

      // تسجيل المشاركة
      const isChallenger = war.challengerId === from;
      const attacksArray = isChallenger ? war.challengerAttacks : war.targetAttacks;
      
      const existingAttack = attacksArray.find(a => a.playerId === sender);
      if (existingAttack) {
        existingAttack.damage = Math.floor(attackPower);
        existingAttack.soldiers = soldierCount;
      } else {
        attacksArray.push({
          playerId: sender,
          damage: Math.floor(attackPower),
          soldiers: soldierCount,
          class: classType,
          timestamp: Date.now()
        });
      }

      if (isChallenger) {
        war.challengerAttacks = attacksArray;
        war.challengerDamage = attacksArray.reduce((sum, a) => sum + a.damage, 0);
      } else {
        war.targetAttacks = attacksArray;
        war.targetDamage = attacksArray.reduce((sum, a) => sum + a.damage, 0);
      }

      const remainingPrep = Math.ceil((war.prepEndTime - Date.now()) / 60000);
      
      return sock.sendMessage(from, {
        text: `⚔️ تم تسجيل مشاركتك بنجاح!\\n\\n🪖 الجنود: ${soldierCount}/${maxCapacity}\\n💥 قوة الهجوم: ${Math.floor(attackPower).toLocaleString()}\\n📊 ضرر فريقك الكلي: ${(isChallenger ? war.challengerDamage : war.targetDamage).toLocaleString()}\\n\\n⏱️ الوقت المتبقي للتجهيز: ${remainingPrep} دقيقة\\n💡 بعد انتهاء التجهيز ستبدأ الحرب تلقائياً!`
      });
    }

    // حالة الحرب
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

      return sock.sendMessage(from, {
        text: `⚔️ حالة الحرب\n\n🏰 ${myName}: ${myDamage?.toLocaleString() || 0} ضرر\n🏰 ${enemyName}: ${enemyDamage?.toLocaleString() || 0} ضرر\n\n⏱️ الوقت المتبقي: ${mins}:${secs.toString().padStart(2, '0')}\n💰 الجائزة: ${war.prizePool?.toLocaleString() || 0} ذهب`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // نقل قيادة الكلان
    // ═════════════════════════════════════════════════════════════════════════
    if (['نقل_كلان', 'transferclan'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });

      // التحقق من أن المستخدم هو القائد
      if (!isClanLeader(clan, sender)) {
        return sock.sendMessage(from, { text: '❌ فقط قائد الكلان يستطيع استخدام هذا الأمر!' });
      }

      // التحقق من وجود Mention
      if (!msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
        return sock.sendMessage(from, { 
          text: `❌ يجب ذكر الشخص الذي تريد نقل القيادة له!\n💡 استخدم: ${prefix}نقل_كلان @الشخص` 
        });
      }

      const newLeaderId = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      const result = transferClanLeadership(clan, newLeaderId, sender);

      if (!result.success) {
        return sock.sendMessage(from, { text: result.message });
      }

      return sock.sendMessage(from, {
        text: `@\n━─━••❁⊰｢❀｣⊱❁••━─━\n\n👑 • • ✤ تم نقل القيادة! ✤ • • 👑\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n│ 🏰 الكلان: ${clan.name}\n│ 👑 القائد السابق: ${result.message.split('\n')[1].replace('👑 من: ', '')}\n│ 👑 القائد الجديد: ${result.message.split('\n')[2].replace('👑 إلى: ', '')}\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n> \`بــوت :\`\n> _*『 FATIMA 』*__\n━─━••❁⊰｢ ❀｣⊱❁••━─━`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // حذف الكلان (فقط للقائد)
    // ═════════════════════════════════════════════════════════════════════════
    if (['حذف_كلان', 'deleteclan'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });

      // التحقق من أن المستخدم هو القائد
      if (!isClanLeader(clan, sender)) {
        return sock.sendMessage(from, { text: '❌ فقط قائد الكلان يستطيع حذف الكلان!' });
      }

      const result = deleteClan(clan, sender);

      if (!result.success) {
        return sock.sendMessage(from, { text: result.message });
      }

      const clanName = clan.name;
      return sock.sendMessage(from, {
        text: `@\\n━─━••❁⊰｢❀｣⊱❁••━─━\\n\\n💀 • • ✤ تم حذف الكلان! ✤ • • 💀\\n\\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\\n│ 🏰 الكلان: ${clanName}\\n│ 👑 القائد: ${result.message}\\n│ 💔 الحالة: تم الحل\\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\\n\\n> \`بــوت :\`\\n> _*『 FATIMA 』*_\\n━─━••❁⊰｢ ❀｣⊱❁••━─━`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // تدريب الجنود
    // ═════════════════════════════════════════════════════════════════════════
    if (['تدريب', 'train'].includes(command)) {
      const player = data.players?.[sender];
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });

      const amount = parseInt(args[0]) || 10;
      const result = trainSoldiers(player, clan, amount);

      return sock.sendMessage(from, { text: result.message });
    }
    // ═════════════════════════════════════════════════════════════════════════
    // عرض جيشي
    // ═════════════════════════════════════════════════════════════════════════
    if (['جيشي', 'myarmy'].includes(command)) {
      const player = data.players?.[sender];
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });

      const playerClass = player.class || "محارب";
      const soldierType = SOLDIER_TYPES[playerClass] || "infantry";
      const soldierName = SOLDIER_NAMES[soldierType];
      
      let buildingLevel = 1;
      if (soldierType === "infantry" || soldierType === "cavalry") {
        buildingLevel = clan.settlement?.buildings?.barracks?.level || 1;
      } else if (soldierType === "archer") {
        buildingLevel = clan.settlement?.buildings?.watchtower?.level || 1;
      } else if (soldierType === "mage") {
        buildingLevel = clan.settlement?.buildings?.mageTower?.level || 1;
      } else if (soldierType === "healer") {
        buildingLevel = clan.settlement?.buildings?.hospital?.level || 1;
      }
      
      const maxCapacity = getArmyCapacity(buildingLevel);
      const currentSoldiers = player.soldiers || 0;
      
      return sock.sendMessage(from, {
        text: `🪖 *جيشك*\n\n🎯 الصنف: ${playerClass}\n⚔️ نوع الجنود: ${soldierName}\n📊 العدد الحالي: ${currentSoldiers}/${maxCapacity}\n🏰 مستوى المبنى: ${buildingLevel}\n\n💡 استخدم ${prefix}تدريب <عدد> لزيادة الجيش`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // عرض مباني المستوطنة
    // ═════════════════════════════════════════════════════════════════════════
    if (['مبناي', 'mybuildings'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });

      const buildings = clan.settlement?.buildings || {};
      let text = `🏰 *مباني مستوطنتك*\n\n`;
      
      // القلعة المركزية
      const castleLevel = buildings.castle?.level || 1;
      text += `🏰 القلعة المركزية: مستوى ${castleLevel}\n`;
      text += `   👥 سعة الأعضاء: ${BUILDINGS.castle.effects.memberCapacity[castleLevel - 1]}\n\n`;
      
      // الثكنات
      const barracksLevel = buildings.barracks?.level || 0;
      if (barracksLevel > 0) {
        text += `⚔️ الثكنات: مستوى ${barracksLevel}\n`;
        text += `   📊 سعة الجيش: +${BUILDINGS.barracks.effects.armyCapacity[barracksLevel - 1]}\n\n`;
      }
      
      // برج السحر
      const mageTowerLevel = buildings.mageTower?.level || 0;
      if (mageTowerLevel > 0) {
        text += `🔮 برج السحر: مستوى ${mageTowerLevel}\n`;
        text += `   🛡️ الدفاع السحري: +${(BUILDINGS.mageTower.effects.magicalDefense[mageTowerLevel - 1] * 100).toFixed(0)}%\n\n`;
      }
      
      // المشفى
      const hospitalLevel = buildings.hospital?.level || 0;
      if (hospitalLevel > 0) {
        text += `🏥 المشفى: مستوى ${hospitalLevel}\n`;
        text += `   💚 تقليل الخسائر: ${(BUILDINGS.hospital.effects.warLossReduction[hospitalLevel - 1] * 100).toFixed(0)}%\n\n`;
      }
      
      // برج المراقبة
      const watchtowerLevel = buildings.watchtower?.level || 0;
      if (watchtowerLevel > 0) {
        text += `🗼 برج المراقبة: مستوى ${watchtowerLevel}\n`;
        text += `   🎯 كشف العدو: ${(BUILDINGS.watchtower.effects.enemyDefReveal[watchtowerLevel - 1] * 100).toFixed(0)}%\n\n`;
      }
      
      // الأسوار
      const walls = buildings.wall || [];
      if (walls.length > 0) {
        const totalDefense = walls.reduce((sum, w) => sum + (BUILDINGS.wall.effects.defenseBonus[(w.level || 1) - 1] || 0), 0);
        text += `🧱 الأسوار (${walls.length}): دفاع إجمالي ${totalDefense}\n\n`;
      }
      
      // الموارد
      const goldMines = buildings.goldMine || [];
      const elixirCollectors = buildings.elixirCollector || [];
      text += `⛏️ مناجم الذهب: ${goldMines.length}\n`;
      text += `⚗️ جامعات الإكسير: ${elixirCollectors.length}\n`;
      
      return sock.sendMessage(from, { text });
    }


    // ═════════════════════════════════════════════════════════════════════════
    // شراء عناصر حرب
    // ═════════════════════════════════════════════════════════════════════════
    if (['شراء_حرب', 'buywar'].includes(command)) {
      const player = data.players?.[sender];
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const itemName = args.join(' ');
      if (!itemName) {
        const items = Object.keys(WAR_ITEMS).join(' | ');
        return sock.sendMessage(from, { 
          text: `🛒 المتجر الحربي:\n\n${items}\n\n💡 استخدم: ${prefix}شراء_حرب <اسم العنصر>` 
        });
      }

      const result = buyWarItem(player, itemName);
      return sock.sendMessage(from, { text: result.message });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // ترتيب الكلانات
    // ═════════════════════════════════════════════════════════════════════════
    if (['ترتيب_كلان', 'clanrank'].includes(command)) {
      const ranking = getClanRankings();
      return sock.sendMessage(from, { text: ranking });
    }
  }
}
