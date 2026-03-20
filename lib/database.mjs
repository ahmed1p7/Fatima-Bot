// ═══════════════════════════════════════════════════════════════════════════════
// 📂 نظام قاعدة البيانات مع الترقية التلقائية
// ═══════════════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, '..', 'database');
const DB_FILE = path.join(DB_DIR, 'database.json');
const RPG_FILE = path.join(DB_DIR, 'rpg.json');

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 نظام الترقية التلقائية (Migration)
// ═══════════════════════════════════════════════════════════════════════════════

const DB_VERSION = 11; // رقم إصدار قاعدة البيانات

// القيم الافتراضية للاعب الجديد
const DEFAULT_PLAYER = {
  level: 1,
  xp: 0,
  gold: 100,
  hp: 100,
  maxHp: 100,
  atk: 10,
  def: 10,
  mag: 5,
  skills: [],
  inventory: [],
  weapons: [],
  armors: [],
  wins: 0,
  losses: 0,
  created: 0,
  lastDaily: 0,
  lastWork: 0,
  lastFish: 0,
  lastMine: 0,
  lastWarAttack: 0,
  lastHeal: 0,
  lastPvP: 0,
  totalDonated: 0,
  clanId: null,
  achievements: [],
  stats: {
    monstersKilled: 0,
    fishCaught: 0,
    mineralsMined: 0,
    boxesOpened: 0,
    weaponsUpgraded: 0,
    itemsSold: 0,
    itemsBought: 0
  }
};

// القيم الافتراضية للكلان
const DEFAULT_CLAN = {
  id: null,
  name: '',
  clanTag: '####',
  level: 1,
  xp: 0,
  gold: 0,
  leader: null,
  deputies: [],
  members: [],
  memberCount: 0,
  wins: 0,
  losses: 0,
  totalDonations: 0,
  announcement: '',
  events: [],
  lastWar: 0,
  created: 0
};

// ترقية بيانات اللاعب
function migratePlayer(player, id) {
  if (!player) return null;

  const migrated = { ...player };
  let updated = false;

  // إضافة الحقول الناقصة
  for (const [key, value] of Object.entries(DEFAULT_PLAYER)) {
    if (migrated[key] === undefined) {
      migrated[key] = typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : value;
      updated = true;
    }
  }

  // ترقية الحقول المتداخلة (stats)
  if (!migrated.stats) migrated.stats = {};
  for (const [key, value] of Object.entries(DEFAULT_PLAYER.stats)) {
    if (migrated.stats[key] === undefined) {
      migrated.stats[key] = value;
      updated = true;
    }
  }

  // إصلاح الحقول التالفة
  if (!Array.isArray(migrated.weapons)) { migrated.weapons = []; updated = true; }
  if (!Array.isArray(migrated.armors)) { migrated.armors = []; updated = true; }
  if (!Array.isArray(migrated.inventory)) { migrated.inventory = []; updated = true; }
  if (!Array.isArray(migrated.skills)) { migrated.skills = []; updated = true; }
  if (!Array.isArray(migrated.achievements)) { migrated.achievements = []; updated = true; }

  // إصلاح القيم الخاطئة
  if (migrated.hp <= 0) { migrated.hp = migrated.maxHp; updated = true; }
  if (migrated.level < 1) { migrated.level = 1; updated = true; }
  if (migrated.gold < 0) { migrated.gold = 0; updated = true; }

  // التأكد من وجود id و name
  if (!migrated.id) { migrated.id = id; updated = true; }

  if (updated) {
    console.log(`🔄 تم تحديث بيانات اللاعب: ${migrated.name || id}`);
  }

  return migrated;
}

// ترقية بيانات الكلان
function migrateClan(clan, id) {
  if (!clan) return null;

  const migrated = { ...clan };
  let updated = false;

  for (const [key, value] of Object.entries(DEFAULT_CLAN)) {
    if (migrated[key] === undefined) {
      migrated[key] = typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : value;
      updated = true;
    }
  }

  // إصلاح الحقول
  if (!Array.isArray(migrated.members)) { migrated.members = []; updated = true; }
  if (!Array.isArray(migrated.deputies)) { migrated.deputies = []; updated = true; }
  if (!Array.isArray(migrated.events)) { migrated.events = []; updated = true; }
  
  // إضافة ID للكلانات التي لا تملك ID
  if (!migrated.id) { 
    migrated.id = id; 
    updated = true; 
  }
  
  // توليد clanTag من 4 أرقام إذا لم يكن موجوداً
  if (!migrated.clanTag) {
    migrated.clanTag = String(Math.floor(1000 + Math.random() * 9000));
    updated = true;
  }
  
  migrated.memberCount = migrated.members.length;

  if (updated) {
    console.log(`🔄 تم تحديث بيانات الكلان: ${migrated.name || id}`);
  }

  return migrated;
}

