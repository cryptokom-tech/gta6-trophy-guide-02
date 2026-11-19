// Saved progress: earned trophies, per-trophy counters and notes, and the spoiler setting.
// Kept in localStorage only; nothing is sent anywhere. A ?shot= demo never touches this.
export const STORAGE_KEY = 'leonida-platinum-ii-v1';

export function blankState() {
  return { earned: {}, counts: {}, notes: {}, spoiler: true };
}

/** Read the saved state, tolerating a missing or corrupt entry. */
export function loadState() {
  const state = blankState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return state;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if (parsed.earned && typeof parsed.earned === 'object') state.earned = parsed.earned;
      if (parsed.counts && typeof parsed.counts === 'object') state.counts = parsed.counts;
      if (parsed.notes && typeof parsed.notes === 'object') state.notes = parsed.notes;
      if (typeof parsed.spoiler === 'boolean') state.spoiler = parsed.spoiler;
    }
  } catch {
    // A corrupt save starts clean rather than breaking the guide.
  }
  return state;
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable (private mode): the guide still works for the session.
  }
}

export function earnedCount(state) {
  return Object.values(state.earned).filter(Boolean).length;
}

export function isEarned(state, trophy) {
  return Boolean(state.earned[trophy.id]);
}

export function toggleEarned(state, trophy) {
  if (isEarned(state, trophy)) delete state.earned[trophy.id];
  else state.earned[trophy.id] = true;
  saveState(state);
}

export function setEarned(state, trophy, value) {
  if (value) state.earned[trophy.id] = true;
  else delete state.earned[trophy.id];
  saveState(state);
}

export function counterValue(state, trophy) {
  if (trophy.count == null) return null;
  return Math.max(0, Math.min(trophy.count, Number(state.counts[trophy.id]) || 0));
}

export function setCounter(state, trophy, value) {
  if (trophy.count == null) return;
  const clamped = Math.max(0, Math.min(trophy.count, Math.floor(value)));
  if (clamped === 0) delete state.counts[trophy.id];
  else state.counts[trophy.id] = clamped;
  saveState(state);
}

export function bumpCounter(state, trophy, delta) {
  setCounter(state, trophy, (counterValue(state, trophy) ?? 0) + delta);
}

export function noteFor(state, trophy) {
  return state.notes[trophy.id] ?? '';
}

export function setNote(state, trophy, text) {
  if (text.trim()) state.notes[trophy.id] = text;
  else delete state.notes[trophy.id];
  saveState(state);
}

/** Step size for the counter buttons: small counts tick by 1, big ones faster. */
export function counterStep(trophy) {
  if (trophy.count == null) return 1;
  if (trophy.count >= 10000) return 1000;
  if (trophy.count >= 100) return 10;
  return 1;
}

/** Serialise the whole state for the export download. */
export function exportJson(state) {
  return JSON.stringify({ app: 'leonida-platinum-ii', version: 1, exportedAt: new Date().toISOString(), ...state }, null, 2);
}

/** Parse an imported file back into a state; returns null when the file is not ours. */
export function importJson(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') return null;
  const state = blankState();
  if (parsed.earned && typeof parsed.earned === 'object') state.earned = parsed.earned;
  if (parsed.counts && typeof parsed.counts === 'object') state.counts = parsed.counts;
  if (parsed.notes && typeof parsed.notes === 'object') state.notes = parsed.notes;
  if (typeof parsed.spoiler === 'boolean') state.spoiler = parsed.spoiler;
  return state;
}

/** Download a text file from the browser (used by Export). */
export function downloadFile(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
