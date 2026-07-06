/* =========================================================
   CHARACTERS: CSS-shape performers, construction copied from
   the design handoff (Character Roster.dc.html / Gameplay
   Screen.dc.html). Each performer has:
   - body-walk: generic walking pose (bob + leg swing)
   - body-ask: the bespoke "ask" pose with a cover-group
     (clothing) and expose-group (bare part + target ring)
   ========================================================= */

const HIT_R = 55;    // hitzone radius, local px (front lane scale = 1)
const RING_R = 40;   // pulsing ring radius
const INNER_R = 22;  // dashed inner circle radius

function p(style) { return `<div style="position:absolute;${style}"></div>`; }

function targetHTML(cx, cy, ringColor) {
  const rc = ringColor || '#FFCB3D';
  return `
    <div class="target-ring" style="left:${cx - RING_R}px;top:${cy - RING_R}px;width:${RING_R * 2}px;height:${RING_R * 2}px;border-color:${rc}"></div>
    <div class="target-inner" style="left:${cx - INNER_R}px;top:${cy - INNER_R}px;width:${INNER_R * 2}px;height:${INNER_R * 2}px;border-color:${rc};background:${rc}40"></div>
    <div class="hitzone" style="left:${cx - HIT_R}px;top:${cy - HIT_R}px;width:${HIT_R * 2}px;height:${HIT_R * 2}px"></div>`;
}

/* Generic walking body (180x260), palette-driven.
   Construction from the gameplay mock's walking character. */
