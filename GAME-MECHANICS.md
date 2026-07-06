# Whip Slap! Game Mechanics Specification (v2, simplified, for review)

Companion to `whip-game-design-brief_3.md` (concept/art) and the design handoff in
`Game Design Discussion.zip` (final visual/motion spec). This document defines the
*rules and numbers* of the game. All pixel values are in reference-canvas units
(1920x1080); the whole stage scales uniformly on smaller screens.

Status: reviewed and locked on 2026-07-06. v2 changes vs v1: combo multiplier
removed, power-ups removed, whip windup removed, per-whip hit radius and
lane-range removed; whips reduced to 3 types differing only in cooldown and
points per hit.

---

## 1. Design pillars

1. **Whac-A-Mole, pure and readable.** Short reaction windows, one skill:
   click the right spot at the right moment.
2. **Slapstick, never mean.** Every outcome (hit, whiff, taunt) is a joke.
   No blood, no fear, pure Looney Tunes.
3. **One meaningful choice.** The whip you bring is a tempo-vs-payout bet:
   fast and cheap, balanced, or slow and heavy.

## 2. Core loop (one level)

1. Player picks one of the 3 whips on the Whip Selection screen.
2. Level starts: countdown "3-2-1-SLAP!" (~1.5s), then the level timer runs
   (60s on level 1, up to 90s on later levels).
3. Cartoon performers enter from the left or right edge and cross the screen
   on one of 3 horizontal lanes (front, middle, back; front is drawn larger).
4. On a schedule, a performer stops, telegraphs, then **exposes a body part**
   (the "ask") for a short window, marked with the pulsing gold target ring.
5. The player clicks/taps the exposed zone to slap it. Hits score points and
   trigger the comic reaction. Whiffs cost a few points and earn a taunt.
6. When the timer ends: Level Results screen with star rating and breakdown.

## 3. Input model: "cursor is the whip"

- **Desktop:** move the mouse to aim, click to strike at the cursor position.
  A custom cursor shows the equipped whip's icon.
- **Touch:** tap = strike at the tapped point.
- **Strike resolution:** impact is instant at the click point. If the click
  lands inside an exposed target zone whose window is open, it's a HIT;
  otherwise a WHIFF.
- **Cooldown:** after each strike the whip cannot fire again for its cooldown
  (350-1000ms depending on whip). The cursor dims and a tiny radial sweep on
  it shows the recharge. This is the anti-spam mechanism and the heart of whip
  identity: a heavy whip that just whiffed is dead right when the next window
  opens.
- Clicks during cooldown do nothing (no whiff penalty, no strike).

## 4. Lanes, characters, movement

- **3 lanes** with depth: front (bottom, biggest sprites), middle, back
  (top, smallest). Depth is a natural difficulty dial: back-lane target zones
  are smaller simply because the sprite is smaller. No per-whip lane rules.
- **Roster (fixed, from the handoff):** Boffo asks with ARM, Nubbin with LEG,
  Pudge with BELLY, Twizzle with BACK. The asked body part is fixed per
  character, so silhouettes double as gameplay information: seeing Pudge
  enter tells you a belly target is coming.
- **Behavior state machine per character:**
  `enter -> walk -> (stop -> telegraph -> ask-window -> react/recover) x 1..3 -> walk -> exit`
  - Walk styles for variety: steady walk, bouncy skip, wobble-zigzag
    (vertical sine within the lane, no lane switching in v1).
  - **Telegraph (anticipation): 400ms.** The character stops, does a little
    shiver, an "!" puff appears. This is the fairness cue that a window is
    about to open.
  - **Ask window:** body part exposed with the gold pulsing ring. Duration is
    level-driven: **1.6s at level 1 shrinking to 0.9s at level 10.**
  - **On hit:** boing reaction, stars orbit the head, +points popup, character
    scampers off (counts as a completed exit).
  - **On window expiry (no strike):** cover slides back, character sticks out
    its tongue briefly, resumes walking. Counts against Accuracy only.
  - **On being struck while NOT exposed** (covered character or empty space):
    WHIFF. The struck character (if any) does the taunt animation.
- **Concurrency:** level-driven. Level 1: max 2 characters on screen, only 1
  ask-window open at a time. By level 10: 3 characters, up to 2 windows open
  simultaneously (never 3, so it stays fair on one pointer).
- Spawning keeps the screen populated: when a character exits, the next
  spawns after 0.4-1.2s (random), alternating entry side, lane chosen to
  avoid stacking two characters in the same lane within 300px.

## 5. Whip roster: 3 types, 2 stats

Whips differ in exactly two parameters: **cooldown** (tempo) and **points per
hit** (payout). Hit area is identical for all whips (the target ring itself).