// ترقية السوق
function migrateMarket(market) {
  const defaultMarket = { storage: {}, offers: [] };
  const migrated = { ...defaultMarket, ...market };

  if (!migrated.storage) migrated.storage = {};
  if (!migrated.offers) migrated.offers = [];
  if (!Array.isArray(migrated.offers)) migrated.offers = [];

  return migrated;
}

// ═══════════════════════════════════════════════════════════════════════════════

let database = {
  users: {},
  settings: { prefix: '.' },
  stats: { commands: 0, messages: 0, startTime: Date.now() },
  version: DB_VERSION
};

let rpgData = {
  players: {},
  clans: {},
  market: { storage: {}, offers: [] },
  version: DB_VERSION
};

function loadDB() {
  try {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

    // تحميل قاعدة البيانات الرئيسية
    if (fs.existsSync(DB_FILE)) {
      const loaded = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      database = { ...database, ...loaded };
    }

    // تحميل بيانات RPG
    if (fs.existsSync(RPG_FILE)) {
      const loaded = JSON.parse(fs.readFileSync(RPG_FILE, 'utf-8'));
      rpgData = { ...rpgData, ...loaded };
    }

    // 🔄 ترقية البيانات تلقائياً
    migrateData();

  } catch (e) {
    console.log('⚠️ خطأ في تحميل قاعدة البيانات:', e.message);
  }
}

// ترقية جميع البيانات
function migrateData() {
  let migrated = false;

  // ترقية اللاعبين
  if (rpgData.players) {
    for (const [id, player] of Object.entries(rpgData.players)) {
      const mp = migratePlayer(player, id);
      if (mp !== player) {
        rpgData.players[id] = mp;
        migrated = true;
      }
    }
  }

  // ترقية الكلانات
  if (rpgData.clans) {
    for (const [id, clan] of Object.entries(rpgData.clans)) {
      const mc = migrateClan(clan, id);
      if (mc !== clan) {
        rpgData.clans[id] = mc;
        migrated = true;
      }
    }
  }

  // ترقية السوق
  rpgData.market = migrateMarket(rpgData.market || {});

  // تحديث رقم الإصدار
  if (database.version !== DB_VERSION || rpgData.version !== DB_VERSION) {
    database.version = DB_VERSION;
    rpgData.version = DB_VERSION;
    migrated = true;
  }

  if (migrated) {
    console.log('🔄 تم ترقية قاعدة البيانات للإصدار', DB_VERSION);
    saveDB();
  }
}

function saveDB() {
  try {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2));
    fs.writeFileSync(RPG_FILE, JSON.stringify(rpgData, null, 2));
  } catch (e) {
    console.log('⚠️ خطأ في حفظ قاعدة البيانات:', e.message);
  }
}

loadDB();
setInterval(saveDB, 30000);

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 التصدير
// ═══════════════════════════════════════════════════════════════════════════════

export const getDatabase = () => database;
export const getRpgData = () => rpgData;
export const saveDatabase = saveDB;
export const updateDatabase = (d) => { database = { ...database, ...d }; };
export const updateRpgData = (d) => { rpgData = { ...rpgData, ...d }; };

// دالة لإنشاء لاعب جديد مع القيم الافتراضية
export const createNewPlayer = (id, name, cls, classData) => {
  return {
    ...DEFAULT_PLAYER,
    id,
    name,
    class: cls,
    hp: classData.hp,
    maxHp: classData.hp,
    atk: classData.atk,
    def: classData.def,
    mag: classData.mag,
    skills: [...classData.skills],
    created: Date.now()
  };
};

// دالة للتحقق من لاعب وإصلاحه
export const ensurePlayer = (player, id) => {
  return migratePlayer(player, id);
};
