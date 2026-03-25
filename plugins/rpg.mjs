// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 أوامر RPG - فاطمة بوت v12.0
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase, createNewPlayer, ensurePlayer } from '../lib/database.mjs';
import { RPG, levelUp, healthBar, fightMonster, pvpBattle, generateWeapon, generateArmor, upgradeWeapon, fish as doFish, mine as doMine, getUpgradeCost, getSellPrice, xpForLevel } from '../lib/rpg.mjs';
import { allocateAbilityPoint, unlockSkill, useActiveSkill, formatSkillTree, formatPlayerSkills, SKILL_TREES } from '../lib/skills.mjs';
import { updateQuestProgress } from '../lib/quests.mjs';
import { getActiveBoss } from '../lib/boss.mjs';

// دالة للحصول على لاعب مع التأكد من وجود جميع الحقول
function getPlayer(data, sender) {
  if (!data.players[sender]) return null;
  // التأكد من أن اللاعب لديه جميع الحقول المطلوبة
  data.players[sender] = ensurePlayer(data.players[sender], sender);
  return data.players[sender];
}

// دالة لتنسيق الوقت المتبقي
function formatTime(ms) {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const secs = Math.floor((ms % (60 * 1000)) / 1000);
  if (hours > 0) return `${hours}س ${mins}د`;
  if (mins > 0) return `${mins}د ${secs}ث`;
  return `${secs}ث`;
}

