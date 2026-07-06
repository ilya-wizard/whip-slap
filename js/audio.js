/* =========================================================
   AUDIO: everything synthesized with Web Audio, no assets.
   Signal chain: sfx -> compressor (punch) + convolver reverb
   (the tail that makes cracks feel real and loud).
   Voices use formant filters over pitch contours for
   exaggerated cartoon "ouch!" / "whee!" reactions.
   ========================================================= */
const AudioEngine = (() => {
  let ctx = null;
  let master, comp, sfxGain, verb, verbGain, musicGain;
  let noiseBuf = null;
  let sfxOn = true, musicOn = true;
  let musicTimer = null, musicPlaying = false;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();

    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);

    // punch compressor for all sfx
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 5;
    comp.attack.value = 0.002; comp.release.value = 0.16;
    comp.connect(master);

    sfxGain = ctx.createGain(); sfxGain.gain.value = sfxOn ? 1 : 0;
    sfxGain.connect(comp);

    // procedural reverb: 1.1s exponentially decaying noise impulse
    verb = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 1.1);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
    }
    verb.buffer = ir;
    verbGain = ctx.createGain(); verbGain.gain.value = 0.4;
    sfxGain.connect(verb); verb.connect(verbGain); verbGain.connect(comp);

    musicGain = ctx.createGain(); musicGain.gain.value = musicOn ? 0.22 : 0;
    musicGain.connect(master);

    // shared noise buffer (1s white noise)
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    return true;
  }

  function setSfx(on) { sfxOn = on; if (sfxGain) sfxGain.gain.value = on ? 1 : 0; }
  function setMusic(on) {
    musicOn = on;
    if (musicGain) musicGain.gain.value = on ? 0.22 : 0;
    if (on && ctx && !musicPlaying) startMusic();
  }

  /* ---------- helpers ---------- */
  function env(node, t0, a, peak, dur) {
    node.gain.setValueAtTime(0.0001, t0);
    node.gain.linearRampToValueAtTime(peak, t0 + a);
    node.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  }
  function osc(type, freq, t0, dur, peak, freqEnd, dest) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
    env(g, t0, 0.005, peak, dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, peak, filterType, f0, f1, q, attack) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    src.loop = true;
    const flt = ctx.createBiquadFilter(); flt.type = filterType || 'bandpass';
    flt.frequency.setValueAtTime(f0, t0);
    if (f1) flt.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    flt.Q.value = q || 1;
    const g = ctx.createGain(); env(g, t0, attack || 0.002, peak, dur);
    src.connect(flt); flt.connect(g); g.connect(sfxGain);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }

  /* Cartoon voice: sawtooth larynx -> soft clip -> two formant
     bandpass filters + low body, with pitch contour + vibrato.
     pitch: [[timeOffset, Hz], ...]; f1/f2: [[timeOffset, Hz], ...] */
  let shaperCurve = null;
  function voice({ t0, dur, peak = 0.9, pitch, f1, f2, vibRate = 0, vibDepth = 0, trem = 0 }) {
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(pitch[0][1], t0 + pitch[0][0]);
    for (let i = 1; i < pitch.length; i++) o.frequency.exponentialRampToValueAtTime(pitch[i][1], t0 + pitch[i][0]);

    if (vibRate > 0) {
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = vibRate; lg.gain.value = vibDepth;
      lfo.connect(lg); lg.connect(o.frequency);
      lfo.start(t0); lfo.stop(t0 + dur + 0.05);
    }

    if (!shaperCurve) {
      shaperCurve = new Float32Array(256);
      for (let i = 0; i < 256; i++) shaperCurve[i] = Math.tanh((i / 128 - 1) * 3);
    }
    const sh = ctx.createWaveShaper(); sh.curve = shaperCurve;

    const mkFormant = (contour, q, gainVal) => {
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
      bp.frequency.setValueAtTime(contour[0][1], t0 + contour[0][0]);
      for (let i = 1; i < contour.length; i++) bp.frequency.linearRampToValueAtTime(contour[i][1], t0 + contour[i][0]);
      const fg = ctx.createGain(); fg.gain.value = gainVal;
      sh.connect(bp); bp.connect(fg);
      return fg;
    };

    const out = ctx.createGain();
    if (trem > 0) {
      const tl = ctx.createOscillator(), tg = ctx.createGain();
      tl.type = 'square'; tl.frequency.value = trem; tg.gain.value = 0.5;
      tl.connect(tg); tg.connect(out.gain);
      tl.start(t0); tl.stop(t0 + dur + 0.05);
    }
    env(out, t0, 0.02, peak, dur);

    o.connect(sh);
    mkFormant(f1, 5, 1.0).connect(out);
    mkFormant(f2, 7, 0.6).connect(out);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
    const lg2 = ctx.createGain(); lg2.gain.value = 0.35;
    sh.connect(lp); lp.connect(lg2); lg2.connect(out);
    out.connect(sfxGain);
    o.start(t0); o.stop(t0 + dur + 0.08);
  }

  // scale helper: random pitch variation so repeats never sound identical
  function vary() { return 0.88 + Math.random() * 0.28; }
  function scaled(contour, r) { return contour.map(([t, f]) => [t, f * r]); }

  /* ---------- SFX ---------- */
  const sfx = {
    click() { if (!ensure()) return; const t = ctx.currentTime; osc('square', 660, t, 0.06, 0.15); osc('square', 990, t + 0.05, 0.05, 0.1); },

    countTick() { if (!ensure()) return; const t = ctx.currentTime; osc('square', 520, t, 0.1, 0.25); },
    countGo() { if (!ensure()) return; const t = ctx.currentTime; osc('square', 520, t, 0.08, 0.25); osc('square', 780, t + 0.08, 0.2, 0.3); osc('square', 1040, t + 0.16, 0.25, 0.25); },

    // per-whip crack: swish -> SNAP transient -> reverb tail does the rest
    crack(whipId) {
      if (!ensure()) return; const t = ctx.currentTime;
      if (whipId === 'flogger') {
        // wide swish + three fat leather slaps
        noise(t, 0.07, 0.35, 'bandpass', 700, 3000, 1, 0.03);
        for (let i = 0; i < 3; i++) {
          const tt = t + 0.045 + i * 0.032;
          noise(tt, 0.035, 1.0, 'bandpass', 1300 - i * 200, 500, 1.2);
          noise(tt, 0.08, 0.5, 'lowpass', 700 - i * 100, 180, 0.7);
          osc('sine', 150 - i * 15, tt, 0.09, 0.45, 60);
        }
      } else if (whipId === 'cane') {
        // thin fast whoosh + brutal THWACK with wooden knock
        noise(t, 0.045, 0.4, 'bandpass', 2200, 5200, 2, 0.02);
        const tt = t + 0.042;
        noise(tt, 0.018, 1.4, 'highpass', 1600, null, 0.7);
        noise(tt, 0.07, 0.9, 'lowpass', 1100, 250, 0.8);
        osc('triangle', 240, tt, 0.07, 0.8, 70);
        osc('sine', 110, tt, 0.16, 0.7, 45);
      } else {
        // bullwhip: rising swish into a supersonic CRACK
        noise(t, 0.075, 0.4, 'bandpass', 500, 4200, 1.2, 0.035);
        const tt = t + 0.07;
        noise(tt, 0.014, 1.6, 'highpass', 2500, null, 0.5);  // the snap itself
        noise(tt, 0.01, 1.2, 'bandpass', 5200, null, 0.7);   // sizzle on top
        noise(tt + 0.004, 0.045, 0.7, 'bandpass', 2400, 400, 1); // body of the crack
        osc('square', 2800, tt, 0.014, 0.5, 300);
        osc('sine', 170, tt, 0.1, 0.5, 60);                   // chest thump
        noise(tt + 0.1, 0.015, 0.25, 'highpass', 3000, null, 0.6); // slap-back echo
      }
    },

    // exaggerated cartoon "OUCH" voices: 5 variations
    ouch() {
      if (!ensure()) return; const t = ctx.currentTime;
      const r = vary();
      switch (Math.floor(Math.random() * 5)) {
        case 0: // "YEEE-OWWWW!" big up then long fall
          voice({ t0: t, dur: 0.55, peak: 1.0,
            pitch: scaled([[0, 340], [0.09, 1150], [0.2, 850], [0.55, 210]], r),
            f1: [[0, 420], [0.12, 850], [0.55, 500]], f2: [[0, 2200], [0.12, 1300], [0.55, 950]],
            vibRate: 9, vibDepth: 25 });
          break;
        case 1: // "OWWW!" hard attack, steep drop
          voice({ t0: t, dur: 0.32, peak: 1.1,
            pitch: scaled([[0, 780], [0.06, 620], [0.32, 170]], r),
            f1: [[0, 900], [0.32, 450]], f2: [[0, 1400], [0.32, 900]] });
          break;
        case 2: // "YIPE!!" shrill spike
          voice({ t0: t, dur: 0.17, peak: 1.0,
            pitch: scaled([[0, 700], [0.05, 1550], [0.17, 750]], r),
            f1: [[0, 350], [0.06, 600], [0.17, 400]], f2: [[0, 2500], [0.17, 1800]] });
          break;
        case 3: // "WAH-HA-HAAA" sobbing wobble
          voice({ t0: t, dur: 0.6, peak: 0.95,
            pitch: scaled([[0, 620], [0.12, 430], [0.24, 560], [0.38, 380], [0.6, 260]], r),
            f1: [[0, 800], [0.6, 550]], f2: [[0, 1250], [0.6, 950]],
            trem: 8 });
          break;
        case 4: // "HOO-HOO-HOO!" bouncing yelps
          [0, 0.14, 0.28].forEach((dt, i) => voice({ t0: t + dt, dur: 0.11, peak: 0.9,
            pitch: scaled([[0, 640 - i * 70], [0.11, 420 - i * 50]], r),
            f1: [[0, 500]], f2: [[0, 1050]] }));
          break;
      }
    },

    // exaggerated delighted reactions: 3 variations
    joy() {
      if (!ensure()) return; const t = ctx.currentTime;
      const r = vary();
      switch (Math.floor(Math.random() * 3)) {
        case 0: // "HEE-HEE-HEE-HEE!" ascending giggle
          [0, 0.11, 0.22, 0.33].forEach((dt, i) => voice({ t0: t + dt, dur: 0.09, peak: 0.85,
            pitch: scaled([[0, 750 + i * 130], [0.09, 900 + i * 150]], r),
            f1: [[0, 320]], f2: [[0, 2500]] }));
          break;
        case 1: // "WHEEEEEE!" long rising squeal with vibrato
          voice({ t0: t, dur: 0.6, peak: 1.0,
            pitch: scaled([[0, 480], [0.35, 1350], [0.6, 1500]], r),
            f1: [[0, 350], [0.3, 320]], f2: [[0, 2300], [0.6, 2700]],
            vibRate: 10, vibDepth: 40 });
          break;
        case 2: // "WOO-HOO!!" two punchy whoops
          voice({ t0: t, dur: 0.18, peak: 1.0,
            pitch: scaled([[0, 550], [0.07, 950], [0.18, 800]], r),
            f1: [[0, 400], [0.18, 600]], f2: [[0, 900], [0.18, 1400]] });
          voice({ t0: t + 0.2, dur: 0.28, peak: 1.0,
            pitch: scaled([[0, 620], [0.08, 1250], [0.28, 900]], r),
            f1: [[0, 450], [0.28, 700]], f2: [[0, 1000], [0.28, 1700]],
            vibRate: 9, vibDepth: 30 });
          break;
      }
    },

    // comic hit reaction (boing spring)
    boing() {
      if (!ensure()) return; const t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(300, t);
      o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
      o.frequency.exponentialRampToValueAtTime(420, t + 0.16);
      o.frequency.exponentialRampToValueAtTime(180, t + 0.26);
      o.frequency.exponentialRampToValueAtTime(320, t + 0.34);
      env(g, t, 0.01, 0.4, 0.42);
      o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.5);
    },

    perfect() {
      if (!ensure()) return; const t = ctx.currentTime;
      osc('triangle', 880, t, 0.1, 0.3);
      osc('triangle', 1320, t + 0.07, 0.16, 0.3);
      osc('triangle', 1760, t + 0.14, 0.22, 0.25);
    },

    whiff() {
      if (!ensure()) return; const t = ctx.currentTime;
      noise(t, 0.12, 0.14, 'bandpass', 900, 300, 1);
      osc('sawtooth', 220, t + 0.02, 0.22, 0.16, 130); // sad little slide down
    },

    taunt() {
      if (!ensure()) return; const t = ctx.currentTime;
      // nyah-nyah squeak
      osc('square', 620, t, 0.09, 0.16, 700);
      osc('square', 520, t + 0.11, 0.09, 0.16, 580);
      osc('square', 660, t + 0.22, 0.13, 0.16, 500);
    },

    expire() {
      if (!ensure()) return; const t = ctx.currentTime;
      osc('square', 300, t, 0.08, 0.09, 240); // tiny raspberry blip
      osc('square', 250, t + 0.07, 0.1, 0.09, 180);
    },

    star() {
      if (!ensure()) return; const t = ctx.currentTime;
      osc('triangle', 1050, t, 0.14, 0.35, 1500);
      noise(t, 0.1, 0.1, 'highpass', 5000, null, 1);
    },

    fanfare(stars) {
      if (!ensure()) return; const t = ctx.currentTime;
      const notes = stars >= 3 ? [523, 659, 784, 1046] : stars >= 1 ? [523, 659, 784] : [392, 330];
      notes.forEach((f, i) => {
        osc('square', f, t + i * 0.13, 0.22, 0.18);
        osc('triangle', f * 2, t + i * 0.13, 0.22, 0.12);
      });
    }
  };

  /* ---------- MUSIC: light carnival oompah loop ---------- */
  // 8-bar loop, ~148 bpm. Oompah bass (root-fifth) + plinky melody.
  const MELODY = [
    // [beat, semitone offset from C5, length in beats]
    [0, 0, .5], [1, 4, .5], [2, 7, .5], [3, 4, .5],
    [4, 0, .5], [5, 4, .5], [6, 7, 1],
    [8, 9, .5], [9, 7, .5], [10, 5, .5], [11, 4, .5],
    [12, 2, .5], [13, 4, .5], [14, 0, 1],
    [16, 0, .5], [17, 5, .5], [18, 9, .5], [19, 5, .5],
    [20, 4, .5], [21, 7, .5], [22, 12, 1],
    [24, 11, .5], [25, 9, .5], [26, 7, .5], [27, 5, .5],
    [28, 4, .5], [29, 2, .5], [30, 0, 1.5]
  ];
  const BASSLINE = []; // generated: oom-pah per beat
  for (let b = 0; b < 32; b += 2) {
    const bar = Math.floor(b / 8) % 4;
    const root = [0, 5, 7, 0][bar] - 24; // C F G C, two octaves down
    BASSLINE.push([b, root], [b + 1, root + 7]);
  }
  const BPM = 148, BEAT = 60 / BPM, LOOP_BEATS = 32;

  function noteFreq(semiFromC5) { return 523.25 * Math.pow(2, semiFromC5 / 12); }

  function scheduleLoop(t0) {
    MELODY.forEach(([beat, semi, len]) => {
      const t = t0 + beat * BEAT;
      // banjo-ish pluck: triangle with fast decay + a bit of noise attack
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = noteFreq(semi);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.5, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(len * BEAT, 0.5));
      o.connect(g); g.connect(musicGain);
      o.start(t); o.stop(t + len * BEAT + 0.05);
    });
    BASSLINE.forEach(([beat, semi]) => {
      const t = t0 + beat * BEAT;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = noteFreq(semi);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.55, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + BEAT * 0.85);
      o.connect(g); g.connect(musicGain);
      o.start(t); o.stop(t + BEAT);
    });
  }

  function startMusic() {
    if (!ensure() || musicPlaying) return;
    musicPlaying = true;
    let nextLoop = ctx.currentTime + 0.1;
    scheduleLoop(nextLoop);
    nextLoop += LOOP_BEATS * BEAT;
    musicTimer = setInterval(() => {
      if (ctx.currentTime > nextLoop - 1.5) {
        scheduleLoop(nextLoop);
        nextLoop += LOOP_BEATS * BEAT;
      }
    }, 500);
  }
  function stopMusic() {
    musicPlaying = false;
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }

  return { ensure, sfx, setSfx, setMusic, startMusic, stopMusic, get musicOn() { return musicOn; }, get sfxOn() { return sfxOn; } };
})();
