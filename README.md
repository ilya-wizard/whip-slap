# Whip Slap!

A cartoon reflex arcade web game. Characters cross the stage and briefly bare
a body part; crack your whip on the gold ring in time. Full rules and numbers:
[GAME-MECHANICS.md](GAME-MECHANICS.md).

## Play

Open the GitHub Pages deployment, or run locally with any static file server:

```
npx http-server . -p 8321
```

then open http://localhost:8321.

No build step, no dependencies: plain HTML/CSS/JS, two Google Fonts loaded
from fonts.googleapis.com, all art drawn with CSS shapes, all sound
synthesized with Web Audio.

## Structure

- `index.html` — all screens (menu, level select, whip select, gameplay, results)
- `css/base.css` — design tokens, stage scaling, buttons, shared keyframes
- `css/screens.css` — per-screen layout + HUD + FX styles
- `css/characters.css` — actor state machine styles (walking / telegraph / asking / hit / taunt)
- `js/data.js` — whips, level difficulty curve, scoring constants, lanes
- `js/audio.js` — Web Audio SFX + procedural carnival music loop
- `js/characters.js` — CSS-shape performer construction (Boffo/Nubbin/Pudge/Twizzle)
- `js/game.js` — game engine: spawning, ask scheduling, strikes, scoring, timer
- `js/ui.js` — navigation, persistence (localStorage), results, settings
- `js/main.js` — stage scaling bootstrap

Progress is stored in localStorage under `whipslap-save-v1`.
