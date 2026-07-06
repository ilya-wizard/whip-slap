/* =========================================================
   BOOTSTRAP: stage scaling + module init
   ========================================================= */
(function () {
  const STAGE_W = 1920, STAGE_H = 1080;

  function fit() {
    const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    window.__stageScale = s;
    document.getElementById('stage').style.transform = `translate(-50%, -50%) scale(${s})`;
  }
  window.addEventListener('resize', fit);
  fit();

  Game.init();
  UI.init();
})();
