// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 أوامر RPG
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase, createNewPlayer, ensurePlayer } from '../lib/database.mjs';
import { RPG, levelUp, healthBar, fightMonster, pvpBattle, generateWeapon, generateArmor, upgradeWeapon, fish as doFish, mine as doMine, getUpgradeCost, getSellPrice, xpForLevel } from '../lib/rpg.mjs';
import { allocateAbilityPoint, unlockSkill, useActiveSkill, formatSkillTree, formatPlayerSkills, SKILL_TREES } from '../lib/skills.mjs';
import { updateQuestProgress } from '../lib/quests.mjs';

// دالة للحصول على لاعب مع التأكد من وجود جميع الحقول
function getPlayer(data, sender) {
  if (!data.players[sender]) return null;
  // التأكد من أن اللاعب لديه جميع الحقول المطلوبة
  data.players[sender] = ensurePlayer(data.players[sender], sender);
  return data.players[sender];
}

export default {
  name: 'RPG',
  commands: ['تسجيل', 'register', 'ملف', 'profile', 'قتال', 'fight', 'تحدي', 'challenge', 'علاج', 'heal', 'يومي', 'daily', 'عمل', 'work', 'صيد', 'fish', 'تعدين', 'mine', 'صندوق', 'box', 'تطوير', 'upgrade', 'بيع', 'sell', 'رتبة', 'rank', 'مخزون', 'inventory', 'نقاط', 'points', 'مهارة', 'skill', 'مهاراتي', 'myskills', 'شجرة', 'tree'],

  async execute(sock, msg, ctx) {
    const { from, sender, pushName, command, args, text, prefix, quoted } = ctx;
    let data = getRpgData();
    if (!data.players) data.players = {};

    // ═══════════════════════════════════════════════════════════════════════════
    // تسجيل
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تسجيل', 'register'].includes(command)) {
      if (data.players[sender]) {
        // التأكد من تحديث بيانات اللاعب القديم
        data.players[sender] = ensurePlayer(data.players[sender], sender);
        return sock.sendMessage(from, { text: '❌ مسجل! .ملف' });
      }

      const cls = args[0];
      if (!cls) {
        return sock.sendMessage(from, {
          text: `🎭 اختر صنف:\n${Object.entries(RPG.classes).map(([n, c]) => `${c.emoji} ${n}`).join('\n')}\n\n💡 ${prefix}تسجيل محارب`
        });
      }

      if (!RPG.classes[cls]) {
        return sock.sendMessage(from, { text: '❌ صنف غير موجود!' });
      }

      // استخدام createNewPlayer لإنشاء لاعب جديد مع كل الحقول
      const classData = RPG.classes[cls];
      data.players[sender] = createNewPlayer(sender, pushName, cls, classData);
      data.players[sender].inventory = ['جرعة صغيرة', 'جرعة صغيرة']; // هدية بداية

      saveDatabase();

      return sock.sendMessage(from, {
        text: `🎉 تم التسجيل!\n\n${classData.emoji} ${pushName} - ${cls}\n⚔️ هجوم: ${classData.atk}\n🛡️ دفاع: ${classData.def}\n❤️ صحة: ${classData.hp}\n✨ سحر: ${classData.mag}`
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // الملف
    // ═══════════════════════════════════════════════════════════════════════════
    if (['ملف', 'profile'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const xpN = xpForLevel(p.level);
      const classEmoji = RPG.classes[p.class]?.emoji || '🎮';

      return sock.sendMessage(from, {
        text: `╭═══════════════════════❖
║ ${classEmoji} ${p.name}
╠═══════════════════════❖
║ 🎖️ Lv.${p.level} | ⭐ ${p.xp}/${xpN}
║ ❤️ ${p.hp}/${p.maxHp} [${healthBar(p.hp, p.maxHp)}]
╠═══════════════════════❖
║ ⚔️ ${p.atk} | 🛡️ ${p.def} | ✨ ${p.mag}
║ 💰 ${p.gold?.toLocaleString() || 0} | 🏆 ${p.wins} | 💔 ${p.losses}
║ 🎒 ${(p.weapons || []).length} سلاح | 🛡️ ${(p.armors || []).length} درع
╰═══════════════════════❖`
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // قتال
    // ═══════════════════════════════════════════════════════════════════════════
    if (['قتال', 'fight'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      if (p.hp < p.maxHp * 0.2) {
        return sock.sendMessage(from, { text: '❌ صحة ضعيفة! .علاج' });
      }

      const r = fightMonster(p);

      // تحديث الإحصائيات
      if (!p.stats) p.stats = {};
      if (r.won) p.stats.monstersKilled = (p.stats.monstersKilled || 0) + 1;

      saveDatabase();

      return sock.sendMessage(from, {
        text: r.won
          ? `🎉 انتصرت على ${r.monster.emoji} ${r.monster.name}!\n💰 +${r.rewards.gold} | ⭐ +${r.rewards.xp}`
          : `😢 هُزمت بواسطة ${r.monster.emoji} ${r.monster.name}!`
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // علاج
    // ═══════════════════════════════════════════════════════════════════════════
    if (['علاج', 'heal'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      if (p.hp >= p.maxHp) {
        return sock.sendMessage(from, { text: '✅ صحتك كاملة!' });
      }

      const cost = Math.floor((p.maxHp - p.hp) * 0.5);
      if (p.gold < cost) {
        return sock.sendMessage(from, { text: `❌ تحتاج ${cost} ذهب!` });
      }

      p.gold -= cost;
      p.hp = p.maxHp;
      p.lastHeal = Date.now();

      saveDatabase();
      return sock.sendMessage(from, { text: `💚 تم علاجك! -${cost} ذهب` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // يومي
    // ═══════════════════════════════════════════════════════════════════════════
    if (['يومي', 'daily'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const now = Date.now();
      const lastDaily = p.lastDaily || 0;

      if (now - lastDaily < 86400000) {
        const remaining = Math.ceil((86400000 - (now - lastDaily)) / 3600000);
        return sock.sendMessage(from, { text: `⏰ ارجع بعد ${remaining} ساعة!` });
      }

      const bonus = 100 + p.level * 20;
      p.gold = (p.gold || 0) + bonus;
      p.lastDaily = now;

      saveDatabase();
      return sock.sendMessage(from, { text: `🎁 جائزة يومية: +${bonus} ذهب!` });
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
        const remaining = Math.ceil((3600000 - (now - lastWork)) / 60000);
        return sock.sendMessage(from, { text: `⏰ انتظر ${remaining} دقيقة!` });
      }

      const earn = 20 + Math.floor(Math.random() * 30) + p.level * 5;
      p.gold = (p.gold || 0) + earn;
      p.lastWork = now;

      saveDatabase();
      return sock.sendMessage(from, { text: `💼 عملت! +${earn} ذهب` });
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

      // تحديث الإحصائيات
      if (!p.stats) p.stats = {};
      p.stats.fishCaught = (p.stats.fishCaught || 0) + 1;

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

      // تحديث الإحصائيات
      if (!p.stats) p.stats = {};
      p.stats.mineralsMined = (p.stats.mineralsMined || 0) + 1;

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
          text: `📦 الصناديق:\n${Object.entries(RPG.boxes).map(([n, b]) => `${b.emoji} ${n}: ${b.price}💰`).join('\n')}\n\n💡 ${prefix}صندوق خشبي`
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

      // التأكد من وجود المصفوفات
      p.weapons = p.weapons || [];
      p.armors = p.armors || [];

      if (item.atk) {
        p.weapons.push(item);
      } else {
        p.armors.push(item);
      }

      // تحديث الإحصائيات
      if (!p.stats) p.stats = {};
      p.stats.boxesOpened = (p.stats.boxesOpened || 0) + 1;

      saveDatabase();
      return sock.sendMessage(from, {
        text: `📦 فتحت ${boxName}!\n\n🎁 ${item.fullName}\n📊 ${item.atk ? `⚔️ ${item.atk}` : `🛡️ ${item.def}`}`
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // تطوير
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تطوير', 'upgrade'].includes(command)) {
      const p = getPlayer(data, sender);
      if (!p) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const idx = parseInt(args[0]) - 1;
      p.weapons = p.weapons || [];

      const w = p.weapons[idx];
      if (!w) {
        return sock.sendMessage(from, { text: '❌ سلاح غير موجود!' });
      }

      const cost = getUpgradeCost(w);
      if ((p.gold || 0) < cost) {
        return sock.sendMessage(from, { text: `❌ تحتاج ${cost} ذهب!` });
      }

      p.gold -= cost;
      const r = upgradeWeapon(w);

      if (r.success) {
        // تحديث الإحصائيات
        if (!p.stats) p.stats = {};
        p.stats.weaponsUpgraded = (p.stats.weaponsUpgraded || 0) + 1;

        saveDatabase();
        return sock.sendMessage(from, { text: `✅ تم تطوير ${w.fullName}!\n⚔️ ${w.atk}` });
      } else {
        // حذف السلاح المنكسر
        p.weapons.splice(idx, 1);
        saveDatabase();
        return sock.sendMessage(from, { text: `💔 فشل! انكسر السلاح!` });
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
        return sock.sendMessage(from, { text: '❌ لا تملك شيء!' });
      }

      if (!args[0]) {
        return sock.sendMessage(from, {
          text: `💰 للبيع:\n${all.map((w, i) => `${i + 1}. ${w.fullName} - ${getSellPrice(w)}💰`).join('\n')}`
        });
      }

      const idx = parseInt(args[0]) - 1;
      const item = all[idx];

      if (!item) {
        return sock.sendMessage(from, { text: '❌ غير موجود!' });
      }

      const price = getSellPrice(item);
      p.gold = (p.gold || 0) + price;

      if (item.atk) {
        p.weapons = p.weapons.filter(w => w.id !== item.id);
      } else {
        p.armors = p.armors.filter(a => a.id !== item.id);
      }

      // تحديث الإحصائيات
      if (!p.stats) p.stats = {};
      p.stats.itemsSold = (p.stats.itemsSold || 0) + 1;

      saveDatabase();
      return sock.sendMessage(from, { text: `✅ بيعت ${item.fullName}!\n💰 +${price}` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // رتبة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['رتبة', 'rank'].includes(command)) {
      const players = Object.values(data.players)
        .filter(p => p && p.level)
        .sort((a, b) => ((b.level || 1) * 1000 + (b.xp || 0)) - ((a.level || 1) * 1000 + (a.xp || 0)))
        .slice(0, 10);

      if (players.length === 0) {
        return sock.sendMessage(from, { text: '❌ لا يوجد لاعبين!' });
      }

      return sock.sendMessage(from, {
        text: `🏆 الأوائل:\n\n${players.map((p, i) => `${i + 1}. ${RPG.classes[p.class]?.emoji || '🎮'} ${p.name} - Lv.${p.level}`).join('\n')}`
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
        return sock.sendMessage(from, { text: '❌ أشر لشخص!' });
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

      saveDatabase();
      return sock.sendMessage(from, { text: `⚔️ تحدي!\n\n🏆 الفائز: ${r.winner.name}\n💰 +${r.goldReward}` });
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

      let msg = `🎒 مخزون ${p.name}:\n\n`;

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
        msg += '❌ المخزون فارغ!\n💡 اشترِ صندوق أولاً';
      }

      return sock.sendMessage(from, { text: msg });
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
          text: `⚡ نقاط القدرة: ${p.abilityPoints || 0}

📊 إحصائياتك الموزعة:
❤️ HP: +${p.allocatedStats?.hp || 0} (${(p.allocatedStats?.hp || 0) * 10} HP)
⚔️ ATK: +${p.allocatedStats?.atk || 0} (${(p.allocatedStats?.atk || 0) * 2} ATK)
🛡️ DEF: +${p.allocatedStats?.def || 0} (${(p.allocatedStats?.def || 0) * 2} DEF)
✨ MAG: +${p.allocatedStats?.mag || 0} (${(p.allocatedStats?.mag || 0) * 3} MAG)

💡 ${prefix}نقاط <hp|atk|def|mag> [العدد]`
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
  }
};
