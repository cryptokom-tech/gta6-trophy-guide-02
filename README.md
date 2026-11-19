# Leonida Platinum II — GTA 6 Trophy Guide & Tracker

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-02.svg)](https://make.fun/bounty/gta6-trophy-guide-02)
[![rank](https://make.fun/badge/gta6-trophy-guide-02/cryptokom-tech/gta6-trophy-guide-02/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-02)
[![reward](https://make.fun/badge/gta6-trophy-guide-02/cryptokom-tech/gta6-trophy-guide-02/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-02)

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI — built for the
[make.fun bounty](https://make.fun/bounty/gta6-trophy-guide-02) paying $250 in real rewards.

## What it is

- **Every trophy, exactly as PlayStation publishes it**: official name, description and grade
  (1 platinum, 2 gold, 6 silver, 46 bronze — 28 of them hidden on PSN), plus a guide in our own words
  and a cited source beside each one.
- **A tracker that saves in your browser**: tick trophies off, watch the 0/55 progress bar climb, step the
  per-trophy counters (250 stunts, 42 Shooting Range challenges, 100 WAiNK locations, …), add notes per trophy.
  Export your progress to JSON and import it back.
- **Filters**: by kind (story, collectibles, activities, exploration, crime, misc, missable), by grade, and
  free-text search. There are no online trophies — all 55 are single-player — and the app says so.
- **Spoiler setting** (on by default): hides the names and descriptions of story trophies until you earn them.
- **Roadmap to the platinum**: five stages in play order — story, stranger strands, collectibles, activities,
  then crime and cleanup — each with its own progress, built only from the official descriptions.
- **Missables**: 26 trophies flagged with the reason each is tied to a story moment or a one-time condition.
  The rule is printed in the app; mission replay is not verified, so the flags are cautious on purpose.
- **Next up planner**: suggests your next unearned trophy by roadmap order, missables first in their stage.
- **Fully offline**: static files under `app/`, no network request at run time, no external fonts, images or
  scripts. No Rockstar logo, artwork or game screenshots — the look is our own light "paper" theme with
  CSS-drawn medal swatches.

## How to run it offline

```sh
node serve.ts
# then open http://localhost:8080
```

Any static file server works too — serve `app/` at its root and open `index.html`. The app fetches only
`data/trophies.json`, a file under `app/`.

## How the guides were written

The game launched on 19 November 2026, so real walkthroughs barely exist. Every guide is written from the
official trophy description alone: what to do, where and how (only where the description pins it down), when
it can be missed, and the count where PSN tracks one. Nothing is copied from another guide, and no specific
location, mission step or NPC detail is invented. Each guide cites its sources:

- **Exophase — GTA VI trophy list** (name, description, grade):
  https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/
- **PSNProfiles — GTA VI trophies** (PSN counts and hidden flags):
  https://psnprofiles.com/trophies/43531-grand-theft-auto-vi
- **Planet GTA 6 — the 28 hidden trophies** (cross-checked with Exophase, PSNProfiles, TrueAchievements):
  https://www.planetgta6.com/en/gta-6-trophies/
- Plus, where it applies, **PowerPyx / GTABase via GTA Zone** for the one reported possibly-missable trophy
  (Positive Mental Attitude), and the honest line "Our advice, from the official description — not yet checked
  in the game" for the how-to itself.

Source addresses are printed as text beside each guide (never as links the app would fetch).

## Layout

- `app/index.html` — the page: header with progress, tabs, filter bar, checklist + detail pane
- `app/css/base.css` — the paper theme
- `app/js/main.js` — boot, tab routing, keyboard shortcuts, `?shot=` staging for screenshots
- `app/js/data.js` — loads `data/trophies.json`; roadmap stages and the kind taxonomy
- `app/js/store.js` — localStorage progress, counters, notes, export/import
- `app/js/filters.js` — kind/grade/search filters and the spoiler rule
- `app/js/views.js` — checklist, detail pane, roadmap, missables, planner, settings
- `app/data/trophies.json` — the 55 official trophies with guides, sources, steps, counts and stages
- `main.ts` — the hand-in program (Node 22, stdlib only): copies `app/` + `screenshots/` to `/output`
  and writes `dossier.json` with the vendored make.fun library
- `screenshots/` — four real renders of the running guide (1280×800 JPEG)

## Handing it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`.
