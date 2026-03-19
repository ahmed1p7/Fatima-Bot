// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 نظام RPG
// ═══════════════════════════════════════════════════════════════════════════════

export const RPG = {
  classes: {
    'محارب': { hp: 150, atk: 25, def: 20, mag: 5, emoji: '⚔️', skills: ['ضربة قاضية'] },
    'ساحر': { hp: 80, atk: 10, def: 8, mag: 35, emoji: '🧙', skills: ['كرة نار'] },
    'رامي': { hp: 100, atk: 30, def: 12, mag: 10, emoji: '🏹', skills: ['سهام سامة'] },
    'شافي': { hp: 90, atk: 8, def: 15, mag: 30, emoji: '💚', skills: ['علاج'] },
    'قاتل': { hp: 70, atk: 40, def: 5, mag: 15, emoji: '🗡️', skills: ['اغتيال'] },
    'فارس': { hp: 130, atk: 20, def: 25, mag: 10, emoji: '🛡️', skills: ['صمود'] }
  },
  monsters: [
    { name: 'سليمان', hp: 50, atk: 8, def: 2, xp: 20, gold: 10, emoji: '🐛' },
    { name: 'ذئب', hp: 80, atk: 15, def: 5, xp: 40, gold: 25, emoji: '🐺' },
    { name: 'عنكبوت', hp: 60, atk: 20, def: 3, xp: 35, gold: 20, emoji: '🕷️' },
    { name: 'غول', hp: 150, atk: 25, def: 15, xp: 80, gold: 60, emoji: '👹' },
    { name: 'تنين', hp: 200, atk: 35, def: 20, xp: 150, gold: 120, emoji: '🐲' }
  ],
  rarities: {
    'عادي': { color: '⚪', chance: 60, mult: 1 },
    'نادر': { color: '🔵', chance: 25, mult: 1.5 },
    'ملحمي': { color: '🟣', chance: 12, mult: 2 },
    'أسطوري': { color: '🟡', chance: 3, mult: 3 }
  },
  boxes: {
    'خشبي': { price: 100, min: 'عادي', max: 'نادر', emoji: '📦' },
    'حديدي': { price: 300, min: 'نادر', max: 'ملحمي', emoji: '🧰' },
    'ذهبي': { price: 800, min: 'ملحمي', max: 'أسطوري', emoji: '🎁' }
  },
  fish: [
    { name: 'سمكة صغيرة', price: 10, chance: 40, emoji: '🐟' },
    { name: 'سمكة كبيرة', price: 50, chance: 15, emoji: '🐠' },
    { name: 'سمكة ذهبية', price: 200, chance: 5, emoji: '✨' },
    { name: 'حذاء قديم', price: 0, chance: 20, emoji: '🥾' }
  ],
  minerals: [
    { name: 'حديد', price: 15, chance: 35, emoji: '⚙️' },
    { name: 'ذهب', price: 80, chance: 10, emoji: '🥇' },
    { name: 'ألماس', price: 200, chance: 5, emoji: '💎' }
  ],
  weapons: ['سيف', 'فأس', 'رمح', 'قوس', 'خنجر', 'مطرقة'],
  armors: ['درع جلدي', 'درع سلسلي', 'درع صفيحي', 'درع ملكي']
};

export const createPlayer = (id, name, cls) => {
  const c = RPG.classes[cls];
  if (!c) return null;
  return {
    id, name, class: cls, level: 1, xp: 0, gold: 100,
    hp: c.hp, maxHp: c.hp, atk: c.atk, def: c.def, mag: c.mag,
    skills: [...c.skills], inventory: [], weapons: [], armors: [],
    wins: 0, losses: 0, created: Date.now(),
    lastDaily: 0, lastWork: 0, lastFish: 0, lastMine: 0
  };
};

export const xpForLevel = (lv) => Math.floor(100 * Math.pow(1.5, lv - 1));

export const levelUp = (p) => {
  const need = xpForLevel(p.level);
  if (p.xp >= need && p.level < 100) {
    p.level++; p.xp -= need;
    const c = RPG.classes[p.class];
    p.maxHp += Math.floor(c.hp * 0.1);
    p.hp = p.maxHp;
    p.atk += Math.floor(c.atk * 0.08);
    p.def += Math.floor(c.def * 0.08);
    return true;
  }
  return false;
};

export const healthBar = (cur, max, len = 8) => {
  const pct = cur / max;
  return '▰'.repeat(Math.floor(pct * len)) + '▱'.repeat(len - Math.floor(pct * len));
};

