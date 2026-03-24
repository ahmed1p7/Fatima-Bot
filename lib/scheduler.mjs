// ═══════════════════════════════════════════════════════════════════════════════
// 🕐 نظام المهام المجدولة - فاطمة بوت v12.0
// يتضمن: إعادة تعيين الطاقة، ظهور الزعماء التلقائي
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase, getDatabase } from './database.mjs';
import { MAX_STAMINA } from './rpg.mjs';
import { spawnRandomBoss } from './boss.mjs';
import { sendImageFromUrl } from './utils/image.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ إعادة تعيين الطاقة اليومية
// ═══════════════════════════════════════════════════════════════════════════════

export const resetDailyStamina = async (sock) => {
  try {
    const rpgData = getRpgData();
    const players = rpgData.players || {};
    let count = 0;
    
    for (const [id, player] of Object.entries(players)) {
      // إعادة تعيين الطاقة للحد الأقصى
      player.stamina = player.maxStamina || MAX_STAMINA;
      player.lastStaminaRegen = Date.now();
      count++;
    }
    
    saveDatabase();
    console.log(`✅ تم إعادة تعيين طاقة ${count} لاعب`);
    
    // إرسال إشعار للمجموعات النشطة
    if (sock) {
      const db = getDatabase();
      const groups = db.groups || [];
      for (const group of groups) {
        try {
          await sock.sendMessage(group.id, { 
            text: `⚡ ═══════════════════════════ ⚡\n\n🌅 صباح الخير يا أبطال!\n\n✅ تم إعادة تعيين الطاقة اليومية!\n⚡ طاقتك الآن: ${player.maxStamina || MAX_STAMINA}/${player.maxStamina || MAX_STAMINA}\n\n🎯 ابدأ مغامراتك الآن!\n\n> \`بــوت :\`\n> _*『 FATIMA 』*_`
          });
        } catch (e) {
          // تجاهل المجموعات غير النشطة
        }
      }
    }
  } catch (error) {
    console.error('❌ خطأ في إعادة تعيين الطاقة:', error.message);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 👹 ظهور الزعماء العشوائي
// ═══════════════════════════════════════════════════════════════════════════════

export const spawnRandomBossEvent = async (sock) => {
  try {
    const db = getDatabase();
    const groups = db.groups || [];
    
    // اختيار مجموعة عشوائية
    if (groups.length === 0) return;
    
    const randomGroup = groups[Math.floor(Math.random() * groups.length)];
    const groupId = randomGroup.id;
    
    // الحصول على لاعبين من المجموعة
    const rpgData = getRpgData();
    const players = Object.values(rpgData.players || {}).filter(p => p.clanId === groupId);
    
    if (players.length < 3) return; // يحتاج 3 لاعبين على الأقل
    
    // توليد زعيم عشوائي
    const bossResult = spawnRandomBoss(groupId, players);
    
    if (bossResult.success && sock) {
      const boss = bossResult.boss;
      
      // إرسال صورة الزعيم مع الإعلان
      const imageUrl = 'https://s3.ezgif.com/tmp/ezgif-3ef34f0636e9f2e5.jpg';
      const caption = formatBossAnnouncement(boss);
      
      await sendImageFromUrl(sock, groupId, imageUrl, caption);
      
      console.log(`👹 تم إظهار الزعيم ${boss.name} في المجموعة ${groupId}`);
    }
  } catch (error) {
    console.error('❌ خطأ في ظهور الزعيم:', error.message);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 تنسيق إعلان الزعيم
// ═══════════════════════════════════════════════════════════════════════════════

const formatBossAnnouncement = (boss) => {
  let text = `🚨 ═══════ تحذير! ═══════ 🚨\n\n`;
  text += `${boss.emoji} **${boss.name}** - ${boss.title}\n\n`;
  text += `📊 المستوى: ${boss.level}\n`;
  text += `❤️ HP: ${boss.hp.toLocaleString()}\n`;
  text += `⚔️ ATK: ${boss.atk} | 🛡️ DEF: ${boss.def}\n\n`;
  text += `⏰ وقت التسجيل: 10 دقائق\n`;
  text += `⚔️ مدة المعركة: 20 دقيقة\n\n`;
  text += `🎁 المكافآت:\n`;
  text += `⭐ XP: ${boss.xpReward.toLocaleString()}\n`;
  text += `💰 ذهب: ${boss.goldReward.toLocaleString()}\n\n`;
  text += `📝 استخدم:\n`;
  text += `.مشاركة - للتسجيل في المعركة\n`;
  text += `.هجوم - للهجوم على الزعيم\n\n`;
  text += `> \`بــوت :\`\n`;
  text += `> _*『 FATIMA 』*_`;
  
  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 تصدير الدوال
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  resetDailyStamina,
  spawnRandomBossEvent
};
