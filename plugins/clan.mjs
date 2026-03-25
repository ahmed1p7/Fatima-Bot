// ═══════════════════════════════════════════════════════════════════════════════
// 🏰 أوامر الكلانات والحروب المحسنة - فاطمة بوت v13.0
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from '../lib/database.mjs';
import { clanXpForLevel, progressClanBar } from '../lib/rpg.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════════════

function getClan(groupId) {
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
        goldMine: [{ level: 1 }],
        elixirCollector: [{ level: 1 }]
      },
      resources: { gold: 500, elixir: 250 }
    },
    
    wars: { wins: 0, losses: 0, currentWar: null },
    
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

function challengeClan(challengerClan, targetClanId, challengerId) {
  const data = getRpgData();
  const targetClan = data.clans?.[targetClanId];
  
  if (!targetClan) return { success: false, message: '❌ الكلان غير موجود!' };
  if (challengerClan.id === targetClanId) return { success: false, message: '❌ لا يمكنك تحدي كلانك!' };
  if (challengerClan.wars?.currentWar) return { success: false, message: '❅ كلانك في حرب بالفعل!' };
  if (targetClan.wars?.currentWar) return { success: false, message: '❅ الكلان المستهدف في حرب!' };
  
  // التحقق من كون المستخدم قائد
  if (challengerClan.leader !== challengerId) {
    return { success: false, message: '❌ للقائد فقط!' };
  }
  
  // إنشاء الحرب
  const war = {
    id: `war_${Date.now()}`,
    challengerId: challengerClan.id,
    challengerName: challengerClan.name,
    challengerTag: challengerClan.clanTag,
    targetId: targetClanId,
    targetName: targetClan.name,
    targetTag: targetClan.clanTag,
    challengerDamage: 0,
    targetDamage: 0,
    prizePool: Math.floor((challengerClan.gold || 0) * 0.1) + 500,
    startedAt: Date.now(),
    endsAt: Date.now() + 30 * 60 * 1000, // 30 دقيقة
    status: 'active',
    challengerAttacks: [],
    targetAttacks: []
  };
  
  challengerClan.wars = challengerClan.wars || {};
  challengerClan.wars.currentWar = war;
  
  targetClan.wars = targetClan.wars || {};
  targetClan.wars.currentWar = war;
  
  saveDatabase();
  
  return {
    success: true,
    war,
    challengerName: challengerClan.name,
    targetName: targetClan.name,
    prizePool: war.prizePool
  };
}

function attackInWar(clan, playerId, attackPower) {
  if (!clan.wars?.currentWar) {
    return { success: false, message: '❅ لا توجد حرب جارية!' };
  }
  
  const war = clan.wars.currentWar;
  const now = Date.now();
  
  if (now >= war.endsAt) {
    return { success: false, message: '❅ الحرب انتهت!' };
  }
  
  // تحديد الفريق
  const isChallenger = war.challengerId === clan.id;
  
  // حساب الضرر
  let damage = Math.floor(attackPower * (0.8 + Math.random() * 0.4));
  
  // تحديث الضرر
  if (isChallenger) {
    war.challengerDamage = (war.challengerDamage || 0) + damage;
    war.challengerAttacks = war.challengerAttacks || [];
    war.challengerAttacks.push({ playerId, damage, time: now });
  } else {
    war.targetDamage = (war.targetDamage || 0) + damage;
    war.targetAttacks = war.targetAttacks || [];
    war.targetAttacks.push({ playerId, damage, time: now });
  }
  
  saveDatabase();
  
  return {
    success: true,
    damage,
    totalDamage: isChallenger ? war.challengerDamage : war.targetDamage
  };
}

function getActiveWar(clanId) {
  const clan = getClan(clanId);
  return clan?.wars?.currentWar || null;
}

