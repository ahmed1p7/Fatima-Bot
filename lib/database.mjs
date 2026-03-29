// ═══════════════════════════════════════════════════════════════════════════════
// 📂 نظام قاعدة البيانات المتقدم - فاطمة بوت v13.0 (محدث)
// ═══════════════════════════════════════════════════════════════════════════════

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, '..', 'database');
const DB_FILE = path.join(DB_DIR, 'database.json');
const RPG_FILE = path.join(DB_DIR, 'rpg.json');

const DB_VERSION = 13; // يجب تحديثه عند إضافة تغييرات هيكلية

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 مخطط اللاعب (Player Schema)
// ═══════════════════════════════════════════════════════════════════════════════

const PLAYER_SCHEMA = {
  // ════════════════════════════════════
  // 📊 البيانات الأساسية
  // ════════════════════════════════════
  id: '',
  name: '',
  nickname: '',
  class: '',
  level: 1,
  xp: 0,
  
  // ════════════════════════════════════
  // ❤️ الإحصائيات القتالية
  // ════════════════════════════════════
  hp: 100,
  maxHp: 100,
  atk: 10,
  def: 10,
  mag: 5,
  critRate: 0.05,
  critDamage: 1.5,
  
  // ════════════════════════════════════
  // 💰 الموارد
  // ════════════════════════════════════
  gold: 100,
  gems: 0,
  elixir: 0,
  
  // ════════════════════════════════════
  // ⚡ نظام الطاقة (Stamina)
  // ════════════════════════════════════
  stamina: 10,
  maxStamina: 10,
  lastStaminaUpdate: 0,
  
  // ════════════════════════════════════
  // 🌟 نقاط القدرة والمهارات
  // ════════════════════════════════════
  abilityPoints: 0,
  skillPoints: 0,
  allocatedStats: { hp: 0, atk: 0, def: 0, mag: 0 },
  skills: [],
  unlockedSkills: { passive: [], active: [] },
  activeSkillCooldowns: {},
  
  // ════════════════════════════════════
  // 🎒 المخزون والمعدات
  // ════════════════════════════════════
  inventory: [],
  weapons: [],
  armors: [],
  equippedWeapon: null,
  equippedArmor: null,
  boxes: { common: 0, rare: 0, epic: 0, legendary: 0 },
  
  // ════════════════════════════════════
  // 📜 المهام والإنجازات
  // ════════════════════════════════════
  quests: {
    daily: [],
    weekly: [],
    monthly: []
  },
  achievements: [],
  
  // ════════════════════════════════════
  // 🏘️ الكلان
  // ════════════════════════════════════
  clanId: null,
  clanRole: null, // leader, deputy, member
  
  // ════════════════════════════════════
  // 🏰 مبنى الصنف في الكلان
  // ════════════════════════════════════
  clanBuilding: {
    type: null, // barracks, magic_tower, hospital, scout_tower
    level: 1,
    lastUpgrade: 0
  },
  
  // ════════════════════════════════════
  // ⏰ أوقات التهدئة (Cooldowns)
  // ════════════════════════════════════
  lastDaily: 0,
  lastWork: 0,
  lastFish: 0,
  lastMine: 0,
  lastHeal: 0,
  lastPvP: 0,
  lastBossAttack: 0,
  lastWarAttack: 0,
  lastHealAll: 0,
  lastRob: 0,
  lastLuck: 0,
  lastExplore: 0,
  lastTerritoryAttack: 0,
  
  // ════════════════════════════════════
  // 📊 إحصائيات قتالية
  // ════════════════════════════════════
  wins: 0,
  losses: 0,
  dailyStreak: 0,
  totalDonated: 0,
  
  // ════════════════════════════════════
  // 📈 إحصائيات تفصيلية
  // ════════════════════════════════════
  stats: {
    monstersKilled: 0,
    bossesDefeated: 0,
    totalBossDamage: 0,
    fishCaught: 0,
    mineralsMined: 0,
    boxesOpened: 0,
    weaponsUpgraded: 0,
    itemsSold: 0,
    itemsBought: 0,
    playersHealed: 0,
    healingDone: 0,
    groupHeals: 0,
    pvpWins: 0,
    pvpLosses: 0,
    successfulRobberies: 0,
    failedRobberies: 0,
    luckGamesPlayed: 0,
    luckGamesWon: 0,
    territoriesConquered: 0,
    territoryDefenses: 0
  },
  
  // ════════════════════════════════════
  // 🗡️ الجيش والوحدات
  // ════════════════════════════════════
  units: [],
  trainingQueue: [],
  maxUnits: 20,
  soldiers: 0, // الجنود المتاحين (مهم لنظام الأقاليم)
  
  // ════════════════════════════════════
  // 📅 التواريخ المهمة
  // ════════════════════════════════════
  created: 0,
  lastActive: 0
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 مخطط الكلان (Clan Schema)
// ═══════════════════════════════════════════════════════════════════════════════

const CLAN_SCHEMA = {
  id: '',
  name: '',
  tag: '',
  description: '',
  emoji: '🏰',
  
  // المستوى والخبرة
  level: 1,
  xp: 0,
  
  // الموارد
  gold: 0,
  elixir: 0,
  wood: 0,
  stone: 0,
  gems: 0,
  
  // الأعضاء
  leader: '',
  deputies: [],
  members: [],
  maxMembers: 30,
  
  // المستوطنة
  settlement: {
    castleLevel: 1,
    barracks: 0,
    magicTower: 0,
    hospital: 0,
    scoutTower: 0,
    goldMine: 0,
    elixirCollector: 0
  },
  
  // الإحصائيات
  warsWon: 0,
  warsLost: 0,
  totalDonations: 0,
  totalBossDamage: 0,
  
  // الحروب
  currentWar: null,
  warHistory: [],
  
  // الأقاليم المحتلة
  territories: [],
  
  // الشارات
  badges: [],
  
  // التواريخ
  created: 0,
  lastActive: 0
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 مخطط الإقليم (Territory Schema)
// ═══════════════════════════════════════════════════════════════════════════════

const TERRITORY_SCHEMA = {
  id: '',
  name: '',
  type: '', // mine, forest, swamp, mountain, crystal_cave
  emoji: '🗺️',
  
  // المالك
  ownerClan: null,
  conqueredAt: 0,
  
  // الحارس
  guardian: {
    name: '',
    hp: 0,
    atk: 0,
    def: 0,
    level: 1
  },
  
  // الحامية
  garrison: {
    total: 0,
    units: [] // { playerId, unitType, count }
  },
  
  // الموارد
  resources: {
    gold: 0,
    elixir: 0,
    wood: 0,
    stone: 0,
    gems: 0
  },
  
  // الإنتاج
  production: {
    goldPerHour: 0,
    elixirPerHour: 0
  },
  
  // الضرائب
  taxRate: 0.1, // 10%
  
  // التواريخ
  lastCollected: 0,
  lastAttacked: 0
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 مخطط الزعيم (Boss Schema)
// ═══════════════════════════════════════════════════════════════════════════════

const BOSS_SCHEMA = {
  id: '',
  name: '',
  emoji: '👹',
  type: '', // ground, flying, legendary
  
  // الإحصائيات
  baseHp: 1000,
  currentHp: 1000,
  atk: 100,
  def: 50,
  
  // التطور
  evolutionLevel: 1,
  
  // الحالة
  status: 'inactive', // inactive, registration, active, defeated
  group: '',
  
  // المشاركة
  registeredPlayers: [],
  playerDamage: {}, // { playerId: damageDealt }
  
  // التوقيت
  spawnedAt: 0,
  registrationEnds: 0,
  battleEnds: 0,
  
  // المكافآت
  rewards: {
    gold: 0,
    xp: 0,
    items: []
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 الأصناف (Classes)
// ═══════════════════════════════════════════════════════════════════════════════

const CLASSES = {
  'محارب': {
    emoji: '⚔️',
    hp: 150,
    atk: 15,
    def: 12,
    mag: 3,
    description: 'محارب قوي في القتال القريب',
    building: 'barracks',
    skills: ['double_strike', 'war_cry', 'berserker_rage']
  },
  'ساحر': {
    emoji: '🧙',
    hp: 80,
    atk: 8,
    def: 5,
    mag: 20,
    description: 'سيد السحر والتعويذات',
    building: 'magic_tower',
    skills: ['mana_burn', 'cursed_luck', 'frozen_spell']
  },
  'رامي': {
    emoji: '🏹',
    hp: 100,
    atk: 18,
    def: 6,
    mag: 5,
    description: 'خبير في القتال عن بعد',
    building: 'scout_tower',
    skills: ['precise_shot', 'poison_arrow', 'multi_shot']
  },
  'شافي': {
    emoji: '💚',
    hp: 90,
    atk: 5,
    def: 8,
    mag: 15,
    description: 'يستطيع علاج الزملاء',
    building: 'hospital',
    skills: ['heal', 'group_heal', 'resurrection']
  },
  'قاتل': {
    emoji: '🗡️',
    hp: 85,
    atk: 20,
    def: 4,
    mag: 6,
    description: 'سيد التخفي والضربات الحرجة',
    building: 'scout_tower',
    skills: ['stealth', 'backstab', 'poison_blade']
  },
  'فارس': {
    emoji: '🛡️',
    hp: 200,
    atk: 12,
    def: 18,
    mag: 2,
    description: 'درع الحماية للفريق',
    building: 'barracks',
    skills: ['shield_wall', 'taunt', 'iron_will']
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 شجرة المهارات (Skill Trees)
// ═══════════════════════════════════════════════════════════════════════════════

const SKILL_TREES = {
  // القدرات السحرية
  magic: {
    'mana_burn': {
      name: 'سرقة المانا',
      type: 'active',
      description: 'حرق طاقة الخصم ومنعه من استخدام مهاراته',
      cost: 2,
      cooldown: 60,
      effect: { staminaDrain: 3 }
    },
    'cursed_luck': {
      name: 'الحظ الملعون',
      type: 'passive',
      description: 'زيادة فرصة فشل ضربة الخصم',
      cost: 3,
      effect: { enemyFailChance: 0.15 }
    },
    'time_rewind': {
      name: 'التجدد الزمني',
      type: 'passive',
      description: 'استعادة HP كبيرة عند الموت (مرة واحدة)',
      cost: 5,
      effect: { reviveHp: 0.5 }
    },
    'bounty_aura': {
      name: 'سحر البركة',
      type: 'passive',
      description: 'زيادة فرصة سقوط صناديق أسطورية',
      cost: 4,
      effect: { boxDropBonus: 0.2 }
    }
  },
  
  // القدرات الجسدية
  physical: {
    'lifesteal': {
      name: 'الاستنزاف',
      type: 'passive',
      description: 'استعادة نسبة من HP مع كل ضربة',
      cost: 3,
      effect: { lifestealPercent: 0.15 }
    },
    'berserk_mode': {
      name: 'التحمل المتفجر',
      type: 'passive',
      description: 'زيادة ضرر كبيرة عند انخفاض HP تحت 30%',
      cost: 4,
      effect: { lowHpDamageBoost: 0.5 }
    },
    'armor_penetration': {
      name: 'الاختراق',
      type: 'passive',
      description: 'تجاهل جزء من دفاع الخصم',
      cost: 3,
      effect: { armorPenetration: 0.25 }
    },
    'auto_shield': {
      name: 'الدرع التلقائي',
      type: 'active',
      description: 'تفعيل درع يقلل الضرر لمدة 3 ثوانٍ',
      cost: 2,
      cooldown: 45,
      effect: { damageReduction: 0.4, duration: 3 }
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 الصناديق (Boxes)
// ═══════════════════════════════════════════════════════════════════════════════

const BOXES = {
  common: {
    name: 'شائع',
    emoji: '⚪',
    price: 100,
    color: '⚪',
    dropRate: 0.70,
    rewards: {
      gold: [50, 200],
      items: ['جرعة صغيرة', 'خشب', 'حجر']
    }
  },
  rare: {
    name: 'نادر',
    emoji: '🔵',
    price: 500,
    color: '🔵',
    dropRate: 0.20,
    rewards: {
      gold: [200, 500],
      items: ['سيف حديدي', 'درع خفيف', 'جرعة متوسطة']
    }
  },
  epic: {
    name: 'ملحمي',
    emoji: '🟣',
    price: 2000,
    color: '🟣',
    dropRate: 0.08,
    rewards: {
      gold: [500, 2000],
      items: ['لفافة مهارة', 'سيف فولاذي', 'درع ثقيل', 'جرعة كبيرة']
    }
  },
  legendary: {
    name: 'أسطوري',
    emoji: '🟡',
    price: 10000,
    color: '🟡',
    dropRate: 0.02,
    rewards: {
      gold: [2000, 10000],
      items: ['سيف إيغريس', 'قوس ملك النمل', 'جرعة XP', 'سلاح فريد']
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 قاعدة البيانات (مخزنة في الذاكرة)
// ═══════════════════════════════════════════════════════════════════════════════

let database = {
  users: {},
  groups: {},
  settings: { prefix: '.' },
  stats: { commands: 0, messages: 0, startTime: Date.now() },
  version: DB_VERSION
};

let rpgData = {
  players: {},
  clans: {},
  territories: {},
  activeBoss: null,
  activeMonsters: {},
  market: { offers: [], history: [] },
  version: DB_VERSION
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 دوال مساعدة داخلية
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * نسخ عميق للكائنات
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * دمج عميق: يضيف مفاتيح من المصدر إلى الهدف دون إزالة المفاتيح الموجودة
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else if (result[key] === undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * تنظيف الكائن من الحقول الزائدة عن السكيما
 */
function cleanObject(obj, schema) {
  const result = {};
  for (const [key, defaultValue] of Object.entries(schema)) {
    if (obj[key] !== undefined) {
      if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
        result[key] = cleanObject(obj[key], defaultValue);
      } else {
        result[key] = obj[key];
      }
    } else {
      result[key] = deepClone(defaultValue);
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 ترقية اللاعب والكلان والإقليم
// ═══════════════════════════════════════════════════════════════════════════════

function migratePlayer(player, id) {
  if (!player || typeof player !== 'object') return null;
  // دمج مع السكيما أولاً
  const merged = deepMerge(deepClone(PLAYER_SCHEMA), player);
  // تنظيف الحقول الزائدة
  const cleaned = cleanObject(merged, PLAYER_SCHEMA);
  cleaned.id = id;
  
  // إصلاحات إضافية
  if (cleaned.hp <= 0) cleaned.hp = cleaned.maxHp;
  if (cleaned.level < 1) cleaned.level = 1;
  if (cleaned.gold < 0) cleaned.gold = 0;
  if (cleaned.stamina < 0) cleaned.stamina = 10;
  
  // التأكد من وجود soldiers (للتوافق مع نظام الأقاليم)
  if (cleaned.soldiers === undefined) cleaned.soldiers = 0;
  
  return cleaned;
}

function migrateClan(clan, id) {
  if (!clan || typeof clan !== 'object') return null;
  const merged = deepMerge(deepClone(CLAN_SCHEMA), clan);
  const cleaned = cleanObject(merged, CLAN_SCHEMA);
  cleaned.id = id;
  return cleaned;
}

function migrateTerritory(territory, id) {
  if (!territory || typeof territory !== 'object') return null;
  const merged = deepMerge(deepClone(TERRITORY_SCHEMA), territory);
  const cleaned = cleanObject(merged, TERRITORY_SCHEMA);
  cleaned.id = id;
  return cleaned;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 ترقية البيانات حسب الإصدار (تُنفذ مرة واحدة فقط)
// ═══════════════════════════════════════════════════════════════════════════════

let migrationDone = false;

function migrateData() {
  if (migrationDone) return;
  
  const currentVersion = rpgData.version || 0;
  if (currentVersion >= DB_VERSION) {
    migrationDone = true;
    return;
  }
  
  console.log(`🔄 ترقية قاعدة البيانات من الإصدار ${currentVersion} إلى ${DB_VERSION}`);
  
  // ترقية اللاعبين
  if (rpgData.players) {
    for (const [id, player] of Object.entries(rpgData.players)) {
      rpgData.players[id] = migratePlayer(player, id);
    }
  }
  
  // ترقية الكلانات
  if (rpgData.clans) {
    for (const [id, clan] of Object.entries(rpgData.clans)) {
      rpgData.clans[id] = migrateClan(clan, id);
    }
  }
  
  // ترقية الأقاليم
  if (rpgData.territories) {
    for (const [id, territory] of Object.entries(rpgData.territories)) {
      rpgData.territories[id] = migrateTerritory(territory, id);
    }
  }
  
  // تحديث الإصدار
  database.version = DB_VERSION;
  rpgData.version = DB_VERSION;
  migrationDone = true;
  
  // حفظ التغييرات
  saveDB().catch(e => console.error('خطأ في حفظ بعد الترقية:', e.message));
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📥 تحميل قاعدة البيانات (غير متزامن)
// ═══════════════════════════════════════════════════════════════════════════════

let initialLoadDone = false;

async function loadDB() {
  try {
    // إنشاء المجلد إذا لم يكن موجوداً
    await fs.mkdir(DB_DIR, { recursive: true });
    
    // تحميل database.json
    try {
      const data = await fs.readFile(DB_FILE, 'utf-8');
      const loaded = JSON.parse(data);
      database = deepMerge(database, loaded);
    } catch (err) {
      if (err.code !== 'ENOENT') console.log('⚠️ خطأ في تحميل database.json:', err.message);
    }
    
    // تحميل rpg.json
    try {
      const data = await fs.readFile(RPG_FILE, 'utf-8');
      const loaded = JSON.parse(data);
      rpgData = deepMerge(rpgData, loaded);
    } catch (err) {
      if (err.code !== 'ENOENT') console.log('⚠️ خطأ في تحميل rpg.json:', err.message);
    }
    
    // ترقية البيانات إذا لزم الأمر
    migrateData();
    
    initialLoadDone = true;
  } catch (err) {
    console.error('❌ فشل تحميل قاعدة البيانات:', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💾 حفظ قاعدة البيانات (غير متزامن مع تجميع الكتابات وقفل)
// ═══════════════════════════════════════════════════════════════════════════════

let writeQueue = Promise.resolve();
let pendingWrite = false;

async function saveDB() {
  if (!initialLoadDone) {
    // انتظر حتى اكتمال التحميل الأولي
    await new Promise(resolve => {
      const check = setInterval(() => {
        if (initialLoadDone) {
          clearInterval(check);
          resolve();
        }
      }, 10);
    });
  }
  
  // تجميع الكتابات: إذا كان هناك طلب قيد التنفيذ، نعدل الملفات فقط بعد انتهاء الطلب الحالي
  if (pendingWrite) return;
  pendingWrite = true;
  
  writeQueue = writeQueue
    .then(async () => {
      try {
        // كتابة الملفين بشكل متوازي
        await Promise.all([
          fs.writeFile(DB_FILE, JSON.stringify(database, null, 2)),
          fs.writeFile(RPG_FILE, JSON.stringify(rpgData, null, 2))
        ]);
      } catch (err) {
        console.error('⚠️ خطأ في حفظ قاعدة البيانات:', err.message);
      } finally {
        pendingWrite = false;
      }
    })
    .catch(err => console.error('خطأ في قائمة الكتابة:', err));
  
  return writeQueue;
}

// بدء التحميل
loadDB().catch(console.error);

// حفظ تلقائي كل 30 ثانية (نستخدم saveDB غير المتزامن)
setInterval(() => {
  saveDB().catch(e => console.error('خطأ في الحفظ التلقائي:', e.message));
}, 30000);

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 دوال عامة للوصول إلى البيانات
// ═══════════════════════════════════════════════════════════════════════════════

export const getDatabase = () => database;
export const getRpgData = () => rpgData;
export const saveDatabase = saveDB; // الحفاظ على الواجهة القديمة (تعمل بشكل غير متزامن)

/**
 * إنشاء لاعب جديد
 */
export const createNewPlayer = (id, name, cls) => {
  const classData = CLASSES[cls];
  if (!classData) return null;
  
  const player = deepClone(PLAYER_SCHEMA);
  player.id = id;
  player.name = name;
  player.class = cls;
  player.hp = classData.hp;
  player.maxHp = classData.hp;
  player.atk = classData.atk;
  player.def = classData.def;
  player.mag = classData.mag;
  player.created = Date.now();
  player.lastActive = Date.now();
  player.lastStaminaUpdate = Date.now();
  player.clanBuilding.type = classData.building;
  player.skills = classData.skills.slice(0, 1);
  
  return player;
};

/**
 * تأكيد أن اللاعب يطابق السكيما (ترقية)
 */
export const ensurePlayer = (player, id) => migratePlayer(player, id);

/**
 * الحصول على لاعب مع ترقية تلقائية
 */
export const getPlayer = (id) => {
  const data = getRpgData();
  if (!data.players[id]) return null;
  return ensurePlayer(data.players[id], id);
};

/**
 * الحصول على كلان مع ترقية تلقائية
 */
export const getClan = (id) => {
  const data = getRpgData();
  if (!data.clans[id]) return null;
  return migrateClan(data.clans[id], id);
};

/**
 * الحصول على إقليم مع ترقية تلقائية
 */
export const getTerritory = (id) => {
  const data = getRpgData();
  if (!data.territories[id]) return null;
  return migrateTerritory(data.territories[id], id);
};

// دوال للحصول على السكيما
export const getPlayerSchema = () => deepClone(PLAYER_SCHEMA);
export const getClanSchema = () => deepClone(CLAN_SCHEMA);
export const getTerritorySchema = () => deepClone(TERRITORY_SCHEMA);

// تصدير الثوابت
export { 
  CLASSES, 
  SKILL_TREES, 
  BOXES,
  PLAYER_SCHEMA,
  CLAN_SCHEMA,
  TERRITORY_SCHEMA,
  BOSS_SCHEMA
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 دوال إضافية للصيانة
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ترقية جميع البيانات إجبارياً (للاستخدام في حالات الضرورة)
 */
export const forceMigrateAll = () => {
  migrationDone = false;
  migrateData();
  saveDB().catch(e => console.error(e));
  return true;
};

/**
 * إضافة حقل جديد لجميع اللاعبين (تستخدم لتوسيع السكيما)
 */
export const addFieldToAllPlayers = (fieldPath, defaultValue) => {
  const data = getRpgData();
  if (!data.players) return 0;
  
  const pathParts = fieldPath.split('.');
  let count = 0;
  
  for (const player of Object.values(data.players)) {
    if (!player) continue;
    let current = player;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!current[part]) current[part] = {};
      current = current[part];
    }
    const lastPart = pathParts[pathParts.length - 1];
    if (current[lastPart] === undefined) {
      current[lastPart] = defaultValue;
      count++;
    }
  }
  
  saveDB().catch(e => console.error(e));
  return count;
};

/**
 * حذف حقل من جميع اللاعبين
 */
export const removeFieldFromAllPlayers = (fieldPath) => {
  const data = getRpgData();
  if (!data.players) return 0;
  
  const pathParts = fieldPath.split('.');
  let count = 0;
  
  for (const player of Object.values(data.players)) {
    if (!player) continue;
    let current = player;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!current[part]) break;
      current = current[part];
    }
    const lastPart = pathParts[pathParts.length - 1];
    if (current && current[lastPart] !== undefined) {
      delete current[lastPart];
      count++;
    }
  }
  
  saveDB().catch(e => console.error(e));
  return count;
};
