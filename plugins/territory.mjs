// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ أوامر استكشاف الأقاليم والصراع عليها - فاطمة بوت v12.0
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from '../lib/database.mjs';
import { 
  REGIONS, getRegionState, exploreRegion, fightGuardian, 
  sneakIntoRegion, addGarrison, getGarrisonInfo, invadeRegion 
} from '../lib/territory.mjs';

export default {
  name: 'Territory',
  commands: [
    'استكشاف', 'explore',
    'قتال_الحارس', 'fight_guardian',
    'تسلل', 'sneak',
    'حماية', 'protect', 'garrison',
    'الحامية', 'garrison_info',
    'غزو_المنطقة', 'invade_region',
    'انسحاب_الجنود', 'withdraw_garrison'
  ],

  async execute(sock, msg, ctx) {
    const { from, sender, pushName, command, args, text, prefix, isGroupAdmin, isGroup } = ctx;
    const data = getRpgData();
    const player = data.players?.[sender];

    // ═══════════════════════════════════════════════════════════════════════════
    // استكشاف منطقة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['استكشاف', 'explore'].includes(command)) {
      if (!player) {
        return sock.sendMessage(from, { text: '❌ سجل أولاً! استخدم .تسجيل <صنف>' });
      }

      const result = await exploreRegion(sock, from, player);
      
      if (!result.success) {
        return sock.sendMessage(from, { text: result.message });
      }

      saveDatabase();
      return; // الصورة أُرسلت بالفعل عبر exploreRegion
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // قتال حارس المنطقة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['قتال_الحارس', 'fight_guardian'].includes(command)) {
      if (!player) {
        return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      }

      // الحصول على آخر منطقة استكشفها اللاعب (يمكن تحسين هذا لاحقاً)
      const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
      const result = fightGuardian(region.id, player);

      if (!result.success) {
        return sock.sendMessage(from, { text: result.message });
      }

      saveDatabase();

      let response = result.message;
      if (result.conquered) {
        response += `\n\n🎉 مبروك! منطقتك تسيطر الآن على ${region.name}!`;
      }

      return sock.sendMessage(from, { text: response });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // التسلل
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تسلل', 'sneak'].includes(command)) {
      if (!player) {
        return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      }

      const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
      const result = sneakIntoRegion(region.id, player);

      if (!result.success) {
        return sock.sendMessage(from, { text: result.message });
      }

      saveDatabase();
      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // حماية المنطقة (إرسال جنود للحامية)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['حماية', 'protect', 'garrison'].includes(command)) {
      if (!player) {
        return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      }

      if (!player.clanId) {
        return sock.sendMessage(from, { text: '❌ يجب أن تكون عضوًا في كلان!' });
      }

      if (!args[0]) {
        return sock.sendMessage(from, { 
          text: `🛡️ ═══════ حماية المنطقة ═══════ 🛡️\n\nاستخدم:\n.حماية <عدد_الجنود> <النوع>\n\nمثال: .حماية 10 فارس\n\nالأنواع المتاحة:\n• فارس 🛡️\n• محارب ⚔️\n• رامي 🏹\n• ساحر ✨\n• شافي 💚` 
        });
      }

      const soldierCount = parseInt(args[0]);
      const soldierType = args[1] || 'محارب';

      if (isNaN(soldierCount) || soldierCount <= 0) {
        return sock.sendMessage(from, { text: '❌ عدد الجنود يجب أن يكون رقماً صحيحاً موجباً!' });
      }

      // اختيار منطقة عشوائية يسيطر عليها كلان اللاعب
      const controlledRegions = REGIONS.filter(r => {
        const state = getRegionState(r.id);
        return state.controlledBy === player.clanId;
      });

      if (controlledRegions.length === 0) {
        return sock.sendMessage(from, { text: '❌ كلانك لا يسيطر على أي مناطق! استكشف وسيطر على منطقة أولاً.' });
      }

      const region = controlledRegions[Math.floor(Math.random() * controlledRegions.length)];
      const result = addGarrison(region.id, sender, pushName, soldierCount, soldierType);

      if (!result.success) {
        return sock.sendMessage(from, { text: result.message });
      }

      saveDatabase();
      return sock.sendMessage(from, { 
        text: `${result.message}\n\n📍 المنطقة: ${region.name}\n🏰 الحامية الآن تدافع عن منطقتك!` 
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // عرض معلومات الحامية
    // ═══════════════════════════════════════════════════════════════════════════
    if (['الحامية', 'garrison_info'].includes(command)) {
      if (!player) {
        return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      }

      if (!player.clanId) {
        return sock.sendMessage(from, { text: '❌ يجب أن تكون عضوًا في كلان!' });
      }

      // الحصول على منطقة يسيطر عليها كلان اللاعب
      const controlledRegions = REGIONS.filter(r => {
        const state = getRegionState(r.id);
        return state.controlledBy === player.clanId;
      });

      if (controlledRegions.length === 0) {
        return sock.sendMessage(from, { text: '❌ كلانك لا يسيطر على أي مناطق!' });
      }

      const region = controlledRegions[0];
      const result = getGarrisonInfo(region.id);

      if (!result.success) {
        return sock.sendMessage(from, { text: result.message });
      }

      return sock.sendMessage(from, { 
        text: `${result.message}\n\n📍 المنطقة: ${region.name}` 
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // غزو منطقة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['غزو_المنطقة', 'invade_region'].includes(command)) {
      if (!player) {
        return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      }

      if (!player.clanId) {
        return sock.sendMessage(from, { text: '❌ يجب أن تكون عضوًا في كلان!' });
      }

      if (!isGroupAdmin) {
        return sock.sendMessage(from, { text: '❌ فقط مشرفو الكلان يمكنهم بدء الغزو!' });
      }

      // اختيار منطقة عشوائية يسيطر عليها كلان آخر
      const enemyRegions = REGIONS.filter(r => {
        const state = getRegionState(r.id);
        return state.controlledBy && state.controlledBy !== player.clanId;
      });

      if (enemyRegions.length === 0) {
        return sock.sendMessage(from, { text: '❌ لا توجد مناطق معادية للغزو! إما أن جميع المناطق لكم أو غير محتلة.' });
      }

      const region = enemyRegions[Math.floor(Math.random() * enemyRegions.length)];
      const state = getRegionState(region.id);

      // محاكاة الغزو (يمكن تطويره ليشمل عدة لاعبين)
      const attackers = [{
        clanName: player.clanName,
        attackPower: player.atk * 10 + (player.level * 5)
      }];

      const result = invadeRegion(region.id, player.clanId, attackers);

      if (!result.success) {
        return sock.sendMessage(from, { text: result.message });
      }

      saveDatabase();

      if (result.victory) {
        return sock.sendMessage(from, { 
          text: `⚔️ ═══════ غزو ناجح ═══════ ⚔️\n\n${result.message}\n\n📍 المنطقة: ${region.name}\n🎉 مبروك! منطقتكم تسيطر الآن على هذه المنطقة!` 
        });
      } else {
        return sock.sendMessage(from, { 
          text: `💀 ═══════ فشل الغزو ═══════ 💀\n\n${result.message}\n\n📍 المنطقة: ${region.name}\n\nحاولوا مرة أخرى بقوة أكبر!` 
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // انسحاب الجنود
    // ═══════════════════════════════════════════════════════════════════════════
    if (['انسحاب_الجنود', 'withdraw_garrison'].includes(command)) {
      if (!player) {
        return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      }

      if (!player.clanId) {
        return sock.sendMessage(from, { text: '❌ يجب أن تكون عضوًا في كلان!' });
      }

      // الحصول على منطقة يسيطر عليها كلان اللاعب
      const controlledRegions = REGIONS.filter(r => {
        const state = getRegionState(r.id);
        return state.controlledBy === player.clanId;
      });

      if (controlledRegions.length === 0) {
        return sock.sendMessage(from, { text: '❌ كلانك لا يسيطر على أي مناطق!' });
      }

      const region = controlledRegions[0];
      const state = getRegionState(region.id);

      // إزالة جنود اللاعب من الحامية
      const beforeCount = state.garrison.length;
      state.garrison = state.garrison.filter(g => g.playerId !== sender);
      const withdrawnCount = beforeCount - state.garrison.length;

      if (withdrawnCount === 0) {
        return sock.sendMessage(from, { text: '❌ ليس لديك جنود في هذه الحامية!' });
      }

      // إعادة الجنود للاعب (تبسيط: نعيدهم كـ "جند متاح")
      if (!player.army) player.army = { total: 0 };
      player.army.total += withdrawnCount * 5; // افتراض 5 جنود لكل إدخال

      saveDatabase();

      return sock.sendMessage(from, { 
        text: `✅ ═══════ انسحاب الجنود ═══════ ✅\n\nتم سحب جنودك من ${region.name}!\n👥 عدد الإدخالات المسحوبة: ${withdrawnCount}\n🎖️ الجند المتاح: +${withdrawnCount * 5}` 
      });
    }
  }
};
