// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 أوامر RPG الكاملة - فاطمة بوت v13.0
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase, createNewPlayer, CLASSES } from '../lib/database.mjs';
import { 
  xpForLevel, healthBar, levelUp, fightMonster, pvpBattle, 
  openBox, healPlayer, fish, mine, work, formatProfile,
  getRandomMonster
} from '../lib/rpg.mjs';
import { unlockSkill, formatSkillTree, formatPlayerSkills, allocateAbilityPoint } from '../lib/skills.mjs';
import { 
  registerForBoss, attackBoss, getActiveBoss, getBossStatus, 
  groupHeal, getAllBosses 
} from '../lib/boss.mjs';
import { sendImage, sendBossImage } from '../lib/utils/image.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 دالة مساعدة للاعب
// ═══════════════════════════════════════════════════════════════════════════════

function getPlayer(data, sender, groupId = null) {
  // إذا كان groupId موجود، نبحث عن اللاعب في هذا القروب
  if (groupId) {
    const groupPlayerKey = `${groupId}_${sender}`;
    if (data.players?.[groupPlayerKey]) {
      return data.players[groupPlayerKey];
    }
  }
  // البحث عن اللاعب بدون groupId
  return data.players?.[sender] || null;
}

function formatTime(ms) {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const secs = Math.floor((ms % (60 * 1000)) / 1000);
  if (hours > 0) return `${hours}س ${mins}د`;
  if (mins > 0) return `${mins}د ${secs}ث`;
  return `${secs}ث`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 الأوامر
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  name: 'RPG',
  commands: [
    // التسجيل والملف
    'تسجيل', 'register',
    'ملف', 'ملفي', 'profile', 'شخصية',
    'مستواي', 'level',
    'طاقتي', 'stamina',
    'رتبتي', 'rank',
    'الرتب', 'leaderboard',
    
    // القتال
    'هجوم', 'قتال', 'fight', 'attack',
    'تحدي', 'challenge',
    'علاج', 'heal',
    'علاج_جماعي',
    
    // الموارد
    'يومي', 'daily',
    'عمل', 'work',
    'صيد', 'fish',
    'تعدين', 'mine',
    'رصيد', 'balance',
    
    // الصناديق
    'صناديقي', 'boxes',
    'فتح_صندوق', 'openbox',
    'صندوق', 'box',
    
    // المخزون
    'مخزون', 'inventory',
    'تجهيز', 'equip',
    'نزع', 'unequip',
    'بيع', 'sell',
    
    // المهارات
    'مهاراتي', 'myskills',
    'شجرة', 'skilltree',
    'مهارة', 'skill',
    'نقاط', 'points',
    
    // الزعماء
    'زعماء', 'bosses',
    'قتال_الزعيم', 'bossfight',
    'هجوم_زعيم', 'attackboss',
    'حالة_زعيم', 'bossstatus',
    
    // التبرع والهدايا
    'هدية', 'gift',
    'تبرع', 'donate',
    
    // حذف التسجيل
    'حذف_تسجيل', 'deleteaccount'
  ],

  async execute(sock, msg, ctx) {
    const { from, sender, pushName, command, args, text, prefix, quoted, isGroup, isAdmin, isOwner } = ctx;
    let data = getRpgData();
    if (!data.players) data.players = {};

    // ═════════════════════════════════════════════════════════════════════════
    // تسجيل
    // ═════════════════════════════════════════════════════════════════════════
    if (['تسجيل', 'register'].includes(command)) {
      // التحقق من أن الأمر في قروب وأن المستخدم مشرف أو مالك
      if (!isGroup) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر يعمل في القروبات فقط!' });
      }
      
      if (!isAdmin && !isOwner) {
        return sock.sendMessage(from, { text: '❌ هذا الأمر للمشرفين فقط!' });
      }

      // التحقق من وجود منشن
      const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!mentionedJid) {
        return sock.sendMessage(from, {
          text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

🎭 • • ✤ تسجيل لاعب جديد ✤ • • 🎭

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
💡 الاستخدام:
${prefix}تسجيل @المنشن <اللقب> <الصنف>

أمثلة:
${prefix}تسجيل @احمد زازا فارس
${prefix}تسجيل @محمد بطل محارب
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

الأصناف المتاحة:
${Object.entries(CLASSES).map(([n, c]) => `${c.emoji} ${n} - ⚔️${c.atk} 🛡️${c.def} ❤️${c.hp}`).join('\n')}

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`
        });
      }

      const nickname = args[0];
      const cls = args[1];

      if (!nickname || !cls) {
        return sock.sendMessage(from, { text: '❌ يرجى تحديد اللقب والصنف!\nمثال: .تسجيل @احمد زازا فارس' });
      }

      if (!CLASSES[cls]) {
        return sock.sendMessage(from, { 
          text: `❌ صنف غير موجود! اختر من:\n${Object.keys(CLASSES).join(' | ')}` 
        });
      }

      // استخدام المنشن كمعرّف للاعب بدلاً من sender
      const playerId = mentionedJid;
      
      // إنشاء مفتاح فريد لكل قروب + لاعب
      const groupPlayerKey = `${from}_${playerId}`;
      if (data.players[groupPlayerKey]) {
        return sock.sendMessage(from, { text: '❌ هذا اللاعب مسجل بالفعل في هذا القروب!' });
      }

      const classData = CLASSES[cls];
      data.players[groupPlayerKey] = createNewPlayer(playerId, nickname, cls);
      data.players[groupPlayerKey].inventory = ['جرعة صغيرة', 'خريطة كنز'];
      data.players[groupPlayerKey].groupId = from;
      data.players[groupPlayerKey].groupNickname = nickname;
      
      saveDatabase();

      return sock.sendMessage(from, {
        text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

🎉 • • ✤ تم التسجيل! ✤ • • 🎉

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ ${classData.emoji} ${nickname}
│ 👤 المنشن: ${mentionedJid.split('@')[0]}
│ 🎭 الصنف: ${cls}
│ ⚔️ الهجوم: ${classData.atk}
│ 🛡️ الدفاع: ${classData.def}
│ ❤️ الصحة: ${classData.hp}
│ ✨ السحر: ${classData.mag}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

🎁 هدية البداية:
│ 💰 100 ذهب
│ 🧪 جرعة صغيرة
│ 🗺️ خريطة كنز
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`,
        mentions: [mentionedJid]
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // حذف التسجيل
    // ═════════════════════════════════════════════════════════════════════════
    if (['حذف_تسجيل', 'deleteaccount'].includes(command)) {
      const p = data.players[sender];
      if (!p) {
        return sock.sendMessage(from, { text: '❌ أنت غير مسجل أصلاً!' });
      }

      const confirmation = args[0];
      if (confirmation !== 'تأكيد') {
        return sock.sendMessage(from, {
          text: `⚠️ • • ✤ تحذير! ✤ • • ⚠️

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
أنت على وشك حذف حسابك!

❌ سيتم فقدان:
│ 🎭 المستوى: ${p.level}
│ 💰 الذهب: ${(p.gold || 0).toLocaleString()}
│ ⚔️ الأسلحة: ${(p.weapons || []).length}
│ 🛡️ الدروع: ${(p.armors || []).length}
│ 🏆 الانتصارات: ${p.wins || 0}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

💡 للتأكيد اكتب:
${prefix}حذف_تسجيل تأكيد`
        });
      }

      const playerName = p.name;
      const classEmoji = CLASSES[p.class]?.emoji || '🎮';

      delete data.players[sender];
      saveDatabase();

      return sock.sendMessage(from, {
        text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

🗑️ • • ✤ تم حذف الحساب ✤ • • 🗑️

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
${classEmoji} ${playerName}
│ ❌ تم حذف حسابك بنجاح
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

💡 يمكنك التسجيل من جديد باستخدام:
${prefix}تسجيل <الصنف>

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // الملف الشخصي
    // ═════════════════════════════════════════════════════════════════════════
    if (['ملف', 'ملفي', 'profile', 'شخصية'].includes(command)) {
      // البحث عن اللاعب في هذا القروب أولاً
      const groupPlayerKey = `${from}_${sender}`;
      let p = data.players[groupPlayerKey];
      
      // إذا لم يوجد، نبحث عن لاعب عام (بدون groupId)
      if (!p) {
        p = getPlayer(data, sender, from);
      }
      
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً! استخدم .تسجيل <صنف>' });

      const classEmoji = CLASSES[p.class]?.emoji || '🎮';
      const profileText = formatProfile(p, classEmoji);
      
      // إرسال مع صورة
      await sendImage(sock, from, null, profileText);
      return;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // مستواي
    // ═════════════════════════════════════════════════════════════════════════
    if (['مستواي', 'level'].includes(command)) {
      const p = getPlayer(data, sender, from);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const xpNeeded = xpForLevel(p.level);
      const xpBar = healthBar(p.xp, xpNeeded);

      return sock.sendMessage(from, {
        text: `🎖️ المستوى: ${p.level}
⭐ XP: ${p.xp}/${xpNeeded}
📊 [${xpBar}]
💰 الذهب: ${(p.gold || 0).toLocaleString()}`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // طاقتي
    // ═════════════════════════════════════════════════════════════════════════
    if (['طاقتي', 'stamina'].includes(command)) {
      const p = getPlayer(data, sender, from);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const maxStamina = p.maxStamina || 10;
      const currentStamina = p.stamina || 10;
      const staminaBar = healthBar(currentStamina, maxStamina);

      return sock.sendMessage(from, {
        text: `⚡ الطاقة: ${currentStamina}/${maxStamina}
📊 [${staminaBar}]

💡 تتجدد يومياً عند منتصف الليل`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // الرتب / المتصدرين
    // ═════════════════════════════════════════════════════════════════════════
    if (['رتبتي', 'rank', 'الرتب', 'leaderboard'].includes(command)) {
      const players = Object.values(data.players)
        .filter(p => p && p.level)
        .sort((a, b) => ((b.level || 1) * 1000 + (b.xp || 0)) - ((a.level || 1) * 1000 + (a.xp || 0)))
        .slice(0, 10);

      if (players.length === 0) {
        return sock.sendMessage(from, { text: '❌ لا يوجد لاعبين!' });
      }

      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

      return sock.sendMessage(from, {
        text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

🏆 • • ✤ لوحة المتصدرين ✤ • • 🏆

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
${players.map((p, i) => `${medals[i]} ${CLASSES[p.class]?.emoji || '🎮'} ${p.name}\n   Lv.${p.level} | 💰 ${(p.gold || 0).toLocaleString()}`).join('\n\n')}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // هجوم / قتال
    // ═════════════════════════════════════════════════════════════════════════
    if (['هجوم', 'قتال', 'fight', 'attack'].includes(command)) {
      const p = getPlayer(data, sender, from);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      if (p.hp < p.maxHp * 0.2) {
        return sock.sendMessage(from, { text: '❌ صحة ضعيفة! استخدم .علاج أولاً' });
      }

      if ((p.stamina || 0) < 1) {
        return sock.sendMessage(from, { text: '❌ طاقة غير كافية! انتظر التجديد' });
      }

      p.stamina--;
      p.lastStaminaUpdate = Date.now();

      const result = fightMonster(p);
      saveDatabase();

      if (result.won) {
        let msg = `@
━─━••❁⊰｢❀｣⊱❁••━─━

⚔️ • • ✤ انتصار! ✤ • • ⚔️

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ ${result.monster.emoji} ${result.monster.name}
│ ❌ هُزم!
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

🎁 المكافآت:
│ 💰 +${result.rewards.gold} ذهب
│ ⭐ +${result.rewards.xp} XP`;

        if (result.levelUp) {
          msg += `\n\n🎉 مستوى جديد! ${result.levelUp.newLevel}`;
        }

        if (result.boxDrop) {
          const boxEmojis = { common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟡' };
          msg += `\n│ 📦 ${boxEmojis[result.boxDrop]} صندوق ${result.boxDrop}!`;
        }

        msg += `\n
⚡ طاقتك: ${p.stamina}/${p.maxStamina || 10}

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`;

        return sock.sendMessage(from, { text: msg });
      } else {
        return sock.sendMessage(from, {
          text: `💀 هُزمت بواسطة ${result.monster.emoji} ${result.monster.name}!

💔 HP: ${p.hp}/${p.maxHp}
💡 استخدم .علاج لاستعادة صحتك`
        });
      }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // تحدي PvP
    // ═════════════════════════════════════════════════════════════════════════
    if (['تحدي', 'challenge'].includes(command)) {
      const p1 = getPlayer(data, sender, from);
      if (!p1) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const tid = quoted?.mentionedJid?.[0];
      if (!tid) {
        return sock.sendMessage(from, { text: '❌ أشر لشخص! (رد على رسالته مع ذكره)' });
      }

      const p2 = getPlayer(data, tid);
      if (!p2) {
        return sock.sendMessage(from, { text: '❌ الشخص غير مسجل!' });
      }

      if (sender === tid) {
        return sock.sendMessage(from, { text: '❌ لا يمكنك تحدي نفسك!' });
      }

      const result = pvpBattle(p1, p2);
      p1.lastPvP = Date.now();
      saveDatabase();

      return sock.sendMessage(from, {
        text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

⚔️ • • ✤ تحدي PvP ✤ • • ⚔️

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ ${CLASSES[p1.class]?.emoji || '🎮'} ${p1.name}
│ VS
│ ${CLASSES[p2.class]?.emoji || '🎮'} ${p2.name}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

🏆 الفائز: ${result.winner.name}
💰 +${result.goldReward} ذهب

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`,
        mentions: [tid]
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // علاج
    // ═════════════════════════════════════════════════════════════════════════
    if (['علاج', 'heal'].includes(command)) {
      const p = getPlayer(data, sender, from);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      if (p.hp >= p.maxHp) {
        return sock.sendMessage(from, { text: '✅ صحتك كاملة بالفعل!' });
      }

      const cost = Math.floor((p.maxHp - p.hp) * 0.5);
      if ((p.gold || 0) < cost) {
        return sock.sendMessage(from, { text: `❌ تحتاج ${cost} ذهب للعلاج!` });
      }

      p.gold -= cost;
      p.hp = p.maxHp;
      saveDatabase();

      return sock.sendMessage(from, { text: `💚 تم علاجك بالكامل!\n💰 -${cost} ذهب` });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // يومي
    // ═════════════════════════════════════════════════════════════════════════
    if (['يومي', 'daily'].includes(command)) {
      const p = getPlayer(data, sender, from);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const now = Date.now();
      const lastDaily = p.lastDaily || 0;

      if (now - lastDaily < 86400000) {
        const remaining = formatTime(86400000 - (now - lastDaily));
        return sock.sendMessage(from, { text: `⏰ ارجع بعد ${remaining}!` });
      }

      const streak = (p.dailyStreak || 0) + 1;
      const baseBonus = 100 + p.level * 20;
      const streakBonus = Math.min(streak * 10, 100);
      const totalBonus = Math.floor(baseBonus * (1 + streakBonus / 100));

      p.gold = (p.gold || 0) + totalBonus;
      p.lastDaily = now;
      p.dailyStreak = streak;

      saveDatabase();

      return sock.sendMessage(from, {
        text: `🎁 الجائزة اليومية:

💰 +${totalBonus} ذهب
🔥 Streak: ${streak} يوم`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // عمل
    // ═════════════════════════════════════════════════════════════════════════
    if (['عمل', 'work'].includes(command)) {
      const p = getPlayer(data, sender, from);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const now = Date.now();
      if (now - (p.lastWork || 0) < 3600000) {
        const remaining = formatTime(3600000 - (now - p.lastWork));
        return sock.sendMessage(from, { text: `⏰ انتظر ${remaining}!` });
      }

      const result = work(p);
      saveDatabase();

      return sock.sendMessage(from, {
        text: `${result.job.emoji} عملت كـ ${result.job.name}!\n💰 +${result.earnings} ذهب`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // صيد
    // ═════════════════════════════════════════════════════════════════════════
    if (['صيد', 'fish'].includes(command)) {
      const p = getPlayer(data, sender, from);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const now = Date.now();
      if (now - (p.lastFish || 0) < 30000) {
        return sock.sendMessage(from, { text: '⏰ انتظر 30 ثانية!' });
      }

      const result = fish();
      p.gold = (p.gold || 0) + result.price;
      p.lastFish = now;
      
      if (!p.stats) p.stats = {};
      p.stats.fishCaught = (p.stats.fishCaught || 0) + 1;

      saveDatabase();

      return sock.sendMessage(from, {
        text: `🎣 صيد:\n${result.emoji} ${result.name}\n💰 ${result.price} ذهب`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // تعدين
    // ═════════════════════════════════════════════════════════════════════════
    if (['تعدين', 'mine'].includes(command)) {
      const p = getPlayer(data, sender, from);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const now = Date.now();
      if (now - (p.lastMine || 0) < 60000) {
        return sock.sendMessage(from, { text: '⏰ انتظر دقيقة!' });
      }

      const result = mine();
      p.gold = (p.gold || 0) + result.price;
      p.lastMine = now;
      
      if (!p.stats) p.stats = {};
      p.stats.mineralsMined = (p.stats.mineralsMined || 0) + 1;

      saveDatabase();

      return sock.sendMessage(from, {
        text: `⛏️ تعدين:\n${result.emoji} ${result.name}\n💰 ${result.price} ذهب`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // رصيد
    // ═════════════════════════════════════════════════════════════════════════
    if (['رصيد', 'balance'].includes(command)) {
      const p = getPlayer(data, sender, from);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      return sock.sendMessage(from, {
        text: `💰 رصيدك: ${(p.gold || 0).toLocaleString()} ذهب`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // صناديقي
    // ═════════════════════════════════════════════════════════════════════════
    if (['صناديقي', 'boxes'].includes(command)) {
      const p = getPlayer(data, sender, from);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const boxes = p.boxes || { common: 0, rare: 0, epic: 0, legendary: 0 };

      return sock.sendMessage(from, {
        text: `📦 صناديقك:

⚪ شائع: ${boxes.common || 0}
🔵 نادر: ${boxes.rare || 0}
🟣 ملحمي: ${boxes.epic || 0}
🟡 أسطوري: ${boxes.legendary || 0}

💡 ${prefix}فتح_صندوق <النوع>`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // فتح صندوق
    // ═════════════════════════════════════════════════════════════════════════
    if (['فتح_صندوق', 'openbox'].includes(command)) {
      const p = getPlayer(data, sender, from);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const boxType = args[0]?.toLowerCase();
      if (!boxType) {
        return sock.sendMessage(from, {
          text: `📦 أنواع الصناديق:
⚪ شائع
🔵 نادر
🟣 ملحمي
🟡 أسطوري

💡 ${prefix}فتح_صندوق <النوع>`
        });
      }

      const result = openBox(p, boxType);
      if (result.error) {
        return sock.sendMessage(from, { text: `❌ ${result.error}` });
      }

      saveDatabase();

      return sock.sendMessage(from, {
        text: `📦 فتحت صندوق ${result.box.emoji} ${result.box.name}!

🎁 المكافآت:
│ 💰 +${result.rewards.gold} ذهب
│ ⭐ +${result.rewards.xp} XP
${result.rewards.items.length > 0 ? `│ 🎒 ${result.rewards.items.join(', ')}` : ''}

${result.levelUp ? `🎉 مستوى جديد! ${result.levelUp.newLevel}` : ''}`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // مهاراتي
    // ═════════════════════════════════════════════════════════════════════════
    if (['مهاراتي', 'myskills'].includes(command)) {
      const p = getPlayer(data, sender, from);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const display = formatPlayerSkills(p);
      return sock.sendMessage(from, { text: display });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // شجرة المهارات
    // ═════════════════════════════════════════════════════════════════════════
    if (['شجرة', 'skilltree'].includes(command)) {
      const p = getPlayer(data, sender, from);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const display = formatSkillTree(p);
      return sock.sendMessage(from, { text: display });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // فتح مهارة
    // ═════════════════════════════════════════════════════════════════════════
    if (['مهارة', 'skill'].includes(command)) {
      const p = getPlayer(data, sender, from);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const skillName = args.join(' ');
      if (!skillName) {
        return sock.sendMessage(from, {
          text: `⚡ نقاط المهارة: ${p.skillPoints || 0}

💡 ${prefix}مهارة <اسم_المهارة>
💡 ${prefix}شجرة لعرض المهارات المتاحة`
        });
      }

      const result = unlockSkill(p, skillName);
      saveDatabase();

      return sock.sendMessage(from, { text: result.message });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // نقاط القدرة
    // ═════════════════════════════════════════════════════════════════════════
    if (['نقاط', 'points'].includes(command)) {
      const p = getPlayer(data, sender, from);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const stat = args[0]?.toLowerCase();
      const amount = parseInt(args[1]) || 1;

      if (!stat) {
        return sock.sendMessage(from, {
          text: `⚡ نقاط القدرة: ${p.abilityPoints || 0}

📊 التوزيع الحالي:
│ ❤️ HP: +${p.allocatedStats?.hp || 0}
│ ⚔️ ATK: +${p.allocatedStats?.atk || 0}
│ 🛡️ DEF: +${p.allocatedStats?.def || 0}
│ ✨ MAG: +${p.allocatedStats?.mag || 0}

💡 ${prefix}نقاط <hp|atk|def|mag> [العدد]`
        });
      }

      const result = allocateAbilityPoint(p, stat, amount);
      saveDatabase();

      return sock.sendMessage(from, { text: result.message });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // زعماء
    // ═════════════════════════════════════════════════════════════════════════
    if (['زعماء', 'bosses'].includes(command)) {
      const bosses = getAllBosses();
      
      return sock.sendMessage(from, {
        text: `👹 • • ✤ قائمة الزعماء ✤ • • 👹

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
${bosses.map(b => `${b.emoji} ${b.name} (${b.type})\n   ❤️ ${b.baseHp.toLocaleString()} | ⚔️ ${b.atk} | 🛡️ ${b.def}`).join('\n\n')}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

💡 استخدم .قتال_الزعيم عند ظهور زعيم`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // قتال الزعيم
    // ═════════════════════════════════════════════════════════════════════════
    if (['قتال_الزعيم', 'bossfight'].includes(command)) {
      const p = getPlayer(data, sender, from);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const result = registerForBoss(p);
      saveDatabase();

      return sock.sendMessage(from, { text: result.message });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // هجوم زعيم
    // ═════════════════════════════════════════════════════════════════════════
    if (['هجوم_زعيم', 'attackboss'].includes(command)) {
      const p = getPlayer(data, sender, from);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const result = attackBoss(p);
      saveDatabase();

      if (result.error) {
        return sock.sendMessage(from, { text: result.error });
      }

      if (result.defeated) {
        return sock.sendMessage(from, {
          text: `🎉 • • ✤ زعيم مهزوم! ✤ • • 🎉

🏆 MVP: ${result.results.mvp?.name || 'لا يوجد'}
👥 المشاركين: ${result.results.participants.length}

🎁 الجوائز موزعة!`
        });
      }

      const hpBar = healthBar(result.bossHp, result.bossMaxHp, 15);
      
      return sock.sendMessage(from, {
        text: `⚔️ هجوم على الزعيم!

💥 ضررك: ${result.damage}${result.critical ? ' 🔥 حرجة!' : ''}
💔 ضرر الزعيم: ${result.bossDamage}

❤️ HP الزعيم: ${result.bossHp.toLocaleString()}/${result.bossMaxHp.toLocaleString()}
[${hpBar}]

❤️ صحتك: ${result.playerHp}`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // حالة الزعيم
    // ═════════════════════════════════════════════════════════════════════════
    if (['حالة_زعيم', 'bossstatus'].includes(command)) {
      const bossStatus = getBossStatus();
      
      if (!bossStatus) {
        return sock.sendMessage(from, { text: '❌ لا يوجد زعيم نشط حالياً' });
      }

      const hpBar = healthBar(bossStatus.currentHp, bossStatus.baseHp, 15);
      
      return sock.sendMessage(from, {
        text: `👹 ${bossStatus.emoji} ${bossStatus.name}

❤️ HP: ${bossStatus.currentHp.toLocaleString()}/${bossStatus.baseHp.toLocaleString()}
[${hpBar}]

👥 المشاركين: ${bossStatus.participantsCount}
📊 الحالة: ${bossStatus.status === 'registration' ? '📝 تسجيل' : '⚔️ قتال'}`
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // هدية
    // ═════════════════════════════════════════════════════════════════════════
    if (['هدية', 'gift'].includes(command)) {
      const p = getPlayer(data, sender, from);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const targetId = quoted?.mentionedJid?.[0];
      const amount = parseInt(args[0]);

      if (!targetId) {
        return sock.sendMessage(from, { text: '❌ أشر لشخص!' });
      }

      if (!amount || amount <= 0) {
        return sock.sendMessage(from, { text: `❌ حدد المبلغ!\n💡 ${prefix}هدية 100 @شخص` });
      }

      if ((p.gold || 0) < amount) {
        return sock.sendMessage(from, { text: '❌ لا تملك ذهب كافٍ!' });
      }

      const target = getPlayer(data, targetId);
      if (!target) {
        return sock.sendMessage(from, { text: '❌ الشخص غير مسجل!' });
      }

      p.gold -= amount;
      target.gold = (target.gold || 0) + amount;

      saveDatabase();

      return sock.sendMessage(from, {
        text: `🎁 أرسلت ${amount} ذهب إلى ${target.name}!`,
        mentions: [targetId]
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // مخزون
    // ═════════════════════════════════════════════════════════════════════════
    if (['مخزون', 'inventory'].includes(command)) {
      const p = getPlayer(data, sender, from);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      p.weapons = p.weapons || [];
      p.armors = p.armors || [];
      p.inventory = p.inventory || [];

      let msg = `🎒 مخزون ${p.name}:\n\n`;

      if (p.weapons.length > 0) {
        msg += `⚔️ الأسلحة (${p.weapons.length}):\n`;
        msg += p.weapons.map((w, i) => `  ${i + 1}. ${w.fullName || w.name} ⚔️${w.atk}`).join('\n');
        msg += '\n\n';
      }

      if (p.armors.length > 0) {
        msg += `🛡️ الدروع (${p.armors.length}):\n`;
        msg += p.armors.map((a, i) => `  ${i + 1}. ${a.fullName || a.name} 🛡️${a.def}`).join('\n');
        msg += '\n\n';
      }

      if (p.inventory.length > 0) {
        msg += `📦 العناصر:\n`;
        msg += p.inventory.map(item => `  • ${item}`).join('\n');
      }

      if (p.weapons.length === 0 && p.armors.length === 0 && p.inventory.length === 0) {
        msg += '❌ المخزون فارغ!';
      }

      return sock.sendMessage(from, { text: msg });
    }
  }
};
