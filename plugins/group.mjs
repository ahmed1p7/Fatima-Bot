// ═══════════════════════════════════════════════════════════════════════════════
// 👥 المجموعات
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  name: 'Groups',
  commands: ['الجميع', 'منشن', 'المشرفين', 'admins', 'معلومات', 'infogp', 'رابط', 'link', 'فتح', 'open', 'إغلاق', 'close', 'طرد', 'kick', 'ترقية', 'promote', 'تنزيل', 'demote'],
  
  async execute(sock, msg, ctx) {
    const { from, sender, command, args, text, isGroup, prefix, quoted } = ctx;
    if (!isGroup) return sock.sendMessage(from, { text: '❌ للمجموعات!' });
    
    let meta; try { meta = await sock.groupMetadata(from); } catch { return; }
    const isAdmin = meta.participants.find(p => p.id === sender)?.admin;
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const isBotAdmin = meta.participants.find(p => p.id === botId)?.admin;
    
    if (['الجميع', 'منشن'].includes(command)) {
      if (!isAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين!' });
      const mentions = meta.participants.map(p => p.id);
      return sock.sendMessage(from, { text: text || '👥 للجميع', mentions });
    }
    
    if (['المشرفين', 'admins'].includes(command)) {
      const admins = meta.participants.filter(p => p.admin);
      return sock.sendMessage(from, { text: `👑 المشرفون:\n${admins.map(a => '• @' + a.id.split('@')[0]).join('\n')}`, mentions: admins.map(a => a.id) });
    }
    
    if (['معلومات', 'infogp'].includes(command)) {
      return sock.sendMessage(from, { text: `👥 ${meta.subject}\n◉ الأعضاء: ${meta.participants.length}\n◉ أنشئ: ${new Date(meta.creation * 1000).toLocaleDateString('ar')}` });
    }
    
    if (['رابط', 'link'].includes(command)) {
      if (!isBotAdmin) return sock.sendMessage(from, { text: '❌ يجب أكون مشرف!' });
      try { const code = await sock.groupInviteCode(from); return sock.sendMessage(from, { text: `🔗 https://chat.whatsapp.com/${code}` }); }
      catch { return sock.sendMessage(from, { text: '❌ لا يمكن!' }); }
    }
    
    if (['فتح', 'open'].includes(command)) {
      if (!isAdmin || !isBotAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين!' });
      await sock.groupSettingUpdate(from, 'not_announcement');
      return sock.sendMessage(from, { text: '✅ فُتح!' });
    }
    
    if (['إغلاق', 'close'].includes(command)) {
      if (!isAdmin || !isBotAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين!' });
      await sock.groupSettingUpdate(from, 'announcement');
      return sock.sendMessage(from, { text: '✅ أُغلق!' });
    }
    
    if (['طرد', 'kick'].includes(command)) {
      if (!isAdmin || !isBotAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين!' });
      let user = quoted?.mentionedJid?.[0] || args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      if (!user) return sock.sendMessage(from, { text: '❌ أشر للشخص!' });
      await sock.groupParticipantsUpdate(from, [user], 'remove');
      return sock.sendMessage(from, { text: '✅ طُرد!', mentions: [user] });
    }
    
    if (['ترقية', 'promote'].includes(command)) {
      if (!isAdmin || !isBotAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين!' });
      let user = quoted?.mentionedJid?.[0] || args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      if (!user) return sock.sendMessage(from, { text: '❌ أشر للشخص!' });
      await sock.groupParticipantsUpdate(from, [user], 'promote');
      return sock.sendMessage(from, { text: '👑 تمت!', mentions: [user] });
    }
    
    if (['تنزيل', 'demote'].includes(command)) {
      if (!isAdmin || !isBotAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين!' });
      let user = quoted?.mentionedJid?.[0] || args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      if (!user) return sock.sendMessage(from, { text: '❌ أشر للشخص!' });
      await sock.groupParticipantsUpdate(from, [user], 'demote');
      return sock.sendMessage(from, { text: '📉 تم!', mentions: [user] });
    }
  }
};
