// ═══════════════════════════════════════════════════════════════════════════════
// 👹 أوامر الزعماء - فاطمة بوت v13.0 (معدل)
// يتضمن: التسجيل في معركة الزعيم، حالة الزعيم، قائمة الزعماء
// ملاحظة: الهجوم على الزعيم يتم تلقائياً عبر البوت (لا يوجد أمر هجوم منفصل)
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from '../lib/database.mjs';
import { getActiveBoss, registerForBoss, formatBossStatus, formatBossList } from '../lib/boss.mjs';

export default {
  name: 'Boss',
  commands: [
    'مشاركة', 'bossjoin',           // التسجيل في معركة الزعيم
    'حالة_زعيم', 'bossstatus',      // عرض حالة الزعيم الحالي
    'زعماء', 'bosses'               // عرض قائمة جميع الزعماء
  ],

  async execute(sock, msg, ctx) {
    const { from, sender, command, args, prefix } = ctx;
    const data = getRpgData();
    const player = data.players?.[sender];

    if (!player) {
      return sock.sendMessage(from, { text: '❌ سجل أولاً! استخدم .تسجيل <صنف>' });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // التسجيل في معركة الزعيم
    // ═══════════════════════════════════════════════════════════════════════════
    if (['مشاركة', 'bossjoin'].includes(command)) {
      const result = registerForBoss(player, from);
      saveDatabase();
      return sock.sendMessage(from, { text: result.message });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // حالة الزعيم الحالي في هذه المجموعة
    // ═══════════════════════════════════════════════════════════════════════════
    if (['حالة_زعيم', 'bossstatus'].includes(command)) {
      const boss = getActiveBoss(from);
      if (!boss) {
        return sock.sendMessage(from, { text: '❌ لا يوجد زعيم نشط في هذه المجموعة حالياً!' });
      }
      const statusText = formatBossStatus(boss);
      return sock.sendMessage(from, { text: statusText });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // عرض قائمة الزعماء المتاحين
    // ═══════════════════════════════════════════════════════════════════════════
    if (['زعماء', 'bosses'].includes(command)) {
      const listText = formatBossList();
      return sock.sendMessage(from, { text: listText });
    }
  }
};
