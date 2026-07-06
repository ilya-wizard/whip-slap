/* =========================================================
   GAME DATA: whips, levels, constants
   ========================================================= */

// Whip art panels: CSS-shape constructions copied from the design
// handoff ("Whip Selection.dc.html"), positioned for a 190px-tall panel.
const WHIP_ART = {
  flogger: `
    <div style="position:absolute;left:120px;top:26px;width:20px;height:52px;border-radius:9px;background:#5C3A1E;border:4px solid #1a1508"></div>
    <div style="position:absolute;left:123px;top:34px;width:14px;height:2px;background:#2c1f14"></div>
    <div style="position:absolute;left:123px;top:42px;width:14px;height:2px;background:#2c1f14"></div>
    <div style="position:absolute;left:123px;top:50px;width:14px;height:2px;background:#2c1f14"></div>
    <div style="position:absolute;left:94px;top:74px;width:9px;height:80px;border-radius:5px;background:#1a1508;transform:rotate(-16deg);transform-origin:top center"></div>
    <div style="position:absolute;left:108px;top:74px;width:9px;height:86px;border-radius:5px;background:#241a12;transform:rotate(-9deg);transform-origin:top center"></div>
    <div style="position:absolute;left:122px;top:74px;width:9px;height:90px;border-radius:5px;background:#1a1508;transform:rotate(-3deg);transform-origin:top center"></div>
    <div style="position:absolute;left:136px;top:74px;width:9px;height:90px;border-radius:5px;background:#241a12;transform:rotate(3deg);transform-origin:top center"></div>
    <div style="position:absolute;left:150px;top:74px;width:9px;height:86px;border-radius:5px;background:#1a1508;transform:rotate(9deg);transform-origin:top center"></div>
    <div style="position:absolute;left:164px;top:74px;width:9px;height:80px;border-radius:5px;background:#241a12;transform:rotate(16deg);transform-origin:top center"></div>`,
  bullwhip: `
    <div style="position:absolute;left:56px;top:132px;width:52px;height:20px;border-radius:8px;background:#5C3A1E;border:4px solid #1a1508;transform:rotate(18deg)"></div>
    <div style="position:absolute;left:64px;top:137px;width:36px;height:2px;background:#2c1f14;transform:rotate(18deg)"></div>
    <div style="position:absolute;left:68px;top:142px;width:36px;height:2px;background:#2c1f14;transform:rotate(18deg)"></div>
    <div style="position:absolute;left:94px;top:120px;width:60px;height:16px;border-radius:8px;background:#B98150;border:4px solid #1a1508;transform:rotate(6deg);transform-origin:left center"></div>
    <div style="position:absolute;left:148px;top:108px;width:56px;height:13px;border-radius:7px;background:#B98150;border:3px solid #1a1508;transform:rotate(-22deg);transform-origin:left center"></div>
    <div style="position:absolute;left:190px;top:78px;width:52px;height:11px;border-radius:6px;background:#C79463;border:3px solid #1a1508;transform:rotate(-58deg);transform-origin:left center"></div>
    <div style="position:absolute;left:208px;top:42px;width:46px;height:9px;border-radius:5px;background:#C79463;border:3px solid #1a1508;transform:rotate(-98deg);transform-origin:left center"></div>
    <div style="position:absolute;left:188px;top:12px;width:38px;height:7px;border-radius:4px;background:#D9A876;border:2px solid #1a1508;transform:rotate(-138deg);transform-origin:left center"></div>
    <div style="position:absolute;left:156px;top:4px;width:28px;height:5px;border-radius:3px;background:#E9C199;border:2px solid #1a1508;transform:rotate(-168deg);transform-origin:left center"></div>
    <div style="position:absolute;left:126px;top:0;width:16px;height:2px;background:#FFF8EC;transform:rotate(20deg)"></div>
    <div style="position:absolute;left:126px;top:4px;width:18px;height:2px;background:#FFF8EC"></div>
    <div style="position:absolute;left:126px;top:8px;width:16px;height:2px;background:#FFF8EC;transform:rotate(-20deg)"></div>`,
  cane: `
    <div style="position:absolute;left:128px;top:40px;width:10px;height:110px;border-radius:5px;background:#5C3A1E;border:3px solid #1a1508"></div>
    <div style="position:absolute;left:126px;top:96px;width:14px;height:3px;background:#3a2818"></div>
    <div style="position:absolute;left:126px;top:112px;width:14px;height:3px;background:#3a2818"></div>
    <div style="position:absolute;left:128px;top:142px;width:14px;height:10px;border-radius:0 0 4px 4px;background:#B08D57;border:3px solid #1a1508"></div>
    <div style="position:absolute;left:98px;top:18px;width:40px;height:40px;border:8px solid #5C3A1E;border-right-color:transparent;border-bottom-color:transparent;border-radius:50%;transform:rotate(-45deg)"></div>`
};

