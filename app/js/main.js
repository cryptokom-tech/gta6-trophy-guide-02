// Boot, tab routing, keyboard shortcuts and the ?shot= staging used only for
// screenshots. The default state (no ?shot=) is clean: 0 earned, spoilers on.
import { loadTrophies } from './data.js';
import { bumpCounter, downloadFile, exportJson, importJson, loadState, saveState, setNote, blankState, toggleEarned } from './store.js';
import { renderChecklist, renderDetail, renderHeader, renderKindChips, renderMissables, renderPlanner, renderRoadmap, renderSettings } from './views.js';

const VIEWS = ['checklist', 'roadmap', 'missables', 'planner', 'settings'];

/** Demo progress seeded by ?shot= for screenshots only — 13 of 55 earned, with
 *  counters part way. Kept in memory; never written to localStorage. */
const SHOT_SEED = {
  earned: [2, 3, 15, 16, 19, 20, 21, 28, 32, 35, 42, 55, 53],
  counts: { 15: 120, 28: 9, 32: 23, 35: 47, 53: 41000, 55: 6 },
};

function shotState(shot) {
  const state = blankState();
  for (const id of SHOT_SEED.earned) state.earned[id] = true;
  state.counts = { ...SHOT_SEED.counts };
  // The roadmap and missables pages name the trophies so they can be planned;
  // the cover and filters shots keep spoilers on to show the hiding at work.
  state.spoiler = shot === 'cover' || shot === 'filters';
  return state;
}

let trophies = [];
let state = loadState();
let demoMode = false;
let selectedId = null;
const ui = { kind: 'all', grade: 'all', search: '', missableOnly: false, hideEarned: false };

function renderAll() {
  renderHeader(trophies, state);
  renderKindChips(trophies, ui, (kind) => { ui.kind = kind; renderAll(); });
  renderChecklist(trophies, state, ui, {
    selectedId,
    onSelect: (t) => { selectedId = t.id; renderAll(); },
    onToggleEarned: (t) => { toggleEarned(state, t); renderAll(); },
    onBumpCounter: (t, d) => { bumpCounter(state, t, d); renderAll(); },
  });
  const selected = trophies.find((t) => t.id === selectedId) ?? null;
  renderDetail(selected, state, {
    onToggleEarned: (t) => { toggleEarned(state, t); renderAll(); },
    onBumpCounter: (t, d) => { bumpCounter(state, t, d); renderAll(); },
    onNote: (t, text) => setNote(state, t, text),
  });
  renderRoadmap(trophies, state, (t) => { selectedId = t.id; showView('checklist'); renderAll(); });
  renderMissables(trophies, state, (t, opts) => {
    if (opts && opts.toggle) toggleEarned(state, t);
    else selectedId = t.id;
    renderAll();
  });
  renderPlanner(trophies, state, (t, opts) => {
    selectedId = t.id;
    if (opts && opts.goChecklist) showView('checklist');
    renderAll();
  });
  renderSettings(state);
}

function showView(name) {
  for (const view of VIEWS) {
    document.getElementById(`view-${view}`).hidden = view !== name;
    const tab = document.getElementById(`tab-${view}`);
    tab.setAttribute('aria-selected', String(view === name));
  }
}

function wireControls() {
  for (const view of VIEWS) {
    document.getElementById(`tab-${view}`).addEventListener('click', () => showView(view));
  }
  document.getElementById('searchBox').addEventListener('input', (e) => {
    ui.search = e.target.value;
    renderChecklist(trophies, state, ui, checklistCallbacks());
  });
  document.getElementById('gradeSelect').addEventListener('change', (e) => {
    ui.grade = e.target.value;
    renderChecklist(trophies, state, ui, checklistCallbacks());
  });
  document.getElementById('missableOnly').addEventListener('change', (e) => {
    ui.missableOnly = e.target.checked;
    renderChecklist(trophies, state, ui, checklistCallbacks());
  });
  document.getElementById('hideEarned').addEventListener('change', (e) => {
    ui.hideEarned = e.target.checked;
    renderChecklist(trophies, state, ui, checklistCallbacks());
  });
  document.getElementById('spoilerToggle').addEventListener('change', (e) => {
    state.spoiler = e.target.checked;
    if (!demoMode) saveState(state);
    renderAll();
  });
  document.getElementById('spoilerBtn').addEventListener('click', () => {
    state.spoiler = !state.spoiler;
    if (!demoMode) saveState(state);
    renderAll();
  });
  document.getElementById('exportBtn').addEventListener('click', () => {
    downloadFile('leonida-platinum-ii-progress.json', exportJson(state));
  });
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imported = importJson(await file.text());
      if (!imported) throw new Error('not a Leonida Platinum II export');
      state = imported;
      if (!demoMode) saveState(state);
      selectedId = null;
      renderAll();
    } catch {
      alert('That file is not a Leonida Platinum II progress export.');
    }
    e.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Reset all progress? Your earned trophies, counters and notes will be cleared.')) return;
    state = blankState();
    if (!demoMode) saveState(state);
    selectedId = null;
    renderAll();
  });
  document.addEventListener('keydown', (e) => {
    const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;
    if (e.key === '/' && !typing) {
      e.preventDefault();
      showView('checklist');
      document.getElementById('searchBox').focus();
    } else if (e.key === '?' && !typing) {
      e.preventDefault();
      showView('settings');
    } else if (e.key === 'Escape') {
      selectedId = null;
      renderAll();
    } else if (!typing && ['1', '2', '3', '4', '5'].includes(e.key)) {
      showView(VIEWS[Number(e.key) - 1]);
    }
  });
}

function checklistCallbacks() {
  return {
    selectedId,
    onSelect: (t) => { selectedId = t.id; renderAll(); },
    onToggleEarned: (t) => { toggleEarned(state, t); renderAll(); },
    onBumpCounter: (t, d) => { bumpCounter(state, t, d); renderAll(); },
  };
}

async function boot() {
  try {
    trophies = await loadTrophies();
  } catch (err) {
    document.getElementById('trophyList').textContent = `Could not load the trophy list: ${err.message}`;
    window.__shotReady = true;
    return;
  }
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot && ['cover', 'roadmap', 'missables', 'filters'].includes(shot)) {
    demoMode = true;
    state = shotState(shot);
    if (shot === 'cover') selectedId = 15; // Cunning Stunts: silver, counted 250, fully sourced, short guide
    if (shot === 'roadmap') showView('roadmap');
    if (shot === 'missables') showView('missables');
    if (shot === 'filters') { ui.kind = 'story'; selectedId = 3; } // an earned story trophy: guide + sources open beside the hidden ones
  }
  wireControls();
  renderAll();
  window.__shotReady = true;
}

boot();