function walkBody(o) {
  // silhouette variants: round barrel (Pudge), short + stubby (Nubbin),
  // slim (Twizzle), default vest (Boffo)
  let torso, legTop = 190, legH = 60, shoeTop = 240, legW = 26, legGap = [48, 96];
  if (o.round) {
    torso = p(`left:26px;top:88px;width:128px;height:108px;border-radius:50%;background:${o.shirt};border:6px solid #1a1508;z-index:0`);
  } else if (o.short) {
    torso = p(`left:32px;top:88px;width:116px;height:88px;border-radius:36px 36px 26px 26px;background:${o.shirt};border:6px solid #1a1508;z-index:0`) +
            p(`left:60px;top:92px;width:14px;height:78px;background:#1a1508;opacity:.14;z-index:1`) +
            p(`left:106px;top:92px;width:14px;height:78px;background:#1a1508;opacity:.14;z-index:1`);
    legTop = 172; legH = 48; shoeTop = 216; legW = 30; legGap = [44, 100];
  } else if (o.slim) {
    torso = p(`left:48px;top:84px;width:84px;height:114px;border-radius:26px 26px 18px 18px;background:${o.shirt};border:6px solid #1a1508;z-index:0`) +
            p(`left:84px;top:88px;width:10px;height:100px;background:#1a1508;opacity:.18;z-index:1`);
    legW = 22; legGap = [54, 100];
  } else {
    torso = p(`left:40px;top:84px;width:100px;height:110px;border-radius:30px 30px 22px 22px;background:${o.shirt};border:6px solid #1a1508;z-index:0`) +
            p(`left:84px;top:88px;width:12px;height:96px;background:#1a1508;opacity:.18;z-index:1`);
  }
  return `
    ${p(`left:58px;top:-6px;width:56px;height:22px;border-radius:28px 28px 0 0;background:${o.hair};border:5px solid #1a1508;border-bottom:none;z-index:1`)}
    ${p(`left:44px;top:34px;width:16px;height:20px;border-radius:50%;background:#F2B889;border:5px solid #1a1508;z-index:0`)}
    ${p(`left:118px;top:34px;width:16px;height:20px;border-radius:50%;background:#F2B889;border:5px solid #1a1508;z-index:0`)}
    ${p(`left:50px;top:6px;width:78px;height:72px;border-radius:50%;background:#F2B889;border:6px solid #1a1508;z-index:2`)}
    ${p(`left:63px;top:32px;width:20px;height:6px;border-radius:3px;background:#1a1508;transform:rotate(-8deg);z-index:3`)}
    ${p(`left:95px;top:32px;width:20px;height:6px;border-radius:3px;background:#1a1508;transform:rotate(8deg);z-index:3`)}
    ${p(`left:64px;top:40px;width:18px;height:18px;border-radius:50%;background:#FFF8EC;border:3px solid #1a1508;z-index:3`)}
    ${p(`left:96px;top:40px;width:18px;height:18px;border-radius:50%;background:#FFF8EC;border:3px solid #1a1508;z-index:3`)}
    <div class="pupil" style="position:absolute;left:70px;top:46px;width:8px;height:8px;border-radius:50%;background:#1a1508;z-index:4"></div>
    <div class="pupil" style="position:absolute;left:102px;top:46px;width:8px;height:8px;border-radius:50%;background:#1a1508;z-index:4"></div>
    ${p(`left:85px;top:54px;width:10px;height:10px;border-radius:50%;background:#E0A26C;border:3px solid #1a1508;z-index:3`)}
    ${p(`left:56px;top:60px;width:14px;height:10px;border-radius:50%;background:#FF6F59;opacity:.5;z-index:3`)}
    ${p(`left:110px;top:60px;width:14px;height:10px;border-radius:50%;background:#FF6F59;opacity:.5;z-index:3`)}
    ${p(`left:73px;top:64px;width:34px;height:14px;border-radius:0 0 14px 14px;background:#7A3B2E;border:4px solid #1a1508;border-top:none;z-index:3`)}
    ${p(`left:66px;top:76px;width:48px;height:14px;background:#FFF8EC;border:5px solid #1a1508;border-radius:4px;z-index:1`)}
    ${torso}
    ${p(`left:6px;top:94px;width:44px;height:26px;border-radius:14px;background:${o.shirt};border:5px solid #1a1508;transform:rotate(-16deg);z-index:0`)}
    ${p(`left:130px;top:94px;width:44px;height:26px;border-radius:14px;background:${o.shirt};border:5px solid #1a1508;transform:rotate(16deg);z-index:0`)}
    ${p(`left:2px;top:112px;width:22px;height:22px;border-radius:50%;background:#F2B889;border:5px solid #1a1508;z-index:0`)}
    ${p(`left:156px;top:112px;width:22px;height:22px;border-radius:50%;background:#F2B889;border:5px solid #1a1508;z-index:0`)}
    <div class="leg-l" style="position:absolute;left:${legGap[0]}px;top:${legTop}px;width:${legW}px;height:${legH}px;border-radius:8px;background:${o.trouser};border:5px solid #1a1508;z-index:0"></div>
    <div class="leg-r" style="position:absolute;left:${legGap[1]}px;top:${legTop}px;width:${legW}px;height:${legH}px;border-radius:8px;background:${o.trouser};border:5px solid #1a1508;z-index:0"></div>
    ${p(`left:${legGap[0] - 4}px;top:${shoeTop}px;width:34px;height:18px;border-radius:10px;background:#1a1508;z-index:0`)}
    ${p(`left:${legGap[1] - 4}px;top:${shoeTop}px;width:34px;height:18px;border-radius:10px;background:#1a1508;z-index:0`)}`;
}

/* ---------------- BOFFO: asks with ARM ---------------- */
function boffoAsk() {
  return `
    ${p(`left:70px;top:-2px;width:60px;height:22px;border-radius:30px 30px 0 0;background:#241812;border:5px solid #1a1508;border-bottom:none;transform:rotate(6deg)`)}
    ${p(`left:56px;top:32px;width:16px;height:20px;border-radius:50%;background:#F2B889;border:5px solid #1a1508`)}
    ${p(`left:130px;top:32px;width:16px;height:20px;border-radius:50%;background:#F2B889;border:5px solid #1a1508`)}
    ${p(`left:62px;top:4px;width:80px;height:74px;border-radius:50%;background:#F2B889;border:6px solid #1a1508;transform:rotate(8deg);z-index:2`)}
    ${p(`left:78px;top:26px;width:20px;height:5px;border-radius:3px;background:#1a1508;transform:rotate(-16deg);z-index:3`)}
    ${p(`left:112px;top:26px;width:20px;height:5px;border-radius:3px;background:#1a1508;transform:rotate(16deg);z-index:3`)}
    ${p(`left:78px;top:34px;width:20px;height:20px;border-radius:50%;background:#FFF8EC;border:3px solid #1a1508;z-index:3`)}
    ${p(`left:112px;top:34px;width:20px;height:20px;border-radius:50%;background:#FFF8EC;border:3px solid #1a1508;z-index:3`)}
    <div class="pupil" style="position:absolute;left:86px;top:41px;width:8px;height:8px;border-radius:50%;background:#1a1508;z-index:4"></div>
    <div class="pupil" style="position:absolute;left:120px;top:41px;width:8px;height:8px;border-radius:50%;background:#1a1508;z-index:4"></div>
    ${p(`left:98px;top:50px;width:10px;height:10px;border-radius:50%;background:#E0A26C;border:3px solid #1a1508;z-index:3`)}
    ${p(`left:66px;top:58px;width:15px;height:10px;border-radius:50%;background:#FF6F59;opacity:.5;z-index:3`)}
    ${p(`left:120px;top:58px;width:15px;height:10px;border-radius:50%;background:#FF6F59;opacity:.5;z-index:3`)}
    ${p(`left:88px;top:62px;width:24px;height:20px;border-radius:50%;background:#7A3B2E;border:4px solid #1a1508;z-index:3`)}
    ${p(`left:78px;top:82px;width:56px;height:14px;background:#FFF8EC;border:5px solid #1a1508;border-radius:4px;z-index:1`)}
    ${p(`left:46px;top:90px;width:118px;height:126px;border-radius:34px 34px 24px 24px;background:#7B4FE0;border:6px solid #1a1508;z-index:0`)}
    ${p(`left:16px;top:86px;width:66px;height:26px;border-radius:14px;background:#7B4FE0;border:5px solid #1a1508;transform:rotate(-45deg);z-index:0`)}
    ${p(`left:0;top:48px;width:30px;height:30px;border-radius:50%;background:#F2B889;border:5px solid #1a1508;z-index:0`)}
    ${p(`left:140px;top:94px;width:50px;height:32px;border-radius:16px;background:#7B4FE0;border:5px solid #1a1508;transform:rotate(-14deg);z-index:0`)}
    ${p(`left:178px;top:90px;width:16px;height:36px;border-radius:8px;background:#5E3AB0;border:4px solid #1a1508;transform:rotate(-14deg);z-index:1`)}
    <div class="expose-group" style="position:absolute;inset:0;z-index:2">
      ${p(`left:186px;top:86px;width:80px;height:26px;border-radius:13px;background:#F2B889;border:5px solid #1a1508;transform:rotate(-14deg)`)}
      ${p(`left:252px;top:78px;width:32px;height:32px;border-radius:50%;background:#F2B889;border:5px solid #1a1508`)}
      ${targetHTML(240, 104)}
    </div>
    <div class="cover-group" style="position:absolute;inset:0;z-index:4">
      ${p(`left:182px;top:82px;width:112px;height:42px;border-radius:20px;background:#7B4FE0;border:5px solid #1a1508;transform:rotate(-14deg)`)}
      ${p(`left:250px;top:76px;width:36px;height:36px;border-radius:50%;background:#7B4FE0;border:5px solid #1a1508`)}
    </div>
    ${p(`left:56px;top:206px;width:32px;height:70px;border-radius:9px;background:#5E3AB0;border:5px solid #1a1508;z-index:0`)}
    ${p(`left:108px;top:206px;width:32px;height:70px;border-radius:9px;background:#5E3AB0;border:5px solid #1a1508;z-index:0`)}
    ${p(`left:46px;top:272px;width:40px;height:20px;border-radius:11px;background:#1a1508;z-index:0`)}
    ${p(`left:104px;top:272px;width:40px;height:20px;border-radius:11px;background:#1a1508;z-index:0`)}`;
}

/* ---------------- NUBBIN: asks with LEG ---------------- */
function nubbinAsk() {
  return `
    ${p(`left:56px;top:-2px;width:58px;height:20px;border-radius:29px 29px 0 0;background:#0E4E4F;border:5px solid #1a1508;border-bottom:none`)}
    ${p(`left:42px;top:30px;width:16px;height:20px;border-radius:50%;background:#F2B889;border:5px solid #1a1508`)}
    ${p(`left:112px;top:30px;width:16px;height:20px;border-radius:50%;background:#F2B889;border:5px solid #1a1508`)}
    ${p(`left:48px;top:2px;width:74px;height:70px;border-radius:50%;background:#F2B889;border:6px solid #1a1508;z-index:2`)}
    ${p(`left:60px;top:26px;width:18px;height:5px;border-radius:3px;background:#1a1508;transform:rotate(-6deg);z-index:3`)}
    ${p(`left:92px;top:26px;width:18px;height:5px;border-radius:3px;background:#1a1508;transform:rotate(6deg);z-index:3`)}
    ${p(`left:60px;top:32px;width:17px;height:17px;border-radius:50%;background:#FFF8EC;border:3px solid #1a1508;z-index:3`)}
    ${p(`left:92px;top:32px;width:17px;height:17px;border-radius:50%;background:#FFF8EC;border:3px solid #1a1508;z-index:3`)}
    <div class="pupil" style="position:absolute;left:66px;top:38px;width:7px;height:7px;border-radius:50%;background:#1a1508;z-index:4"></div>
    <div class="pupil" style="position:absolute;left:98px;top:38px;width:7px;height:7px;border-radius:50%;background:#1a1508;z-index:4"></div>
    ${p(`left:78px;top:44px;width:10px;height:10px;border-radius:50%;background:#E0A26C;border:3px solid #1a1508;z-index:3`)}
    ${p(`left:48px;top:52px;width:14px;height:9px;border-radius:50%;background:#FF6F59;opacity:.5;z-index:3`)}
    ${p(`left:100px;top:52px;width:14px;height:9px;border-radius:50%;background:#FF6F59;opacity:.5;z-index:3`)}
    ${p(`left:62px;top:56px;width:34px;height:16px;border-radius:0 0 17px 17px;background:#7A3B2E;border:4px solid #1a1508;border-top:none;z-index:3`)}
    ${p(`left:22px;top:68px;width:126px;height:120px;border-radius:38px 38px 26px 26px;background:#2EC4C6;border:6px solid #1a1508;z-index:0`)}
    ${p(`left:2px;top:82px;width:44px;height:24px;border-radius:12px;background:#2EC4C6;border:5px solid #1a1508;transform:rotate(20deg);z-index:0`)}
    ${p(`left:134px;top:82px;width:44px;height:24px;border-radius:12px;background:#2EC4C6;border:5px solid #1a1508;transform:rotate(-20deg);z-index:0`)}
    ${p(`left:0;top:104px;width:22px;height:22px;border-radius:50%;background:#F2B889;border:5px solid #1a1508;z-index:0`)}
    ${p(`left:150px;top:104px;width:22px;height:22px;border-radius:50%;background:#F2B889;border:5px solid #1a1508;z-index:0`)}
    ${p(`left:36px;top:178px;width:30px;height:60px;border-radius:8px;background:#0E4E4F;border:5px solid #1a1508;z-index:0`)}
    ${p(`left:32px;top:230px;width:38px;height:20px;border-radius:10px;background:#1a1508;z-index:0`)}
    ${p(`left:96px;top:178px;width:34px;height:32px;border-radius:10px;background:#0E4E4F;border:5px solid #1a1508;z-index:0`)}
    ${p(`left:96px;top:246px;width:34px;height:18px;border-radius:9px;background:#1a1508;z-index:2`)}
    <div class="expose-group" style="position:absolute;inset:0;z-index:2">
      ${p(`left:94px;top:206px;width:38px;height:12px;border-radius:6px;background:#0A3D3E;border:4px solid #1a1508`)}
      ${p(`left:98px;top:214px;width:30px;height:40px;border-radius:8px;background:#F2B889;border:5px solid #1a1508`)}
      ${targetHTML(116, 226)}
    </div>
    <div class="cover-group" style="position:absolute;inset:0;z-index:3">
      ${p(`left:96px;top:204px;width:34px;height:46px;border-radius:8px;background:#0E4E4F;border:5px solid #1a1508`)}
    </div>`;
}

/* ---------------- PUDGE: asks with BELLY ---------------- */
function pudgeAsk() {
  return `
    ${p(`left:76px;top:-2px;width:56px;height:18px;border-radius:28px 28px 0 0;background:#3A2A1C;border:5px solid #1a1508;border-bottom:none;transform:rotate(-6deg)`)}
    ${p(`left:62px;top:26px;width:16px;height:20px;border-radius:50%;background:#F2B889;border:5px solid #1a1508`)}
    ${p(`left:132px;top:26px;width:16px;height:20px;border-radius:50%;background:#F2B889;border:5px solid #1a1508`)}
    ${p(`left:68px;top:0;width:74px;height:68px;border-radius:50%;background:#F2B889;border:6px solid #1a1508;transform:rotate(-8deg);z-index:2`)}
    ${p(`left:80px;top:22px;width:18px;height:5px;border-radius:3px;background:#1a1508;transform:rotate(-16deg);z-index:3`)}
    ${p(`left:112px;top:22px;width:18px;height:5px;border-radius:3px;background:#1a1508;transform:rotate(16deg);z-index:3`)}
    ${p(`left:80px;top:28px;width:15px;height:8px;border-radius:8px 8px 0 0;background:#1a1508;z-index:3`)}
    ${p(`left:112px;top:28px;width:15px;height:8px;border-radius:8px 8px 0 0;background:#1a1508;z-index:3`)}
    ${p(`left:96px;top:40px;width:10px;height:10px;border-radius:50%;background:#E0A26C;border:3px solid #1a1508;z-index:3`)}
    ${p(`left:66px;top:46px;width:15px;height:11px;border-radius:50%;background:#FF6F59;opacity:.55;z-index:3`)}
    ${p(`left:118px;top:46px;width:15px;height:11px;border-radius:50%;background:#FF6F59;opacity:.55;z-index:3`)}
    ${p(`left:82px;top:48px;width:36px;height:24px;border-radius:50%;background:#7A3B2E;border:4px solid #1a1508;z-index:3`)}
    ${p(`left:24px;top:66px;width:150px;height:130px;border-radius:50%;background:#FF6F59;border:6px solid #1a1508;z-index:0`)}
    <div class="expose-group" style="position:absolute;inset:0;z-index:1">
      ${p(`left:50px;top:108px;width:100px;height:80px;border-radius:50%;background:#F2B889;border:6px solid #1a1508`)}
      ${p(`left:78px;top:150px;width:12px;height:12px;border-radius:50%;background:#E0A26C;border:3px solid #1a1508`)}
      ${targetHTML(100, 146)}
    </div>
    <div class="cover-group" style="position:absolute;inset:0;z-index:2">
      ${p(`left:50px;top:108px;width:100px;height:80px;border-radius:50%;background:#FF6F59;border:6px solid #1a1508`)}
      ${p(`left:70px;top:140px;width:60px;height:10px;border-radius:5px;background:#1a1508;opacity:.15`)}
    </div>
    ${p(`left:-4px;top:74px;width:56px;height:24px;border-radius:12px;background:#FF6F59;border:5px solid #1a1508;transform:rotate(-40deg);z-index:3`)}
    ${p(`left:150px;top:74px;width:56px;height:24px;border-radius:12px;background:#FF6F59;border:5px solid #1a1508;transform:rotate(40deg);z-index:3`)}
    ${p(`left:-16px;top:52px;width:28px;height:28px;border-radius:50%;background:#F2B889;border:5px solid #1a1508;z-index:3`)}
    ${p(`left:190px;top:52px;width:28px;height:28px;border-radius:50%;background:#F2B889;border:5px solid #1a1508;z-index:3`)}
    ${p(`left:52px;top:186px;width:30px;height:58px;border-radius:9px;background:#C4442F;border:5px solid #1a1508;z-index:0`)}
    ${p(`left:110px;top:186px;width:30px;height:58px;border-radius:9px;background:#C4442F;border:5px solid #1a1508;z-index:0`)}
    ${p(`left:44px;top:238px;width:38px;height:18px;border-radius:10px;background:#1a1508;z-index:0`)}
    ${p(`left:102px;top:238px;width:38px;height:18px;border-radius:10px;background:#1a1508;z-index:0`)}`;
}

/* ---------------- TWIZZLE: asks with BACK ---------------- */
function twizzleAsk() {
  return `
    ${p(`left:60px;top:-2px;width:54px;height:18px;border-radius:27px 27px 0 0;background:#5A3A18;border:5px solid #1a1508;border-bottom:none;transform:rotate(20deg)`)}
    ${p(`left:60px;top:2px;width:72px;height:66px;border-radius:50%;background:#F2B889;border:6px solid #1a1508;transform:rotate(24deg);z-index:2`)}
    ${p(`left:96px;top:26px;width:16px;height:5px;border-radius:3px;background:#1a1508;transform:rotate(-4deg);z-index:3`)}
    ${p(`left:96px;top:33px;width:15px;height:15px;border-radius:50%;background:#FFF8EC;border:3px solid #1a1508;z-index:3`)}
    <div class="pupil" style="position:absolute;left:102px;top:39px;width:6px;height:6px;border-radius:50%;background:#1a1508;z-index:4"></div>
    ${p(`left:110px;top:44px;width:9px;height:9px;border-radius:50%;background:#E0A26C;border:2px solid #1a1508;z-index:3`)}
    ${p(`left:94px;top:52px;width:22px;height:14px;border-radius:0 0 12px 12px;background:#7A3B2E;border:3px solid #1a1508;border-top:none;z-index:3`)}
    ${p(`left:34px;top:60px;width:132px;height:140px;border-radius:34px 34px 26px 26px;background:#FFCB3D;border:6px solid #1a1508;z-index:0`)}
    <div class="expose-group" style="position:absolute;inset:0;z-index:1">
      ${p(`left:66px;top:78px;width:70px;height:90px;border-radius:20px;background:#F2B889;border:6px solid #1a1508`)}
      ${p(`left:76px;top:96px;width:50px;height:10px;background:#1a1508;opacity:.15;border-radius:5px`)}
      ${p(`left:78px;top:110px;width:46px;height:10px;background:#1a1508;opacity:.15;border-radius:5px`)}
      ${targetHTML(101, 122, '#7B4FE0')}
    </div>
    <div class="cover-group" style="position:absolute;inset:0;z-index:2">
      ${p(`left:66px;top:78px;width:70px;height:90px;border-radius:20px;background:#FFCB3D;border:6px solid #1a1508`)}
      ${p(`left:76px;top:100px;width:50px;height:8px;border-radius:4px;background:#B98A1E`)}
      ${p(`left:76px;top:120px;width:50px;height:8px;border-radius:4px;background:#B98A1E`)}
    </div>
    ${p(`left:150px;top:70px;width:60px;height:24px;border-radius:12px;background:#FFCB3D;border:5px solid #1a1508;transform:rotate(50deg);z-index:3`)}
    ${p(`left:170px;top:106px;width:50px;height:22px;border-radius:11px;background:#FFCB3D;border:5px solid #1a1508;transform:rotate(120deg);z-index:3`)}
    ${p(`left:112px;top:130px;width:26px;height:26px;border-radius:50%;background:#F2B889;border:5px solid #1a1508;z-index:3`)}
    ${p(`left:6px;top:82px;width:44px;height:24px;border-radius:12px;background:#FFCB3D;border:5px solid #1a1508;transform:rotate(-14deg);z-index:0`)}
    ${p(`left:0;top:104px;width:26px;height:26px;border-radius:50%;background:#F2B889;border:5px solid #1a1508;z-index:0`)}
    ${p(`left:52px;top:194px;width:30px;height:64px;border-radius:9px;background:#B98A1E;border:5px solid #1a1508;z-index:0`)}
    ${p(`left:108px;top:194px;width:30px;height:64px;border-radius:9px;background:#B98A1E;border:5px solid #1a1508;z-index:0`)}
    ${p(`left:44px;top:252px;width:38px;height:18px;border-radius:10px;background:#1a1508;z-index:0`)}
    ${p(`left:100px;top:252px;width:38px;height:18px;border-radius:10px;background:#1a1508;z-index:0`)}`;
}

/* ---------------- roster ---------------- */
const CHARACTERS = [
  {
    id: 'boffo', name: 'BOFFO', part: 'ARM',
    width: 300, height: 300, walkOffset: { left: 60, top: 40 },
    walk: () => walkBody({ hair: '#241812', shirt: '#7B4FE0', trouser: '#5E3AB0' }),
    ask: boffoAsk,
    tongue: { left: 96, top: 82 }
  },
  {
    id: 'nubbin', name: 'NUBBIN', part: 'LEG',
    width: 180, height: 270, walkOffset: { left: 0, top: 10 },
    walk: () => walkBody({ hair: '#0E4E4F', shirt: '#2EC4C6', trouser: '#0E4E4F', short: true }),
    ask: nubbinAsk,
    tongue: { left: 72, top: 72 }
  },
  {
    id: 'pudge', name: 'PUDGE', part: 'BELLY',
    width: 210, height: 270, walkOffset: { left: 15, top: 10 },
    walk: () => walkBody({ hair: '#3A2A1C', shirt: '#FF6F59', trouser: '#C4442F', round: true }),
    ask: pudgeAsk,
    tongue: { left: 92, top: 70 }
  },
  {
    id: 'twizzle', name: 'TWIZZLE', part: 'BACK',
    width: 220, height: 280, walkOffset: { left: 20, top: 20 },
    walk: () => walkBody({ hair: '#5A3A18', shirt: '#FFCB3D', trouser: '#B98A1E', slim: true }),
    ask: twizzleAsk,
    tongue: { left: 100, top: 64 }
  }
];

function buildActorHTML(charDef) {
  return `
    <div class="char" style="transform-origin:bottom center">
      <div class="body-walk" style="left:${charDef.walkOffset.left}px;top:${charDef.walkOffset.top}px;width:180px;height:260px">${charDef.walk()}</div>
      <div class="body-ask">${charDef.ask()}</div>
      <div class="puff">!</div>
      <div class="tongue" style="left:${charDef.tongue.left}px;top:${charDef.tongue.top}px"></div>
      <div class="hit-stars"><div class="hs"></div><div class="hs"></div><div class="hs"></div></div>
    </div>`;
}

/* Simplified background performers for the main menu (from the mock). */
function buildMenuPerformers(container) {
  container.innerHTML = `
    <div class="menu-performer mp-1">
      ${p(`left:34px;top:0;width:52px;height:56px;border-radius:50%;background:#F2B889;border:5px solid #1a1508`)}
      ${p(`left:48px;top:20px;width:9px;height:9px;border-radius:50%;background:#1a1508`)}
      ${p(`left:68px;top:20px;width:9px;height:9px;border-radius:50%;background:#1a1508`)}
      ${p(`left:20px;top:50px;width:80px;height:100px;border-radius:40% 40% 22% 22%;background:#2EC4C6;border:5px solid #1a1508`)}
      ${p(`left:30px;top:140px;width:16px;height:44px;border-radius:8px;background:#0E4E4F;border:4px solid #1a1508`)}
      ${p(`left:64px;top:140px;width:16px;height:44px;border-radius:8px;background:#0E4E4F;border:4px solid #1a1508`)}
    </div>
    <div class="menu-performer mp-2">
      ${p(`left:28px;top:0;width:50px;height:52px;border-radius:50%;background:#F2B889;border:5px solid #1a1508`)}
      ${p(`left:42px;top:18px;width:9px;height:9px;border-radius:50%;background:#1a1508`)}
      ${p(`left:60px;top:18px;width:9px;height:9px;border-radius:50%;background:#1a1508`)}
      ${p(`left:18px;top:46px;width:74px;height:90px;border-radius:34% 34% 22% 22%;background:#FF6F59;border:5px solid #1a1508`)}
      ${p(`left:26px;top:126px;width:16px;height:40px;border-radius:8px;background:#C4442F;border:4px solid #1a1508`)}
      ${p(`left:58px;top:126px;width:16px;height:40px;border-radius:8px;background:#C4442F;border:4px solid #1a1508`)}
    </div>
    <div class="menu-performer mp-3">
      ${p(`left:26px;top:0;width:46px;height:48px;border-radius:50%;background:#F2B889;border:5px solid #1a1508`)}
      ${p(`left:16px;top:44px;width:66px;height:80px;border-radius:32% 32% 20% 20%;background:#7B4FE0;border:5px solid #1a1508`)}
      ${p(`left:24px;top:114px;width:14px;height:36px;border-radius:7px;background:#5E3AB0;border:4px solid #1a1508`)}
      ${p(`left:52px;top:114px;width:14px;height:36px;border-radius:7px;background:#5E3AB0;border:4px solid #1a1508`)}
    </div>`;
}
