/**
 * ai_module.js
 * وحدة الذكاء الاصطناعي التفاعلي "فاطمة"
 * الميزات: شخصية تفاعلية، تعلم عن الأعضاء، مساعدة RPG، تفاعل جماعي
 */

const fs = require('fs');
const path = require('path');

// مسار ملفات البيانات
const DATA_PATH = path.join(__dirname, 'data', 'ai_data.json');

// حالة الذكاء الاصطناعي
let aiState = {
    members: {}, // لتخزين بيانات الأعضاء وتعلم اهتماماتهم
    chatContext: {}, // لتخزين سياق المحادثات (آخر 5 رسائل لكل مجموعة)
    fatimaLevel: 1,
    fatimaXp: 0,
    personality: {
        name: "فاطمة",
        tone: "friendly", // friendly, serious, funny
        interests: ["games", "clans", "strategy"]
    }
};

// تحميل البيانات المحفوظة
function loadAiData() {
    try {
        if (fs.existsSync(DATA_PATH)) {
            const data = fs.readFileSync(DATA_PATH);
            aiState = JSON.parse(data);
            console.log(`[AI] تم تحميل بيانات فاطمة بنجاح. المستوى: ${aiState.fatimaLevel}`);
        }
    } catch (error) {
        console.error('[AI] خطأ في تحميل البيانات:', error);
    }
}

// حفظ البيانات
function saveAiData() {
    try {
        const dir = path.dirname(DATA_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_PATH, JSON.stringify(aiState, null, 2));
    } catch (error) {
        console.error('[AI] خطأ في حفظ البيانات:', error);
    }
}

// تحليل الرسالة وتعلم معلومات جديدة عن العضو
function learnFromMessage(userId, userName, text, groupId) {
    if (!aiState.members[userId]) {
        aiState.members[userId] = {
            name: userName,
            interactions: 0,
            interests: [],
            playStyle: 'unknown',
            lastActive: new Date()
        };
    }

    const member = aiState.members[userId];
    member.interactions++;
    member.lastActive = new Date();

    // تحليل بسيط للكلمات المفتاحية للتعلم
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('حرب') || lowerText.includes('قتال') || lowerText.includes('pk')) {
        if (!member.interests.includes('combat')) member.interests.push('combat');
        member.playStyle = 'aggressive';
    } else if (lowerText.includes('تجارة') || lowerText.includes('ذهب') || lowerText.includes('سوق')) {
        if (!member.interests.includes('economy')) member.interests.push('economy');
        member.playStyle = 'merchant';
    } else if (lowerText.includes('كلان') || lowerText.includes('أعضاء') || lowerText.includes('إدارة')) {
        if (!member.interests.includes('leadership')) member.interests.push('leadership');
        member.playStyle = 'leader';
    }

    // زيادة خبرة فاطمة مع كل تفاعل
    gainFatimaXp(5);
    saveAiData();
}

// زيادة مستوى فاطمة
function gainFatimaXp(amount) {
    aiState.fatimaXp += amount;
    if (aiState.fatimaXp >= aiState.fatimaLevel * 100) {
        aiState.fatimaLevel++;
        aiState.fatimaXp = 0;
        console.log(`[AI] 🎉 فاطمة وصلت للمستوى ${aiState.fatimaLevel}!`);
        return true; // Level up occurred
    }
    return false;
}

