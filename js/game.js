/* =========================================================
   GAME ENGINE: actor lifecycle, ask scheduling, strikes,
   scoring, timer, FX. Runs on requestAnimationFrame.
   ========================================================= */
const Game = (() => {
  const PF_W = 1920, PF_H = 640;          // playfield size in stage px
  const BASE_SPEED = 120;                  // walk px/s at speed x1
  const EXIT_MULT = 3.5;

  let els = {};
  let level = null, whip = null, callbacks = {};
  let running = false, paused = false, phase = 'idle'; // countdown | play
  let gameTime = 0, lastTs = 0, countdownT = 0, endedAt = 0;

  let actors = [];
  let openWindows = 0, lastWindowClose = -99999;
  let spawnAt = 0;
  let hitPoints = 0, penalty = 0, hits = 0, whiffs = 0, expired = 0, asksShown = 0, perfects = 0;
  let cooldownUntil = 0;
  let hintUntil = 0;
  let graceHits = []; // {actor, closedAt} for the 75ms grace rule
  let rafPending = false;

  // only ever one rAF in flight: in hidden tabs queued callbacks never run
  // and would otherwise pile up until the renderer chokes
  function schedule() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame((t) => { rafPending = false; loop(t); });
  }

  function $(id) { return document.getElementById(id); }

  function init() {
    els = {
      screen: $('screen-game'), playfield: $('playfield'), actors: $('actors'),
      fx: $('fx-layer'), score: $('hud-score'), acc: $('hud-acc'), accBadge: $('hud-acc-badge'),
      timerFill: $('hud-timer-fill'), timerText: $('hud-timer-text'), levelBadge: $('hud-level'),
      whipName: $('hud-whip-name'), cursor: $('whip-cursor'), cdArc: $('cursor-cd-arc'),
      cursorArt: $('cursor-whip-art'),
      countdown: $('countdown'), countdownText: $('countdown-text'),
      hint: $('hint-banner'), pauseOverlay: $('pause-overlay')
    };
    els.screen.addEventListener('pointermove', onPointerMove);
    els.screen.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && running && phase === 'play') togglePause();
    });
    $('btn-pause').addEventListener('click', (e) => { e.stopPropagation(); if (running && phase === 'play') togglePause(); });
    $('btn-resume').addEventListener('click', () => togglePause());
    $('btn-quit').addEventListener('click', () => { stop(); if (callbacks.onQuit) callbacks.onQuit(); });
    // watchdog: rAF is throttled/stopped in hidden or backgrounded tabs;
    // keep the simulation ticking from a timer in that case
    setInterval(() => {
      if (running && !paused && document.visibilityState === 'hidden') loop(performance.now());
    }, 33);
  }

  /* ---------------- lifecycle ---------------- */
  function start(levelDef, whipDef, cbs, showHint) {
    level = levelDef; whip = whipDef; callbacks = cbs || {};
    running = true; paused = false; phase = 'countdown';
    gameTime = 0; countdownT = 0; lastTs = 0;
    actors = []; openWindows = 0; lastWindowClose = -99999; spawnAt = 0.5;
    hitPoints = 0; penalty = 0; hits = 0; whiffs = 0; expired = 0; asksShown = 0; perfects = 0;
    cooldownUntil = 0; graceHits = [];
    hintUntil = showHint ? 7 : 0;

    els.actors.innerHTML = '';
    els.fx.innerHTML = '';
    els.score.textContent = '0';
    els.acc.textContent = '100%';
    els.whipName.textContent = whip.name;
    els.levelBadge.textContent = level.name;
    els.cursorArt.innerHTML = WHIP_ART[whip.id];
    els.timerFill.style.width = '100%';
    els.timerFill.classList.remove('low');
    els.timerText.textContent = fmtTime(level.duration);
    els.pauseOverlay.classList.add('hidden');
    els.hint.classList.toggle('hidden', !showHint);
    els.countdown.classList.remove('hidden');
    els.countdownText.textContent = '3';
    els.playfield.classList.remove('frozen');
    AudioEngine.sfx.countTick();

    schedule();
  }

  function stop() {
    running = false; paused = false; phase = 'idle';
    els.playfield.classList.remove('frozen');
  }

  function togglePause() {
    if (!running) return;
    paused = !paused;
    els.pauseOverlay.classList.toggle('hidden', !paused);
    els.playfield.classList.toggle('frozen', paused);
    AudioEngine.sfx.click();
    if (!paused) { lastTs = 0; schedule(); }
  }

  /* ---------------- main loop ---------------- */
  function loop(ts) {
    if (!running || paused) return;
    if (!lastTs) lastTs = ts;
    let dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;

    if (phase === 'countdown') {
      countdownT += dt;
      const stepNames = ['3', '2', '1', 'SLAP!'];
      const step = Math.min(Math.floor(countdownT / 0.7), 3);
      if (els.countdownText.textContent !== stepNames[step]) {
        els.countdownText.textContent = stepNames[step];
        // retrigger pop animation
        els.countdownText.parentElement.classList.remove('hidden');
        els.countdownText.style.animation = 'none';
        void els.countdownText.offsetWidth;
        els.countdownText.style.animation = '';
        if (step < 3) AudioEngine.sfx.countTick(); else AudioEngine.sfx.countGo();
      }
      if (countdownT >= 0.7 * 3 + 0.6) {
        els.countdown.classList.add('hidden');
        phase = 'play';
      }
      schedule();
      return;
    }

    gameTime += dt;
    updateTimerHud();
    if (hintUntil && gameTime > hintUntil) { els.hint.classList.add('hidden'); hintUntil = 0; }

    // spawn
    if (gameTime >= spawnAt && actors.filter(a => a.state !== 'exiting').length < level.maxChars) {
      trySpawn();
    }

    // actors
    for (const a of actors) updateActor(a, dt);
    actors = actors.filter(a => !a.dead);

    // cursor cooldown arc
    updateCooldownArc();

    // grace list cleanup
    const now = gameTime * 1000;
    graceHits = graceHits.filter(g => now - g.closedAt < SCORING.graceMs);

    if (gameTime >= level.duration) { finish(); return; }
    schedule();
  }

  function fmtTime(s) {
    s = Math.max(0, Math.ceil(s));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function updateTimerHud() {
    const remain = Math.max(0, level.duration - gameTime);
    els.timerFill.style.width = (remain / level.duration * 100) + '%';
    els.timerText.textContent = fmtTime(remain);
    els.timerFill.classList.toggle('low', remain < 10);
  }

  /* ---------------- actors ---------------- */
  function trySpawn() {
    // lane pick honoring back-lane share
    let laneIdx;
    const r = Math.random();
    if (r < level.backShare) laneIdx = 0;
    else laneIdx = Math.random() < 0.5 ? 1 : 2;

    // avoid stacking near the entry edge of that lane
    const dir = Math.random() < 0.5 ? 1 : -1;
    const entryX = dir === 1 ? -150 : PF_W + 150;
    const conflict = actors.some(a => a.lane === laneIdx && Math.abs(a.x - entryX) < 420);
    if (conflict) { spawnAt = gameTime + 0.4; return; }

    // character variety: prefer one not currently on screen
    const onScreen = new Set(actors.map(a => a.def.id));
    let pool = CHARACTERS.filter(c => !onScreen.has(c.id));
    if (!pool.length) pool = CHARACTERS;
    const def = pool[Math.floor(Math.random() * pool.length)];

    const el = document.createElement('div');
    el.className = 'actor walking';
    el.style.width = def.width + 'px';
    el.style.height = def.height + 'px';
    el.style.zIndex = LANES[laneIdx].z;
    el.innerHTML = buildActorHTML(def);
    els.actors.appendChild(el);

    const a = {
      def, el, lane: laneIdx,
      x: entryX, dir,
      speed: BASE_SPEED * level.speed * (0.9 + Math.random() * 0.25),
      state: 'walking', stateUntil: 0,
      asksLeft: 1 + Math.floor(Math.random() * 3),
      nextAskAt: gameTime + rand(level.askDelay[0], level.askDelay[1]) / 1000,
      dead: false, closingWarned: false
    };
    a.hitzone = el.querySelector('.hitzone');
    place(a);
    actors.push(a);
    spawnAt = gameTime + rand(400, 1200) / 1000;
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function place(a) {
    const lane = LANES[a.lane];
    const laneY = lane.floor * PF_H;
    const W = a.def.width, H = a.def.height;
    a.el.style.transformOrigin = (W / 2) + 'px ' + H + 'px';
    a.el.style.transform = `translate(${a.x - W / 2}px, ${laneY - H}px) scale(${lane.scale})`;
  }

  function setState(a, state, durMs) {
    a.el.classList.remove('walking', 'telegraph', 'asking', 'hit', 'taunt', 'expired', 'exiting', 'closing', 'joy');
    a.state = state;
    a.el.classList.add(state);
    a.stateUntil = durMs ? gameTime + durMs / 1000 : Infinity;
  }

  function updateActor(a, dt) {
    switch (a.state) {
      case 'walking': {
        a.x += a.dir * a.speed * dt;
        // reached far edge -> remove
        if (a.x < -220 || a.x > PF_W + 220) { removeActor(a); return; }
        // time to ask?
        if (a.asksLeft > 0 && gameTime >= a.nextAskAt &&
            a.x > 180 && a.x < PF_W - 180 &&
            openWindows < level.maxOpen &&
            (gameTime * 1000 - lastWindowClose) >= WINDOW_GAP_MS) {
          setState(a, 'telegraph', TELEGRAPH_MS);
        }
        break;
      }
      case 'telegraph':
        if (gameTime >= a.stateUntil) {
          setState(a, 'asking', level.window);
          a.windowOpenedAt = gameTime;
          a.closingWarned = false;
          openWindows++;
          asksShown++;
        }
        break;
      case 'asking': {
        const remainMs = (a.stateUntil - gameTime) * 1000;
        if (!a.closingWarned && remainMs < 300) { a.el.classList.add('closing'); a.closingWarned = true; }
        if (gameTime >= a.stateUntil) {
          // window expired, nobody struck
          openWindows--;
          lastWindowClose = gameTime * 1000;
          expired++;
          a.asksLeft--;
          graceHits.push({ actor: a, closedAt: gameTime * 1000 });
          updateAccuracyHud();
          AudioEngine.sfx.expire();
          setState(a, 'expired', 700);
        }
        break;
      }
      case 'expired':
        if (gameTime >= a.stateUntil) resumeWalk(a);
        break;
      case 'hit':
        if (gameTime >= a.stateUntil) {
          setState(a, 'exiting');
          // scamper toward the nearest edge
          a.dir = a.x < PF_W / 2 ? -1 : 1;
        }
        break;
      case 'exiting':
        a.x += a.dir * a.speed * EXIT_MULT * dt;
        if (a.x < -260 || a.x > PF_W + 260) { removeActor(a); return; }
        break;
      case 'taunt':
        a.x += a.dir * a.speed * dt; // keeps walking while taunting
        if (a.x < -220 || a.x > PF_W + 220) { removeActor(a); return; }
        if (gameTime >= a.stateUntil) resumeWalk(a);
        break;
    }
    place(a);
  }

  function resumeWalk(a) {
    setState(a, 'walking');
    a.nextAskAt = gameTime + rand(level.askDelay[0], level.askDelay[1]) / 1000;
  }

  function removeActor(a) {
    if (a.state === 'asking') { openWindows--; lastWindowClose = gameTime * 1000; }
    a.dead = true;
    a.el.remove();
  }

  /* ---------------- input / strikes ---------------- */
  function stageScale() { return window.__stageScale || 1; }

  function onPointerMove(e) {
    if (e.pointerType === 'touch') { els.cursor.style.display = 'none'; return; }
    els.cursor.style.display = '';
    const rect = els.screen.getBoundingClientRect();
    const s = stageScale();
    els.cursor.style.transform = `translate(${(e.clientX - rect.left) / s}px, ${(e.clientY - rect.top) / s}px)`;
  }

  function onPointerDown(e) {
    if (!running || paused || phase !== 'play') return;
    if (e.target.closest('button')) return;
    AudioEngine.ensure();
    const nowMs = gameTime * 1000;
    if (nowMs < cooldownUntil) return; // whip not ready: click does nothing

    cooldownUntil = nowMs + whip.cooldown;
    AudioEngine.sfx.crack(whip.id);
    els.cursor.classList.remove('striking');
    void els.cursor.offsetWidth;
    els.cursor.classList.add('striking');
    setTimeout(() => els.cursor.classList.remove('striking'), 240);

    // hit test in screen space against every open (or just-closed) hitzone
    const cx = e.clientX, cy = e.clientY;
    let best = null;
    const candidates = actors.filter(a => a.state === 'asking')
      .concat(graceHits.map(g => g.actor).filter(a => !a.dead && a.state === 'expired'));
    for (const a of candidates) {
      const r = a.hitzone.getBoundingClientRect();
      const zx = r.left + r.width / 2, zy = r.top + r.height / 2;
      const dist = Math.hypot(cx - zx, cy - zy);
      const radius = r.width / 2;
      if (dist <= radius && (!best || dist / radius < best.frac)) {
        best = { actor: a, dist, radius, frac: dist / radius, grace: a.state === 'expired' };
      }
    }

    const pf = els.playfield.getBoundingClientRect();
    const s = stageScale();
    const px = (cx - pf.left) / s, py = (cy - pf.top) / s;

    spawnCrackArc(px, py);
    if (best) registerHit(best, px, py);
    else registerWhiff(cx, cy, px, py);
  }

  function registerHit(hit, px, py) {
    const a = hit.actor;
    const perfect = !hit.grace && hit.frac <= SCORING.perfectRadiusFrac;
    const pts = Math.round(whip.points * (perfect ? SCORING.perfectMult : 1));
    hitPoints += pts; hits++;
    if (perfect) perfects++;

    if (a.state === 'asking') {
      openWindows--;
      lastWindowClose = gameTime * 1000;
      a.asksLeft--;
    } else {
      // grace hit on a just-expired window: undo the expired count
      expired--;
      graceHits = graceHits.filter(g => g.actor !== a);
    }
    setState(a, 'hit', 650);

    // the performer randomly loves it or comically suffers
    const joyful = Math.random() < 0.45;
    if (joyful) {
      a.el.classList.add('joy');
      AudioEngine.sfx.joy();
      spawnHearts(px, py - 30);
    } else {
      AudioEngine.sfx.boing();
      AudioEngine.sfx.ouch();
    }
    if (perfect) AudioEngine.sfx.perfect();

    spawnBurst(px, py, perfect);
    shakePlayfield();
    spawnPop(px, py - 50, '+' + pts, '');
    if (perfect) spawnPop(px, py - 110, 'PERFECT!', 'perfect');
    spawnSparkles(px, py);
    updateScoreHud();
    updateAccuracyHud();
  }

  function registerWhiff(cx, cy, px, py) {
    whiffs++;
    penalty += SCORING.whiffPenalty;
    AudioEngine.sfx.whiff();
    spawnPop(px, py - 30, '-' + SCORING.whiffPenalty, 'penalty');

    // did we smack a covered character? they taunt us.
    for (const a of actors) {
      if (a.dead || a.state === 'hit' || a.state === 'exiting') continue;
      const r = a.el.getBoundingClientRect();
      if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
        if (a.state === 'asking') continue; // shouldn't happen (would be a hit)
        if (a.state === 'walking' || a.state === 'taunt') {
          setState(a, 'taunt', 1000);
          AudioEngine.sfx.taunt();
        }
        break;
      }
    }
    updateScoreHud();
    updateAccuracyHud();
  }

  /* ---------------- HUD / FX ---------------- */
  function displayScore() { return Math.max(0, hitPoints - penalty); }

  function updateScoreHud() {
    els.score.textContent = displayScore().toLocaleString('en-US');
  }

  function accuracyPct() {
    const total = hits + whiffs + expired;
    return total === 0 ? 100 : Math.round(hits / total * 100);
  }

  function updateAccuracyHud() {
    els.acc.textContent = accuracyPct() + '%';
    els.accBadge.classList.remove('bump');
    void els.accBadge.offsetWidth;
    els.accBadge.classList.add('bump');
  }

  function updateCooldownArc() {
    const nowMs = gameTime * 1000;
    const remain = cooldownUntil - nowMs;
    const CIRC = 100.53;
    if (remain <= 0) {
      els.cdArc.style.strokeDashoffset = CIRC;
      els.cursor.classList.remove('cooling');
    } else {
      els.cursor.classList.add('cooling');
      els.cdArc.style.strokeDashoffset = CIRC * (remain / whip.cooldown);
    }
  }

  function spawnPop(x, y, text, cls) {
    const el = document.createElement('div');
    el.className = 'fx-pop ' + cls;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.marginLeft = '-40px';
    el.textContent = text;
    els.fx.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  function spawnBurst(x, y, big) {
    const R = big ? 62 : 46, r = big ? 24 : 18, n = 8;
    let pts = '';
    for (let i = 0; i < n * 2; i++) {
      const ang = (Math.PI * i) / n - Math.PI / 2;
      const rad = i % 2 === 0 ? R : r;
      pts += (R + Math.cos(ang) * rad).toFixed(1) + ',' + (R + Math.sin(ang) * rad).toFixed(1) + ' ';
    }
    const el = document.createElement('div');
    el.className = 'fx-burst';
    el.style.left = (x - R) + 'px';
    el.style.top = (y - R) + 'px';
    el.innerHTML = `<svg width="${R * 2}" height="${R * 2}" viewBox="0 0 ${R * 2} ${R * 2}">
      <polygon points="${pts}" fill="${big ? '#FFCB3D' : '#FFF8EC'}" stroke="#1a1508" stroke-width="5" stroke-linejoin="round"/>
      <circle cx="${R}" cy="${R}" r="${r * 0.55}" fill="#FF6F59" stroke="#1a1508" stroke-width="4"/>
    </svg>`;
    els.fx.appendChild(el);
    setTimeout(() => el.remove(), 350);
  }

  function spawnCrackArc(x, y) {
    const el = document.createElement('div');
    el.className = 'fx-crackline';
    const d = 90;
    el.style.left = (x - d / 2) + 'px';
    el.style.top = (y - d / 2) + 'px';
    el.style.width = d + 'px';
    el.style.height = d + 'px';
    els.fx.appendChild(el);
    setTimeout(() => el.remove(), 260);
  }

  function spawnHearts(x, y) {
    for (let i = 0; i < 3; i++) {
      const el = document.createElement('div');
      el.className = 'fx-heart';
      el.textContent = 'â™¥';
      el.style.left = (x - 18 + (i - 1) * 34 + Math.random() * 14) + 'px';
      el.style.top = (y - Math.random() * 24) + 'px';
      el.style.animationDelay = (i * 0.1) + 's';
      els.fx.appendChild(el);
      setTimeout(() => el.remove(), 1500);
    }
  }

  function shakePlayfield() {
    els.playfield.classList.remove('shake');
    void els.playfield.offsetWidth;
    els.playfield.classList.add('shake');
    setTimeout(() => els.playfield.classList.remove('shake'), 180);
  }

  function spawnSparkles(x, y) {
    const colors = ['#FFF8EC', '#2EC4C6', '#FF6F59', '#FFCB3D'];
    for (let i = 0; i < 4; i++) {
      const el = document.createElement('div');
      el.className = 'fx-sparkle';
      const size = 12 + Math.random() * 14;
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.background = colors[i % colors.length];
      el.style.left = (x - size / 2 + (Math.random() * 120 - 60)) + 'px';
      el.style.top = (y - size / 2 + (Math.random() * 100 - 50)) + 'px';
      el.style.animationDelay = (Math.random() * 0.15) + 's';
      els.fx.appendChild(el);
      setTimeout(() => el.remove(), 1600);
    }
  }

  /* ---------------- results ---------------- */
  function finish() {
    running = false; phase = 'idle';
    const acc = accuracyPct();
    const accuracyBonus = acc * SCORING.accuracyBonusPerPct;
    const total = displayScore() + accuracyBonus;
    // reference: every ask hit PERFECT with the equipped whip + full accuracy bonus
    const ref = asksShown * whip.points * SCORING.perfectMult + 1000;
    let stars = 0;
    if (ref > 0) {
      const frac = total / ref;
      stars = SCORING.starThresholds.filter(t => frac >= t).length;
    }
    const results = {
      levelId: level.id,
      hitPoints, penalty, accuracy: acc, accuracyBonus, total, stars,
      hits, whiffs, expired, perfects
    };
    if (callbacks.onEnd) callbacks.onEnd(results);
  }

  return { init, start, stop };
})();