export const generateWeapon = (box) => {
  const r = getRarity(box.min, box.max);
  const base = RPG.weapons[Math.floor(Math.random() * RPG.weapons.length)];
  const rd = RPG.rarities[r];
  return {
    id: 'W' + Date.now(),
    name: base, fullName: `${base} ${rd.color}`,
    rarity: r, atk: Math.floor(10 * rd.mult * (0.8 + Math.random() * 0.4)),
    level: 1
  };
};

export const generateArmor = (box) => {
  const r = getRarity(box.min, box.max);
  const base = RPG.armors[Math.floor(Math.random() * RPG.armors.length)];
  const rd = RPG.rarities[r];
  return {
    id: 'A' + Date.now(),
    name: base, fullName: `${base} ${rd.color}`,
    rarity: r, def: Math.floor(5 * rd.mult * (0.8 + Math.random() * 0.4)),
    level: 1
  };
};

const getRarity = (min, max) => {
  const rs = Object.keys(RPG.rarities);
  const roll = Math.random() * 100;
  let cum = 0;
  for (let i = rs.indexOf(max); i >= rs.indexOf(min); i--) {
    cum += RPG.rarities[rs[i]].chance;
    if (roll < cum) return rs[i];
  }
  return min;
};

export const upgradeWeapon = (w) => {
  if (Math.random() < 0.95) {
    w.level++; w.atk = Math.floor(w.atk * 1.15);
    return { success: true };
  }
  return { success: false, broken: true };
};

export const fish = () => {
  const roll = Math.random() * 100;
  let cum = 0;
  for (const f of RPG.fish) { cum += f.chance; if (roll < cum) return f; }
  return RPG.fish[0];
};

export const mine = () => {
  const roll = Math.random() * 100;
  let cum = 0;
  for (const m of RPG.minerals) { cum += m.chance; if (roll < cum) return m; }
  return RPG.minerals[0];
};

export const fightMonster = (p) => {
  const idx = Math.min(Math.floor(p.level / 5), RPG.monsters.length - 1);
  const m = { ...RPG.monsters[idx] };
  let log = [], php = p.hp, mhp = m.hp;
  
  while (php > 0 && mhp > 0) {
    const pd = Math.max(1, p.atk - m.def + Math.floor(Math.random() * 10));
    mhp -= pd; log.push(`⚔️ ${p.name}: ${pd}`);
    if (mhp <= 0) break;
    const md = Math.max(1, m.atk - p.def + Math.floor(Math.random() * 8));
    php -= md; log.push(`${m.emoji} ${m.name}: ${md}`);
  }
  
  if (php > 0) {
    const gold = m.gold + Math.floor(Math.random() * m.gold * 0.5);
    const xp = m.xp + Math.floor(Math.random() * m.xp * 0.3);
    p.hp = Math.max(1, php); p.gold += gold; p.xp += xp; p.wins++;
    levelUp(p);
    return { won: true, log: log.slice(-6), rewards: { gold, xp }, monster: m };
  } else {
    p.hp = Math.floor(p.maxHp * 0.3); p.losses++;
    return { won: false, log: log.slice(-6), monster: m };
  }
};

export const pvpBattle = (p1, p2) => {
  let log = [], h1 = p1.hp, h2 = p2.hp;
  let turn = p1.atk >= p2.atk ? 1 : 2;
  
  while (h1 > 0 && h2 > 0 && log.length < 20) {
    if (turn === 1) {
      const d = Math.max(1, p1.atk - p2.def + Math.floor(Math.random() * 15));
      h2 -= d; log.push(`⚔️ ${p1.name}: ${d}`);
    } else {
      const d = Math.max(1, p2.atk - p1.def + Math.floor(Math.random() * 15));
      h1 -= d; log.push(`🛡️ ${p2.name}: ${d}`);
    }
    turn = turn === 1 ? 2 : 1;
  }
  
  const winner = h1 > h2 ? p1 : p2;
  const loser = h1 > h2 ? p2 : p1;
  const gold = Math.floor(loser.gold * 0.1) + 50;
  
  winner.gold += gold; winner.wins++; winner.hp = Math.max(1, h1 > h2 ? h1 : h2);
  loser.gold = Math.max(0, loser.gold - Math.floor(loser.gold * 0.05));
  loser.losses++; loser.hp = Math.floor(loser.maxHp * 0.5);
  levelUp(winner);
  
  return { winner, loser, log: log.slice(-8), goldReward: gold };
};

export const getUpgradeCost = (w) => 
  Math.floor(100 * RPG.rarities[w.rarity].mult * Math.pow(1.5, w.level - 1));

export const getSellPrice = (item) => {
  const base = item.rarity === 'أسطوري' ? 1000 : item.rarity === 'ملحمي' ? 400 : item.rarity === 'نادر' ? 150 : 50;
  return Math.floor(base * (1 + (item.level - 1) * 0.3));
};
