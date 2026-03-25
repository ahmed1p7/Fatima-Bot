// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ أوامر الأقاليم والاستكشاف - فاطمة بوت v12.0
// بديل نظام القرية مع صراع الأقاليم
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from '../lib/database.mjs';
import { 
  exploreTerritory, fightGuardian, stealthRaid, 
  deployGarrison, invadeTerritory, withdrawGarrison,
  formatTerritoryInfo, formatGarrisonInfo, getClanTerritories,
  TERRITORY_TYPES 
} from '../lib/territories.mjs';
import { sendTerritoryImage } from '../lib/imageManager.mjs';

export default {
  name: 'Territories',
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
    'اكسبر', 'scout'
  ],

  async execute(sock, msg, ctx) {
    const { from, sender, pushName, command, args, text, prefix, quoted, isGroup, isGroupAdmin } = ctx;
    const data = getRpgData();
    const player = data.players?.[sender];

    if (!player) {
      return sock.sendMessage(from, { text: '❌ سجل أولاً! استخدم .تسجيل <صنف>' });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // استكشاف إقليم جديد
    // ═══════════════════════════════════════════════════════════════════════════
    if (['استكشاف', 'explore'].includes(command)) {
      const result = exploreTerritory(player);
      saveDatabase();

      if (!result.success) {
        return sock.sendMessage(from, { text: result.message });
      }

      // إرسال صورة الإقليم
      await sendTerritoryImage(sock, from, result.territory, {
        additionalText: `\n⚔️ خياراتك:\n│ ${prefix}قتال_حارس ${result.territory.id}\n│ ${prefix}انسحاب`
      });

      return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // قتال الحارس
    // ═══════════════════════════════════════════════════════════════════════════
    if (['قتال_حارس', 'fightguardian'].includes(command)) {
      const territoryId = args[0];

      if (!territoryId) {
        return sock.sendMessage(from, { text: `❌ حدد الإقليم!\n💡 ${prefix}قتال_حارس <معرف_الإقليم>` });
      }

      const result = fightGuardian(player, territoryId, player.clanId);
      saveDatabase();

      if (!result.success) {
        return sock.sendMessage(from, { text: result.message });
      }

      if (result.won) {
        return sock.sendMessage(from, {
          text: `@
━─━••❁⊰｢❀｣⊱❁••━─━

🏆 • • ✤ انتصار! ✤ • • 🏆

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ ${result.message}
│ 
│ 🎁 المكافآت:
│ ⭐ +${result.rewards.xp} XP
│ 💰 +${result.rewards.gold} ذهب
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`
        });
      } else {
        return sock.sendMessage(from, { text: result.message });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // التسلل (للقاتل والرامي)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تسلل', 'stealth'].includes(command)) {
      const territoryId = args[0];

      if (!territoryId) {
        return sock.sendMessage(from, { text: `❌ حدد الإقليم!\n💡 ${prefix}تسلل <معرف_الإقليم>` });
      }

      const result = stealthRaid(player, territoryId);
      saveDatabase();

      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // نشر جنود في الحامية
    // ═══════════════════════════════════════════════════════════════════════════
    if (['حماية', 'deploy'].includes(command)) {
      const territoryId = args[0];
      const soldierCount = parseInt(args[1]) || 10;

      if (!territoryId) {
        // عرض أقاليم الكلان للاختيار
        const territories = getClanTerritories(player.clanId);
        if (territories.length === 0) {
          return sock.sendMessage(from, { text: '❌ كلانك لا يملك أي أقاليم!' });
        }

        let list = `🗺️ أقاليم كلانك:\n\n`;
        territories.forEach((t, i) => {
          list += `${i + 1}. ${t.emoji} ${t.name}\n`;
          list += `   ${prefix}حماية ${t.id} <عدد>\n\n`;
        });

        return sock.sendMessage(from, { text: list });
      }

      const result = deployGarrison(player, territoryId, soldierCount);
      saveDatabase();

      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // عرض الحامية
    // ═══════════════════════════════════════════════════════════════════════════
    if (['حامية', 'garrison'].includes(command)) {
      const territoryId = args[0];
      const rpgData = getRpgData();

      if (!territoryId) {
        // عرض جميع الحاميات
        const territories = getClanTerritories(player.clanId);
        if (territories.length === 0) {
          return sock.sendMessage(from, { text: '❌ لا توجد حاميات!' });
        }

        let list = `🛡️ حاميات كلانك:\n\n`;
        for (const t of territories) {
          list += `${t.emoji} ${t.name}\n`;
          list += `   الجنود: ${t.garrison?.total || 0}\n\n`;
        }

        return sock.sendMessage(from, { text: list });
      }

      const territory = rpgData.territories?.[territoryId];
      if (!territory) {
        return sock.sendMessage(from, { text: '❌ الإقليم غير موجود!' });
      }

      return sock.sendMessage(from, { text: formatGarrisonInfo(territory) });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // غزو إقليم
    // ═══════════════════════════════════════════════════════════════════════════
    if (['غزو', 'invade'].includes(command)) {
      const territoryId = args[0];

      if (!territoryId) {
        return sock.sendMessage(from, { text: `❌ حدد الإقليم للغزو!\n💡 ${prefix}غزو <معرف_الإقليم>` });
      }

      // جمع المهاجمين (يمكن للمشاركين الانضمام)
      const attackers = [player]; // المهاجم الأساسي

      const result = await invadeTerritory(attackers, territoryId, player.clanId);
      saveDatabase();

      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // سحب الجنود
    // ═══════════════════════════════════════════════════════════════════════════
    if (['سحب_جنود', 'withdraw'].includes(command)) {
      const territoryId = args[0];

      if (!territoryId) {
        return sock.sendMessage(from, { text: `❌ حدد الإقليم!\n💡 ${prefix}سحب_جنود <معرف_الإقليم>` });
      }

      const result = withdrawGarrison(player, territoryId);
      saveDatabase();

      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // قائمة الأقاليم
    // ═══════════════════════════════════════════════════════════════════════════
    if (['اقاليم', 'territories', 'الأقاليم'].includes(command)) {
      const rpgData = getRpgData();
      const territories = Object.values(rpgData.territories || {});

      if (territories.length === 0) {
        return sock.sendMessage(from, { text: '❌ لا توجد أقاليم مكتشفة!\n💡 استخدم .استكشاف لاكتشاف إقليم جديد' });
      }

      let list = `@
━─━••❁⊰｢❀｣⊱❁••━─━

🗺️ • • ✤ الأقاليم المكتشفة ✤ • • 🗺️

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;

      for (const t of territories.slice(0, 10)) {
        const owner = t.ownerClan ? `🏰 محتول` : '🏳️ متاح';
        list += `${t.emoji} ${t.name}\n`;
        list += `   ${owner} | ${t.guardian ? '👹 محروس' : '✅ آمن'}\n\n`;
      }

      list += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

> \`بــوت :\`
> _*『 FATIMA 』*_
━─━••❁⊰｢ ❀｣⊱❁••━─━`;

      return sock.sendMessage(from, { text: list });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // معلومات إقليمي
    // ═══════════════════════════════════════════════════════════════════════════
    if (['اقليمي', 'myterritory'].includes(command)) {
      const clanTerritories = getClanTerritories(player.clanId);

      if (clanTerritories.length === 0) {
        return sock.sendMessage(from, { text: '❌ كلانك لا يملك أي أقاليم!' });
      }

      let list = `🗺️ أقاليم كلانك:\n\n`;
      for (const t of clanTerritories) {
        list += formatTerritoryInfo(t) + '\n\n';
      }

      return sock.sendMessage(from, { text: list });
    }
  }
};
