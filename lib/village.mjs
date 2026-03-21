// ═══════════════════════════════════════════════════════════════════════════════
// 🏘️ نظام القرية الشخصية (مستوحى من Clash of Clans)
// ═══════════════════════════════════════════════════════════════════════════════

import { getRpgData, saveDatabase } from './database.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// 🏗️ تعريفات المباني
// ═══════════════════════════════════════════════════════════════════════════════

export const BUILDINGS = {
  // مبنى القيادة
  commandCenter: {
    name: 'مركز القيادة',
    emoji: '🏛️',
    maxLevel: 10,
    category: 'main',
    description: 'المبنى الرئيسي - ترقيته تفتح مباني جديدة',
    baseCost: { gold: 500, wood: 200, stone: 100 },
    costMultiplier: 2.5,
    buildTime: 3600, // ثانية
    unlockAt: 1,
    requirements: {}
  },

  // مباني الموارد
  goldMine: {
    name: 'منجم الذهب',
    emoji: '⛏️',
    maxLevel: 15,
    category: 'resource',
    description: 'ينتج الذهب بمرور الوقت',
    baseCost: { gold: 100, wood: 50 },
    costMultiplier: 1.8,
    buildTime: 1800,
    production: { resource: 'gold', baseRate: 50, rateMultiplier: 1.5 }, // لكل ساعة
    maxCount: 6,
    unlockAt: 1,
    requirements: { commandCenter: 1 }
  },

  elixirCollector: {
    name: 'مصفاة الإكسير',
    emoji: '💜',
    maxLevel: 15,
    category: 'resource',
    description: 'تنتج الإكسير بمرور الوقت',
    baseCost: { gold: 150, wood: 75 },
    costMultiplier: 1.8,
    buildTime: 1800,
    production: { resource: 'elixir', baseRate: 40, rateMultiplier: 1.5 },
    maxCount: 6,
    unlockAt: 2,
    requirements: { commandCenter: 2 }
  },

  lumberCamp: {
    name: 'معسكر الحطابين',
    emoji: '🪓',
    maxLevel: 12,
    category: 'resource',
    description: 'ينتج الخشب بمرور الوقت',
    baseCost: { gold: 75, stone: 25 },
    costMultiplier: 1.6,
    buildTime: 1200,
    production: { resource: 'wood', baseRate: 60, rateMultiplier: 1.4 },
    maxCount: 4,
    unlockAt: 1,
    requirements: { commandCenter: 1 }
  },

  stoneQuarry: {
    name: 'محجر الحجر',
    emoji: '🪨',
    maxLevel: 12,
    category: 'resource',
    description: 'ينتج الحجر بمرور الوقت',
    baseCost: { gold: 100, wood: 50 },
    costMultiplier: 1.6,
    buildTime: 1500,
    production: { resource: 'stone', baseRate: 45, rateMultiplier: 1.4 },
    maxCount: 4,
    unlockAt: 3,
    requirements: { commandCenter: 3 }
  },

  // مباني التخزين
  goldStorage: {
    name: 'مخزن الذهب',
    emoji: '💰',
    maxLevel: 12,
    category: 'storage',
    description: 'يزيد سعة تخزين الذهب',
    baseCost: { gold: 200, wood: 100, stone: 50 },
    costMultiplier: 2,
    buildTime: 2400,
    storage: { resource: 'gold', baseCapacity: 5000, capacityMultiplier: 2 },
    maxCount: 4,
    unlockAt: 2,
    requirements: { commandCenter: 2 }
  },

  elixirStorage: {
    name: 'مخزن الإكسير',
    emoji: '💜',
    maxLevel: 12,
    category: 'storage',
    description: 'يزيد سعة تخزين الإكسير',
    baseCost: { gold: 250, wood: 75, stone: 75 },
    costMultiplier: 2,
    buildTime: 2400,
    storage: { resource: 'elixir', baseCapacity: 5000, capacityMultiplier: 2 },
    maxCount: 4,
    unlockAt: 3,
    requirements: { commandCenter: 3 }
  },

  // المباني الدفاعية
  walls: {
    name: 'الأسوار',
    emoji: '🧱',
    maxLevel: 10,
    category: 'defense',
    description: 'تبطئ تقدم المهاجمين',
    baseCost: { gold: 50, stone: 100 },
    costMultiplier: 1.5,
    buildTime: 300,
    defense: { hp: 100, hpMultiplier: 1.5 },
    maxCount: 50,
    unlockAt: 2,
    requirements: { commandCenter: 2 }
  },

  archerTower: {
    name: 'برج الرماة',
    emoji: '🗼',
    maxLevel: 12,
    category: 'defense',
    description: 'يطلق السهام على المهاجمين',
    baseCost: { gold: 500, wood: 200, stone: 150 },
    costMultiplier: 2,
    buildTime: 3600,
    defense: { damage: 20, damageMultiplier: 1.4, range: 5 },
    maxCount: 6,
    unlockAt: 3,
    requirements: { commandCenter: 3 }
  },

  cannon: {
    name: 'مدفع',
    emoji: '💥',
    maxLevel: 12,
    category: 'defense',
    description: 'يطلق قذائف على المهاجمين',
    baseCost: { gold: 600, wood: 100, stone: 200 },
    costMultiplier: 2,
    buildTime: 3600,
    defense: { damage: 30, damageMultiplier: 1.5, range: 4 },
    maxCount: 6,
    unlockAt: 4,
    requirements: { commandCenter: 4 }
  },

  wizardTower: {
    name: 'برج السحرة',
    emoji: '🔮',
    maxLevel: 10,
    category: 'defense',
    description: 'يطلق تعاويذ سحرية على مجموعات',
    baseCost: { gold: 1000, elixir: 500, stone: 300 },
    costMultiplier: 2.2,
    buildTime: 5400,
    defense: { damage: 40, damageMultiplier: 1.4, range: 3, splash: true },
    maxCount: 4,
    unlockAt: 5,
    requirements: { commandCenter: 5 }
  },

  // المباني العسكرية
  barracks: {
    name: 'ثكنة الجنود',
    emoji: '⚔️',
    maxLevel: 10,
    category: 'military',
    description: 'لتدريب الوحدات الهجومية',
    baseCost: { gold: 400, wood: 200, stone: 100 },
    costMultiplier: 2,
    buildTime: 3000,
    unlockUnits: ['warrior', 'archer', 'wizard'],
    unlockAt: 2,
    requirements: { commandCenter: 2 }
  },

  armyCamp: {
    name: 'معسكر الجيش',
    emoji: '⛺',
    maxLevel: 8,
    category: 'military',
    description: 'يزيد سعة الجيش للهجوم',
    baseCost: { gold: 300, wood: 150, stone: 50 },
    costMultiplier: 1.8,
    buildTime: 2400,
    armyCapacity: { base: 20, perLevel: 5 },
    maxCount: 4,
    unlockAt: 3,
    requirements: { commandCenter: 3, barracks: 1 }
  },

  laboratory: {
    name: 'المختبر',
    emoji: '🔬',
    maxLevel: 8,
    category: 'military',
    description: 'لترقية الوحدات',
    baseCost: { gold: 800, elixir: 400, stone: 200 },
    costMultiplier: 2.5,
    buildTime: 4800,
    unlockAt: 4,
    requirements: { commandCenter: 4, barracks: 3 }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 👥 تعريفات الوحدات
// ═══════════════════════════════════════════════════════════════════════════════

export const UNITS = {
  warrior: {
    name: 'محارب',
    emoji: '⚔️',
    hp: 100,
    atk: 15,
    def: 10,
    speed: 1,
    cost: { gold: 50, elixir: 0 },
    trainTime: 60,
    housing: 1,
    unlockAt: { barracks: 1 }
  },
  archer: {
    name: 'رامي',
    emoji: '🏹',
    hp: 60,
    atk: 20,
    def: 5,
    speed: 1.2,
    range: 3,
    cost: { gold: 75, elixir: 25 },
    trainTime: 90,
    housing: 1,
    unlockAt: { barracks: 2 }
  },
  wizard: {
    name: 'ساحر',
    emoji: '🧙',
    hp: 50,
    atk: 35,
    def: 3,
    speed: 0.8,
    range: 4,
    splash: true,
    cost: { gold: 100, elixir: 100 },
    trainTime: 180,
    housing: 2,
    unlockAt: { barracks: 4 }
  },
  giant: {
    name: 'عملاق',
    emoji: '🦍',
    hp: 300,
    atk: 25,
    def: 20,
    speed: 0.5,
    target: 'defense',
    cost: { gold: 200, elixir: 150 },
    trainTime: 300,
    housing: 5,
    unlockAt: { barracks: 6 }
  },
  healer: {
    name: 'شافي',
    emoji: '💚',
    hp: 80,
    atk: 0,
    def: 5,
    speed: 1,
    range: 4,
    healPower: 30,
    cost: { gold: 150, elixir: 200 },
    trainTime: 240,
    housing: 4,
    unlockAt: { barracks: 5, laboratory: 1 }
  },
  dragon: {
    name: 'تنين',
    emoji: '🐉',
    hp: 200,
    atk: 50,
    def: 15,
    speed: 1,
    range: 3,
    splash: true,
    flying: true,
    cost: { gold: 500, elixir: 400 },
    trainTime: 600,
    housing: 10,
    unlockAt: { barracks: 8, laboratory: 3 }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🏘️ إنشاء قرية جديدة
// ═══════════════════════════════════════════════════════════════════════════════

export const createVillage = () => {
  const now = Date.now();
  return {
    level: 1,
    resources: {
      gold: 500,
      elixir: 250,
      wood: 300,
      stone: 200
    },
    storageCapacity: {
      gold: 10000,
      elixir: 10000,
      wood: 5000,
      stone: 5000
    },
    buildings: {
      commandCenter: { level: 1, lastUpgrade: now },
      goldMine: [{ id: 'gm1', level: 1, lastCollected: now }],
      elixirCollector: [{ id: 'ec1', level: 1, lastCollected: now }],
      lumberCamp: [{ id: 'lc1', level: 1, lastCollected: now }],
      stoneQuarry: [],
      goldStorage: [{ id: 'gs1', level: 1 }],
      elixirStorage: [],
      walls: [],
      archerTower: [],
      cannon: [],
      wizardTower: [],
      barracks: { level: 1, trainingQueue: [] },
      armyCamp: [{ id: 'ac1', level: 1, capacity: 20 }],
      laboratory: { level: 0 }
    },
    units: {
      trained: [], // الوحدات الجاهزة للهجوم
      defending: [], // الوحدات للدفاع
      upgrading: {} // مستويات ترقية الوحدات
    },
    shieldEndTime: 0,
    lastAttack: 0,
    totalDefenses: 0,
    totalAttacks: 0,
    starsEarned: 0,
    starsLost: 0
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 حساب تكلفة البناء/الترقية
// ═══════════════════════════════════════════════════════════════════════════════

export const getBuildingCost = (buildingType, currentLevel, buildingDef = null) => {
  const def = buildingDef || BUILDINGS[buildingType];
  if (!def) return null;

  const cost = {};
  for (const [resource, amount] of Object.entries(def.baseCost)) {
    cost[resource] = Math.floor(amount * Math.pow(def.costMultiplier, currentLevel));
  }
  return cost;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📈 جمع الموارد
// ═══════════════════════════════════════════════════════════════════════════════

export const collectResources = (village) => {
  const now = Date.now();
  const collected = { gold: 0, elixir: 0, wood: 0, stone: 0 };

  // المرور على جميع مباني الإنتاج
  for (const [buildingType, buildings] of Object.entries(village.buildings)) {
    if (Array.isArray(buildings)) {
      for (const building of buildings) {
        const def = BUILDINGS[buildingType];
        if (def && def.production) {
          const timePassed = (now - (building.lastCollected || now)) / 3600000; // ساعات
          const production = def.production;
          const rate = production.baseRate * Math.pow(production.rateMultiplier, building.level - 1);
          const produced = Math.floor(rate * timePassed);
          collected[production.resource] = (collected[production.resource] || 0) + produced;
          building.lastCollected = now;
        }
      }
    }
  }

  // إضافة الموارد مع مراعاة السعة القصوى
  for (const [resource, amount] of Object.entries(collected)) {
    const current = village.resources[resource] || 0;
    const max = village.storageCapacity[resource] || 10000;
    village.resources[resource] = Math.min(current + amount, max);
  }

  return collected;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🏗️ بناء/ترقية مبنى
// ═══════════════════════════════════════════════════════════════════════════════

export const upgradeBuilding = (village, buildingType, index = 0) => {
  const def = BUILDINGS[buildingType];
  if (!def) return { success: false, message: '❌ مبنى غير موجود!' };

  // التحقق من المتطلبات
  for (const [reqBuilding, reqLevel] of Object.entries(def.requirements || {})) {
    const reqBuildingData = village.buildings[reqBuilding];
    const reqCurrentLevel = Array.isArray(reqBuildingData) 
      ? Math.max(...reqBuildingData.map(b => b.level), 0)
      : (reqBuildingData?.level || 0);
    
    if (reqCurrentLevel < reqLevel) {
      return { success: false, message: `❌ يتطلب ${BUILDINGS[reqBuilding]?.name || reqBuilding} مستوى ${reqLevel}!` };
    }
  }

  // التحقق من مستوى مركز القيادة
  const ccLevel = village.buildings.commandCenter?.level || 1;
  if (def.unlockAt > ccLevel) {
    return { success: false, message: `❌ يتطلب مركز قيادة مستوى ${def.unlockAt}!` };
  }

  // الحصول على المبنى الحالي
  let building;
  let buildingsArray;

  if (buildingType === 'commandCenter' || buildingType === 'barracks' || buildingType === 'laboratory') {
    // مباني فردية
    building = village.buildings[buildingType];
    if (!building) {
      if (buildingType === 'laboratory') {
        building = { level: 0 };
        village.buildings[buildingType] = building;
      } else {
        return { success: false, message: '❌ المبنى غير موجود!' };
      }
    }
  } else {
    // مباني متعددة
    buildingsArray = village.buildings[buildingType];
    if (!buildingsArray) {
      buildingsArray = [];
      village.buildings[buildingType] = buildingsArray;
    }

    // إذا كان البناء الجديد
    if (index >= buildingsArray.length) {
      if (def.maxCount && buildingsArray.length >= def.maxCount) {
        return { success: false, message: `❌ الحد الأقصى ${def.maxCount} ${def.name}!` };
      }

      // التحقق من التكلفة للمبنى الجديد
      const cost = getBuildingCost(buildingType, 0, def);
      for (const [resource, amount] of Object.entries(cost)) {
        if ((village.resources[resource] || 0) < amount) {
          return { success: false, message: `❌ تحتاج ${amount} ${resource}!` };
        }
      }

      // خصم التكلفة
      for (const [resource, amount] of Object.entries(cost)) {
        village.resources[resource] -= amount;
      }

      // إضافة المبنى الجديد
      const newBuilding = {
        id: `${buildingType.slice(0, 2)}${Date.now()}`,
        level: 1,
        lastCollected: Date.now(),
        lastUpgrade: Date.now()
      };
      buildingsArray.push(newBuilding);

      return { success: true, message: `✅ تم بناء ${def.name} جديد!`, building: newBuilding, cost };
    }

    building = buildingsArray[index];
  }

  if (!building) {
    return { success: false, message: '❌ المبنى غير موجود!' };
  }

  // التحقق من الحد الأقصى للمستوى
  if (building.level >= def.maxLevel) {
    return { success: false, message: `❌ ${def.name} في أعلى مستوى!` };
  }

  // حساب التكلفة
  const cost = getBuildingCost(buildingType, building.level, def);
  for (const [resource, amount] of Object.entries(cost)) {
    if ((village.resources[resource] || 0) < amount) {
      return { success: false, message: `❌ تحتاج ${amount} ${resource}!` };
    }
  }

  // خصم التكلفة ورفع المستوى
  for (const [resource, amount] of Object.entries(cost)) {
    village.resources[resource] -= amount;
  }

  building.level++;
  building.lastUpgrade = Date.now();

  // تحديث السعة إذا كان مبنى تخزين
  if (def.storage) {
    const newCapacity = def.storage.baseCapacity * Math.pow(def.storage.capacityMultiplier, building.level - 1);
    village.storageCapacity[def.storage.resource] = 
      (village.storageCapacity[def.storage.resource] || 10000) + newCapacity;
  }

  // تحديث مستوى القرية
  updateVillageLevel(village);

  return { success: true, message: `✅ تم ترقية ${def.name} للمستوى ${building.level}!`, building, cost };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 تحديث مستوى القرية
// ═══════════════════════════════════════════════════════════════════════════════

export const updateVillageLevel = (village) => {
  let totalLevels = 0;

  for (const [buildingType, buildings] of Object.entries(village.buildings)) {
    if (buildingType === 'commandCenter' || buildingType === 'barracks' || buildingType === 'laboratory') {
      totalLevels += buildings?.level || 0;
    } else if (Array.isArray(buildings)) {
      totalLevels += buildings.reduce((sum, b) => sum + (b.level || 0), 0);
    }
  }

  village.level = Math.max(1, Math.floor(totalLevels / 10) + 1);
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ تدريب الوحدات
// ═══════════════════════════════════════════════════════════════════════════════

export const trainUnit = (village, unitType, count = 1) => {
  const unitDef = UNITS[unitType];
  if (!unitDef) return { success: false, message: '❌ وحدة غير موجودة!' };

  // التحقق من متطلبات فتح الوحدة
  const barracksLevel = village.buildings.barracks?.level || 0;
  const labLevel = village.buildings.laboratory?.level || 0;

  for (const [reqBuilding, reqLevel] of Object.entries(unitDef.unlockAt)) {
    if (reqBuilding === 'barracks' && barracksLevel < reqLevel) {
      return { success: false, message: `❌ يتطلب ثكنة مستوى ${reqLevel}!` };
    }
    if (reqBuilding === 'laboratory' && labLevel < reqLevel) {
      return { success: false, message: `❌ يتطلب مختبر مستوى ${reqLevel}!` };
    }
  }

  // حساب التكلفة الإجمالية
  const totalCost = {};
  for (const [resource, amount] of Object.entries(unitDef.cost)) {
    totalCost[resource] = amount * count;
    if ((village.resources[resource] || 0) < totalCost[resource]) {
      return { success: false, message: `❌ تحتاج ${totalCost[resource]} ${resource}!` };
    }
  }

  // حساب سعة الجيش
  const armyCapacity = village.buildings.armyCamp?.reduce((sum, camp) => {
    const def = BUILDINGS.armyCamp;
    return sum + (def.armyCapacity.base + (camp.level - 1) * def.armyCapacity.perLevel);
  }, 0) || 20;

  const currentHousing = village.units.trained.reduce((sum, u) => sum + UNITS[u.type]?.housing * u.count, 0);
  const neededHousing = unitDef.housing * count;

  if (currentHousing + neededHousing > armyCapacity) {
    return { success: false, message: `❌ لا توجد مساحة كافية في الجيش! (المتاح: ${armyCapacity - currentHousing})` };
  }

  // خصم التكلفة
  for (const [resource, amount] of Object.entries(totalCost)) {
    village.resources[resource] -= amount;
  }

  // إضافة الوحدات
  const existingUnit = village.units.trained.find(u => u.type === unitType);
  if (existingUnit) {
    existingUnit.count += count;
  } else {
    village.units.trained.push({ type: unitType, count, level: (village.units.upgrading[unitType] || 0) + 1 });
  }

  return { 
    success: true, 
    message: `✅ تم تدريب ${count} ${unitDef.name}!`,
    cost: totalCost,
    trainTime: unitDef.trainTime * count
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ حساب قوة الدفاع
// ═══════════════════════════════════════════════════════════════════════════════

export const calculateDefensePower = (village) => {
  let totalPower = 0;
  let totalHP = 0;

  for (const [buildingType, buildings] of Object.entries(village.buildings)) {
    const def = BUILDINGS[buildingType];
    if (!def || !def.defense) continue;

    if (Array.isArray(buildings)) {
      for (const building of buildings) {
        const damage = def.defense.damage * Math.pow(def.defense.damageMultiplier, building.level - 1);
        totalPower += damage;
        if (def.defense.hp) {
          totalHP += def.defense.hp * Math.pow(def.defense.hpMultiplier, building.level - 1);
        }
      }
    }
  }

  // إضافة قوة الوحدات المدافعة
  for (const unit of village.units.defending) {
    const unitDef = UNITS[unit.type];
    if (unitDef) {
      totalPower += unitDef.atk * unit.count * (1 + (unit.level - 1) * 0.1);
      totalHP += unitDef.hp * unit.count * (1 + (unit.level - 1) * 0.1);
    }
  }

  return { power: Math.floor(totalPower), hp: Math.floor(totalHP) };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 حساب قوة الهجوم
// ═══════════════════════════════════════════════════════════════════════════════

export const calculateAttackPower = (village) => {
  let totalPower = 0;
  let totalHP = 0;

  for (const unit of village.units.trained) {
    const unitDef = UNITS[unit.type];
    if (unitDef) {
      totalPower += unitDef.atk * unit.count * (1 + (unit.level - 1) * 0.1);
      totalHP += unitDef.hp * unit.count * (1 + (unit.level - 1) * 0.1);
    }
  }

  return { power: Math.floor(totalPower), hp: Math.floor(totalHP) };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🗡️ هجوم على قرية
// ═══════════════════════════════════════════════════════════════════════════════

export const attackVillage = (attacker, defender) => {
  // التحقق من درع الحماية
  if (defender.shieldEndTime > Date.now()) {
    return { success: false, message: '❌ القرية محمية بدرع!' };
  }

  const attackPower = calculateAttackPower(attacker);
  const defensePower = calculateDefensePower(defender);

  // محاكاة المعركة
  const attackRoll = attackPower.power + attackPower.hp * 0.5 + Math.random() * 50;
  const defenseRoll = defensePower.power + defensePower.hp * 0.5 + Math.random() * 50;

  const won = attackRoll > defenseRoll;
  const damageRatio = won ? attackRoll / defenseRoll : defenseRoll / attackRoll;

  // حساب النجوم (0-3)
  let stars = 0;
  if (won) {
    if (damageRatio > 2) stars = 3;
    else if (damageRatio > 1.5) stars = 2;
    else stars = 1;
  }

  // حساب الموارد المسروقة
  const stolenResources = {};
  if (won) {
    const stealPercent = Math.min(0.3, 0.1 + stars * 0.1);
    for (const [resource, amount] of Object.entries(defender.resources)) {
      const stolen = Math.floor(amount * stealPercent);
      stolenResources[resource] = stolen;
      defender.resources[resource] -= stolen;
      attacker.resources[resource] = (attacker.resources[resource] || 0) + stolen;
    }
  }

  // تحديث الإحصائيات
  attacker.lastAttack = Date.now();
  attacker.totalAttacks++;
  attacker.starsEarned += stars;

  defender.totalDefenses++;
  defender.starsLost += stars;

  // منح درع حماية للمدافع
  if (won) {
    defender.shieldEndTime = Date.now() + (6 + stars * 2) * 3600000; // 6-12 ساعة
  }

  return {
    success: true,
    won,
    stars,
    attackPower: attackPower.power,
    defensePower: defensePower.power,
    stolenResources,
    attackerLosses: won ? 0 : Math.floor(Math.random() * 30) + 10,
    defenderLosses: won ? Math.floor(Math.random() * 40) + 20 : 0
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 عرض القرية
// ═══════════════════════════════════════════════════════════════════════════════

export const formatVillageDisplay = (village, playerName) => {
  const defense = calculateDefensePower(village);
  const attack = calculateAttackPower(village);
  const ccLevel = village.buildings.commandCenter?.level || 1;

  let text = `╭═══════ 🏘️ قرية ${playerName} ═══════╮

🏛️ مركز القيادة: مستوى ${ccLevel}
⭐ مستوى القرية: ${village.level}
${village.shieldEndTime > Date.now() ? `🛡️ درع حماية: ${Math.ceil((village.shieldEndTime - Date.now()) / 3600000)} ساعة` : ''}

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

📊 الموارد:
💰 الذهب: ${village.resources.gold?.toLocaleString() || 0}/${village.storageCapacity.gold?.toLocaleString()}
💜 الإكسير: ${village.resources.elixir?.toLocaleString() || 0}/${village.storageCapacity.elixir?.toLocaleString()}
🪵 الخشب: ${village.resources.wood?.toLocaleString() || 0}/${village.storageCapacity.wood?.toLocaleString()}
🪨 الحجر: ${village.resources.stone?.toLocaleString() || 0}/${village.storageCapacity.stone?.toLocaleString()}

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

⚔️ القوة العسكرية:
🗡️ هجوم: ${attack.power} | 🛡️ دفاع: ${defense.power}
👥 الجيش: ${village.units.trained.reduce((s, u) => s + u.count, 0)} وحدة

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

📈 الإحصائيات:
⚔️ الهجمات: ${village.totalAttacks} | 🏆 النجوم: ${village.starsEarned}
🛡️ الدفاعات: ${village.totalDefenses}

╰═══════════════════════════════❖`;

  return text;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 قائمة المباني المتاحة
// ═══════════════════════════════════════════════════════════════════════════════

export const getAvailableBuildings = (village) => {
  const ccLevel = village.buildings.commandCenter?.level || 1;
  const available = [];

  for (const [type, def] of Object.entries(BUILDINGS)) {
    if (def.unlockAt > ccLevel) continue;

    // التحقق من المتطلبات
    let requirementsMet = true;
    for (const [reqBuilding, reqLevel] of Object.entries(def.requirements || {})) {
      const reqBuildingData = village.buildings[reqBuilding];
      const currentLevel = Array.isArray(reqBuildingData)
        ? Math.max(...reqBuildingData.map(b => b.level), 0)
        : (reqBuildingData?.level || 0);
      
      if (currentLevel < reqLevel) {
        requirementsMet = false;
        break;
      }
    }

    if (requirementsMet) {
      // حساب العدد الحالي
      const currentCount = Array.isArray(village.buildings[type]) 
        ? village.buildings[type].length 
        : (village.buildings[type]?.level ? 1 : 0);

      available.push({
        type,
        name: def.name,
        emoji: def.emoji,
        category: def.category,
        maxLevel: def.maxLevel,
        maxCount: def.maxCount || 1,
        currentCount,
        cost: getBuildingCost(type, currentCount)
      });
    }
  }

  return available;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 قائمة الوحدات المتاحة
// ═══════════════════════════════════════════════════════════════════════════════

export const getAvailableUnits = (village) => {
  const barracksLevel = village.buildings.barracks?.level || 0;
  const labLevel = village.buildings.laboratory?.level || 0;
  const available = [];

  for (const [type, def] of Object.entries(UNITS)) {
    let unlocked = true;
    for (const [reqBuilding, reqLevel] of Object.entries(def.unlockAt)) {
      if (reqBuilding === 'barracks' && barracksLevel < reqLevel) unlocked = false;
      if (reqBuilding === 'laboratory' && labLevel < reqLevel) unlocked = false;
    }

    if (unlocked) {
      available.push({
        type,
        name: def.name,
        emoji: def.emoji,
        hp: def.hp,
        atk: def.atk,
        cost: def.cost,
        housing: def.housing,
        trainTime: def.trainTime
      });
    }
  }

  return available;
};