const WHIPS = [
  {
    id: 'flogger',
    name: 'FLOGGER',
    flavor: 'Rapid and forgiving. A whiff barely dents your tempo.',
    cooldown: 350,       // ms
    points: 60,
    speedBar: 95,        // % for the stat bar
    pointsBar: 33
  },
  {
    id: 'bullwhip',
    name: 'BULLWHIP',
    flavor: 'The classic. Balanced snap, balanced payout.',
    cooldown: 600,
    points: 100,
    speedBar: 60,
    pointsBar: 55
  },
  {
    id: 'cane',
    name: 'CANE',
    flavor: 'Slow and heavy. Biggest payout, punishes sloppy slaps.',
    cooldown: 1000,
    points: 180,
    speedBar: 25,
    pointsBar: 100
  }
];

function getWhip(id) {
  return WHIPS.find(w => w.id === id) || WHIPS[1];
}

/* ---------------------------------------------------------
   Levels. Level 0 = Practice (relaxed, no stars saved).
   Difficulty drivers interpolate from level 1 to level 10:
   faster movement, shorter exposure windows, more frequent
   asks, more characters, more simultaneous open windows.
   --------------------------------------------------------- */
const LEVELS = (() => {
  const levels = [];
  // practice level
  levels.push({
    id: 0, name: 'PRACTICE',
    duration: 60, window: 2000, speed: 0.9,
    askDelay: [3000, 4500], maxChars: 2, maxOpen: 1, backShare: 0.05
  });
  for (let i = 1; i <= 10; i++) {
    const t = (i - 1) / 9;
    levels.push({
      id: i, name: 'LEVEL ' + i,
      duration: 30,
      window: Math.round(1600 - 700 * t),
      speed: +(1 + 0.6 * t).toFixed(2),
      askDelay: [Math.round(2500 - 1300 * t), Math.round(4000 - 1500 * t)],
      maxChars: i < 4 ? 2 : 3,
      maxOpen: i < 6 ? 1 : 2,
      backShare: +(0.10 + 0.25 * t).toFixed(2)
    });
  }
  return levels;
})();

// Scoring constants
const SCORING = {
  perfectMult: 1.5,
  perfectRadiusFrac: 0.35,   // click within 35% of hitzone radius = PERFECT
  whiffPenalty: 25,
  graceMs: 75,               // window closed < 75ms ago still counts (GOOD)
  accuracyBonusPerPct: 10,   // accuracy% x 10 points
  starThresholds: [0.25, 0.45, 0.70]
};

const TELEGRAPH_MS = 400;
const WINDOW_GAP_MS = 400;   // min gap between one window closing and another opening

// Lane layout inside #playfield (fractions of playfield height for the
// lane floor lines) + visual scale per lane depth.
const LANES = [
  { floor: 0.27, scale: 0.62, z: 1 },   // back
  { floor: 0.55, scale: 0.80, z: 2 },   // middle
  { floor: 0.86, scale: 1.00, z: 3 }    // front
];

const STORAGE_KEY = 'whipslap-save-v1';
