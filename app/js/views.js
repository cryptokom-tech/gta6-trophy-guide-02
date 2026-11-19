// Rendering: the checklist rows, the guide detail pane, the roadmap, the missables
// page and the Next up planner. All text is set with textContent, never innerHTML,
// so trophy names, notes and search text cannot inject markup.
import { ROADMAP_STAGES } from './data.js';
import { applyFilters, displayDescription, displayName, isSpoilerHidden, nextUnearned, plannerOrder } from './filters.js';
import { counterStep, counterValue, earnedCount, isEarned, noteFor } from './store.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function medalDot(grade) {
  return el('span', `medal ${grade}`);
}

export function formatCount(trophy, value) {
  const target = trophy.count;
  if (trophy.countUnit && trophy.countUnit.startsWith('$')) {
    return `$${value.toLocaleString('en-US')} / $${target.toLocaleString('en-US')} ${trophy.countUnit.slice(1).trim()}`;
  }
  return `${value.toLocaleString('en-US')} / ${target.toLocaleString('en-US')} ${trophy.countUnit ?? ''}`.trim();
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

/* ---------------- header ---------------- */

export function renderHeader(trophies, state) {
  const earned = earnedCount(state);
  const count = document.getElementById('overallCount');
  count.replaceChildren(
    document.createTextNode(String(earned)),
    el('small', null, ` / ${trophies.length} earned`),
  );
  const bar = document.getElementById('overallBar');
  bar.setAttribute('aria-valuenow', String(earned));
  document.getElementById('overallFill').style.width = `${(earned / trophies.length) * 100}%`;
  const chips = document.getElementById('gradeChips');
  chips.replaceChildren();
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const total = trophies.filter((t) => t.grade === grade).length;
    const got = trophies.filter((t) => t.grade === grade && isEarned(state, t)).length;
    const chip = el('span', 'grade-chip');
    chip.append(medalDot(grade), document.createTextNode(`${gradeLabel(grade)} ${got}/${total}`));
    chips.append(chip);
  }
  const pill = document.getElementById('missablePill');
  if (pill) pill.textContent = String(trophies.filter((t) => t.missable && !isEarned(state, t)).length);
}

/* ---------------- kind chips ---------------- */

export function renderKindChips(trophies, ui, onPick) {
  const wrap = document.getElementById('kindChips');
  wrap.replaceChildren();
  const kinds = [
    { kind: 'all', label: 'All kinds' },
    { kind: 'story', label: 'Story' },
    { kind: 'collectibles', label: 'Collectibles' },
    { kind: 'activities', label: 'Activities' },
    { kind: 'exploration', label: 'Exploration' },
    { kind: 'crime', label: 'Crime' },
    { kind: 'misc', label: 'Misc' },
    { kind: 'missable', label: 'Missable' },
    { kind: 'online', label: 'Online' },
  ];
  for (const { kind, label } of kinds) {
    const n = kind === 'all' ? trophies.length
      : kind === 'missable' ? trophies.filter((t) => t.missable).length
      : kind === 'online' ? 0
      : trophies.filter((t) => t.kind === kind).length;
    const chip = el('button', 'kind-chip', `${label} `);
    chip.type = 'button';
    chip.setAttribute('aria-pressed', String(ui.kind === kind));
    const num = el('span', 'n', `(${n})`);
    chip.append(num);
    chip.addEventListener('click', () => onPick(kind));
    wrap.append(chip);
  }
}

/* ---------------- checklist ---------------- */

function counterStepper(trophy, state, onBump) {
  const wrap = el('span', 'stepper');
  const minus = el('button', null, '−');
  minus.type = 'button';
  minus.setAttribute('aria-label', `Decrease ${trophy.name} progress`);
  minus.addEventListener('click', (e) => { e.stopPropagation(); onBump(trophy, -counterStep(trophy)); });
  const plus = el('button', null, '+');
  plus.type = 'button';
  plus.setAttribute('aria-label', `Increase ${trophy.name} progress`);
  plus.addEventListener('click', (e) => { e.stopPropagation(); onBump(trophy, counterStep(trophy)); });
  const value = el('span', 'count-num', formatCount(trophy, counterValue(state, trophy) ?? 0));
  wrap.append(minus, value, plus);
  return wrap;
}

