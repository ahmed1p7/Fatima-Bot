// ═══════════════════════════════════════════════════════════════════════════════
// 🏘️ أوامر القرية الشخصية
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from '../lib/database.mjs';
import { 
  BUILDINGS, UNITS,
  createVillage, upgradeBuilding, collectResources,
  trainUnit, calculateDefensePower, calculateAttackPower,
  attackVillage, formatVillageDisplay, getAvailableBuildings, getAvailableUnits
} from '../lib/village.mjs';

export default {
  name: 'Village',
  commands: [
    'قريتي', 'village', 'قرية',
    'بناء', 'build', 'ترقية_بناء',
    'جمع', 'collect', 'تجميع',
    'تدريب', 'train', 'تدريب_وحدات',
    'جيشي', 'army',
    'هجوم_قرية', 'attack_village', 'raid',
    'مباني', 'buildings',
    'وحدات', 'units',
    'دفاعي', 'defense'
  ],

  async execute(sock, msg, ctx) {
    const { from, sender, pushName, command, args, text, prefix } = ctx;
    const data = getRpgData();
    let player = data.players?.[sender];

    // ═══════════════════════════════════════════════════════════════════════════
    // التحقق من التسجيل
    // ═══════════════════════════════════════════════════════════════════════════
    if (!player) {
      return sock.sendMessage(from, { text: '❌ سجل أولاً! استخدم .تسجيل <صنف>' });
    }

    // التأكد من وجود القرية
    if (!player.village) {
      player.village = createVillage();
      saveDatabase();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // عرض القرية
    // ═══════════════════════════════════════════════════════════════════════════
    if (['قريتي', 'village', 'قرية'].includes(command)) {
      // جمع الموارد أولاً
      collectResources(player.village);
      saveDatabase();

      const display = formatVillageDisplay(player.village, pushName);
      return sock.sendMessage(from, { text: display });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // بناء/ترقية مبنى
    // ═══════════════════════════════════════════════════════════════════════════
    if (['بناء', 'build', 'ترقية_بناء'].includes(command)) {
      const buildingName = args[0];
      const index = parseInt(args[1]) || 0;

      if (!buildingName) {
        const available = getAvailableBuildings(player.village);
        let list = `🏗️ المباني المتاحة:\n\n`;
        
        for (const b of available) {
          const cost = b.cost;
          const costStr = Object.entries(cost).map(([r, a]) => `${r}: ${a}`).join(', ');
          list += `${b.emoji} ${b.name}\n`;
          list += `   المستوى: ${b.currentCount}/${b.maxCount} | التكلفة: ${costStr}\n\n`;
        }

        list += `💡 ${prefix}بناء <اسم_المبنى> [رقم]`;
        return sock.sendMessage(from, { text: list });
      }

      // البحث عن المبنى
      let buildingType = null;
      for (const [type, def] of Object.entries(BUILDINGS)) {
        if (def.name === buildingName || type === buildingName || 
            def.name.includes(buildingName)) {
          buildingType = type;
          break;
        }
      }

      if (!buildingType) {
        return sock.sendMessage(from, { text: '❌ مبنى غير موجود!' });
      }

      const result = upgradeBuilding(player.village, buildingType, index);
      saveDatabase();

      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // جمع الموارد
    // ═══════════════════════════════════════════════════════════════════════════
    if (['جمع', 'collect', 'تجميع'].includes(command)) {
      const collected = collectResources(player.village);
      saveDatabase();

      if (Object.values(collected).every(v => v === 0)) {
        return sock.sendMessage(from, { text: '📦 لا توجد موارد للجمع!' });
      }

      let msg = `📦 تم جمع الموارد:\n\n`;
      for (const [resource, amount] of Object.entries(collected)) {
        if (amount > 0) {
          const emoji = resource === 'gold' ? '💰' : resource === 'elixir' ? '💜' : 
                       resource === 'wood' ? '🪵' : '🪨';
          msg += `${emoji} ${resource}: +${amount}\n`;
        }
      }

      return sock.sendMessage(from, { text: msg });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // تدريب وحدات
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تدريب', 'train', 'تدريب_وحدات'].includes(command)) {
      const unitName = args[0];
      const count = parseInt(args[1]) || 1;

      if (!unitName) {
        const available = getAvailableUnits(player.village);
        let list = `⚔️ الوحدات المتاحة:\n\n`;

        for (const u of available) {
          const costStr = Object.entries(u.cost).map(([r, a]) => `${r}: ${a * count}`).join(', ');
          list += `${u.emoji} ${u.name}\n`;
          list += `   HP: ${u.hp} | ATK: ${u.atk} | سكن: ${u.housing}\n`;
          list += `   التكلفة: ${costStr} | الوقت: ${u.trainTime}ث\n\n`;
        }

        list += `💡 ${prefix}تدريب <اسم_الوحدة> [العدد]`;
        return sock.sendMessage(from, { text: list });
      }

      // البحث عن الوحدة
      let unitType = null;
      for (const [type, def] of Object.entries(UNITS)) {
        if (def.name === unitName || type === unitName) {
          unitType = type;
          break;
        }
      }

      if (!unitType) {
        return sock.sendMessage(from, { text: '❌ وحدة غير موجودة!' });
      }

      const result = trainUnit(player.village, unitType, count);
      saveDatabase();

      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // عرض الجيش
    // ═══════════════════════════════════════════════════════════════════════════
    if (['جيشي', 'army'].includes(command)) {
      const attack = calculateAttackPower(player.village);
      const trained = player.village.units?.trained || [];
      const defending = player.village.units?.defending || [];

      let msg = `⚔️ ═══════ جيشك ═══════ ⚔️\n\n`;

      msg += `🗡️ قوة الهجوم: ${attack.power}\n`;
      msg += `❤️ إجمالي HP: ${attack.hp}\n\n`;

      msg += `👥 الوحدات المدربة (${trained.reduce((s, u) => s + u.count, 0)}):\n`;
      if (trained.length === 0) {
        msg += `   ❌ لا توجد وحدات\n`;
      } else {
        for (const unit of trained) {
          const def = UNITS[unit.type];
          msg += `   ${def?.emoji || '👤'} ${def?.name || unit.type} x${unit.count} (Lv.${unit.level})\n`;
        }
      }

      msg += `\n🛡️ الوحدات المدافعة (${defending.reduce((s, u) => s + u.count, 0)}):\n`;
      if (defending.length === 0) {
        msg += `   ❌ لا توجد وحدات مدافعة\n`;
      } else {
        for (const unit of defending) {
          const def = UNITS[unit.type];
          msg += `   ${def?.emoji || '👤'} ${def?.name || unit.type} x${unit.count}\n`;
        }
      }

      return sock.sendMessage(from, { text: msg });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // الهجوم على قرية
    // ═══════════════════════════════════════════════════════════════════════════
    if (['هجوم_قرية', 'attack_village', 'raid'].includes(command)) {
      // التحقق من وقت التهدئة
      const lastAttack = player.village.lastAttack || 0;
      const cooldown = 30 * 60 * 1000; // 30 دقيقة

      if (Date.now() - lastAttack < cooldown) {
        const remaining = Math.ceil((cooldown - (Date.now() - lastAttack)) / 60000);
        return sock.sendMessage(from, { text: `⏰ انتظر ${remaining} دقيقة قبل الهجوم التالي!` });
      }

      // التحقق من وجود وحدات
      const trained = player.village.units?.trained || [];
      if (trained.length === 0) {
        return sock.sendMessage(from, { text: '❌ لا تملك وحدات للهجوم! درب وحدات أولاً.' });
      }

      // البحث عن قرية عشوائية
      const allPlayers = Object.entries(data.players)
        .filter(([id, p]) => id !== sender && p.village && p.village.shieldEndTime < Date.now());

      if (allPlayers.length === 0) {
        return sock.sendMessage(from, { text: '❌ لا توجد قرى متاحة للهجوم!' });
      }

      // اختيار قرية عشوائية
      const [targetId, targetPlayer] = allPlayers[Math.floor(Math.random() * allPlayers.length)];

      // تنفيذ الهجوم
      const result = attackVillage(player.village, targetPlayer.village);
      saveDatabase();

      let msg = result.won 
        ? `🏆 انتصار على قرية ${targetPlayer.name}!\n\n`
        : `😢 هزيمة ضد قرية ${targetPlayer.name}!\n\n`;

      msg += `⭐ النجوم: ${'⭐'.repeat(result.stars)}${'☆'.repeat(3 - result.stars)}\n`;
      msg += `⚔️ قوتك: ${result.attackPower} | 🛡️ دفاعهم: ${result.defensePower}\n\n`;

      if (result.stolenResources) {
        msg += `📦 الموارد المسروقة:\n`;
        for (const [resource, amount] of Object.entries(result.stolenResources)) {
          if (amount > 0) {
            const emoji = resource === 'gold' ? '💰' : resource === 'elixir' ? '💜' : 
                         resource === 'wood' ? '🪵' : '🪨';
            msg += `${emoji} ${resource}: +${amount}\n`;
          }
        }
      }

      return sock.sendMessage(from, { text: msg });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // قائمة المباني
    // ═══════════════════════════════════════════════════════════════════════════
    if (['مباني', 'buildings'].includes(command)) {
      const available = getAvailableBuildings(player.village);
      let msg = `🏗️ ═══════ المباني ═══════ 🏗️\n\n`;

      const byCategory = {
        main: [],
        resource: [],
        storage: [],
        defense: [],
        military: []
      };

      for (const b of available) {
        byCategory[b.category]?.push(b);
      }

      const categoryNames = {
        main: '🏛️ الرئيسية',
        resource: '⛏️ الموارد',
        storage: '📦 التخزين',
        defense: '🛡️ الدفاعية',
        military: '⚔️ العسكرية'
      };

      for (const [cat, buildings] of Object.entries(byCategory)) {
        if (buildings.length > 0) {
          msg += `${categoryNames[cat]}:\n`;
          for (const b of buildings) {
            msg += `  ${b.emoji} ${b.name} (${b.currentCount}/${b.maxCount})\n`;
          }
          msg += `\n`;
        }
      }

      msg += `💡 ${prefix}بناء <اسم_المبنى>`;
      return sock.sendMessage(from, { text: msg });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // قوة الدفاع
    // ═══════════════════════════════════════════════════════════════════════════
    if (['دفاعي', 'defense'].includes(command)) {
      const defense = calculateDefensePower(player.village);

      let msg = `🛡️ ═══════ دفاعاتك ═══════ 🛡️\n\n`;
      msg += `⚔️ قوة الدفاع: ${defense.power}\n`;
      msg += `❤️ إجمالي HP: ${defense.hp}\n\n`;

      // عرض الدفاعات
      const defenseBuildings = ['archerTower', 'cannon', 'wizardTower', 'walls'];
      msg += `🏰 المباني الدفاعية:\n`;

      for (const type of defenseBuildings) {
        const buildings = player.village.buildings[type] || [];
        if (buildings.length > 0) {
          const def = BUILDINGS[type];
          msg += `  ${def.emoji} ${def.name}: ${buildings.length} (Lv.${Math.max(...buildings.map(b => b.level))})\n`;
        }
      }

      return sock.sendMessage(from, { text: msg });
    }
  }
};
