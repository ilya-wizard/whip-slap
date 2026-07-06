/* =========================================================
   UI: screen navigation, level select, whip select,
   results, settings, persistence.
   ========================================================= */
const UI = (() => {
  let save = null;
  let currentLevelId = 1;

  function $(id) { return document.getElementById(id); }

  /* ---------------- persistence ---------------- */
  function loadSave() {
    try {
      save = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) { save = {}; }
    save.stars = save.stars || {};
    save.best = save.best || {};
    save.whip = save.whip || 'bullwhip';
    if (save.sfx === undefined) save.sfx = true;
    if (save.music === undefined) save.music = true;
    save.hintShown = save.hintShown || false;
  }
  function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); }

  /* ---------------- navigation ---------------- */
  const SCREENS = ['screen-menu', 'screen-levels', 'screen-whips', 'screen-game', 'screen-results'];
  function show(id) {
    SCREENS.forEach(s => $(s).classList.toggle('hidden', s !== id));
  }

  /* ---------------- level select ---------------- */
  function isUnlocked(id) {
    if (id === 0 || id === 1) return true;
    return (save.stars[id - 1] || 0) >= 1;
  }

  function renderLevels() {
    const grid = $('level-grid');
    grid.innerHTML = '';
    LEVELS.forEach(lv => {
      const unlocked = isUnlocked(lv.id);
      const card = document.createElement('div');
      card.className = 'level-card' + (unlocked ? '' : ' locked') + (lv.id === 0 ? ' practice' : '');
      const stars = save.stars[lv.id] || 0;
      const best = save.best[lv.id];
      card.innerHTML = `
        <div class="lv-num">${lv.id === 0 ? '&#9733;' : lv.id}</div>
        <div class="lv-label">${lv.id === 0 ? 'PRACTICE' : (unlocked ? 'LEVEL' : 'LOCKED')}</div>
        ${lv.id === 0 ? '<div class="lv-best">warm-up, no stars</div>' : `
        <div class="lv-stars">
          ${[1, 2, 3].map(n => `<div class="lv-star${stars >= n ? ' earned' : ''}"></div>`).join('')}
        </div>
        <div class="lv-best">${best ? 'Best: ' + best.toLocaleString('en-US') : '&nbsp;'}</div>`}
      `;
      if (unlocked) {
        card.addEventListener('click', () => {
          AudioEngine.sfx.click();
          currentLevelId = lv.id;
          openWhips();
        });
      }
      grid.appendChild(card);
    });
  }

  /* ---------------- whip select ---------------- */
  function renderWhips() {
    const grid = $('whip-grid');
    grid.innerHTML = '';
    WHIPS.forEach(w => {
      const card = document.createElement('div');
      card.className = 'whip-card' + (save.whip === w.id ? ' selected' : '');
      card.innerHTML = `
        <div class="whip-art">
          <div class="equipped-tag">EQUIPPED</div>
          ${WHIP_ART[w.id]}
        </div>
        <div class="whip-body">
          <div class="whip-name">${w.name}</div>
          <div class="whip-flavor">${w.flavor}</div>
          <div class="whip-stats">
            <div class="stat-row"><span class="stat-label">SPEED</span><div class="stat-track"><div class="stat-fill speed" style="width:${w.speedBar}%"></div></div></div>
            <div class="stat-row"><span class="stat-label">POINTS</span><div class="stat-track"><div class="stat-fill points" style="width:${w.pointsBar}%"></div></div></div>
          </div>
        </div>`;
      card.addEventListener('click', () => {
        AudioEngine.sfx.click();
        save.whip = w.id;
        persist();
        renderWhips();
      });
      grid.appendChild(card);
    });
    const lv = LEVELS.find(l => l.id === currentLevelId);
    $('whips-level-chip').textContent = lv.name;
  }

  function openWhips() {
    renderWhips();
    show('screen-whips');
  }

  /* ---------------- gameplay flow ---------------- */
  function startLevel() {
    const lv = LEVELS.find(l => l.id === currentLevelId);
    const whip = getWhip(save.whip);
    const showHint = currentLevelId <= 1 && !save.hintShown;
    if (showHint) { save.hintShown = true; persist(); }
    show('screen-game');
    Game.start(lv, whip, {
      onEnd: showResults,
      onQuit: () => { show('screen-levels'); renderLevels(); }
    }, showHint);
  }

  /* ---------------- results ---------------- */
  const HEADLINES = [
    'OOF, TRY AGAIN!',   // 0 stars
    'NICE SLAP!',        // 1
    'GREAT SLAPPING!',   // 2
    'SLAP MAESTRO!'      // 3
  ];

  function showResults(res) {
    const isPractice = res.levelId === 0;
    if (!isPractice) {
      if (res.stars > (save.stars[res.levelId] || 0)) save.stars[res.levelId] = res.stars;
      if (res.total > (save.best[res.levelId] || 0)) save.best[res.levelId] = res.total;
      persist();
    }

    $('results-eyebrow').textContent = isPractice
      ? 'PRACTICE COMPLETE'
      : `LEVEL ${res.levelId} ${res.stars > 0 ? 'CLEAR' : 'FAILED'}`;
    $('results-headline').textContent = HEADLINES[res.stars];
    $('results-total').textContent = res.total.toLocaleString('en-US');
    $('results-hits').textContent = res.hitPoints.toLocaleString('en-US');
    $('results-accuracy').textContent = `${res.accuracyBonus.toLocaleString('en-US')} (${res.accuracy}%)`;
    $('results-penalty').textContent = res.penalty > 0 ? '-' + res.penalty.toLocaleString('en-US') : '0';

    // stars: reset animation then apply earned
    [1, 2, 3].forEach(n => {
      const star = $('star-' + n);
      star.classList.remove('earned');
      void star.offsetWidth;
      if (!isPractice && res.stars >= n) star.classList.add('earned');
    });

    // NEXT (to level selection): shown for any cleared non-practice run
    const hasNext = !isPractice && res.stars >= 1;
    $('btn-next').style.display = hasNext ? '' : 'none';

    show('screen-results');
    AudioEngine.sfx.fanfare(res.stars);
    if (!isPractice && res.stars > 0) {
      for (let n = 1; n <= res.stars; n++) setTimeout(() => AudioEngine.sfx.star(), 150 * n);
    }
  }

  /* ---------------- settings ---------------- */
  function refreshToggles() {
    const sfxBtn = $('toggle-sfx'), musicBtn = $('toggle-music');
    sfxBtn.textContent = save.sfx ? 'ON' : 'OFF';
    sfxBtn.classList.toggle('off', !save.sfx);
    musicBtn.textContent = save.music ? 'ON' : 'OFF';
    musicBtn.classList.toggle('off', !save.music);
  }

  /* ---------------- wiring ---------------- */
  function init() {
    loadSave();
    AudioEngine.setSfx(save.sfx);
    AudioEngine.setMusic(save.music);
    buildMenuPerformers($('menu-performers'));

    $('btn-play').addEventListener('click', () => {
      AudioEngine.ensure();
      if (save.music) AudioEngine.startMusic();
      AudioEngine.sfx.click();
      renderLevels();
      show('screen-levels');
    });
    $('btn-settings').addEventListener('click', () => {
      AudioEngine.ensure();
      AudioEngine.sfx.click();
      refreshToggles();
      $('settings-panel').classList.remove('hidden');
    });
    $('btn-settings-close').addEventListener('click', () => {
      AudioEngine.sfx.click();
      $('settings-panel').classList.add('hidden');
    });
    $('toggle-sfx').addEventListener('click', () => {
      save.sfx = !save.sfx; persist();
      AudioEngine.setSfx(save.sfx);
      AudioEngine.sfx.click();
      refreshToggles();
    });
    $('toggle-music').addEventListener('click', () => {
      save.music = !save.music; persist();
      AudioEngine.setMusic(save.music);
      if (save.music) AudioEngine.startMusic();
      AudioEngine.sfx.click();
      refreshToggles();
    });
    $('btn-reset-progress').addEventListener('click', () => {
      save.stars = {}; save.best = {}; save.hintShown = false; persist();
      AudioEngine.sfx.click();
      $('btn-reset-progress').textContent = 'DONE!';
      setTimeout(() => { $('btn-reset-progress').textContent = 'RESET'; }, 1200);
    });

    $('btn-levels-back').addEventListener('click', () => { AudioEngine.sfx.click(); show('screen-menu'); });
    $('btn-whips-back').addEventListener('click', () => { AudioEngine.sfx.click(); renderLevels(); show('screen-levels'); });
    $('btn-start-level').addEventListener('click', () => { AudioEngine.sfx.click(); startLevel(); });

    $('btn-retry').addEventListener('click', () => { AudioEngine.sfx.click(); startLevel(); });
    $('btn-next').addEventListener('click', () => {
      AudioEngine.sfx.click();
      renderLevels();
      show('screen-levels');
    });
    $('btn-results-menu').addEventListener('click', () => { AudioEngine.sfx.click(); show('screen-menu'); });

    show('screen-menu');
  }

  return { init };
})();