| Whip     | Cooldown | Points per hit | Personality                          |
|----------|----------|----------------|--------------------------------------|
| Flogger  | 350ms    | 60             | Rapid, forgiving; a whiff barely hurts your tempo. Best when 2 windows open at once. |
| Bullwhip | 600ms    | 100            | The all-rounder and the default equip. |
| Cane     | 1000ms   | 180            | Slow and heavy; biggest payout, but a whiff or a mistimed slap can eat a whole window. |

Balance intent: points-per-second is nearly equal across the three when
play is perfect; the real difference is risk. The Flogger tolerates sloppy
play, the Cane demands discipline and pays for it. Whip Selection cards show
two stat bars (Speed, Points) instead of the three in the original mock.

Each whip keeps its own crack + hit sound (soft multi-thwack for Flogger,
classic "crack!" for Bullwhip, loud "THWOCK" + slide whistle for Cane),
synthesized with Web Audio.

Target zone radius on characters: 55px on the front lane, 44px middle, 34px
back (a fixed 55px local radius scaled by lane depth).

## 6. Scoring

Per-hit score = `whip points x grade`

- **Grade (spatial accuracy):** distance from click point to target center:
  - within 35% of target radius: **PERFECT, x1.5**, gold flash, louder crack;
  - otherwise: **GOOD, x1.0**.
- **Whiff penalty:** a strike that hits nothing exposed costs **-25 points**
  (total score never drops below 0) and triggers the taunt.
- **Expired window** (nobody struck): no point change; counts against
  Accuracy.
- **Accuracy** (for results): `hits / (hits + whiffs + expired windows)`.
- HUD: score badge top-left (per the mock); the top-right badge (combo in the
  original mock) is repurposed to show live **Accuracy %**, pulsing when it
  changes.

## 7. Levels, difficulty, stars

**Campaign of 10 handcrafted levels** plus a Practice level (level 0, no
timer pressure, generous windows) reachable from the menu.

Each level is faster than the last in three independent ways: characters
**move faster**, they **expose for a shorter time**, and they **ask more
often**. Values interpolate level 1 -> 10:

| Driver                        | Level 1 | Level 10 |
|-------------------------------|---------|----------|
| Level duration                | 60s     | 90s      |
| Ask window (exposure time)    | 1.6s    | 0.9s     |
| Character move speed          | x1.0    | x1.6     |
| Delay between asks (per char) | 2.5-4s  | 1.2-2.5s |
| Max characters on screen      | 2       | 3        |
| Max simultaneous open windows | 1       | 2        |
| Back-lane spawn share         | 10%     | 35%      |

**Stars:** thresholds are computed from the level's theoretical max score
(every ask hit PERFECT): 1 star = 25%, 2 stars = 45%, 3 stars = 70%.
**1 star is required to unlock the next level.**

**Results screen breakdown** (3 line items, matching the mock's layout):
- Hit points: sum of all hit scores;
- Accuracy bonus: `accuracy% x 10` points;
- Penalties: total whiff deductions (shown as a negative line).

## 8. Fail state

**No mid-level fail.** A level always runs to the timer; scoring below the
1-star threshold means "Retry" on the results screen. No lives in v1.

## 9. Feel, fairness, anti-frustration rules

- Every window is preceded by the 400ms telegraph; nothing pops instantly.
- Windows never open within 500ms of another window *closing* on an adjacent
  spot (prevents impossible double-commits early on).
- **75ms grace:** if the window closed less than 75ms before the click, it
  still counts as a hit (GOOD, not PERFECT).
- Pause: Esc or a pause chip; timer and animations freeze, screen blurs
  behind the pause panel.
- First-time hint overlay on level 1: "Wait for the ring... SLAP!"

## 10. Platform, responsiveness, tech notes

- Web app, single-page, desktop-first 16:9. The 1920x1080 stage scales
  uniformly (CSS transform) with letterboxing, so all mechanics distances
  stay proportional; playable down to ~360px-wide screens (touch = tap to
  strike).
- Rendering: DOM + CSS (characters are CSS-shape builds per the handoff),
  game logic on a requestAnimationFrame loop; no external assets, two Google
  Fonts (Bungee, Fredoka), sounds synthesized via Web Audio.
- Persistence: localStorage (unlocked levels, stars, best scores, last
  equipped whip, mute setting).
- Screens: Main Menu -> Whip Selection -> Gameplay -> Level Results, matching
  the four handoff mockups (Whip Selection reduced to 3 cards, 2 stat bars).

## 11. Out of scope for v1

Combo multipliers, power-ups (Slow-Mo / Double Points / Super Slap), whip
windup, per-whip hit radius and lane-range, the other 4 whip types, whip
shop/currency, avatar editor, lane-switching characters, leaderboards,
Endless mode, lives, more than 4 performers.
