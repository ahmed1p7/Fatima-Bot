// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ أوامر الأقاليم الموحدة - فاطمة بوت v12.0
// يعتمد على lib/territory2.mjs (نظام الأقاليم + الصور)
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from '../lib/database.mjs';
import {
  exploreTerritory,
  fightGuardian,
  stealthRaid,
  deployGarrison,
  invadeTerritory,
  withdrawGarrison,
  formatTerritoryInfo,
  formatGarrisonInfo,
  getClanTerritories,
  collectTerritoryProduction,
  sendTerritoryImage
} from '../lib/territory2.mjs';

export default {
  name: 'Territory',
  commands: [
    'استكشاف', 'explore',
    'اقاليم', 'territories', 'الأقاليم',
    'قتال_حارس', 'fightguardian',
    'تسلل', 'stealth',
    'حماية', 'deploy',
    'حامية', 'garrison',
    'غزو', 'invade',
    'سحب_جنود', 'withdraw',
    'اقليمي', 'myterritory',
    'جمع_اقاليم', 'collect'
  ],

  async execute(sock, msg, ctx) {
    const { from, sender, pushName, command, args, text, prefix, quoted, isGroup, isGroupAdmin } = ctx;
    const data = getRpgData();
    const player = data.players?.[sender];

    // التحقق من وجود اللاعب
    if (!player) {
      return sock.sendMessage(from, { text: '❌ سجل أولاً! استخدم .تسجيل <صنف>' });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // دوال مساعدة داخلية
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * البحث عن إقليم بالمعرف أو الاسم
     * @param {string} input - معرف الإقليم أو اسمه
     * @returns {object|null} كائن الإقليم أو null
     */
    const getTerritoryByIdOrName = (input) => {
      if (!input) return null;
      // البحث بالمعرف أولاً
      if (data.territories?.[input]) return data.territories[input];
      // البحث بالاسم (غير حساس لحالة الأحرف)
      const territories = Object.values(data.territories || {});
      return territories.find(t => t.name === input);
    };

    /**
     * عرض قائمة الأقاليم مع إمكانية التصفية
     * @param {string|null} filter - 'free' للأقاليم غير المحتلة، 'owned' للأقاليم المحتلة
     */
    const showTerritoriesList = async (filter = null) => {
      const territories = Object.values(data.territories || {});
      if (territories.length === 0) {
        return sock.sendMessage(from, { text: '❌ لا توجد أقاليم مكتشفة! استخدم .استكشاف' });
      }
      let list = '🗺️ قائمة الأقاليم:\n\n';
      for (const t of territories) {
        if (filter === 'free' && t.ownerClan) continue;
        if (filter === 'owned' && !t.ownerClan) continue;
        list += `${t.emoji} ${t.name}\n`;
        list += `   ${t.ownerClan ? `🏰 محتول بواسطة كلان` : '🏳️ متاح'}\n`;
        if (t.guardian) {
          list += `   👹 حارس: ${t.guardian.name} (Lv.${t.guardian.level})\n`;
        } else {
          list += `   ✅ بدون حارس\n`;
        }
        list += `\n`;
      }
      await sock.sendMessage(from, { text: list });
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // أمر استكشاف إقليم جديد
    // ═══════════════════════════════════════════════════════════════════════════
    if (['استكشاف', 'explore'].includes(command)) {
      const result = exploreTerritory(player);
      saveDatabase();

      if (!result.success) {
        return sock.sendMessage(from, { text: result.message });
      }

      // إرسال صورة الإقليم مع النص
      await sendTerritoryImage(sock, from, result.territory, {
        additionalText: `\n⚔️ خياراتك:\n│ ${prefix}قتال_حارس ${result.territory.id}\n│ ${prefix}تسلل ${result.territory.id}`
      });
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // أمر قتال الحارس (للسيطرة على إقليم غير محتل)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['قتال_حارس', 'fightguardian'].includes(command)) {
      const input = args[0];
      if (!input) {
        // عرض الأقاليم غير المحتلة للاختيار
        return showTerritoriesList('free');
      }

      const territory = getTerritoryByIdOrName(input);
      if (!territory) {
        return sock.sendMessage(from, { text: '❌ إقليم غير موجود!' });
      }

      if (!player.clanId) {
        return sock.sendMessage(from, { text: '❌ يجب أن تكون في كلان للاحتلال!' });
      }

      if (territory.ownerClan) {
        return sock.sendMessage(from, { text: '❌ هذا الإقليم محتل بالفعل!' });
      }

      const result = fightGuardian(player, territory.id, player.clanId);
      saveDatabase();

      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // أمر التسلل (للقاتل والرامي فقط)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تسلل', 'stealth'].includes(command)) {
      const input = args[0];
      if (!input) {
        // عرض الأقاليم المحتلة للاختيار
        return showTerritoriesList('owned');
      }

      const territory = getTerritoryByIdOrName(input);
      if (!territory) {
        return sock.sendMessage(from, { text: '❌ إقليم غير موجود!' });
      }

      if (!territory.ownerClan) {
        return sock.sendMessage(from, { text: '❌ الإقليم غير محتل، لا يمكن التسلل!' });
      }

      const result = stealthRaid(player, territory.id);
      saveDatabase();

      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // أمر نشر جنود في الحامية (حماية)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['حماية', 'deploy'].includes(command)) {
      const input = args[0];
      const soldierCount = parseInt(args[1]) || 10;

      if (!input) {
        // عرض أقاليم الكلان للاختيار
        const myTerritories = getClanTerritories(player.clanId);
        if (myTerritories.length === 0) {
          return sock.sendMessage(from, { text: '❌ كلانك لا يملك أي أقاليم!' });
        }
        let list = '🗺️ أقاليم كلانك:\n\n';
        for (const t of myTerritories) {
          list += `${t.emoji} ${t.name}\n`;
          list += `   ${prefix}حماية ${t.id} <عدد>\n\n`;
        }
        return sock.sendMessage(from, { text: list });
      }

      const territory = getTerritoryByIdOrName(input);
      if (!territory) {
        return sock.sendMessage(from, { text: '❌ إقليم غير موجود!' });
      }

      if (territory.ownerClan !== player.clanId) {
        return sock.sendMessage(from, { text: '❌ هذا الإقليم لا يتبع لكلانك!' });
      }

      if (isNaN(soldierCount) || soldierCount <= 0) {
        return sock.sendMessage(from, { text: `❌ عدد الجنود غير صحيح!\n💡 ${prefix}حماية ${input} 20` });
      }

      const result = deployGarrison(player, territory.id, soldierCount);
      saveDatabase();

      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // أمر عرض الحامية
    // ═══════════════════════════════════════════════════════════════════════════
    if (['حامية', 'garrison'].includes(command)) {
      const input = args[0];
      if (!input) {
        // عرض قائمة حاميات الكلان
        const myTerritories = getClanTerritories(player.clanId);
        if (myTerritories.length === 0) {
          return sock.sendMessage(from, { text: '❌ لا توجد حاميات!' });
        }
        let list = '🛡️ حاميات كلانك:\n\n';
        for (const t of myTerritories) {
          list += `${t.emoji} ${t.name}\n`;
          list += `   الجنود: ${t.garrison?.total || 0}\n\n`;
        }
        return sock.sendMessage(from, { text: list });
      }

      const territory = getTerritoryByIdOrName(input);
      if (!territory) {
        return sock.sendMessage(from, { text: '❌ إقليم غير موجود!' });
      }

      const garrisonText = formatGarrisonInfo(territory);
      return sock.sendMessage(from, { text: garrisonText });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // أمر غزو إقليم (مهاجمة إقليم محتل)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['غزو', 'invade'].includes(command)) {
      const input = args[0];
      if (!input) {
        // عرض الأقاليم المحتلة للاختيار
        return showTerritoriesList('owned');
      }

      const territory = getTerritoryByIdOrName(input);
      if (!territory) {
        return sock.sendMessage(from, { text: '❌ إقليم غير موجود!' });
      }

      if (!player.clanId) {
        return sock.sendMessage(from, { text: '❌ يجب أن تكون في كلان!' });
      }

      if (!territory.ownerClan) {
        return sock.sendMessage(from, { text: '❌ هذا الإقليم غير محتل! استخدم .قتال_حارس للسيطرة عليه' });
      }

      if (territory.ownerClan === player.clanId) {
        return sock.sendMessage(from, { text: '❌ لا يمكنك غزو إقليم كلانك!' });
      }

      // يمكن تطوير هذا لاحقًا ليصبح غزوًا جماعيًا، حاليًا المهاجم هو اللاعب فقط
      const attackers = [player];
      const result = invadeTerritory(attackers, territory.id, player.clanId);
      saveDatabase();

      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // أمر سحب الجنود من الحامية
    // ═══════════════════════════════════════════════════════════════════════════
    if (['سحب_جنود', 'withdraw'].includes(command)) {
      const input = args[0];
      if (!input) {
        // عرض أقاليم الكلان للاختيار
        const myTerritories = getClanTerritories(player.clanId);
        if (myTerritories.length === 0) {
          return sock.sendMessage(from, { text: '❌ كلانك لا يملك أي أقاليم!' });
        }
        let list = '🗺️ أقاليمك التي يمكن سحب الجنود منها:\n\n';
        for (const t of myTerritories) {
          list += `${t.emoji} ${t.name}\n`;
        }
        list += `\n💡 ${prefix}سحب_جنود <اسم الإقليم>`;
        return sock.sendMessage(from, { text: list });
      }

      const territory = getTerritoryByIdOrName(input);
      if (!territory) {
        return sock.sendMessage(from, { text: '❌ إقليم غير موجود!' });
      }

      const result = withdrawGarrison(player, territory.id);
      saveDatabase();

      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // أمر عرض أقاليم الكلان
    // ═══════════════════════════════════════════════════════════════════════════
    if (['اقليمي', 'myterritory'].includes(command)) {
      const myTerritories = getClanTerritories(player.clanId);
      if (myTerritories.length === 0) {
        return sock.sendMessage(from, { text: '❌ كلانك لا يملك أي أقاليم!' });
      }

      let list = '🗺️ أقاليم كلانك:\n\n';
      for (const t of myTerritories) {
        list += formatTerritoryInfo(t) + '\n\n';
      }
      return sock.sendMessage(from, { text: list });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // أمر جمع إنتاج الأقاليم
    // ═══════════════════════════════════════════════════════════════════════════
    if (['جمع_اقاليم', 'collect'].includes(command)) {
      if (!player.clanId) {
        return sock.sendMessage(from, { text: '❌ يجب أن تكون في كلان!' });
      }

      const collected = collectTerritoryProduction(player.clanId);
      let msg = '💰 تم جمع الإنتاج من الأقاليم:\n';
      let hasAny = false;
      for (const [res, amount] of Object.entries(collected)) {
        if (amount > 0) {
          msg += `\n${res}: +${amount}`;
          hasAny = true;
        }
      }
      if (!hasAny) {
        msg += '\nلا يوجد إنتاج جديد (ربما تم جمعه مؤخرًا).';
      }
      return sock.sendMessage(from, { text: msg });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // أمر عرض قائمة الأقاليم (بدون تصفية)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['اقاليم', 'territories', 'الأقاليم'].includes(command)) {
      return showTerritoriesList();
    }
  }
};
