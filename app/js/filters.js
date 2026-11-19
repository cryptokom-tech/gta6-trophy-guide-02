// Filtering and the spoiler rule: which trophies the list shows, and what a hidden
// story trophy looks like until it is earned.
import { isEarned } from './store.js';

export const HIDDEN_PLACEHOLDER_NAME = 'Hidden story trophy';
export const HIDDEN_PLACEHOLDER_DESC = 'Hidden story trophy — earn it to reveal.';

/** A trophy's name is hidden while the spoiler setting is on, it is a story trophy,
 *  and the player has not earned it yet. Earned trophies always show their real name. */
export function isSpoilerHidden(state, trophy) {
  return state.spoiler && trophy.kind === 'story' && !isEarned(state, trophy);
}

export function displayName(state, trophy) {
  return isSpoilerHidden(state, trophy) ? HIDDEN_PLACEHOLDER_NAME : trophy.name;
}

export function displayDescription(state, trophy) {
  return isSpoilerHidden(state, trophy) ? HIDDEN_PLACEHOLDER_DESC : trophy.description;
}

/**
 * Apply the checklist filters. `ui` carries the current filter controls:
 * kind (a kind name, "missable", "online" or "all"), grade, search text,
 * missableOnly and hideEarned. Returns the trophies in list order.
 */
export function applyFilters(trophies, state, ui) {
  const query = (ui.search || '').trim().toLowerCase();
  return trophies.filter((t) => {
    if (ui.kind === 'online') return false; // the list has no online trophies
    if (ui.kind === 'missable') {
      if (!t.missable) return false;
    } else if (ui.kind && ui.kind !== 'all' && t.kind !== ui.kind) {
      return false;
    }
    if (ui.grade && ui.grade !== 'all' && t.grade !== ui.grade) return false;
    if (ui.missableOnly && !t.missable) return false;
    if (ui.hideEarned && isEarned(state, t)) return false;
    if (query) {
      const hay = `${t.name} ${t.description} ${t.guide} ${t.kind}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

/** Roadmap order for the Next up planner: stage first, missables first in a stage,
 *  then the list order. The platinum always comes last. */
export function plannerOrder(trophies) {
  return [...trophies].sort((a, b) => {
    if (a.stage !== b.stage) return a.stage - b.stage;
    if (a.missable !== b.missable) return a.missable ? -1 : 1;
    return a.id - b.id;
  });
}

export function nextUnearned(trophies, state) {
  return plannerOrder(trophies).filter((t) => !isEarned(state, t));
}