export function renderChecklist(trophies, state, ui, callbacks) {
  const list = document.getElementById('trophyList');
  const shown = applyFilters(trophies, state, ui);
  list.replaceChildren();
  if (shown.length === 0) {
    list.append(el('div', 'empty-state', 'No trophies match these filters. Clear the search or pick another kind.'));
    return;
  }
  for (const t of shown) {
    const row = el('div', 'trophy-row');
    if (isEarned(state, t)) row.classList.add('earned');
    if (callbacks.selectedId === t.id) row.classList.add('selected');
    row.setAttribute('role', 'button');
    row.tabIndex = 0;

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'earn-box';
    box.checked = isEarned(state, t);
    box.setAttribute('aria-label', `Mark ${displayName(state, t)} earned`);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => callbacks.onToggleEarned(t));
    row.append(box, medalDot(t.grade));

    const body = el('div');
    const name = el('div', 'trophy-name', displayName(state, t));
    if (t.hidden && !isEarned(state, t)) name.append(el('span', 'hidden-tag', 'Hidden on PSN'));
    body.append(name);
    body.append(el('div', 'trophy-desc', displayDescription(state, t)));

    const meta = el('div', 'trophy-meta');
    meta.append(el('span', `tag grade-${t.grade}`, gradeLabel(t.grade)));
    meta.append(el('span', 'tag', t.kind));
    if (t.missable) meta.append(el('span', 'tag missable', '⚑ Missable'));
    if (t.hidden) meta.append(el('span', 'tag hidden-flag', 'Hidden on PSN'));
    if (t.count != null) {
      const counter = el('span', 'counter-line', 'Progress: ');
      counter.append(counterStepper(t, state, callbacks.onBumpCounter));
      meta.append(counter);
    }
    body.append(meta);
    row.append(body);

    const side = el('div');
    side.append(el('span', 'tag', `#${t.id}`));
    row.append(side);

    row.addEventListener('click', () => callbacks.onSelect(t));
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); callbacks.onSelect(t); }
    });
    list.append(row);
  }
}

/* ---------------- detail pane ---------------- */

export function renderDetail(trophy, state, callbacks) {
  const pane = document.getElementById('detailPane');
  pane.replaceChildren();
  if (!trophy) {
    pane.append(el('p', 'detail-empty', 'Pick a trophy on the left to see its guide, sources and notes.'));
    pane.append(el('p', 'kbd-hint', 'Tip: press / to search, ? for shortcuts.'));
    return;
  }
  const hidden = isSpoilerHidden(state, trophy);
  pane.append(el('h2', null, hidden ? 'Hidden story trophy' : trophy.name));
  pane.append(el('p', 'official', hidden ? 'Hidden story trophy — earn it to reveal.' : `“${trophy.description}”`));

  const meta = el('div', 'trophy-meta');
  meta.append(el('span', `tag grade-${trophy.grade}`, gradeLabel(trophy.grade)));
  meta.append(el('span', 'tag', trophy.kind));
  if (trophy.missable) meta.append(el('span', 'tag missable', '⚑ Missable'));
  if (trophy.hidden) meta.append(el('span', 'tag hidden-flag', 'Hidden on PSN'));
  pane.append(meta);

  if (hidden) {
    const note = el('p', null, 'This story trophy is hidden while spoilers are on. Turn spoilers off in Settings & data — or earn the trophy — to read its guide.');
    note.style.marginTop = '14px';
    pane.append(note);
  } else {
    pane.append(el('h3', null, 'Guide'));
    pane.append(el('p', null, trophy.guide));

    pane.append(el('h3', null, 'Sources'));
    const sources = el('ul', 'sources');
    for (const s of trophy.sources) {
      const li = el('li', null, s.label);
      if (s.url) li.append(el('span', 'src-url', s.url));
      sources.append(li);
    }
    pane.append(sources);

    if (trophy.steps && trophy.steps.length) {
      pane.append(el('h3', null, 'Steps'));
      const ol = el('ol');
      for (const step of trophy.steps) ol.append(el('li', null, step));
      pane.append(ol);
    }

    if (trophy.count != null) {
      const box = el('div', 'counter-box');
      const label = el('strong', null, `Your progress: ${formatCount(trophy, counterValue(state, trophy) ?? 0)}`);
      box.append(label);
      box.append(document.createTextNode(' '));
      box.append(counterStepper(trophy, state, callbacks.onBumpCounter));
      pane.append(box);
    }

    if (trophy.missable) {
      const box = el('div', 'missable-box');
      box.append(el('strong', null, '⚑ Missable — '));
      box.append(document.createTextNode(trophy.missableReason));
      pane.append(box);
    }
  }

  pane.append(el('label', 'notes-label', 'Your notes'));
  const notes = document.createElement('textarea');
  notes.className = 'notes-area';
  notes.placeholder = 'Your own notes for this trophy…';
  notes.value = noteFor(state, trophy);
  notes.addEventListener('input', () => callbacks.onNote(trophy, notes.value));
  pane.append(notes);

  const actions = el('div', 'detail-actions');
  const toggle = el('button', 'btn', isEarned(state, trophy) ? '✓ Earned — undo' : 'Mark earned');
  toggle.type = 'button';
  toggle.addEventListener('click', () => callbacks.onToggleEarned(trophy));
  actions.append(toggle);
  pane.append(actions);
  pane.append(el('p', 'kbd-hint', 'Press Esc to close this guide.'));
}

/* ---------------- roadmap ---------------- */

