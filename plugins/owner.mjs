// ═══════════════════════════════════════════════════════════════════════════════
// 👑 المالك
// ═══════════════════════════════════════════════════════════════════════════════

import { exec } from 'child_process';
import { promisify } from 'util';
import { saveDatabase, getDatabase } from '../lib/database.mjs';
const execAsync = promisify(exec);

const banned = new Set();

export default {
  name: 'Owner',
  commands: ['تحديث', 'update', 'إعادة', 'restart', 'إحصائيات', 'stats', 'إرسال', 'bc', 'مجموعات', 'groups', 'حظر_عام', 'ban', 'فك_حظر', 'unban', 'المحظورين', 'banned', 'خروج', 'leave'],
  
  async execute(sock, msg, ctx) {
    const { from, sender, command, args, text, isOwner, prefix } = ctx;
    if (!isOwner) return sock.sendMessage(from, { text: '❌ للمالك!' });
    const db = getDatabase();
    
    if (['تحديث', 'update'].includes(command)) {
      await sock.sendMessage(from, { text: '🔄 تحديث...' });
      saveDatabase();
      try { await execAsync('cd ' + process.cwd() + ' && git pull'); return sock.sendMessage(from, { text: '✅ تم! .إعادة' }); }
      catch (e) { return sock.sendMessage(from, { text: '❌ ' + e.message }); }
    }
    
    if (['إعادة', 'restart'].includes(command)) { saveDatabase(); process.exit(0); }
    
    if (['إحصائيات', 'stats'].includes(command)) {
      const up = process.uptime();
      return sock.sendMessage(from, { text: `📊 الإحصائيات:\n\n⏱️ ${Math.floor(up/86400)}d ${Math.floor((up%86400)/3600)}h\n💬 ${db.stats.messages || 0}\n⚡ ${db.stats.commands || 0}` });
    }
    
    if (['إرسال', 'bc'].includes(command)) {
      if (!text) return sock.sendMessage(from, { text: '❌ اكتب!' });
      const chats = await sock.groupFetchAllParticipating();
      const ids = Object.keys(chats);
      await sock.sendMessage(from, { text: `⏳ ${ids.length}...` });
      let s = 0; for (const id of ids) { try { await sock.sendMessage(id, { text }); s++; } catch {} }
      return sock.sendMessage(from, { text: `✅ ${s}/${ids.length}` });
    }
    
    if (['مجموعات', 'groups'].includes(command)) {
      const chats = await sock.groupFetchAllParticipating();
      const list = Object.values(chats).map((g, i) => `${i+1}. ${g.subject}`).join('\n');
      return sock.sendMessage(from, { text: `📋 المجموعات:\n\n${list}` });
    }
    
    if (['حظر_عام', 'ban'].includes(command)) {
      let u = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      if (!u) return sock.sendMessage(from, { text: '❌ أشر!' });
      banned.add(u);
      return sock.sendMessage(from, { text: `✅ حُظر!`, mentions: [u] });
    }
    
    if (['فك_حظر', 'unban'].includes(command)) {
      let u = args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      if (!banned.has(u)) return sock.sendMessage(from, { text: '❌ غير محظور!' });
      banned.delete(u);
      return sock.sendMessage(from, { text: '✅ فُك!' });
    }
    
    if (['المحظورين', 'banned'].includes(command)) {
      if (banned.size === 0) return sock.sendMessage(from, { text: '✅ لا أحد!' });
      return sock.sendMessage(from, { text: `🚫 المحظورين:\n${[...banned].map(u => '• @' + u.split('@')[0]).join('\n')}` });
    }
    
    if (['خروج', 'leave'].includes(command)) {
      await sock.sendMessage(from, { text: '👋 خروج...' });
      return sock.groupLeave(from);
    }
  }
};

export { banned };