function endWar(war) {
  const data = getRpgData();
  
  const challengerClan = data.clans?.[war.challengerId];
  const targetClan = data.clans?.[war.targetId];
  
  // تحديد الفائز
  const challengerWon = war.challengerDamage > war.targetDamage;
  
  if (challengerWon) {
    if (challengerClan) {
      challengerClan.wins = (challengerClan.wins || 0) + 1;
      challengerClan.gold = (challengerClan.gold || 0) + war.prizePool;
    }
    if (targetClan) {
      targetClan.losses = (targetClan.losses || 0) + 1;
    }
  } else {
    if (targetClan) {
      targetClan.wins = (targetClan.wins || 0) + 1;
      targetClan.gold = (targetClan.gold || 0) + war.prizePool;
    }
    if (challengerClan) {
      challengerClan.losses = (challengerClan.losses || 0) + 1;
    }
  }
  
  // إنهاء الحرب
  if (challengerClan) {
    challengerClan.wars.warHistory = challengerClan.wars.warHistory || [];
    challengerClan.wars.warHistory.push(war);
    challengerClan.wars.currentWar = null;
  }
  if (targetClan) {
    targetClan.wars.warHistory = targetClan.wars.warHistory || [];
    targetClan.wars.warHistory.push(war);
    targetClan.wars.currentWar = null;
  }
  
  saveDatabase();
  
  return {
    winner: challengerWon ? war.challengerName : war.targetName,
    prize: war.prizePool
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 تصدير الأوامر
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  name: 'Clan',
  commands: [
    'تفعيل_الكلان', 'createclan', 'إنشاء_كلان',
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
> _*『 FATIMA 』*_
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
> _*『 FATIMA 』*_
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
      const clans = getAvailableClans('');
      if (clans.length === 0) return sock.sendMessage(from, { text: '❌ لا توجد كلانات!' });

      const list = clans.slice(0, 15).map((c, i) =>
        `${i + 1}. 🏰 ${c.name} #${c.clanTag}\n   ⭐ Lv.${c.level} | 👥 ${c.members} | ⚔️ ${c.wins}`
      ).join('\n\n');

      return sock.sendMessage(from, { text: `🏰 قائمة الكلانات:\n\n${list}` });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // تحدي كلان
    // ═════════════════════════════════════════════════════════════════════════
    if (['تحدي', 'challenge'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });


      // التحقق من أن المستخدم هو القائد (مع معالجة جميع الصيغ الممكنة)
      const senderNum = sender.replace('@s.whatsapp.net', '');
      const leaderNum = String(clan.leader || '').replace('@s.whatsapp.net', '');
      const isLeader = senderNum === leaderNum;
      
      if (!isLeader) return sock.sendMessage(from, { text: '❌ للقائد فقط!' });

      if (clan.leader !== sender) {
        return sock.sendMessage(from, { text: '❌ للقائد فقط!' });
      }
      main

      // إذا لم يحدد كلان، عرض القائمة
      if (!args[0]) {
        const clans = getAvailableClans(from);
        if (clans.length === 0) return sock.sendMessage(from, { text: '❌ لا توجد كلانات للتحدي!' });

        const list = clans.slice(0, 10).map((c, i) =>
          `${i + 1}. 🏰 ${c.name} #${c.clanTag} (Lv.${c.level} | ${c.members} عضو)`
        ).join('\n');

        return sock.sendMessage(from, { 
          text: `🏰 اختر كلان للتحدي:\n\n${list}\n\n💡 ${prefix}تحدي <اسم الكلان أو رقم>` 
        });
      }

      // البحث عن الكلان
      const clans = getAvailableClans(from);
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

      const result = challengeClan(clan, targetClan.id, sender);
      if (!result.success) return sock.sendMessage(from, { text: result.message });

      // إرسال إعلان للكلان المستهدف
      try {
        await sock.sendMessage(targetClan.id, {
          text: `⚔️ *تحدي حرب!*

🏰 ${result.challengerName} يتحدى كلانكم!

💰 جائزة الفوز: ${result.prizePool.toLocaleString()} ذهب
⏰ المدة: 30 دقيقة


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
      
      // التحقق من أن المستخدم هو القائد (مع معالجة جميع الصيغ الممكنة)
      const senderNum = sender.replace('@s.whatsapp.net', '');
      const leaderNum = String(clan.leader || '').replace('@s.whatsapp.net', '');
      const isLeader = senderNum === leaderNum;
      
      if (!isLeader) return sock.sendMessage(from, { text: '❌ للقائد فقط!' });

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

🎯 استخدموا:
${prefix}هجوم_حرب للهجوم!`
        });
      } catch {}
 main

      return sock.sendMessage(from, {
        text: `⚔️ تم إرسال تحدي!

🏰 ${result.challengerName} VS 🏰 ${result.targetName}


    // ═══════════════════════════════════════════════════════════════════════════
    // رفض التحدي
    // ═══════════════════════════════════════════════════════════════════════════
    if (['رفض_التحدي', 'reject'].includes(command)) {
      const clan = getClan(from);
      if (!clan) return sock.sendMessage(from, { text: '❌ جروبك بدون كلان!' });
      
      // التحقق من أن المستخدم هو القائد (مع معالجة جميع الصيغ الممكنة)
      const senderNum = sender.replace('@s.whatsapp.net', '');
      const leaderNum = String(clan.leader || '').replace('@s.whatsapp.net', '');
      const isLeader = senderNum === leaderNum;
      
      if (!isLeader) return sock.sendMessage(from, { text: '❌ للقائد فقط!' });

💰 جائزة الفوز: ${result.prizePool.toLocaleString()} ذهب
 main

⏰ المدة: 30 دقيقة

🎯 اهجم الآن: ${prefix}هجوم_حرب`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // الهجوم في الحرب
    // ═════════════════════════════════════════════════════════════════════════
    if (['هجوم_حرب', 'attack', 'هجوم'].includes(command)) {
      const player = data.players?.[sender];
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const clan = getClan(from);
      const war = getActiveWar(from);
      
      if (!war) {
        return sock.sendMessage(from, { text: '❌ لا توجد حرب نشطة!' });
      }

      // التحقق من انتهاء الحرب
      if (Date.now() >= war.endsAt) {
        const result = endWar(war);
        return sock.sendMessage(from, {
          text: `🏁 انتهت الحرب!

🏆 الفائز: ${result.winner}
💰 الجائزة: ${result.prize?.toLocaleString()} ذهب`
        });
      }

      // التحقق من التهدئة
      const now = Date.now();
      const lastAttack = player.lastWarAttack || 0;
      if (now - lastAttack < 30000) {
        const remaining = Math.ceil((30000 - (now - lastAttack)) / 1000);
        return sock.sendMessage(from, { text: `⏰ انتظر ${remaining} ثانية!` });
      }
      
      player.lastWarAttack = now;

      const result = attackInWar(clan, sender, player.atk);
      if (!result.success) {
        return sock.sendMessage(from, { text: result.message });
      }

      // حساب الوقت المتبقي
      const remaining = Math.max(0, war.endsAt - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);

      return sock.sendMessage(from, {
        text: `⚔️ هجوم ناجح!

💥 ضررك: ${result.damage}
📊 ضرر فريقك: ${result.totalDamage.toLocaleString()}

⏱️ الوقت المتبقي: ${mins}:${secs.toString().padStart(2, '0')}`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // حالة الحرب
    // ═════════════════════════════════════════════════════════════════════════
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

      return sock.sendMessage(from, {
        text: `⚔️ حالة الحرب

🏰 ${myName}: ${myDamage?.toLocaleString() || 0} ضرر
🏰 ${enemyName}: ${enemyDamage?.toLocaleString() || 0} ضرر

⏱️ الوقت المتبقي: ${mins}:${secs.toString().padStart(2, '0')}
💰 الجائزة: ${war.prizePool?.toLocaleString() || 0} ذهب

🎯 ${prefix}هجوم_حرب`
      });
    }
  }
};
