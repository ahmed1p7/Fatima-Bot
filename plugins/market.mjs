// ═══════════════════════════════════════════════════════════════════════════════
// 🛒 أوامر السوق المفتوح
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from '../lib/database.mjs';
import { getSellPrice } from '../lib/rpg.mjs';
import {
  createOffer, buyFromMarket, cancelOffer,
  getMarketOffers, getMyOffers, generatePurchaseCode,
  formatOfferForChannel, MARKET_CHANNEL
} from '../lib/market.mjs';

export default {
  name: 'Market',
  commands: [
    'السوق', 'market',
    'عرض', 'offer', 'بيع_سوق',
    'شراء_سوق', 'buy',
    'عروضي', 'myoffers',
    'إلغاء_عرض', 'canceloffer',
    'مخزوني', 'inv'
  ],

  async execute(sock, msg, ctx) {
    const { from, sender, pushName, command, args, text, prefix } = ctx;
    const data = getRpgData();
    const player = data.players?.[sender];

    // ═══════════════════════════════════════════════════════════════════════════
    // عرض السوق
    // ═══════════════════════════════════════════════════════════════════════════
    if (['السوق', 'market'].includes(command)) {
      const offers = getMarketOffers(15);

      if (offers.length === 0) {
        return sock.sendMessage(from, { text: `🛒 السوق المفتوح

❌ لا توجد عروض حالياً!

💡 كيفية البيع:
${prefix}عرض <رقم_العنصر> <السعر>

📋 ${prefix}مخزوني - لمعرفة العناصر` });
      }

      const offersList = offers.map((o, i) => {
        const item = o.item;
        const rarityEmoji = item.rarity === 'أسطوري' ? '🟡' : item.rarity === 'ملحمي' ? '🟣' : item.rarity === 'نادر' ? '🔵' : '⚪';
        const typeEmoji = item.type === 'weapon' ? '⚔️' : '🛡️';
        const stat = item.atk ? `⚔️${item.atk}` : `🛡️${item.def}`;

        return `${i + 1}. ${typeEmoji} ${item.fullName} [${rarityEmoji}]
   📊 ${stat} | 💰 ${o.price.toLocaleString()}
   🆔 ${o.code}`;
      }).join('\n\n');

      return sock.sendMessage(from, { text: `🛒 ═══════ السوق المفتوح ═══════ 🛒

${offersList}

━━━━━━━━━━━━━━━━━━━━

💡 ${prefix}شراء_سوق <الكود>
📋 ${prefix}مخزوني - عرض عناصرك
💰 ${prefix}عرض - بيع عنصر` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // مخزوني
    // ═══════════════════════════════════════════════════════════════════════════
    if (['مخزوني', 'inv'].includes(command)) {
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const weapons = player.weapons || [];
      const armors = player.armors || [];

      if (weapons.length === 0 && armors.length === 0) {
        return sock.sendMessage(from, { text: '❌ مخزونك فارغ!\n💡 اشترِ صندوق أولاً' });
      }

      let list = '';

      if (weapons.length > 0) {
        list += '⚔️ الأسلحة:\n';
        list += weapons.map((w, i) => {
          const rarityEmoji = w.rarity === 'أسطوري' ? '🟡' : w.rarity === 'ملحمي' ? '🟣' : w.rarity === 'نادر' ? '🔵' : '⚪';
          return `${i + 1}. ${w.fullName} [${rarityEmoji}] ⚔️${w.atk} Lv.${w.level}`;
        }).join('\n');
        list += '\n\n';
      }

      if (armors.length > 0) {
        list += '🛡️ الدروع:\n';
        list += armors.map((a, i) => {
          const rarityEmoji = a.rarity === 'أسطوري' ? '🟡' : a.rarity === 'ملحمي' ? '🟣' : a.rarity === 'نادر' ? '🔵' : '⚪';
          return `${weapons.length + i + 1}. ${a.fullName} [${rarityEmoji}] 🛡️${a.def} Lv.${a.level}`;
        }).join('\n');
      }

      return sock.sendMessage(from, { text: `🎒 مخزونك:\n\n${list}\n━━━━━━━━━━━━\n💡 ${prefix}عرض <رقم> <سعر> - بيع في السوق\n💡 ${prefix}بيع <رقم> - بيع للبوت` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // إنشاء عرض
    // ═══════════════════════════════════════════════════════════════════════════
    if (['عرض', 'offer', 'بيع_سوق'].includes(command)) {
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const itemNum = parseInt(args[0]);
      const price = parseInt(args[1]);

      if (!itemNum || !price) {
        return sock.sendMessage(from, { text: `❌ حدد العنصر والسعر!\n💡 ${prefix}عرض 1 5000\n📋 ${prefix}مخزوني - لمعرفة الأرقام` });
      }

      // البحث عن العنصر
      const weapons = player.weapons || [];
      const armors = player.armors || [];
      const allItems = [...weapons, ...armors];

      if (itemNum < 1 || itemNum > allItems.length) {
        return sock.sendMessage(from, { text: '❌ رقم العنصر غير صحيح!' });
      }

      const item = allItems[itemNum - 1];

      // إنشاء العرض
      const result = createOffer(sender, pushName, { id: item.id, name: item.fullName }, price);

      if (!result.success) {
        return sock.sendMessage(from, { text: result.message });
      }

      // تنسيق رسالة العرض
      const offerMsg = formatOfferForChannel(result.offer);

      return sock.sendMessage(from, { text: `✅ تم إنشاء عرضك!

${offerMsg}

📢 العرض منشور في قناة السوق!
⏰ صالح لمدة 24 ساعة` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // شراء من السوق
    // ═══════════════════════════════════════════════════════════════════════════
    if (['شراء_سوق', 'buy'].includes(command)) {
      if (!player) return sock.sendMessage(from, { text: '❌ سجل أولاً!' });

      const code = args[0]?.toUpperCase();
      if (!code) {
        return sock.sendMessage(from, { text: `❌ حدد كود الشراء!\n💡 ${prefix}شراء_سوق B-ABC\n📋 ${prefix}السوق - لمعرفة الأكواد` });
      }

      // رسالة قابلة للتحديث
      let message = await sock.sendMessage(from, { text: '⏳ جاري المعالجة...' });

      const result = buyFromMarket(sender, pushName, code);

      if (!result.success) {
        return sock.sendMessage(from, { text: result.message });
      }

      // إرسال رسالة للمشتري
      await sock.sendMessage(from, {
        text: `✅ تم الشراء بنجاح!

🎁 حصلت على: ${result.item.fullName}
💰 دفعت: ${result.price.toLocaleString()} ذهب

📊 ${result.item.atk ? `⚔️ ${result.item.atk}` : `🛡️ ${result.item.def}`}`,
        edit: message.key
      });

      // إرسال إشعار للبائع في الخاص
      try {
        await sock.sendMessage(result.sellerId, {
          text: `💰 تم بيع عنصرك!

📦 ${result.item.fullName}
💵 بمبلغ: ${result.price.toLocaleString()} ذهب

👤 المشتري: ${pushName}`
        });
      } catch (e) {
        // قد يكون البائع مغلق الخاص
      }

      return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // عروضي
    // ═══════════════════════════════════════════════════════════════════════════
    if (['عروضي', 'myoffers'].includes(command)) {
      const offers = getMyOffers(sender);

      if (offers.length === 0) {
        return sock.sendMessage(from, { text: '❌ لا توجد عروض لك!' });
      }

      const list = offers.map((o, i) => {
        const item = o.item;
        const typeEmoji = item.type === 'weapon' ? '⚔️' : '🛡️';
        const remaining = Math.max(0, o.expiresAt - Date.now());
        const hours = Math.floor(remaining / 3600000);

        return `${i + 1}. ${typeEmoji} ${item.fullName}
   💰 ${o.price.toLocaleString()} | ⏰ ${hours}س
   🆔 ${o.code}`;
      }).join('\n\n');

      return sock.sendMessage(from, { text: `📋 عروضك:\n\n${list}\n\n❌ ${prefix}إلغاء_عرض <الكود>` });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // إلغاء عرض
    // ═══════════════════════════════════════════════════════════════════════════
    if (['إلغاء_عرض', 'canceloffer'].includes(command)) {
      const code = args[0]?.toUpperCase();
      if (!code) {
        return sock.sendMessage(from, { text: '❌ حدد كود العرض!' });
      }

      const result = cancelOffer(sender, code);
      return sock.sendMessage(from, { text: result.success ? result.message : result.message });
    }
  }
};
