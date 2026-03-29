// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ أوامر استكشاف الأقاليم والصراع عليها - فاطمة بوت v12.0 (محدث بالكامل)
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from '../lib/database.mjs';
import { 
  REGIONS, getRegionState, exploreRegion, fightGuardian, 
  sneakIntoRegion, addGarrison, getGarrisonInfo, 
  startInvasion, joinInvasion, executeInvasion, getActiveInvasion,
  collectRegionProduction, withdrawGarrison
} from '../lib/territory.mjs';
import { isClanLeader } from '../lib/clan.mjs';

export default {
  name: 'Territory',
  commands: [
    'استكشاف', 'explore',
    'قتال_الحارس', 'fight_guardian',
    'تسلل', 'sneak',
    'حماية', 'protect', 'garrison',
    'الحامية', 'garrison_info',
    'جمع_المناطق', 'collect',
    'بدء_غزو', 'start_invasion',
    'انضمام_غزو', 'join_invasion',
    'تنفيذ_غزو', 'execute_invasion',
    'انسحاب_الجنود', 'withdraw_garrison'
  ],

  async execute(sock, msg, ctx) {
    const { from, sender, pushName, command, args, text, prefix, isGroupAdmin, isGroup } = ctx;
    const data = getRpgData();
    const player = data.players?.[sender];

    // دالة مساعدة للحصول على المنطقة من الوسائط
    const getRegionFromArgs = () => {
      const regionName = args.join(' ');
      if (!regionName) return null;
      return REGIONS.find(r => r.name === regionName);
    };

    // عرض قائمة المناطق (اختياري: filter = 'free' or 'controlled')
    const showRegionsList = async (filter = null) => {
      let list = '';
      for (const r of REGIONS) {
        const state = getRegionState(r.id);
        if (filter === 'free' && state.controlledBy) continue;
        if (filter === 'controlled' && !state.controlledBy) continue;
        list += `${r.emoji} ${r.name} (${state.controlledBy ? `مسيطر: ${state.controlledByName}` : 'محايدة'})\n`;
      }
      await sock.sendMessage(from, { text: `🗺️ المناطق المتاحة:\n\n${list || 'لا توجد مناطق'}` });
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // استكشاف منطقة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['استكشاف', 'explore'].includes(command)) {
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً! استخدم .تسجيل <صنف>' });
      const region = getRegionFromArgs();
      const result = await exploreRegion(sock, from, player, region?.id);
      if (!result.success) return sock.sendMessage(from, { text: result.message });
      saveDatabase();
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // قتال الحارس
    // ═══════════════════════════════════════════════════════════════════════════
    if (['قتال_الحارس', 'fight_guardian'].includes(command)) {
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      const region = getRegionFromArgs();
      if (!region) return showRegionsList('free');
      const result = fightGuardian(region.id, player);
      saveDatabase();
      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // تسلل
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تسلل', 'sneak'].includes(command)) {
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      const region = getRegionFromArgs();
      if (!region) return showRegionsList('controlled');
      const result = sneakIntoRegion(region.id, player);
      saveDatabase();
      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // حماية (إرسال جنود للحامية)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['حماية', 'protect', 'garrison'].includes(command)) {
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      if (!player.clanId) return sock.sendMessage(from, { text: '❌ يجب أن تكون عضوًا في كلان!' });

      const regionName = args[0];
      const soldierCount = parseInt(args[1]);
      const soldierType = args[2] || 'محارب';

      if (!regionName) return showRegionsList('controlled');
      if (isNaN(soldierCount) || soldierCount <= 0) {
        return sock.sendMessage(from, { text: `❌ حدد عدد الجنود!\nمثال: ${prefix}حماية ${regionName} 10 فارس` });
      }

      const region = REGIONS.find(r => r.name === regionName);
      if (!region) return sock.sendMessage(from, { text: '❌ منطقة غير موجودة!' });

      const result = addGarrison(region.id, sender, pushName, soldierCount, soldierType);
      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // عرض معلومات الحامية
    // ═══════════════════════════════════════════════════════════════════════════
    if (['الحامية', 'garrison_info'].includes(command)) {
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      const region = getRegionFromArgs();
      if (!region) return showRegionsList('controlled');
      const result = getGarrisonInfo(region.id);
      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // انسحاب الجنود من الحامية
    // ═══════════════════════════════════════════════════════════════════════════
    if (['انسحاب_الجنود', 'withdraw_garrison'].includes(command)) {
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      if (!player.clanId) return sock.sendMessage(from, { text: '❌ يجب أن تكون عضوًا في كلان!' });
      
      const regionName = args[0];
      const soldierType = args[1]; // اختياري: نوع الجندي لانسحاب نوع معين
      
      if (!regionName) {
        // عرض قائمة المناطق التي يسيطر عليها كلان اللاعب
        const myRegions = REGIONS.filter(r => {
          const state = getRegionState(r.id);
          return state.controlledBy === player.clanId;
        });
        if (myRegions.length === 0) return sock.sendMessage(from, { text: '❌ كلانك لا يسيطر على أي مناطق!' });
        let list = '🗺️ المناطق المسيطر عليها:\n\n';
        for (const r of myRegions) {
          list += `${r.emoji} ${r.name}\n`;
        }
        list += `\n💡 استخدم: ${prefix}انسحاب_الجنود <اسم المنطقة> [نوع الجندي]`;
        return sock.sendMessage(from, { text: list });
      }
      
      const region = REGIONS.find(r => r.name === regionName);
      if (!region) return sock.sendMessage(from, { text: '❌ منطقة غير موجودة!' });
      
      const result = withdrawGarrison(region.id, sender, pushName, soldierType);
      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // جمع الإنتاج
    // ═══════════════════════════════════════════════════════════════════════════
    if (['جمع_المناطق', 'collect'].includes(command)) {
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      if (!player.clanId) return sock.sendMessage(from, { text: '❌ يجب أن تكون عضوًا في كلان!' });
      const collected = collectRegionProduction(player.clanId);
      let msg = '💰 تم جمع الإنتاج:\n';
      for (const [res, amount] of Object.entries(collected)) {
        if (amount > 0) msg += `\n${res}: +${amount}`;
      }
      return sock.sendMessage(from, { text: msg });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // بدء غزو منطقة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['بدء_غزو', 'start_invasion'].includes(command)) {
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      if (!player.clanId) return sock.sendMessage(from, { text: '❌ يجب أن تكون عضوًا في كلان!' });
      const region = getRegionFromArgs();
      if (!region) return showRegionsList('controlled');
      const result = startInvasion(region.id, player.clanId, sender);
      if (!result.success) return sock.sendMessage(from, { text: result.message });
      const invasion = result.invasion;
      const mins = Math.ceil((invasion.endTime - Date.now()) / 60000);
      return sock.sendMessage(from, { text: `⚔️ بدأ غزو ${region.name}!\n⏰ فترة التجهيز: ${mins} دقيقة\n💡 .انضمام_غزو ${region.name} <عدد_الجنود>` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // انضمام لغزو
    // ═══════════════════════════════════════════════════════════════════════════
    if (['انضمام_غزو', 'join_invasion'].includes(command)) {
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      const region = getRegionFromArgs();
      if (!region) return sock.sendMessage(from, { text: '❌ حدد المنطقة!' });
      const soldierCount = parseInt(args[1]);
      if (isNaN(soldierCount) || soldierCount <= 0) {
        return sock.sendMessage(from, { text: `❌ حدد عدد الجنود!\nمثال: ${prefix}انضمام_غزو ${region.name} 50` });
      }
      const result = joinInvasion(region.id, sender, pushName, soldierCount, player.atk);
      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // تنفيذ الغزو (لقائد الكلان فقط)
    // ═══════════════════════════════════════════════════════════════════════════
    if (['تنفيذ_غزو', 'execute_invasion'].includes(command)) {
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });
      if (!player.clanId) return sock.sendMessage(from, { text: '❌ يجب أن تكون عضوًا في كلان!' });
      const region = getRegionFromArgs();
      if (!region) return sock.sendMessage(from, { text: '❌ حدد المنطقة!' });
      const invasion = getActiveInvasion(region.id);
      if (!invasion) return sock.sendMessage(from, { text: '❌ لا يوجد غزو نشط لهذه المنطقة!' });
      const clan = data.clans?.[player.clanId];
      if (!isClanLeader(clan, sender)) {
        return sock.sendMessage(from, { text: '❌ فقط قائد الكلان يمكنه تنفيذ الغزو!' });
      }
      const result = executeInvasion(region.id);
      return sock.sendMessage(from, { text: result.message });
    }
  }
};