// توليد رد ذكي بناءً على السياق والمحتوى
async function generateResponse(message, groupId, senderId, senderName) {
    const text = message.body.toLowerCase();
    
    // تحديث سياق المحادثة
    if (!aiState.chatContext[groupId]) {
        aiState.chatContext[groupId] = [];
    }
    aiState.chatContext[groupId].push({
        sender: senderName,
        text: text,
        timestamp: new Date()
    });
    // الاحتفاظ بآخر 10 رسائل فقط للسياق
    if (aiState.chatContext[groupId].length > 10) {
        aiState.chatContext[groupId].shift();
    }

    // 1. الردود المباشرة والأسئلة الشائعة (RPG & Clan Help)
    if (text.includes('كيف ارفع مستواي') || text.includes('نصائح للمستويات')) {
        return `🌟 أهلاً يا ${senderName}! لرفع مستواك بسرعة:
1. شارك في حروب الكلانات يومياً.
2. اكمل المهام اليومية والأسبوعية.
3. تدرب في ساحة القتال ضد الوحوش.
هل تريد نصيحة لمعدات محددة؟`;
    }

    if (text.includes('أفضل معدات') || text.includes('equipment')) {
        return `⚔️ بالنسبة للمعدات، يعتمد ذلك على صنفك:
- المحاربون: ابحثوا عن سيوف تزيد القوة والهجوم.
- الرماة: قوس سريع مع زيادة الدقة.
- السحرة: عصا تزيد من طاقة السحر.
يمكنك فحص السوق أو طلب مساعدة من قائد كلانك!`;
    }

    if (text.includes('كيف انشئ كلان') || text.includes('انشاء كلان')) {
        return `🏰 لإنشاء كلان جديد، استخدم الأمر:
`.انشاء_كلان <اسم الكلان>
تأكد من وجود الذهب الكافي لديك (1000 ذهب) وأنك لا تنتمي لكلان آخر!`;
    }

    // 2. التفاعل الاجتماعي والتهنئة
    if (text.includes('مبروك') || text.includes('فزن') || text.includes('انتصرنا')) {
        const responses = [
            `🎉 مبروك يا أبطال! فوز مستحق لـ ${senderName} والكلان!`,
            `🔥 أداء رائع! فاطمة فخورة بكم يا رفاق!`,
            `🏆 الانتصار حليفكم دائماً! هيا للاحتفال!`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    if (text.includes('حزين') || text.includes('خسرنا') || text.includes('تعبان')) {
        return `💙 لا بأس يا ${senderName}، الخسارة جزء من الطريق للنصر. استرحوا وحاولوا مرة أخرى، فاطمة تؤمن بكم!`;
    }

    // 3. التفاعل العشوائي (كعضو في المجموعة)
    // نسبة 5% للرد العشوائي إذا لم يكن هناك أمر محدد
    if (Math.random() < 0.05 && text.length > 10 && !text.startsWith('.')) {
        const casualResponses = [
            "حديثكم ممتع جداً اليوم! 😊",
            "هل جهزتم أنفسكم للحرب القادمة؟ ⚔️",
            "فاطومة تراقب الأداء وتقول: أنتم الأفضل! 🌟",
            "أي أحد جاهز لتحدي جديد؟ 🤔"
        ];
        return casualResponses[Math.floor(Math.random() * casualResponses.length)];
    }

    // 4. ردود حسب اهتمامات العضو (مخصصة)
    const memberData = aiState.members[senderId];
    if (memberData && memberData.interests.includes('combat') && text.includes('استراتيجية')) {
        return `بما أنك محارب شرس يا ${senderName}، أنصحك بالهجوم السريع والتركيز على إضعاف خصومك الرئيسيين أولاً!`;
    }

    return null; // لا يوجد رد مناسب
}

// معالجة الأحداث الخاصة بالحروب
function onWarEvent(eventType, clanName, details) {
    let message = "";
    if (eventType === 'war_start') {
        message = `⚔️ بدأت الحرب بين ${clanName} وخصومهم! فاطمة تتمنى لهم التوفيق! قاتلوا بشرف!`;
    } else if (eventType === 'war_win') {
        message = `🏆 انتصار ساحق لـ ${clanName}! فاطمة ترقص فرحاً ببطولاتكم!`;
    } else if (eventType === 'war_loss') {
        message = `💙 معركة صعبة لـ ${clanName}. لا بأس، ستعودون أقوى! فاطمة معكم.`;
    }
    return message;
}

// تهيئة الوحدة
loadAiData();

module.exports = {
    learnFromMessage,
    generateResponse,
    onWarEvent,
    getFatimaStatus: () => ({
        level: aiState.fatimaLevel,
        xp: aiState.fatimaXp,
        totalMembersTracked: Object.keys(aiState.members).length
    }),
    saveAiData
};