export default {
  name: 'RPG',
  commands: [
    'تسجيل', 'register',
    'ملف', 'profile', 'شخصية',
    'قتال', 'fight',
    'تحدي', 'challenge',
    'علاج', 'heal', 'علاج_جماعي', 'heal_all',
    'يومي', 'daily',
    'عمل', 'work',
    'صيد', 'fish',
    'تعدين', 'mine',
    'صندوق', 'box',
    'تطوير', 'upgrade',
    'بيع', 'sell',
    'رتبة', 'rank', 'لیدر',
    'مخزون', 'inventory',
    'نقاط', 'points',
    'مهارة', 'skill',
    'مهاراتي', 'myskills',
    'شجرة', 'tree',
    'تجهيز', 'equip',
    'نزع', 'unequip',
    'متجر', 'shop',
    'شراء', 'buy',
    'رصيد', 'balance',
    'هدية', 'gift',
    'سرقة', 'rob',
    'حظ', 'luck'
  ],

  async execute(sock, msg, ctx) {
    const { from, sender, pushName, command, args, text, prefix, quoted } = ctx;
    let data = getRpgData();
    if (!data.players) data.players = {};

    // ═══════════════════════════════════════════════════════════════════════════
    // تسجيل
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تسجيل', 'register'].includes(command)) {
      if (data.players[sender]) {
        data.players[sender] = ensurePlayer(data.players[sender], sender);
        return sock.sendMessage(from, { text: '❌ مسجل! استخدم .ملف لمشاهدة ملفك' });
      }

      const cls = args[0];
      if (!cls) {
        return sock.sendMessage(from, {
          text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

🎭 • • ✤ اختر صنفك ✤ • • 🎭

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
${Object.entries(RPG.classes).map(([n, c]) => `${c.emoji} ${n} - ⚔️${c.atk} 🛡️${c.def} ❤️${c.hp}`).join('\n')}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

💡 ${prefix}تسجيل <اسم_الصنف>
مثال: ${prefix}تسجيل محارب

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`
        });
      }

      if (!RPG.classes[cls]) {
        return sock.sendMessage(from, { text: '❌ صنف غير موجود! اختر من القائمة أعلاه' });
      }

      const classData = RPG.classes[cls];
      data.players[sender] = createNewPlayer(sender, pushName, cls, classData);
      data.players[sender].inventory = ['جرعة صغيرة', 'جرعة صغيرة', 'خريطة كنز'];
      data.players[sender].gold = 100; // هدية بداية

      saveDatabase();

      return sock.sendMessage(from, {
        text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

🎉 • • ✤ تم التسجيل! ✤ • • 🎉

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ ${classData.emoji} ${pushName}
│ 🎭 الصنف: ${cls}
│ ⚔️ الهجوم: ${classData.atk}
│ 🛡️ الدفاع: ${classData.def}
│ ❤️ الصحة: ${classData.hp}
│ ✨ السحر: ${classData.mag}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

🎁 هدية البداية:
│ 💰 100 ذهب
│ 🧪 2 جرعة صغيرة
│ 🗺️ خريطة كنز
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // الملف الشخصي
    // ═══════════════════════════════════════════════════════════════════════════
    if (['ملف', 'profile', 'شخصية'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً! استخدم .تسجيل <صنف>' });

      const xpN = xpForLevel(p.level);
      const classEmoji = RPG.classes[p.class]?.emoji || '🎮';
      const xpProgress = Math.floor((p.xp / xpN) * 10);
      const xpBar = '▓'.repeat(xpProgress) + '░'.repeat(10 - xpProgress);

      // حساب الطاقة
      const staminaMax = 100 + (p.level * 5);
      const staminaRegen = Math.min(staminaMax, p.stamina + Math.floor((Date.now() - (p.lastStaminaUpdate || Date.now())) / 60000));

      return sock.sendMessage(from, {
        text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

${classEmoji} • • ✤ ${p.name} ✤ • • ${classEmoji}

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ 🎖️ المستوى: ${p.level}
│ ⭐ XP: ${p.xp}/${xpN}
│ 📊 [${xpBar}]
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

❤️ الصحة: ${p.hp}/${p.maxHp}
│ [${healthBar(p.hp, p.maxHp)}]

⚡ الطاقة: ${staminaRegen}/${staminaMax}
│ [${healthBar(staminaRegen, staminaMax)}]

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

📊 الإحصائيات:
│ ⚔️ هجوم: ${p.atk}
│ 🛡️ دفاع: ${p.def}
│ ✨ سحر: ${p.mag}

💰 الذهب: ${(p.gold || 0).toLocaleString()}
🏆 الانتصارات: ${p.wins || 0}
💔 الخسائر: ${p.losses || 0}

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

🎒 المخزون:
│ ⚔️ ${(p.weapons || []).length} سلاح
│ 🛡️ ${(p.armors || []).length} درع
│ 📦 ${(p.inventory || []).length} عنصر

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // قتال الوحوش
    // ═══════════════════════════════════════════════════════════════════════════
    if (['قتال', 'fight'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      if (p.hp < p.maxHp * 0.2) {
        return sock.sendMessage(from, { text: '❌ صحة ضعيفة! استخدم .علاج أولاً' });
      }

      // التحقق من الطاقة
      const staminaCost = 10;
      if ((p.stamina || 100) < staminaCost) {
        return sock.sendMessage(from, { text: '❌ طاقة غير كافية! انتظر قليلاً' });
      }

      p.stamina = (p.stamina || 100) - staminaCost;
      p.lastStaminaUpdate = Date.now();

      const r = fightMonster(p);

      // تحديث الإحصائيات
      if (!p.stats) p.stats = {};
      if (r.won) {
        p.stats.monstersKilled = (p.stats.monstersKilled || 0) + 1;
        updateQuestProgress(p, 'kill_monsters', 1);
      }

      saveDatabase();

      if (r.won) {
        return sock.sendMessage(from, {
          text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

⚔️ • • ✤ انتصار! ✤ • • ⚔️

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ ${r.monster.emoji} ${r.monster.name}
│ ❌ هُزم!
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

🎁 المكافآت:
│ 💰 +${r.rewards.gold} ذهب
│ ⭐ +${r.rewards.xp} XP

⚡ طاقتك: ${p.stamina}/100

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`
        });
      } else {
        return sock.sendMessage(from, {
          text: `💀 هُزمت بواسطة ${r.monster.emoji} ${r.monster.name}!

💔 استخدم .علاج لاستعادة صحتك`
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // علاج
    // ═══════════════════════════════════════════════════════════════════════════
    if (['علاج', 'heal'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      if (p.hp >= p.maxHp) {
        return sock.sendMessage(from, { text: '✅ صحتك كاملة بالفعل!' });
      }

      const cost = Math.floor((p.maxHp - p.hp) * 0.5);
      if (p.gold < cost) {
        return sock.sendMessage(from, { text: `❌ تحتاج ${cost} ذهب للعلاج!` });
      }

      p.gold -= cost;
      p.hp = p.maxHp;
      p.lastHeal = Date.now();

      // تحديث إحصائيات الشافي
      if (p.class === 'شافي' && p.stats) {
        p.stats.playersHealed = (p.stats.playersHealed || 0) + 1;
      }

      saveDatabase();
      return sock.sendMessage(from, { text: `💚 تم علاجك بالكامل!\n💰 -${cost} ذهب` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // علاج جماعي (للشافيين في حروب الزعماء والكلانات)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['علاج_جماعي', 'heal_all'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      // يجب أن يكون اللاعب شافي
      if (p.class !== 'شافي') {
        return sock.sendMessage(from, { text: '❌ فقط الشافيين يمكنهم استخدام العلاج الجماعي!' });
      }

      // التحقق من وجود زعيم نشط أو حرب كلان
      const boss = getActiveBoss(from);
      const inWar = boss && boss.status === 'active';
      
      if (!inWar) {
        return sock.sendMessage(from, { text: '❌ العلاج الجماعي متاح فقط أثناء معارك الزعماء أو حروب الكلانات!' });
      }

      // التحقق من وقت التهدئة (5 دقائق)
      const now = Date.now();
      const lastHealAll = p.lastHealAll || 0;
      const cooldown = 5 * 60 * 1000; // 5 دقائق

      if (now - lastHealAll < cooldown) {
        const remaining = Math.ceil((cooldown - (now - lastHealAll)) / 60000);
        return sock.sendMessage(from, { text: `⏰ انتظر ${remaining} دقيقة قبل استخدام العلاج الجماعي مرة أخرى!` });
      }

      // التحقق من الطاقة
      const staminaCost = 2;
      const staminaMax = 100 + (p.level * 5);
      const currentStamina = Math.min(staminaMax, p.stamina + Math.floor((Date.now() - (p.lastStaminaUpdate || Date.now())) / 60000));

      if (currentStamina < staminaCost) {
        return sock.sendMessage(from, { text: '❌ طاقة غير كافية! تحتاج نقطتي طاقة.' });
      }

      // تطبيق العلاج الجماعي
      p.stamina = currentStamina - staminaCost;
      p.lastHealAll = now;
      p.lastStaminaUpdate = now;

      // علاج جميع المشاركين في المعركة
      let healedCount = 0;
      const totalHealing = p.mag * 5; // قوة العلاج تعتمد على السحر

      for (const participantId of boss.registeredPlayers || []) {
        const participant = data.players[participantId];
        if (participant && participant.hp < participant.maxHp) {
          const healAmount = Math.min(totalHealing, participant.maxHp - participant.hp);
          participant.hp += healAmount;
          healedCount++;
        }
      }

      // مكافأة للشافى
      const rewardXp = healedCount * 50;
      const rewardGold = healedCount * 25;
      p.xp = (p.xp || 0) + rewardXp;
      p.gold = (p.gold || 0) + rewardGold;

      // تحديث الإحصائيات
      if (!p.stats) p.stats = {};
      p.stats.groupHeals = (p.stats.groupHeals || 0) + 1;
      p.stats.totalHealing = (p.stats.totalHealing || 0) + (totalHealing * healedCount);

      saveDatabase();

      return sock.sendMessage(from, { 
        text: `💚 ═══════ علاج جماعي ═══════ 💚\n\n✨ ${p.name} يستخدم العلاج الجماعي!\n\n👥 عدد المعالجين: ${healedCount}\n💪 قوة العلاج: ${totalHealing}\n\n🎁 المكافآت:\n⭐ +${rewardXp} XP\n💰 +${rewardGold} ذهب\n\n⏰ التهدئة: 5 دقائق` 
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // الجائزة اليومية
    // ═══════════════════════════════════════════════════════════════════════════
    if (['يومي', 'daily'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const now = Date.now();
      const lastDaily = p.lastDaily || 0;

      if (now - lastDaily < 86400000) {
        const remaining = formatTime(86400000 - (now - lastDaily));
        return sock.sendMessage(from, { text: `⏰ ارجع بعد ${remaining}!` });
      }

      // مكافأة متزايدة حسب streak
      const streak = (p.dailyStreak || 0) + 1;
      const baseBonus = 100 + p.level * 20;
      const streakBonus = Math.min(streak * 10, 100); // حد أقصى 100%
      const totalBonus = Math.floor(baseBonus * (1 + streakBonus / 100));

      p.gold = (p.gold || 0) + totalBonus;
      p.lastDaily = now;
      p.dailyStreak = streak;

      saveDatabase();
      return sock.sendMessage(from, {
        text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

🎁 • • ✤ الجائزة اليومية ✤ • • 🎁

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ 💰 +${totalBonus} ذهب
│ 🔥 Streak: ${streak} يوم
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // عمل
    // ═══════════════════════════════════════════════════════════════════════════
    if (['عمل', 'work'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const now = Date.now();
      const lastWork = p.lastWork || 0;

      if (now - lastWork < 3600000) {
        const remaining = formatTime(3600000 - (now - lastWork));
        return sock.sendMessage(from, { text: `⏰ انتظر ${remaining}!` });
      }

      const jobs = [
        { name: 'محاسب', earn: 30, emoji: '📊' },
        { name: 'تاجر', earn: 40, emoji: '🛒' },
        { name: 'حداد', earn: 35, emoji: '⚒️' },
        { name: 'مزارع', earn: 25, emoji: '🌾' },
        { name: 'صياد', earn: 45, emoji: '🎣' },
        { name: 'حراس', earn: 50, emoji: '🛡️' }
      ];

      const job = jobs[Math.floor(Math.random() * jobs.length)];
      const earn = job.earn + Math.floor(Math.random() * 20) + p.level * 5;
      p.gold = (p.gold || 0) + earn;
      p.lastWork = now;

      saveDatabase();
      return sock.sendMessage(from, { text: `${job.emoji} عملت كـ ${job.name}!\n💰 +${earn} ذهب` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // صيد
    // ═══════════════════════════════════════════════════════════════════════════
    if (['صيد', 'fish'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const now = Date.now();
      const lastFish = p.lastFish || 0;

      if (now - lastFish < 30000) {
        return sock.sendMessage(from, { text: `⏰ انتظر 30 ثانية!` });
      }

      p.lastFish = now;
      const f = doFish();
      p.gold = (p.gold || 0) + f.price;

      if (!p.stats) p.stats = {};
      p.stats.fishCaught = (p.stats.fishCaught || 0) + 1;
      updateQuestProgress(p, 'fishing', 1);

      saveDatabase();
      return sock.sendMessage(from, { text: `🎣 صيد:\n${f.emoji} ${f.name}\n💰 ${f.price} ذهب` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // تعدين
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تعدين', 'mine'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const now = Date.now();
      const lastMine = p.lastMine || 0;

      if (now - lastMine < 60000) {
        return sock.sendMessage(from, { text: `⏰ انتظر دقيقة!` });
      }

      p.lastMine = now;
      const m = doMine();
      p.gold = (p.gold || 0) + m.price;

      if (!p.stats) p.stats = {};
      p.stats.mineralsMined = (p.stats.mineralsMined || 0) + 1;
      updateQuestProgress(p, 'mining', 1);

      saveDatabase();
      return sock.sendMessage(from, { text: `⛏️ تعدين:\n${m.emoji} ${m.name}\n💰 ${m.price} ذهب` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // صندوق
    // ═══════════════════════════════════════════════════════════════════════════
    if (['صندوق', 'box'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const boxName = args.join(' ');

      if (!boxName) {
        return sock.sendMessage(from, {
          text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

📦 • • ✤ الصناديق ✤ • • 📦

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
${Object.entries(RPG.boxes).map(([n, b]) => `${b.emoji} ${n}: ${b.price}💰`).join('\n')}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

💡 ${prefix}صندوق <اسم_الصندوق>
مثال: ${prefix}صندوق خشبي

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`
        });
      }

      const box = RPG.boxes[boxName];
      if (!box) {
        return sock.sendMessage(from, { text: '❌ صندوق غير موجود!' });
      }

      if ((p.gold || 0) < box.price) {
        return sock.sendMessage(from, { text: `❌ تحتاج ${box.price} ذهب!` });
      }

      p.gold -= box.price;
      const item = Math.random() < 0.5 ? generateWeapon(box) : generateArmor(box);

      p.weapons = p.weapons || [];
      p.armors = p.armors || [];

      if (item.atk) {
        p.weapons.push(item);
      } else {
        p.armors.push(item);
      }

      if (!p.stats) p.stats = {};
      p.stats.boxesOpened = (p.stats.boxesOpened || 0) + 1;
      updateQuestProgress(p, 'open_boxes', 1);

      saveDatabase();
      return sock.sendMessage(from, {
        text: `📦 فتحت ${boxName}!

🎁 ${item.fullName}
📊 ${item.atk ? `⚔️ ${item.atk}` : `🛡️ ${item.def}`}`
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // تطوير السلاح
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تطوير', 'upgrade'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const idx = parseInt(args[0]) - 1;
      p.weapons = p.weapons || [];

      const w = p.weapons[idx];
      if (!w) {
        return sock.sendMessage(from, { text: '❌ سلاح غير موجود! استخدم .مخزون' });
      }

      const cost = getUpgradeCost(w);
      if ((p.gold || 0) < cost) {
        return sock.sendMessage(from, { text: `❌ تحتاج ${cost} ذهب!` });
      }

      p.gold -= cost;
      const r = upgradeWeapon(w);

      if (r.success) {
        if (!p.stats) p.stats = {};
        p.stats.weaponsUpgraded = (p.stats.weaponsUpgraded || 0) + 1;

        saveDatabase();
        return sock.sendMessage(from, { text: `✅ تم تطوير ${w.fullName}!\n⚔️ ${w.atk}` });
      } else {
        p.weapons.splice(idx, 1);
        saveDatabase();
        return sock.sendMessage(from, { text: `💔 فشل التطوير! انكسر السلاح!` });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // بيع
    // ═══════════════════════════════════════════════════════════════════════════
    if (['بيع', 'sell'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      p.weapons = p.weapons || [];
      p.armors = p.armors || [];

      const all = [...p.weapons, ...p.armors];

      if (all.length === 0) {
        return sock.sendMessage(from, { text: '❌ لا تملك شيء للبيع!' });
      }

      if (!args[0]) {
        return sock.sendMessage(from, {
          text: `💰 للبيع:\n${all.map((w, i) => `${i + 1}. ${w.fullName} - ${getSellPrice(w)}💰`).join('\n')}\n\n💡 ${prefix}بيع <الرقم>`
        });
      }

      const idx = parseInt(args[0]) - 1;
      const item = all[idx];

      if (!item) {
        return sock.sendMessage(from, { text: '❌ عنصر غير موجود!' });
      }

      const price = getSellPrice(item);
      p.gold = (p.gold || 0) + price;

      if (item.atk) {
        p.weapons = p.weapons.filter(w => w.id !== item.id);
      } else {
        p.armors = p.armors.filter(a => a.id !== item.id);
      }

      if (!p.stats) p.stats = {};
      p.stats.itemsSold = (p.stats.itemsSold || 0) + 1;

      saveDatabase();
      return sock.sendMessage(from, { text: `✅ بيعت ${item.fullName}!\n💰 +${price}` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // رتبة / المتصدرين
    // ═══════════════════════════════════════════════════════════════════════════
    if (['رتبة', 'rank', 'لیدر'].includes(command)) {
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
${players.map((p, i) => `${medals[i]} ${RPG.classes[p.class]?.emoji || '🎮'} ${p.name}\n   Lv.${p.level} | 💰 ${(p.gold || 0).toLocaleString()}`).join('\n\n')}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // تحدي PvP
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تحدي', 'challenge'].includes(command)) {
      const p1 = getPlayer(data, sender);
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

      const r = pvpBattle(p1, p2);
      p1.lastPvP = Date.now();

      if (r.winner.id === sender) {
        updateQuestProgress(p1, 'win_pvp', 1);
      }

      saveDatabase();
      return sock.sendMessage(from, {
        text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

⚔️ • • ✤ تحدي PvP ✤ • • ⚔️

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ ${RPG.classes[p1.class]?.emoji || '🎮'} ${p1.name}
│ VS
│ ${RPG.classes[p2.class]?.emoji || '🎮'} ${p2.name}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

🏆 الفائز: ${r.winner.name}
💰 +${r.goldReward} ذهب

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // مخزون
    // ═══════════════════════════════════════════════════════════════════════════
    if (['مخزون', 'inventory'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      p.weapons = p.weapons || [];
      p.armors = p.armors || [];
      p.inventory = p.inventory || [];

      let msg = `@
━─━••❁⊰｢❀｣⊱❁••━─━

🎒 • • ✤ مخزون ${p.name} ✤ • • 🎒

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;

      if (p.weapons.length > 0) {
        msg += `⚔️ الأسلحة (${p.weapons.length}):\n`;
        msg += p.weapons.map((w, i) => `  ${i + 1}. ${w.fullName} ⚔️${w.atk}`).join('\n');
        msg += '\n\n';
      }

      if (p.armors.length > 0) {
        msg += `🛡️ الدروع (${p.armors.length}):\n`;
        msg += p.armors.map((a, i) => `  ${i + 1}. ${a.fullName} 🛡️${a.def}`).join('\n');
        msg += '\n\n';
      }

      if (p.inventory.length > 0) {
        msg += `📦 العناصر:\n`;
        msg += p.inventory.map(item => `  • ${item}`).join('\n');
        msg += '\n\n';
      }

      if (p.weapons.length === 0 && p.armors.length === 0 && p.inventory.length === 0) {
        msg += '❌ المخزون فارغ!\n💡 اشترِ صندوق أولاً\n\n';
      }

      msg += `> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`;

      return sock.sendMessage(from, { text: msg });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // تجهيز سلاح/درع
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تجهيز', 'equip'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      p.weapons = p.weapons || [];
      p.armors = p.armors || [];

      if (!args[0]) {
        return sock.sendMessage(from, {
          text: `💡 ${prefix}تجهيز <رقم>

⚔️ الأسلحة:
${p.weapons.map((w, i) => `  ${i + 1}. ${w.fullName}`).join('\n') || '  لا يوجد'}

🛡️ الدروع:
${p.armors.map((a, i) => `  ${i + 1}. ${a.fullName}`).join('\n') || '  لا يوجد'}`
        });
      }

      const idx = parseInt(args[0]) - 1;
      const all = [...p.weapons, ...p.armors];
      const item = all[idx];

      if (!item) {
        return sock.sendMessage(from, { text: '❌ عنصر غير موجود!' });
      }

      // تحديد النوع
      const isWeapon = p.weapons.includes(item);
      if (isWeapon) {
        p.equippedWeapon = item;
      } else {
        p.equippedArmor = item;
      }

      saveDatabase();
      return sock.sendMessage(from, { text: `✅ تم تجهيز ${item.fullName}!` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // نقاط القدرة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['نقاط', 'points'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const stat = args[0]?.toLowerCase();
      const amount = parseInt(args[1]) || 1;

      if (!stat) {
        return sock.sendMessage(from, {
          text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

⚡ • • ✤ نقاط القدرة ✤ • • ⚡

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ النقاط المتاحة: ${p.abilityPoints || 0}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

📊 إحصائياتك الموزعة:
❤️ HP: +${p.allocatedStats?.hp || 0} (${(p.allocatedStats?.hp || 0) * 10} HP)
⚔️ ATK: +${p.allocatedStats?.atk || 0} (${(p.allocatedStats?.atk || 0) * 2} ATK)
🛡️ DEF: +${p.allocatedStats?.def || 0} (${(p.allocatedStats?.def || 0) * 2} DEF)
✨ MAG: +${p.allocatedStats?.mag || 0} (${(p.allocatedStats?.mag || 0) * 3} MAG)

💡 ${prefix}نقاط <hp|atk|def|mag> [العدد]

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`
        });
      }

      const result = allocateAbilityPoint(p, stat, amount);
      saveDatabase();

      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // شجرة المهارات
    // ═══════════════════════════════════════════════════════════════════════════
    if (['شجرة', 'tree'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const display = formatSkillTree(p);
      return sock.sendMessage(from, { text: display });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // مهاراتي
    // ═══════════════════════════════════════════════════════════════════════════
    if (['مهاراتي', 'myskills'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const display = formatPlayerSkills(p);
      return sock.sendMessage(from, { text: display });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // فتح/استخدام مهارة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['مهارة', 'skill'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const skillName = args.join(' ');

      if (!skillName) {
        return sock.sendMessage(from, {
          text: `⚡ نقاط المهارة: ${p.skillPoints || 0}

💡 ${prefix}مهارة <اسم_المهارة> - لفتح مهارة جديدة
💡 ${prefix}شجرة - لعرض شجرة المهارات المتاحة`
        });
      }

      // البحث عن المهارة
      let skillId = null;
      const classTree = SKILL_TREES[p.class];
      if (classTree) {
        for (const type of ['passive', 'active']) {
          const found = classTree[type]?.find(s =>
            s.name === skillName || s.id === skillName ||
            s.name.includes(skillName)
          );
          if (found) {
            skillId = found.id;
            break;
          }
        }
      }

      if (!skillId) {
        return sock.sendMessage(from, { text: '❌ مهارة غير موجودة!' });
      }

      const result = unlockSkill(p, skillId);
      saveDatabase();

      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // رصيد
    // ═══════════════════════════════════════════════════════════════════════════
    if (['رصيد', 'balance'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      return sock.sendMessage(from, {
        text: `💰 رصيدك: ${(p.gold || 0).toLocaleString()} ذهب`
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // هدية
    // ═══════════════════════════════════════════════════════════════════════════
    if (['هدية', 'gift'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const targetId = quoted?.mentionedJid?.[0];
      const amount = parseInt(args[0]);

      if (!targetId) {
        return sock.sendMessage(from, { text: '❌ أشر لشخص!' });
      }

      if (!amount || amount <= 0) {
        return sock.sendMessage(from, { text: '❌ حدد المبلغ!\n💡 .هدية 100 @شخص' });
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

    // ═══════════════════════════════════════════════════════════════════════════
    // سرقة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['سرقة', 'rob'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const now = Date.now();
      const lastRob = p.lastRob || 0;

      if (now - lastRob < 3600000) {
        const remaining = formatTime(3600000 - (now - lastRob));
        return sock.sendMessage(from, { text: `⏰ انتظر ${remaining}!` });
      }

      const targetId = quoted?.mentionedJid?.[0];
      if (!targetId) {
        return sock.sendMessage(from, { text: '❌ أشر لشخص!' });
      }

      const target = getPlayer(data, targetId);
      if (!target) {
        return sock.sendMessage(from, { text: '❌ الشخص غير مسجل!' });
      }

      if ((target.gold || 0) < 100) {
        return sock.sendMessage(from, { text: '❌ هذا الشخص فقير جداً!' });
      }

      p.lastRob = now;

      // فرص النجاح 40%
      const success = Math.random() < 0.4;

      if (success) {
        const stolen = Math.floor((target.gold || 0) * (0.1 + Math.random() * 0.2));
        p.gold = (p.gold || 0) + stolen;
        target.gold -= stolen;

        saveDatabase();
        return sock.sendMessage(from, {
          text: `🗡️ سرقة ناجحة!\n💰 سرقت ${stolen} ذهب من ${target.name}`,
          mentions: [targetId]
        });
      } else {
        const fine = Math.floor((p.gold || 0) * 0.1);
        p.gold = Math.max(0, (p.gold || 0) - fine);

        saveDatabase();
        return sock.sendMessage(from, {
          text: `🚨 فشلت السرقة!\n💰 دفعت ${fine} ذهب غرامة`,
          mentions: [targetId]
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // حظ
    // ═══════════════════════════════════════════════════════════════════════════
    if (['حظ', 'luck'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const now = Date.now();
      const lastLuck = p.lastLuck || 0;

      if (now - lastLuck < 7200000) {
        const remaining = formatTime(7200000 - (now - lastLuck));
        return sock.sendMessage(from, { text: `⏰ انتظر ${remaining}!` });
      }

      p.lastLuck = now;

      const outcomes = [
        { text: ' jackpot! 🎰', gold: 500, emoji: '🎰' },
        { text: 'وجدت كنز! 🗺️', gold: 200, emoji: '🗺️' },
        { text: 'حظ جيد! 🍀', gold: 100, emoji: '🍀' },
        { text: 'لا شيء... 😅', gold: 0, emoji: '😅' },
        { text: 'خسرت! 💸', gold: -50, emoji: '💸' }
      ];

      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      p.gold = Math.max(0, (p.gold || 0) + outcome.gold);

      saveDatabase();
      return sock.sendMessage(from, {
        text: `${outcome.emoji} ${outcome.text}\n💰 ${outcome.gold > 0 ? '+' : ''}${outcome.gold} ذهب`
      });
    }
  }
};