export function renderRoadmap(trophies, state, onSelect) {
  const wrap = document.getElementById('roadmapStages');
  wrap.replaceChildren();
  const note = el('p', 'filter-note', 'Stage lists name the trophies so you can plan — the checklist still hides story names while spoilers are on.');
  wrap.append(note);
  for (const def of ROADMAP_STAGES) {
    const members = trophies.filter((t) => t.stage === def.stage);
    const done = members.filter((t) => isEarned(state, t)).length;
    const card = el('div', 'stage-card');
    const head = el('div', 'stage-head');
    head.append(el('span', 'stage-num', `Stage ${def.stage}`));
    head.append(el('h3', null, def.title));
    head.append(el('span', 'stage-count', `${done}/${members.length} earned`));
    card.append(head);
    card.append(el('p', null, def.blurb));
    const bar = el('div', 'stage-bar');
    const fill = el('span');
    fill.style.width = `${members.length ? (done / members.length) * 100 : 0}%`;
    bar.append(fill);
    card.append(bar);
    const chips = el('div', 'stage-trophies');
    for (const t of members) {
      const chip = el('button', `stage-trophy${isEarned(state, t) ? ' done' : ''}`, t.name);
      chip.type = 'button';
      chip.title = t.description;
      chip.addEventListener('click', () => onSelect(t));
      chips.append(chip);
    }
    card.append(chips);
    wrap.append(card);
  }
}

/* ---------------- missables ---------------- */

export function renderMissables(trophies, state, onSelect) {
  const wrap = document.getElementById('missablesList');
  wrap.replaceChildren();
  const note = el('p', 'filter-note', 'This page names story trophies — it is a spoiler page by design. ' +
    'Trophies are grouped by roadmap stage, so you can see which ones to grab while you are still in that part of the game.');
  wrap.append(note);
  const missables = trophies.filter((t) => t.missable);
  for (const def of ROADMAP_STAGES) {
    const members = missables.filter((t) => t.stage === def.stage);
    if (!members.length) continue;
    const card = el('div', 'stage-card');
    const head = el('div', 'stage-head');
    head.append(el('span', 'stage-num', `Stage ${def.stage}`));
    head.append(el('h3', null, def.title));
    const done = members.filter((t) => isEarned(state, t)).length;
    head.append(el('span', 'stage-count', `${done}/${members.length} earned`));
    card.append(head);
    const list = el('div', 'trophy-list');
    list.style.marginTop = '12px';
    for (const t of members) {
      const row = el('div', 'trophy-row');
      if (isEarned(state, t)) row.classList.add('earned');
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.className = 'earn-box';
      box.checked = isEarned(state, t);
      box.setAttribute('aria-label', `Mark ${t.name} earned`);
      box.addEventListener('click', (e) => e.stopPropagation());
      box.addEventListener('change', () => onSelect(t, { toggle: true }));
      row.append(box, medalDot(t.grade));
      const body = el('div');
      body.append(el('div', 'trophy-name', t.name));
      body.append(el('div', 'trophy-desc', t.description));
      const reason = el('div', 'missable-box', '');
      reason.style.marginTop = '8px';
      reason.append(el('strong', null, 'Why it is flagged: '));
      reason.append(document.createTextNode(t.missableReason));
      body.append(reason);
      row.append(body);
      row.append(el('span', 'tag', `#${t.id}`));
      row.addEventListener('click', () => onSelect(t));
      list.append(row);
    }
    card.append(list);
    wrap.append(card);
  }
}

/* ---------------- planner ---------------- */

export function renderPlanner(trophies, state, onSelect) {
  const queue = nextUnearned(trophies, state);
  const nextBox = document.getElementById('plannerNext');
  nextBox.replaceChildren();
  if (queue.length === 0) {
    const card = el('div', 'nextup-card');
    card.append(el('h3', null, 'Platinum earned — congratulations!'));
    card.append(el('p', null, 'All 55 trophies are yours. Vice got a price, and you paid it in full.'));
    nextBox.append(card);
  } else {
    const t = queue[0];
    const card = el('div', 'nextup-card');
    card.append(el('p', 'eyebrow', `Next up · Stage ${t.stage} · ${t.missable ? 'Missable — do it now' : 'Roadmap order'}`));
    card.append(el('h3', null, t.name));
    card.append(el('p', null, t.description));
    card.append(el('p', null, t.guide));
    const actions = el('div', 'detail-actions');
    const open = el('button', 'btn', 'Open in checklist');
    open.type = 'button';
    open.addEventListener('click', () => onSelect(t, { goChecklist: true }));
    actions.append(open);
    card.append(actions);
    nextBox.append(card);
  }
  const list = document.getElementById('plannerQueue');
  list.replaceChildren();
  const ordered = plannerOrder(trophies).filter((t) => !isEarned(state, t)).slice(1, 6);
  for (const [i, t] of ordered.entries()) {
    const row = el('div', 'planner-row');
    row.append(el('span', 'rank', `#${i + 2}`));
    row.append(el('span', null, t.name));
    row.append(el('span', 'why', `Stage ${t.stage}${t.missable ? ' · Missable' : ''}`));
    row.addEventListener('click', () => onSelect(t, { goChecklist: true }));
    list.append(row);
  }
}

/* ---------------- settings ---------------- */

export function renderSettings(state) {
  const btn = document.getElementById('spoilerBtn');
  btn.textContent = state.spoiler ? 'Spoilers: ON — hidden' : 'Spoilers: OFF — shown';
  const toggle = document.getElementById('spoilerToggle');
  if (toggle) toggle.checked = state.spoiler;
}
